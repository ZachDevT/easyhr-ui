"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Hash, 
  Lock, 
  Search, 
  Plus, 
  Send, 
  Smile, 
  Paperclip, 
  Image as ImageIcon, 
  MessageSquare, 
  Heart, 
  Trash2, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  AtSign, 
  ChevronDown, 
  Sparkles,
  Info,
  ShieldAlert,
  Pin
} from 'lucide-react';
import { useChat, ChatMessage } from '@/context/ChatContext';
import { useRole } from '@/context/RoleContext';
import { CreateChannelModal } from '@/components/chat/CreateChannelModal';
import { ThreadDrawer } from '@/components/chat/ThreadDrawer';
import { EmojiGifPicker } from '@/components/chat/EmojiGifPicker';

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
    toggleReaction,
    requestToJoinChannel,
    approveJoinRequest,
    rejectJoinRequest,
    typingUsers,
    setTyping,
    allEmployees,
  } = useChat();

  const { currentUser, role } = useRole();

  // State
  const [inputText, setInputText] = useState('');
  const [searchChannelTerm, setSearchChannelTerm] = useState('');
  const [searchMessageTerm, setSearchMessageTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchorIdx, setMentionAnchorIdx] = useState<number>(-1);
  const [uploadedAttachments, setUploadedAttachments] = useState<{
    id: string;
    name: string;
    url: string;
    type: 'image' | 'file';
    size?: string;
  }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom of chat on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if current user is member / admin
  const currentUserId = String(currentUser?.id || 'user');
  const isMember = activeChannel ? activeChannel.memberIds.includes(currentUserId) : false;
  const isChannelAdmin = activeChannel ? activeChannel.adminIds.includes(currentUserId) || role === 'HR Admin' : false;
  const hasRequested = activeChannel ? activeChannel.pendingRequestUserIds.includes(currentUserId) : false;

  // Filter channels
  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchChannelTerm.toLowerCase()) ||
    (ch.department && ch.department.toLowerCase().includes(searchChannelTerm.toLowerCase()))
  );

  const publicChannels = filteredChannels.filter(c => !c.isPrivate && !c.departmentRestricted);
  const departmentChannels = filteredChannels.filter(c => c.departmentRestricted);
  const privateChannels = filteredChannels.filter(c => c.isPrivate && !c.departmentRestricted);

  // Filter messages by search
  const visibleMessages = searchMessageTerm
    ? messages.filter(m => 
        m.content.toLowerCase().includes(searchMessageTerm.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchMessageTerm.toLowerCase())
      )
    : messages;

  // Handle Mentions typing
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

  // Send message
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && uploadedAttachments.length === 0) return;
    if (!activeChannel) return;

    sendMessage(
      inputText.trim(),
      uploadedAttachments.length > 0 ? uploadedAttachments : undefined
    );

    setInputText('');
    setUploadedAttachments([]);
    setTyping(false);
    setMentionQuery(null);
  };

  // Mock file attachment upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const fileUrl = URL.createObjectURL(file);
      setUploadedAttachments(prev => [
        ...prev,
        {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          url: fileUrl,
          type: isImg ? 'image' : 'file',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        }
      ]);
    });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white text-gray-800">
      {/* ─── LEFT: Inner Slack Channels Sidebar ──────────────────────────────── */}
      <aside className="w-64 border-r border-gray-200 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        {/* Workspace Brand Pill */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              💬
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">EasyHR Workspace</div>
              <div className="text-[10px] text-slate-400">Team Discussions</div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Create Group Chat"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Channel Search */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Jump to channel..."
              value={searchChannelTerm}
              onChange={(e) => setSearchChannelTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Public Channels */}
          <div>
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Public Channels</span>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded">{publicChannels.length}</span>
            </div>
            <div className="space-y-0.5">
              {publicChannels.map(ch => {
                const isActive = activeChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannelId(ch.id);
                      setActiveThread(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive 
                        ? 'bg-purple-600 text-white font-semibold shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span className="truncate">{ch.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Groups */}
          <div>
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Department Hubs</span>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded">{departmentChannels.length}</span>
            </div>
            <div className="space-y-0.5">
              {departmentChannels.map(ch => {
                const isActive = activeChannel?.id === ch.id;
                const isUserInDept = ch.memberIds.includes(currentUserId);
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannelId(ch.id);
                      setActiveThread(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive 
                        ? 'bg-purple-600 text-white font-semibold shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs">{ch.iconEmoji || '🏢'}</span>
                      <span className="truncate">{ch.name}</span>
                    </div>
                    {!isUserInDept && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Lock</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Private Channels */}
          <div>
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Private Rooms</span>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded">{privateChannels.length}</span>
            </div>
            <div className="space-y-0.5">
              {privateChannels.map(ch => {
                const isActive = activeChannel?.id === ch.id;
                const isUserInGroup = ch.memberIds.includes(currentUserId);
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannelId(ch.id);
                      setActiveThread(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive 
                        ? 'bg-purple-600 text-white font-semibold shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Lock size={13} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span className="truncate">{ch.name}</span>
                    </div>
                    {!isUserInGroup && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Restricted</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Status Bar in Sidebar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-purple-500 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                {currentUser?.firstName?.slice(0, 1) || 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser?.firstName || 'Current User'}</div>
              <div className="text-[10px] text-slate-400 truncate">{role}</div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="New Group"
          >
            <Plus size={16} />
          </button>
        </div>
      </aside>

      {/* ─── CENTER: Channel Canvas ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeChannel ? (
          <>
            {/* Channel Top Header */}
            <div className="h-14 px-6 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                  {activeChannel.iconEmoji || (activeChannel.isPrivate ? <Lock size={15} /> : <Hash size={16} />)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-bold text-gray-900 truncate">
                      {activeChannel.name}
                    </h1>
                    {activeChannel.department && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {activeChannel.department}
                      </span>
                    )}
                    {activeChannel.isPrivate && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate max-w-md">
                    {activeChannel.topic || activeChannel.description || 'Welcome to this group!'}
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2">
                {/* Search in channel */}
                <div className="relative hidden md:block">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search channel..."
                    value={searchMessageTerm}
                    onChange={(e) => setSearchMessageTerm(e.target.value)}
                    className="pl-7 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 w-36 focus:w-52 transition-all"
                  />
                </div>

                {/* Members Drawer Toggle */}
                <button
                  onClick={() => setShowMemberDrawer(!showMemberDrawer)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    showMemberDrawer 
                      ? 'bg-purple-50 border-purple-200 text-purple-700' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users size={14} />
                  <span>{activeChannel.memberIds.length}</span>
                </button>
              </div>
            </div>

            {/* Pending Access Banner for Admins */}
            {isChannelAdmin && activeChannel.pendingRequestUserIds.length > 0 && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
                  <ShieldAlert size={16} className="text-amber-600" />
                  <span>
                    <strong>{activeChannel.pendingRequestUserIds.length}</strong> {activeChannel.pendingRequestUserIds.length === 1 ? 'employee wants' : 'employees want'} to join this channel.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeChannel.pendingRequestUserIds.map((userId) => {
                    const emp = allEmployees.find(e => String(e.id) === userId);
                    const empFullName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : `Employee #${userId}`;
                    return (
                      <div key={userId} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-200 text-xs shadow-xs">
                        <span className="font-semibold text-gray-800">{empFullName}</span>
                        <button
                          type="button"
                          onClick={() => approveJoinRequest(activeChannel.id, userId)}
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectJoinRequest(activeChannel.id, userId)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Decline"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If user is NOT a member of private / restricted channel */}
            {!isMember ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                  <Lock size={32} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">This channel is private or restricted</h2>
                <p className="text-xs text-gray-500 max-w-sm mb-5 leading-relaxed">
                  You need approval from the channel administrator to view conversations and participate in #{activeChannel.name}.
                </p>

                {hasRequested ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                    <Sparkles size={15} />
                    <span>Join request pending admin approval</span>
                  </div>
                ) : (
                  <button
                    onClick={() => requestToJoinChannel(activeChannel.id)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                  >
                    <UserPlus size={15} />
                    <span>Request to Join Channel</span>
                  </button>
                )}
              </div>
            ) : (
              /* Message Stream */
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Channel Welcome Banner */}
                <div className="p-5 bg-gradient-to-r from-purple-50/80 to-indigo-50/40 rounded-2xl border border-purple-100 mb-4">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-base mb-1">
                    <span>{activeChannel.iconEmoji || '🚀'}</span>
                    <span>Welcome to #{activeChannel.name}!</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                    {activeChannel.description || 'This is the start of the channel. Discuss projects, share files, react with emojis, and start threads.'}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
                    <span>Created by {activeChannel.createdBy}</span>
                    <span>•</span>
                    <span>{activeChannel.memberIds.length} members</span>
                  </div>
                </div>

                {/* Messages list */}
                {visibleMessages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  const hasReplies = (msg.replyCount || 0) > 0;

                  return (
                    <div 
                      key={msg.id}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors relative"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-purple-200/50">
                        {msg.senderAvatar ? (
                          <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                        ) : (
                          msg.senderName.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-gray-900">{msg.senderName}</span>
                          {msg.senderRole && (
                            <span className="text-[10px] text-gray-400 font-medium">({msg.senderRole})</span>
                          )}
                          <span className="text-[10px] text-gray-400">{msg.createdAt}</span>
                        </div>

                        {/* Message Text */}
                        <div className="text-xs text-gray-800 mt-1 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {msg.attachments.map(att => (
                              <div key={att.id} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-xs max-w-sm">
                                {att.type === 'image' ? (
                                  <img 
                                    src={att.url} 
                                    alt={att.name} 
                                    className="max-h-60 rounded-xl object-contain hover:scale-102 transition-transform cursor-pointer"
                                  />
                                ) : (
                                  <a 
                                    href={att.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 p-2.5 hover:bg-gray-100 transition-colors"
                                  >
                                    <Paperclip size={14} className="text-purple-600" />
                                    <div className="text-xs">
                                      <div className="font-semibold text-gray-800">{att.name}</div>
                                      {att.size && <div className="text-[10px] text-gray-400">{att.size}</div>}
                                    </div>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reaction pills */}
                        {msg.reactions && Object.values(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {Object.values(msg.reactions).map(r => {
                              const hasReacted = r.users.includes(currentUserId);
                              return (
                                <button
                                  key={r.emoji}
                                  type="button"
                                  onClick={() => toggleReaction(msg.id, r.emoji)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                                    hasReacted 
                                      ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold' 
                                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-[11px]">{r.count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Thread Replies Button */}
                        {hasReplies && (
                          <button
                            type="button"
                            onClick={() => setActiveThread(msg)}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                          >
                            <MessageSquare size={13} />
                            <span>{msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}</span>
                            <span className="text-[11px] text-gray-400 font-normal">View thread</span>
                          </button>
                        )}
                      </div>

                      {/* Floating Action Controls on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-2 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm p-1">
                        <button
                          type="button"
                          onClick={() => toggleReaction(msg.id, '❤️')}
                          className="p-1 text-gray-400 hover:text-rose-500 rounded hover:bg-gray-50"
                          title="Love"
                        >
                          <Heart size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleReaction(msg.id, '🔥')}
                          className="p-1 text-gray-400 hover:text-amber-500 rounded hover:bg-gray-50"
                          title="Fire"
                        >
                          🔥
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleReaction(msg.id, '🚀')}
                          className="p-1 text-gray-400 hover:text-purple-500 rounded hover:bg-gray-50"
                          title="Rocket"
                        >
                          🚀
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveThread(msg)}
                          className="p-1 text-gray-400 hover:text-purple-600 rounded hover:bg-gray-50"
                          title="Reply in thread"
                        >
                          <MessageSquare size={14} />
                        </button>
                        {(isMine || role === 'HR Admin') && (
                          <button
                            type="button"
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-6 py-1 text-[11px] text-purple-600 italic animate-pulse">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            {/* Message Compose Box */}
            {isMember && (
              <div className="p-4 border-t border-gray-200 bg-white relative">
                {/* Emoji / GIF popover */}
                {showPicker && (
                  <EmojiGifPicker
                    onSelectEmoji={(emoji) => {
                      setInputText(prev => prev + emoji);
                      setShowPicker(false);
                    }}
                    onSelectGif={(gifUrl, title) => {
                      sendMessage(title || 'GIF', [{
                        id: `gif-${Date.now()}`,
                        name: title || 'animated.gif',
                        url: gifUrl,
                        type: 'image',
                      }]);
                      setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                  />
                )}

                {/* Mentions Autocomplete Box */}
                {mentionQuery !== null && (
                  <div className="absolute bottom-full mb-2 left-6 z-40 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden text-gray-800">
                    <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      Mention Colleague
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {allEmployees
                        .filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(mentionQuery))
                        .map(emp => {
                          const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => handleSelectMention(fullName)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-purple-50 text-left transition-colors"
                            >
                              <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[9px] flex items-center justify-center">
                                {fullName.slice(0, 1)}
                              </div>
                              <span className="font-semibold text-gray-800">{fullName}</span>
                              <span className="text-[10px] text-gray-400">({emp.department})</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Staged Attachments Previews */}
                {uploadedAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-purple-50/50 rounded-xl border border-purple-100">
                    {uploadedAttachments.map(att => (
                      <div key={att.id} className="relative group bg-white px-2 py-1 rounded-lg border border-gray-200 text-xs flex items-center gap-1.5 shadow-2xs">
                        <Paperclip size={12} className="text-purple-600" />
                        <span className="max-w-xs truncate font-medium text-gray-700">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setUploadedAttachments(prev => prev.filter(a => a.id !== att.id))}
                          className="text-gray-400 hover:text-rose-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Input Box */}
                <form onSubmit={handleSend} className="border border-gray-200 rounded-2xl bg-white focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 transition-all shadow-2xs">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    placeholder={`Message #${activeChannel.name}... (type @ to mention)`}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="w-full px-4 pt-3 pb-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none bg-transparent"
                  />

                  {/* Input Toolstrip */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPicker(!showPicker)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-white transition-colors"
                        title="Emojis & GIFs"
                      >
                        <Smile size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-white transition-colors"
                        title="Attach Files / Photos"
                      >
                        <Paperclip size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputText(prev => prev + '@');
                          setMentionQuery('');
                          setMentionAnchorIdx(inputText.length);
                          textareaRef.current?.focus();
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-white transition-colors"
                        title="Mention colleague"
                      >
                        <AtSign size={16} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!inputText.trim() && uploadedAttachments.length === 0}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Send</span>
                      <Send size={12} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <MessageSquare size={36} className="mb-2 text-purple-300" />
            <h3 className="text-sm font-bold text-gray-700">No Channel Selected</h3>
            <p className="text-xs text-gray-400 max-w-sm mt-1">
              Select a channel from the left sidebar or create a new group chat to start collaborating.
            </p>
          </div>
        )}
      </div>

      {/* ─── RIGHT: Collapsible Thread Drawer ───────────────────────────────── */}
      {activeThread && (
        <ThreadDrawer
          parentMessage={activeThread}
          onClose={() => setActiveThread(null)}
        />
      )}

      {/* ─── RIGHT: Members Drawer ─────────────────────────────────────────── */}
      {showMemberDrawer && activeChannel && !activeThread && (
        <div className="w-72 border-l border-gray-200 bg-white flex flex-col h-full shadow-lg z-20 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-600" />
              <span className="text-xs font-bold text-gray-900">Channel Members</span>
            </div>
            <button
              onClick={() => setShowMemberDrawer(false)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Members ({activeChannel.memberIds.length})
            </div>
            {activeChannel.memberIds.map(memId => {
              const emp = allEmployees.find(e => String(e.id) === memId);
              const isAdmin = activeChannel.adminIds.includes(memId);
              const empFullName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : (memId === 'user' ? 'Me' : `User #${memId}`);
              return (
                <div key={memId} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                      {emp?.avatar ? (
                        <img src={emp.avatar} alt={empFullName} className="w-full h-full object-cover" />
                      ) : (
                        empFullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{empFullName}</div>
                      <div className="text-[10px] text-gray-400 truncate">{emp?.title || 'Team Member'}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MODAL: Create Group Chat ─────────────────────────────────────── */}
      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
