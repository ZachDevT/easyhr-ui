"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Hash,
  Lock,
  Search,
  Plus,
  Send,
  Smile,
  Paperclip,
  MessageSquare,
  MessagesSquare,
  Heart,
  Trash2,
  Users,
  UserPlus,
  Check,
  X,
  AtSign,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Pin,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ExternalLink,
  Download,
  FileText,
  Maximize2,
  Play,
  Bold,
  Italic,
  Strikethrough,
  Code,
  FileCode,
  List,
  ListOrdered,
  Quote,
  Link2,
  BarChart2,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useChat, ChatPoll } from '@/context/ChatContext';
import { useRole } from '@/context/RoleContext';
import { useCompany } from '@/context/CompanyContext';
import { Employee } from '@/data/employees';
import { CreateChannelModal } from '@/components/chat/CreateChannelModal';
import { StartDMModal } from '@/components/chat/StartDMModal';
import { ThreadDrawer } from '@/components/chat/ThreadDrawer';
import { EmojiGifPicker, PickerTab } from '@/components/chat/EmojiGifPicker';
import { MediaLightbox, LightboxMediaItem } from '@/components/chat/MediaLightbox';
import { RichMessageContent, PollCard } from '@/components/chat/RichMessageContent';
import { WysiwygChatEditor, WysiwygEditorRef } from '@/components/chat/WysiwygChatEditor';
import { GifIcon, AnimatedEmojiIcon } from '@/components/chat/ChatCustomIcons';
import {
  requestNotificationPermission,
  playNotificationSound,
  showDesktopNotification,
} from '@/utils/chatSound';
import { downloadChatAttachment } from '@/utils/chatMedia';

export default function GroupChatPage() {
  const {
    channels,
    activeChannel,
    setActiveChannelId,
    messages,
    allMessages,
    activeThread,
    setActiveThread,
    isLoadingChannels,
    isLoadingMessages,
    sendMessage,
    retrySendMessage,
    deleteMessage,
    togglePinMessage,
    toggleReaction,
    votePoll,
    closePoll,
    requestToJoinChannel,
    approveJoinRequest,
    rejectJoinRequest,
    addMemberToChannel,
    removeMemberFromChannel,
    openOrCreateDM,
    typingUsers,
    setTyping,
    allEmployees,
    uploadAttachment,
  } = useChat();

  const { currentUser, role, isHRAdmin } = useRole();
  const { company } = useCompany();

  // Role & Ownership check
  const roleStr = String(role || '').toLowerCase();
  const isOwnerOrAdmin =
    Boolean(isHRAdmin) ||
    roleStr.includes('hr') ||
    roleStr === 'company_owner' ||
    roleStr === 'admin' ||
    roleStr === 'owner' ||
    roleStr === 'workspace_admin' ||
    String((currentUser as any)?.role || '').toLowerCase().includes('owner') ||
    String((currentUser as any)?.role || '').toLowerCase().includes('admin') ||
    String((currentUser as any)?.role || '').toLowerCase().includes('hr');

  // UI state
  const [inputText, setInputText] = useState('');
  const [searchChannelTerm, setSearchChannelTerm] = useState('');
  const [searchMessageTerm, setSearchMessageTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'threads' | 'pinned'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartDMModal, setShowStartDMModal] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState<'channels' | 'dms'>('channels');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>('emoji');
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMediaItem | null>(null);
  const [showMemberDrawer, setShowMemberDrawer] = useState(true);
  const [selectedProfileMember, setSelectedProfileMember] = useState<Employee | null>(null);
  const [showAddMemberInput, setShowAddMemberInput] = useState(false);
  const [memberFilterTerm, setMemberFilterTerm] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [showThreadsPopover, setShowThreadsPopover] = useState(false);

  // Desktop Notifications & Audio Chime state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [dismissedNotificationBanner, setDismissedNotificationBanner] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
      const dismissed = localStorage.getItem('easyhr_dismissed_chat_notifications');
      if (dismissed === 'true') {
        setDismissedNotificationBanner(true);
      }
      const soundPref = localStorage.getItem('easyhr_chat_sound_enabled');
      if (soundPref === 'false') {
        setSoundEnabled(false);
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    playNotificationSound('mention');
    if (perm === 'granted') {
      showDesktopNotification({
        title: '🔔 Desktop Notifications Active!',
        body: 'You will now receive sound alerts and notifications when tagged or replied to.',
      });
    }
  };

  const handleDismissNotificationBanner = () => {
    setDismissedNotificationBanner(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('easyhr_dismissed_chat_notifications', 'true');
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('easyhr_chat_sound_enabled', String(next));
    }
    if (next) {
      playNotificationSound('message');
    }
  };

  // Poll Builder state
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollAnonymous, setPollAnonymous] = useState(false);
  const [stagedPoll, setStagedPoll] = useState<ChatPoll | null>(null);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // Staged file attachments
  const [uploadedAttachments, setUploadedAttachments] = useState<
    {
      id: string;
      name: string;
      url: string;
      type: 'image' | 'video' | 'file';
      size?: string;
    }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const pendingUnreadCountRef = useRef<number>(0);
  const prevChannelIdRef = useRef<string>('');
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<WysiwygEditorRef>(null);

  // Identify first unread message when opening a channel with unread messages
  useEffect(() => {
    if (!activeChannel) return;
    if (activeChannel.id !== prevChannelIdRef.current) {
      prevChannelIdRef.current = activeChannel.id;
      const count = pendingUnreadCountRef.current || activeChannel.unreadCount || 0;
      if (count > 0 && messages.length > 0) {
        const unreadIdx = Math.max(0, messages.length - count);
        const target = messages[unreadIdx];
        if (target) {
          setFirstUnreadMsgId(target.id);
          pendingUnreadCountRef.current = 0;
          return;
        }
      }
      setFirstUnreadMsgId(null);
      pendingUnreadCountRef.current = 0;
    }
  }, [activeChannel?.id, messages]);

  // Scroll to first unread message from top so user starts from unseen messages, otherwise scroll to latest
  useEffect(() => {
    if (firstUnreadMsgId && firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeChannel?.id, firstUnreadMsgId]);

  // Membership & permissions
  const currentUserId = String(currentUser?.id || 'user');
  const currentUserEmpId = (currentUser as any)?.employeeId ? String((currentUser as any).employeeId) : '';
  const isPublicChannel = activeChannel
    ? !activeChannel.isPrivate && !activeChannel.departmentRestricted
    : false;
  const isAnnouncementsChannel = activeChannel?.name.toLowerCase() === 'announcements';
  const isMember = activeChannel
    ? isPublicChannel ||
      isAnnouncementsChannel ||
      activeChannel.memberIds.includes(currentUserId) ||
      activeChannel.memberIds.includes('user') ||
      isOwnerOrAdmin
    : false;
  const isChannelAdmin = activeChannel
    ? activeChannel.adminIds.includes(currentUserId) ||
      activeChannel.adminIds.includes('user') ||
      isOwnerOrAdmin
    : false;
  const hasRequested = activeChannel
    ? activeChannel.pendingRequestUserIds.includes(currentUserId)
    : false;

  // Channel groupings
  const filteredChannels = useMemo(
    () =>
      channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(searchChannelTerm.toLowerCase()) ||
          (ch.department && ch.department.toLowerCase().includes(searchChannelTerm.toLowerCase()))
      ),
    [channels, searchChannelTerm]
  );

  const directMessageChannels = useMemo(
    () => filteredChannels.filter((c) => c.channelType === 'dm' || c.channelType === 'group_dm'),
    [filteredChannels]
  );

  const generalChannels = useMemo(
    () =>
      filteredChannels.filter(
        (c) =>
          !c.departmentRestricted &&
          c.channelType !== 'dm' &&
          c.channelType !== 'group_dm'
      ),
    [filteredChannels]
  );

  const departmentGroups = useMemo(() => {
    const groups: Record<string, typeof filteredChannels> = {};
    filteredChannels
      .filter(
        (c) =>
          c.departmentRestricted &&
          c.channelType !== 'dm' &&
          c.channelType !== 'group_dm'
      )
      .forEach((c) => {
        const dept = c.department || 'General';
        if (!groups[dept]) groups[dept] = [];
        groups[dept].push(c);
      });
    return groups;
  }, [filteredChannels]);

  // Helper to resolve DM participant info (name, avatar, title, presence)
  const getDMParticipant = (ch: typeof activeChannel) => {
    if (!ch) return null;
    const isGroup = ch.channelType === 'group_dm';
    const myId = String(currentUser?.id || '');
    const myEmpId = (currentUser as any)?.employeeId ? String((currentUser as any).employeeId) : '';

    const otherMemberIds = ch.memberIds.filter(
      (id) => id !== myId && id !== myEmpId && id !== 'user'
    );

    const otherEmployees = allEmployees.filter((emp) =>
      otherMemberIds.includes(String(emp.id))
    );

    if (otherEmployees.length === 0) {
      return {
        name: ch.name || 'DM',
        avatar: undefined,
        title: 'Coworker',
        department: '',
        isGroup,
        memberCount: ch.memberIds.length,
      };
    }

    if (isGroup || otherEmployees.length > 1) {
      return {
        name: otherEmployees.map((e) => e.firstName).join(', ') || ch.name,
        avatar: undefined,
        title: `${otherEmployees.length} participants`,
        department: '',
        isGroup: true,
        memberCount: otherEmployees.length,
      };
    }

    const target = otherEmployees[0];
    return {
      name: `${target.firstName} ${target.lastName}`.trim(),
      avatar: target.avatar,
      title: target.title || 'Team Member',
      department: target.department || '',
      isGroup: false,
      memberCount: 2,
      employee: target,
    };
  };

  const channelsTotalUnread = useMemo(
    () =>
      generalChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0) +
      Object.values(departmentGroups).flat().reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [generalChannels, departmentGroups]
  );

  const dmsTotalUnread = useMemo(
    () => directMessageChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [directMessageChannels]
  );

  // WhatsApp-style timestamp formatter
  const formatChatTimestamp = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

      if (isYesterday) {
        return 'Yesterday';
      }

      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // WhatsApp-style sorted DMs with latest message preview snippet and timestamp
  const sortedDirectMessageChannels = useMemo(() => {
    const list = directMessageChannels.map((ch) => {
      const chMsgs = allMessages.filter((m) => m.channelId === ch.id && !m.replyToId);
      const latest = chMsgs[chMsgs.length - 1];
      const timeStr = latest?.createdAt || ch.lastMessageAt || ch.createdAt || '';

      let snippet = 'Start a conversation';
      if (latest) {
        const isMe =
          latest.senderId === currentUserId ||
          (currentUserEmpId && latest.senderId === currentUserEmpId);
        const prefix = isMe ? 'You: ' : '';

        if (latest.content && latest.content.trim()) {
          snippet = `${prefix}${latest.content.replace(/<[^>]*>?/gm, '').trim()}`;
        } else if (latest.attachments && latest.attachments.length > 0) {
          const type = latest.attachments[0].type;
          snippet = `${prefix}${type === 'image' ? '📷 Photo' : '📎 Attachment'}`;
        } else if (latest.poll) {
          snippet = `${prefix}📊 Poll`;
        }
      }

      return {
        ...ch,
        latestTime: timeStr,
        previewSnippet: snippet,
      };
    });

    return list.sort((a, b) => new Date(b.latestTime).getTime() - new Date(a.latestTime).getTime());
  }, [directMessageChannels, allMessages, currentUserId, currentUserEmpId]);

  // Visible messages based on search + viewFilter
  const visibleMessages = useMemo(() => {
    let list = messages;
    if (viewFilter === 'threads') {
      const chThreads = messages.filter((m) => (m.replyCount || 0) > 0);
      list = chThreads.length > 0 ? chThreads : allMessages.filter((m) => (m.replyCount || 0) > 0);
    } else if (viewFilter === 'pinned') {
      list = list.filter((m) => m.pinned);
    }
    if (searchMessageTerm.trim()) {
      const q = searchMessageTerm.toLowerCase();
      list = list.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, allMessages, viewFilter, searchMessageTerm]);

  const threadedMessages = useMemo(
    () => messages.filter((m) => (m.replyCount || 0) > 0),
    [messages]
  );

  const allThreadedMessages = useMemo(
    () => allMessages.filter((m) => (m.replyCount || 0) > 0),
    [allMessages]
  );

  const pinnedCount = useMemo(
    () => messages.filter((m) => m.pinned).length,
    [messages]
  );

  // Resolve channel members list
  const channelMembers = useMemo(() => {
    if (!activeChannel) return [];
    if (!activeChannel.isPrivate && !activeChannel.departmentRestricted) {
      return allEmployees;
    }
    return allEmployees.filter((emp) =>
      activeChannel.memberIds.includes(String(emp.id))
    );
  }, [activeChannel, allEmployees]);

  const nonMembers = useMemo(() => {
    if (!activeChannel) return [];
    const memberSet = new Set(activeChannel.memberIds.map(String));
    return allEmployees.filter((e) => !memberSet.has(String(e.id)));
  }, [activeChannel, allEmployees]);

  // Handle @mention selection via live WYSIWYG editor
  const handleSelectMention = (empName: string) => {
    editorRef.current?.insertMention(empName);
    setMentionQuery(null);
  };

  const buildPollObject = (): ChatPoll | null => {
    const q = pollQuestion.trim();
    const validOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!q || validOpts.length < 2) return null;
    return {
      id: `poll-${Date.now()}`,
      question: q,
      options: validOpts.map((text, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text,
        voterIds: [],
      })),
      allowMultiple: pollAllowMultiple,
      anonymous: pollAnonymous,
      closed: false,
    };
  };

  const resetPollBuilder = () => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollAllowMultiple(false);
    setPollAnonymous(false);
    setShowPollBuilder(false);
  };

  const handleLaunchPollNow = () => {
    const newPoll = buildPollObject();
    if (!newPoll || !activeChannel) return;
    sendMessage(
      inputText.trim(),
      uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      undefined,
      newPoll
    );
    editorRef.current?.clear();
    setInputText('');
    setUploadedAttachments([]);
    setStagedPoll(null);
    resetPollBuilder();
    setTyping(false);
    setMentionQuery(null);
  };

  const handleStagePollInComposer = () => {
    const newPoll = buildPollObject();
    if (!newPoll) return;
    setStagedPoll(newPoll);
    resetPollBuilder();
    editorRef.current?.focus();
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && uploadedAttachments.length === 0 && !stagedPoll) return;
    if (!activeChannel) return;

    sendMessage(
      inputText.trim(),
      uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      undefined,
      stagedPoll || undefined
    );

    editorRef.current?.clear();
    setInputText('');
    setUploadedAttachments([]);
    setStagedPoll(null);
    setTyping(false);
    setMentionQuery(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const att = await uploadAttachment(file);
      if (att) {
        setUploadedAttachments((prev) => [...prev, att]);
      }
    }
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - var(--topbar-height, 64px))',
        width: '100%',
        overflow: 'hidden',
        background: '#FFFFFF',
        color: 'var(--text-1, #18181B)',
      }}
    >
      <style>{`
        @keyframes chatShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes chatSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* ═══════════════════════════════════════════════════════════════════════
          LEFT INNER SIDEBAR: Channels, Department Groups & Team Members
         ═══════════════════════════════════════════════════════════════════════ */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: '1px solid var(--card-border, #E4E4E7)',
          background: '#FAF9F7',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          userSelect: 'none',
        }}
      >
        {/* Workspace Header */}
        <div
          style={{
            height: 58,
            padding: '0 16px',
            borderBottom: '1px solid var(--card-border, #E4E4E7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'var(--text-1, #18181B)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {(company?.name || 'EasyHR').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  color: 'var(--text-1, #18181B)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {company?.name || 'EasyHR Workspace'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)' }}>
                {channels.length} channels · {allEmployees.length} members
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => (activeChatTab === 'dms' ? setShowStartDMModal(true) : setShowCreateModal(true))}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid var(--card-border, #E4E4E7)',
              background: '#FFFFFF',
              color: 'var(--text-1, #18181B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title={activeChatTab === 'dms' ? 'New DM' : 'Create new channel'}
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Primary Header Tabs: Channels vs DMs */}
        <div style={{ padding: '8px 12px 2px 12px' }}>
          <div
            style={{
              display: 'flex',
              background: '#F4F4F5',
              borderRadius: 10,
              padding: 3,
              gap: 2,
            }}
          >
            {/* Channels Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveChatTab('channels');
                if (activeChannel?.channelType === 'dm' || activeChannel?.channelType === 'group_dm') {
                  setActiveChannelId('');
                }
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 7,
                border: 'none',
                background: activeChatTab === 'channels' ? '#FFFFFF' : 'transparent',
                boxShadow: activeChatTab === 'channels' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                color: activeChatTab === 'channels' ? 'var(--text-1, #18181B)' : 'var(--text-3, #71717A)',
                fontWeight: activeChatTab === 'channels' ? 600 : 500,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Hash size={13} style={{ color: activeChatTab === 'channels' ? 'var(--primary)' : 'inherit' }} />
              <span>Channels</span>
              {channelsTotalUnread > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 999,
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  {channelsTotalUnread}
                </span>
              )}
            </button>

            {/* DMs Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveChatTab('dms');
                if (activeChannel && activeChannel.channelType !== 'dm' && activeChannel.channelType !== 'group_dm') {
                  setActiveChannelId('');
                }
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 7,
                border: 'none',
                background: activeChatTab === 'dms' ? '#FFFFFF' : 'transparent',
                boxShadow: activeChatTab === 'dms' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                color: activeChatTab === 'dms' ? 'var(--text-1, #18181B)' : 'var(--text-3, #71717A)',
                fontWeight: activeChatTab === 'dms' ? 600 : 500,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageSquare size={13} style={{ color: activeChatTab === 'dms' ? 'var(--primary)' : 'inherit' }} />
              <span>DMs</span>
              {dmsTotalUnread > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 999,
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  {dmsTotalUnread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Channel Filter Search */}
        <div style={{ padding: '8px 12px 6px 12px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3, #A1A1AA)',
              }}
            />
            <input
              type="text"
              placeholder={activeChatTab === 'dms' ? 'Search DMs...' : 'Jump to channel...'}
              value={searchChannelTerm}
              onChange={(e) => setSearchChannelTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                fontSize: 12,
                background: '#FFFFFF',
                border: '1px solid var(--card-border, #E4E4E7)',
                borderRadius: 9,
                outline: 'none',
                color: 'var(--text-1, #18181B)',
              }}
            />
          </div>
        </div>

        {activeChatTab === 'channels' ? (
          <>
            {/* Quick View Nav (All / Threads / Pinned) */}
            <div
              style={{
                padding: '4px 10px 10px 10px',
                borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setViewFilter('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: 8,
              border: 'none',
              background: viewFilter === 'all' ? '#FFFFFF' : 'transparent',
              boxShadow: viewFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
              color: viewFilter === 'all' ? 'var(--text-1, #18181B)' : 'var(--text-2, #52525B)',
              fontSize: 12.5,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hash size={14} style={{ color: 'var(--text-3, #A1A1AA)' }} />
              <span>All Messages</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewFilter('threads')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: 8,
              border: 'none',
              background: viewFilter === 'threads' ? '#FFFFFF' : 'transparent',
              boxShadow: viewFilter === 'threads' ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
              color: viewFilter === 'threads' ? 'var(--text-1, #18181B)' : 'var(--text-2, #52525B)',
              fontSize: 12.5,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={14} style={{ color: 'var(--text-3, #A1A1AA)' }} />
              <span>Thread Discussions</span>
            </span>
            {(threadedMessages.length > 0 || allThreadedMessages.length > 0) && (
              <span
                style={{
                  fontSize: 10.5,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: '#F4F4F5',
                  color: 'var(--text-2, #52525B)',
                }}
              >
                {threadedMessages.length > 0 ? threadedMessages.length : allThreadedMessages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewFilter('pinned')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: 8,
              border: 'none',
              background: viewFilter === 'pinned' ? '#FFFFFF' : 'transparent',
              boxShadow: viewFilter === 'pinned' ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
              color: viewFilter === 'pinned' ? 'var(--text-1, #18181B)' : 'var(--text-2, #52525B)',
              fontSize: 12.5,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pin size={14} style={{ color: 'var(--text-3, #A1A1AA)' }} />
              <span>Pinned Items</span>
            </span>
            {pinnedCount > 0 && (
              <span
                style={{
                  fontSize: 10.5,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: '#F4F4F5',
                  color: 'var(--text-2, #52525B)',
                }}
              >
                {pinnedCount}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Channels & Groups List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Channels Section */}
          <div>
            <div
              onClick={() => toggleSection('channels')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                marginBottom: 6,
                cursor: 'pointer',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-3, #A1A1AA)',
              }}
            >
              <span>Channels</span>
              {collapsedSections['channels'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </div>

            {!collapsedSections['channels'] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isLoadingChannels ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'chatShimmer 1.5s infinite',
                          }}
                        />
                        <div
                          style={{
                            width: `${55 + (i % 3) * 18}%`,
                            height: 12,
                            borderRadius: 4,
                            background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'chatShimmer 1.5s infinite',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  generalChannels.map((ch) => {
                    const isActive = activeChannel?.id === ch.id;
                    const canAccess =
                      !ch.isPrivate ||
                      ch.memberIds.includes(currentUserId) ||
                      ch.memberIds.includes('user') ||
                      isOwnerOrAdmin;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        const targetCh = channels.find((c) => c.id === ch.id);
                        pendingUnreadCountRef.current = targetCh?.unreadCount || 0;
                        setActiveChannelId(ch.id);
                        setActiveThread(null);
                        setViewFilter('all');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: 9,
                        border: isActive
                          ? '1px solid var(--card-border, #E4E4E7)'
                          : '1px solid transparent',
                        background: isActive ? '#FFFFFF' : 'transparent',
                        boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                        color: isActive ? 'var(--text-1, #18181B)' : 'var(--text-2, #52525B)',
                        fontSize: 13,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {ch.isPrivate ? (
                          <Lock
                            size={13.5}
                            style={{
                              color: isActive
                                ? 'var(--primary, #A238FF)'
                                : 'var(--text-3, #A1A1AA)',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <Hash
                            size={14}
                            style={{
                              color: isActive
                                ? 'var(--primary, #A238FF)'
                                : 'var(--text-3, #A1A1AA)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ch.name}
                        </span>
                      </span>

                      {ch.unreadCount && !isActive ? (
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: '1px 6px',
                            borderRadius: 999,
                            background: 'var(--primary, #A238FF)',
                            color: '#FFFFFF',
                          }}
                        >
                          {ch.unreadCount}
                        </span>
                      ) : !canAccess ? (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 6,
                            background: '#F4F4F5',
                            color: 'var(--text-3, #A1A1AA)',
                          }}
                        >
                          Private
                        </span>
                      ) : null}
                    </button>
                  );
                }))}

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-3, #A1A1AA)',
                    fontSize: 12,
                    cursor: 'pointer',
                    marginTop: 2,
                  }}
                >
                  <Plus size={13} />
                  <span>Add channels</span>
                </button>
              </div>
            )}
          </div>

          {/* Direct Messages Section */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                marginBottom: 6,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-3, #A1A1AA)',
              }}
            >
              <div
                onClick={() => toggleSection('direct_messages')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                <span>DMs</span>
                {directMessageChannels.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '1px 5px',
                      borderRadius: 10,
                      background: '#F4F4F5',
                      color: 'var(--text-2, #52525B)',
                    }}
                  >
                    {directMessageChannels.length}
                  </span>
                )}
                {collapsedSections['direct_messages'] ? (
                  <ChevronRight size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowStartDMModal(true)}
                title="Start a new DM"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-3, #A1A1AA)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
              </button>
            </div>

            {!collapsedSections['direct_messages'] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {directMessageChannels.map((ch) => {
                  const isActive = activeChannel?.id === ch.id;
                  const dmInfo = getDMParticipant(ch);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        const targetCh = channels.find((c) => c.id === ch.id);
                        pendingUnreadCountRef.current = targetCh?.unreadCount || 0;
                        setActiveChannelId(ch.id);
                        setActiveChatTab('dms');
                        setActiveThread(null);
                        setViewFilter('all');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: isActive
                          ? '1px solid var(--card-border, #E4E4E7)'
                          : '1px solid transparent',
                        background: isActive ? '#FFFFFF' : 'transparent',
                        boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                        color: isActive ? 'var(--text-1, #18181B)' : 'var(--text-2, #52525B)',
                        fontSize: 12.5,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Avatar or Group Icon with Presence dot */}
                        <span style={{ position: 'relative', flexShrink: 0 }}>
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              overflow: 'hidden',
                              color: 'var(--text-1, #18181B)',
                            }}
                          >
                            {dmInfo?.avatar ? (
                              <img
                                src={dmInfo.avatar}
                                alt={dmInfo.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : dmInfo?.isGroup ? (
                              <Users size={11} style={{ color: 'var(--primary, #A238FF)' }} />
                            ) : (
                              (dmInfo?.name || 'DM').slice(0, 2).toUpperCase()
                            )}
                          </span>
                          {!dmInfo?.isGroup && (
                            <span
                              style={{
                                position: 'absolute',
                                right: -1,
                                bottom: -1,
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#10B981',
                                border: '1.5px solid #FAF9F7',
                              }}
                            />
                          )}
                        </span>

                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {dmInfo?.name}
                        </span>
                      </span>

                      {ch.unreadCount && !isActive ? (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 999,
                            background: 'var(--primary, #A238FF)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                          }}
                        >
                          {ch.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowStartDMModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-3, #A1A1AA)',
                    fontSize: 12,
                    cursor: 'pointer',
                    marginTop: 2,
                  }}
                >
                  <Plus size={13} />
                  <span>Start a DM</span>
                </button>
              </div>
            )}
          </div>

          {/* Department Groups Section */}
          <div>
            <div
              onClick={() => toggleSection('groups')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                marginBottom: 8,
                cursor: 'pointer',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-3, #A1A1AA)',
              }}
            >
              <span>Department Groups</span>
              {collapsedSections['groups'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </div>

            {!collapsedSections['groups'] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isLoadingChannels ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'chatShimmer 1.5s infinite',
                          }}
                        />
                        <div
                          style={{
                            width: `${50 + (i % 3) * 20}%`,
                            height: 12,
                            borderRadius: 4,
                            background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'chatShimmer 1.5s infinite',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  Object.entries(departmentGroups).map(([deptName, deptChans]) => {
                    const deptTotalUnread = deptChans.reduce((sum, c) => (c.id === activeChannel?.id ? sum : sum + (c.unreadCount || 0)), 0);
                    return (
                      <div key={deptName}>
                        {/* Department Group Header */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            padding: '4px 8px',
                            fontSize: 12,
                            color: 'var(--text-1, #18181B)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                            <span
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                background: '#FFFFFF',
                                border: '1px solid var(--card-border, #E4E4E7)',
                                color: 'var(--text-1, #18181B)',
                                fontSize: 10.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {deptName.slice(0, 1).toUpperCase()}
                            </span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {deptName}
                            </span>
                          </div>

                          {deptTotalUnread > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 999,
                                background: 'var(--primary, #A238FF)',
                                color: '#FFFFFF',
                                fontWeight: 700,
                              }}
                            >
                              {deptTotalUnread}
                            </span>
                          )}
                        </div>

                        {/* Nested Department Channels */}
                        <div
                          style={{
                            marginLeft: 17,
                            paddingLeft: 10,
                            borderLeft: '1px solid var(--card-border, #E4E4E7)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            marginTop: 2,
                          }}
                        >
                          {deptChans.map((ch) => {
                            const isActive = activeChannel?.id === ch.id;
                            const isUserMember =
                              ch.memberIds.includes(currentUserId) ||
                              ch.memberIds.includes('user') ||
                              isOwnerOrAdmin;
                            return (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() => {
                                  setActiveChannelId(ch.id);
                                  setActiveThread(null);
                                  setViewFilter('all');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  padding: '6px 8px',
                                  borderRadius: 8,
                                  border: isActive
                                    ? '1px solid var(--card-border, #E4E4E7)'
                                    : '1px solid transparent',
                                  background: isActive ? '#FFFFFF' : 'transparent',
                                  color: isActive
                                    ? 'var(--text-1, #18181B)'
                                    : 'var(--text-2, #52525B)',
                                  fontSize: 12.5,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {ch.isPrivate ? (
                                    <Lock
                                      size={12.5}
                                      style={{
                                        color: isActive
                                          ? 'var(--primary, #A238FF)'
                                          : 'var(--text-3, #A1A1AA)',
                                        flexShrink: 0,
                                      }}
                                    />
                                  ) : (
                                    <Hash
                                      size={13}
                                      style={{
                                        color: isActive
                                          ? 'var(--primary, #A238FF)'
                                          : 'var(--text-3, #A1A1AA)',
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                  <span
                                    style={{
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {ch.name}
                                  </span>
                                </span>

                                {ch.unreadCount && !isActive ? (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      padding: '1px 6px',
                                      borderRadius: 999,
                                      background: 'var(--primary, #A238FF)',
                                      color: '#FFFFFF',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {ch.unreadCount}
                                  </span>
                                ) : !isUserMember ? (
                                  <Lock size={11} style={{ color: 'var(--text-3, #A1A1AA)', flexShrink: 0 }} />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }))}
              </div>
            )}
          </div>

          {/* Team Members Section */}
          <div>
            <div
              onClick={() => toggleSection('members')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                marginBottom: 6,
                cursor: 'pointer',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-3, #A1A1AA)',
              }}
            >
              <span>Team Members</span>
              {collapsedSections['members'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </div>

            {!collapsedSections['members'] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {allEmployees.slice(0, 6).map((emp) => {
                  const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                  const isSelectedProfile = selectedProfileMember?.id === emp.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setSelectedProfileMember(emp);
                        setActiveThread(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: 'none',
                        background: isSelectedProfile ? '#FFFFFF' : 'transparent',
                        color: 'var(--text-1, #18181B)',
                        fontSize: 12.5,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ position: 'relative', flexShrink: 0 }}>
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              overflow: 'hidden',
                            }}
                          >
                            {emp.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={fullName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              fullName.slice(0, 2).toUpperCase()
                            )}
                          </span>
                          <span
                            style={{
                              position: 'absolute',
                              right: -1,
                              bottom: -1,
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: '#10B981',
                              border: '1.5px solid #FAF9F7',
                            }}
                          />
                        </span>
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {fullName}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    ) : (
      <>
            {/* WhatsApp-Style Recent Chats List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 8px 6px 8px',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-3, #71717A)',
                    fontWeight: 600,
                  }}
                >
                  Recent Chats ({sortedDirectMessageChannels.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowStartDMModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 7px',
                    borderRadius: 6,
                    border: '1px solid var(--card-border, #E4E4E7)',
                    background: '#FFFFFF',
                    color: 'var(--text-2, #52525B)',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  title="New DM"
                >
                  <Plus size={11} />
                  <span>New DM</span>
                </button>
              </div>

              {sortedDirectMessageChannels.length === 0 ? (
                <div
                  style={{
                    padding: '36px 14px',
                    textAlign: 'center',
                    color: 'var(--text-3, #71717A)',
                    fontSize: 12,
                  }}
                >
                  <p style={{ margin: '0 0 10px 0' }}>No DMs yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowStartDMModal(true)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 7,
                      border: 'none',
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Start a DM
                  </button>
                </div>
              ) : (
                sortedDirectMessageChannels.map((ch) => {
                  const isActive = activeChannel?.id === ch.id;
                  const dmInfo = getDMParticipant(ch);
                  const lastTime = formatChatTimestamp(ch.latestTime);

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        const targetCh = channels.find((c) => c.id === ch.id);
                        pendingUnreadCountRef.current = targetCh?.unreadCount || 0;
                        setActiveChannelId(ch.id);
                        setActiveChatTab('dms');
                        setActiveThread(null);
                        setViewFilter('all');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 9px',
                        borderRadius: 9,
                        border: isActive
                          ? '1px solid var(--card-border, #E4E4E7)'
                          : '1px solid transparent',
                        background: isActive ? '#FFFFFF' : 'transparent',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <span style={{ position: 'relative', flexShrink: 0 }}>
                        <span
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#FAF9F7',
                            border: '1px solid var(--card-border, #E4E4E7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            overflow: 'hidden',
                            color: 'var(--text-1, #18181B)',
                          }}
                        >
                          {dmInfo?.avatar ? (
                            <img
                              src={dmInfo.avatar}
                              alt={dmInfo.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : dmInfo?.isGroup ? (
                            <Users size={15} style={{ color: 'var(--text-2, #52525B)' }} />
                          ) : (
                            (dmInfo?.name || 'DM').slice(0, 2).toUpperCase()
                          )}
                        </span>
                        {!dmInfo?.isGroup && (
                          <span
                            style={{
                              position: 'absolute',
                              right: 0,
                              bottom: 0,
                              width: 8.5,
                              height: 8.5,
                              borderRadius: '50%',
                              background: '#10B981',
                              border: '1.5px solid #FFFFFF',
                            }}
                          />
                        )}
                      </span>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: ch.unreadCount && !isActive ? 700 : (isActive ? 600 : 500),
                              color: 'var(--text-1, #18181B)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {dmInfo?.name || ch.name}
                          </span>
                          {lastTime && (
                            <span
                              style={{
                                fontSize: 10.5,
                                color: ch.unreadCount && !isActive ? 'var(--primary)' : 'var(--text-3, #71717A)',
                                fontWeight: ch.unreadCount && !isActive ? 600 : 400,
                                flexShrink: 0,
                              }}
                            >
                              {lastTime}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11.5,
                              color: ch.unreadCount && !isActive ? 'var(--text-1, #18181B)' : 'var(--text-3, #71717A)',
                              fontWeight: ch.unreadCount && !isActive ? 500 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {ch.previewSnippet}
                          </span>

                          {ch.unreadCount && !isActive ? (
                            <span
                              style={{
                                minWidth: 16,
                                height: 16,
                                padding: '0 5px',
                                borderRadius: 999,
                                background: 'var(--primary)',
                                color: '#FFFFFF',
                                fontSize: 10,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {ch.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Bottom Create New Button */}
        <div
          style={{
            padding: 12,
            borderTop: '1px solid var(--card-border, #E4E4E7)',
            background: '#FAF9F7',
          }}
        >
          <button
            type="button"
            onClick={() => (activeChatTab === 'dms' ? setShowStartDMModal(true) : setShowCreateModal(true))}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid var(--card-border, #E4E4E7)',
              background: '#FFFFFF',
              color: 'var(--text-1, #18181B)',
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <Plus size={14} />
            <span>{activeChatTab === 'dms' ? 'New DM' : 'Create Channel'}</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          CENTER: Active Channel Canvas
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: '#FFFFFF',
          height: '100%',
        }}
      >
        {activeChannel ? (
          <>
            {/* Top Channel Bar */}
            <div
              style={{
                height: 48,
                padding: '0 16px',
                borderBottom: '1px solid var(--card-border, #E4E4E7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                background: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {/* Left: Channel Breadcrumb & Topic or DM User Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                {activeChannel.channelType === 'dm' || activeChannel.channelType === 'group_dm' ? (
                  (() => {
                    const dmInfo = getDMParticipant(activeChannel);
                    return (
                      <>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#FAF9F7',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--text-1, #18181B)',
                              overflow: 'hidden',
                            }}
                          >
                            {dmInfo?.avatar ? (
                              <img
                                src={dmInfo.avatar}
                                alt={dmInfo.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : dmInfo?.isGroup ? (
                              <Users size={15} style={{ color: 'var(--primary, #A238FF)' }} />
                            ) : (
                              (dmInfo?.name || 'DM').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          {!dmInfo?.isGroup && (
                            <span
                              style={{
                                position: 'absolute',
                                right: 0,
                                bottom: 0,
                                width: 8.5,
                                height: 8.5,
                                borderRadius: '50%',
                                background: '#10B981',
                                border: '2px solid #FFFFFF',
                              }}
                            />
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              color: 'var(--text-1, #18181B)',
                              fontFamily: 'var(--font-title)',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.25,
                            }}
                          >
                            {dmInfo?.name}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-3, #A1A1AA)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginTop: 1,
                            }}
                          >
                            <span>{dmInfo?.title || 'Coworker'}</span>
                            {dmInfo?.department && (
                              <>
                                <span>·</span>
                                <span>{dmInfo.department}</span>
                              </>
                            )}
                            {!dmInfo?.isGroup && (
                              <>
                                <span>·</span>
                                <span style={{ color: '#059669', fontWeight: 500 }}>Active</span>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        background: '#FAF9F7',
                        border: '1px solid var(--card-border, #E4E4E7)',
                        color: 'var(--text-1, #18181B)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {activeChannel.isPrivate ? <Lock size={14} /> : <Hash size={15} />}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {activeChannel.department && (
                          <>
                            <span style={{ fontSize: 11.5, color: 'var(--text-3, #A1A1AA)' }}>
                              {activeChannel.department}
                            </span>
                            <span style={{ fontSize: 11.5, color: 'var(--text-3, #A1A1AA)' }}>/</span>
                          </>
                        )}
                        <span
                          style={{
                            fontSize: 14,
                            color: 'var(--text-1, #18181B)',
                            fontFamily: 'var(--font-title)',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {activeChannel.name}
                        </span>

                        {activeChannel.isPrivate && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: 999,
                              background: '#FAF9F7',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              color: 'var(--text-2, #52525B)',
                            }}
                          >
                            Private
                          </span>
                        )}
                      </div>

                      {activeChannel.topic && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-3, #A1A1AA)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 380,
                            marginTop: 1,
                          }}
                        >
                          {activeChannel.topic}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Right: Compact Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                {/* Notification Alerts & Sound Button */}
                <button
                  type="button"
                  onClick={notificationPermission === 'default' ? handleEnableNotifications : handleToggleSound}
                  title={
                    notificationPermission === 'granted'
                      ? soundEnabled
                        ? 'Notifications & sound alerts active (click to mute)'
                        : 'Audio muted (click to unmute)'
                      : 'Enable desktop notifications & sound alerts'
                  }
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid var(--card-border, #E4E4E7)',
                    background: '#FFFFFF',
                    color: 'var(--text-2, #52525B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {notificationPermission === 'granted' ? (
                    soundEnabled ? <Bell size={13} style={{ color: 'var(--primary, #18181B)' }} /> : <VolumeX size={13} />
                  ) : (
                    <Bell size={13} style={{ color: 'var(--text-3, #A1A1AA)' }} />
                  )}
                  {notificationPermission === 'granted' && soundEnabled && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#10B981',
                      }}
                    />
                  )}
                </button>

                {/* Pin Filter Button */}
                <button
                  type="button"
                  onClick={() => setViewFilter(viewFilter === 'pinned' ? 'all' : 'pinned')}
                  style={{
                    height: 28,
                    padding: pinnedCount > 0 ? '0 7px' : '0',
                    width: pinnedCount > 0 ? 'auto' : 28,
                    borderRadius: 6,
                    border:
                      viewFilter === 'pinned'
                        ? '1px solid var(--primary, #18181B)'
                        : '1px solid var(--card-border, #E4E4E7)',
                    background:
                      viewFilter === 'pinned' ? 'var(--primary-tint, #FAF9F7)' : '#FFFFFF',
                    color:
                      viewFilter === 'pinned'
                        ? 'var(--primary, #18181B)'
                        : 'var(--text-2, #52525B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                  title={viewFilter === 'pinned' ? 'Show all messages' : 'Show pinned messages'}
                >
                  <Pin size={13} />
                  {pinnedCount > 0 && <span style={{ fontWeight: 600 }}>{pinnedCount}</span>}
                </button>

                {/* Thread Dropdown Trigger */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowThreadsPopover(!showThreadsPopover)}
                    style={{
                      height: 28,
                      padding: threadedMessages.length > 0 ? '0 7px' : '0',
                      width: threadedMessages.length > 0 ? 'auto' : 28,
                      borderRadius: 6,
                      border: showThreadsPopover
                        ? '1px solid var(--primary, #18181B)'
                        : '1px solid var(--card-border, #E4E4E7)',
                      background: showThreadsPopover
                        ? 'var(--primary-tint, #FAF9F7)'
                        : '#FFFFFF',
                      color: showThreadsPopover
                        ? 'var(--primary, #18181B)'
                        : 'var(--text-2, #52525B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                    title="Active threads"
                  >
                    <MessagesSquare size={13.5} />
                    {threadedMessages.length > 0 && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '0 3.5px',
                          borderRadius: 999,
                          background: '#F4F4F5',
                          color: 'var(--text-2, #52525B)',
                        }}
                      >
                        {threadedMessages.length}
                      </span>
                    )}
                  </button>

                  {showThreadsPopover && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        width: 280,
                        background: '#FFFFFF',
                        borderRadius: 10,
                        border: '1px solid var(--card-border, #E4E4E7)',
                        boxShadow: '0 12px 28px -6px rgba(17, 17, 24, 0.12)',
                        zIndex: 60,
                        padding: 6,
                      }}
                    >
                      <div
                        style={{
                          padding: '5px 8px',
                          fontSize: 10.5,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--text-3, #A1A1AA)',
                          borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
                          marginBottom: 3,
                          fontWeight: 600,
                        }}
                      >
                        Active Threads
                      </div>
                      {threadedMessages.length > 0 ? (
                        threadedMessages.map((tm) => (
                          <button
                            key={tm.id}
                            type="button"
                            onClick={() => {
                              setActiveThread(tm);
                              setSelectedProfileMember(null);
                              setShowThreadsPopover(false);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              padding: '7px 8px',
                              borderRadius: 7,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: 'var(--text-1, #18181B)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {tm.content}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-3, #A1A1AA)', marginTop: 2 }}>
                                {tm.senderName}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 5px',
                                borderRadius: 999,
                                background: '#F4F4F5',
                                color: 'var(--text-1, #18181B)',
                                flexShrink: 0,
                                fontWeight: 600,
                              }}
                            >
                              {tm.replyCount}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: '14px 8px',
                            textAlign: 'center',
                            fontSize: 11.5,
                            color: 'var(--text-3, #A1A1AA)',
                          }}
                        >
                          No active threads yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search in channel input */}
                <div style={{ position: 'relative' }}>
                  <Search
                    size={11.5}
                    style={{
                      position: 'absolute',
                      left: 7,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-3, #A1A1AA)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchMessageTerm}
                    onChange={(e) => setSearchMessageTerm(e.target.value)}
                    style={{
                      width: 90,
                      height: 28,
                      padding: '0 6px 0 22px',
                      fontSize: 11,
                      background: '#FAF9F7',
                      border: '1px solid var(--card-border, #E4E4E7)',
                      borderRadius: 6,
                      outline: 'none',
                      color: 'var(--text-1, #18181B)',
                      transition: 'width 0.2s ease, border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.width = '125px';
                      e.currentTarget.style.borderColor = 'var(--primary, #18181B)';
                    }}
                    onBlur={(e) => {
                      if (!searchMessageTerm) {
                        e.currentTarget.style.width = '90px';
                      }
                      e.currentTarget.style.borderColor = 'var(--card-border, #E4E4E7)';
                    }}
                  />
                </div>

                <div style={{ width: 1, height: 14, background: 'var(--card-border, #E4E4E7)', margin: '0 1px' }} />

                {/* Member Avatars Pill Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProfileMember || activeThread) {
                      setSelectedProfileMember(null);
                      setActiveThread(null);
                      setShowMemberDrawer(true);
                    } else {
                      setShowMemberDrawer(!showMemberDrawer);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    height: 28,
                    padding: '0 7px',
                    borderRadius: 6,
                    border:
                      showMemberDrawer && !activeThread && !selectedProfileMember
                        ? '1px solid var(--primary, #18181B)'
                        : '1px solid var(--card-border, #E4E4E7)',
                    background:
                      showMemberDrawer && !activeThread && !selectedProfileMember
                        ? 'var(--primary-tint, #FAF9F7)'
                        : '#FFFFFF',
                    color: 'var(--text-1, #18181B)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                  title="Toggle members sidebar"
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {channelMembers.slice(0, 2).map((m, idx) => (
                      <span
                        key={m.id}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#F4F4F5',
                          border: '1.5px solid #FFFFFF',
                          marginLeft: idx === 0 ? 0 : -5,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 8.5,
                          fontWeight: 700,
                          overflow: 'hidden',
                        }}
                      >
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            alt={m.firstName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          m.firstName.slice(0, 1)
                        )}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2, #52525B)' }}>
                    {channelMembers.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Admin Pending Access Approval Bar */}
            {isChannelAdmin && activeChannel.pendingRequestUserIds.length > 0 && (
              <div
                style={{
                  padding: '10px 22px',
                  background: '#FAF9F7',
                  borderBottom: '1px solid var(--card-border, #E4E4E7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <ShieldAlert size={15} style={{ color: 'var(--primary, #A238FF)' }} />
                  <span>
                    <strong>{activeChannel.pendingRequestUserIds.length}</strong> pending request
                    {activeChannel.pendingRequestUserIds.length === 1 ? '' : 's'} to join{' '}
                    <strong>#{activeChannel.name}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {activeChannel.pendingRequestUserIds.map((userId) => {
                    const emp = allEmployees.find((e) => String(e.id) === userId);
                    const empFullName = emp
                      ? `${emp.firstName} ${emp.lastName}`.trim()
                      : `Employee #${userId}`;
                    return (
                      <div
                        key={userId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: '#FFFFFF',
                          border: '1px solid var(--card-border, #E4E4E7)',
                          fontSize: 12,
                        }}
                      >
                        <span>{empFullName}</span>
                        <button
                          type="button"
                          onClick={() => approveJoinRequest(activeChannel.id, userId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 7px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--primary, #A238FF)',
                            color: '#FFFFFF',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={12} />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectJoinRequest(activeChannel.id, userId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 5px',
                            borderRadius: 6,
                            border: '1px solid var(--card-border, #E4E4E7)',
                            background: '#FFFFFF',
                            color: 'var(--text-2, #52525B)',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Restricted / Non-Member Gate */}
            {!isMember ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 36,
                  textAlign: 'center',
                  background: '#FAF9F7',
                }}
              >
                <div
                  style={{
                    maxWidth: 420,
                    background: '#FFFFFF',
                    borderRadius: 18,
                    border: '1px solid var(--card-border, #E4E4E7)',
                    padding: '32px 28px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: '#FAF9F7',
                      border: '1px solid var(--card-border, #E4E4E7)',
                      color: 'var(--text-1, #18181B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                    }}
                  >
                    <Lock size={22} />
                  </div>

                  <h2 style={{ fontSize: 18, color: 'var(--text-1, #18181B)', marginBottom: 8 }}>
                    #{activeChannel.name} is a restricted channel
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-2, #52525B)',
                      lineHeight: 1.55,
                      marginBottom: 22,
                    }}
                  >
                    {activeChannel.departmentRestricted
                      ? `This channel is restricted to the ${activeChannel.department} department. To join, request access from the channel administrator.`
                      : 'This is a private group channel. You must be invited or approved by a channel administrator to view messages.'}
                  </p>

                  {hasRequested ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 16px',
                        borderRadius: 10,
                        background: '#FAF9F7',
                        border: '1px solid var(--card-border, #E4E4E7)',
                        color: 'var(--text-2, #52525B)',
                        fontSize: 12.5,
                      }}
                    >
                      <Check size={14} style={{ color: 'var(--primary, #A238FF)' }} />
                      <span>Access request sent · Pending admin approval</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => requestToJoinChannel(activeChannel.id)}
                      className="btn btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 20px',
                      }}
                    >
                      <UserPlus size={15} />
                      <span>Request Access to Join</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Notification Permission Banner */}
                {notificationPermission === 'default' && !dismissedNotificationBanner && (
                  <div
                    style={{
                      background: '#FAF9F7',
                      borderBottom: '1px solid var(--card-border, #E4E4E7)',
                      padding: '5px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                      <Bell size={13} style={{ color: 'var(--primary, #18181B)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-2, #52525B)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong style={{ fontWeight: 600, color: 'var(--text-1, #18181B)' }}>Enable desktop notifications</strong> to receive alerts when mentioned or messaged.
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={handleEnableNotifications}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'var(--primary, #18181B)',
                          color: '#FFFFFF',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Enable
                      </button>
                      <button
                        type="button"
                        onClick={handleDismissNotificationBanner}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-3, #71717A)',
                          fontSize: 11.5,
                          cursor: 'pointer',
                        }}
                        title="Dismiss notification prompt"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── MESSAGE STREAM ─── */}
                <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {/* Channel / DM Intro Header */}
                {(() => {
                  const isDM = activeChannel.channelType === 'dm' || activeChannel.channelType === 'group_dm';
                  const dmInfo = isDM ? getDMParticipant(activeChannel) : null;
                  return (
                    <div
                      style={{
                        padding: '16px 18px',
                        borderRadius: 14,
                        background: '#FAF9F7',
                        border: '1px solid var(--card-border, #E4E4E7)',
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isDM ? (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-1, #18181B)',
                              fontSize: 12,
                              fontWeight: 700,
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {dmInfo?.avatar ? (
                              <img
                                src={dmInfo.avatar}
                                alt={dmInfo.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : dmInfo?.isGroup ? (
                              <Users size={18} style={{ color: 'var(--text-2, #52525B)' }} />
                            ) : (
                              (dmInfo?.name || 'DM').slice(0, 2).toUpperCase()
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: '#FFFFFF',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-1, #18181B)',
                              flexShrink: 0,
                            }}
                          >
                            {activeChannel.isPrivate ? <Lock size={18} /> : <Hash size={18} />}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 14, color: 'var(--text-1, #18181B)' }}>
                            {isDM ? (
                              <span>This is the start of your direct chat with <strong>{dmInfo?.name}</strong></span>
                            ) : (
                              <span>Welcome to <strong>#{activeChannel.name}</strong></span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-2, #52525B)', marginTop: 2 }}>
                            {isDM ? (
                              <span>
                                {dmInfo?.title || 'Coworker'}
                                {dmInfo?.department ? ` · ${dmInfo.department}` : ''}
                                {' · Messages sent here are private and direct.'}
                              </span>
                            ) : (
                              <>
                                {activeChannel.description ||
                                  'Start threads, share documents & images, or mention team members with @name.'}{' '}
                                <span style={{ color: 'var(--text-3, #A1A1AA)' }}>
                                  · Created by {activeChannel.createdBy}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {viewFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setViewFilter('all')}
                          className="btn btn-neutral"
                          style={{ fontSize: 11.5, padding: '5px 10px' }}
                        >
                          Show All Messages
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Date Divider Pill (Matches Reference Image) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '8px 0 12px 0',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle, #F0F0F3)' }} />
                  <span
                    style={{
                      fontSize: 11,
                      padding: '4px 12px',
                      borderRadius: 999,
                      border: '1px solid var(--card-border, #E4E4E7)',
                      background: '#FFFFFF',
                      color: 'var(--text-2, #52525B)',
                    }}
                  >
                    {viewFilter === 'pinned'
                      ? 'Pinned Messages'
                      : viewFilter === 'threads'
                      ? 'Active Threads'
                      : 'Today'}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle, #F0F0F3)' }} />
                </div>

                {/* Message Items */}
                {isLoadingMessages ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 12px' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, opacity: 0.85 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'chatShimmer 1.5s infinite',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div
                              style={{
                                width: 110,
                                height: 13,
                                borderRadius: 4,
                                background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'chatShimmer 1.5s infinite',
                              }}
                            />
                            <div
                              style={{
                                width: 50,
                                height: 11,
                                borderRadius: 4,
                                background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'chatShimmer 1.5s infinite',
                              }}
                            />
                          </div>
                          <div
                            style={{
                              width: i % 2 === 0 ? '70%' : '50%',
                              height: 13,
                              borderRadius: 4,
                              background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'chatShimmer 1.5s infinite',
                            }}
                          />
                          {i % 2 === 0 && (
                            <div
                              style={{
                                width: '35%',
                                height: 13,
                                borderRadius: 4,
                                background: 'linear-gradient(90deg, #F4F4F5 25%, #E4E4E7 50%, #F4F4F5 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'chatShimmer 1.5s infinite',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <div
                    style={{
                      padding: '56px 20px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#FAF5FF',
                        border: '1px solid #E9D5FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary, #A238FF)',
                      }}
                    >
                      <MessageSquare size={20} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1, #18181B)' }}>
                      {viewFilter === 'threads'
                        ? 'No active thread discussions yet'
                        : viewFilter === 'pinned'
                        ? 'No pinned messages in this channel'
                        : 'No messages found'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-3, #A1A1AA)', maxWidth: 360, lineHeight: 1.5 }}>
                      {viewFilter === 'threads'
                        ? `Replies to any message in #${activeChannel?.name || 'this channel'} will appear here as focused thread discussions.`
                        : viewFilter === 'pinned'
                        ? `Important announcements or notes can be pinned to #${activeChannel?.name || 'this channel'} for quick reference.`
                        : 'Try searching for something else or send a message below.'}
                    </div>
                    {viewFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setViewFilter('all')}
                        style={{
                          marginTop: 6,
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--card-border, #E4E4E7)',
                          background: '#FFFFFF',
                          color: 'var(--text-2, #52525B)',
                          fontSize: 12.5,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        View all messages
                      </button>
                    )}
                  </div>
                ) : (
                  visibleMessages.map((msg) => {
                    const isMine = msg.senderId === currentUserId || msg.senderId === 'user';
                    const hasReplies = (msg.replyCount || 0) > 0;
                    const isHovered = hoveredMsgId === msg.id;

                    return (
                      <React.Fragment key={msg.id}>
                        {msg.id === firstUnreadMsgId && (
                          <div
                            ref={firstUnreadRef}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              margin: '16px 0 12px 0',
                            }}
                          >
                            <div style={{ flex: 1, height: 1, background: '#EF4444' }} />
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '3px 12px',
                                borderRadius: 999,
                                background: '#FEF2F2',
                                border: '1px solid #FCA5A5',
                                color: '#DC2626',
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
                              New Messages
                            </span>
                            <div style={{ flex: 1, height: 1, background: '#EF4444' }} />
                          </div>
                        )}

                        <div
                          onMouseEnter={() => setHoveredMsgId(msg.id)}
                          onMouseLeave={() => setHoveredMsgId(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                          padding: '10px 12px',
                          borderRadius: 12,
                          background: isHovered ? '#FAF9F7' : 'transparent',
                          position: 'relative',
                          transition: 'background 0.12s ease',
                        }}
                      >
                        {/* Left Column: Avatar + Optional Thread Connector */}
                        {(() => {
                          const found = allEmployees.find(
                            (e) =>
                              String(e.id) === msg.senderId ||
                              `${e.firstName} ${e.lastName}`.trim().toLowerCase() === msg.senderName.toLowerCase()
                          );
                          const effectiveAvatar =
                            msg.senderAvatar ||
                            found?.avatar ||
                            (found as any)?.avatarUrl ||
                            (found as any)?.avatar_url ||
                            (found as any)?.photoUrl ||
                            '';

                          return (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <div
                                onClick={() => {
                                  if (found) {
                                    setSelectedProfileMember(found);
                                    setActiveThread(null);
                                  }
                                }}
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: '50%',
                                  background: '#F4F4F5',
                                  border: '1px solid var(--card-border, #E4E4E7)',
                                  color: 'var(--text-1, #18181B)',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                }}
                              >
                                {effectiveAvatar ? (
                                  <img
                                    src={effectiveAvatar}
                                    alt={msg.senderName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  msg.senderName.slice(0, 2).toUpperCase()
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Right Column: Sender Header, Message Body, Attachments, Reactions, Thread Connector */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: 13.5,
                                color: 'var(--text-1, #18181B)',
                                fontWeight: 600,
                              }}
                            >
                              {msg.senderName}
                            </span>
                            {msg.senderRole && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-3, #A1A1AA)',
                                }}
                              >
                                {msg.senderRole}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)' }}>
                              {msg.createdAt}
                            </span>
                            {msg.status === 'sending' && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 10.5,
                                  color: '#A1A1AA',
                                }}
                              >
                                <span
                                  style={{
                                    width: 8,
                                    height: 8,
                                    border: '1.5px solid var(--primary, #18181B)',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'chatSpin 0.8s linear infinite',
                                    display: 'inline-block',
                                  }}
                                />
                                <span>Sending...</span>
                              </span>
                            )}
                            {msg.status === 'sent' && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  fontSize: 10.5,
                                  color: '#10B981',
                                }}
                                title="Delivered"
                              >
                                <Check size={11} />
                              </span>
                            )}
                            {msg.status === 'failed' && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  color: '#EF4444',
                                  background: '#FEF2F2',
                                  padding: '1px 6px',
                                  borderRadius: 6,
                                  border: '1px solid #FCA5A5',
                                }}
                              >
                                <ShieldAlert size={11} />
                                <span>{msg.errorMessage || 'Failed to send'}</span>
                                <button
                                  type="button"
                                  onClick={() => retrySendMessage(msg.clientMsgId || msg.id)}
                                  style={{
                                    background: '#EF4444',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Retry
                                </button>
                              </span>
                            )}
                            {msg.pinned && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  fontSize: 10.5,
                                  padding: '1px 6px',
                                  borderRadius: 6,
                                  background: 'var(--primary-light, #F5EBFF)',
                                  color: 'var(--primary, #A238FF)',
                                }}
                              >
                                <Pin size={10} />
                                <span>Pinned</span>
                              </span>
                            )}
                          </div>

                          {/* Message Text (with inline Animated Emojis & Rich Text) */}
                          {msg.content && (
                            <div
                              style={{
                                fontSize: 13.5,
                                color: 'var(--text-1, #18181B)',
                                marginTop: 4,
                                lineHeight: 1.55,
                              }}
                            >
                              <RichMessageContent content={msg.content} />
                            </div>
                          )}

                          {/* Interactive Poll Card */}
                          {msg.poll && (
                            <PollCard
                              poll={msg.poll}
                              messageId={msg.id}
                              currentUserId={currentUserId}
                              isCreatorOrAdmin={isMine || isChannelAdmin}
                              allEmployees={allEmployees}
                              onVote={votePoll}
                              onToggleClose={closePoll}
                            />
                          )}

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 10,
                                marginTop: 10,
                              }}
                            >
                              {msg.attachments.map((att) => {
                                const isImage =
                                  att.type === 'image' ||
                                  Boolean(att.mimeType?.startsWith('image/')) ||
                                  /\.(png|jpe?g|gif|webp|svg)($|\?)/i.test(att.url) ||
                                  /\.(png|jpe?g|gif|webp|svg)$/i.test(att.name || '');

                                const isVideo =
                                  att.type === 'video' ||
                                  Boolean(att.mimeType?.startsWith('video/')) ||
                                  /\.(mp4|webm|mov|ogg)($|\?)/i.test(att.url) ||
                                  /\.(mp4|webm|mov|ogg)$/i.test(att.name || '');

                                return (
                                <div
                                  key={att.id}
                                  style={{
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    border: '1px solid var(--card-border, #E4E4E7)',
                                    background: '#FAF9F7',
                                    maxWidth: 380,
                                    position: 'relative',
                                  }}
                                >
                                  {isImage ? (
                                    <div
                                      onClick={() =>
                                        setLightboxMedia({
                                          url: att.url,
                                          name: att.name || 'Image',
                                          type: 'image',
                                          size: att.size,
                                        })
                                      }
                                      style={{ position: 'relative', cursor: 'zoom-in' }}
                                      title="Click to open full view"
                                    >
                                      <img
                                        src={att.url}
                                        alt=""
                                        style={{
                                          display: 'block',
                                          maxWidth: '100%',
                                          maxHeight: 230,
                                          objectFit: 'cover',
                                        }}
                                      />
                                      <div
                                        style={{
                                          position: 'absolute',
                                          bottom: 8,
                                          right: 8,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          padding: '4px 8px',
                                          borderRadius: 6,
                                          background: 'rgba(9, 9, 11, 0.72)',
                                          backdropFilter: 'blur(4px)',
                                          color: '#FFFFFF',
                                          fontSize: 10.5,
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Maximize2 size={11} />
                                        <span>Full view</span>
                                      </div>
                                    </div>
                                  ) : isVideo ? (
                                    <div
                                      onClick={() =>
                                        setLightboxMedia({
                                          url: att.url,
                                          name: att.name,
                                          type: 'video',
                                          size: att.size,
                                        })
                                      }
                                      style={{
                                        position: 'relative',
                                        cursor: 'pointer',
                                        background: '#09090B',
                                        width: 340,
                                        maxWidth: '100%',
                                      }}
                                      title="Click to play video in full view"
                                    >
                                      <video
                                        src={att.url}
                                        muted
                                        playsInline
                                        preload="metadata"
                                        style={{
                                          display: 'block',
                                          width: '100%',
                                          height: 196,
                                          objectFit: 'cover',
                                        }}
                                      />
                                      <div
                                        style={{
                                          position: 'absolute',
                                          inset: 0,
                                          background: 'linear-gradient(to top, rgba(0,0,0,0.68), rgba(0,0,0,0.18))',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.22)',
                                            border: '1px solid rgba(255, 255, 255, 0.35)',
                                            backdropFilter: 'blur(6px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#FFFFFF',
                                          }}
                                        >
                                          <Play size={18} fill="#FFFFFF" />
                                        </div>
                                      </div>
                                      <div
                                        style={{
                                          position: 'absolute',
                                          left: 10,
                                          right: 10,
                                          bottom: 8,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          color: '#FFFFFF',
                                          fontSize: 11,
                                        }}
                                      >
                                        <span
                                          style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: 210,
                                          }}
                                        >
                                          {att.name}
                                        </span>
                                        <span
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '2px 7px',
                                            borderRadius: 6,
                                            background: 'rgba(255,255,255,0.18)',
                                            fontSize: 10,
                                            fontWeight: 600,
                                          }}
                                        >
                                          <Maximize2 size={10} /> Full video
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => downloadChatAttachment(att.url, att.name)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        gap: 12,
                                        padding: '10px 14px',
                                        color: 'var(--text-1, #18181B)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                      }}
                                      title={`Download ${att.name}`}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                        <FileText size={18} style={{ color: 'var(--primary, #A238FF)', flexShrink: 0 }} />
                                        <div style={{ overflow: 'hidden' }}>
                                          <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
                                          {att.size && (
                                            <div style={{ fontSize: 10.5, color: 'var(--text-3, #A1A1AA)' }}>
                                              {att.size}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          padding: '4px 8px',
                                          borderRadius: 6,
                                          background: 'var(--primary-light, #F5EBFF)',
                                          color: 'var(--primary, #A238FF)',
                                          fontSize: 11,
                                          fontWeight: 600,
                                          flexShrink: 0,
                                        }}
                                      >
                                        <Download size={12} />
                                        <span>Download</span>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            </div>
                          )}

                          {/* Emoji Reaction Pills */}
                          {msg.reactions && Object.values(msg.reactions).length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 8,
                              }}
                            >
                              {Object.values(msg.reactions).map((r) => {
                                const hasReacted =
                                  r.users.includes(currentUserId) || r.users.includes('user');
                                return (
                                  <button
                                    key={r.emoji}
                                    type="button"
                                    onClick={() => toggleReaction(msg.id, r.emoji)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      padding: '3px 9px',
                                      borderRadius: 999,
                                      fontSize: 12,
                                      border: hasReacted
                                        ? '1px solid var(--primary, #A238FF)'
                                        : '1px solid var(--card-border, #E4E4E7)',
                                      background: hasReacted
                                        ? 'var(--primary-light, #F5EBFF)'
                                        : '#FFFFFF',
                                      color: hasReacted
                                        ? 'var(--primary, #A238FF)'
                                        : 'var(--text-1, #18181B)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <span>{r.emoji}</span>
                                    <span style={{ fontSize: 11 }}>{r.count}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Curved L-Connector Thread Summary Bar (Matches Reference Image 1) */}
                          {hasReplies && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: 8,
                                position: 'relative',
                              }}
                            >
                              <div
                                style={{
                                  width: 18,
                                  height: 16,
                                  borderLeft: '2px solid var(--card-border, #E4E4E7)',
                                  borderBottom: '2px solid var(--card-border, #E4E4E7)',
                                  borderBottomLeftRadius: 8,
                                  marginRight: 8,
                                  marginTop: -8,
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveThread(msg);
                                  setSelectedProfileMember(null);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  border: '1px solid var(--card-border, #E4E4E7)',
                                  background: '#FFFFFF',
                                  cursor: 'pointer',
                                  fontSize: 12,
                                }}
                              >
                                {/* Reply avatars */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  {(msg.replies || []).slice(0, 3).map((rep, idx) => {
                                    const repEmp = allEmployees.find(
                                      (e) =>
                                        String(e.id) === rep.senderId ||
                                        `${e.firstName} ${e.lastName}`.trim().toLowerCase() === rep.senderName.toLowerCase()
                                    );
                                    const repAvatar =
                                      rep.senderAvatar ||
                                      repEmp?.avatar ||
                                      (repEmp as any)?.avatarUrl ||
                                      (repEmp as any)?.avatar_url ||
                                      '';

                                    return (
                                      <span
                                        key={rep.id}
                                        style={{
                                          width: 18,
                                          height: 18,
                                          borderRadius: '50%',
                                          background: '#F4F4F5',
                                          border: '1.5px solid #FFFFFF',
                                          marginLeft: idx === 0 ? 0 : -5,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: 8.5,
                                          overflow: 'hidden',
                                        }}
                                      >
                                        {repAvatar ? (
                                          <img
                                            src={repAvatar}
                                            alt={rep.senderName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                          />
                                        ) : (
                                          rep.senderName.slice(0, 1)
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>

                                <span style={{ color: 'var(--primary, #A238FF)' }}>
                                  {msg.replyCount} {msg.replyCount === 1 ? 'Message' : 'Messages'}
                                </span>
                                <span style={{ color: 'var(--text-3, #A1A1AA)', fontSize: 11 }}>
                                  View thread →
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Floating Hover Action Bar */}
                        {isHovered && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              background: '#FFFFFF',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              borderRadius: 10,
                              padding: 3,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                              zIndex: 10,
                            }}
                          >
                            {['👍', '❤️', '🔥', '🚀'].map((emo) => (
                              <button
                                key={emo}
                                type="button"
                                onClick={() => toggleReaction(msg.id, emo)}
                                style={{
                                  width: 26,
                                  height: 26,
                                  border: 'none',
                                  background: 'transparent',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title={`React with ${emo}`}
                              >
                                {emo}
                              </button>
                            ))}

                            <div
                              style={{
                                width: 1,
                                height: 16,
                                background: 'var(--border-subtle, #F0F0F3)',
                                margin: '0 2px',
                              }}
                            />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveThread(msg);
                                setSelectedProfileMember(null);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '0 8px',
                                height: 26,
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-2, #52525B)',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 11.5,
                              }}
                              title="Reply in thread"
                            >
                              <MessageSquare size={13} />
                              <span>Thread</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => togglePinMessage(msg.id)}
                              style={{
                                width: 26,
                                height: 26,
                                border: 'none',
                                background: 'transparent',
                                color: msg.pinned
                                  ? 'var(--primary, #A238FF)'
                                  : 'var(--text-2, #52525B)',
                                borderRadius: 6,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title={msg.pinned ? 'Unpin message' : 'Pin message'}
                            >
                              <Pin size={13} />
                            </button>

                            {(isMine || isChannelAdmin) && (
                              <button
                                type="button"
                                onClick={() => deleteMessage(msg.id)}
                                style={{
                                  width: 26,
                                  height: 26,
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#DC2626',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Delete message"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div
                style={{
                  padding: '2px 24px 6px 24px',
                  fontSize: 11.5,
                  color: 'var(--text-3, #A1A1AA)',
                }}
              >
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            {/* Bottom Slack-Style Rich Message Composer */}
            {isMember && (
              <div
                style={{
                  padding: '10px 22px 16px 22px',
                  background: '#FFFFFF',
                  borderTop: '1px solid var(--border-subtle, #F0F0F3)',
                  position: 'relative',
                }}
              >
                {/* Emoji / Animated Emoji / GIF Picker Popover */}
                {showPicker && (
                  <EmojiGifPicker
                    initialTab={pickerTab}
                    onSelectEmoji={(emoji) => {
                      editorRef.current?.insertEmoji(emoji);
                    }}
                    onSelectAnimatedEmoji={(code) => {
                      editorRef.current?.insertAnimatedEmoji(code);
                      setShowPicker(false);
                    }}
                    onSelectGif={(gifUrl) => {
                      setUploadedAttachments((prev) => [
                        ...prev,
                        {
                          id: `gif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          name: 'animation.gif',
                          url: gifUrl,
                          type: 'image',
                        },
                      ]);
                      setShowPicker(false);
                      editorRef.current?.focus();
                    }}
                    onClose={() => setShowPicker(false)}
                  />
                )}

                {/* Interactive Poll Builder Card Popover */}
                {showPollBuilder && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 10px)',
                      right: 22,
                      width: 420,
                      maxWidth: 'calc(100vw - 48px)',
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '1px solid var(--card-border, #E4E4E7)',
                      boxShadow: '0 20px 48px rgba(9, 9, 11, 0.16), 0 4px 12px rgba(9, 9, 11, 0.06)',
                      zIndex: 85,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Poll Builder Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#FAF9F7',
                        borderBottom: '1px solid var(--card-border, #E4E4E7)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            background: 'var(--primary-light, #F5EBFF)',
                            color: 'var(--primary, #A238FF)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <BarChart2 size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1, #18181B)' }}>
                            Create Poll in #{activeChannel.name}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3, #A1A1AA)' }}>
                            Real-time team voting with progress bars
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPollBuilder(false)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-3, #A1A1AA)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Poll Builder Body */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-2, #52525B)',
                            marginBottom: 5,
                          }}
                        >
                          Poll Question *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Where should we host our Q4 Team Offsite?"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 11px',
                            fontSize: 12.5,
                            borderRadius: 9,
                            border: '1px solid var(--card-border, #E4E4E7)',
                            background: '#FAF9F7',
                            outline: 'none',
                            color: 'var(--text-1, #18181B)',
                          }}
                        />
                      </div>

                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--text-2, #52525B)',
                            }}
                          >
                            Answer Options ({pollOptions.length}/8)
                          </label>
                          {pollOptions.length < 8 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions((prev) => [...prev, ''])}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--primary, #A238FF)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              <Plus size={12} /> Add Option
                            </button>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            maxHeight: 168,
                            overflowY: 'auto',
                          }}
                        >
                          {pollOptions.map((opt, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 6,
                                  background: '#F4F4F5',
                                  color: 'var(--text-3, #A1A1AA)',
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const next = [...pollOptions];
                                  next[idx] = e.target.value;
                                  setPollOptions(next);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '7px 10px',
                                  fontSize: 12,
                                  borderRadius: 8,
                                  border: '1px solid var(--card-border, #E4E4E7)',
                                  background: '#FFFFFF',
                                  outline: 'none',
                                  color: 'var(--text-1, #18181B)',
                                }}
                              />
                              {pollOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPollOptions((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 6,
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-3, #A1A1AA)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Poll Settings Toggles */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          paddingTop: 4,
                          borderTop: '1px solid var(--border-subtle, #F0F0F3)',
                        }}
                      >
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 11.5,
                            color: 'var(--text-2, #52525B)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={pollAllowMultiple}
                            onChange={(e) => setPollAllowMultiple(e.target.checked)}
                            style={{ accentColor: 'var(--primary, #A238FF)' }}
                          />
                          <span>Allow multiple choices</span>
                        </label>

                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 11.5,
                            color: 'var(--text-2, #52525B)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={pollAnonymous}
                            onChange={(e) => setPollAnonymous(e.target.checked)}
                            style={{ accentColor: 'var(--primary, #A238FF)' }}
                          />
                          <span>Anonymous votes</span>
                        </label>
                      </div>
                    </div>

                    {/* Poll Builder Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '10px 16px',
                        background: '#FAF9F7',
                        borderTop: '1px solid var(--card-border, #E4E4E7)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleStagePollInComposer}
                        disabled={
                          !pollQuestion.trim() ||
                          pollOptions.filter((o) => o.trim()).length < 2
                        }
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--card-border, #E4E4E7)',
                          background: '#FFFFFF',
                          color: 'var(--text-1, #18181B)',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor:
                            pollQuestion.trim() &&
                            pollOptions.filter((o) => o.trim()).length >= 2
                              ? 'pointer'
                              : 'not-allowed',
                          opacity:
                            pollQuestion.trim() &&
                            pollOptions.filter((o) => o.trim()).length >= 2
                              ? 1
                              : 0.5,
                        }}
                      >
                        Stage with Text
                      </button>

                      <button
                        type="button"
                        onClick={handleLaunchPollNow}
                        disabled={
                          !pollQuestion.trim() ||
                          pollOptions.filter((o) => o.trim()).length < 2
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background:
                            pollQuestion.trim() &&
                            pollOptions.filter((o) => o.trim()).length >= 2
                              ? 'var(--primary, #A238FF)'
                              : '#E4E4E7',
                          color:
                            pollQuestion.trim() &&
                            pollOptions.filter((o) => o.trim()).length >= 2
                              ? '#FFFFFF'
                              : '#A1A1AA',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor:
                            pollQuestion.trim() &&
                            pollOptions.filter((o) => o.trim()).length >= 2
                              ? 'pointer'
                              : 'not-allowed',
                        }}
                      >
                        <BarChart2 size={13} />
                        <span>Launch Poll</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* @Mention Autocomplete Popover */}
                {mentionQuery !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: 24,
                      width: 260,
                      background: '#FFFFFF',
                      borderRadius: 12,
                      border: '1px solid var(--card-border, #E4E4E7)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
                      zIndex: 70,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '7px 12px',
                        fontSize: 10.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-3, #A1A1AA)',
                        background: '#FAF9F7',
                        borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
                      }}
                    >
                      Mention Team Member
                    </div>
                    <div style={{ maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                      {allEmployees
                        .filter((e) =>
                          `${e.firstName} ${e.lastName}`.toLowerCase().includes(mentionQuery)
                        )
                        .map((emp) => {
                          const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectMention(fullName);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '7px 10px',
                                borderRadius: 8,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: 12.5,
                              }}
                            >
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: '#F4F4F5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  overflow: 'hidden',
                                }}
                              >
                                {emp.avatar ? (
                                  <img
                                    src={emp.avatar}
                                    alt={fullName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  fullName.slice(0, 1)
                                )}
                              </span>
                              <span style={{ color: 'var(--text-1, #18181B)' }}>{fullName}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)' }}>
                                · {emp.department}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Slack-Inspired Live WYSIWYG Rich Text & Media Composer Container */}
                {isAnnouncementsChannel && !isOwnerOrAdmin ? (
                  <div
                    style={{
                      borderRadius: 14,
                      border: '1px solid var(--card-border, #E4E4E7)',
                      background: '#FAF9F7',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: '#FFFFFF',
                        border: '1px solid var(--card-border, #E4E4E7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary, #A238FF)',
                        flexShrink: 0,
                      }}
                    >
                      <Lock size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1, #18181B)' }}>
                        #announcements is a read-only channel
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3, #A1A1AA)', marginTop: 2 }}>
                        Only HR Managers and Workspace Administrators can post official announcements here.
                      </div>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSend}
                    style={{
                      borderRadius: 14,
                      border: '1px solid var(--card-border, #E4E4E7)',
                      background: '#FAF9F7',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                  {/* Live ContentEditable WYSIWYG Editor (No separate preview box) */}
                  <WysiwygChatEditor
                    ref={editorRef}
                    placeholder={
                      activeChannel.channelType === 'dm' || activeChannel.channelType === 'group_dm'
                        ? `Message ${getDMParticipant(activeChannel)?.name || 'coworker'}... (type @ to mention, format text, or add animated emojis & GIFs)`
                        : `Message #${activeChannel.name}... (type @ to mention, select Bold/Italic/Lists to type live, or add animated emojis & GIFs)`
                    }
                    onChange={(serialized) => {
                      setInputText(serialized);
                      setTyping(serialized.length > 0);
                    }}
                    onSubmit={handleSend}
                    onMentionQueryChange={setMentionQuery}
                  />

                  {/* Staged Attachments (GIFs, Images, Videos, Files) & Staged Poll */}
                  {(uploadedAttachments.length > 0 || stagedPoll) && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 12px 8px 12px',
                      }}
                    >
                      {stagedPoll && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 9,
                            background: 'var(--primary-light, #F5EBFF)',
                            border: '1px solid rgba(162, 56, 255, 0.28)',
                            color: 'var(--primary, #A238FF)',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <BarChart2 size={13} />
                          <span>
                            Poll: {stagedPoll.question} ({stagedPoll.options.length} options)
                          </span>
                          <button
                            type="button"
                            onClick={() => setStagedPoll(null)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--primary, #A238FF)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: 0,
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}

                      {uploadedAttachments.map((att) =>
                        att.type === 'image' ? (
                          <div
                            key={att.id}
                            style={{
                              position: 'relative',
                              width: 72,
                              height: 56,
                              borderRadius: 9,
                              overflow: 'hidden',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              background: '#FFFFFF',
                            }}
                          >
                            <img
                              src={att.url}
                              alt=""
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setUploadedAttachments((prev) =>
                                  prev.filter((a) => a.id !== att.id)
                                )
                              }
                              style={{
                                position: 'absolute',
                                top: 3,
                                right: 3,
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(9, 9, 11, 0.75)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                              }}
                              title="Remove"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <div
                            key={att.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 10px',
                              borderRadius: 8,
                              background: '#FFFFFF',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              fontSize: 12,
                            }}
                          >
                            <Paperclip size={12} style={{ color: 'var(--primary, #A238FF)' }} />
                            <span>{att.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setUploadedAttachments((prev) =>
                                  prev.filter((a) => a.id !== att.id)
                                )
                              }
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-3, #A1A1AA)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Bottom Action Bar: Attach, Mention, Emojis, Animated Emojis, GIF, Poll, Send */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderTop: '1px solid var(--border-subtle, #F0F0F3)',
                      background: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      {/* Left + Attachment Trigger */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          border: '1px solid var(--card-border, #E4E4E7)',
                          background: '#FAF9F7',
                          color: 'var(--text-2, #52525B)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        title="Attach files, images or videos"
                      >
                        <Plus size={15} />
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />

                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          editorRef.current?.triggerAtMention();
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-2, #52525B)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Mention colleague (@)"
                      >
                        <AtSign size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPickerTab('emoji');
                          setShowPicker((prev) => (pickerTab === 'emoji' ? !prev : true));
                          setShowPollBuilder(false);
                        }}
                        style={{
                          height: 26,
                          padding: '0 8px',
                          borderRadius: 6,
                          border: '1px solid var(--card-border, #E4E4E7)',
                          background:
                            showPicker && pickerTab === 'emoji'
                              ? 'var(--primary-light, #F5EBFF)'
                              : '#FFFFFF',
                          color:
                            showPicker && pickerTab === 'emoji'
                              ? 'var(--primary, #A238FF)'
                              : 'var(--text-2, #52525B)',
                          fontSize: 11,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                        title="Standard Emojis (520+)"
                      >
                        <Smile size={12.5} style={{ color: 'var(--primary, #A238FF)' }} />
                        <span>Emojis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPickerTab('animated');
                          setShowPicker((prev) => (pickerTab === 'animated' ? !prev : true));
                          setShowPollBuilder(false);
                        }}
                        style={{
                          height: 26,
                          padding: '0 8px',
                          borderRadius: 6,
                          border: '1px solid var(--card-border, #E4E4E7)',
                          background:
                            showPicker && pickerTab === 'animated'
                              ? 'var(--primary-light, #F5EBFF)'
                              : '#FFFFFF',
                          color:
                            showPicker && pickerTab === 'animated'
                              ? 'var(--primary, #A238FF)'
                              : 'var(--text-2, #52525B)',
                          fontSize: 11,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                        title="Animated Emojis"
                      >
                        <AnimatedEmojiIcon size={12.5} style={{ color: 'var(--primary, #A238FF)' }} />
                        <span>Animated</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPickerTab('gif');
                          setShowPicker((prev) => (pickerTab === 'gif' ? !prev : true));
                          setShowPollBuilder(false);
                        }}
                        style={{
                          height: 26,
                          padding: '0 8px',
                          borderRadius: 6,
                          border: '1px solid var(--card-border, #E4E4E7)',
                          background:
                            showPicker && pickerTab === 'gif'
                              ? 'var(--primary-light, #F5EBFF)'
                              : '#FFFFFF',
                          color:
                            showPicker && pickerTab === 'gif'
                              ? 'var(--primary, #A238FF)'
                              : 'var(--text-2, #52525B)',
                          fontSize: 11,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                        title="Search GIFs"
                      >
                        <GifIcon size={13} style={{ color: 'var(--primary, #A238FF)' }} />
                        <span>GIF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPollBuilder((prev) => !prev);
                          setShowPicker(false);
                        }}
                        style={{
                          height: 26,
                          padding: '0 9px',
                          borderRadius: 6,
                          border: showPollBuilder
                            ? '1px solid var(--primary, #A238FF)'
                            : '1px solid var(--card-border, #E4E4E7)',
                          background: showPollBuilder
                            ? 'var(--primary-light, #F5EBFF)'
                            : '#FFFFFF',
                          color: showPollBuilder
                            ? 'var(--primary, #A238FF)'
                            : 'var(--text-2, #52525B)',
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                        title="Create Interactive Poll"
                      >
                        <BarChart2 size={11.5} style={{ color: 'var(--primary, #A238FF)' }} />
                        <span>Poll</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        !inputText.trim() && uploadedAttachments.length === 0 && !stagedPoll
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        height: 30,
                        padding: '0 14px',
                        borderRadius: 8,
                        border: 'none',
                        background:
                          inputText.trim() || uploadedAttachments.length > 0 || stagedPoll
                            ? 'var(--primary, #A238FF)'
                            : '#E4E4E7',
                        color:
                          inputText.trim() || uploadedAttachments.length > 0 || stagedPoll
                            ? '#FFFFFF'
                            : '#A1A1AA',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor:
                          inputText.trim() || uploadedAttachments.length > 0 || stagedPoll
                            ? 'pointer'
                            : 'not-allowed',
                      }}
                    >
                      <span>Send</span>
                      <Send size={12} />
                    </button>
                  </div>
                </form>
              )}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              background: '#FAF9F7',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '1px solid var(--card-border, #E4E4E7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                color: 'var(--text-3, #71717A)',
              }}
            >
              {activeChatTab === 'dms' ? (
                <MessageSquare size={26} strokeWidth={1.75} />
              ) : (
                <Hash size={26} strokeWidth={1.75} />
              )}
            </div>

            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text-1, #18181B)',
                fontFamily: 'var(--font-title)',
                margin: '0 0 6px 0',
              }}
            >
              {activeChatTab === 'dms' ? 'Select a conversation to start' : 'Select a channel to start'}
            </h3>

            <p
              style={{
                fontSize: 12.5,
                color: 'var(--text-3, #71717A)',
                maxWidth: 360,
                lineHeight: 1.5,
                margin: '0 0 18px 0',
              }}
            >
              {activeChatTab === 'dms'
                ? 'Send and receive messages with your coworkers directly and securely. Choose a chat from the left or start a new conversation.'
                : 'Choose a channel from the left sidebar to start chatting, sharing files, and collaborating.'}
            </p>

            <button
              type="button"
              onClick={() => (activeChatTab === 'dms' ? setShowStartDMModal(true) : setShowCreateModal(true))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--card-border, #E4E4E7)',
                background: '#FFFFFF',
                color: 'var(--text-1, #18181B)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
            >
              <Plus size={14} />
              <span>{activeChatTab === 'dms' ? 'New DM' : 'Create Channel'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          RIGHT CONTEXTUAL DRAWER:
          1. ThreadDrawer (when replying/viewing a thread)
          2. Member Profile Sidebar (when clicking a member, matching Reference Image 3)
          3. All Members Directory (default right sidebar, matching Reference Image 1)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeChannel && (activeThread ? (
        <ThreadDrawer parentMessage={activeThread} onClose={() => setActiveThread(null)} />
      ) : selectedProfileMember ? (
        <aside
          style={{
            width: 310,
            flexShrink: 0,
            borderLeft: '1px solid var(--card-border, #E4E4E7)',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
          }}
        >
          {/* Profile Header */}
          <div
            style={{
              height: 58,
              padding: '0 18px',
              borderBottom: '1px solid var(--card-border, #E4E4E7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--text-1, #18181B)', fontWeight: 600 }}>
              Profile
            </span>
            <button
              type="button"
              onClick={() => setSelectedProfileMember(null)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-3, #A1A1AA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Avatar & Identity */}
          <div
            style={{
              padding: '24px 20px 18px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
            }}
          >
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  background: '#FAF9F7',
                  border: '1px solid var(--card-border, #E4E4E7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: 'var(--text-1, #18181B)',
                  overflow: 'hidden',
                }}
              >
                {selectedProfileMember.avatar ? (
                  <img
                    src={selectedProfileMember.avatar}
                    alt={selectedProfileMember.firstName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  `${selectedProfileMember.firstName.slice(0, 1)}${selectedProfileMember.lastName.slice(0, 1)}`
                )}
              </div>
              <span
                style={{
                  position: 'absolute',
                  right: 4,
                  bottom: 4,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2.5px solid #FFFFFF',
                }}
              />
            </div>

            <div
              style={{
                fontSize: 16,
                color: 'var(--text-1, #18181B)',
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
              }}
            >
              {selectedProfileMember.firstName} {selectedProfileMember.lastName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2, #52525B)', marginTop: 3 }}>
              {selectedProfileMember.title} · {selectedProfileMember.department}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                color: '#059669',
                marginTop: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10B981',
                }}
              />
              <span>Online</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 16 }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const fullName = `${selectedProfileMember.firstName} ${selectedProfileMember.lastName}`.trim();
                    await openOrCreateDM(String(selectedProfileMember.id), fullName);
                    setSelectedProfileMember(null);
                    setActiveChatTab('dms');
                  } catch (err) {
                    console.error('Failed to open DM:', err);
                  }
                }}
                style={{
                  width: '100%',
                  height: 36,
                  borderRadius: 9,
                  border: 'none',
                  background: 'var(--primary, #18181B)',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <MessageSquare size={14} />
                <span>Send DM</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <button
                  type="button"
                  onClick={() => {
                    const fullName = `${selectedProfileMember.firstName} ${selectedProfileMember.lastName}`.trim();
                    editorRef.current?.insertMention(fullName);
                  }}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid var(--card-border, #E4E4E7)',
                    background: '#FFFFFF',
                    color: 'var(--text-1, #18181B)',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <AtSign size={13} />
                  <span>Mention</span>
                </button>

                {(isHRAdmin || role === 'Manager') && (
                  <Link
                    href={`/people/${selectedProfileMember.id}`}
                    style={{
                      flex: 1,
                      height: 32,
                      borderRadius: 8,
                      border: '1px solid var(--card-border, #E4E4E7)',
                      background: '#FAF9F7',
                      color: 'var(--text-1, #18181B)',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Directory</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Profile Specifications */}
          <div
            style={{
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', marginBottom: 3 }}>
                Display Name
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-1, #18181B)' }}>
                {selectedProfileMember.firstName} {selectedProfileMember.lastName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', marginBottom: 3 }}>
                Role & Department
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-1, #18181B)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={13} style={{ color: 'var(--text-3, #A1A1AA)' }} />
                <span>
                  {selectedProfileMember.title} ({selectedProfileMember.department})
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', marginBottom: 3 }}>
                Location
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-1, #18181B)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} style={{ color: 'var(--text-3, #A1A1AA)' }} />
                <span>{selectedProfileMember.location || 'Headquarters'}</span>
              </div>
            </div>


            {selectedProfileMember.phone && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', marginBottom: 3 }}>
                  Phone Number
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-1, #18181B)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Phone size={13} style={{ color: 'var(--text-3, #A1A1AA)' }} />
                  <span>{selectedProfileMember.phone}</span>
                </div>
              </div>
            )}
          </div>
        </aside>
      ) : showMemberDrawer && activeChannel ? (
        <aside
          style={{
            width: 280,
            flexShrink: 0,
            borderLeft: '1px solid var(--card-border, #E4E4E7)',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* All Members Header */}
          <div
            style={{
              height: 58,
              padding: '0 18px',
              borderBottom: '1px solid var(--card-border, #E4E4E7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13.5, color: 'var(--text-1, #18181B)', fontWeight: 600 }}>
              All members ({channelMembers.length})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isChannelAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddMemberInput(!showAddMemberInput)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    border: '1px solid var(--card-border, #E4E4E7)',
                    background: showAddMemberInput ? 'var(--primary-light, #F5EBFF)' : '#FFFFFF',
                    color: showAddMemberInput
                      ? 'var(--primary, #A238FF)'
                      : 'var(--text-2, #52525B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Add member to channel"
                >
                  <UserPlus size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowMemberDrawer(false)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-3, #A1A1AA)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Admin Add Member Panel */}
          {isChannelAdmin && showAddMemberInput && (
            <div
              style={{
                padding: 12,
                background: '#FAF9F7',
                borderBottom: '1px solid var(--card-border, #E4E4E7)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-2, #52525B)', marginBottom: 6 }}>
                Add Employee to #{activeChannel.name}
              </div>
              <input
                type="text"
                placeholder="Filter employees..."
                value={memberFilterTerm}
                onChange={(e) => setMemberFilterTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: 12,
                  background: '#FFFFFF',
                  border: '1px solid var(--card-border, #E4E4E7)',
                  borderRadius: 8,
                  outline: 'none',
                  marginBottom: 6,
                }}
              />
              <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {nonMembers
                  .filter((e) =>
                    `${e.firstName} ${e.lastName}`
                      .toLowerCase()
                      .includes(memberFilterTerm.toLowerCase())
                  )
                  .map((emp) => {
                    const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                    return (
                      <div
                        key={emp.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 8px',
                          borderRadius: 7,
                          background: '#FFFFFF',
                          border: '1px solid var(--border-subtle, #F0F0F3)',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ truncate: 'true' } as React.CSSProperties}>{fullName}</span>
                        <button
                          type="button"
                          onClick={() => addMemberToChannel(activeChannel.id, String(emp.id))}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--primary, #A238FF)',
                            color: '#FFFFFF',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Add
                        </button>
                      </div>
                    );
                  })}
                {nonMembers.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', padding: 4 }}>
                    All company employees are already in this channel.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Member List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {channelMembers.map((emp) => {
              const empId = String(emp.id);
              const fullName = `${emp.firstName} ${emp.lastName}`.trim();
              const isChanCreator = activeChannel.adminIds.includes(empId);

              return (
                <div
                  key={empId}
                  onClick={() => setSelectedProfileMember(emp)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FAF9F7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#F4F4F5',
                          border: '1px solid var(--card-border, #E4E4E7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          overflow: 'hidden',
                        }}
                      >
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={fullName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span
                        style={{
                          position: 'absolute',
                          right: -1,
                          bottom: -1,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#10B981',
                          border: '1.5px solid #FFFFFF',
                        }}
                      />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'var(--text-1, #18181B)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>{fullName}</span>
                        {isChanCreator && (
                          <span
                            style={{
                              fontSize: 9.5,
                              padding: '1px 5px',
                              borderRadius: 5,
                              background: '#F4F4F5',
                              color: 'var(--text-2, #52525B)',
                            }}
                          >
                            Admin
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-3, #A1A1AA)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {emp.title}
                      </div>
                    </div>
                  </div>

                  {isChannelAdmin && !isPublicChannel && empId !== currentUserId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMemberFromChannel(activeChannel.id, empId);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-3, #A1A1AA)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      title="Remove from channel"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      ) : null)}

      {/* Create Channel Modal */}
      <CreateChannelModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/* Start Direct Message Modal */}
      <StartDMModal
        isOpen={showStartDMModal}
        onClose={() => setShowStartDMModal(false)}
        onDMStarted={() => {
          setActiveChatTab('dms');
        }}
      />

      {/* Full-Screen Media Lightbox (Images & Videos) */}
      <MediaLightbox item={lightboxMedia} onClose={() => setLightboxMedia(null)} />
    </div>
  );
}
