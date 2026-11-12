import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  Sparkles,
  Volume2,
  Square,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  FileText,
  Paperclip,
  Camera,
  PanelLeft,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConnectGeminiPrompt } from '@/components/ui/ConnectGeminiPrompt';
import { userApiKeyService } from '@/services/userApiKeyService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { tutorService, SUGGESTED_PROMPTS } from '@/services/tutorService';
import { randomId } from '@/utils/async';
import type { ChatMessage, Conversation } from '@/types';

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  content:
    "Hi! I'm Nova, your AI study tutor. Ask me anything, upload a document, or snap a photo of something you want explained.",
  timestamp: new Date().toISOString(),
};

const ATTACHMENT_ACCEPT =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp';

export function AITutor() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [geminiConnected, setGeminiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    userApiKeyService.getGeminiStatus()
      .then((s) => setGeminiConnected(s.connected || Boolean(s.siteFallbackAvailable)))
      .catch(() => setGeminiConnected(true));
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    tutorService
      .listConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations(list);
        setConversationsLoading(false);
        if (list.length > 0) void openConversation(list[0].id);
      })
      .catch(() => {
        if (!cancelled) setConversationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, messagesLoading]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  const openConversation = async (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    setMessages([]);
    setMessagesLoading(true);
    try {
      const history = await tutorService.getMessages(id);
      setMessages(history.length > 0 ? [WELCOME, ...history] : [WELCOME]);
    } catch {
      setMessages([WELCOME]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([WELCOME]);
    setSidebarOpen(false);
    clearPendingFile();
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPendingPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  };

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    clearPendingFile();
    setPendingFile(file);
    if (file.type.startsWith('image/')) setPendingPreviewUrl(URL.createObjectURL(file));
    setAttachMenuOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    const wasActive = id === activeId;
    setConversations((cs) => cs.filter((c) => c.id !== id));
    try {
      await tutorService.deleteConversation(id);
    } catch {
      // best-effort — the row is already gone from the list
    }
    if (wasActive) startNewChat();
  };

  const handleRenameConversation = async (id: string, title: string) => {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, title } : c)));
    try {
      await tutorService.renameConversation(id, title);
    } catch {
      // best-effort
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !pendingFile) || loading) return;

    const fileToSend = pendingFile;
    const userMsg: ChatMessage = {
      id: randomId('msg'),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      attachmentName: fileToSend?.name,
      attachmentPreviewUrl: pendingPreviewUrl ?? undefined,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setLoading(true);

    try {
      let conversationId = activeId;
      if (!conversationId) {
        const conversation = await tutorService.createConversation();
        conversationId = conversation.id;
        setActiveId(conversation.id);
        setConversations((cs) => [conversation, ...cs]);
      }

      const { reply, title } = await tutorService.sendMessage(conversationId, trimmed, fileToSend);
      setMessages((m) => [...m, reply]);

      const finalConversationId = conversationId;
      setConversations((cs) => {
        const next = cs.map((c) =>
          c.id === finalConversationId
            ? { ...c, title: title ?? c.title, preview: reply.content.slice(0, 80), updatedAt: new Date().toISOString() }
            : c,
        );
        const idx = next.findIndex((c) => c.id === finalConversationId);
        if (idx > 0) {
          const [item] = next.splice(idx, 1);
          next.unshift(item);
        }
        return next;
      });
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: randomId('msg'),
          role: 'ai',
          content: err instanceof Error ? err.message : 'Something went wrong.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setInput('Voice input not supported in this browser.');
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const activeTitle = activeId ? (conversations.find((c) => c.id === activeId)?.title ?? 'Chat') : 'New chat';

  const sidebarProps = {
    conversations,
    activeId,
    loading: conversationsLoading,
    onSelect: openConversation,
    onNew: startNewChat,
    onDelete: handleDeleteConversation,
    onRename: handleRenameConversation,
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-6.5rem)] flex-col p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="AI Tutor"
          subtitle="Ask anything. Get explanations tuned to your level."
          action={
            <Badge tone="primary">
              <Sparkles size={12} /> AI-powered
            </Badge>
          }
        />

        {geminiConnected === false && (
          <div className="mb-4">
            <ConnectGeminiPrompt feature="the AI Study Tutor" />
          </div>
        )}

        <Card padding="none" className="flex min-h-0 flex-1 overflow-hidden">
          {/* Desktop chat history sidebar */}
          <div className="hidden w-72 shrink-0 border-r border-ink-200 dark:border-ink-800 lg:block">
            <ConversationSidebar {...sidebarProps} />
          </div>

          {/* Mobile chat history drawer */}
          <AnimatePresence>
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: -288 }}
                  animate={{ x: 0 }}
                  exit={{ x: -288 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute inset-y-0 left-0 w-72 bg-white shadow-card dark:bg-ink-900"
                >
                  <ConversationSidebar {...sidebarProps} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Chat column */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-3 dark:border-ink-800 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Chat history"
                className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <PanelLeft size={18} />
              </button>
              <span className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{activeTitle}</span>
              <button
                onClick={startNewChat}
                aria-label="New chat"
                className="ml-auto rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <Plus size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-400">
                  <Loader2 size={16} className="animate-spin" /> Loading chat…
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} onSpeak={() => speak(msg.content)} speaking={speaking} />
                ))
              )}
              {loading && <TypingBubble />}
            </div>

            {/* Composer */}
            <div className="border-t border-ink-200 p-4 dark:border-ink-800">
              {messages.length <= 1 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-primary-900/40"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {pendingFile && (
                <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-xs dark:border-ink-700 dark:bg-ink-800">
                  {pendingPreviewUrl ? (
                    <img src={pendingPreviewUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <FileText size={14} className="text-ink-500" />
                  )}
                  <span className="max-w-[180px] truncate font-medium text-ink-700 dark:text-ink-200">
                    {pendingFile.name}
                  </span>
                  <button
                    onClick={clearPendingFile}
                    aria-label="Remove attachment"
                    className="text-ink-400 hover:text-error-600"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ATTACHMENT_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    handleFileSelected(e.target.files?.[0] ?? null);
                    e.target.value = '';
                  }}
                />

                <div className="relative">
                  <button
                    onClick={() => setAttachMenuOpen((v) => !v)}
                    aria-label="Attach a file or photo"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                      attachMenuOpen
                        ? 'border-primary-300 bg-primary-50 text-primary-600 dark:border-primary-700 dark:bg-primary-900/30'
                        : 'border-ink-200 text-ink-500 hover:bg-ink-100 dark:border-ink-700 dark:hover:bg-ink-800'
                    }`}
                  >
                    <Paperclip size={18} />
                  </button>
                  <AnimatePresence>
                    {attachMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setAttachMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="absolute bottom-12 left-0 z-50 w-48 rounded-xl border border-ink-200 bg-white p-1.5 shadow-card dark:border-ink-700 dark:bg-ink-900"
                        >
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                          >
                            <FileText size={14} /> Upload file
                          </button>
                          <button
                            onClick={() => {
                              setShowCamera(true);
                              setAttachMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                          >
                            <Camera size={14} /> Take a photo
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={listening ? stopListening : startListening}
                  aria-label="Voice input"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                    listening
                      ? 'bg-error-500 text-white animate-pulse'
                      : 'border border-ink-200 text-ink-500 hover:bg-ink-100 dark:border-ink-700 dark:hover:bg-ink-800'
                  }`}
                >
                  {listening ? <Square size={18} /> : <Mic size={18} />}
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send(input)}
                  placeholder={listening ? 'Listening…' : pendingFile ? 'Add a message (optional)…' : 'Ask a question…'}
                  className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                />
                <Button
                  onClick={() => send(input)}
                  disabled={(!input.trim() && !pendingFile) || loading}
                  className="shrink-0"
                >
                  <Send size={16} />
                </Button>
              </div>
              {speaking && (
                <button onClick={stopSpeaking} className="mt-2 text-xs font-medium text-error-600 hover:underline">
                  Stop speaking
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showCamera && (
          <CameraCaptureModal
            onCapture={(file) => {
              handleFileSelected(file);
              setShowCamera(false);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

/* ============================================================================
   Conversation history sidebar
   ============================================================================ */
function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
        >
          <Plus size={15} /> New chat
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <p className="px-3 py-4 text-center text-xs text-ink-400">Loading chats…</p>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-ink-400">No previous chats yet.</p>
        ) : (
          conversations.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              active={c.id === activeId}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  active,
  onSelect,
  onDelete,
  onRename,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(conversation.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setValue(conversation.title);
  }, [conversation.title]);

  const commitRename = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== conversation.title) onRename(conversation.id, trimmed);
    else setValue(conversation.title);
  };

  return (
    <div
      className={`group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
        editing ? '' : 'cursor-pointer'
      } ${
        active
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
          : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
      }`}
      onClick={() => !editing && onSelect(conversation.id)}
    >
      <MessageSquare size={14} className="shrink-0 opacity-60" />
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setValue(conversation.title);
              setEditing(false);
            }
          }}
          onBlur={commitRename}
          className="min-w-0 flex-1 rounded-lg border border-primary-300 bg-white px-1.5 py-0.5 text-sm outline-none dark:bg-ink-900 dark:text-ink-50"
        />
      ) : (
        <span className="flex-1 truncate">{conversation.title}</span>
      )}
      {!editing && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          {confirmingDelete ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation.id);
                }}
                aria-label="Confirm delete"
                className="rounded-md p-1 text-error-600 hover:bg-error-100 dark:hover:bg-error-900/40"
              >
                <Check size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                aria-label="Cancel delete"
                className="rounded-md p-1 text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700"
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                aria-label="Rename chat"
                className="rounded-md p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700 dark:hover:bg-ink-700"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
                aria-label="Delete chat"
                className="rounded-md p-1 text-ink-400 hover:bg-error-100 hover:text-error-600 dark:hover:bg-error-900/40"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Camera capture modal
   ============================================================================ */
function CameraCaptureModal({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedBlobRef = useRef<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser. Try uploading a photo instead.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => setError('Could not access your camera. Check permissions, or upload a photo instead.'));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        capturedBlobRef.current = blob;
        setCaptured(canvas.toDataURL('image/jpeg', 0.9));
      },
      'image/jpeg',
      0.9,
    );
  };

  const retake = () => {
    setCaptured(null);
    capturedBlobRef.current = null;
  };

  const usePhoto = () => {
    if (!capturedBlobRef.current) return;
    onCapture(new File([capturedBlobRef.current], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  };

  const handleClose = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border border-ink-200 bg-white p-4 shadow-card dark:border-ink-800 dark:bg-ink-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">Take a photo</h3>
          <button
            onClick={handleClose}
            aria-label="Close camera"
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <p className="p-6 text-center text-sm text-error-600">{error}</p>
        ) : (
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
            {captured ? (
              <img src={captured} alt="Captured preview" className="h-full w-full object-cover" />
            ) : (
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            )}
          </div>
        )}

        <p className="mt-3 text-center text-xs text-ink-500 dark:text-ink-400">
          {error
            ? ''
            : captured
              ? 'Looks good? Send it to Nova, or retake it.'
              : 'Point your camera at what you want explained, then capture.'}
        </p>

        <div className="mt-4 flex justify-center gap-3">
          {error ? (
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          ) : captured ? (
            <>
              <Button variant="secondary" onClick={retake}>
                Retake
              </Button>
              <Button onClick={usePhoto}>Use photo</Button>
            </>
          ) : (
            <button
              onClick={capture}
              aria-label="Capture photo"
              className="h-14 w-14 rounded-full border-4 border-ink-200 bg-primary-600 transition hover:bg-primary-700 dark:border-ink-700"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================================
   Chat bubbles
   ============================================================================ */
function ChatBubble({ message, onSpeak, speaking }: { message: ChatMessage; onSpeak: () => void; speaking: boolean }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
          isUser ? 'bg-primary-600' : 'bg-gradient-to-br from-primary-600 to-accent-500'
        }`}
      >
        {isUser ? 'U' : <Sparkles size={14} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'rounded-br-md bg-primary-600 text-white'
            : 'rounded-tl-md bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
        }`}
      >
        {message.attachmentName && (
          <div
            className={`mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
              isUser ? 'bg-white/15' : 'bg-white dark:bg-ink-900'
            }`}
          >
            {message.attachmentPreviewUrl ? (
              <img src={message.attachmentPreviewUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
            ) : (
              <FileText size={13} />
            )}
            <span className="truncate">{message.attachmentName}</span>
          </div>
        )}
        {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
        {!isUser && message.video && <VideoEmbed video={message.video} />}
        {!isUser && message.content && (
          <button
            onClick={onSpeak}
            className="mt-2 inline-flex items-center gap-1 text-xs text-ink-400 hover:text-primary-500"
          >
            <Volume2 size={12} /> {speaking ? 'Speaking…' : 'Listen'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function VideoEmbed({ video }: { video: NonNullable<ChatMessage['video']> }) {
  return (
    <div className="mt-3 w-72 max-w-full overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
      <div className="aspect-video w-full">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-medium text-ink-800 dark:text-ink-100">{video.title}</p>
        {video.channelTitle && <p className="mt-0.5 text-[11px] text-ink-400">{video.channelTitle}</p>}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 text-white">
        <Sparkles size={14} />
      </div>
      <div className="rounded-2xl rounded-tl-md bg-ink-100 px-4 py-3 dark:bg-ink-800">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-ink-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
