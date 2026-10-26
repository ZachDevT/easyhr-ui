"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Maximize2,
  Loader2,
  Coffee,
  Utensils,
  Music,
  MapPin,
  Briefcase,
  Mail,
  User,
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

  const [punches, setPunches] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [payrollConfig, setPayrollConfig] = useState<any>(null);
  const [activePayPeriod, setActivePayPeriod] = useState<any>(null);
  const [manualDate, setManualDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('17:00');
  const [manualActivityName, setManualActivityName] = useState('Production');
  const [manualNote, setManualNote] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const userSelectedActivityRef = useRef<ActivityItem | null>(null);
  const activitiesRef = useRef<ActivityItem[]>(DEFAULT_ACTIVITIES);

  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  useEffect(() => {
    setManualDate(new Date().toISOString().slice(0, 10));
    try {
      const saved = localStorage.getItem('easyhr_selected_clock_activity');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          userSelectedActivityRef.current = parsed;
          setSelectedActivity(parsed);
        }
      }
    } catch {}
  }, []);

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

  // Fetch dynamic punches from backend to determine current active shift and hours
  const loadPunches = useCallback(async (restoreActivityFromLatest = false) => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/attendance/punches?limit=250`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const json = await res.json();
        const punchList = Array.isArray(json) ? json : json.data || [];
        setPunches(punchList);

        // Check latest punch to restore active session
        if (punchList.length > 0) {
          const sorted = [...punchList].sort(
            (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
          );
          const latest = sorted[0];
          const isLatestIn = latest.kind === 'clock_in' || latest.kind === 'in';
          if (isLatestIn) {
            const punchTime = new Date(latest.occurredAt);
            const isToday = new Date().toISOString().slice(0, 10) === punchTime.toISOString().slice(0, 10);
            if (isToday) {
              setIsClocked(true);
              setClockStartTime(punchTime.getTime());
              setClockedAt(
                new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(punchTime)
              );
              if (
                restoreActivityFromLatest &&
                latest.activity &&
                !userSelectedActivityRef.current
              ) {
                const found = activitiesRef.current.find((a) => a.name === latest.activity);
                if (found) setSelectedActivity(found);
              }
            } else {
              setIsClocked(false);
            }
          } else {
            setIsClocked(false);
          }
        }
      }
    } catch {
      // Fallback
    }
  }, [isSignedIn, getToken]);

  // Fetch dynamic activities, holidays, payroll settings & initial punches once on sign-in
  useEffect(() => {
    if (!isSignedIn || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    async function initAttendance() {
      try {
        const token = await getToken();
        if (!token) return;
        const headers = getAuthHeaders(token);

        const [actRes, holRes, cfgRes, periodRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/attendance/activities`, { headers }),
          fetch(`${API_BASE_URL}/api/v1/holidays`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/api/v1/payroll/periods`, { headers }).catch(() => null),
        ]);

        if (actRes.ok) {
          const data = await actRes.json();
          const list = Array.isArray(data) ? data : data?.data;
          if (Array.isArray(list) && list.length > 0) {
            const existingNames = new Set(list.map((a: ActivityItem) => a.name.toLowerCase()));
            const merged = [
              ...list,
              ...DEFAULT_ACTIVITIES.filter((d) => !existingNames.has(d.name.toLowerCase())),
            ];
            setActivities(merged);
            activitiesRef.current = merged;
            if (!userSelectedActivityRef.current) {
              setSelectedActivity(merged[0]);
            } else {
              const match = merged.find(
                (a: ActivityItem) =>
                  a.name.toLowerCase() === userSelectedActivityRef.current?.name.toLowerCase()
              );
              if (match) setSelectedActivity(match);
            }
          }
        }

        if (holRes && holRes.ok) {
          const hData = await holRes.json();
          setHolidays(Array.isArray(hData) ? hData : hData?.data || []);
        }

        if (cfgRes && cfgRes.ok) {
          const cData = await cfgRes.json();
          const cList = Array.isArray(cData) ? cData : [];
          if (cList[0]) setPayrollConfig(cList[0]);
        }

        if (periodRes && periodRes.ok) {
          const pData = await periodRes.json();
          const pList = Array.isArray(pData) ? pData : [];
          const active = pList.find((p: any) => p.status === 'draft' || p.status === 'processing') || pList[0];
          if (active) setActivePayPeriod(active);
        }
      } catch {
        // Fall back gracefully to DEFAULT_ACTIVITIES
      }
      await loadPunches(true);
    }
    initAttendance();
  }, [isSignedIn, getToken, loadPunches]);

  // Live timer tick when clocked in
  useEffect(() => {
    if (!isClocked || !clockStartTime) return;
    const updateElapsed = () => {
      const diffMs = Math.max(0, Date.now() - clockStartTime);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setElapsedDuration(`${hours}h ${String(mins).padStart(2, '0')}m`);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isClocked, clockStartTime]);

  const overtimeMultiplier = payrollConfig?.overtimeMultiplier || 1.5;
  const holidayMultiplier = payrollConfig?.holidayMultiplier || 2.0;
  const standardDailyHours = payrollConfig?.standardMonthlyMinutes ? payrollConfig.standardMonthlyMinutes / (60 * 21.67) : 8.0;

  // Dynamic calculations for Today, This Week, Pay Period from live punches
  const dynamicTimeSummary = useMemo(() => {
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const dayOfWeek = now.getDay();
    const isSunday = dayOfWeek === 0;

    // Detect public holiday
    const todayHoliday = holidays.find((h: any) => h.holidayDate === todayIso);
    const isHoliday = Boolean(todayHoliday || isSunday);

    // Week boundaries (Monday 00:00:00 to now)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() + diffToMonday);
    mondayDate.setHours(0, 0, 0, 0);

    // Pay period boundaries
    let periodStartMs: number;
    let periodEndMs: number;
    let periodLabel = 'Current Month';

    if (activePayPeriod?.startDate) {
      periodStartMs = new Date(activePayPeriod.startDate).getTime();
      periodEndMs = activePayPeriod.endDate ? new Date(activePayPeriod.endDate + 'T23:59:59').getTime() : Date.now();
      periodLabel = `${activePayPeriod.startDate.slice(5)} to ${activePayPeriod.endDate.slice(5)}`;
    } else {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      periodStartMs = startOfMonth.getTime();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      periodEndMs = endOfMonth.getTime();
      periodLabel = `${now.toLocaleString('default', { month: 'short' })} Cycle`;
    }

    // Pair punches into sessions in chronological order
    const sorted = [...punches].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    const sessions: Array<{ startMs: number; endMs: number; dateIso: string; isHolidaySession: boolean; minutes: number }> = [];

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      if (p.kind === 'clock_in' || p.kind === 'in') {
        const inTime = new Date(p.occurredAt).getTime();
        const dateIso = new Date(p.occurredAt).toISOString().slice(0, 10);
        const pDayOfWeek = new Date(p.occurredAt).getDay();
        const isHol = Boolean(holidays.some((h: any) => h.holidayDate === dateIso) || pDayOfWeek === 0);

        const next = sorted[i + 1];
        if (next && (next.kind === 'clock_out' || next.kind === 'out')) {
          const outTime = new Date(next.occurredAt).getTime();
          const mins = Math.max(0, Math.round((outTime - inTime) / (1000 * 60)));
          sessions.push({ startMs: inTime, endMs: outTime, dateIso, isHolidaySession: isHol, minutes: mins });
          i++;
        } else {
          // Open session from punch
          const mins = Math.max(0, Math.round((Date.now() - inTime) / (1000 * 60)));
          sessions.push({ startMs: inTime, endMs: Date.now(), dateIso, isHolidaySession: isHol, minutes: mins });
        }
      }
    }

    // If currently clocked in locally, incorporate the active ongoing session
    if (isClocked && clockStartTime) {
      const alreadyIncluded = sessions.some(s => Math.abs(s.startMs - clockStartTime) < 5000);
      if (!alreadyIncluded) {
        const activeMins = Math.max(0, Math.round((Date.now() - clockStartTime) / (1000 * 60)));
        sessions.push({
          startMs: clockStartTime,
          endMs: Date.now(),
          dateIso: todayIso,
          isHolidaySession: isHoliday,
          minutes: activeMins,
        });
      }
    }

    let todayMinutes = 0;
    let weekMinutes = 0;
    let periodMinutes = 0;
    let todayHolidayMinutes = 0;
    let weekHolidayMinutes = 0;
    let periodHolidayMinutes = 0;

    for (const s of sessions) {
      if (s.dateIso === todayIso) {
        todayMinutes += s.minutes;
        if (s.isHolidaySession) todayHolidayMinutes += s.minutes;
      }
      if (s.startMs >= mondayDate.getTime()) {
        weekMinutes += s.minutes;
        if (s.isHolidaySession) weekHolidayMinutes += s.minutes;
      }
      if (s.startMs >= periodStartMs && s.startMs <= periodEndMs) {
        periodMinutes += s.minutes;
        if (s.isHolidaySession) periodHolidayMinutes += s.minutes;
      }
    }

    // Overtime calculations
    const dailyStandardMins = Math.round(standardDailyHours * 60);
    const todayOtMinutes = !isHoliday && todayMinutes > dailyStandardMins ? todayMinutes - dailyStandardMins : 0;
    const weekNonHolMinutes = Math.max(0, weekMinutes - weekHolidayMinutes);
    const weekOtMinutes = weekNonHolMinutes > 2400 ? weekNonHolMinutes - 2400 : todayOtMinutes;

    const todayH = Math.floor(todayMinutes / 60);
    const todayM = todayMinutes % 60;
    const weekH = Math.floor(weekMinutes / 60);
    const weekM = weekMinutes % 60;
    const periodH = Math.floor(periodMinutes / 60);
    const periodM = periodMinutes % 60;

    return {
      today: `${todayH}h ${String(todayM).padStart(2, '0')}m`,
      thisWeek: `${weekH}h ${String(weekM).padStart(2, '0')}m`,
      payPeriod: `${periodH}h ${String(periodM).padStart(2, '0')}m`,
      periodLabel,
      todayMinutes,
      weekMinutes,
      periodMinutes,
      todayOtMinutes,
      weekOtMinutes,
      todayHolidayMinutes,
      weekHolidayMinutes,
      periodHolidayMinutes,
      isHoliday,
      todayHoliday,
      isOvertimeActive: todayOtMinutes > 0,
    };
  }, [punches, holidays, activePayPeriod, isClocked, clockStartTime, elapsedDuration, standardDailyHours]);

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
          loadPunches();
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
            className="mt-16"
            style={{ position: 'relative', zIndex: 100 }}
          >
            <div className="row gap-8">
              <button
                type="button"
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
                {isClocked
                  ? `Clock out · ${selectedActivity.name}`
                  : `Clock in · ${selectedActivity.name}`}
              </button>

              <button
                type="button"
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
            </div>

            {/* Dropdown Menu with absolute positioning and high z-index */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  left: 0,
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
                  Select Punch Activity
                </div>

                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {activities.map((act) => {
                    const isSelected =
                      selectedActivity.name.toLowerCase() === act.name.toLowerCase();
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
                        onClick={async () => {
                          userSelectedActivityRef.current = act;
                          setSelectedActivity(act);
                          setDropdownOpen(false);
                          try {
                            localStorage.setItem(
                              'easyhr_selected_clock_activity',
                              JSON.stringify(act)
                            );
                          } catch {}

                          // If already clocked in and switching to a different activity (e.g. Lunch), update active session
                          if (
                            isClocked &&
                            act.name.toLowerCase() !== selectedActivity.name.toLowerCase()
                          ) {
                            toast.success(
                              `Switched to ${act.name}`,
                              `Active session updated to ${act.name} (${
                                act.isBillable ? 'Billable' : 'Non-billable'
                              }).`
                            );
                            if (isSignedIn) {
                              try {
                                const token = await getToken();
                                if (token) {
                                  await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
                                    method: 'POST',
                                    headers: getAuthHeaders(token),
                                    body: JSON.stringify({
                                      kind: 'clock_in',
                                      activity: act.name,
                                      isBillable: act.isBillable,
                                      occurredAt: new Date().toISOString(),
                                      source: 'web',
                                    }),
                                  });
                                  loadPunches(false);
                                }
                              } catch {}
                            }
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: act.color || 'var(--primary)',
                              flexShrink: 0,
                            }}
                          />
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
                    <Link
                      href="/attendance?tab=activities"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '6px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--primary)',
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Configure Activities in Settings &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Holiday / Overtime Rate Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 12 }}>
            {dynamicTimeSummary.isHoliday && (
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'var(--primary-tint, #EFF6FF)',
                  border: '1px solid var(--primary, #2563EB)',
                  color: 'var(--primary, #2563EB)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={13} />
                <span>
                  Holiday Rate Active ({holidayMultiplier}×)
                  {dynamicTimeSummary.todayHoliday ? ` · ${dynamicTimeSummary.todayHoliday.name}` : ' · Sunday Rest Day'}
                </span>
              </div>
            )}

            {dynamicTimeSummary.isOvertimeActive && (
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#FFFBEB',
                  border: '1px solid #F59E0B',
                  color: '#B45309',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Clock size={13} />
                <span>
                  Overtime Rate Active ({overtimeMultiplier}×) · {Math.floor(dynamicTimeSummary.todayOtMinutes / 60)}h {dynamicTimeSummary.todayOtMinutes % 60}m OT today
                </span>
              </div>
            )}
          </div>

          <div className="row mt-14 mb-6" style={{ justifyContent: 'center' }}>
            <span className="text-5 text-xs">
              Today &rarr; {dynamicTimeSummary.today}
              {dynamicTimeSummary.isHoliday
                ? ` · Holiday Work (${holidayMultiplier}×)`
                : dynamicTimeSummary.isOvertimeActive
                ? ` · Overtime (${overtimeMultiplier}×)`
                : isClocked
                ? ` · ${selectedActivity.name} in progress`
                : ''}
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
            <p className="text-sm text-1 fw-700">{dynamicTimeSummary.thisWeek}</p>
            {dynamicTimeSummary.weekOtMinutes > 0 ? (
              <span style={{ fontSize: 10.5, color: '#B45309', fontWeight: 700, display: 'block' }}>
                +{Math.floor(dynamicTimeSummary.weekOtMinutes / 60)}h {dynamicTimeSummary.weekOtMinutes % 60}m OT ({overtimeMultiplier}×)
              </span>
            ) : (
              <span style={{ fontSize: 10.5, color: 'var(--text-4, #9CA3AF)', display: 'block' }}>
                Standard Hours
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-5 mb-4">Pay Period</p>
            <p className="text-sm text-1 fw-700">{dynamicTimeSummary.payPeriod}</p>
            <span style={{ fontSize: 10.5, color: 'var(--primary, #2563EB)', fontWeight: 600, display: 'block' }}>
              {dynamicTimeSummary.periodLabel}
            </span>
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
            <button className="btn-neutral" onClick={() => setTimeEntryModal(false)} disabled={isSavingManual}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                if (!manualDate || !manualStartTime || !manualEndTime) {
                  toast.error('Missing fields', 'Please enter date, start time, and end time.');
                  return;
                }
                setIsSavingManual(true);
                try {
                  const token = await getToken();
                  if (!token) throw new Error('Not authenticated');
                  const startIso = `${manualDate}T${manualStartTime}:00Z`;
                  const endIso = `${manualDate}T${manualEndTime}:00Z`;
                  const act = activities.find((a) => a.name === manualActivityName) || selectedActivity;

                  await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
                    method: 'POST',
                    headers: getAuthHeaders(token),
                    body: JSON.stringify({
                      kind: 'clock_in',
                      activity: act.name,
                      isBillable: act.isBillable,
                      occurredAt: startIso,
                      source: 'manual',
                    }),
                  });

                  await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
                    method: 'POST',
                    headers: getAuthHeaders(token),
                    body: JSON.stringify({
                      kind: 'clock_out',
                      activity: act.name,
                      isBillable: act.isBillable,
                      occurredAt: endIso,
                      source: 'manual',
                    }),
                  });

                  toast.success('Time entry logged', `Saved ${manualStartTime} - ${manualEndTime} on ${manualDate}.`);
                  setTimeEntryModal(false);
                  await loadPunches();
                } catch {
                  toast.error('Submission failed', 'Could not save attendance punch.');
                } finally {
                  setIsSavingManual(false);
                }
              }}
              disabled={isSavingManual}
            >
              {isSavingManual ? 'Saving...' : 'Save Time Entry'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">Date</label>
            <Input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
            />
          </div>
          <div className="grid-2 gap-12">
            <div>
              <label className="form-label">Start Time*</label>
              <Input
                type="time"
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">End Time*</label>
              <Input
                type="time"
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Activity</label>
            <Select
              value={manualActivityName}
              onChange={(e) => setManualActivityName(e.target.value)}
            >
              {activities.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} ({a.isBillable ? 'Billable' : 'Non-billable'})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="form-label">Note (Optional)</label>
            <Textarea
              rows={2}
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="Add project details or task summary..."
            />
          </div>
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
  const { isSignedIn, getToken } = useAuth();
  const [modal, setModal] = useState(false);
  const [requestMode, setRequestMode] = useState<'days' | 'hours'>('days');
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formType, setFormType] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formHours, setFormHours] = useState(8);
  const [formReason, setFormReason] = useState('');

  const loadLeaveData = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const headers = getAuthHeaders(token);

      const [balRes, typesRes, meRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/leave/balances`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/leave/types`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/people/me`, { headers }).catch(() => null),
      ]);

      if (balRes && balRes.ok) {
        const bData = await balRes.json();
        setBalances(Array.isArray(bData) ? bData : bData?.data || []);
      }
      if (typesRes && typesRes.ok) {
        const tData = await typesRes.json();
        const list = Array.isArray(tData) ? tData : tData?.data || [];
        setLeaveTypes(list);
        if (list.length > 0 && !formType) {
          setFormType(list[0].id);
        }
      }
      if (meRes && meRes.ok) {
        const me = await meRes.json();
        if (me?.id) setCurrentEmployeeId(me.id);
      }
    } catch {
      // Graceful fallback
    }
  }, [isSignedIn, getToken, formType]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formType || !formStartDate) {
      toast.error('Missing fields', 'Please select a leave type and date.');
      return;
    }
    const end = requestMode === 'hours' ? formStartDate : (formEndDate || formStartDate);

    setIsSubmitting(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);
      const res = await fetch(`${API_BASE_URL}/api/v1/leave/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeId: currentEmployeeId,
          leaveTypeId: formType,
          startDate: formStartDate,
          endDate: end,
          requestedMinutes: Math.round(formHours * 60),
          reason: formReason,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Failed to submit request');
      }

      toast.success('Time-off requested', `${formHours}h request submitted to your manager.`);
      setModal(false);
      setFormReason('');
      await loadLeaveData();
    } catch (err: any) {
      toast.error('Submission failed', err?.message || 'Could not submit time-off request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayBalances = balances.length > 0 ? balances : [
    { leaveTypeName: 'Vacation', availableHours: 120, usedHours: 16 },
    { leaveTypeName: 'Sick Leave', availableHours: 40, usedHours: 8 },
  ];

  return (
    <Card>
      <CardHeader title="Time Off" icon={<CalendarDays size={16} strokeWidth={2.5} />} />
      <CardBody>
        <div className="row gap-16 mb-20" style={{ overflowX: 'auto', paddingBottom: 4 }}>
          {displayBalances.slice(0, 3).map((b) => (
            <div key={b.leaveTypeId || b.leaveTypeName} style={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
              {(b.leaveTypeName || '').toLowerCase().includes('sick') ? (
                <CalendarHeart size={26} strokeWidth={1.5} style={{ color: 'var(--primary, #2563EB)', margin: '0 auto' }} />
              ) : (
                <Palmtree size={26} strokeWidth={1.5} style={{ color: 'var(--primary, #2563EB)', margin: '0 auto' }} />
              )}
              <p className="text-xs text-2 mt-8 fw-700">{b.leaveTypeName}</p>
              <p className="text-xs text-1 fw-800 mt-2">{b.availableHours ?? 0}h <span className="text-5 fw-normal">left</span></p>
              <p className="text-xs text-5 mt-2">{b.usedHours ?? 0}h used</p>
            </div>
          ))}
        </div>

        <button
          className="btn-secondary w-full"
          style={{ padding: '12px 24px', fontSize: 13.5, fontWeight: 700 }}
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            setFormStartDate(today);
            setFormEndDate(today);
            setModal(true);
          }}
        >
          <CalendarPlus size={16} strokeWidth={2.5} />
          Request Time Off (Hours or Days)
        </button>
      </CardBody>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Request Time Off"
        subtitle="Submit a full-day or partial-day (hours) leave request."
        footer={
          <>
            <button className="btn-neutral" onClick={() => setModal(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : `Submit Request (${formHours}h)`}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Leave Type *</label>
            <select
              className="select w-full"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              required
            >
              {leaveTypes.length === 0 && <option value="">General Time Off</option>}
              {leaveTypes.map((t) => {
                const bal = balances.find((b) => b.leaveTypeId === t.id);
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} {bal ? `(${bal.availableHours}h available)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="form-label">Request Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setRequestMode('days');
                  setFormHours(8);
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: `1.5px solid ${requestMode === 'days' ? 'var(--primary, #2563EB)' : 'var(--card-border, #E8ECE8)'}`,
                  background: requestMode === 'days' ? 'var(--primary-tint, #EFF6FF)' : '#FFFFFF',
                  color: requestMode === 'days' ? 'var(--primary, #2563EB)' : 'var(--text-2, #374151)',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                📅 Full Day(s)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequestMode('hours');
                  setFormHours(2);
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: `1.5px solid ${requestMode === 'hours' ? 'var(--primary, #2563EB)' : 'var(--card-border, #E8ECE8)'}`,
                  background: requestMode === 'hours' ? 'var(--primary-tint, #EFF6FF)' : '#FFFFFF',
                  color: requestMode === 'hours' ? 'var(--primary, #2563EB)' : 'var(--text-2, #374151)',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                ⏱️ Hours / Partial Day
              </button>
            </div>
          </div>

          {requestMode === 'hours' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Date *</label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => {
                    setFormStartDate(e.target.value);
                    setFormEndDate(e.target.value);
                  }}
                  required
                />
              </div>

              <div>
                <label className="form-label">Duration in Hours *</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {[1, 2, 3, 4, 6, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setFormHours(h)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1px solid ${formHours === h ? 'var(--primary, #2563EB)' : 'var(--card-border, #E8ECE8)'}`,
                        background: formHours === h ? 'var(--primary, #2563EB)' : '#FFFFFF',
                        color: formHours === h ? '#FFFFFF' : 'var(--text-2, #374151)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {h} {h === 1 ? 'hr' : h === 4 ? 'hrs (Half Day)' : 'hrs'}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={formHours}
                  onChange={(e) => setFormHours(parseFloat(e.target.value) || 0)}
                  required
                />
                <small style={{ color: 'var(--text-4, #9CA3AF)', fontSize: 11, display: 'block', marginTop: 4 }}>
                  Requesting partial day time off. Deducts exactly {formHours} hours from your balance.
                </small>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div>
                  <label className="form-label">Start Date *</label>
                  <Input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const end = formEndDate || newStart;
                      let days = 1;
                      if (newStart && end && end >= newStart) {
                        const diffMs = new Date(end).getTime() - new Date(newStart).getTime();
                        days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
                      }
                      setFormStartDate(newStart);
                      if (end < newStart) setFormEndDate(newStart);
                      setFormHours(days * 8);
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Date *</label>
                  <Input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const start = formStartDate || newEnd;
                      let days = 1;
                      if (start && newEnd && newEnd >= start) {
                        const diffMs = new Date(newEnd).getTime() - new Date(start).getTime();
                        days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
                      }
                      setFormEndDate(newEnd);
                      setFormHours(days * 8);
                    }}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Total Hours ({formHours / 8} day(s))</label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={formHours}
                  onChange={(e) => setFormHours(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Reason / Note to Manager</label>
            <Textarea
              rows={3}
              placeholder="e.g. Doctor's appointment, family commitment, personal errand..."
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>
        </form>
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
    <Card className={preview ? '' : 'h-full flex-1'} style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Megaphone size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">What&apos;s happening at Your Co</h2>
        </div>
        <div className="row gap-8 align-center">
          <Link
            href="/announcements"
            className="btn-neutral btn-sm"
            style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}
          >
            View News &rarr;
          </Link>
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
      <Card className={preview ? '' : 'h-full flex-1'} style={{ height: '100%' }}>
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
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 6,
                        background: '#f4f4f5',
                        color: '#52525b',
                        border: '1px solid #e4e4e7',
                      }}
                    >
                      {b.type === 'birthday' ? <Gift size={10} strokeWidth={2} /> : <Award size={10} strokeWidth={2} />}
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

interface NewHireProfile {
  id: string;
  name: string;
  firstName: string;
  title: string;
  department: string;
  location?: string;
  startDate?: string;
  avatar?: string;
  bio?: string;
  funFact?: string;
  favoriteFood?: string;
  favoriteMovies?: string;
  favoriteMusic?: string;
  coffeeTea?: string;
}

export function NewHiresWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  const { getToken, isSignedIn } = useAuth();
  const { isHRAdmin, role } = useRole();
  const [newHires, setNewHires] = useState<NewHireProfile[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

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
            const mapped: NewHireProfile[] = data.data.slice(0, 5).map((e: any) => ({
              id: e.id,
              firstName: e.firstName || e.name?.split(' ')[0] || 'Teammate',
              name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || 'Team Member',
              title: e.title || e.jobTitle || 'New Team Member',
              department: e.department || 'Operations',
              location: e.location || 'Headquarters',
              startDate: e.hiredOn || e.startDate,
              avatar: e.avatarUrl || e.avatar,
            }));
            setNewHires(mapped);
          }
        }
      } catch {}
    }
    fetchNewHires();
  }, [isSignedIn]);

  // Lazy-load rich onboarding details when a user clicks to expand a new hire
  const toggleExpand = async (empId: string) => {
    if (expandedId === empId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(empId);

    const hire = newHires.find((h) => h.id === empId);
    if (hire && hire.bio !== undefined) return; // already loaded

    setLoadingDetails((prev) => ({ ...prev, [empId]: true }));
    try {
      const token = await getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/v1/employees/${empId}`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const prof = await res.json();
          setNewHires((prev) =>
            prev.map((h) =>
              h.id === empId
                ? {
                    ...h,
                    bio: prof.bio || '',
                    funFact: prof.funFact || '',
                    favoriteFood: prof.favoriteFood || '',
                    favoriteMovies: prof.favoriteMovies || '',
                    favoriteMusic: prof.favoriteMusic || '',
                    coffeeTea: prof.coffeeTea || '',
                  }
                : h
            )
          );
        }
      }
    } catch {} finally {
      setLoadingDetails((prev) => ({ ...prev, [empId]: false }));
    }
  };

  return (
    <Card className={preview ? '' : 'h-full flex-1'} style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon">
            <UserPlus size={16} strokeWidth={2.5} />
          </div>
          <h2 className="card-header-title">Welcome New Hires</h2>
        </div>
        <div className="row gap-8 align-center">
          <span className="text-xs text-5" style={{ fontSize: 11 }}>Click to expand</span>
          {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
        </div>
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
          <div className="col">
            {newHires.map((emp) => {
              const isExpanded = expandedId === emp.id;

              return (
                <div
                  key={emp.id}
                  style={{
                    borderBottom: '1px solid var(--card-border)',
                    background: isExpanded ? '#FAFAF9' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {/* Summary Row */}
                  <div
                    onClick={() => toggleExpand(emp.id)}
                    style={{
                      padding: '12px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <Avatar src={emp.avatar} name={emp.name} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row gap-8 align-center">
                        <p className="text-sm text-1 m-0 truncate">{emp.name}</p>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 7px',
                            borderRadius: 999,
                            background: 'var(--primary-tint)',
                            color: 'var(--primary)',
                          }}
                        >
                          New
                        </span>
                      </div>
                      <p className="text-xs text-5 mt-2 m-0 truncate">
                        {emp.title} · {emp.department}
                      </p>
                    </div>

                    <div className="row gap-6 align-center">
                      <span
                        className="text-xs"
                        style={{
                          fontSize: 11,
                          color: isExpanded ? 'var(--primary)' : 'var(--text-4)',
                        }}
                      >
                        {isExpanded ? 'Hide' : 'About'}
                      </span>
                      <ChevronDown
                        size={14}
                        style={{
                          color: isExpanded ? 'var(--primary)' : 'var(--text-4)',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Expanded Cohesive Profile Details (No emojis, no multicolor sub-cards) */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 20px 16px 56px',
                        animation: 'fadeIn 0.18s ease',
                      }}
                    >
                      {loadingDetails[emp.id] ? (
                        <div className="py-8 text-xs text-5">
                          <Loader2 size={14} className="animate-spin mr-6 inline" />
                          Loading details...
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <p className="text-xs text-3 m-0" style={{ lineHeight: 1.55 }}>
                            {emp.bio || `${emp.firstName} recently joined the ${emp.department} team as ${emp.title}.`}
                          </p>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              rowGap: 8,
                              columnGap: 16,
                              paddingTop: 10,
                              borderTop: '1px solid var(--card-border)',
                            }}
                          >
                            <div className="row gap-8">
                              <MapPin size={13} style={{ color: 'var(--text-5)', flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <span className="text-xs text-5" style={{ fontSize: 10, display: 'block' }}>Location</span>
                                <span className="text-xs text-1 truncate" style={{ display: 'block' }}>{emp.location || 'Headquarters'}</span>
                              </div>
                            </div>

                            <div className="row gap-8">
                              <Briefcase size={13} style={{ color: 'var(--text-5)', flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <span className="text-xs text-5" style={{ fontSize: 10, display: 'block' }}>Department</span>
                                <span className="text-xs text-1 truncate" style={{ display: 'block' }}>{emp.department}</span>
                              </div>
                            </div>

                            {(emp.coffeeTea || emp.favoriteFood) && (
                              <div className="row gap-8">
                                <Coffee size={13} style={{ color: 'var(--text-5)', flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                  <span className="text-xs text-5" style={{ fontSize: 10, display: 'block' }}>Favorites</span>
                                  <span className="text-xs text-1 truncate" style={{ display: 'block' }}>
                                    {[emp.coffeeTea, emp.favoriteFood].filter(Boolean).join(' · ')}
                                  </span>
                                </div>
                              </div>
                            )}

                            {(emp.favoriteMusic || emp.funFact) && (
                              <div className="row gap-8">
                                <Music size={13} style={{ color: 'var(--text-5)', flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                  <span className="text-xs text-5" style={{ fontSize: 10, display: 'block' }}>Interests</span>
                                  <span className="text-xs text-1 truncate" style={{ display: 'block' }}>
                                    {emp.favoriteMusic || emp.funFact}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {(isHRAdmin || role === 'Manager') && (
                            <div className="row-between pt-6" style={{ borderTop: '1px solid var(--card-border)' }}>
                              <span className="text-xs text-5" style={{ fontSize: 11 }}>
                                {emp.startDate ? `Started ${emp.startDate}` : 'Active team member'}
                              </span>
                              <Link
                                href={`/people/${emp.id}`}
                                className="text-xs text-primary"
                                style={{ textDecoration: 'none' }}
                              >
                                View Profile &rarr;
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
  const [holidays, setHolidays] = useState<Array<{ id: string; name: string; date: string }>>([]);

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
          const json = await res.json();
          const items = Array.isArray(json) ? json : json.data || [];
          setHolidays(items.map((h: any) => ({ id: h.id, name: h.name, date: h.holidayDate || h.date })));
        }
      } catch {}
    }
    loadHolidays();
  }, [isSignedIn, getToken]);

  return (
    <Card className={preview ? '' : 'h-full flex-1'} style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Sun size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Company Holidays</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody style={{ padding: 0 }}>
        {holidays.length === 0 && <p className="text-sm text-5" style={{ padding: '16px 20px' }}>No company holidays have been added.</p>}
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
  const { getToken, isSignedIn } = useAuth();
  const [updates, setUpdates] = useState<AnnouncementItem[]>([]);
  useEffect(() => {
    if (!isSignedIn) return;
    getToken().then(async (token) => {
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/v1/announcements`, { headers: getAuthHeaders(token) });
      if (!response.ok) return;
      const json = await response.json();
      setUpdates((Array.isArray(json) ? json : json.data || []).slice(0, 3));
    }).catch(() => setUpdates([]));
  }, [isSignedIn, getToken]);
  return (
    <Card className={preview ? '' : 'h-full flex-1'} style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Users size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Org Updates</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody>
        {updates.length === 0 ? <p className="text-sm text-5">No company updates have been published.</p> : updates.map((update) => (
          <div key={update.id} className="feed-item">
            <div className="feed-content">
              <p className="feed-title"><strong>{update.title}</strong></p>
              <p className="feed-sub">{update.category} · {update.timeAgo || update.createdAt}</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Pending Signatures Widget                                               */
/* -------------------------------------------------------------------------- */

export function SignaturesWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  const { getToken, isSignedIn } = useAuth();
  const [docs, setDocs] = useState<Array<{ requestId: string; documentName: string }>>([]);
  useEffect(() => {
    if (!isSignedIn) return;
    getToken().then(async (token) => {
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/v1/signatures/me`, { headers: getAuthHeaders(token) });
      if (!response.ok) return;
      const json = await response.json();
      const items = Array.isArray(json) ? json : json.data || [];
      setDocs(items.filter((item: any) => item.status === 'pending').slice(0, 3).map((item: any) => ({ requestId: item.requestId, documentName: item.documentName })));
    }).catch(() => setDocs([]));
  }, [isSignedIn, getToken]);

  return (
    <Card className={preview ? '' : 'h-full flex-1'} style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><FileSignature size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Pending Signatures</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody>
        {docs.length === 0 && <p className="text-sm text-5">No documents need your signature.</p>}
        {docs.map((doc) => (
          <div key={doc.requestId} className="doc-card" style={{ marginBottom: 12 }}>
            <div className="doc-card-icon" style={{ width: 34, height: 34 }}>
              <FileSignature size={16} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="doc-card-name">{doc.documentName}</div>
              <div className="doc-card-sub">Awaiting your electronic signature</div>
            </div>
            <Link className="btn-primary btn-sm" style={{ padding: '4px 12px', fontSize: 12, textDecoration: 'none' }} href="/my-signatures">Review</Link>
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
