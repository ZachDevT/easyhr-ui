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
  Heart,
  Trash2,
  Users,
  UserPlus,
  Check,
  X,
  AtSign,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Pin,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ExternalLink,
  FileText,
  Maximize2,
  Play,
  Zap,
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
} from 'lucide-react';
import { useChat, ChatPoll } from '@/context/ChatContext';
import { useRole } from '@/context/RoleContext';
import { useCompany } from '@/context/CompanyContext';
import { Employee } from '@/data/employees';
import { CreateChannelModal } from '@/components/chat/CreateChannelModal';
import { ThreadDrawer } from '@/components/chat/ThreadDrawer';
import { EmojiGifPicker, PickerTab } from '@/components/chat/EmojiGifPicker';
import { MediaLightbox, LightboxMediaItem } from '@/components/chat/MediaLightbox';
import { RichMessageContent, PollCard } from '@/components/chat/RichMessageContent';

export default function GroupChatPage() {
  const {
    channels,
    activeChannel,
    setActiveChannelId,
    messages,
    activeThread,
    setActiveThread,
    sendMessage,
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
    typingUsers,
    setTyping,
    allEmployees,
  } = useChat();

  const { currentUser, role, isHRAdmin } = useRole();
  const { company } = useCompany();

  // UI state
  const [inputText, setInputText] = useState('');
  const [searchChannelTerm, setSearchChannelTerm] = useState('');
  const [searchMessageTerm, setSearchMessageTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'threads' | 'pinned'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Poll Builder state
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollAnonymous, setPollAnonymous] = useState(false);
  const [stagedPoll, setStagedPoll] = useState<ChatPoll | null>(null);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchorIdx, setMentionAnchorIdx] = useState<number>(-1);

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannel?.id]);

  // Membership & permissions
  const currentUserId = String(currentUser?.id || 'user');
  const isPublicChannel = activeChannel
    ? !activeChannel.isPrivate && !activeChannel.departmentRestricted
    : false;
  const isMember = activeChannel
    ? isPublicChannel ||
      activeChannel.memberIds.includes(currentUserId) ||
      activeChannel.memberIds.includes('user')
    : false;
  const isChannelAdmin = activeChannel
    ? activeChannel.adminIds.includes(currentUserId) ||
      activeChannel.adminIds.includes('user') ||
      isHRAdmin ||
      role === 'HR Admin'
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

  const generalChannels = useMemo(
    () => filteredChannels.filter((c) => !c.departmentRestricted),
    [filteredChannels]
  );

  const departmentGroups = useMemo(() => {
    const groups: Record<string, typeof filteredChannels> = {};
    filteredChannels
      .filter((c) => c.departmentRestricted)
      .forEach((c) => {
        const dept = c.department || 'General';
        if (!groups[dept]) groups[dept] = [];
        groups[dept].push(c);
      });
    return groups;
  }, [filteredChannels]);

  // Visible messages based on search + viewFilter
  const visibleMessages = useMemo(() => {
    let list = messages;
    if (viewFilter === 'threads') {
      list = list.filter((m) => (m.replyCount || 0) > 0);
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
  }, [messages, viewFilter, searchMessageTerm]);

  const threadedMessages = useMemo(
    () => messages.filter((m) => (m.replyCount || 0) > 0),
    [messages]
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

  // Handle text input and @mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const cursor = e.target.selectionStart;
    const lastAtPos = val.lastIndexOf('@', cursor - 1);
    if (lastAtPos !== -1 && !/\s/.test(val.slice(lastAtPos + 1, cursor))) {
      setMentionQuery(val.slice(lastAtPos + 1, cursor).toLowerCase());
      setMentionAnchorIdx(lastAtPos);
    } else {
      setMentionQuery(null);
    }

    setTyping(val.length > 0);
  };

  const handleSelectMention = (empName: string) => {
    if (mentionAnchorIdx === -1) return;
    const before = inputText.slice(0, mentionAnchorIdx);
    const after = inputText.slice(textareaRef.current?.selectionStart || inputText.length);
    setInputText(`${before}@${empName} ${after}`);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const applyFormat = (prefix: string, suffix: string = prefix, placeholder: string = 'text') => {
    const el = textareaRef.current;
    if (!el) {
      setInputText((prev) => `${prev}${prefix}${placeholder}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = inputText.slice(start, end) || placeholder;
    const next = inputText.slice(0, start) + prefix + selected + suffix + inputText.slice(end);
    setInputText(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
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
    textareaRef.current?.focus();
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

    setInputText('');
    setUploadedAttachments([]);
    setStagedPoll(null);
    setTyping(false);
    setMentionQuery(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const fileUrl = URL.createObjectURL(file);
      setUploadedAttachments((prev) => [
        ...prev,
        {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          url: fileUrl,
          type: isImg ? 'image' : isVideo ? 'video' : 'file',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        },
      ]);
    });
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
            onClick={() => setShowCreateModal(true)}
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
            title="Create new channel"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Channel Filter Search */}
        <div style={{ padding: '12px 12px 6px 12px' }}>
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
              placeholder="Jump to channel..."
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
            {threadedMessages.length > 0 && (
              <span
                style={{
                  fontSize: 10.5,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: '#F4F4F5',
                  color: 'var(--text-2, #52525B)',
                }}
              >
                {threadedMessages.length}
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
                {generalChannels.map((ch) => {
                  const isActive = activeChannel?.id === ch.id;
                  const canAccess =
                    !ch.isPrivate ||
                    ch.memberIds.includes(currentUserId) ||
                    ch.memberIds.includes('user');
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

                      {ch.unreadCount ? (
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
                })}

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
                {Object.entries(departmentGroups).map(([deptName, deptChans]) => (
                  <div key={deptName}>
                    {/* Department Group Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 8px',
                        fontSize: 12,
                        color: 'var(--text-1, #18181B)',
                      }}
                    >
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
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {deptName}
                      </span>
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
                          ch.memberIds.includes(currentUserId) || ch.memberIds.includes('user');
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
                            {!isUserMember && (
                              <Lock size={11} style={{ color: 'var(--text-3, #A1A1AA)', flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
            onClick={() => setShowCreateModal(true)}
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
            <span>Create New Channel</span>
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
                height: 58,
                padding: '0 22px',
                borderBottom: '1px solid var(--card-border, #E4E4E7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                background: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {/* Left: Channel Breadcrumb & Topic */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#FAF9F7',
                    border: '1px solid var(--card-border, #E4E4E7)',
                    color: 'var(--text-1, #18181B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeChannel.isPrivate ? <Lock size={15} /> : <Hash size={16} />}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {activeChannel.department && (
                      <>
                        <span style={{ fontSize: 12, color: 'var(--text-3, #A1A1AA)' }}>
                          {activeChannel.department}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-3, #A1A1AA)' }}>/</span>
                      </>
                    )}
                    <span
                      style={{
                        fontSize: 15,
                        color: 'var(--text-1, #18181B)',
                        fontFamily: 'var(--font-title)',
                        fontWeight: 700,
                      }}
                    >
                      {activeChannel.name}
                    </span>

                    {activeChannel.isPrivate && (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '2px 8px',
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
                        fontSize: 11.5,
                        color: 'var(--text-3, #A1A1AA)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 420,
                      }}
                    >
                      {activeChannel.topic}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Pinned, Thread Popover, Search in Channel, Member Avatars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {/* Pin Filter Button */}
                <button
                  type="button"
                  onClick={() => setViewFilter(viewFilter === 'pinned' ? 'all' : 'pinned')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 8,
                    border:
                      viewFilter === 'pinned'
                        ? '1px solid var(--primary, #A238FF)'
                        : '1px solid var(--card-border, #E4E4E7)',
                    background:
                      viewFilter === 'pinned' ? 'var(--primary-light, #F5EBFF)' : '#FFFFFF',
                    color:
                      viewFilter === 'pinned'
                        ? 'var(--primary, #A238FF)'
                        : 'var(--text-2, #52525B)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  title="Pinned messages"
                >
                  <Pin size={13} />
                  {pinnedCount > 0 && <span>{pinnedCount}</span>}
                </button>

                {/* Thread Dropdown Trigger (matches reference # Thread button) */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowThreadsPopover(!showThreadsPopover)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 32,
                      padding: '0 11px',
                      borderRadius: 8,
                      border: showThreadsPopover
                        ? '1px solid var(--primary, #A238FF)'
                        : '1px solid var(--card-border, #E4E4E7)',
                      background: showThreadsPopover
                        ? 'var(--primary-light, #F5EBFF)'
                        : '#FFFFFF',
                      color: showThreadsPopover
                        ? 'var(--primary, #A238FF)'
                        : 'var(--text-1, #18181B)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <Hash size={13} />
                    <span>Thread</span>
                    {threadedMessages.length > 0 && (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '0 5px',
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
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: 300,
                        background: '#FFFFFF',
                        borderRadius: 14,
                        border: '1px solid var(--card-border, #E4E4E7)',
                        boxShadow: '0 16px 36px -6px rgba(17, 17, 24, 0.14)',
                        zIndex: 60,
                        padding: 8,
                      }}
                    >
                      <div
                        style={{
                          padding: '6px 10px',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--text-3, #A1A1AA)',
                          borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
                          marginBottom: 4,
                        }}
                      >
                        Active Threads in #{activeChannel.name}
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
                              padding: '8px 10px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 12.5,
                                  color: 'var(--text-1, #18181B)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {tm.content}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', marginTop: 2 }}>
                                Started by {tm.senderName}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 7px',
                                borderRadius: 999,
                                background: 'var(--primary-light, #F5EBFF)',
                                color: 'var(--primary, #A238FF)',
                                flexShrink: 0,
                              }}
                            >
                              {tm.replyCount}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: '16px 10px',
                            textAlign: 'center',
                            fontSize: 12,
                            color: 'var(--text-3, #A1A1AA)',
                          }}
                        >
                          No active threads in this channel yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search in channel input */}
                <div style={{ position: 'relative', width: 185 }}>
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
                    placeholder={`Search in #${activeChannel.name}`}
                    value={searchMessageTerm}
                    onChange={(e) => setSearchMessageTerm(e.target.value)}
                    style={{
                      width: '100%',
                      height: 32,
                      padding: '0 10px 0 30px',
                      fontSize: 12,
                      background: '#FAF9F7',
                      border: '1px solid var(--card-border, #E4E4E7)',
                      borderRadius: 8,
                      outline: 'none',
                      color: 'var(--text-1, #18181B)',
                    }}
                  />
                </div>

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
                    gap: 8,
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 8,
                    border:
                      showMemberDrawer && !activeThread && !selectedProfileMember
                        ? '1px solid var(--primary, #A238FF)'
                        : '1px solid var(--card-border, #E4E4E7)',
                    background:
                      showMemberDrawer && !activeThread && !selectedProfileMember
                        ? 'var(--primary-light, #F5EBFF)'
                        : '#FFFFFF',
                    color: 'var(--text-1, #18181B)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  title="Toggle channel members sidebar"
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {channelMembers.slice(0, 3).map((m, idx) => (
                      <span
                        key={m.id}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#F4F4F5',
                          border: '1.5px solid #FFFFFF',
                          marginLeft: idx === 0 ? 0 : -6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
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
                  <span>{channelMembers.length}</span>
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
              /* ─── MESSAGE STREAM ─── */
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
                {/* Channel Intro Header */}
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
                    <div>
                      <div style={{ fontSize: 14, color: 'var(--text-1, #18181B)' }}>
                        Welcome to <strong>#{activeChannel.name}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2, #52525B)', marginTop: 2 }}>
                        {activeChannel.description ||
                          'Start threads, share documents & images, or mention team members with @name.'}{' '}
                        <span style={{ color: 'var(--text-3, #A1A1AA)' }}>
                          · Created by {activeChannel.createdBy}
                        </span>
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
                {visibleMessages.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 20px',
                      textAlign: 'center',
                      color: 'var(--text-3, #A1A1AA)',
                      fontSize: 13,
                    }}
                  >
                    No messages match the current filter.
                  </div>
                ) : (
                  visibleMessages.map((msg) => {
                    const isMine = msg.senderId === currentUserId || msg.senderId === 'user';
                    const hasReplies = (msg.replyCount || 0) > 0;
                    const isHovered = hoveredMsgId === msg.id;

                    return (
                      <div
                        key={msg.id}
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
                              const found = allEmployees.find(
                                (e) =>
                                  String(e.id) === msg.senderId ||
                                  `${e.firstName} ${e.lastName}`.trim() === msg.senderName
                              );
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
                            {msg.senderAvatar ? (
                              <img
                                src={msg.senderAvatar}
                                alt={msg.senderName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              msg.senderName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                        </div>

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
                              {msg.attachments.map((att) => (
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
                                  {att.type === 'image' ? (
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
                                  ) : att.type === 'video' ? (
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
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '10px 14px',
                                        color: 'var(--text-1, #18181B)',
                                      }}
                                    >
                                      <FileText size={16} style={{ color: 'var(--primary, #A238FF)' }} />
                                      <div>
                                        <div style={{ fontSize: 12.5 }}>{att.name}</div>
                                        {att.size && (
                                          <div style={{ fontSize: 10.5, color: 'var(--text-3, #A1A1AA)' }}>
                                            {att.size}
                                          </div>
                                        )}
                                      </div>
                                    </a>
                                  )}
                                </div>
                              ))}
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
                                  {(msg.replies || []).slice(0, 3).map((rep, idx) => (
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
                                      {rep.senderAvatar ? (
                                        <img
                                          src={rep.senderAvatar}
                                          alt={rep.senderName}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        rep.senderName.slice(0, 1)
                                      )}
                                    </span>
                                  ))}
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
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
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
                      setInputText((prev) => prev + emoji);
                      textareaRef.current?.focus();
                    }}
                    onSelectAnimatedEmoji={(code) => {
                      setInputText(
                        (prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}[:anim:${code}:] `
                      );
                      setShowPicker(false);
                      textareaRef.current?.focus();
                    }}
                    onSelectGif={(gifUrl) => {
                      setUploadedAttachments((prev) => [
                        ...prev,
                        {
                          id: `gif-${Date.now()}-${Math.random()}`,
                          name: '',
                          url: gifUrl,
                          type: 'image',
                        },
                      ]);
                      setShowPicker(false);
                      textareaRef.current?.focus();
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
                              onClick={() => handleSelectMention(fullName)}
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

                {/* Slack-Inspired Rich Text & Media Composer Container */}
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
                  {/* Top WYSIWYG / Rich Text Formatting Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 10px',
                      borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
                      background: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {[
                        {
                          icon: <Bold size={13.5} />,
                          title: 'Bold (**text**)',
                          fn: () => applyFormat('**', '**', 'bold'),
                        },
                        {
                          icon: <Italic size={13.5} />,
                          title: 'Italic (_text_)',
                          fn: () => applyFormat('_', '_', 'italic'),
                        },
                        {
                          icon: <Strikethrough size={13.5} />,
                          title: 'Strikethrough (~~text~~)',
                          fn: () => applyFormat('~~', '~~', 'strikethrough'),
                        },
                        { divider: true },
                        {
                          icon: <Link2 size={13.5} />,
                          title: 'Insert Link ([label](url))',
                          fn: () => applyFormat('[', '](https://)', 'link text'),
                        },
                        {
                          icon: <ListOrdered size={13.5} />,
                          title: 'Numbered List',
                          fn: () => applyFormat('\n1. ', '', 'List item'),
                        },
                        {
                          icon: <List size={13.5} />,
                          title: 'Bulleted List',
                          fn: () => applyFormat('\n• ', '', 'List item'),
                        },
                        {
                          icon: <Quote size={13.5} />,
                          title: 'Blockquote (> quote)',
                          fn: () => applyFormat('\n> ', '', 'Quote'),
                        },
                        { divider: true },
                        {
                          icon: <Code size={13.5} />,
                          title: 'Inline Code (`code`)',
                          fn: () => applyFormat('`', '`', 'code'),
                        },
                        {
                          icon: <FileCode size={13.5} />,
                          title: 'Code Block (```code```)',
                          fn: () => applyFormat('\n```\n', '\n```\n', 'code snippet'),
                        },
                      ].map((item, idx) =>
                        item.divider ? (
                          <div
                            key={idx}
                            style={{
                              width: 1,
                              height: 15,
                              background: 'var(--border-subtle, #F0F0F3)',
                              margin: '0 4px',
                            }}
                          />
                        ) : (
                          <button
                            key={idx}
                            type="button"
                            onClick={item.fn}
                            title={item.title}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-2, #52525B)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F4F4F5';
                              e.currentTarget.style.color = 'var(--text-1, #18181B)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-2, #52525B)';
                            }}
                          >
                            {item.icon}
                          </button>
                        )
                      )}
                    </div>

                    <span style={{ fontSize: 10.5, color: 'var(--text-3, #A1A1AA)' }}>
                      Mix text, animated emojis & GIFs · Shift+Enter for new line
                    </span>
                  </div>

                  {/* Staged Attachments (GIFs, Images, Videos, Files) & Staged Poll */}
                  {(uploadedAttachments.length > 0 || stagedPoll) && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px 4px 12px',
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

                  {/* Textarea Input */}
                  <div style={{ padding: '8px 12px 6px 12px' }}>
                    <textarea
                      ref={textareaRef}
                      rows={2}
                      placeholder={`Write a message to #${activeChannel.name}... (type @ to mention, add animated emojis after text, or mix with a GIF)`}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        resize: 'none',
                        fontSize: 13.5,
                        color: 'var(--text-1, #18181B)',
                        padding: 0,
                        lineHeight: 1.45,
                      }}
                    />

                    {/* Live Inline Preview when Animated Emojis or Rich Formatting are used */}
                    {/\[:anim:[a-z0-9_]+:\]|\*\*|_.*_|~~|`|^>|^•|^\d+\./m.test(inputText) && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: '#FFFFFF',
                          border: '1px dashed var(--card-border, #E4E4E7)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: 'var(--primary, #A238FF)',
                            flexShrink: 0,
                          }}
                        >
                          Live Preview:
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <RichMessageContent content={inputText} />
                        </div>
                      </div>
                    )}
                  </div>

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
                        onClick={() => {
                          setInputText((prev) => prev + '@');
                          setMentionQuery('');
                          setMentionAnchorIdx(inputText.length);
                          textareaRef.current?.focus();
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
                        title="Inline Animated Emojis (added after text)"
                      >
                        <Zap size={11.5} style={{ color: 'var(--primary, #A238FF)' }} />
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
                        title="Live Tenor GIF Search (mix with text)"
                      >
                        <Sparkles size={11.5} style={{ color: 'var(--primary, #A238FF)' }} />
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
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          RIGHT CONTEXTUAL DRAWER:
          1. ThreadDrawer (when replying/viewing a thread)
          2. Member Profile Sidebar (when clicking a member, matching Reference Image 3)
          3. All Members Directory (default right sidebar, matching Reference Image 1)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeThread ? (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  const fullName = `${selectedProfileMember.firstName} ${selectedProfileMember.lastName}`.trim();
                  setInputText((prev) => `${prev}@${fullName} `);
                  textareaRef.current?.focus();
                }}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 9,
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
                    height: 34,
                    borderRadius: 9,
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

            {selectedProfileMember.email && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', marginBottom: 3 }}>
                  Email Address
                </div>
                <a
                  href={`mailto:${selectedProfileMember.email}`}
                  style={{
                    fontSize: 12.5,
                    color: 'var(--primary, #A238FF)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    wordBreak: 'break-all',
                  }}
                >
                  <Mail size={13} />
                  <span>{selectedProfileMember.email}</span>
                </a>
              </div>
            )}

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
      ) : null}

      {/* Create Channel Modal */}
      <CreateChannelModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/* Full-Screen Media Lightbox (Images & Videos) */}
      <MediaLightbox item={lightboxMedia} onClose={() => setLightboxMedia(null)} />
    </div>
  );
}
