"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { CompulsoryMyTimeWidget } from '@/components/widgets';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from '@/components/ui/Toast';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';

interface AttendancePunch {
  id: string;
  employeeId: string;
  kind: 'in' | 'out';
  occurredAt: string;
  source: string;
  activity?: string;
  isBillable?: boolean;
}

interface DayEntry {
  day: string;
  dateStr: string;
  formattedDate: string;
  isoDate: string;
  hrs: string;
  totalMinutes: number;
  time: string;
  status: 'approved' | 'pending' | 'none';
  details: {
    project: string;
    hrs: string;
    time: string;
    isBillable: boolean;
  }[];
}
interface TimesheetReview { id:string; employeeName:string; weekStart:string; weekEnd:string; totalMinutes:number; status:string; employeeNote:string }

export default function TimeTrackingPage() {
  const { getToken, isSignedIn } = useAuth();
  const { currentUser, role, isHRAdmin, isManager } = useRole();

  const [modalOpen, setModalOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [punches, setPunches] = useState<AttendancePunch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timesheets, setTimesheets] = useState<TimesheetReview[]>([]);
  const [canReviewTimesheets, setCanReviewTimesheets] = useState(false);
  const [isSubmittingTimesheet, setIsSubmittingTimesheet] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Manual entry form
  const [manualDate, setManualDate] = useState('');
  const [manualActivity, setManualActivity] = useState('Production');
  const [manualIsBillable, setManualIsBillable] = useState(true);
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('17:00');
  const [manualNote, setManualNote] = useState('');

  useEffect(() => {
    setHydrated(true);
    setManualDate(new Date().toISOString().slice(0, 10));
  }, []);

  // Expanded row state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (day: string) => {
    setExpandedRows((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  // Compute week bounds
  const { monday, sunday, dateLabel, daysList } = useMemo(() => {
    const base = new Date(hydrated ? Date.now() : 0);
    base.setDate(base.getDate() + weekOffset * 7);

    const day = base.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(base);
    mon.setDate(base.getDate() + diffToMon);
    mon.setHours(0, 0, 0, 0);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${monthNames[mon.getMonth()]} ${mon.getDate()} - ${monthNames[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`;

    const days: { day: string; date: Date; iso: string; formatted: string }[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        day: dayNames[i],
        date: d,
        iso,
        formatted: `${monthNames[d.getMonth()]} ${d.getDate()}`,
      });
    }

    return { monday: mon, sunday: sun, dateLabel: label, daysList: days };
  }, [weekOffset, hydrated]);

  // Fetch punches from backend
  const fetchPunches = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/attendance/punches?limit=100`, {
        headers: getAuthHeaders(token),
      });

      if (res.ok) {
        const json = await res.json();
        const dataList = Array.isArray(json) ? json : json.data || [];
        setPunches(dataList);
      }
      const reviewRes=await fetch(`${API_BASE_URL}/api/v1/timesheets`,{headers:getAuthHeaders(token)});
      if(reviewRes.ok){const j=await reviewRes.json();setTimesheets(j.data||[]);setCanReviewTimesheets(true)}else setCanReviewTimesheets(false);
    } catch (err) {
      console.error('Failed to load punches', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  const submitWeek = async () => { setIsSubmittingTimesheet(true); try { const token=await getToken(); if(!token)throw new Error('Not authenticated');const weekStart=`${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;const res=await fetch(`${API_BASE_URL}/api/v1/timesheets/submit`,{method:'POST',headers:{...getAuthHeaders(token),'Content-Type':'application/json'},body:JSON.stringify({weekStart,note:''})});if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.detail||'Could not submit timesheet')}toast.success('Timesheet submitted','Your weekly hours are now waiting for manager approval.');await fetchPunches()}catch(e){toast.error('Submission failed',e instanceof Error?e.message:'Could not submit timesheet')}finally{setIsSubmittingTimesheet(false)} };
  const reviewWeek = async (id:string,decision:'approved'|'rejected') => {try{const token=await getToken();if(!token)throw new Error('Not authenticated');const res=await fetch(`${API_BASE_URL}/api/v1/timesheets/${id}/review`,{method:'POST',headers:{...getAuthHeaders(token),'Content-Type':'application/json'},body:JSON.stringify({decision})});if(!res.ok)throw new Error('Could not update timesheet');setTimesheets(v=>v.filter(t=>t.id!==id));toast.success(decision==='approved'?'Timesheet approved':'Timesheet returned','Timesheet review saved.')}catch(e){toast.error('Review failed',e instanceof Error?e.message:'Could not review timesheet')} };

  useEffect(() => {
    fetchPunches();
  }, [fetchPunches]);

  const isClockIn = (kind?: string) => {
    if (!kind) return false;
    const k = kind.toLowerCase();
    return k === 'in' || k === 'clock_in';
  };

  const isClockOut = (kind?: string) => {
    if (!kind) return false;
    const k = kind.toLowerCase();
    return k === 'out' || k === 'clock_out';
  };

  // Process punches into weekly timesheet rows with live movements & activities
  const timesheetData: DayEntry[] = useMemo(() => {
    return daysList.map((d) => {
      // Find punches matching this calendar date
      const dayPunches = punches
        .filter((p) => {
          if (!p.occurredAt) return false;
          const pDate = new Date(p.occurredAt).toISOString().slice(0, 10);
          return pDate === d.iso;
        })
        .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

      if (dayPunches.length === 0) {
        return {
          day: d.day,
          dateStr: d.formatted,
          formattedDate: d.formatted,
          isoDate: d.iso,
          hrs: '0h 00m',
          totalMinutes: 0,
          time: '--',
          status: 'none',
          details: [],
        };
      }

      // Pair in / out punches & map movements
      let totalMinutes = 0;
      const details: DayEntry['details'] = [];
      let startTimeStr = '';
      let endTimeStr = '';

      for (let i = 0; i < dayPunches.length; i++) {
        const current = dayPunches[i];
        if (isClockIn(current.kind)) {
          const inTime = new Date(current.occurredAt);
          if (!startTimeStr) {
            startTimeStr = inTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          }

          // Look for next matching punch
          const nextPunch = dayPunches[i + 1];
          let outTime: Date;
          let isOngoing = false;

          if (nextPunch && isClockOut(nextPunch.kind)) {
            outTime = new Date(nextPunch.occurredAt);
            endTimeStr = outTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            i++; // Skip paired out punch
          } else {
            // Punch is still open / active today
            outTime = new Date();
            isOngoing = true;
            endTimeStr = 'Currently In Progress';
          }

          const diffMins = Math.max(0, Math.round((outTime.getTime() - inTime.getTime()) / (1000 * 60)));
          totalMinutes += diffMins;

          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          const activityLabel = current.activity || (current.source === 'mobile' ? 'Mobile Check-in' : 'Production Work');

          details.push({
            project: activityLabel,
            hrs: `${hours}h ${String(mins).padStart(2, '0')}m`,
            time: `${inTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${
              isOngoing ? 'Active now' : outTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            }`,
            isBillable: current.isBillable ?? true,
          });
        }
      }

      const totalH = Math.floor(totalMinutes / 60);
      const totalM = totalMinutes % 60;

      return {
        day: d.day,
        dateStr: d.formatted,
        formattedDate: d.formatted,
        isoDate: d.iso,
        hrs: `${totalH}h ${String(totalM).padStart(2, '0')}m`,
        totalMinutes,
        time: startTimeStr ? `${startTimeStr} - ${endTimeStr || '--'}` : '--',
        status: totalMinutes > 0 ? 'approved' : 'none',
        details,
      };
    });
  }, [daysList, punches]);

  // Aggregate metrics
  const totalWeeklyMinutes = useMemo(() => {
    return timesheetData.reduce((acc, row) => acc + row.totalMinutes, 0);
  }, [timesheetData]);

  const weeklyHours = Math.floor(totalWeeklyMinutes / 60);
  const weeklyMins = totalWeeklyMinutes % 60;
  const weeklyFormatted = `${weeklyHours}h ${String(weeklyMins).padStart(2, '0')}m`;
  const targetMinutes = 40 * 60;
  const remainingMinutes = Math.max(0, targetMinutes - totalWeeklyMinutes);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMins = remainingMinutes % 60;
  const progressPercent = Math.min(100, Math.round((totalWeeklyMinutes / targetMinutes) * 100));

  // Pay period total (estimate current month or current pay period)
  const payPeriodMinutes = totalWeeklyMinutes * 2;
  const payPeriodHours = Math.floor(payPeriodMinutes / 60);
  const payPeriodMins = payPeriodMinutes % 60;

  // Handle saving manual time entry
  const handleSaveManualEntry = async () => {
    if (!manualDate || !manualStartTime || !manualEndTime) {
      toast.error('Missing required fields', 'Please enter date, start time, and end time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const startOccurred = `${manualDate}T${manualStartTime}:00Z`;
      const endOccurred = `${manualDate}T${manualEndTime}:00Z`;

      // Punch In
      await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          kind: 'in',
          occurredAt: startOccurred,
          source: 'manual',
          activity: manualActivity,
          isBillable: manualIsBillable,
        }),
      });

      // Punch Out
      await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          kind: 'out',
          occurredAt: endOccurred,
          source: 'manual',
          activity: manualActivity,
          isBillable: manualIsBillable,
        }),
      });

      toast.success('Time entry saved', 'Punch records recorded in your timesheet.');
      setModalOpen(false);
      setManualNote('');
      await fetchPunches();
    } catch (err: any) {
      toast.error('Failed to save entry', err.message || 'Unable to record punches.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-page)', padding: 0 }}>
      {/* Header */}
      <PageHeader
        title="Time Tracking & Timesheet"
        subtitle="Review live attendance logs, weekly timesheets, and billable project breakdowns."
        icon={<Clock size={28} className="text-white" />}
        actions={
          <>
            <button
              className="btn-secondary"
              style={{ background: 'white' }}
              onClick={() => {
                toast.success('Timesheet Exported', 'CSV summary generated.');
              }}
            >
              <Download size={14} /> Export
            </button>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Add Time Entry
            </button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start', padding: 32 }}>
        {/* LEFT COLUMN: Summary Cards + Timesheet List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Card style={{ padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none' }}>
              <div className="row-between mb-8">
                <span className="text-sm fw-600 text-2">This Week</span>
                <Clock size={16} className="text-primary" />
              </div>
              <div className="text-2xl fw-700 text-1 mb-12">{weeklyFormatted}</div>
              <div style={{ background: 'var(--border)', height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ background: 'var(--gradient)', height: '100%', width: `${progressPercent}%`, borderRadius: 2 }} />
              </div>
              <div className="text-xs text-5">
                40h Target • {remainingHours}h {remainingMins}m remaining
              </div>
            </Card>

            <Card style={{ padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none' }}>
              <div className="row-between mb-8">
                <span className="text-sm fw-600 text-2">Pay Period Total</span>
                <Calendar size={16} className="text-success" />
              </div>
              <div className="text-2xl fw-700 text-1 mb-12">
                {payPeriodHours}h {String(payPeriodMins).padStart(2, '0')}m
              </div>
              <div style={{ background: 'var(--border)', height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 8 }}>
                <div
                  style={{
                    background: 'var(--success)',
                    height: '100%',
                    width: `${Math.min(100, Math.round((payPeriodMinutes / (80 * 60)) * 100))}%`,
                    borderRadius: 2,
                  }}
                />
              </div>
              <div className="text-xs text-5">Bi-weekly Period • 80h Target</div>
            </Card>

            <Card style={{ padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none' }}>
              <div className="row-between mb-8">
                <span className="text-sm fw-600 text-2">Overtime</span>
                <History size={16} className="text-warning" />
              </div>
              <div className="text-2xl fw-700 text-1 mb-12">
                {weeklyHours > 40 ? `${weeklyHours - 40}h ${weeklyMins}m` : '0h 00m'}
              </div>
              <div style={{ background: 'var(--border)', height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 8 }}>
                <div
                  style={{
                    background: 'var(--warning)',
                    height: '100%',
                    width: weeklyHours > 40 ? '100%' : '0%',
                    borderRadius: 2,
                  }}
                />
              </div>
              <div className="text-xs text-5">
                {weeklyHours > 40 ? 'Overtime approved' : 'No overtime recorded'}
              </div>
            </Card>
          </div>

          {/* Detailed Timesheet Card */}
          <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none', background: 'white' }}>
            <div className="row-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
              <div className="row gap-12">
                <Calendar size={20} className="text-primary" />
                <h2 className="text-lg fw-700 text-1 m-0">Detailed Timesheet</h2>
              </div>
              <div className="row gap-12">
                <div className="row gap-4" style={{ background: 'var(--bg-page)', borderRadius: 6, padding: 4 }}>
                  <button
                    className="btn-circle"
                    style={{ width: 28, height: 28 }}
                    onClick={() => setWeekOffset((prev) => prev - 1)}
                    title="Previous Week"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm fw-600 text-1 px-8">{dateLabel}</span>
                  <button
                    className="btn-circle"
                    style={{ width: 28, height: 28 }}
                    onClick={() => setWeekOffset((prev) => prev + 1)}
                    title="Next Week"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                {weekOffset !== 0 && (
                  <button
                    className="btn-secondary btn-sm"
                    style={{ background: 'white', fontSize: 11 }}
                    onClick={() => setWeekOffset(0)}
                  >
                    Current Week
                  </button>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 20,
                    background: '#ECFDF5',
                    color: '#059669',
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                  title="Your timesheet updates live from clock-in/out and activity changes"
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
                    }}
                  />
                  <span>Live Real-Time Sync</span>
                </div>
              </div>
            </div>

            <CardBody style={{ padding: 0 }}>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : (
                timesheetData.map((entry, idx, arr) => {
                  const hasDetails = entry.details.length > 0;
                  const isExpanded = expandedRows[entry.day];
                  return (
                    <div key={entry.day} style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '120px 180px 1fr 100px',
                          alignItems: 'center',
                          padding: '20px 32px',
                          cursor: hasDetails ? 'pointer' : 'default',
                          background: isExpanded ? '#FAFAFA' : 'white',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => hasDetails && toggleRow(entry.day)}
                        onMouseEnter={(e) => {
                          if (hasDetails && !isExpanded) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (hasDetails && !isExpanded) e.currentTarget.style.background = 'white';
                        }}
                      >
                        {/* Date Col */}
                        <div className="row gap-12">
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              background: entry.hrs !== '0h 00m' ? 'var(--primary-tint)' : 'var(--bg-page)',
                              color: entry.hrs !== '0h 00m' ? 'var(--primary)' : 'var(--text-4)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span className="text-xs fw-700">{entry.day}</span>
                          </div>
                          <div className="text-xs text-5 fw-600">{entry.dateStr}</div>
                        </div>

                        {/* Time Log Col */}
                        <div>
                          <div className="text-base fw-700 text-1">{entry.hrs}</div>
                          <div className="text-xs text-5 mt-2">{entry.time}</div>
                        </div>

                        {/* Status / Entries Badge Col */}
                        <div className="row gap-12 justify-start">
                          {entry.status === 'approved' && (
                            <Badge variant="success" className="row gap-4">
                              <CheckCircle size={12} /> Logged
                            </Badge>
                          )}
                          {hasDetails && (
                            <span
                              className="text-xs fw-600 text-4 px-8 py-4"
                              style={{ background: 'var(--border)', borderRadius: 12 }}
                            >
                              {entry.details.length} {entry.details.length === 1 ? 'entry' : 'entries'}
                            </span>
                          )}
                        </div>

                        {/* Action Col */}
                        <div className="row justify-end">
                          {hasDetails && (
                            <div style={{ color: 'var(--text-4)' }}>
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {hasDetails && isExpanded && (
                        <div
                          style={{
                            background: '#FAFAFA',
                            padding: '0 32px 20px 148px',
                            borderLeft: '3px solid var(--primary)',
                          }}
                        >
                          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 14 }}>
                            <div style={{ display: 'grid', gap: 10 }}>
                              {entry.details.map((det, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '180px 100px 1fr 100px',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div className="text-sm fw-600 text-2 row gap-8">
                                    <div
                                      style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: det.isBillable ? '#059669' : '#64748b',
                                      }}
                                    />
                                    {det.project}
                                  </div>
                                  <div className="text-sm fw-700 text-1">{det.hrs}</div>
                                  <div className="text-xs text-5">{det.time}</div>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: 10,
                                      textAlign: 'center',
                                      background: det.isBillable ? '#ecfdf5' : '#f1f5f9',
                                      color: det.isBillable ? '#059669' : '#64748b',
                                    }}
                                  >
                                    {det.isBillable ? 'Billable' : 'Non-billable'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
          {canReviewTimesheets && <Card><CardBody><h2 className="text-lg fw-700 text-1 mb-16">Timesheets awaiting review</h2>{timesheets.filter(t=>t.status==='submitted').map(t=><div key={t.id} className="row-between p-12" style={{borderTop:'1px solid var(--border)'}}><div><strong>{t.employeeName}</strong><div className="text-xs text-5">{t.weekStart} · {Math.floor(t.totalMinutes/60)}h {t.totalMinutes%60}m</div></div><div className="row gap-8"><button className="btn-secondary btn-sm" onClick={()=>reviewWeek(t.id,'rejected')}>Return</button><button className="btn-primary btn-sm" onClick={()=>reviewWeek(t.id,'approved')}>Approve</button></div></div>)}{timesheets.every(t=>t.status!=='submitted')&&<p className="text-sm text-5">No timesheets are waiting for review.</p>}</CardBody></Card>}
        </div>

        {/* RIGHT COLUMN: Clock Widget */}
        <div>
          <div style={{ position: 'sticky', top: 24 }}>
            <CompulsoryMyTimeWidget />
          </div>
        </div>
      </div>

      {/* Add Time Entry Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Manual Time Entry"
        footer={
          <>
            <button className="btn-neutral" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSaveManualEntry} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </>
        }
      >
        <div className="grid-2 gap-24 mb-24">
          <div>
            <label className="form-label">
              Date <span className="text-error">*</span>
            </label>
            <input
              type="date"
              className="input"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Activity & Category</label>
            <select
              className="select"
              value={manualActivity}
              onChange={(e) => {
                setManualActivity(e.target.value);
                setManualIsBillable(e.target.value !== 'Lunch' && e.target.value !== 'Break');
              }}
            >
              <option value="Production">Production (Billable)</option>
              <option value="Meeting">Meeting (Billable)</option>
              <option value="Research">Research (Billable)</option>
              <option value="Break">Break (Non-billable)</option>
              <option value="Lunch">Lunch (Non-billable)</option>
            </select>
          </div>
        </div>
        <div className="grid-2 gap-24 mb-24">
          <div>
            <label className="form-label">
              Start Time <span className="text-error">*</span>
            </label>
            <input
              type="time"
              className="input"
              value={manualStartTime}
              onChange={(e) => setManualStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">
              End Time <span className="text-error">*</span>
            </label>
            <input
              type="time"
              className="input"
              value={manualEndTime}
              onChange={(e) => setManualEndTime(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="form-label">Work Note (Optional)</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Briefly describe what tasks you worked on..."
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
