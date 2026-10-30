import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Send,
  Sparkles,
  LogOut,
  ArrowLeft,
  MessagesSquare,
  UserPlus,
  Check,
  X as XIcon,
  Mail,
  UserMinus,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import { groupService } from '@/services/groupService';
import { getSocket } from '@/services/socket';
import { randomId } from '@/utils/async';
import type { GroupInvitation, GroupMember, GroupMessage, StudyGroup } from '@/types';

const POLL_INTERVAL_MS = 3000;

export function StudyGroups() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);

  const refreshGroups = async () => {
    try {
      const list = await groupService.listGroups();
      setGroups(list);
      if (activeGroup) {
        const updated = list.find((g) => g.id === activeGroup.id);
        if (updated) setActiveGroup(updated);
      }
    } catch {
      // silent — chat view keeps working even if the list refresh fails
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    refreshGroups();
    groupService.listMyInvitations().then(setInvitations).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time: new invitations, membership changes, and invite responses arrive over the
  // socket connection established at login (see AuthContext) instead of polling.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onInvitationNew = (invitation: GroupInvitation) => {
      setInvitations((prev) => [invitation, ...prev]);
      showToast(`${invitation.invitedByName} invited you to join "${invitation.groupName}".`, 'info');
    };

    const onGroupUpdated = ({ group }: { group: StudyGroup; members: GroupMember[] }) => {
      setGroups((prev) => {
        const exists = prev.some((g) => g.id === group.id);
        return exists ? prev.map((g) => (g.id === group.id ? { ...group, isMember: true } : g)) : [group, ...prev];
      });
      setActiveGroup((prev) => (prev && prev.id === group.id ? { ...group, isMember: true } : prev));
    };

    const onGroupRemoved = ({ groupId, groupName }: { groupId: string; groupName: string }) => {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setActiveGroup((prev) => {
        if (prev?.id === groupId) {
          showToast(`You were removed from ${groupName}.`, 'info');
          return null;
        }
        return prev;
      });
    };

    const onInvitationResponded = (payload: GroupInvitation & { respondedByName: string }) => {
      showToast(
        payload.status === 'accepted'
          ? `${payload.respondedByName} accepted your invitation to ${payload.groupName}.`
          : `${payload.respondedByName} declined your invitation to ${payload.groupName}.`,
        payload.status === 'accepted' ? 'success' : 'info',
      );
    };

    socket.on('invitation:new', onInvitationNew);
    socket.on('group:updated', onGroupUpdated);
    socket.on('group:removed', onGroupRemoved);
    socket.on('invitation:responded', onInvitationResponded);

    return () => {
      socket.off('invitation:new', onInvitationNew);
      socket.off('group:updated', onGroupUpdated);
      socket.off('group:removed', onGroupRemoved);
      socket.off('invitation:responded', onInvitationResponded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcceptInvitation = async (invitation: GroupInvitation) => {
    try {
      const group = await groupService.acceptInvitation(invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      if (group) {
        setGroups((prev) =>
          prev.some((g) => g.id === group.id) ? prev.map((g) => (g.id === group.id ? group : g)) : [group, ...prev],
        );
      }
      showToast(`Joined ${invitation.groupName}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not accept this invitation.', 'error');
    }
  };

  const handleRejectInvitation = async (invitation: GroupInvitation) => {
    try {
      await groupService.rejectInvitation(invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not decline this invitation.', 'error');
    }
  };

  const handleLeave = async (group: StudyGroup) => {
    try {
      await groupService.leaveGroup(group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      setActiveGroup(null);
      showToast(`Left ${group.name}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not leave this group.', 'error');
    }
  };

  if (activeGroup) {
    return (
      <GroupChat
        group={activeGroup}
        onBack={() => setActiveGroup(null)}
        onLeave={() => handleLeave(activeGroup)}
        currentUserId={user?.id ?? ''}
      />
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Study Groups"
          subtitle="Create or join a group and study together with AI help on hand."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create Group
            </Button>
          }
        />

        {invitations.length > 0 && (
          <PendingInvitations
            invitations={invitations}
            onAccept={handleAcceptInvitation}
            onReject={handleRejectInvitation}
          />
        )}

        {loadingGroups ? (
          <p className="text-sm text-ink-400">Loading groups…</p>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No study groups yet"
            description="Create the first group for your exam and invite others to join."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> Create Group
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card hover padding="lg" className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">
                        {group.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{group.examName}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="primary">{group.topic}</Badge>
                    <Badge tone="neutral">
                      <Users size={11} /> {group.memberCount}
                    </Badge>
                  </div>
                  <div className="mt-auto pt-4">
                    <Button fullWidth onClick={() => setActiveGroup(group)}>
                      <MessagesSquare size={16} /> Open Chat
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => {
          setGroups((prev) => [group, ...prev]);
          setCreateOpen(false);
          setActiveGroup(group);
        }}
      />
    </AppLayout>
  );
}

function CreateGroupModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (group: StudyGroup) => void;
}) {
  const { showToast } = useToast();
  const [examName, setExamName] = useState('');
  const [topic, setTopic] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const canSubmit = examName.trim() && topic.trim() && name.trim();

  const handleCreate = async () => {
    if (!canSubmit) return;
    setCreating(true);
    try {
      const group = await groupService.createGroup({
        examName: examName.trim(),
        topic: topic.trim(),
        name: name.trim(),
      });
      setExamName('');
      setTopic('');
      setName('');
      onCreated(group);
      showToast('Study group created.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create the group.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a study group" size="sm">
      <div className="space-y-4">
        <Input
          label="Exam name"
          placeholder="e.g. NEET 2026"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          required
        />
        <Input
          label="Topic"
          placeholder="e.g. Organic Chemistry"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <Input
          label="Group name"
          placeholder="e.g. Chem Warriors"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button fullWidth onClick={handleCreate} loading={creating} disabled={!canSubmit}>
          Create Group
        </Button>
      </div>
    </Modal>
  );
}

function PendingInvitations({
  invitations,
  onAccept,
  onReject,
}: {
  invitations: GroupInvitation[];
  onAccept: (invitation: GroupInvitation) => void;
  onReject: (invitation: GroupInvitation) => void;
}) {
  return (
    <Card padding="lg" className="mb-6 border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/10">
      <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
        <Mail size={16} /> Pending invitations ({invitations.length})
      </h3>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {invitations.map((invitation) => (
            <motion.li
              key={invitation.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900"
            >
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{invitation.groupName}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">Invited by {invitation.invitedByName}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onAccept(invitation)}>
                  <Check size={14} /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(invitation)}>
                  <XIcon size={14} /> Decline
                </Button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}

function GroupChat({
  group,
  onBack,
  onLeave,
  currentUserId,
}: {
  group: StudyGroup;
  onBack: () => void;
  onLeave: () => void;
  currentUserId: string;
}) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [askingAI, setAskingAI] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | undefined>(undefined);
  const isOwner = group.createdBy === currentUserId;

  const refreshMembers = () => {
    groupService.getMembers(group.id).then(setMembers).catch(() => {});
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onGroupUpdated = ({ group: updated, members: m }: { group: StudyGroup; members: GroupMember[] }) => {
      if (updated.id === group.id) setMembers(m);
    };
    const onGroupRemoved = ({ groupId }: { groupId: string }) => {
      if (groupId === group.id) onBack();
    };

    socket.on('group:updated', onGroupUpdated);
    socket.on('group:removed', onGroupRemoved);
    return () => {
      socket.off('group:updated', onGroupUpdated);
      socket.off('group:removed', onGroupRemoved);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  const handleRemoveMember = async (member: GroupMember) => {
    try {
      await groupService.removeMember(group.id, member.id);
      refreshMembers();
      showToast(`Removed ${member.name} from the group.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not remove this member.', 'error');
    }
  };

  const fetchNewMessages = async () => {
    try {
      const incoming = await groupService.getMessages(group.id, lastTimestampRef.current);
      if (incoming.length === 0) return;
      lastTimestampRef.current = incoming[incoming.length - 1].createdAt;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const merged = [...prev, ...incoming.filter((m) => !existingIds.has(m.id))];
        return merged;
      });
    } catch {
      // silent — polling retries on the next interval
    }
  };

  useEffect(() => {
    setMessages([]);
    lastTimestampRef.current = undefined;
    refreshMembers();
    fetchNewMessages();
    const interval = setInterval(fetchNewMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const message = await groupService.sendMessage(group.id, text);
      setMessages((prev) => [...prev, message]);
      lastTimestampRef.current = message.createdAt;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleAskAI = async () => {
    const question = input.trim();
    if (!question || askingAI) return;
    setAskingAI(true);
    setInput('');
    try {
      const { userMessage, aiMessage } = await groupService.askAI(group.id, question);
      setMessages((prev) => [...prev, userMessage, aiMessage]);
      lastTimestampRef.current = aiMessage.createdAt;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'The AI could not answer that.', 'error');
    } finally {
      setAskingAI(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-ink-50"
          >
            <ArrowLeft size={16} /> All groups
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus size={14} /> Invite
            </Button>
            <Button variant="ghost" size="sm" onClick={onLeave}>
              <LogOut size={14} /> Leave group
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card padding="none" className="flex h-[600px] flex-col">
              <div className="flex items-center justify-between border-b border-ink-200 p-4 dark:border-ink-800">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{group.name}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {group.examName} · {group.topic}
                  </p>
                </div>
                <button onClick={() => setShowMembers((s) => !s)} className="lg:hidden">
                  <Badge tone="neutral">
                    <Users size={11} /> {members.length}
                  </Badge>
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-ink-400">No messages yet. Say hello to your group.</p>
                )}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} />
                ))}
              </div>

              <div className="border-t border-ink-200 p-4 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message your group, or ask the AI…"
                    className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAskAI}
                    loading={askingAI}
                    disabled={!input.trim() || sending}
                    className="shrink-0"
                  >
                    <Sparkles size={16} /> Ask AI
                  </Button>
                  <Button
                    onClick={handleSend}
                    loading={sending}
                    disabled={!input.trim() || askingAI}
                    className="shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className={`${showMembers ? 'block' : 'hidden'} space-y-5 lg:block`}>
            <Card padding="lg">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
                <Users size={16} /> Members ({members.length})
              </h3>
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 text-sm text-ink-700 dark:text-ink-200">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                        {m.name.slice(0, 1).toUpperCase()}
                      </span>
                      {m.name}
                      {m.id === group.createdBy && <Badge tone="neutral">Owner</Badge>}
                    </span>
                    {isOwner && m.id !== group.createdBy && (
                      <button
                        onClick={() => handleRemoveMember(m)}
                        aria-label={`Remove ${m.name}`}
                        className="text-ink-400 transition hover:text-error-500"
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
            <Card
              padding="lg"
              className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30"
            >
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
                <Sparkles size={14} /> Ask the AI
              </h3>
              <p className="text-sm text-ink-600 dark:text-ink-300">
                Type your question and press "Ask AI" — Nova answers using this group's exam and topic as context,
                visible to everyone.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} groupId={group.id} />
    </AppLayout>
  );
}

function InviteMemberModal({ open, onClose, groupId }: { open: boolean; onClose: () => void; groupId: string }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setInviting(true);
    try {
      await groupService.inviteMember(groupId, trimmed);
      showToast(`Invitation sent to ${trimmed}.`);
      setEmail('');
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send this invitation.', 'error');
    } finally {
      setInviting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite a member" size="sm">
      <div className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          leftIcon={<Mail size={16} />}
          hint="They must already have a Cadence account."
          required
        />
        <Button fullWidth onClick={handleInvite} loading={inviting} disabled={!email.trim()}>
          <UserPlus size={16} /> Send Invitation
        </Button>
      </div>
    </Modal>
  );
}

function MessageBubble({ message, isOwn }: { message: GroupMessage; isOwn: boolean }) {
  const isAI = message.role === 'ai';
  return (
    <motion.div
      key={message.id ?? randomId('m')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isOwn && !isAI ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
          isAI ? 'bg-gradient-to-br from-primary-600 to-accent-500' : 'bg-primary-600'
        }`}
      >
        {isAI ? <Sparkles size={14} /> : message.senderName.slice(0, 1).toUpperCase()}
      </div>
      <div className={`max-w-[80%]`}>
        {!isOwn && <p className="mb-1 px-1 text-xs font-medium text-ink-400">{message.senderName}</p>}
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isAI
              ? 'rounded-bl-md border border-primary-200 bg-primary-50 text-ink-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-ink-100'
              : isOwn
                ? 'rounded-br-md bg-primary-600 text-white'
                : 'rounded-bl-md bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
          }`}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}
