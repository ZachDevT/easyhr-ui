"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { employees as initialEmployees, Employee } from '@/data/employees';

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
  reactions?: Record<string, ChatReaction>; // emoji -> ChatReaction
  replyCount?: number;
  replies?: ChatMessage[];
  pinned?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string; // e.g. "general", "design-system", "engineering"
  topic?: string;
  description?: string;
  isPrivate: boolean;
  departmentRestricted?: boolean;
  department?: string; // e.g. "Engineering", "Design", "Sales"
  createdById: string;
  createdBy: string;
  createdAt: string;
  adminIds: string[];
  memberIds: string[];
  pendingRequestUserIds: string[]; // users requesting to join private/restricted channel
  avatar?: string;
  unreadCount?: number;
}

interface ChatContextType {
  channels: ChatChannel[];
  activeChannel: ChatChannel | null;
  setActiveChannelId: (id: string) => void;
  messages: ChatMessage[];
  allMessages: ChatMessage[];
  activeThread: ChatMessage | null;
  setActiveThread: (msg: ChatMessage | null) => void;
  sendMessage: (content: string, attachments?: ChatAttachment[], threadParentId?: string) => void;
  deleteMessage: (messageId: string, threadParentId?: string) => void;
  togglePinMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string, threadParentId?: string) => void;
  createChannel: (input: {
    name: string;
    description?: string;
    isPrivate: boolean;
    departmentRestricted: boolean;
    department?: string;
    memberIds?: string[];
  }) => ChatChannel;
  requestToJoinChannel: (channelId: string) => void;
  approveJoinRequest: (channelId: string, userId: string) => void;
  rejectJoinRequest: (channelId: string, userId: string) => void;
  addMemberToChannel: (channelId: string, userId: string) => void;
  removeMemberFromChannel: (channelId: string, userId: string) => void;
  typingUsers: string[];
  setTyping: (isTyping: boolean) => void;
  allEmployees: Employee[];
}

const STORAGE_KEY_CHANNELS = 'easyhr_chat_channels_v3';
const STORAGE_KEY_MESSAGES = 'easyhr_chat_messages_v4';

const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'ch-general',
    name: 'general',
    topic: 'Company-wide updates, announcements & team discussions',
    description: 'The primary workspace channel for everyone at the company.',
    isPrivate: false,
    departmentRestricted: false,
    createdById: '1',
    createdBy: 'Sarah Johnson',
    createdAt: '2026-01-01T08:00:00Z',
    adminIds: ['1', 'user'],
    memberIds: ['1', '2', '3', '4', '5', '6', '7', '8', 'user'],
    pendingRequestUserIds: [],
  },
  {
    id: 'ch-announcements',
    name: 'announcements',
    topic: 'Official company news, policy releases & milestones',
    description: 'Broadcast channel for executive and HR updates.',
    isPrivate: false,
    departmentRestricted: false,
    createdById: '1',
    createdBy: 'Sarah Johnson',
    createdAt: '2026-01-02T09:00:00Z',
    adminIds: ['1', 'user'],
    memberIds: ['1', '2', '3', '4', '5', '6', '7', '8', 'user'],
    pendingRequestUserIds: [],
    unreadCount: 2,
  },
  {
    id: 'ch-design',
    name: 'design-system',
    topic: 'Product UI/UX design, Figma updates & design token critiques',
    description: 'All things product design, typography, components, and user experience.',
    isPrivate: false,
    departmentRestricted: true,
    department: 'Design',
    createdById: '1',
    createdBy: 'Sarah Johnson',
    createdAt: '2026-01-05T09:30:00Z',
    adminIds: ['1', 'user'],
    memberIds: ['1', '2', '4', 'user'],
    pendingRequestUserIds: [],
  },
  {
    id: 'ch-engineering',
    name: 'engineering-core',
    topic: 'Sprint commits, architectural decisions, PR reviews & CI/CD alerts',
    description: 'Technical discussions and core system engineering.',
    isPrivate: true,
    departmentRestricted: true,
    department: 'Engineering',
    createdById: '2',
    createdBy: 'James Mwangi',
    createdAt: '2026-01-10T11:00:00Z',
    adminIds: ['2', '1'],
    memberIds: ['2', '3', '1'],
    pendingRequestUserIds: ['5'],
  },
  {
    id: 'ch-people-ops',
    name: 'people-operations',
    topic: 'Onboarding coordination, culture initiatives & employee engagement',
    description: 'Human Resources and People Operations coordination hub.',
    isPrivate: false,
    departmentRestricted: true,
    department: 'Human Resources',
    createdById: '1',
    createdBy: 'Sarah Johnson',
    createdAt: '2026-01-08T10:00:00Z',
    adminIds: ['1', 'user'],
    memberIds: ['1', '3', '5', 'user'],
    pendingRequestUserIds: [],
  },
  {
    id: 'ch-leadership',
    name: 'leadership-private',
    topic: 'Quarterly OKRs, compensation reviews & executive strategy',
    description: 'Confidential executive room. Request access or ask an admin to invite you.',
    isPrivate: true,
    departmentRestricted: false,
    createdById: '1',
    createdBy: 'Sarah Johnson',
    createdAt: '2026-01-02T10:00:00Z',
    adminIds: ['1'],
    memberIds: ['1'],
    pendingRequestUserIds: [],
  },
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'ch-general',
    senderId: '1',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    senderRole: 'HR Director',
    content: "Good morning team! Welcome to our new workspace channels. Feel free to start threads on any topic, share files or specifications, and mention colleagues with @name.",
    createdAt: '09:30 AM',
    pinned: true,
    reactions: {
      '🚀': { emoji: '🚀', count: 4, users: ['2', '3', '4', 'user'] },
      '👏': { emoji: '👏', count: 3, users: ['2', 'user', '5'] },
    },
    replyCount: 3,
    replies: [
      {
        id: 'reply-1',
        channelId: 'ch-general',
        senderId: '2',
        senderName: 'James Mwangi',
        senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        senderRole: 'Senior Software Engineer',
        content: 'The thread drawer and file previews are super clean. Great upgrade for cross-department syncs!',
        createdAt: '09:34 AM',
        reactions: { '💯': { emoji: '💯', count: 2, users: ['1', 'user'] } },
      },
      {
        id: 'reply-2',
        channelId: 'ch-general',
        senderId: '3',
        senderName: 'Elena Rostova',
        senderAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        senderRole: 'Lead Product Designer',
        content: 'We just moved all UI review notes into #design-system as well.',
        createdAt: '09:41 AM',
      },
      {
        id: 'reply-3',
        channelId: 'ch-general',
        senderId: '1',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        senderRole: 'HR Director',
        content: 'Awesome! Let me know if any department needs a dedicated private room.',
        createdAt: '09:45 AM',
      },
    ],
  },
  {
    id: 'msg-2',
    channelId: 'ch-general',
    senderId: '2',
    senderName: 'James Mwangi',
    senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    senderRole: 'Senior Software Engineer',
    content: "Quick update for the Q4 product release: @Sarah Johnson and I finalized the shift scheduling & timesheet movement logs. Please review the latest build before Friday's demo.",
    createdAt: '10:18 AM',
    reactions: {
      '🔥': { emoji: '🔥', count: 3, users: ['1', '3', 'user'] },
      '✅': { emoji: '✅', count: 2, users: ['1', '4'] },
    },
    replyCount: 1,
    replies: [
      {
        id: 'reply-4',
        channelId: 'ch-general',
        senderId: '1',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        senderRole: 'HR Director',
        content: 'Reviewed and verified! The punch movement breakdown on the timesheet looks spot on.',
        createdAt: '10:24 AM',
      },
    ],
  },
  {
    id: 'msg-3',
    channelId: 'ch-general',
    senderId: '3',
    senderName: 'Elena Rostova',
    senderAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    senderRole: 'Lead Product Designer',
    content: "Here is the updated workspace architecture & design system preview for the upcoming sprint.",
    createdAt: '11:05 AM',
    attachments: [
      {
        id: 'att-1',
        name: 'workspace-architecture-v2.png',
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=900&q=80',
        type: 'image',
        size: '1.4 MB',
      },
      {
        id: 'att-2',
        name: 'q4-product-walkthrough.mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        type: 'video',
        size: '4.2 MB',
      },
    ],
    reactions: { '❤️': { emoji: '❤️', count: 4, users: ['1', '2', 'user', '4'] } },
    replyCount: 0,
    replies: [],
  },
  {
    id: 'msg-4',
    channelId: 'ch-design',
    senderId: '3',
    senderName: 'Elena Rostova',
    senderAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    senderRole: 'Lead Product Designer',
    content: "Updated typography tokens: Fraunces for display headings and Questrial/Gilroy geometric sans for clean body readability.",
    createdAt: '11:15 AM',
    pinned: true,
    reactions: { '✨': { emoji: '✨', count: 3, users: ['1', '2', 'user'] } },
    replyCount: 1,
    replies: [
      {
        id: 'reply-5',
        channelId: 'ch-design',
        senderId: '1',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        senderRole: 'HR Director',
        content: 'Much cleaner and super legible across all dashboard cards.',
        createdAt: '11:20 AM',
      },
    ],
  },
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isHRAdmin } = useRole();
  const { getToken, isSignedIn } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>(DEFAULT_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-general');
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>(initialEmployees);

  // Fetch real company employees and merge with initialEmployees fallback
  useEffect(() => {
    let isMounted = true;
    async function loadEmployees() {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/employees`, {
          credentials: 'omit',
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || [];
          if (isMounted && list.length > 0) {
            const mapped: Employee[] = list.map((e: any) => ({
              id: String(e.id || e._id),
              firstName: e.firstName || e.first_name || 'Team',
              lastName: e.lastName || e.last_name || 'Member',
              email: e.email || '',
              phone: e.phone || '',
              title: e.jobTitle || e.title || e.role || 'Team Member',
              department: e.department?.name || e.department || 'General',
              location: e.location || e.workLocation || 'Headquarters',
              status: 'Active',
              startDate: e.hireDate || e.startDate || '2025-01-01',
              avatar: e.avatarUrl || e.avatar || '',
              salary: e.salary || 0,
            }));
            // Combine mapped real employees with initialEmployees so seeded messages always resolve avatars/profiles
            const existingIds = new Set(mapped.map((m) => String(m.id)));
            const combined = [
              ...mapped,
              ...initialEmployees.filter((ie) => !existingIds.has(String(ie.id))),
            ];
            setAllEmployees(combined);
          }
        }
      } catch {
        // Fallback to initialEmployees silently
      }
    }
    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, [isSignedIn, getToken]);

  // Load from local storage
  useEffect(() => {
    try {
      const savedChannels = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (savedChannels) {
        const parsed = JSON.parse(savedChannels);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChannels(parsed);
        }
      }
      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) {
        const parsedMsg = JSON.parse(savedMessages);
        if (Array.isArray(parsedMsg) && parsedMsg.length > 0) {
          setAllMessages(parsedMsg);
        }
      }
    } catch {}
  }, []);

  // Ensure currentUser.id is always a member of public channels (and HR Admin is in default channels)
  useEffect(() => {
    if (!currentUser?.id) return;
    const myId = String(currentUser.id);
    setChannels((prev) =>
      prev.map((ch) => {
        if (!ch.isPrivate && !ch.departmentRestricted) {
          if (!ch.memberIds.includes(myId)) {
            return { ...ch, memberIds: [...ch.memberIds, myId] };
          }
        }
        if ((ch.id === 'ch-design' || ch.id === 'ch-people-ops') && !ch.memberIds.includes(myId)) {
          return { ...ch, memberIds: [...ch.memberIds, myId] };
        }
        return ch;
      })
    );
  }, [currentUser?.id, isHRAdmin]);

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
    } catch {}
  }, [channels]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMessages));
    } catch {}
  }, [allMessages]);

  const handleSelectChannel = useCallback((id: string) => {
    setActiveChannelId(id);
    setChannels((prev) =>
      prev.map((c) => (c.id === id && c.unreadCount ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) || channels[0] || null,
    [channels, activeChannelId]
  );

  const currentChannelMessages = useMemo(
    () => allMessages.filter((m) => m.channelId === activeChannelId),
    [allMessages, activeChannelId]
  );

  // Send message or reply
  const sendMessage = useCallback(
    (content: string, attachments?: ChatAttachment[], threadParentId?: string) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;

      const myId = String(currentUser?.id || 'user');
      const myName = `${currentUser?.firstName || 'User'} ${currentUser?.lastName || ''}`.trim();
      const myAvatar = currentUser?.avatar || '';

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        channelId: activeChannelId,
        senderId: myId,
        senderName: myName,
        senderAvatar: myAvatar,
        senderRole: currentUser?.title || 'Team Member',
        content,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: attachments || [],
        reactions: {},
        replyCount: 0,
        replies: [],
      };

      if (threadParentId) {
        setAllMessages((prev) =>
          prev.map((m) => {
            if (m.id === threadParentId) {
              const updatedReplies = [...(m.replies || []), newMsg];
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
        setAllMessages((prev) => [...prev, newMsg]);
      }
    },
    [activeChannelId, currentUser, activeThread]
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId: string, threadParentId?: string) => {
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
    },
    [activeThread]
  );

  // Pin or unpin message
  const togglePinMessage = useCallback((messageId: string) => {
    setAllMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m))
    );
  }, []);

  // Toggle reaction emoji
  const toggleReaction = useCallback(
    (messageId: string, emoji: string, threadParentId?: string) => {
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
          prev.map((m) => {
            if (m.id === messageId) {
              const updated = { ...m, reactions: updateReactions(m.reactions) };
              if (activeThread?.id === messageId) {
                setActiveThread(updated);
              }
              return updated;
            }
            return m;
          })
        );
      }
    },
    [currentUser, activeThread]
  );

  // Create channel
  const createChannel = useCallback(
    (input: {
      name: string;
      description?: string;
      isPrivate: boolean;
      departmentRestricted: boolean;
      department?: string;
      memberIds?: string[];
    }): ChatChannel => {
      const myId = String(currentUser?.id || 'user');
      const myName = `${currentUser?.firstName || 'User'} ${currentUser?.lastName || ''}`.trim();

      const newChan: ChatChannel = {
        id: `ch-${Date.now()}`,
        name: input.name.toLowerCase().replace(/\s+/g, '-'),
        description: input.description || '',
        topic: input.description || `Team collaboration in #${input.name.toLowerCase().replace(/\s+/g, '-')}`,
        isPrivate: input.isPrivate,
        departmentRestricted: input.departmentRestricted,
        department: input.department,
        createdById: myId,
        createdBy: myName,
        createdAt: new Date().toISOString(),
        adminIds: [myId],
        memberIds: Array.from(new Set([myId, ...(input.memberIds || [])])),
        pendingRequestUserIds: [],
      };

      setChannels((prev) => [...prev, newChan]);
      setActiveChannelId(newChan.id);
      return newChan;
    },
    [currentUser]
  );

  // Request to join a private/department channel
  const requestToJoinChannel = useCallback(
    (channelId: string) => {
      const myId = String(currentUser?.id || 'user');
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === channelId && !c.memberIds.includes(myId) && !c.pendingRequestUserIds.includes(myId)) {
            return {
              ...c,
              pendingRequestUserIds: [...c.pendingRequestUserIds, myId],
            };
          }
          return c;
        })
      );
    },
    [currentUser]
  );

  // Approve join request (Channel admin only)
  const approveJoinRequest = useCallback((channelId: string, userId: string) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            pendingRequestUserIds: c.pendingRequestUserIds.filter((u) => u !== userId),
            memberIds: Array.from(new Set([...c.memberIds, userId])),
          };
        }
        return c;
      })
    );
  }, []);

  // Reject join request
  const rejectJoinRequest = useCallback((channelId: string, userId: string) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            pendingRequestUserIds: c.pendingRequestUserIds.filter((u) => u !== userId),
          };
        }
        return c;
      })
    );
  }, []);

  // Add member directly
  const addMemberToChannel = useCallback((channelId: string, userId: string) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId && !c.memberIds.includes(userId)) {
          return {
            ...c,
            memberIds: [...c.memberIds, userId],
            pendingRequestUserIds: c.pendingRequestUserIds.filter((u) => u !== userId),
          };
        }
        return c;
      })
    );
  }, []);

  // Remove member
  const removeMemberFromChannel = useCallback((channelId: string, userId: string) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            memberIds: c.memberIds.filter((m) => m !== userId),
            adminIds: c.adminIds.filter((a) => a !== userId),
          };
        }
        return c;
      })
    );
  }, []);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      const myName = currentUser?.firstName || 'Someone';
      if (isTyping) {
        if (!typingUsers.includes(myName)) {
          setTypingUsers((prev) => [...prev, myName]);
        }
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== myName));
      }
    },
    [currentUser, typingUsers]
  );

  return (
    <ChatContext.Provider
      value={{
        channels,
        activeChannel,
        setActiveChannelId: handleSelectChannel,
        messages: currentChannelMessages,
        allMessages,
        activeThread,
        setActiveThread,
        sendMessage,
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
