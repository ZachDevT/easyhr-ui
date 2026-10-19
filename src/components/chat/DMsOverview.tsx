"use client";

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  Clock,
  Sparkles,
  Paperclip,
  Check,
  ChevronRight,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { ChatChannel, ChatMessage } from '@/context/ChatContext';
import { Employee } from '@/data/employees';

interface DMsOverviewProps {
  directMessageChannels: ChatChannel[];
  activeChannelId: string | null;
  onSelectDM: (channelId: string) => void;
  onStartNewDM: () => void;
  allEmployees: Employee[];
  allMessages: ChatMessage[];
  currentUser: any;
  getDMParticipant: (ch: ChatChannel) => {
    name: string;
    avatar?: string;
    title: string;
    department: string;
    isGroup: boolean;
    memberCount: number;
    employee?: Employee;
  } | null;
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function DMsOverview({
  directMessageChannels,
  activeChannelId,
  onSelectDM,
  onStartNewDM,
  allEmployees,
  allMessages,
  currentUser,
  getDMParticipant,
}: DMsOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const currentUserId = String(currentUser?.id || '');
  const currentUserEmpId = (currentUser as any)?.employeeId ? String((currentUser as any).employeeId) : '';

  // Calculate rich list of DMs with latest message info
  const dmsWithMeta = useMemo(() => {
    return directMessageChannels.map((ch) => {
      const dmInfo = getDMParticipant(ch);

      // Find the latest message in this channel
      const channelMsgs = allMessages
        .filter((m) => m.channelId === ch.id && !m.replyToId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const latestMsg = channelMsgs[0];
      let previewText = 'Direct conversation started';
      let previewSender = '';
      let timestamp = ch.lastMessageAt || ch.createdAt;

      if (latestMsg) {
        timestamp = latestMsg.createdAt;
        previewSender =
          latestMsg.senderId === currentUserId || (currentUserEmpId && latestMsg.senderId === currentUserEmpId)
            ? 'You'
            : latestMsg.senderName.split(' ')[0];

        if (latestMsg.content && latestMsg.content.trim()) {
          // Strip HTML tags for clean text snippet
          previewText = latestMsg.content.replace(/<[^>]*>?/gm, '').trim();
        } else if (latestMsg.attachments && latestMsg.attachments.length > 0) {
          const type = latestMsg.attachments[0].type;
          previewText = type === 'image' ? '📷 Sent an image' : '📎 Sent an attachment';
        } else if (latestMsg.poll) {
          previewText = '📊 Created a poll';
        }
      }

      return {
        channel: ch,
        dmInfo,
        latestMsg,
        previewSender,
        previewText,
        timestamp,
        timeAgo: formatRelativeTime(timestamp),
        unreadCount: ch.unreadCount || 0,
      };
    });
  }, [directMessageChannels, allMessages, currentUserId, currentUserEmpId, getDMParticipant]);

  // Filter DMs by search
  const filteredDMs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return dmsWithMeta;
    return dmsWithMeta.filter((item) => {
      const name = (item.dmInfo?.name || '').toLowerCase();
      const title = (item.dmInfo?.title || '').toLowerCase();
      const dept = (item.dmInfo?.department || '').toLowerCase();
      const preview = item.previewText.toLowerCase();
      return name.includes(q) || title.includes(q) || dept.includes(q) || preview.includes(q);
    });
  }, [dmsWithMeta, searchTerm]);

  // Quick coworker suggestions (coworkers you can message with 1 click)
  const quickCoworkers = useMemo(() => {
    return allEmployees
      .filter((emp) => {
        const idStr = String(emp.id);
        return idStr !== currentUserId && idStr !== currentUserEmpId;
      })
      .slice(0, 8);
  }, [allEmployees, currentUserId, currentUserEmpId]);

  const totalUnreadCount = directMessageChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FAF9F7',
        overflowY: 'auto',
      }}
    >
      {/* Top Header Banner */}
      <div
        style={{
          padding: '24px 32px 20px 32px',
          background: '#FFFFFF',
          borderBottom: '1px solid var(--card-border, #E4E4E7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#F5EEFF',
              border: '1px solid var(--primary-tint, #DBEAFE)',
              color: 'var(--primary, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: 'var(--font-title)',
                  color: 'var(--text-1, #18181B)',
                }}
              >
                Direct Messages
              </h1>
              {totalUnreadCount > 0 ? (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: 999,
                    background: 'var(--primary, #2563EB)',
                    color: '#FFFFFF',
                  }}
                >
                  {totalUnreadCount} new
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    padding: '2px 9px',
                    borderRadius: 999,
                    background: '#F4F4F5',
                    color: 'var(--text-2, #52525B)',
                  }}
                >
                  {directMessageChannels.length} conversation{directMessageChannels.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 12.5,
                color: 'var(--text-3, #A1A1AA)',
                margin: '3px 0 0 0',
              }}
            >
              1:1 chats and group direct messages with your teammates across the workspace
            </p>
          </div>
        </div>

        {/* Start New DM Button */}
        <button
          type="button"
          onClick={onStartNewDM}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--primary, #2563EB)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(162, 56, 255, 0.3)',
            flexShrink: 0,
          }}
        >
          <Plus size={15} />
          <span>New Direct Message</span>
        </button>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1080, width: '100%', margin: '0 auto' }}>
        {/* Search Bar */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 11,
              background: '#FFFFFF',
              border: '1px solid var(--card-border, #E4E4E7)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-3, #A1A1AA)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search conversations by teammate name, role, department, or message content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13.5,
                color: 'var(--text-1, #18181B)',
              }}
            />
          </div>
        </div>

        {/* Quick Connect Teammates Bar */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid var(--card-border, #E4E4E7)',
            padding: '14px 18px',
            marginBottom: 24,
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-3, #A1A1AA)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <UserPlus size={13} />
            <span>Quick Start Conversation</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {quickCoworkers.map((emp) => {
              const fullName = `${emp.firstName} ${emp.lastName}`.trim();
              return (
                <div
                  key={emp.id}
                  onClick={onStartNewDM}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px 6px 8px',
                    borderRadius: 999,
                    background: '#FAF9F7',
                    border: '1px solid var(--card-border, #E4E4E7)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5EEFF';
                    e.currentTarget.style.borderColor = 'var(--primary-tint, #DBEAFE)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAF9F7';
                    e.currentTarget.style.borderColor = 'var(--card-border, #E4E4E7)';
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
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
                        fontWeight: 700,
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
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#10B981',
                        border: '1.5px solid #FFFFFF',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1, #18181B)' }}>
                    {emp.firstName}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--primary, #2563EB)', fontWeight: 600 }}>
                    + Chat
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest DMs Activity List */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-3, #A1A1AA)',
              marginBottom: 10,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Recent Conversations ({filteredDMs.length})</span>
            {searchTerm && (
              <span style={{ fontSize: 11.5, color: 'var(--text-3, #A1A1AA)', textTransform: 'none', fontWeight: 400 }}>
                Filtering by &quot;{searchTerm}&quot;
              </span>
            )}
          </div>

          {filteredDMs.length === 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid var(--card-border, #E4E4E7)',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: '#F5EEFF',
                  border: '1px solid var(--primary-tint, #DBEAFE)',
                  color: 'var(--primary, #2563EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <MessageSquare size={24} />
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: '0 0 6px 0',
                  color: 'var(--text-1, #18181B)',
                  fontFamily: 'var(--font-title)',
                }}
              >
                {searchTerm ? 'No matching conversations' : 'No direct messages yet'}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-2, #52525B)',
                  maxWidth: 380,
                  margin: '0 auto 20px',
                  lineHeight: 1.5,
                }}
              >
                {searchTerm
                  ? 'Try searching with a different name or keyword.'
                  : 'Start 1:1 direct conversations or group chats with any coworker in your company.'}
              </p>
              <button
                type="button"
                onClick={onStartNewDM}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--primary, #2563EB)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(162, 56, 255, 0.3)',
                }}
              >
                <Plus size={15} />
                <span>Start a New Conversation</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredDMs.map((item) => {
                const isSelected = activeChannelId === item.channel.id;
                const hasUnread = item.unreadCount > 0;
                return (
                  <div
                    key={item.channel.id}
                    onClick={() => onSelectDM(item.channel.id)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 12,
                      border: isSelected
                        ? '1.5px solid var(--primary, #2563EB)'
                        : hasUnread
                        ? '1px solid var(--primary-tint, #DBEAFE)'
                        : '1px solid var(--card-border, #E4E4E7)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? '0 2px 8px rgba(162, 56, 255, 0.1)'
                        : '0 1px 2px rgba(0, 0, 0, 0.02)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--primary-tint, #DBEAFE)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = hasUnread ? 'var(--primary-tint, #DBEAFE)' : 'var(--card-border, #E4E4E7)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02)';
                      }
                    }}
                  >
                    {/* Left: Avatar with Status Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: '#FAF9F7',
                            border: '1px solid var(--card-border, #E4E4E7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text-1, #18181B)',
                            overflow: 'hidden',
                          }}
                        >
                          {item.dmInfo?.avatar ? (
                            <img
                              src={item.dmInfo.avatar}
                              alt={item.dmInfo.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : item.dmInfo?.isGroup ? (
                            <Users size={18} style={{ color: 'var(--primary, #2563EB)' }} />
                          ) : (
                            (item.dmInfo?.name || 'DM').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        {!item.dmInfo?.isGroup && (
                          <span
                            style={{
                              position: 'absolute',
                              right: 1,
                              bottom: 1,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: '#10B981',
                              border: '2px solid #FFFFFF',
                            }}
                          />
                        )}
                      </div>

                      {/* Name, Title, and Latest Message snippet */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span
                            style={{
                              fontSize: 14.5,
                              fontWeight: hasUnread ? 700 : 600,
                              color: 'var(--text-1, #18181B)',
                              fontFamily: 'var(--font-title)',
                            }}
                          >
                            {item.dmInfo?.name}
                          </span>
                          {item.dmInfo?.isGroup ? (
                            <span
                              style={{
                                fontSize: 10.5,
                                padding: '1px 7px',
                                borderRadius: 999,
                                background: '#F5EEFF',
                                border: '1px solid var(--primary-tint, #DBEAFE)',
                                color: 'var(--primary, #2563EB)',
                                fontWeight: 600,
                              }}
                            >
                              Group DM
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: '#059669',
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              · Active now
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: 12.5,
                            color: hasUnread ? 'var(--text-1, #18181B)' : 'var(--text-2, #52525B)',
                            fontWeight: hasUnread ? 600 : 400,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 520,
                          }}
                        >
                          {item.previewSender && (
                            <span style={{ color: 'var(--text-1, #18181B)', fontWeight: 600 }}>
                              {item.previewSender}:{' '}
                            </span>
                          )}
                          <span>{item.previewText}</span>
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-3, #A1A1AA)',
                            marginTop: 3,
                          }}
                        >
                          {item.dmInfo?.title}
                          {item.dmInfo?.department ? ` · ${item.dmInfo.department}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp, Unread Badge, and Open Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        {item.timeAgo && (
                          <div
                            style={{
                              fontSize: 11.5,
                              color: hasUnread ? 'var(--primary, #2563EB)' : 'var(--text-3, #A1A1AA)',
                              fontWeight: hasUnread ? 600 : 400,
                              marginBottom: 4,
                            }}
                          >
                            {item.timeAgo}
                          </div>
                        )}

                        {hasUnread ? (
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: 10.5,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'var(--primary, #2563EB)',
                              color: '#FFFFFF',
                              fontWeight: 700,
                            }}
                          >
                            {item.unreadCount} new
                          </span>
                        ) : null}
                      </div>

                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: '#FAF9F7',
                          border: '1px solid var(--card-border, #E4E4E7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-2, #52525B)',
                        }}
                      >
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
