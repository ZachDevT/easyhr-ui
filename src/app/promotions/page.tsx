"use client";

import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus, Search, ArrowRight, Calendar, CheckCircle2, Clock, DollarSign, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ROLES, LEVEL_ORDER, LEVEL_COLOR, type Role } from '@/data/roles';

// ─── Promotion Records ────────────────────────────────────────────────────────
const PROMOTIONS = [
  {
    id: 1,
    employee: 'Alex Johnson',
    avatar: true,
    fromRoleId: 2,   // Frontend Developer
    toRoleId: 4,     // Frontend Team Lead
    effectiveDate: 'Oct 01, 2026',
    salaryIncrease: 18,
    status: 'Approved',
    approvedBy: 'Sarah Johnson',
    notes: 'Alex consistently exceeded targets for three consecutive quarters.',
  },
  {
    id: 2,
    employee: 'Maria Garcia',
    avatar: true,
    fromRoleId: 10,  // QA Tester
    toRoleId: 11,    // Senior QA Engineer
    effectiveDate: 'Oct 15, 2026',
    salaryIncrease: 12,
    status: 'Pending',
    approvedBy: null,
    notes: 'Demonstrated exceptional test coverage and mentorship of junior members.',
  },
  {
    id: 3,
    employee: 'Wei Chen',
    avatar: true,
    fromRoleId: 21,  // Marketing Specialist
    toRoleId: 23,    // Marketing Manager
    effectiveDate: 'Sep 01, 2026',
    salaryIncrease: 22,
    status: 'Approved',
    approvedBy: 'David Kim',
    notes: 'Led the Q2 launch campaign that exceeded KPIs by 40%.',
  },
];

// ─── Level Badge ──────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: string }) {
  const colors = LEVEL_COLOR[level] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      background: colors.bg, color: colors.color,
    }}>
      {level}
    </span>
  );
}

// ─── Role Pill ────────────────────────────────────────────────────────────────
function RolePill({ role, variant = 'default' }: { role: Role; variant?: 'default' | 'from' | 'to' }) {
  const bg   = variant === 'from' ? '#F9FAFB' : variant === 'to' ? 'var(--success-tint, #F0FDF4)' : 'white';
  const border = variant === 'from' ? 'var(--border)' : variant === 'to' ? 'rgba(34,197,94,0.3)' : 'var(--border)';
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{role.title}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <LevelBadge level={role.level} />
        <span style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 500 }}>{role.department}</span>
      </div>
      <span style={{ fontSize: 11.5, color: 'var(--text-5)' }}>
        {role.currency} {role.min} – {role.max}
      </span>
    </div>
  );
}

// ─── Role Searchable Select ───────────────────────────────────────────────────
function RoleSelect({
  value, onChange, placeholder, excludeId,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  excludeId?: number;
}) {
  const options = ROLES
    .filter(r => r.id !== excludeId)
    .map(r => ({
      value: String(r.id),
      label: r.title,
      description: `${r.department} · ${r.level}`,
    }));

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search roles by title or department..."
      options={options}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // Modal state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [fromRoleId, setFromRoleId] = useState('');
  const [toRoleId, setToRoleId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [salaryIncrease, setSalaryIncrease] = useState('');
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedEmployee('');
      setFromRoleId('');
      setToRoleId('');
      setEffectiveDate('');
      setSalaryIncrease('');
      setNotes('');
    }, 300);
  };

  // Derived — enriched promotions
  const enriched = PROMOTIONS.map(p => ({
    ...p,
    fromRole: ROLES.find(r => r.id === p.fromRoleId)!,
    toRole:   ROLES.find(r => r.id === p.toRoleId)!,
  }));

  const filtered = activeTab === 'All'
    ? enriched
    : enriched.filter(p => p.status === activeTab);

  // Preview roles in modal
  const previewFrom = fromRoleId ? ROLES.find(r => r.id === Number(fromRoleId)) : null;
  const previewTo   = toRoleId   ? ROLES.find(r => r.id === Number(toRoleId))   : null;
  const isUpward    = previewFrom && previewTo
    ? LEVEL_ORDER[previewTo.level] > LEVEL_ORDER[previewFrom.level]
    : null;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader
        title="Promotions"
        subtitle="Track career progressions using defined roles from your org structure."
        icon={<TrendingUp size={28} className="text-white" />}
        tabs={['All', 'Pending', 'Approved']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            className="btn-secondary"
            style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} style={{ marginRight: 8 }} /> New Promotion
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
        <div className="col gap-32">

          <StatRibbon stats={[
            { label: 'Promotions YTD',    value: PROMOTIONS.length,                                      icon: <TrendingUp size={18} />,  color: 'var(--primary)', trend: '+1 vs last year', trendType: 'positive', description: 'Year to date' },
            { label: 'Pending Approval',  value: PROMOTIONS.filter(p => p.status === 'Pending').length,  icon: <Clock size={18} />,       color: 'var(--warning)', description: 'Awaiting manager sign-off' },
            { label: 'Avg Salary Bump',   value: `${Math.round(PROMOTIONS.reduce((a,p) => a + p.salaryIncrease, 0) / PROMOTIONS.length)}%`, icon: <DollarSign size={18} />, color: 'var(--success)', trend: '+2% vs last cycle', trendType: 'positive', description: 'Across promoted staff' },
          ]} />

          {/* Header row */}
          <div className="row-between align-center">
            <div className="col gap-4">
              <h2 className="text-xl fw-800 text-1 m-0">Promotion Records</h2>
              <span className="text-sm text-4 fw-500">{filtered.length} records</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '0 16px', height: 40, gap: 10, width: 260, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <Search size={15} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
              <input type="text" placeholder="Search promotions..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text-1)', fontFamily: 'inherit' }} />
            </div>
          </div>

          {/* Cards */}
          <div className="col gap-16">
            {filtered.map(p => {
              const levelUp = LEVEL_ORDER[p.toRole.level] - LEVEL_ORDER[p.fromRole.level];
              return (
                <Card key={p.id} style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} className="hover-lift">
                  <CardBody style={{ padding: '20px 28px', display: 'flex', gap: 24, alignItems: 'center' }}>

                    {/* Employee */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 200, flexShrink: 0 }}>
                      <Avatar name={p.employee} size="md" />
                      <div>
                        <div className="fw-700 text-1" style={{ fontSize: 14 }}>{p.employee}</div>
                        <div className="text-xs text-5 fw-600">{p.effectiveDate}</div>
                      </div>
                    </div>

                    {/* Role progression */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* From */}
                      <div className="col gap-4" style={{ flex: 1 }}>
                        <span className="text-xs fw-700 text-5 uppercase tracking-wider">From</span>
                        <div className="fw-700 text-1" style={{ fontSize: 13.5 }}>{p.fromRole.title}</div>
                        <LevelBadge level={p.fromRole.level} />
                        <span className="text-xs text-5">{p.fromRole.department}</span>
                      </div>

                      {/* Arrow */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: levelUp > 0 ? 'var(--success-tint)' : 'var(--warning-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowRight size={16} style={{ color: levelUp > 0 ? 'var(--success)' : 'var(--warning)' }} />
                        </div>
                        {levelUp > 0 && <span className="text-xs fw-700 text-success">+{levelUp} lvl</span>}
                      </div>

                      {/* To */}
                      <div className="col gap-4" style={{ flex: 1 }}>
                        <span className="text-xs fw-700 text-5 uppercase tracking-wider">To</span>
                        <div className="fw-700 text-success" style={{ fontSize: 13.5 }}>{p.toRole.title}</div>
                        <LevelBadge level={p.toRole.level} />
                        <span className="text-xs text-5">{p.toRole.department}</span>
                      </div>
                    </div>

                    {/* Salary bump */}
                    <div style={{ textAlign: 'center', borderLeft: '1px dashed var(--border)', paddingLeft: 24, flexShrink: 0 }}>
                      <div className="text-2xl fw-800 text-success">+{p.salaryIncrease}%</div>
                      <div className="text-xs text-5 fw-600 mt-4">Salary Increase</div>
                    </div>

                    {/* Status */}
                    <div className="col gap-8 align-end" style={{ flexShrink: 0 }}>
                      <Badge variant={p.status === 'Approved' ? 'success' : 'warning'}>{p.status}</Badge>
                      {p.approvedBy && <span className="text-xs text-5">by {p.approvedBy}</span>}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={showModal} onClose={handleClose} title="New Promotion" subtitle="Select current and new role from your org's defined positions.">
        <div className="col gap-24 p-32">

          {/* Employee */}
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Employee <span className="text-error">*</span></label>
            <SearchableSelect
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="Select an employee..."
              searchPlaceholder="Search by name or department..."
              options={[
                { value: 'alex',    label: 'Alex Johnson',  description: 'Engineering',  avatar: true },
                { value: 'maria',   label: 'Maria Garcia',  description: 'Engineering',  avatar: true },
                { value: 'wei',     label: 'Wei Chen',      description: 'Marketing',    avatar: true },
                { value: 'jessica', label: 'Jessica Smith', description: 'HR',           avatar: true },
                { value: 'david',   label: 'David Kim',     description: 'Marketing',    avatar: true },
              ]}
            />
          </div>

          {/* Role Progression */}
          <div className="col gap-12">
            <label className="text-sm fw-600 text-2">Role Progression <span className="text-error">*</span></label>

            {/* Live preview of selected roles */}
            {(previewFrom || previewTo) && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'var(--bg-page)', borderRadius: 12, border: '1px solid var(--border)' }}>
                {previewFrom ? (
                  <RolePill role={previewFrom} variant="from" />
                ) : (
                  <div style={{ flex: 1, height: 72, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-xs text-5">Current role</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isUpward === true ? 'var(--success-tint)' : isUpward === false ? 'var(--error-tint)' : '#F3F4F6',
                  }}>
                    <ArrowRight size={14} style={{ color: isUpward === true ? 'var(--success)' : isUpward === false ? 'var(--error)' : 'var(--text-4)' }} />
                  </div>
                  {isUpward !== null && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: isUpward ? 'var(--success)' : 'var(--error)' }}>
                      {isUpward ? '▲ Promotion' : '▼ Lateral'}
                    </span>
                  )}
                </div>

                {previewTo ? (
                  <RolePill role={previewTo} variant="to" />
                ) : (
                  <div style={{ flex: 1, height: 72, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-xs text-5">New role</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid-2 gap-12">
              <div className="col gap-6">
                <span className="text-xs fw-700 text-4 uppercase tracking-wider">Current Role</span>
                <RoleSelect
                  value={fromRoleId}
                  onChange={setFromRoleId}
                  placeholder="Select current role..."
                  excludeId={Number(toRoleId)}
                />
              </div>
              <div className="col gap-6">
                <span className="text-xs fw-700 text-4 uppercase tracking-wider">New Role</span>
                <RoleSelect
                  value={toRoleId}
                  onChange={setToRoleId}
                  placeholder="Select new role..."
                  excludeId={Number(fromRoleId)}
                />
              </div>
            </div>
          </div>

          {/* Date + Salary */}
          <div className="grid-2 gap-16">
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Effective Date</label>
              <Input type="date" leftIcon={<Calendar size={16} />} value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
            </div>
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Salary Increase (%)</label>
              <Input
                type="number"
                placeholder="e.g. 15"
                rightIcon={<span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-4)' }}>%</span>}
                value={salaryIncrease}
                onChange={e => setSalaryIncrease(e.target.value)}
              />
            </div>
          </div>

          {/* Rationale */}
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Promotion Rationale</label>
            <Textarea
              placeholder="Explain the reasons for this promotion — achievements, impact, readiness..."
              style={{ minHeight: 100 }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="row-end gap-12 pt-8 border-t border-border">
            <button className="btn-neutral" onClick={handleClose}>Cancel</button>
            <button className="btn-primary row gap-8" onClick={handleClose}>
              <CheckCircle2 size={16} /> Submit for Approval
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
