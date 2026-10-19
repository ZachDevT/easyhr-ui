"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { useCompany } from '@/context/CompanyContext';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { employees as initialEmployees, Employee } from '@/data/employees';
import { playNotificationSound, showDesktopNotification } from '@/utils/chatSound';

export interface ChatReaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs or names
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'file';
  size?: string;
  mimeType?: string;
}

export interface ChatPollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface ChatPoll {
  id: string;
  question: string;
  options: ChatPollOption[];
  allowMultiple: boolean;
  anonymous: boolean;
  closed?: boolean;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: string;
  content: string;
  createdAt: string; // ISO or formatted
  attachments?: ChatAttachment[];
  poll?: ChatPoll;
  reactions?: Record<string, ChatReaction>; // emoji -> ChatReaction
  replyCount?: number;
  replies?: ChatMessage[];
  replyToId?: string;
  pinned?: boolean;
  saved?: boolean;
  clientMsgId?: string;
  status?: 'sending' | 'sent' | 'failed';
  errorMessage?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  topic?: string;
  description?: string;
  isPrivate: boolean;
  departmentRestricted?: boolean;
  department?: string;
  createdById: string;
  createdBy: string;
  createdAt: string;
  adminIds: string[];
  memberIds: string[];
  pendingRequestUserIds: string[];
  avatar?: string;
  unreadCount?: number;
  channelType?: string;
  isArchived?: boolean;
  isMuted?: boolean;
}

interface ChatContextType {
  channels: ChatChannel[];
  activeChannel: ChatChannel | null;
  setActiveChannelId: (id: string) => void;
  messages: ChatMessage[];
  allMessages: ChatMessage[];
  activeThread: ChatMessage | null;
  setActiveThread: (msg: ChatMessage | null) => void;
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  sendMessage: (
    content: string,
    attachments?: ChatAttachment[],
    threadParentId?: string,
    poll?: ChatPoll
  ) => Promise<void>;
  retrySendMessage: (clientMsgId: string) => Promise<void>;
  votePoll: (messageId: string, optionId: string) => Promise<void>;
  closePoll: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string, threadParentId?: string) => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string, threadParentId?: string) => Promise<void>;
  createChannel: (input: {
    name: string;
    description?: string;
    isPrivate: boolean;
    departmentRestricted: boolean;
    department?: string;
    memberIds?: string[];
  }) => Promise<ChatChannel>;
  requestToJoinChannel: (channelId: string) => Promise<void>;
  approveJoinRequest: (channelId: string, userId: string) => Promise<void>;
  rejectJoinRequest: (channelId: string, userId: string) => Promise<void>;
  addMemberToChannel: (channelId: string, userId: string) => Promise<void>;
  removeMemberFromChannel: (channelId: string, userId: string) => Promise<void>;
  typingUsers: string[];
  setTyping: (isTyping: boolean) => void;
  allEmployees: Employee[];
  uploadAttachment: (file: File) => Promise<ChatAttachment | null>;
  isRealtimeConnected: boolean;
  refreshChannels: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  fetchThreadReplies: (parentMessageId: string, channelId?: string) => Promise<ChatMessage[]>;
}

const STORAGE_KEY_CHANNELS = 'easyhr_chat_channels_v3';
const STORAGE_KEY_MESSAGES = 'easyhr_chat_messages_v5';

const DEFAULT_CHANNELS: ChatChannel[] = [];
const DEFAULT_MESSAGES: ChatMessage[] = [];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper to convert backend message format to frontend ChatMessage
function mapBackendMessage(bm: any): ChatMessage {
  const reactions: Record<string, ChatReaction> = {};
  if (bm.reactions && typeof bm.reactions === 'object') {
    for (const [emoji, users] of Object.entries(bm.reactions)) {
      if (Array.isArray(users)) {
        reactions[emoji] = {
          emoji,
          count: users.length,
          users: users.map(String),
        };
      }
    }
  }

  let formattedPoll: ChatPoll | undefined;
  if (bm.poll && bm.poll.question) {
    formattedPoll = {
      id: bm.id,
      question: bm.poll.question,
      options: (bm.poll.options || []).map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        voterIds: (opt.voterIds || []).map(String),
      })),
      allowMultiple: Boolean(bm.poll.allowMultiple),
      anonymous: Boolean(bm.poll.isAnonymous),
      closed: Boolean(bm.poll.closed),
    };
  }

  const attachments: ChatAttachment[] = (bm.attachments || []).map((att: any) => {
    let url = att.url || '';
    if (url && !url.startsWith('http')) {
      url = `${API_BASE_URL}${url}`;
    }
    const sizeMB = att.size ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : undefined;
    return {
      id: att.id,
      name: att.name || 'Attachment',
      url,
      type: att.type === 'image' ? 'image' : att.type === 'video' ? 'video' : 'file',
      size: sizeMB,
      mimeType: att.mimeType,
    };
  });

  let displayTime = bm.timestamp;
  if (displayTime) {
    try {
      const d = new Date(displayTime);
      if (!isNaN(d.getTime())) {
        displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      // keep raw
    }
  }

  return {
    id: bm.id,
    channelId: bm.channelId,
    senderId: String(bm.senderId),
    senderName: bm.senderName || 'Workspace Member',
    senderAvatar: bm.senderAvatar || '',
    senderRole: bm.senderRole || 'Team Member',
    content: bm.content || '',
    createdAt: displayTime || 'Just now',
    attachments,
    poll: formattedPoll,
    reactions,
    replyCount: bm.threadCount || 0,
    replyToId: bm.replyToId || bm.parentMessageId || bm.parent_message_id || undefined,
    pinned: Boolean(bm.pinned),
    saved: Boolean(bm.saved),
    clientMsgId: bm.clientMsgId,
    status: 'sent',
  };
}

// Helper to convert backend channel format to frontend ChatChannel
function mapBackendChannel(bc: any): ChatChannel {
  return {
    id: bc.id,
    name: bc.name,
    topic: bc.topic,
    description: bc.description,
    isPrivate: Boolean(bc.isPrivate),
    departmentRestricted: Boolean(bc.departmentRestriction),
    department: bc.departmentRestriction || undefined,
    createdById: String(bc.createdById || bc.createdBy || ''),
    createdBy: bc.createdBy || 'Workspace',
    createdAt: bc.createdAt || new Date().toISOString(),
    adminIds: bc.adminIds ? bc.adminIds.map(String) : bc.createdById ? [String(bc.createdById)] : [],
    memberIds: (bc.memberIds || []).map(String),
    pendingRequestUserIds: (bc.pendingRequestUserIds || []).map(String),
    unreadCount: bc.unreadCount || 0,
    channelType: bc.channelType,
    isArchived: Boolean(bc.isArchived),
    isMuted: Boolean(bc.isMuted),
  };
}

// Helper to reconcile and deduplicate thread replies
function reconcileReplies(existing: ChatMessage[] = [], newReply: ChatMessage): ChatMessage[] {
  const idx = existing.findIndex(
    (r) =>
      (newReply.id && r.id === newReply.id) ||
      (newReply.clientMsgId && r.clientMsgId && r.clientMsgId === newReply.clientMsgId)
  );
  if (idx >= 0) {
    const next = [...existing];
    next[idx] = { ...existing[idx], ...newReply, status: 'sent' };
    return next;
  }
  return [...existing, newReply];
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();
  const { currentUser } = useRole();
  const { company } = useCompany();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(true);

  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<string>('');

  const handleSetActiveChannelId = useCallback((id: string) => {
    setActiveChannelId(id);
    if (id) {
      setChannels((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
      getToken().then((token) => {
        if (!token) return;
        fetch(`${API_BASE_URL}/api/v1/chat/channels/${id}/read`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }).catch(() => {});
      });
    }
  }, [getToken]);

  // Ensure active channel unread count is always 0
  useEffect(() => {
    if (!activeChannelId) return;
    setChannels((prev) =>
      prev.map((c) => (c.id === activeChannelId && c.unreadCount ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeChannelId]);

  // 1. Fetch Organization Employees for member pickers and profile drawer
  useEffect(() => {
    let isMounted = true;
    const fetchEmployees = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/employees?limit=200`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.data || data.employees || data.items || [];
          if (isMounted && items.length > 0) {
            const formatted = items.map((e: any) => ({
              id: String(e.id),
              firstName: e.firstName || e.first_name || '',
              lastName: e.lastName || e.last_name || '',
              email: e.workEmail || e.work_email || e.email || '',
              phone: e.phone || '',
              avatar: e.avatar || e.avatarUrl || e.avatar_url || e.photoUrl || e.photo_url || e.image || '',
              department: e.department || 'General',
              title: e.jobTitle || e.job_title || 'Team Member',
              division: e.division || '',
              location: e.location || '',
              hireDate: e.hiredOn || e.hired_on || '2024-01-01',
              status: e.status === 'active' ? 'Active' : e.status || 'Active',
            }));
            setAllEmployees(formatted);
          }
        }
      } catch {
        // Fall back to initialEmployees on network error
      }
    };
    fetchEmployees();
    return () => {
      isMounted = false;
    };
  }, [getToken]);

  // 2. Fetch Channels from Backend
  const refreshChannels = useCallback(async () => {
    try {
      setIsLoadingChannels(true);
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/channels`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        const serverChannels = (data.channels || []).map(mapBackendChannel);
        if (serverChannels.length > 0) {
          setChannels(serverChannels);
          // If activeChannel is not in the list, default to general or first channel
          setActiveChannelId((prev) => {
            if (prev && serverChannels.some((c: ChatChannel) => c.id === prev)) {
              return prev;
            }
            const gen = serverChannels.find((c: ChatChannel) => c.name.toLowerCase() === 'general');
            return gen ? gen.id : serverChannels[0].id;
          });
        }
      }
    } catch {
      // Keep existing channels fallback
    } finally {
      setIsLoadingChannels(false);
    }
  }, [getToken]);

  useEffect(() => {
    refreshChannels();
  }, [refreshChannels]);

  // 3. Fetch Messages for Active Channel
  const refreshMessages = useCallback(async () => {
    if (!activeChannelId || activeChannelId === 'ch-general') return;
    try {
      setIsLoadingMessages(true);
      const token = await getToken();
      if (!token) return;

      const res = await fetch(
        `${API_BASE_URL}/api/v1/chat/messages?channelId=${encodeURIComponent(activeChannelId)}&includeThreads=false&limit=100`,
        {
          headers: getAuthHeaders(token),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const serverMsgs = (data.messages || []).map(mapBackendMessage);
        setAllMessages((prev) => {
          // Merge with any other channel messages already cached
          const otherChannels = prev.filter((m) => m.channelId !== activeChannelId);
          return [...otherChannels, ...serverMsgs];
        });

        // Mark channel as read
        fetch(`${API_BASE_URL}/api/v1/chat/channels/${encodeURIComponent(activeChannelId)}/read`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lastMessageId: serverMsgs.length > 0 ? serverMsgs[serverMsgs.length - 1].id : '',
          }),
        }).catch(() => {});
      }
    } catch {
      // Keep cached messages
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeChannelId, getToken]);

  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  // 4. Server-Sent Events (SSE) Real-Time Subscription
  useEffect(() => {
    let isCancelled = false;
    let sse: EventSource | null = null;

    const connectSSE = async () => {
      try {
        const token = await getToken();
        if (!token || isCancelled) return;

        const subdomain = company?.subdomain || 'app';
        let sseUrl = `${API_BASE_URL}/api/v1/chat/events?token=${encodeURIComponent(token)}&workspace=${encodeURIComponent(subdomain)}`;
        if (lastEventIdRef.current) {
          sseUrl += `&afterEventId=${encodeURIComponent(lastEventIdRef.current)}`;
        }

        sse = new EventSource(sseUrl);
        eventSourceRef.current = sse;

        sse.onopen = () => {
          if (!isCancelled) setIsRealtimeConnected(true);
        };

        sse.onerror = () => {
          if (!isCancelled) {
            setIsRealtimeConnected(false);
            sse?.close();
            // Retry after 4 seconds
            setTimeout(connectSSE, 4000);
          }
        };

        // Message Created
        sse.addEventListener('message.created', (e: MessageEvent) => {
          try {
            if (e.lastEventId) lastEventIdRef.current = e.lastEventId;
            const data = JSON.parse(e.data);
            const newMsg = mapBackendMessage(data);

            setAllMessages((prev) => {
              // Reconcile optimistic message
              const exists = prev.some((m) => m.id === newMsg.id || (newMsg.clientMsgId && m.clientMsgId === newMsg.clientMsgId));
              if (exists) {
                return prev.map((m) => (m.clientMsgId && m.clientMsgId === newMsg.clientMsgId ? newMsg : m));
              }
              return [...prev, newMsg];
            });

            // Update channel last message & unread count
            setChannels((prev) =>
              prev.map((c) => {
                if (c.id === newMsg.channelId) {
                  const isCurrent = c.id === activeChannelId;
                  return {
                    ...c,
                    unreadCount: isCurrent ? 0 : (c.unreadCount || 0) + 1,
                  };
                }
                return c;
              })
            );

            // Audio & Browser Notification Alerts
            const myId = String(currentUser?.id || 'user');
            if (newMsg.senderId !== myId) {
              const contentLower = (newMsg.content || '').toLowerCase();
              const myFirst = (currentUser?.firstName || '').toLowerCase();
              const myLast = (currentUser?.lastName || '').toLowerCase();
              const isMentioned =
                (myFirst && contentLower.includes(`@${myFirst}`)) ||
                (myLast && contentLower.includes(`@${myLast}`)) ||
                contentLower.includes('@here') ||
                contentLower.includes('@channel');

              if (isMentioned) {
                playNotificationSound('mention');
                showDesktopNotification({
                  title: `${newMsg.senderName} mentioned you`,
                  body: newMsg.content || 'Sent an attachment',
                  tag: `mention-${newMsg.id}`,
                });
              } else if (newMsg.channelId === activeChannelId) {
                if (typeof document !== 'undefined' && document.hidden) {
                  playNotificationSound('message');
                  showDesktopNotification({
                    title: `${newMsg.senderName}`,
                    body: newMsg.content || 'New message',
                    tag: `msg-${newMsg.id}`,
                  });
                }
              } else {
                // Message in background channel
                if (typeof document !== 'undefined' && document.hidden) {
                  showDesktopNotification({
                    title: `${newMsg.senderName}`,
                    body: newMsg.content || 'New message in channel',
                    tag: `msg-${newMsg.id}`,
                  });
                }
              }
            }
          } catch {}
        });

        // Thread Reply Created (deduplicated & reconciled)
        sse.addEventListener('thread.reply_created', (e: MessageEvent) => {
          try {
            if (e.lastEventId) lastEventIdRef.current = e.lastEventId;
            const data = JSON.parse(e.data);
            const replyMsg = mapBackendMessage(data);
            const parentId = data.replyToId || replyMsg.replyToId || data.parentMessageId;
            if (!parentId) return;

            setAllMessages((prev) =>
              prev.map((m) => {
                if (m.id === parentId) {
                  const updatedReplies = reconcileReplies(m.replies || [], replyMsg);
                  return {
                    ...m,
                    replyCount: Math.max(m.replyCount || 0, updatedReplies.length),
                    replies: updatedReplies,
                  };
                }
                return m;
              })
            );

            setActiveThread((current) => {
              if (current && (current.id === parentId)) {
                const updatedReplies = reconcileReplies(current.replies || [], replyMsg);
                return {
                  ...current,
                  replyCount: Math.max(current.replyCount || 0, updatedReplies.length),
                  replies: updatedReplies,
                };
              }
              return current;
            });

            // Audio & Browser Notification Alerts for thread replies
            const myId = String(currentUser?.id || 'user');
            if (replyMsg.senderId !== myId) {
              playNotificationSound('reply');
              showDesktopNotification({
                title: `${replyMsg.senderName} replied to thread`,
                body: replyMsg.content || 'Sent a reply in thread',
                tag: `thread-${parentId}`,
              });
            }
          } catch {}
        });

        // Message Updated
        sse.addEventListener('message.updated', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setAllMessages((prev) =>
              prev.map((m) => (m.id === data.id ? { ...m, content: data.content } : m))
            );
          } catch {}
        });

        // Message Deleted
        sse.addEventListener('message.deleted', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setAllMessages((prev) => prev.filter((m) => m.id !== data.messageId));
            setActiveThread((curr) => (curr && curr.id === data.messageId ? null : curr));
          } catch {}
        });

        // Reaction Added / Removed
        sse.addEventListener('message.reaction_added', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const { messageId, emoji, reactions } = data;
            const formatted = reactions ? mapBackendMessage({ id: messageId, reactions }).reactions : undefined;
            if (formatted) {
              setAllMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, reactions: formatted } : m))
              );
            }
          } catch {}
        });
        sse.addEventListener('message.reaction_removed', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const { messageId, emoji, reactions } = data;
            const formatted = reactions ? mapBackendMessage({ id: messageId, reactions }).reactions : undefined;
            if (formatted) {
              setAllMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, reactions: formatted } : m))
              );
            }
          } catch {}
        });

        // Poll Updated
        sse.addEventListener('message.poll_updated', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const { messageId, poll } = data;
            if (poll) {
              const mappedPoll: ChatPoll = {
                id: messageId,
                question: poll.question,
                options: (poll.options || []).map((o: any) => ({
                  id: o.id,
                  text: o.text,
                  voterIds: (o.voterIds || []).map(String),
                })),
                allowMultiple: Boolean(poll.allowMultiple),
                anonymous: Boolean(poll.isAnonymous),
                closed: Boolean(poll.closed),
              };
              setAllMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, poll: mappedPoll } : m))
              );
            }
          } catch {}
        });

        // Pin Toggled
        sse.addEventListener('message.pinned', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setAllMessages((prev) =>
              prev.map((m) => (m.id === data.messageId ? { ...m, pinned: true } : m))
            );
          } catch {}
        });
        sse.addEventListener('message.unpinned', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setAllMessages((prev) =>
              prev.map((m) => (m.id === data.messageId ? { ...m, pinned: false } : m))
            );
          } catch {}
        });

        // Typing Indicators
        sse.addEventListener('typing.started', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.channelId === activeChannelId && String(data.employeeId) !== String(currentUser?.id)) {
              setTypingUsers((prev) => {
                const name = data.userName || 'Someone';
                return prev.includes(name) ? prev : [...prev, name];
              });
            }
          } catch {}
        });
        sse.addEventListener('typing.stopped', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.channelId === activeChannelId) {
              setTypingUsers((prev) => prev.filter((u) => u !== data.userName));
            }
          } catch {}
        });

        // Channel Events
        sse.addEventListener('channel.created', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const ch = mapBackendChannel(data);
            setChannels((prev) =>
              prev.some((c) => c.id === ch.id) ? prev.map((c) => (c.id === ch.id ? { ...c, ...ch } : c)) : [...prev, ch]
            );
          } catch {}
        });
        sse.addEventListener('channel.updated', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const ch = mapBackendChannel(data);
            setChannels((prev) => prev.map((c) => (c.id === ch.id ? { ...c, ...ch } : c)));
          } catch {}
        });
        sse.addEventListener('channel.archived', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setChannels((prev) =>
              prev.map((c) => (c.id === data.channelId ? { ...c, isArchived: true } : c))
            );
          } catch {}
        });
        sse.addEventListener('channel.deleted', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setChannels((prev) => prev.filter((c) => c.id !== data.channelId));
          } catch {}
        });
        sse.addEventListener('channel.member_joined', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.channel) {
              const ch = mapBackendChannel(data.channel);
              setChannels((prev) =>
                prev.some((c) => c.id === ch.id) ? prev.map((c) => (c.id === ch.id ? { ...c, ...ch } : c)) : [...prev, ch]
              );
            } else {
              setChannels((prev) => {
                const found = prev.some((c) => c.id === data.channelId);
                if (!found) {
                  refreshChannels();
                  return prev;
                }
                return prev.map((c) => {
                  if (c.id === data.channelId) {
                    const mIds = c.memberIds.includes(String(data.employeeId))
                      ? c.memberIds
                      : [...c.memberIds, String(data.employeeId)];
                    return { ...c, memberIds: mIds };
                  }
                  return c;
                });
              });
            }
          } catch {}
        });
        sse.addEventListener('channel.member_left', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setChannels((prev) =>
              prev.map((c) => {
                if (c.id === data.channelId) {
                  return { ...c, memberIds: c.memberIds.filter((id) => id !== String(data.employeeId)) };
                }
                return c;
              })
            );
          } catch {}
        });
        sse.addEventListener('channel.join_requested', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setChannels((prev) =>
              prev.map((c) => {
                if (c.id === data.channelId) {
                  const reqs = c.pendingRequestUserIds.includes(String(data.employeeId))
                    ? c.pendingRequestUserIds
                    : [...c.pendingRequestUserIds, String(data.employeeId)];
                  return { ...c, pendingRequestUserIds: reqs };
                }
                return c;
              })
            );
          } catch {}
        });
        sse.addEventListener('channel.join_reviewed', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setChannels((prev) =>
              prev.map((c) => {
                if (c.id === data.channelId) {
                  const rem = c.pendingRequestUserIds.filter((id) => id !== String(data.employeeId));
                  const mIds = data.approved && !c.memberIds.includes(String(data.employeeId))
                    ? [...c.memberIds, String(data.employeeId)]
                    : c.memberIds;
                  return { ...c, pendingRequestUserIds: rem, memberIds: mIds };
                }
                return c;
              })
            );
          } catch {}
        });
      } catch {
        // SSE connection failure handled by onerror retry
      }
    };

    connectSSE();

    return () => {
      isCancelled = true;
      if (sse) sse.close();
    };
  }, [getToken, company, activeChannelId, currentUser]);

  // Derived Active Channel
  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === activeChannelId) || channels[0] || null;
  }, [channels, activeChannelId]);

  // Messages for Active Channel
  const messages = useMemo(() => {
    return allMessages.filter((m) => m.channelId === activeChannelId);
  }, [allMessages, activeChannelId]);

  // 5. Attachment Upload to Backend Storage
  const uploadAttachment = useCallback(
    async (file: File): Promise<ChatAttachment | null> => {
      try {
        const token = await getToken();
        if (!token) return null;

        const formData = new FormData();
        formData.append('file', file);
        if (activeChannelId && activeChannelId !== 'ch-general') {
          formData.append('channelId', activeChannelId);
        }

        const headers = getAuthHeaders(token);
        delete (headers as any)['Content-Type'];

        const res = await fetch(`${API_BASE_URL}/api/v1/chat/attachments`, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          let url = data.url || '';
          if (url && !url.startsWith('http')) {
            url = `${API_BASE_URL}${url}`;
          }
          const sizeMB = data.size ? `${(data.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          return {
            id: data.id,
            name: data.name || file.name,
            url,
            type: data.type === 'image' ? 'image' : data.type === 'video' ? 'video' : 'file',
            size: sizeMB,
            mimeType: data.mimeType || file.type,
          };
        }
      } catch {
        // Fall back to local object URL
      }

      // Local fallback
      const isImg = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: isImg ? 'image' : isVideo ? 'video' : 'file',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        mimeType: file.type,
      };
    },
    [getToken, activeChannelId]
  );

  // 5b. Fetch Thread Replies on Demand
  const fetchThreadReplies = useCallback(
    async (parentMessageId: string, channelId?: string): Promise<ChatMessage[]> => {
      if (!parentMessageId) return [];
      try {
        const token = await getToken();
        const chId = channelId || activeChannelId;
        const url = `${API_BASE_URL}/api/v1/chat/messages/${encodeURIComponent(parentMessageId)}/replies${
          chId ? `?channelId=${encodeURIComponent(chId)}` : ''
        }`;
        const res = await fetch(url, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data = await res.json();
          const serverReplies: ChatMessage[] = (data.replies || []).map((r: any) => ({
            ...mapBackendMessage(r),
            status: 'sent' as const,
          }));

          // Update activeThread with server replies
          setActiveThread((curr) => {
            if (curr && curr.id === parentMessageId) {
              return {
                ...curr,
                replyCount: Math.max(curr.replyCount || 0, serverReplies.length),
                replies: serverReplies,
              };
            }
            return curr;
          });

          // Update parent message inside allMessages
          setAllMessages((prev) =>
            prev.map((m) => {
              if (m.id === parentMessageId) {
                return {
                  ...m,
                  replyCount: Math.max(m.replyCount || 0, serverReplies.length),
                  replies: serverReplies,
                };
              }
              return m;
            })
          );

          return serverReplies;
        }
      } catch (err) {
        console.error('Failed to fetch thread replies:', err);
      }
      return [];
    },
    [getToken, activeChannelId]
  );

  // 6. Send Message with Optimistic UI & Server Synchronization
  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: ChatAttachment[],
      threadParentId?: string,
      poll?: ChatPoll
    ) => {
      const myId = String(currentUser?.id || 'user');
      const myName = `${currentUser?.firstName || 'Current'} ${currentUser?.lastName || 'User'}`.trim();
      const myAvatar = currentUser?.avatar || '';
      const clientMsgId = `cmsg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Optimistic Message
      const optimisticMsg: ChatMessage = {
        id: clientMsgId,
        channelId: activeChannelId,
        senderId: myId,
        senderName: myName,
        senderAvatar: myAvatar,
        senderRole: currentUser?.title || 'Team Member',
        content,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: attachments || [],
        poll,
        reactions: {},
        replyCount: 0,
        replies: [],
        clientMsgId,
        status: 'sending',
      };

      if (threadParentId) {
        setAllMessages((prev) =>
          prev.map((m) => {
            if (m.id === threadParentId) {
              const updatedReplies = [...(m.replies || []), optimisticMsg];
              const updated = {
                ...m,
                replyCount: updatedReplies.length,
                replies: updatedReplies,
              };
              if (activeThread?.id === threadParentId) {
                setActiveThread(updated);
              }
              return updated;
            }
            return m;
          })
        );
      } else {
        setAllMessages((prev) => [...prev, optimisticMsg]);
      }

      // Backend API Call
      try {
        const token = await getToken();
        if (token) {
          const bodyPayload: any = {
            channelId: activeChannelId,
            content,
            replyToId: threadParentId,
            clientMsgId,
          };

          if (attachments && attachments.length > 0) {
            bodyPayload.attachmentIds = attachments.map((a) => a.id).filter((id) => id && !id.startsWith('att-') && !id.startsWith('file-'));
            bodyPayload.attachments = attachments.map((a) => ({
              id: a.id,
              name: a.name,
              url: a.url,
              type: a.type,
              mimeType: a.mimeType,
            }));
          }

          if (poll) {
            bodyPayload.poll = {
              question: poll.question,
              options: poll.options.map((opt) => ({ text: opt.text })),
              allowMultiple: poll.allowMultiple,
              isAnonymous: poll.anonymous,
            };
          }

          const res = await fetch(`${API_BASE_URL}/api/v1/chat/messages`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
              'Idempotency-Key': clientMsgId,
            },
            body: JSON.stringify(bodyPayload),
          });

          if (res.ok) {
            const data = await res.json();
            const serverMsg: ChatMessage = {
              ...mapBackendMessage(data),
              status: 'sent',
            };

            if (threadParentId) {
              setAllMessages((prev) =>
                prev.map((m) => {
                  if (m.id === threadParentId) {
                    const nextReplies = (m.replies || []).map((r) =>
                      r.clientMsgId === clientMsgId || r.id === clientMsgId ? serverMsg : r
                    );
                    return {
                      ...m,
                      replyCount: nextReplies.length,
                      replies: nextReplies,
                    };
                  }
                  return m;
                })
              );

              setActiveThread((curr) => {
                if (curr && curr.id === threadParentId) {
                  const nextReplies = (curr.replies || []).map((r) =>
                    r.clientMsgId === clientMsgId || r.id === clientMsgId ? serverMsg : r
                  );
                  return {
                    ...curr,
                    replyCount: nextReplies.length,
                    replies: nextReplies,
                  };
                }
                return curr;
              });
            } else {
              setAllMessages((prev) =>
                prev.map((m) => (m.clientMsgId === clientMsgId ? serverMsg : m))
              );
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData?.detail || 'Failed to send message';
            if (threadParentId) {
              setAllMessages((prev) =>
                prev.map((m) => {
                  if (m.id === threadParentId) {
                    return {
                      ...m,
                      replies: (m.replies || []).map((r) =>
                        r.clientMsgId === clientMsgId
                          ? { ...r, status: 'failed', errorMessage: errMsg }
                          : r
                      ),
                    };
                  }
                  return m;
                })
              );
              setActiveThread((curr) => {
                if (curr && curr.id === threadParentId) {
                  return {
                    ...curr,
                    replies: (curr.replies || []).map((r) =>
                      r.clientMsgId === clientMsgId
                        ? { ...r, status: 'failed', errorMessage: errMsg }
                        : r
                    ),
                  };
                }
                return curr;
              });
            } else {
              setAllMessages((prev) =>
                prev.map((m) =>
                  m.clientMsgId === clientMsgId
                    ? { ...m, status: 'failed', errorMessage: errMsg }
                    : m
                )
              );
            }
          }
        }
      } catch (err: any) {
        const errMsg = err?.message || 'Network error';
        if (threadParentId) {
          setAllMessages((prev) =>
            prev.map((m) => {
              if (m.id === threadParentId) {
                return {
                  ...m,
                  replies: (m.replies || []).map((r) =>
                    r.clientMsgId === clientMsgId
                      ? { ...r, status: 'failed', errorMessage: errMsg }
                      : r
                  ),
                };
              }
              return m;
            })
          );
          setActiveThread((curr) => {
            if (curr && curr.id === threadParentId) {
              return {
                ...curr,
                replies: (curr.replies || []).map((r) =>
                  r.clientMsgId === clientMsgId
                    ? { ...r, status: 'failed', errorMessage: errMsg }
                    : r
                ),
              };
            }
            return curr;
          });
        } else {
          setAllMessages((prev) =>
            prev.map((m) =>
              m.clientMsgId === clientMsgId
                ? { ...m, status: 'failed', errorMessage: errMsg }
                : m
            )
          );
        }
      }
    },
    [activeChannelId, currentUser, activeThread, getToken]
  );

  // Retry sending a failed message
  const retrySendMessage = useCallback(
    async (clientMsgId: string) => {
      const msg = allMessages.find((m) => m.clientMsgId === clientMsgId);
      if (!msg) return;

      setAllMessages((prev) =>
        prev.map((m) =>
          m.clientMsgId === clientMsgId
            ? { ...m, status: 'sending', errorMessage: undefined }
            : m
        )
      );

      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const bodyPayload: any = {
          channelId: msg.channelId,
          content: msg.content,
          clientMsgId,
        };

        if (msg.attachments && msg.attachments.length > 0) {
          bodyPayload.attachmentIds = msg.attachments
            .map((a) => a.id)
            .filter((id) => id && !id.startsWith('att-') && !id.startsWith('file-'));
          bodyPayload.attachments = msg.attachments.map((a) => ({
            id: a.id,
            name: a.name,
            url: a.url,
            type: a.type,
            mimeType: a.mimeType,
          }));
        }

        if (msg.poll) {
          bodyPayload.poll = {
            question: msg.poll.question,
            options: msg.poll.options.map((opt) => ({ text: opt.text })),
            allowMultiple: msg.poll.allowMultiple,
            isAnonymous: msg.poll.anonymous,
          };
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/chat/messages`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'application/json',
            'Idempotency-Key': clientMsgId,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          const data = await res.json();
          const serverMsg: ChatMessage = {
            ...mapBackendMessage(data),
            status: 'sent',
          };
          setAllMessages((prev) =>
            prev.map((m) => (m.clientMsgId === clientMsgId ? serverMsg : m))
          );
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.detail || 'Failed to send message';
          setAllMessages((prev) =>
            prev.map((m) =>
              m.clientMsgId === clientMsgId
                ? { ...m, status: 'failed', errorMessage: errMsg }
                : m
            )
          );
        }
      } catch (err: any) {
        setAllMessages((prev) =>
          prev.map((m) =>
            m.clientMsgId === clientMsgId
              ? { ...m, status: 'failed', errorMessage: err?.message || 'Network error' }
              : m
          )
        );
      }
    },
    [allMessages, getToken]
  );

  // 7. Vote on Poll
  const votePoll = useCallback(
    async (messageId: string, optionId: string) => {
      const myId = String(currentUser?.id || 'user');

      // Optimistic update
      setAllMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.poll || m.poll.closed) return m;
          const allowMultiple = m.poll.allowMultiple;
          const updatedOptions = m.poll.options.map((opt) => {
            const hasVoted = opt.voterIds.includes(myId);
            if (opt.id === optionId) {
              return {
                ...opt,
                voterIds: hasVoted ? opt.voterIds.filter((v) => v !== myId) : [...opt.voterIds, myId],
              };
            } else if (!allowMultiple) {
              return {
                ...opt,
                voterIds: opt.voterIds.filter((v) => v !== myId),
              };
            }
            return opt;
          });
          return {
            ...m,
            poll: { ...m.poll, options: updatedOptions },
          };
        })
      );

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/messages/${encodeURIComponent(messageId)}/poll/vote`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: activeChannelId,
              optionId,
            }),
          });
        }
      } catch {}
    },
    [currentUser, getToken, activeChannelId]
  );

  // 8. Close Poll
  const closePoll = useCallback(
    async (messageId: string) => {
      setAllMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.poll ? { ...m, poll: { ...m.poll, closed: !m.poll.closed } } : m
        )
      );

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/messages/${encodeURIComponent(messageId)}/poll/close`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: activeChannelId,
            }),
          });
        }
      } catch {}
    },
    [getToken, activeChannelId]
  );

  // 9. Delete Message
  const deleteMessage = useCallback(
    async (messageId: string, threadParentId?: string) => {
      if (threadParentId) {
        setAllMessages((prev) =>
          prev.map((m) => {
            if (m.id === threadParentId) {
              const updatedReplies = (m.replies || []).filter((r) => r.id !== messageId);
              const updated = {
                ...m,
                replyCount: updatedReplies.length,
                replies: updatedReplies,
              };
              if (activeThread?.id === threadParentId) {
                setActiveThread(updated);
              }
              return updated;
            }
            return m;
          })
        );
      } else {
        setAllMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (activeThread?.id === messageId) {
          setActiveThread(null);
        }
      }

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/messages/${encodeURIComponent(messageId)}?channelId=${encodeURIComponent(activeChannelId)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(token),
          });
        }
      } catch {}
    },
    [activeThread, getToken, activeChannelId]
  );

  // 10. Toggle Pin
  const togglePinMessage = useCallback(
    async (messageId: string) => {
      setAllMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m))
      );

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/messages/${encodeURIComponent(messageId)}/pin`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: activeChannelId,
            }),
          });
        }
      } catch {}
    },
    [getToken, activeChannelId]
  );

  // 11. Toggle Reaction
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string, threadParentId?: string) => {
      const myId = String(currentUser?.id || 'user');

      const updateReactions = (reactions: Record<string, ChatReaction> = {}) => {
        const current = reactions[emoji] || { emoji, count: 0, users: [] };
        const hasReacted = current.users.includes(myId);

        if (hasReacted) {
          const newUsers = current.users.filter((u) => u !== myId);
          if (newUsers.length === 0) {
            const next = { ...reactions };
            delete next[emoji];
            return next;
          }
          return {
            ...reactions,
            [emoji]: { emoji, count: newUsers.length, users: newUsers },
          };
        } else {
          const newUsers = [...current.users, myId];
          return {
            ...reactions,
            [emoji]: { emoji, count: newUsers.length, users: newUsers },
          };
        }
      };

      if (threadParentId) {
        setAllMessages((prev) =>
          prev.map((m) => {
            if (m.id === threadParentId) {
              const updatedReplies = (m.replies || []).map((r) => {
                if (r.id === messageId) {
                  return { ...r, reactions: updateReactions(r.reactions) };
                }
                return r;
              });
              const updated = { ...m, replies: updatedReplies };
              if (activeThread?.id === threadParentId) {
                setActiveThread(updated);
              }
              return updated;
            }
            return m;
          })
        );
      } else {
        setAllMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: updateReactions(m.reactions) } : m))
        );
      }

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/messages/${encodeURIComponent(messageId)}/reactions`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: activeChannelId,
              emoji,
            }),
          });
        }
      } catch {}
    },
    [currentUser, activeThread, getToken, activeChannelId]
  );

  // 12. Create Channel
  const createChannel = useCallback(
    async (input: {
      name: string;
      description?: string;
      isPrivate: boolean;
      departmentRestricted: boolean;
      department?: string;
      memberIds?: string[];
    }): Promise<ChatChannel> => {
      const cleanName = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const myId = String(currentUser?.id || 'user');
      const initialMemberIds = Array.from(new Set([myId, ...(input.memberIds || [])]));

      const token = await getToken();
      if (!token) {
        throw new Error('Please sign in to create channels');
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/chat/channels`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          description: input.description || '',
          topic: input.description || '',
          isPrivate: input.isPrivate,
          channelType: 'channel',
          departmentRestriction: input.departmentRestricted ? (input.department || '') : '',
          memberIds: initialMemberIds,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.detail || errJson.title || errJson.message || 'Failed to create channel';
        throw new Error(msg);
      }

      const data = await res.json();
      const serverChannel = mapBackendChannel(data);
      setChannels((prev) => {
        if (prev.some((c) => c.id === serverChannel.id)) {
          return prev.map((c) => (c.id === serverChannel.id ? serverChannel : c));
        }
        return [...prev, serverChannel];
      });
      setActiveChannelId(serverChannel.id);
      return serverChannel;
    },
    [currentUser, getToken]
  );

  // 13. Join Channel Request
  const requestToJoinChannel = useCallback(
    async (channelId: string) => {
      const myId = String(currentUser?.id || 'user');
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === channelId && !c.pendingRequestUserIds.includes(myId)) {
            return {
              ...c,
              pendingRequestUserIds: [...c.pendingRequestUserIds, myId],
            };
          }
          return c;
        })
      );

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/channels/${encodeURIComponent(channelId)}/request-join`, {
            method: 'POST',
            headers: getAuthHeaders(token),
          });
        }
      } catch {}
    },
    [currentUser, getToken]
  );

  // 14. Approve Join Request
  const approveJoinRequest = useCallback(
    async (channelId: string, userId: string) => {
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === channelId) {
            return {
              ...c,
              pendingRequestUserIds: c.pendingRequestUserIds.filter((id) => id !== userId),
              memberIds: c.memberIds.includes(userId) ? c.memberIds : [...c.memberIds, userId],
            };
          }
          return c;
        })
      );

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/channels/${encodeURIComponent(channelId)}/review-request`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requesterId: userId,
              approved: true,
            }),
          });
        }
      } catch {}
    },
    [getToken]
  );

  // 15. Reject Join Request
  const rejectJoinRequest = useCallback(
    async (channelId: string, userId: string) => {
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === channelId) {
            return {
              ...c,
              pendingRequestUserIds: c.pendingRequestUserIds.filter((id) => id !== userId),
            };
          }
          return c;
        })
      );

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/channels/${encodeURIComponent(channelId)}/review-request`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requesterId: userId,
              approved: false,
            }),
          });
        }
      } catch {}
    },
    [getToken]
  );

  // 16. Add Member
  const addMemberToChannel = useCallback(
    async (channelId: string, userId: string) => {
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === channelId && !c.memberIds.includes(userId)) {
            return {
              ...c,
              memberIds: [...c.memberIds, userId],
            };
          }
          return c;
        })
      );

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/channels/${encodeURIComponent(channelId)}/members`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeId: userId,
            }),
          });
        }
      } catch {}
    },
    [getToken]
  );

  // 17. Remove Member
  const removeMemberFromChannel = useCallback(
    async (channelId: string, userId: string) => {
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === channelId) {
            return {
              ...c,
              memberIds: c.memberIds.filter((id) => id !== userId),
            };
          }
          return c;
        })
      );

      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/chat/channels/${encodeURIComponent(channelId)}/members/${encodeURIComponent(userId)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(token),
          });
        }
      } catch {}
    },
    [getToken]
  );

  // 18. Typing Indicator Dispatch with Throttling
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }

      const sendTypingToBackend = async (typing: boolean) => {
        try {
          const token = await getToken();
          if (token && activeChannelId) {
            await fetch(`${API_BASE_URL}/api/v1/chat/typing`, {
              method: 'POST',
              headers: {
                ...getAuthHeaders(token),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                channelId: activeChannelId,
                isTyping: typing,
              }),
            });
          }
        } catch {}
      };

      sendTypingToBackend(isTyping);

      if (isTyping) {
        typingTimerRef.current = setTimeout(() => {
          sendTypingToBackend(false);
        }, 4000);
      }
    },
    [getToken, activeChannelId]
  );

  return (
    <ChatContext.Provider
      value={{
        channels,
        activeChannel,
        setActiveChannelId: handleSetActiveChannelId,
        messages,
        allMessages,
        activeThread,
        setActiveThread,
        isLoadingChannels,
        isLoadingMessages,
        sendMessage,
        retrySendMessage,
        votePoll,
        closePoll,
        deleteMessage,
        togglePinMessage,
        toggleReaction,
        createChannel,
        requestToJoinChannel,
        approveJoinRequest,
        rejectJoinRequest,
        addMemberToChannel,
        removeMemberFromChannel,
        typingUsers,
        setTyping,
        allEmployees,
        uploadAttachment,
        isRealtimeConnected,
        refreshChannels,
        refreshMessages,
        fetchThreadReplies,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
