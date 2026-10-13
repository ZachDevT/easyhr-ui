"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  CalendarDays,
  Megaphone,
  ChevronDown,
  ChevronRight,
  CalendarPlus,
  Palmtree,
  CalendarHeart,
  FileSignature,
  UserPlus,
  Sun,
  Users,
  Gift,
  Building,
  X,
  Check,
  Heart,
  Award,
  Sparkles,
  PartyPopper,
  Star,
  Cake,
  Plus,
  Trash2,
  Pin,
  Maximize2
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { toast } from '../ui/Toast';
import { Textarea } from '../ui/Textarea';
import { timeSummary, weekEntries } from '../../data/timeData';
import { timeOffBalances } from '../../data/timeOff';

export interface WidgetDef {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  default: boolean;
}

export const OPTIONAL_WIDGETS: WidgetDef[] = [
  { id: 'feed',        label: 'Company Feed',          desc: 'News and announcements',     icon: <Megaphone size={18} strokeWidth={2} />,     default: true  },
  { id: 'birthdays',   label: 'Celebrations',          desc: 'Birthdays & work milestones', icon: <Gift size={18} strokeWidth={2} />,          default: true  },
  { id: 'new-hires',   label: 'New Hires',             desc: 'Recently joined team',       icon: <UserPlus size={18} strokeWidth={2} />,      default: false },
  { id: 'holidays',    label: 'Company Holidays',      desc: 'Public & company holidays',  icon: <Sun size={18} strokeWidth={2} />,           default: false },
  { id: 'org-updates', label: 'Org Updates',           desc: 'Team changes and moves',     icon: <Users size={18} strokeWidth={2} />,         default: false },
  { id: 'signatures',  label: 'Pending Signatures',    desc: 'Docs needing your sign',     icon: <FileSignature size={18} strokeWidth={2} />, default: false },
];

/* -------------------------------------------------------------------------- */
/* 1. Compulsory My Time Widget (Dynamic Activities & Punches)               */
/* -------------------------------------------------------------------------- */

interface ActivityItem {
  id: string;
  name: string;
  code?: string;
  isBillable: boolean;
  color?: string;
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { id: 'act-1', name: 'Production',  isBillable: true,  color: '#7c3aed' },
  { id: 'act-2', name: 'Meeting',     isBillable: true,  color: '#2563eb' },
  { id: 'act-3', name: 'Break',       isBillable: false, color: '#f59e0b' },
  { id: 'act-4', name: 'Lunch',       isBillable: false, color: '#10b981' },
  { id: 'act-5', name: 'Training',    isBillable: true,  color: '#8b5cf6' },
  { id: 'act-6', name: 'Client Work', isBillable: true,  color: '#06b6d4' },
];

export function CompulsoryMyTimeWidget() {
  const { getToken, isSignedIn } = useAuth();
  const { isHRAdmin } = useRole();

  const [activities, setActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem>(DEFAULT_ACTIVITIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [manageActivitiesOpen, setManageActivitiesOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityBillable, setNewActivityBillable] = useState(true);

  const [isClocked, setIsClocked] = useState(false);
  const [clockedAt, setClockedAt] = useState<string | null>(null);
  const [clockStartTime, setClockStartTime] = useState<number | null>(null);
  const [elapsedDuration, setElapsedDuration] = useState('0h 00m');
  const [timeEntryModal, setTimeEntryModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Fetch dynamic activities from backend
  useEffect(() => {
    if (!isSignedIn) return;
    async function loadActivities() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/attendance/activities`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
            setActivities(data.data);
            setSelectedActivity(data.data[0]);
          }
        }
      } catch {
        // Fall back gracefully to DEFAULT_ACTIVITIES
      }
    }
    loadActivities();
  }, [isSignedIn, getToken]);

  // Live timer tick when clocked in
  useEffect(() => {
    if (!isClocked || !clockStartTime) return;
    const updateElapsed = () => {
      const diffMs = Date.now() - clockStartTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setElapsedDuration(`${hours}h ${String(mins).padStart(2, '0')}m`);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isClocked, clockStartTime]);

  // Handle punch toggle
  const handleToggleClock = async () => {
    const nextClocked = !isClocked;
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(now);

    setIsClocked(nextClocked);
    if (nextClocked) {
      setClockedAt(formatted);
      setClockStartTime(Date.now());
      toast.success(
        `Clocked in (${selectedActivity.isBillable ? 'Billable' : 'Non-billable'})`,
        `Started ${selectedActivity.name} session at ${formatted}.`
      );
    } else {
      setClockedAt(null);
      setClockStartTime(null);
      toast.success('Clocked out', 'Session saved to your daily timesheet and payroll log.');
    }

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({
              kind: nextClocked ? 'clock_in' : 'clock_out',
              activity: selectedActivity.name,
              isBillable: selectedActivity.isBillable,
              occurredAt: now.toISOString(),
              source: 'web',
            }),
          });
        }
      } catch {
        // Punches logged locally
      }
    }
  };

  // Add new dynamic activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;

    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      name: newActivityName.trim(),
      isBillable: newActivityBillable,
      color: newActivityBillable ? '#7c3aed' : '#f59e0b',
    };

    setActivities((prev) => [...prev, newAct]);
    setNewActivityName('');
    toast.success('Activity added', `${newAct.name} is now available for attendance tracking.`);

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          const res = await fetch(`${API_BASE_URL}/api/v1/attendance/activities`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({
              name: newAct.name,
              isBillable: newAct.isBillable,
              color: newAct.color,
            }),
          });
          if (res.ok) {
            const created = await res.json();
            setActivities((prev) => prev.map((a) => (a.id === newAct.id ? created : a)));
          }
        }
      } catch {}
    }
  };

  // Delete activity
  const handleDeleteActivity = async (id: string, name: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    toast.info('Activity removed', `${name} has been removed.`);

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE_URL}/api/v1/attendance/activities/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(token),
          });
        }
      } catch {}
    }
  };

  return (
    <Card style={{ overflow: 'visible', position: 'relative' }}>
      <CardHeader title="My Time" icon={<Clock size={16} strokeWidth={2.5} />} />
      <CardBody style={{ overflow: 'visible', position: 'relative' }}>
        <div className="text-center">
          <div className="clock-status">
            <span className={isClocked ? 'clock-status-dot active' : 'clock-status-dot'} />
            <p className="text-xs text-2">
              {isClocked ? (
                <span>
                  Active: <strong>{selectedActivity.name}</strong>{' '}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 10,
                      marginLeft: 4,
                      background: selectedActivity.isBillable ? '#ecfdf5' : '#f1f5f9',
                      color: selectedActivity.isBillable ? '#059669' : '#64748b',
                    }}
                  >
                    {selectedActivity.isBillable ? 'Billable' : 'Non-billable'}
                  </span>
                </span>
              ) : (
                'Not clocked in'
              )}
            </p>
          </div>

          <p className="gradient-text mt-6 mb-4" style={{ fontSize: 32, letterSpacing: '-0.5px' }}>
            {isClocked ? elapsedDuration : '0h 00m'}
          </p>
          <p className="text-xs text-5">
            {isClocked
              ? `Started at ${clockedAt ?? '9:00 AM'} · ${selectedActivity.name}`
              : 'No active shift today'}
          </p>

          {/* Punch action bar with isolated relative positioning */}
          <div
            ref={dropdownRef}
            className="row gap-8 mt-20"
            style={{ position: 'relative', zIndex: 100 }}
          >
            <button
              className="btn-primary w-full"
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={handleToggleClock}
            >
              <Clock size={16} strokeWidth={2} />
              {isClocked ? 'Clock out' : `Clock in · ${selectedActivity.name}`}
            </button>

            <button
              className="btn-circle"
              style={{ width: 44, height: 44, flexShrink: 0 }}
              title="Select punch activity"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <ChevronDown
                size={16}
                strokeWidth={2.5}
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {/* Dropdown Menu with absolute positioning and high z-index */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 290,
                  maxWidth: '100%',
                  background: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 12,
                  boxShadow: '0 16px 36px -4px rgba(0,0,0,0.2), 0 4px 12px -2px rgba(0,0,0,0.08)',
                  zIndex: 1050,
                  textAlign: 'left',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-5)',
                    background: 'var(--primary-tint, #f8f7ff)',
                    borderBottom: '1px solid var(--card-border)',
                  }}
                >
                  Punch Activity
                </div>

                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {activities.map((act) => {
                    const isSelected = selectedActivity.name === act.name;
                    return (
                      <button
                        key={act.name}
                        type="button"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isSelected ? 'var(--primary-tint, #f5f3ff)' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--card-border)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onClick={() => {
                          setSelectedActivity(act);
                          setDropdownOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? 'var(--primary)' : 'var(--text-1)',
                            }}
                          >
                            {act.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 10,
                              background: act.isBillable ? '#ecfdf5' : '#f1f5f9',
                              color: act.isBillable ? '#059669' : '#64748b',
                            }}
                          >
                            {act.isBillable ? 'Billable' : 'Non-billable'}
                          </span>
                        </div>

                        {isSelected && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'rgba(124, 58, 237, 0.12)',
                              color: 'var(--primary)',
                              flexShrink: 0,
                            }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {isHRAdmin && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var(--card-bg)',
                      borderTop: '1px solid var(--card-border)',
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '6px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                      onClick={() => {
                        setDropdownOpen(false);
                        setManageActivitiesOpen(true);
                      }}
                    >
                      + Manage Punch Activities
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="row mt-16 mb-6" style={{ justifyContent: 'center' }}>
            <span className="text-5 text-xs">
              Today &rarr; {timeSummary.today}
              {isClocked ? ` · ${selectedActivity.name} in progress` : ''}
            </span>
          </div>

          <button
            className="text-xs fw-700"
            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setTimeEntryModal(true)}
          >
            + Add Manual Time Entry
          </button>
        </div>

        <div className="divider" style={{ margin: '20px 0 16px' }} />

        <div className="row-between">
          <div>
            <p className="text-xs text-5 mb-4">This Week</p>
            <p className="text-sm text-1">{timeSummary.thisWeek}</p>
          </div>
          <div>
            <p className="text-xs text-5 mb-4">Pay Period</p>
            <p className="text-sm text-1">{timeSummary.payPeriod}</p>
          </div>
          <Link href="/time" className="btn-neutral btn-sm" style={{ textDecoration: 'none' }}>
            My Timesheet
          </Link>
        </div>
      </CardBody>

      {/* Manual Time Entry Modal */}
      <Modal
        isOpen={timeEntryModal}
        onClose={() => setTimeEntryModal(false)}
        title="Add Time Entry"
        footer={
          <>
            <button className="btn-neutral" onClick={() => setTimeEntryModal(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setTimeEntryModal(false);
                toast.success('Time entry saved', 'Added to your weekly timesheet.');
              }}
            >
              Save
            </button>
          </>
        }
      >
        <div>
          <label className="form-label">Date</label>
          <div className="text-sm text-1">
            {weekEntries[4]?.day || 'Today'}, {weekEntries[4]?.date || 'Current Date'}
          </div>
        </div>
        <div className="grid-2">
          <div>
            <label className="form-label">Start Time*</label>
            <Input type="time" defaultValue="09:00" />
          </div>
          <div>
            <label className="form-label">Activity</label>
            <Select>
              {activities.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} ({a.isBillable ? 'Billable' : 'Non-billable'})
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="form-label">Note</label>
          <Textarea rows={3} placeholder="Add a work log note..." />
        </div>
      </Modal>

      {/* HR Manage Activities Modal */}
      <Modal
        isOpen={manageActivitiesOpen}
        onClose={() => setManageActivitiesOpen(false)}
        title="Manage Punch Activities"
        footer={
          <button className="btn-primary w-full" onClick={() => setManageActivitiesOpen(false)}>
            Done
          </button>
        }
      >
        <p className="text-xs text-5 mb-16">
          Configure clock-in activity types for your organization. Mark activities as billable or non-billable to ensure accurate payroll calculation.
        </p>

        {/* Existing activities list */}
        <div className="col gap-8 mb-20">
          {activities.map((act) => (
            <div
              key={act.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: act.color || '#7c3aed',
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{act.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: act.isBillable ? '#ecfdf5' : '#f1f5f9',
                    color: act.isBillable ? '#059669' : '#64748b',
                  }}
                >
                  {act.isBillable ? 'Billable' : 'Non-billable'}
                </span>
              </div>

              {activities.length > 2 && (
                <button
                  type="button"
                  className="btn-circle"
                  style={{ width: 28, height: 28, color: '#ef4444' }}
                  onClick={() => handleDeleteActivity(act.id, act.name)}
                  title="Remove activity"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new activity form */}
        <form onSubmit={handleCreateActivity} className="p-12 rounded-8" style={{ background: 'var(--primary-tint, #f8f7ff)', border: '1px solid var(--card-border)' }}>
          <p className="text-xs fw-700 mb-8" style={{ color: 'var(--primary)' }}>Add New Activity</p>
          <div className="row gap-8 mb-10">
            <Input
              type="text"
              placeholder="e.g. Client Consultation, Research..."
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary btn-sm" disabled={!newActivityName.trim()}>
              <Plus size={14} /> Add
            </button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newActivityBillable}
              onChange={(e) => setNewActivityBillable(e.target.checked)}
            />
            <span>Count as <strong>Billable</strong> working hours in Payroll</span>
          </label>
        </form>
      </Modal>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Compulsory Time Off Widget                                              */
/* -------------------------------------------------------------------------- */

export function CompulsoryTimeOffWidget() {
  const [modal, setModal] = useState(false);

  const balances = [
    { type: 'Vacation', hoursUsed: 0 },
    { type: 'Sick Leave', hoursUsed: 0 },
  ];

  return (
    <Card>
      <CardHeader title="Time Off" icon={<CalendarDays size={16} strokeWidth={2.5} />} />
      <CardBody>
        <div className="row gap-16 mb-20">
          {balances.map((b) => (
            <div key={b.type} style={{ flex: 1, textAlign: 'center' }}>
              {b.type === 'Vacation' ? (
                <Palmtree size={28} strokeWidth={1.5} style={{ color: 'var(--primary)', margin: '0 auto' }} />
              ) : (
                <CalendarHeart size={28} strokeWidth={1.5} style={{ color: 'var(--primary)', margin: '0 auto' }} />
              )}
              <p className="text-xs text-2 mt-8">{b.type}</p>
              <p className="text-xs text-5 mt-4">{b.hoursUsed}h used (YTD)</p>
            </div>
          ))}
          <button className="btn-circle"><ChevronRight size={15} strokeWidth={2} /></button>
        </div>

        <button
          className="btn-secondary w-full"
          style={{ padding: '12px 24px', fontSize: 14 }}
          onClick={() => setModal(true)}
        >
          <CalendarPlus size={16} strokeWidth={2.5} />
          Request Time Off
        </button>
      </CardBody>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Request Time Off"
        footer={
          <>
            <button className="btn-neutral" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { setModal(false); toast.success("Time-off requested", "Request sent to your manager for review."); }}>Submit Request</button>
          </>
        }
      >
        <div>
          <label className="form-label">Leave Type*</label>
          <Select>
            {timeOffBalances.map((b) => <option key={b.type}>{b.type}</option>)}
          </Select>
        </div>
        <div className="grid-2">
          <div>
            <label className="form-label">Start Date*</label>
            <Input type="date" />
          </div>
          <div>
            <label className="form-label">End Date*</label>
            <Input type="date" />
          </div>
        </div>
        <div>
          <label className="form-label">Note to Manager</label>
          <Textarea rows={3} placeholder="Reason for leave..." />
        </div>
      </Modal>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Company Announcements Feed Widget (Dynamic CRUD)                       */
/* -------------------------------------------------------------------------- */

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  pinned: boolean;
  createdAt: string;
  timeAgo: string;
}

export function FeedWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  const { getToken, isSignedIn } = useAuth();
  const { isHRAdmin } = useRole();

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Company News');
  const [newPinned, setNewPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/announcements`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data && Array.isArray(data.data)) {
          setAnnouncements(data.data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [isSignedIn]);

  // Create announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/v1/announcements`, {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({
            title: newTitle.trim(),
            content: newContent.trim(),
            category: newCategory,
            priority: newPinned ? 'pinned' : 'normal',
            pinned: newPinned,
          }),
        });
        if (res.ok) {
          toast.success('Announcement published', 'Shared with all company members.');
          setCreateModalOpen(false);
          setNewTitle('');
          setNewContent('');
          setNewPinned(false);
          fetchAnnouncements();
        }
      }
    } catch {
      toast.error('Failed to post announcement', 'Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const token = await getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/announcements/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(token),
        });
        toast.info('Announcement removed', 'The post has been deleted.');
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {}
  };

  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Megaphone size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">What&apos;s happening at Your Co</h2>
        </div>
        <div className="row gap-8">
          {isHRAdmin && (
            <button
              className="btn-neutral btn-sm"
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={12} /> Post
            </button>
          )}
          {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
        </div>
      </div>

      <CardBody style={{ padding: announcements.length === 0 ? '28px 20px' : '0 20px', textAlign: announcements.length === 0 ? 'center' : 'left' }}>
        {announcements.length === 0 ? (
          <div>
            <div className="icon-chip" style={{ width: 38, height: 38, margin: '0 auto 10px auto', background: 'var(--primary-tint, #f5f3ff)', color: 'var(--primary, #7c3aed)' }}>
              <Megaphone size={18} />
            </div>
            <p className="text-sm fw-600 mb-4">No recent company announcements</p>
            <p className="text-xs text-5" style={{ maxWidth: 280, margin: '0 auto 16px auto' }}>
              Company notices, all-hands meetings, and handbook updates will appear here.
            </p>
            {isHRAdmin && (
              <button className="btn-primary btn-sm" onClick={() => setCreateModalOpen(true)}>
                + New Announcement
              </button>
            )}
          </div>
        ) : (
          announcements.map((item, i) => (
            <div
              key={item.id}
              className="feed-item"
              style={{
                padding: '14px 0',
                borderBottom: i === announcements.length - 1 ? 'none' : '1px solid var(--card-border)',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedAnnouncement(item)}
            >
              <div
                className="icon-chip"
                style={{
                  width: 34,
                  height: 34,
                  background: item.pinned ? 'rgba(124, 58, 237, 0.12)' : 'var(--primary-tint)',
                  color: 'var(--primary)',
                }}
              >
                {item.pinned ? <Pin size={15} /> : <Megaphone size={15} />}
              </div>

              <div className="feed-content" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <p className="feed-title" style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>
                    {item.title}
                  </p>
                  {item.pinned && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: 'var(--primary-tint)',
                        color: 'var(--primary)',
                      }}
                    >
                      Pinned
                    </span>
                  )}
                </div>

                <p className="feed-sub" style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
                  {item.category} · {item.timeAgo || item.createdAt} · By {item.authorName}
                </p>
              </div>

              {isHRAdmin && (
                <button
                  type="button"
                  className="btn-circle"
                  style={{ width: 28, height: 28, color: '#ef4444', flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAnnouncement(item.id);
                  }}
                  title="Delete announcement"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </CardBody>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Post Company Announcement"
        footer={
          <>
            <button className="btn-neutral" onClick={() => setCreateModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreateAnnouncement} disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}>
              {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </>
        }
      >
        <div className="col gap-12">
          <div>
            <label className="form-label">Announcement Title*</label>
            <Input
              type="text"
              placeholder="e.g. Q4 All-Hands Meeting & Annual Hackathon"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div>
              <label className="form-label">Category</label>
              <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                <option value="Company News">Company News</option>
                <option value="All-Hands">All-Hands</option>
                <option value="Policy Update">Policy Update</option>
                <option value="Team Event">Team Event</option>
                <option value="Milestone">Milestone</option>
              </Select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                />
                <span>Pin announcement to top</span>
              </label>
            </div>
          </div>

          <div>
            <label className="form-label">Announcement Content*</label>
            <Textarea
              rows={4}
              placeholder="Write the announcement message for all company employees..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Reader Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={Boolean(selectedAnnouncement)}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
          footer={
            <button className="btn-primary w-full" onClick={() => setSelectedAnnouncement(null)}>
              Close
            </button>
          }
        >
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--primary-tint)', color: 'var(--primary)' }}>
              {selectedAnnouncement.category}
            </span>
            <span className="text-xs text-5">
              Published on {selectedAnnouncement.createdAt} by {selectedAnnouncement.authorName} ({selectedAnnouncement.authorRole})
            </span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
            {selectedAnnouncement.content}
          </div>
        </Modal>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Celebrations Module (Birthdays & Work Anniversaries + Wishes & Sprinkles)*/
/* -------------------------------------------------------------------------- */

interface WishItem {
  id: string;
  recipientEmployeeId: string;
  senderName: string;
  senderAvatar?: string;
  celebrationType: string;
  message: string;
  reaction: string;
  createdAt: string;
  timeAgo: string;
}

interface CelebrationItem {
  id: string;
  employeeId: string;
  name: string;
  avatar: string;
  department: string;
  jobTitle: string;
  type: 'birthday' | 'anniversary';
  milestone: string;
  celebrationDate: string;
  daysUntil: number;
  wishesCount: number;
  wishes: WishItem[];
}

interface CelebrationStatus {
  isCelebrationToday: boolean;
  celebrationType?: string;
  title?: string;
  subtitle?: string;
  milestone?: string;
  employeeName?: string;
  wishes: WishItem[];
}

const REACTION_OPTIONS = [
  { id: 'party',  label: 'Party',   icon: <PartyPopper size={16} /> },
  { id: 'heart',  label: 'Heart',   icon: <Heart size={16} /> },
  { id: 'cake',   label: 'Cake',    icon: <Cake size={16} /> },
  { id: 'star',   label: 'Star',    icon: <Star size={16} /> },
  { id: 'award',  label: 'Award',   icon: <Award size={16} /> },
  { id: 'cheer',  label: 'Cheer',   icon: <Sparkles size={16} /> },
];

export function BirthdaysWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  const { getToken, isSignedIn } = useAuth();

  const [celebrations, setCelebrations] = useState<CelebrationItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'birthday' | 'anniversary'>('all');
  const [allModalOpen, setAllModalOpen] = useState(false);

  const todayCelebrators = useMemo(() => celebrations.filter((c) => c.daysUntil === 0), [celebrations]);

  // Send Wish state
  const [wishCelebrator, setWishCelebrator] = useState<CelebrationItem | null>(null);
  const [wishMessage, setWishMessage] = useState('');
  const [wishReaction, setWishReaction] = useState('heart');
  const [isSendingWish, setIsSendingWish] = useState(false);

  // Celebrator personal greeting status (Confetti / Sprinkles)
  const [celebrationStatus, setCelebrationStatus] = useState<CelebrationStatus | null>(null);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);

  // Load celebrations
  const loadCelebrations = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/celebrations?type=${filterType}`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data && Array.isArray(data.data)) {
          setCelebrations(data.data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadCelebrations();
  }, [isSignedIn, filterType]);

  // Check personal celebration status
  useEffect(() => {
    if (!isSignedIn) return;
    async function checkMyCelebration() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/celebrations/me`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data: CelebrationStatus = await res.json();
          if (data?.isCelebrationToday) {
            setCelebrationStatus(data);
            setShowCelebrationBanner(true);
          }
        }
      } catch {}
    }
    checkMyCelebration();
  }, [isSignedIn, getToken]);

  // Filtered list
  const filteredCelebrations = useMemo(() => {
    if (filterType === 'all') return celebrations;
    return celebrations.filter((c) => c.type === filterType);
  }, [celebrations, filterType]);

  // Handle send wish
  const handleSendWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishCelebrator || !wishMessage.trim()) return;

    setIsSendingWish(true);
    try {
      const token = await getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/v1/celebrations/wishes`, {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({
            recipientEmployeeId: wishCelebrator.employeeId,
            celebrationType: wishCelebrator.type,
            message: wishMessage.trim(),
            reaction: wishReaction,
          }),
        });
        if (res.ok) {
          toast.success(
            'Celebration wish sent',
            `Your warm wishes and reaction have been delivered to ${wishCelebrator.name}.`
          );
          setWishCelebrator(null);
          setWishMessage('');
          loadCelebrations();
        }
      }
    } catch {
      toast.error('Failed to send wish', 'Please try again.');
    } finally {
      setIsSendingWish(false);
    }
  };

  const getPresetWishes = (type: string) => {
    if (type === 'birthday') {
      return [
        'Wishing you a very Happy Birthday and a successful year ahead!',
        'Happy Birthday! May your day be filled with celebration and joy!',
        'Warmest birthday wishes to an outstanding teammate!',
      ];
    }
    return [
      'Happy Work Anniversary! Thank you for your leadership and dedication!',
      'Congratulations on your milestone! Proud to celebrate your journey with us!',
      'Happy Anniversary! Looking forward to achieving more milestones together!',
    ];
  };

  return (
    <>
      {/* Festive Sprinkles Animation (Active on celebration day) */}
      {showCelebrationBanner && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: 45 }).map((_, i) => (
            <div
              key={i}
              className="sprinkle-particle"
              style={{
                position: 'absolute',
                top: -20,
                left: `${(i * 100) / 45}%`,
                width: i % 2 === 0 ? 8 : 12,
                height: i % 3 === 0 ? 8 : 14,
                borderRadius: i % 2 === 0 ? '50%' : '2px',
                background: ['#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 6],
                animation: `sprinkleDrop 3.5s linear infinite`,
                animationDelay: `${(i % 15) * 0.2}s`,
                opacity: 0.9,
              }}
            />
          ))}
          <style>{`
            @keyframes sprinkleDrop {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Main Celebrations Card */}
      <Card className={preview ? '' : 'mb-16'}>
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-header-icon"><Gift size={16} strokeWidth={2.5} /></div>
            <h2 className="card-header-title">Celebrations & Milestones</h2>
          </div>
          <div className="row gap-8">
            <button
              className="btn-neutral btn-sm"
              style={{ fontSize: 11, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => setAllModalOpen(true)}
              title="Expand full celebrations calendar"
            >
              <Maximize2 size={12} /> Expand
            </button>
            {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
          </div>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: 6, padding: '8px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--primary-tint, #f8f7ff)' }}>
          {[
            { id: 'all',         label: 'All' },
            { id: 'birthday',    label: 'Birthdays' },
            { id: 'anniversary', label: 'Work Anniversaries' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              style={{
                fontSize: 11.5,
                fontWeight: filterType === tab.id ? 700 : 500,
                padding: '4px 12px',
                borderRadius: 20,
                border: 'none',
                background: filterType === tab.id ? 'var(--primary)' : 'transparent',
                color: filterType === tab.id ? '#ffffff' : 'var(--text-4)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CardBody style={{ padding: filteredCelebrations.length === 0 ? '28px 20px' : 0, textAlign: filteredCelebrations.length === 0 ? 'center' : 'left' }}>
          {todayCelebrators.length > 0 && (
            <div
              style={{
                margin: '14px 16px',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(219, 39, 119, 0.08) 100%)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                    {todayCelebrators.length === 1
                      ? `${todayCelebrators[0].name}'s ${todayCelebrators[0].milestone} Today!`
                      : `${todayCelebrators.length} celebrations today!`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                    Send your warm congratulations!
                  </div>
                </div>
              </div>
              {todayCelebrators.length === 1 && (
                <button
                  className="btn-primary btn-sm"
                  style={{ fontSize: 11, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => {
                    setWishCelebrator(todayCelebrators[0]);
                    setWishMessage(getPresetWishes(todayCelebrators[0].type)[0]);
                  }}
                >
                  <Heart size={12} /> Send Wish
                </button>
              )}
            </div>
          )}

          {filteredCelebrations.length === 0 ? (
            <div>
              <div className="icon-chip" style={{ width: 38, height: 38, margin: '0 auto 10px auto', background: 'var(--primary-tint, #f5f3ff)', color: 'var(--primary, #7c3aed)' }}>
                <Gift size={18} />
              </div>
              <p className="text-sm fw-600 mb-4">No upcoming celebrations in this period</p>
              <p className="text-xs text-5" style={{ maxWidth: 280, margin: '0 auto' }}>
                Team birthdays and work anniversary milestones in the next 90 days will be celebrated here.
              </p>
            </div>
          ) : (
            filteredCelebrations.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="list-row"
                style={{
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderBottom: '1px solid var(--card-border)',
                }}
              >
                <Avatar src={b.avatar} name={b.name} size="sm" />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p className="text-sm text-1" style={{ fontWeight: 600, margin: 0 }}>
                      {b.name}
                    </p>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: b.type === 'birthday' ? '#fdf2f8' : '#eff6ff',
                        color: b.type === 'birthday' ? '#db2777' : '#2563eb',
                      }}
                    >
                      {b.type === 'birthday' ? <Gift size={10} /> : <Award size={10} />}
                      {b.type === 'birthday' ? 'Birthday' : b.milestone}
                    </span>
                  </div>

                  <p className="text-xs text-5" style={{ margin: '2px 0 0 0' }}>
                    {b.celebrationDate} · {b.department}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {b.daysUntil === 0 ? (
                    <>
                      <Badge variant="primary" style={{ fontSize: 11, padding: '2px 8px' }}>
                        Today!
                      </Badge>
                      <button
                        className="btn-primary btn-sm"
                        style={{
                          fontSize: 11,
                          padding: '4px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onClick={() => {
                          setWishCelebrator(b);
                          setWishMessage(getPresetWishes(b.type)[0]);
                        }}
                      >
                        <Heart size={12} /> Wish
                      </button>
                    </>
                  ) : b.daysUntil === 1 ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--primary)',
                        background: 'var(--primary-tint, #f5f3ff)',
                        padding: '3px 8px',
                        borderRadius: 8,
                      }}
                    >
                      Tomorrow
                    </span>
                  ) : (
                    <span
                      className="text-xs text-5"
                      style={{
                        background: 'var(--bg-page)',
                        padding: '3px 8px',
                        borderRadius: 8,
                      }}
                    >
                      in {b.daysUntil}d
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {/* Celebrator Congratulatory Banner Modal (If celebration is today!) */}
      {celebrationStatus && showCelebrationBanner && (
        <Modal
          isOpen={showCelebrationBanner}
          onClose={() => setShowCelebrationBanner(false)}
          title="Celebration Day!"
          footer={
            <button className="btn-primary w-full" onClick={() => setShowCelebrationBanner(false)}>
              Thank You Everyone!
            </button>
          }
        >
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--gradient)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              {celebrationStatus.celebrationType === 'birthday' ? (
                <Gift size={32} />
              ) : (
                <Award size={32} />
              )}
            </div>

            <h2 className="gradient-text fw-800" style={{ fontSize: 24, marginBottom: 8 }}>
              {celebrationStatus.title}
            </h2>
            <p className="text-sm text-4 mb-20" style={{ maxWidth: 360, margin: '0 auto 20px auto' }}>
              {celebrationStatus.subtitle}
            </p>

            {celebrationStatus.wishes && celebrationStatus.wishes.length > 0 && (
              <div style={{ textAlign: 'left', borderTop: '1px solid var(--card-border)', paddingTop: 16 }}>
                <p className="text-xs fw-700 uppercase text-5 mb-10">Wishes from your teammates:</p>
                <div className="col gap-8" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {celebrationStatus.wishes.map((w) => (
                    <div
                      key={w.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'var(--primary-tint, #f8f7ff)',
                        border: '1px solid var(--card-border)',
                      }}
                    >
                      <div className="row-between mb-4">
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>
                          {w.senderName}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-5)' }}>{w.timeAgo}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>{w.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Send Wish Modal */}
      {wishCelebrator && (
        <Modal
          isOpen={Boolean(wishCelebrator)}
          onClose={() => setWishCelebrator(null)}
          title={`Send Wish to ${wishCelebrator.name}`}
          footer={
            <>
              <button className="btn-neutral" onClick={() => setWishCelebrator(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSendWish}
                disabled={isSendingWish || !wishMessage.trim()}
              >
                {isSendingWish ? 'Sending...' : 'Send Wish'}
              </button>
            </>
          }
        >
          <div className="col gap-12">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, background: 'var(--primary-tint, #f8f7ff)' }}>
              <Avatar src={wishCelebrator.avatar} name={wishCelebrator.name} size="md" />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{wishCelebrator.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
                  Celebrating {wishCelebrator.milestone} on {wishCelebrator.celebrationDate}
                </p>
              </div>
            </div>

            <div>
              <label className="form-label">Pick a Celebration Reaction</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {REACTION_OPTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setWishReaction(r.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: wishReaction === r.id ? 'var(--primary)' : 'var(--card-border)',
                      background: wishReaction === r.id ? 'var(--primary-tint)' : 'var(--card-bg)',
                      color: wishReaction === r.id ? 'var(--primary)' : 'var(--text-3)',
                      cursor: 'pointer',
                    }}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Choose a preset or write your own</label>
              <div className="col gap-6 mb-8">
                {getPresetWishes(wishCelebrator.type).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWishMessage(preset)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--card-border)',
                      background: wishMessage === preset ? 'var(--primary-tint)' : 'transparent',
                      textAlign: 'left',
                      fontSize: 12,
                      color: 'var(--text-2)',
                      cursor: 'pointer',
                    }}
                  >
                    &ldquo;{preset}&rdquo;
                  </button>
                ))}
              </div>
              <Textarea
                rows={3}
                placeholder="Write a custom celebratory message..."
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Full Celebrations Calendar Modal */}
      <Modal
        isOpen={allModalOpen}
        onClose={() => setAllModalOpen(false)}
        title="Upcoming Company Celebrations"
        footer={<button className="btn-primary w-full" onClick={() => setAllModalOpen(false)}>Done</button>}
      >
        <div className="col gap-12">
          <p className="text-xs text-5">
            Full company calendar for birthdays and work anniversaries ordered chronologically.
          </p>

          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'all',         label: 'All Celebrations' },
              { id: 'birthday',    label: 'Birthdays Only' },
              { id: 'anniversary', label: 'Anniversaries Only' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterType(t.id as any)}
                style={{
                  fontSize: 11.5,
                  fontWeight: filterType === t.id ? 700 : 500,
                  padding: '4px 12px',
                  borderRadius: 16,
                  border: 'none',
                  background: filterType === t.id ? 'var(--primary)' : 'var(--card-border)',
                  color: filterType === t.id ? '#ffffff' : 'var(--text-3)',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="col gap-8" style={{ maxHeight: 360, overflowY: 'auto' }}>
            {filteredCelebrations.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--card-border)',
                  background: 'var(--card-bg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={b.avatar} name={b.name} size="sm" />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{b.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-5)', margin: 0 }}>
                      {b.milestone} · {b.department}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                    {b.celebrationDate}
                  </span>
                  {b.daysUntil === 0 ? (
                    <button
                      className="btn-primary btn-sm"
                      style={{ fontSize: 11, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => {
                        setWishCelebrator(b);
                        setWishMessage(getPresetWishes(b.type)[0]);
                      }}
                    >
                      <Heart size={11} /> Wish
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-4)',
                        background: 'var(--bg-page)',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {b.daysUntil === 1 ? 'Tomorrow' : `in ${b.daysUntil}d`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. New Hires Widget (Dynamic from employees directory)                     */
/* -------------------------------------------------------------------------- */

export function NewHiresWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  const { getToken, isSignedIn } = useAuth();
  const [newHires, setNewHires] = useState<Array<{ id: string; name: string; title: string; department: string; avatar?: string }>>([]);

  useEffect(() => {
    if (!isSignedIn) return;
    async function fetchNewHires() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/employees?limit=6`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.data && Array.isArray(data.data)) {
            const mapped = data.data.slice(0, 5).map((e: any) => ({
              id: e.id,
              name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || 'Team Member',
              title: e.title || e.jobTitle || 'New Team Member',
              department: e.department || 'Operations',
              avatar: e.avatarUrl || e.avatar,
            }));
            setNewHires(mapped);
          }
        }
      } catch {}
    }
    fetchNewHires();
  }, [isSignedIn]);

  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><UserPlus size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">New Hires</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody style={{ padding: newHires.length === 0 ? '28px 20px' : 0, textAlign: newHires.length === 0 ? 'center' : 'left' }}>
        {newHires.length === 0 ? (
          <div>
            <div className="icon-chip" style={{ width: 38, height: 38, margin: '0 auto 10px auto', background: 'var(--primary-tint, #f5f3ff)', color: 'var(--primary, #7c3aed)' }}>
              <UserPlus size={18} />
            </div>
            <p className="text-sm fw-600 mb-4">No recent new hires</p>
            <p className="text-xs text-5" style={{ maxWidth: 280, margin: '0 auto' }}>
              Recently onboarded team members will be welcomed here.
            </p>
          </div>
        ) : (
          newHires.map((emp) => (
            <div key={emp.id} className="list-row" style={{ padding: '12px 20px' }}>
              <Avatar src={emp.avatar} name={emp.name} size="sm" />
              <div style={{ flex: 1 }}>
                <p className="text-sm text-1">{emp.name}</p>
                <p className="text-xs text-5">{emp.title} · {emp.department}</p>
              </div>
              <Badge variant="success" style={{ fontSize: 11, padding: '2px 8px' }}>New</Badge>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Company Holidays Widget (Dynamic)                                       */
/* -------------------------------------------------------------------------- */

export function HolidaysWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  const { getToken, isSignedIn } = useAuth();
  const [holidays, setHolidays] = useState<Array<{ id: string; name: string; date: string }>>([
    { id: '1', name: 'Jamhuri Day',   date: 'Dec 12, 2026' },
    { id: '2', name: 'Christmas Day', date: 'Dec 25, 2026' },
    { id: '3', name: 'Boxing Day',    date: 'Dec 26, 2026' },
    { id: '4', name: 'New Year Day',  date: 'Jan 01, 2027' },
  ]);

  useEffect(() => {
    if (!isSignedIn) return;
    async function loadHolidays() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/holidays`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
            setHolidays(data.data.map((h: any) => ({
              id: h.id,
              name: h.name,
              date: h.holidayDate || h.date,
            })));
          }
        }
      } catch {}
    }
    loadHolidays();
  }, [isSignedIn]);

  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Sun size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Company Holidays</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody style={{ padding: 0 }}>
        {holidays.map((h) => (
          <div key={h.id || h.name} className="list-row" style={{ padding: '12px 20px' }}>
            <div className="icon-chip" style={{ width: 32, height: 32 }}><Building size={14} strokeWidth={2.5} /></div>
            <div style={{ flex: 1 }}>
              <p className="text-sm text-1">{h.name}</p>
              <p className="text-xs text-5">{h.date}</p>
            </div>
            <Badge variant="neutral" style={{ fontSize: 11, padding: '2px 8px' }}>Holiday</Badge>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Org Updates Widget                                                     */
/* -------------------------------------------------------------------------- */

export function OrgUpdatesWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Users size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Org Updates</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody>
        <div className="feed-item" style={{ paddingTop: 0 }}>
          <div className="feed-content">
            <p className="feed-title"><strong>Operations & Engineering</strong> aligned headcount for Q4.</p>
            <p className="feed-sub">Active sprint organization update</p>
          </div>
        </div>
        <div className="feed-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="feed-content">
            <p className="feed-title"><strong>People Team</strong> updated performance review cycle timeline.</p>
            <p className="feed-sub">Company wide update</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Pending Signatures Widget                                               */
/* -------------------------------------------------------------------------- */

export function SignaturesWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  const [docs, setDocs] = useState([
    'Employment Agreement & Terms.pdf',
    'Employee Handbook Acknowledgement.pdf',
  ]);

  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><FileSignature size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Pending Signatures</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody>
        {docs.map((name, i, arr) => (
          <div key={name} className="doc-card" style={{ marginBottom: i === arr.length - 1 ? 0 : 12 }}>
            <div className="doc-card-icon" style={{ width: 34, height: 34 }}>
              <FileSignature size={16} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="doc-card-name">{name}</div>
              <div className="doc-card-sub">Awaiting your electronic signature</div>
            </div>
            <button
              className="btn-primary btn-sm"
              style={{ padding: '4px 12px', fontSize: 12 }}
              onClick={() => {
                toast.success('Document opened', 'Document loaded for DocuSign completion.');
              }}
            >
              Sign
            </button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Export Mapping                                                             */
/* -------------------------------------------------------------------------- */

export type WidgetFC = React.FC<{ onRemove?: () => void; preview?: boolean }>;
export const WIDGET_MAP: Record<string, WidgetFC> = {
  'feed':        FeedWidget,
  'birthdays':   BirthdaysWidget,
  'new-hires':   NewHiresWidget,
  'holidays':    HolidaysWidget,
  'org-updates': OrgUpdatesWidget,
  'signatures':  SignaturesWidget,
};
