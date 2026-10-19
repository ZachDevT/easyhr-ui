"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Inbox,
  HelpCircle,
  Settings,
  Gift,
  Megaphone,
  CheckSquare,
  Bell,
  LifeBuoy,
  FileText,
  Shield,
  User,
  Sliders,
  LogOut,
  ExternalLink,
  ChevronRight,
  Check,
  MessageSquare,
} from 'lucide-react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useRole } from '../../context/RoleContext';
import { useCompany } from '../../context/CompanyContext';
import { useChat } from '../../context/ChatContext';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { Input } from '../ui/Input';
import { toast } from '../ui/Toast';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { getToken, isSignedIn } = useAuth();
  const { role, isHRAdmin, currentUser } = useRole();
  const { userProfile, company } = useCompany();
  const { channels } = useChat();

  // Compute live chat activity badge (unread channel messages + pending join requests for admins)
  const currentUserId = String(currentUser?.id || 'user');
  const chatActivityCount = channels.reduce((acc, ch) => {
    const unread = ch.unreadCount || 0;
    const isChanAdmin = ch.adminIds.includes(currentUserId) || ch.adminIds.includes('user') || isHRAdmin;
    const pendingReqs = isChanAdmin ? (ch.pendingRequestUserIds?.length || 0) : 0;
    return acc + unread + pendingReqs;
  }, 0);
  const isChatActive = pathname === '/chat' || pathname?.startsWith('/chat/');

  // Dropdown states
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Notifications data
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState<'all' | 'wish' | 'approval' | 'announcement'>('all');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for outside click detection
  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(target)) {
        setHelpOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch real notifications
  const fetchNotifications = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    const handleCustomRefresh = () => fetchNotifications();
    window.addEventListener('easyhr_notification_refresh', handleCustomRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('easyhr_notification_refresh', handleCustomRefresh);
    };
  }, [isSignedIn]);

  // Mark notifications as read
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success('All caught up', 'All notifications marked as read.');

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/notifications/mark-read`, {
            method: 'POST',
            headers: getAuthHeaders(token),
          });
        }
      } catch {}
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            await fetch(`${API_BASE_URL}/api/v1/notifications/mark-read`, {
              method: 'POST',
              headers: getAuthHeaders(token),
              body: JSON.stringify({ notificationId: item.id }),
            });
          }
        } catch {}
      }
    }
    setNotifOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'all') return true;
    return n.category === notifFilter;
  });

  const getNotificationIcon = (cat: string) => {
    switch (cat) {
      case 'chat':
        return <MessageSquare size={16} style={{ color: '#7c3aed' }} />;
      case 'wish':
        return <Gift size={16} className="text-primary" />;
      case 'announcement':
        return <Megaphone size={16} style={{ color: '#2563eb' }} />;
      case 'approval':
        return <CheckSquare size={16} style={{ color: '#10b981' }} />;
      default:
        return <Bell size={16} style={{ color: 'var(--text-3)' }} />;
    }
  };

  return (
    <header className="topbar" style={{ position: 'relative', zIndex: 70 }}>
      {/* Global Search */}
      <div className="topbar-search">
        <Input
          type="text"
          placeholder="Search people, documents, policies..."
          leftIcon={<Search size={15} />}
          containerStyle={{ width: 300 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              router.push(`/directory?search=${encodeURIComponent(searchQuery.trim())}`);
            }
          }}
        />
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Dynamic Role Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'var(--primary-tint)',
            color: 'var(--primary)',
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
          <span>{userProfile?.role || role}</span>
        </div>

        {/* 0. Group Chat Shortcut with Custom Dual-Bubble Icon & Live Activity Badge */}
        <Link
          href="/chat"
          title="Group Chats & Channels"
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            height: 36,
            padding: '0 12px',
            borderRadius: 10,
            background: isChatActive ? 'var(--primary)' : '#FAF9F7',
            color: isChatActive ? '#FFFFFF' : 'var(--text-1)',
            border: isChatActive ? '1px solid var(--primary)' : '1px solid var(--card-border, #E4E4E7)',
            textDecoration: 'none',
            fontSize: 12.5,
            fontWeight: 600,
            transition: 'all 0.16s ease',
            boxShadow: isChatActive ? '0 4px 12px rgba(162, 56, 255, 0.22)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          {/* Custom Dual-Bubble Workspace Chat Icon */}
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M17.5 13.5C19.9853 13.5 22 11.6569 22 9.38333C22 7.10978 19.9853 5.26667 17.5 5.26667C17.1636 5.26667 16.8359 5.30056 16.5205 5.36478C15.6542 3.39411 13.5241 2 11 2C7.68629 2 5 4.46243 5 7.5C5 8.59822 5.35113 9.62133 5.95627 10.48C5.64761 11.4112 5.05882 12.4041 4.44262 13.0203C4.18359 13.2793 4.39128 13.7222 4.7561 13.6857C5.96191 13.5651 7.21311 13.1538 8.08197 12.6621C8.96197 12.9442 9.95541 13.1 11 13.1C11.3418 13.1 11.6772 13.0736 12.0033 13.0229"
              stroke="currentColor"
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
               opacity={isChatActive ? 0.85 : 0.55}
            />
            <path
              d="M14.5 9.5C10.9101 9.5 8 11.9624 8 15C8 18.0376 10.9101 20.5 14.5 20.5C15.5071 20.5 16.4608 20.3061 17.3115 19.9601C18.1762 20.4912 19.373 20.9154 20.5246 21.0369C20.8878 21.0752 21.0954 20.6353 20.8387 20.376C20.2442 19.7755 19.6776 18.8199 19.3765 17.92C20.391 17.0085 21 15.7745 21 14.4167C21 11.7013 18.0899 9.5 14.5 9.5Z"
              fill={isChatActive ? 'rgba(255,255,255,0.2)' : 'var(--primary-tint, #F5EBFF)'}
              stroke={isChatActive ? '#FFFFFF' : 'var(--primary, #A238FF)'}
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12.3" cy="15" r="1" fill={isChatActive ? '#FFFFFF' : 'var(--primary, #A238FF)'} />
            <circle cx="14.6" cy="15" r="1" fill={isChatActive ? '#FFFFFF' : 'var(--primary, #A238FF)'} />
            <circle cx="16.9" cy="15" r="1" fill={isChatActive ? '#FFFFFF' : 'var(--primary, #A238FF)'} />
          </svg>
          <span>Chat</span>
          {chatActivityCount > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 999,
                background: isChatActive ? '#FFFFFF' : '#EF4444',
                color: isChatActive ? 'var(--primary)' : '#FFFFFF',
                fontSize: 10.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {chatActivityCount}
            </span>
          )}
        </Link>

        {/* 1. Notifications Center */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            title="Inbox & Notifications"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setHelpOpen(false);
              setSettingsOpen(false);
            }}
            style={{
              background: notifOpen ? 'var(--primary-tint)' : undefined,
              color: notifOpen ? 'var(--primary)' : undefined,
            }}
          >
            <Inbox size={18} strokeWidth={2} />
            {unreadCount > 0 && <span className="topbar-badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 360,
                background: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--card-border)',
                borderRadius: 14,
                boxShadow: '0 16px 36px -4px rgba(0,0,0,0.18), 0 6px 16px -2px rgba(0,0,0,0.08)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--card-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: 10,
                        background: 'var(--primary-tint)',
                        color: 'var(--primary)',
                      }}
                    >
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--primary)',
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '6px 12px',
                  background: 'var(--primary-tint, #f8f7ff)',
                  borderBottom: '1px solid var(--card-border)',
                }}
              >
                {[
                  { id: 'all',          label: 'All' },
                  { id: 'chat',         label: 'Chat' },
                  { id: 'wish',         label: 'Wishes' },
                  { id: 'announcement', label: 'News' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setNotifFilter(f.id as any)}
                    style={{
                      fontSize: 11,
                      fontWeight: notifFilter === f.id ? 700 : 500,
                      padding: '3px 10px',
                      borderRadius: 14,
                      border: 'none',
                      background: notifFilter === f.id ? 'var(--primary)' : 'transparent',
                      color: notifFilter === f.id ? '#ffffff' : 'var(--text-4)',
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Items list */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {filteredNotifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'var(--primary-tint)',
                        color: 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Check size={18} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>All caught up</p>
                    <p style={{ fontSize: 12, color: 'var(--text-5)', margin: 0 }}>
                      No new notifications right now.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        borderBottom: '1px solid var(--card-border)',
                        background: n.isRead ? 'transparent' : 'rgba(124, 58, 237, 0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--primary-tint)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {getNotificationIcon(n.category)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: n.isRead ? 600 : 700, margin: 0 }}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '2px 0 4px 0' }}>
                          {n.message}
                        </p>
                        <span style={{ fontSize: 11, color: 'var(--text-5)' }}>{n.timeAgo}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '10px 16px',
                  background: 'var(--card-bg)',
                  borderTop: '1px solid var(--card-border)',
                  textAlign: 'center',
                }}
              >
                <Link
                  href="/dashboard"
                  onClick={() => setNotifOpen(false)}
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
                >
                  View Activity Feed &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 2. Help & Support */}
        <div ref={helpRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            title="Help & Knowledge Base"
            onClick={() => {
              setHelpOpen((prev) => !prev);
              setNotifOpen(false);
              setSettingsOpen(false);
            }}
            style={{
              background: helpOpen ? 'var(--primary-tint)' : undefined,
              color: helpOpen ? 'var(--primary)' : undefined,
            }}
          >
            <HelpCircle size={18} strokeWidth={2} />
          </button>

          {helpOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 320,
                background: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--card-border)',
                borderRadius: 14,
                boxShadow: '0 16px 36px -4px rgba(0,0,0,0.18), 0 6px 16px -2px rgba(0,0,0,0.08)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LifeBuoy size={16} className="text-primary" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Help & Knowledge Center</h3>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-5)', margin: '4px 0 0 0' }}>
                  Resources, ticket submission, and HR guidance.
                </p>
              </div>

              <div style={{ padding: '8px 12px' }}>
                {isHRAdmin && (
                  <Link
                    href="/support"
                    onClick={() => setHelpOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    className="hover:bg-primary-tint"
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--primary-tint)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LifeBuoy size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>EasyHR Platform Support</p>
                      <p style={{ fontSize: 11, color: 'var(--text-5)', margin: 0 }}>
                        Submit inquiry to EasyHR Engineering
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-4" />
                  </Link>
                )}

                <Link
                  href="/policies"
                  onClick={() => setHelpOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-primary-tint"
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--primary-tint)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Company Policies</p>
                    <p style={{ fontSize: 11, color: 'var(--text-5)', margin: 0 }}>
                      Handbooks, leave, code of conduct
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-4" />
                </Link>
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--primary-tint, #f8f7ff)',
                  borderTop: '1px solid var(--card-border)',
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', margin: '0 0 4px 0' }}>
                  NEED URGENT HR ASSISTANCE?
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
                  Email <strong>support@easyhr.pro</strong> or visit HR desk during office hours.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. Settings */}
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            title="Account & System Settings"
            onClick={() => {
              setSettingsOpen((prev) => !prev);
              setNotifOpen(false);
              setHelpOpen(false);
            }}
            style={{
              background: settingsOpen ? 'var(--primary-tint)' : undefined,
              color: settingsOpen ? 'var(--primary)' : undefined,
            }}
          >
            <Settings size={18} strokeWidth={2} />
          </button>

          {settingsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 280,
                background: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--card-border)',
                borderRadius: 14,
                boxShadow: '0 16px 36px -4px rgba(0,0,0,0.18), 0 6px 16px -2px rgba(0,0,0,0.08)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              {/* Profile summary */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--card-border)',
                  background: 'var(--primary-tint, #f8f7ff)',
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '2px 0 0 0' }}>
                  {currentUser.email}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 6,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'var(--primary)',
                    color: '#ffffff',
                  }}
                >
                  {company?.name || 'EasyHR Workspace'}
                </span>
              </div>

              <div style={{ padding: '8px 6px' }}>
                <Link
                  href="/people/me?tab=Personal"
                  onClick={() => setSettingsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--text-1)',
                    textDecoration: 'none',
                  }}
                  className="hover:bg-primary-tint"
                >
                  <User size={16} className="text-4" />
                  <span>My Profile Details</span>
                </Link>

                {isHRAdmin && (
                  <>
                    <Link
                      href="/company-settings"
                      onClick={() => setSettingsOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        color: 'var(--text-1)',
                        textDecoration: 'none',
                      }}
                      className="hover:bg-primary-tint"
                    >
                      <Sliders size={16} className="text-4" />
                      <span>Company Settings</span>
                    </Link>

                    <Link
                      href="/roles-permissions"
                      onClick={() => setSettingsOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        color: 'var(--text-1)',
                        textDecoration: 'none',
                      }}
                      className="hover:bg-primary-tint"
                    >
                      <Shield size={16} className="text-4" />
                      <span>Roles & Permissions</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/attendance"
                  onClick={() => setSettingsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--text-1)',
                    textDecoration: 'none',
                  }}
                  className="hover:bg-primary-tint"
                >
                  <FileText size={16} className="text-4" />
                  <span>Attendance & Shifts</span>
                </Link>

                <div className="divider" style={{ margin: '6px 0' }} />

                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    signOut(() => router.push('/auth/login'));
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-primary-tint"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
