import { Router } from 'express';
import { groupStore, groupMessageStore, type StoredGroup } from '../lib/groups.js';
import { groupInvitationStore } from '../lib/groupInvitations.js';
import { userStore } from '../lib/users.js';
import { generateTutorReply, parseTutorReply, GeminiError } from '../lib/gemini.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { emitToUser, emitToUsers } from '../lib/socket.js';

export const groupsRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function summarize(group: StoredGroup, userId: string) {
  return {
    id: group.id,
    examName: group.examName,
    topic: group.topic,
    name: group.name,
    createdBy: group.createdBy,
    memberCount: group.memberIds.length,
    isMember: group.memberIds.includes(userId),
    createdAt: group.createdAt,
  };
}

async function requireMembership(groupId: string, userId: string): Promise<StoredGroup | null> {
  const group = await groupStore.findById(groupId);
  if (!group || !group.memberIds.includes(userId)) return null;
  return group;
}

async function resolveMembers(group: StoredGroup) {
  return Promise.all(
    group.memberIds.map(async (id) => {
      const user = await userStore.findById(id);
      return user ? { id: user.id, name: user.full_name } : { id, name: 'Unknown member' };
    }),
  );
}

// Notifies every current member so their group list / member sidebar update without a reload.
async function broadcastGroupUpdate(group: StoredGroup): Promise<void> {
  const members = await resolveMembers(group);
  emitToUsers(group.memberIds, 'group:updated', {
    group: { ...summarize(group, group.createdBy), isMember: true },
    members,
  });
}

groupsRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const groups = await groupStore.list();
  const mine = groups.filter((g) => g.memberIds.includes(req.userId!));
  res.json({ data: { groups: mine.map((g) => summarize(g, req.userId!)) } });
});

groupsRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { examName, topic, name } = req.body ?? {};
  if (!examName || typeof examName !== 'string' || !examName.trim()) {
    res.status(400).json({ error: { message: 'Exam name is required.' } });
    return;
  }
  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    res.status(400).json({ error: { message: 'Topic is required.' } });
    return;
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: { message: 'Group name is required.' } });
    return;
  }

  const group = await groupStore.create({
    examName: examName.trim(),
    topic: topic.trim(),
    name: name.trim(),
    createdBy: req.userId!,
  });
  res.json({ data: { group: summarize(group, req.userId!) } });
});

groupsRouter.post('/invite', requireAuth, async (req: AuthedRequest, res) => {
  const { groupId, email } = req.body ?? {};

  if (!groupId || typeof groupId !== 'string') {
    res.status(400).json({ error: { message: 'A group is required.' } });
    return;
  }
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    res.status(400).json({ error: { message: 'A valid email address is required.' } });
    return;
  }

  const group = await requireMembership(groupId, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group before inviting others.' } });
    return;
  }

  const invitedUser = await userStore.findByEmail(email.trim().toLowerCase());
  if (!invitedUser) {
    res.status(404).json({ error: { message: 'No account exists for that email.' } });
    return;
  }
  if (invitedUser.id === req.userId) {
    res.status(400).json({ error: { message: "You can't invite yourself." } });
    return;
  }
  if (group.memberIds.includes(invitedUser.id)) {
    res.status(400).json({ error: { message: 'This user is already a member.' } });
    return;
  }
  const existing = await groupInvitationStore.findPending(groupId, invitedUser.id);
  if (existing) {
    res.status(409).json({ error: { message: 'An invitation is already pending for this user.' } });
    return;
  }

  const inviter = await userStore.findById(req.userId!);
  const invitation = await groupInvitationStore.create({
    groupId: group.id,
    groupName: group.name,
    invitedUserId: invitedUser.id,
    invitedEmail: invitedUser.email,
    invitedByUserId: req.userId!,
    invitedByName: inviter?.full_name ?? 'A member',
  });

  emitToUser(invitedUser.id, 'invitation:new', invitation);
  res.json({ data: { invitation } });
});

groupsRouter.get('/invitations', requireAuth, async (req: AuthedRequest, res) => {
  const groupId = typeof req.query.groupId === 'string' ? req.query.groupId : undefined;

  if (groupId) {
    const group = await requireMembership(groupId, req.userId!);
    if (!group) {
      res.status(403).json({ error: { message: 'Join this group to view its invitations.' } });
      return;
    }
    const invitations = await groupInvitationStore.listForGroup(groupId);
    res.json({ data: { invitations } });
    return;
  }

  const invitations = await groupInvitationStore.listForUser(req.userId!, 'pending');
  res.json({ data: { invitations } });
});

groupsRouter.post('/accept', requireAuth, async (req: AuthedRequest, res) => {
  const { invitationId } = req.body ?? {};
  if (!invitationId || typeof invitationId !== 'string') {
    res.status(400).json({ error: { message: 'An invitation is required.' } });
    return;
  }

  const invitation = await groupInvitationStore.findById(invitationId);
  if (!invitation || invitation.invitedUserId !== req.userId || invitation.status !== 'pending') {
    res.status(404).json({ error: { message: 'This invitation is no longer available.' } });
    return;
  }

  const responded = await groupInvitationStore.respond(invitationId, 'accepted');
  if (!responded) {
    res.status(409).json({ error: { message: 'This invitation was already responded to.' } });
    return;
  }

  const group = await groupStore.addMember(invitation.groupId, req.userId!);
  if (group) await broadcastGroupUpdate(group);
  emitToUser(invitation.invitedByUserId, 'invitation:responded', {
    ...responded,
    respondedByName: (await userStore.findById(req.userId!))?.full_name ?? 'A member',
  });

  res.json({ data: { group: group ? summarize(group, req.userId!) : null, invitation: responded } });
});

groupsRouter.post('/reject', requireAuth, async (req: AuthedRequest, res) => {
  const { invitationId } = req.body ?? {};
  if (!invitationId || typeof invitationId !== 'string') {
    res.status(400).json({ error: { message: 'An invitation is required.' } });
    return;
  }

  const invitation = await groupInvitationStore.findById(invitationId);
  if (!invitation || invitation.invitedUserId !== req.userId || invitation.status !== 'pending') {
    res.status(404).json({ error: { message: 'This invitation is no longer available.' } });
    return;
  }

  const responded = await groupInvitationStore.respond(invitationId, 'rejected');
  if (!responded) {
    res.status(409).json({ error: { message: 'This invitation was already responded to.' } });
    return;
  }

  emitToUser(invitation.invitedByUserId, 'invitation:responded', {
    ...responded,
    respondedByName: (await userStore.findById(req.userId!))?.full_name ?? 'A member',
  });
  res.json({ data: { invitation: responded } });
});

groupsRouter.get('/members', requireAuth, async (req: AuthedRequest, res) => {
  const groupId = typeof req.query.groupId === 'string' ? req.query.groupId : undefined;
  if (!groupId) {
    res.status(400).json({ error: { message: 'A group is required.' } });
    return;
  }
  const group = await requireMembership(groupId, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group to view its members.' } });
    return;
  }
  const members = await resolveMembers(group);
  res.json({ data: { members } });
});

groupsRouter.post('/remove-member', requireAuth, async (req: AuthedRequest, res) => {
  const { groupId, userId } = req.body ?? {};
  if (!groupId || typeof groupId !== 'string' || !userId || typeof userId !== 'string') {
    res.status(400).json({ error: { message: 'A group and member are required.' } });
    return;
  }
  const group = await groupStore.findById(groupId);
  if (!group) {
    res.status(404).json({ error: { message: 'Group not found.' } });
    return;
  }
  if (group.createdBy !== req.userId) {
    res.status(403).json({ error: { message: 'Only the group owner can remove members.' } });
    return;
  }
  if (userId === group.createdBy) {
    res.status(400).json({ error: { message: 'The group owner cannot be removed.' } });
    return;
  }

  const updated = await groupStore.removeMember(groupId, userId);
  if (updated) await broadcastGroupUpdate(updated);
  emitToUser(userId, 'group:removed', { groupId, groupName: group.name });

  res.json({ data: { group: updated ? summarize(updated, req.userId!) : null } });
});

groupsRouter.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const group = await requireMembership(req.params.id, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group before viewing it.' } });
    return;
  }
  const members = await resolveMembers(group);
  res.json({ data: { group: summarize(group, req.userId!), members } });
});

groupsRouter.post('/:id/leave', requireAuth, async (req: AuthedRequest, res) => {
  const group = await groupStore.findById(req.params.id);
  if (!group) {
    res.status(404).json({ error: { message: 'Group not found.' } });
    return;
  }
  const updated = await groupStore.removeMember(req.params.id, req.userId!);
  if (updated) await broadcastGroupUpdate(updated);
  res.json({ data: { group: summarize(updated!, req.userId!) } });
});

groupsRouter.get('/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
  const group = await requireMembership(req.params.id, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group to view its chat.' } });
    return;
  }
  const after = typeof req.query.after === 'string' ? req.query.after : undefined;
  const messages = await groupMessageStore.listSince(req.params.id, after);
  res.json({ data: { messages } });
});

groupsRouter.post('/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
  const group = await requireMembership(req.params.id, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group to send messages.' } });
    return;
  }
  const { content } = req.body ?? {};
  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: { message: 'Message content is required.' } });
    return;
  }
  const sender = await userStore.findById(req.userId!);
  const message = await groupMessageStore.create({
    groupId: group.id,
    senderId: req.userId!,
    senderName: sender?.full_name ?? 'Member',
    role: 'user',
    content: content.trim(),
  });
  res.json({ data: { message } });
});

groupsRouter.post('/:id/ask-ai', requireAuth, async (req: AuthedRequest, res) => {
  const group = await requireMembership(req.params.id, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group to ask the AI.' } });
    return;
  }
  const { question } = req.body ?? {};
  if (!question || typeof question !== 'string' || !question.trim()) {
    res.status(400).json({ error: { message: 'A question is required.' } });
    return;
  }

  const sender = await userStore.findById(req.userId!);
  const userMessage = await groupMessageStore.create({
    groupId: group.id,
    senderId: req.userId!,
    senderName: sender?.full_name ?? 'Member',
    role: 'user',
    content: question.trim(),
  });

  try {
    const contextualized = `This question comes from a study group preparing for "${group.examName}", focused on the topic "${group.topic}". The student asks: ${question.trim()}`;
    const raw = await generateTutorReply([], contextualized);
    const { content } = parseTutorReply(raw);
    const aiMessage = await groupMessageStore.create({
      groupId: group.id,
      senderId: 'ai',
      senderName: 'Nova AI',
      role: 'ai',
      content,
    });
    res.json({ data: { userMessage, aiMessage } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Group AI reply failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong reaching the AI. Please try again.' } });
  }
});
