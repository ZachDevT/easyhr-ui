"use client";

import React, { useState } from 'react';
import { Star, Plus, Search, Target, TrendingUp, CheckSquare, Clock, ChevronRight, BarChart2, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const REVIEWS = [
  { id: 1, employee: 'Alex Johnson', dept: 'Engineering', cycle: 'Q3 2026', status: 'Completed', score: 4.8, dueDate: 'Sep 30, 2026', reviewer: 'Sarah Johnson' },
  { id: 2, employee: 'Maria Garcia', dept: 'Engineering', cycle: 'Q3 2026', status: 'In Progress', score: null, dueDate: 'Oct 05, 2026', reviewer: 'Sarah Johnson' },
  { id: 3, employee: 'Wei Chen', dept: 'Marketing', cycle: 'Q3 2026', status: 'Not Started', score: null, dueDate: 'Oct 10, 2026', reviewer: 'David Kim' },
  { id: 4, employee: 'Jessica Smith', dept: 'HR', cycle: 'Q3 2026', status: 'Completed', score: 4.5, dueDate: 'Sep 28, 2026', reviewer: 'Kevin Hart' },
];

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="row gap-2 align-center">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} style={{ fill: i <= Math.round(score) ? '#F59E0B' : 'transparent', color: i <= Math.round(score) ? '#F59E0B' : 'var(--border)' }} />
      ))}
      <span className="text-sm fw-700 text-1 ml-6">{score.toFixed(1)}</span>
    </div>
  );
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState('Reviews');
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const completed = REVIEWS.filter(r => r.status === 'Completed').length;
  const inProgress = REVIEWS.filter(r => r.status === 'In Progress').length;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader
        title="Performance"
        subtitle="Manage review cycles, track goals, and collect structured feedback."
        icon={<Star size={28} className="text-white" />}
        tabs={['Reviews', 'Goals', 'Cycles']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }} onClick={() => setShowModal(true)}>
            <Plus size={16} style={{ marginRight: 8 }} /> New Review
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
        <div className="col gap-32">

          <StatRibbon
            stats={[
              { label: 'Total Reviews', value: REVIEWS.length, icon: <Star size={18} />, color: 'var(--primary)', description: 'Q3 2026 cycle' },
              { label: 'Completed', value: completed, icon: <CheckSquare size={18} />, color: 'var(--success)', trend: `${Math.round((completed / REVIEWS.length) * 100)}% completion rate`, trendType: 'positive', description: 'Submitted & scored' },
              { label: 'In Progress', value: inProgress, icon: <Clock size={18} />, color: 'var(--warning)', trend: 'Due this week', trendType: 'neutral', description: 'Awaiting submission' },
            ]}
          />

          {activeTab === 'Reviews' && (
            <>
              <div className="row-between align-center">
                <div className="col gap-4">
                  <h2 className="text-xl fw-800 text-1 m-0">Review Tracker</h2>
                  <span className="text-sm text-4 fw-500">Q3 2026 Cycle • {REVIEWS.length} employees</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '0 16px', height: 40, gap: 10, width: 260, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <Search size={15} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                  <input type="text" placeholder="Search reviews..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text-1)', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div className="col gap-12">
                {REVIEWS.map(r => (
                  <Card key={r.id} style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', cursor: 'pointer' }} className="hover-lift">
                    <CardBody style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
                      <Avatar name={r.employee} size="md" />
                      <div className="col gap-4 flex-1">
                        <h3 className="m-0 text-base fw-700 text-1">{r.employee}</h3>
                        <span className="text-sm text-5">{r.dept} · Reviewer: {r.reviewer}</span>
                      </div>
                      <div className="col gap-4 align-end">
                        {r.score !== null ? <ScoreStars score={r.score} /> : <span className="text-sm text-5">Not rated yet</span>}
                        <span className="text-xs text-5">Due {r.dueDate}</span>
                      </div>
                      <Badge variant={r.status === 'Completed' ? 'success' : r.status === 'In Progress' ? 'warning' : 'neutral'}>
                        {r.status}
                      </Badge>
                      <ChevronRight size={16} className="text-4" />
                    </CardBody>
                  </Card>
                ))}
              </div>
            </>
          )}

          {activeTab === 'Goals' && (
            <div className="col gap-24 align-center justify-center" style={{ minHeight: 300 }}>
              <div className="p-32 text-center col gap-16" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 420 }}>
                <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)', width: 64, height: 64, margin: '0 auto' }}>
                  <Target size={32} />
                </div>
                <h3 className="m-0 text-xl fw-700 text-1">OKR & Goals Tracking</h3>
                <p className="m-0 text-sm text-4">Set company, team, and individual objectives. Track progress with key results linked to performance cycles.</p>
                <button className="btn-primary mt-8" style={{ padding: '12px 24px', borderRadius: 8 }}>Set Up Goals</button>
              </div>
            </div>
          )}

          {activeTab === 'Cycles' && (
            <div className="grid-3 gap-24">
              {['Q1 2026', 'Q2 2026', 'Q3 2026'].map((cycle, i) => (
                <Card key={cycle} style={{ borderRadius: 16, border: '1px solid var(--border)' }}>
                  <CardBody className="p-24 col gap-16">
                    <div className="row-between align-start">
                      <div className="col gap-4">
                        <h3 className="m-0 text-lg fw-700 text-1">{cycle}</h3>
                        <Badge variant={i === 2 ? 'warning' : 'success'}>{i === 2 ? 'Active' : 'Closed'}</Badge>
                      </div>
                      <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                        <BarChart2 size={18} />
                      </div>
                    </div>
                    <div className="col gap-8 pt-12" style={{ borderTop: '1px dashed var(--border)' }}>
                      <div className="row-between text-sm">
                        <span className="text-4 fw-600">Reviews</span>
                        <span className="text-1 fw-700">{i === 2 ? '4 / 8' : '8 / 8'}</span>
                      </div>
                      <div className="row-between text-sm">
                        <span className="text-4 fw-600">Avg Score</span>
                        <span className="text-1 fw-700">{i === 2 ? '—' : (4.2 + i * 0.2).toFixed(1)}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Performance Review" subtitle="Start a structured review for an employee.">
        <div className="col gap-24 p-32">
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Employee</label>
            <SearchableSelect value={selectedEmployee} onChange={setSelectedEmployee} placeholder="Select employee..." searchPlaceholder="Search by name..." options={[
              { value: 'alex', label: 'Alex Johnson', description: 'Engineering', avatar: true },
              { value: 'maria', label: 'Maria Garcia', description: 'Engineering', avatar: true },
              { value: 'wei', label: 'Wei Chen', description: 'Marketing', avatar: true },
            ]} />
          </div>
          <div className="grid-2 gap-16">
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Review Cycle</label>
              <Select>
                <option>Q3 2026</option>
                <option>Q4 2026</option>
                <option>Annual 2026</option>
              </Select>
            </div>
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Due Date</label>
              <Input type="date" leftIcon={<Clock size={16} />} />
            </div>
          </div>
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Review Type</label>
            <Select>
              <option>Manager Review</option>
              <option>Self Assessment</option>
              <option>Peer Review (360°)</option>
              <option>Probation Review</option>
            </Select>
          </div>
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Initial Notes</label>
            <Textarea placeholder="Add any context for this review cycle..." style={{ minHeight: 90 }} />
          </div>
          <div className="row-end gap-12 pt-8 border-t border-border">
            <button className="btn-neutral" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary row gap-8" onClick={() => setShowModal(false)}>
              <MessageSquare size={16} /> Start Review
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
