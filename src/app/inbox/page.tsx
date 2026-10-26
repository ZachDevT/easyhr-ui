"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileSignature,
  Inbox,
  Settings2,
  ShieldCheck,
  Sparkles,
  XCircle,
  Loader2,
  User,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { DataRow, SectionHeading, StatusPill } from '@/components/ui/ModulePrimitives';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

interface LiveLeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  requestedMinutes: number;
  status: string;
  submittedAt: string;
  reason?: string | null;
  employeeName?: string;
  employeeAvatar?: string;
  employeeTitle?: string;
  employeeDepartment?: string;
  leaveTypeName?: string;
}

export default function InboxPage() {
  const { role, currentUser, isHRAdmin, isManager } = useRole();

  if (role === 'Employee') {
    return <EmployeeNotifications currentUserId={currentUser?.id || ''} />;
  }

  if (role === 'Manager' && !isHRAdmin) {
    return (
      <main style={{ padding: 32 }}>
        <Card>
          <CardBody style={{ padding: 50, textAlign: 'center' }}>
            <ShieldCheck size={40} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Manager Approvals Live in Team Requests</h1>
            <p style={{ color: 'var(--text-4)', marginBottom: 24 }}>
              Direct line-manager approvals for your direct reports are processed in Team Requests.
            </p>
            <Link href="/team-requests" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Open Team Requests
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  return <HRInbox />;
}

/* -------------------------------------------------------------------------- */
/* Dynamic HR Inbox (Fully Connected to Backend Live Endpoints)              */
/* -------------------------------------------------------------------------- */

function HRInbox() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<LiveLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'Needs review' | 'Decision history'>('Needs review');
  const [selected, setSelected] = useState<LiveLeaveRequest | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLiveInboxData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;
      const headers = getAuthHeaders(token);

      const [requestsRes, empsRes, typesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/leave/requests?limit=100`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/employees?limit=250`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/leave/types`, { headers }).catch(() => null),
      ]);

      let rawRequests: any[] = [];
      if (requestsRes && requestsRes.ok) {
        const j = await requestsRes.json();
        rawRequests = Array.isArray(j) ? j : j.data || [];
      }

      const empMap = new Map<string, any>();
      if (empsRes && empsRes.ok) {
        const j = await empsRes.json();
        const emps = Array.isArray(j) ? j : j.data || [];
        emps.forEach((e: any) => empMap.set(e.id, e));
      }

      const typeMap = new Map<string, string>();
      if (typesRes && typesRes.ok) {
        const j = await typesRes.json();
        const types = Array.isArray(j) ? j : j.data || [];
        types.forEach((t: any) => typeMap.set(t.id, t.name));
      }

      const mapped: LiveLeaveRequest[] = rawRequests.map((r: any) => {
        const emp = empMap.get(r.employeeId);
        const fullName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Employee';
        const typeName = typeMap.get(r.leaveTypeId) || 'Time Off';

        return {
          id: r.id,
          employeeId: r.employeeId,
          leaveTypeId: r.leaveTypeId,
          startDate: r.startDate,
          endDate: r.endDate,
          requestedMinutes: r.requestedMinutes || 480,
          status: r.status,
          submittedAt: r.submittedAt,
          reason: r.reason,
          employeeName: fullName || 'Team Member',
          employeeAvatar: emp?.avatarUrl || emp?.avatar,
          employeeTitle: emp?.jobTitle || 'Staff',
          employeeDepartment: emp?.department || '',
          leaveTypeName: typeName,
        };
      });

      setRequests(mapped);
    } catch (err) {
      console.error('Failed to load HR approval inbox', err);
      toast.error('Network error', 'Unable to fetch HR approval requests.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchLiveInboxData();
  }, [fetchLiveInboxData]);

  // Needs review: pending_hr, pending, pending_manager
  const pendingRequests = useMemo(() => {
    return requests.filter((r) =>
      r.status === 'pending_hr' || r.status === 'pending' || r.status === 'pending_manager'
    );
  }, [requests]);

  // Decision history: approved, declined, cancelled
  const historyRequests = useMemo(() => {
    return requests.filter((r) =>
      r.status === 'approved' || r.status === 'declined' || r.status === 'cancelled'
    );
  }, [requests]);

  const visibleList = tab === 'Needs review' ? pendingRequests : historyRequests;

  const handleDecision = async (approve: boolean) => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const headers = getAuthHeaders(token);

      let url: string;
      let body: any;

      if (approve) {
        // If status is pending_hr, use approve-hr; if pending_manager, use approve
        const isManagerStage = selected.status === 'pending_manager';
        url = isManagerStage
          ? `${API_BASE_URL}/api/v1/leave/requests/${selected.id}/approve`
          : `${API_BASE_URL}/api/v1/leave/requests/${selected.id}/approve-hr`;
        body = { comment: note.trim() || 'Approved by HR Administrator' };
      } else {
        url = `${API_BASE_URL}/api/v1/leave/requests/${selected.id}/decline`;
        body = { reason: note.trim() || 'Declined by HR Administrator' };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.message || 'Operation failed');
      }

      toast.success(
        approve ? 'Leave Request Approved' : 'Leave Request Declined',
        `${selected.employeeName}'s ${selected.leaveTypeName} request has been ${approve ? 'approved' : 'declined'}.`
      );

      setSelected(null);
      setNote('');
      await fetchLiveInboxData();
    } catch (err: any) {
      console.error('Decision error', err);
      toast.error('Action Failed', err.message || 'Server rejected the decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatHours = (minutes: number) => {
    const hours = Math.round((minutes / 60) * 10) / 10;
    const days = Math.round((hours / 8) * 10) / 10;
    return `${hours} hrs (${days} day${days !== 1 ? 's' : ''})`;
  };

  return (
    <>
      <PageHeader
        title="HR Approval Inbox"
        subtitle="Live leave requests awaiting corporate policy balance check and final verification."
        icon={<Inbox size={26} />}
        tabs={['Needs review', 'Decision history']}
        activeTab={tab}
        onTabChange={(t) => setTab(t as any)}
        actions={
          <button
            onClick={() => fetchLiveInboxData()}
            disabled={isLoading}
            className="btn-secondary"
            style={{
              background: 'white',
              color: 'var(--primary)',
              border: 'none',
              height: 34,
              padding: '0 14px',
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: 9,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />} Refresh
          </button>
        }
      />

      <main style={{ padding: '0 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Main List */}
          <Card>
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <SectionHeading
                  title={tab}
                  description={`${visibleList.length} dynamic request${visibleList.length === 1 ? '' : 's'} in this view`}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: tab === 'Needs review' ? '#EFF6FF' : '#F3F4F6',
                    color: tab === 'Needs review' ? 'var(--primary)' : 'var(--text-3)',
                  }}
                >
                  {visibleList.length} {tab === 'Needs review' ? 'Pending' : 'Total'}
                </span>
              </div>

              {isLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-4)' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Syncing live leave requests...</p>
                </div>
              ) : visibleList.length === 0 ? (
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: '#F9FAFB',
                    borderRadius: 12,
                    border: '1px dashed var(--border)',
                  }}
                >
                  <CheckCircle2 size={36} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
                    {tab === 'Needs review' ? 'All caught up!' : 'No decision history yet'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-4)', maxWidth: 420, margin: '0 auto' }}>
                    {tab === 'Needs review'
                      ? 'No pending leave requests require HR verification right now.'
                      : 'Decided leave requests will appear here once finalized.'}
                  </p>
                </div>
              ) : (
                <div className="col gap-10">
                  {visibleList.map((r) => {
                    const isPending = r.status.startsWith('pending');
                    const tone =
                      r.status === 'approved'
                        ? 'success'
                        : r.status === 'declined'
                        ? 'error'
                        : 'primary';

                    return (
                      <DataRow
                        key={r.id}
                        leading={<Avatar name={r.employeeName || 'Staff'} size="sm" src={r.employeeAvatar} />}
                        title={`${r.employeeName} · ${r.leaveTypeName}`}
                        subtitle={`${formatHours(r.requestedMinutes)} · ${r.startDate} → ${r.endDate}${r.employeeDepartment ? ` · ${r.employeeDepartment}` : ''}`}
                        meta={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <StatusPill tone={tone}>
                              {r.status === 'pending_hr'
                                ? 'Needs HR Approval'
                                : r.status === 'pending_manager'
                                ? 'Manager Review'
                                : r.status.toUpperCase()}
                            </StatusPill>
                            <ArrowRight size={14} style={{ color: 'var(--text-4)' }} />
                          </div>
                        }
                        onClick={() => {
                          setSelected(r);
                          setNote('');
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Sidebar */}
          <div className="col gap-20">
            <Card>
              <CardBody>
                <SectionHeading title="Approval Summary" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  <div style={{ padding: 14, background: '#EFF6FF', borderRadius: 10, border: '1px solid #DBEAFE' }}>
                    <strong style={{ fontSize: 24, color: 'var(--primary)' }}>{pendingRequests.length}</strong>
                    <div style={{ fontSize: 11.5, color: '#1E40AF', marginTop: 2, fontWeight: 600 }}>Awaiting HR Review</div>
                  </div>
                  <div style={{ padding: 14, background: '#F0FDF4', borderRadius: 10, border: '1px solid #DCFCE7' }}>
                    <strong style={{ fontSize: 24, color: 'var(--success)' }}>
                      {historyRequests.filter((r) => r.status === 'approved').length}
                    </strong>
                    <div style={{ fontSize: 11.5, color: '#166534', marginTop: 2, fontWeight: 600 }}>Approved Total</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="HR Policy Checklist" />
                <Guide
                  icon={<CheckCircle2 />}
                  title="Manager Endorsement"
                  text="Verify coverage approval before granting final corporate sign-off."
                />
                <Guide
                  icon={<ShieldCheck />}
                  title="Policy & Ledger Balance"
                  text="System verifies available accrued hours before immutable debit."
                />
                <Guide
                  icon={<Clock3 />}
                  title="Ledger Posting"
                  text="Approved requests automatically debit leave balances and update payroll calendars."
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </main>

      {/* Decision Review Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.employeeName} · ${selected.leaveTypeName}` : 'Leave Review'}
        width={580}
        footer={
          selected && selected.status.startsWith('pending') ? (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
              <button
                className="btn-neutral"
                onClick={() => handleDecision(false)}
                disabled={isSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#B91C1C' }}
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={15} />}
                <span>Decline Request</span>
              </button>
              <button
                className="btn-primary"
                onClick={() => handleDecision(true)}
                disabled={isSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Final Approve</span>
              </button>
            </div>
          ) : (
            <button className="btn-neutral" onClick={() => setSelected(null)}>
              Close
            </button>
          )
        }
      >
        {selected && (
          <div className="col gap-16" style={{ padding: '6px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: '#F8FAFC',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
              }}
            >
              <Avatar name={selected.employeeName || 'Staff'} size="lg" src={selected.employeeAvatar} />
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text-1)' }}>
                  {selected.employeeName}
                </h4>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  {selected.employeeTitle} {selected.employeeDepartment ? `· ${selected.employeeDepartment}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--bg-page)', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Time-Off Type
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>
                  {selected.leaveTypeName}
                </p>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-page)', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Duration
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: 13.5, fontWeight: 700, color: 'var(--primary)' }}>
                  {formatHours(selected.requestedMinutes)}
                </p>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-page)', borderRadius: 8, gridColumn: 'span 2' }}>
                <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Dates Requested
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                  {selected.startDate} → {selected.endDate}
                </p>
              </div>
            </div>

            <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <strong style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                Reason Given by Employee:
              </strong>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, fontStyle: selected.reason ? 'normal' : 'italic' }}>
                {selected.reason || 'No specific reason entered by the employee.'}
              </p>
            </div>

            {selected.status.startsWith('pending') && (
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                  HR Decision Note (optional comment recorded on decision ledger):
                </label>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Verified PTO entitlement against payroll accrual schedule..."
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Dynamic Employee Notifications                                             */
/* -------------------------------------------------------------------------- */

function EmployeeNotifications({ currentUserId }: { currentUserId: string }) {
  const { getToken } = useAuth();
  const [tab, setTab] = useState('All');
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then(async (token) => {
      if (!token) return;
      try {
        const headers = getAuthHeaders(token);
        const res = await fetch(`${API_BASE_URL}/api/v1/leave/requests?limit=50`, { headers });
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || [];
          setLeaveRequests(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    });
  }, [getToken]);

  const requestItems = leaveRequests.map((r: any) => ({
    id: r.id,
    type: 'Requests',
    title: `Time-off request (${Math.round((r.requestedMinutes || 480) / 60)}h) ${r.status}`,
    text: `${r.startDate} → ${r.endDate}${r.reason ? ` · ${r.reason}` : ''}`,
    time: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : 'Recent',
    status: r.status === 'approved' ? 'Approved' : r.status === 'declined' ? 'Denied' : 'Pending',
  }));

  const fixed = [
    {
      id: 'n1',
      type: 'Documents',
      title: 'Employee handbook updated',
      text: 'Review the 2026 workplace policy changes.',
      time: 'Yesterday',
      status: 'Read',
    },
    {
      id: 'n2',
      type: 'Company',
      title: 'Company town hall',
      text: 'Monthly all-hands briefing and departmental updates.',
      time: 'This week',
      status: 'New',
    },
    {
      id: 'n3',
      type: 'Documents',
      title: 'Signature completed',
      text: 'Your document submission was filed successfully.',
      time: 'Recent',
      status: 'Read',
    },
  ];

  const all = [...requestItems, ...fixed];
  const visible = tab === 'All' ? all : all.filter((n) => n.type === tab);

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Requests, documents, and company updates in one organized inbox."
        icon={<Bell size={26} />}
        tabs={['All', 'Requests', 'Documents', 'Company']}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          <button
            className="btn-primary"
            style={{ background: 'white', color: 'var(--primary)', border: 'none' }}
            onClick={() => toast.success('Inbox Up to Date', 'All notifications marked as read.')}
          >
            <Check size={15} /> Mark all read
          </button>
        }
      />
      <main style={{ padding: '0 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 20 }}>
          <Card>
            <CardBody>
              <SectionHeading
                title={tab === 'All' ? 'Recent activity' : tab}
                description={`${visible.length} update${visible.length === 1 ? '' : 's'} in this view`}
              />
              <div className="col gap-10">
                {visible.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: 16,
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      background: n.status === 'New' ? 'var(--primary-tint)' : 'white',
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'white',
                        color:
                          n.type === 'Requests'
                            ? 'var(--primary)'
                            : n.type === 'Documents'
                            ? 'var(--warning)'
                            : 'var(--success)',
                        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                        flexShrink: 0,
                      }}
                    >
                      {n.type === 'Requests' ? (
                        <CalendarDays size={19} />
                      ) : n.type === 'Documents' ? (
                        <FileSignature size={19} />
                      ) : (
                        <Sparkles size={19} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row-between">
                        <strong className="text-sm text-1">{n.title}</strong>
                        <span className="text-xs text-5">{n.time}</span>
                      </div>
                      <p className="text-sm text-4 m-0" style={{ marginTop: 4 }}>
                        {n.text}
                      </p>
                      <div style={{ marginTop: 9 }}>
                        <StatusPill
                          tone={
                            n.status === 'Approved'
                              ? 'success'
                              : n.status === 'Denied'
                              ? 'error'
                              : n.status === 'New'
                              ? 'primary'
                              : 'neutral'
                          }
                        >
                          {n.status}
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
          <div className="col gap-20">
            <Card>
              <CardBody>
                <SectionHeading title="At a glance" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: 14, background: 'var(--bg-page)', borderRadius: 10 }}>
                    <strong style={{ fontSize: 24, color: 'var(--primary)' }}>{all.length}</strong>
                    <div className="text-xs text-4">Total updates</div>
                  </div>
                  <div style={{ padding: 14, background: 'var(--bg-page)', borderRadius: 10 }}>
                    <strong style={{ fontSize: 24, color: 'var(--warning)' }}>
                      {requestItems.filter((r) => r.status === 'Pending').length}
                    </strong>
                    <div className="text-xs text-4">Pending requests</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function Guide({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--primary)', flexShrink: 0 }}>{icon}</div>
      <div>
        <b className="text-sm">{title}</b>
        <div className="text-xs text-4">{text}</div>
      </div>
    </div>
  );
}
