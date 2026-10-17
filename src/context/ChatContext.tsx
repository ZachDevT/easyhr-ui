"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { useCompany } from '@/context/CompanyContext';
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
  type: 'image' | 'file';
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
  name: string; // e.g. "general", "design", "engineering"
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
  iconEmoji?: string;
}

interface ChatContextType {
  channels: ChatChannel[];
  activeChannel: ChatChannel | null;
  setActiveChannelId: (id: string) => void;
  messages: ChatMessage[];
  activeThread: ChatMessage | null;
  setActiveThread: (msg: ChatMessage | null) => void;
  sendMessage: (content: string, attachments?: ChatAttachment[], threadParentId?: string) => void;
  deleteMessage: (messageId: string, threadParentId?: string) => void;
  toggleReaction: (messageId: string, emoji: string, threadParentId?: string) => void;
  createChannel: (input: {
    name: string;
    description?: string;
    isPrivate: boolean;
    departmentRestricted: boolean;
    department?: string;
    memberIds?: string[];
    iconEmoji?: string;
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

const STORAGE_KEY_CHANNELS = 'easyhr_chat_channels_v2';
const STORAGE_KEY_MESSAGES = 'easyhr_chat_messages_v2';

const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'ch-general',
    name: 'general',
    topic: 'Company-wide updates, watercooler discussions & announcements',
    description: 'The open square for the entire company.',
    isPrivate: false,
    departmentRestricted: false,
    createdById: '1',
    createdBy: 'Sarah Johnson',
    createdAt: '2026-01-01T08:00:00Z',
    adminIds: ['1', 'user'],
    memberIds: ['1', '2', '3', '4', '5', '6', '7', '8', 'user'],
    pendingRequestUserIds: [],
    iconEmoji: '🌍',
  },
  {
    id: 'ch-design',
    name: 'design-system',
    topic: 'Product UI/UX design, Figma updates, design token critiques',
    description: 'All things creative, typography, components, and user experience.',
    isPrivate: false,
    departmentRestricted: true,
    department: 'Design',
    createdById: '1',
    createdBy: 'Sarah Johnson',
    createdAt: '2026-01-05T09:30:00Z',
    adminIds: ['1'],
    memberIds: ['1', '2', '4', 'user'],
    pendingRequestUserIds: [],
    iconEmoji: '🎨',
  },
  {
    id: 'ch-engineering',
    name: 'engineering',
    topic: 'Sprint commits, architectural decisions, PR reviews, CI/CD alerts',
    description: 'Technical discussions and system engineering.',
    isPrivate: true,
    departmentRestricted: true,
    department: 'Engineering',
    createdById: '2',
    createdBy: 'James Mwangi',
    createdAt: '2026-01-10T11:00:00Z',
    adminIds: ['2'],
    memberIds: ['2', '3', 'user'],
    pendingRequestUserIds: ['5'],
    iconEmoji: '⚡',
  },
  {
    id: 'ch-leadership',
    name: 'leadership-private',
    topic: 'Quarterly OKRs, compensation reviews, company strategy',
    description: 'Confidential executive room.',
    isPrivate: true,
    departmentRestricted: false,
    createdById: '1',
    createdBy: 'Sarah Johnson',
    createdAt: '2026-01-02T10:00:00Z',
    adminIds: ['1'],
    memberIds: ['1'],
    pendingRequestUserIds: [],
    iconEmoji: '🔒',
  },
  {
    id: 'ch-random',
    name: 'random-memes',
    topic: 'Music recommendations, pet photos, memes, weekend plans',
    description: 'Non-work fun and celebrations.',
    isPrivate: false,
    departmentRestricted: false,
    createdById: '3',
    createdBy: 'Amina Abdi',
    createdAt: '2026-01-12T14:20:00Z',
    adminIds: ['3'],
    memberIds: ['1', '2', '3', '4', 'user'],
    pendingRequestUserIds: [],
    iconEmoji: '🎉',
  },
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'ch-general',
    senderId: '1',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    senderRole: 'HR Administrator',
    content: "Welcome everyone to our new unified EasyHR Team Chat! 🎉 Threads, file sharing, and department channels are fully live.",
    createdAt: '10:00 AM',
    reactions: {
      '🚀': { emoji: '🚀', count: 4, users: ['2', '3', '4', 'user'] },
      '❤️': { emoji: '❤️', count: 3, users: ['2', 'user', '5'] },
    },
    replyCount: 2,
    replies: [
      {
        id: 'reply-1',
        channelId: 'ch-general',
        senderId: '2',
        senderName: 'James Mwangi',
        senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        senderRole: 'Software Engineer',
        content: 'This is super smooth! Love the Slack-style thread drawer.',
        createdAt: '10:04 AM',
        reactions: { '💯': { emoji: '💯', count: 2, users: ['1', 'user'] } },
      },
      {
        id: 'reply-2',
        channelId: 'ch-general',
        senderId: 'user',
        senderName: 'Me',
        senderAvatar: '',
        senderRole: 'Employee',
        content: 'Agreed, love having all project threads right next to our HR operations.',
        createdAt: '10:15 AM',
      },
    ],
  },
  {
    id: 'msg-2',
    channelId: 'ch-general',
    senderId: '2',
    senderName: 'James Mwangi',
    senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    senderRole: 'Software Engineer',
    content: "Quick reminder for the product launch: please review the updated Figma flow and drop feedback in the #design-system channel.",
    createdAt: '10:32 AM',
    reactions: { '👀': { emoji: '👀', count: 3, users: ['1', '3', 'user'] } },
    replyCount: 0,
    replies: [],
  },
  {
    id: 'msg-3',
    channelId: 'ch-design',
    senderId: '1',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    senderRole: 'HR Administrator',
    content: "Here is the updated design token guide for modern people operations! Check the card border-radii and contrast ratios.",
    createdAt: '11:15 AM',
    attachments: [
      {
        id: 'att-1',
        name: 'design-tokens-v2.png',
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
        type: 'image',
        size: '1.2 MB',
      },
    ],
    reactions: { '🔥': { emoji: '🔥', count: 3, users: ['2', 'user', '4'] } },
    replyCount: 1,
    replies: [
      {
        id: 'reply-3',
        channelId: 'ch-design',
        senderId: 'user',
        senderName: 'Me',
        senderAvatar: '',
        content: 'Colors look crisp and super readable.',
        createdAt: '11:20 AM',
      },
    ],
  },
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isHRAdmin } = useRole();
  const [channels, setChannels] = useState<ChatChannel[]>(DEFAULT_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-general');
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Load from local storage
  useEffect(() => {
    try {
      const savedChannels = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (savedChannels) {
        setChannels(JSON.parse(savedChannels));
      }
      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) {
        setAllMessages(JSON.parse(savedMessages));
      }
    } catch {}
  }, []);

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

      const myId = currentUser?.id || 'user';
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
        // Appending reply to thread parent
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
        // Top level channel message
        setAllMessages((prev) => [...prev, newMsg]);
      }
    },
    [activeChannelId, currentUser, activeThread]
  );

  // Delete message
  const deleteMessage = useCallback((messageId: string, threadParentId?: string) => {
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
  }, [activeThread]);

  // Toggle reaction emoji
  const toggleReaction = useCallback(
    (messageId: string, emoji: string, threadParentId?: string) => {
      const myId = currentUser?.id || 'user';

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
      iconEmoji?: string;
    }): ChatChannel => {
      const myId = currentUser?.id || 'user';
      const myName = `${currentUser?.firstName || 'User'} ${currentUser?.lastName || ''}`.trim();

      const newChan: ChatChannel = {
        id: `ch-${Date.now()}`,
        name: input.name.toLowerCase().replace(/\s+/g, '-'),
        description: input.description || '',
        topic: input.description || `Discussion in #${input.name}`,
        isPrivate: input.isPrivate,
        departmentRestricted: input.departmentRestricted,
        department: input.department,
        createdById: myId,
        createdBy: myName,
        createdAt: new Date().toISOString(),
        adminIds: [myId],
        memberIds: Array.from(new Set([myId, ...(input.memberIds || [])])),
        pendingRequestUserIds: [],
        iconEmoji: input.iconEmoji || (input.isPrivate ? '🔒' : '💬'),
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
      const myId = currentUser?.id || 'user';
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
        setActiveChannelId,
        messages: currentChannelMessages,
        activeThread,
        setActiveThread,
        sendMessage,
        deleteMessage,
        toggleReaction,
        createChannel,
        requestToJoinChannel,
        approveJoinRequest,
        rejectJoinRequest,
        addMemberToChannel,
        removeMemberFromChannel,
        typingUsers,
        setTyping,
        allEmployees: initialEmployees,
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
