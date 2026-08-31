"use client";

import React, { useState } from 'react';
import { Gift, Plus, Search, Heart, Shield, Coffee, Landmark, CheckCircle2, Users, DollarSign, Edit3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const BENEFITS = [
  { id: 1, name: 'Health Insurance', category: 'Health', description: 'Comprehensive medical, dental, and vision coverage.', enrolled: 108, eligible: 111, cost: '$450/mo', icon: <Heart size={22} />, color: '#FEF2F2', iconColor: '#EF4444' },
  { id: 2, name: '401(k) Retirement', category: 'Financial', description: 'Company matches up to 4% of salary contributions.', enrolled: 95, eligible: 111, cost: '4% match', icon: <Landmark size={22} />, color: '#F0FDF4', iconColor: '#22C55E' },
  { id: 3, name: 'Meal & Wellness Allowance', category: 'Wellness', description: '$200/month for meals and gym memberships.', enrolled: 82, eligible: 111, cost: '$200/mo', icon: <Coffee size={22} />, color: '#FFFBEB', iconColor: '#F59E0B' },
  { id: 4, name: 'Life Insurance', category: 'Health', description: '2x annual salary coverage, company-paid premium.', enrolled: 111, eligible: 111, cost: 'Company-paid', icon: <Shield size={22} />, color: '#EFF6FF', iconColor: '#3B82F6' },
];

export default function BenefitsPage() {
  const [activeTab, setActiveTab] = useState('Benefits');
  const [showModal, setShowModal] = useState(false);

  const totalEnrolled = BENEFITS.reduce((acc, b) => acc + b.enrolled, 0);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader
        title="Benefits"
        subtitle="Manage employee benefit plans, enrollment, and coverage details."
        icon={<Gift size={28} className="text-white" />}
        tabs={['Benefits', 'Enrollment', 'Reports']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }} onClick={() => setShowModal(true)}>
            <Plus size={16} style={{ marginRight: 8 }} /> Add Benefit
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
        <div className="col gap-32">
          <StatRibbon
            stats={[
              { label: 'Active Plans', value: BENEFITS.length, icon: <Gift size={18} />, color: 'var(--primary)' },
              { label: 'Total Enrolled', value: `${totalEnrolled}`, icon: <Users size={18} />, color: 'var(--success)' },
              { label: 'Monthly Cost / Employee', value: '~$650', icon: <DollarSign size={18} />, color: 'var(--warning)' },
            ]}
          />

          {activeTab === 'Benefits' && (
            <div className="grid-2 gap-24">
              {BENEFITS.map(b => {
                const pct = Math.round((b.enrolled / b.eligible) * 100);
                return (
                  <Card key={b.id} style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <CardBody className="p-28 col gap-20">
                      <div className="row-between align-start">
                        <div className="row gap-16 align-center">
                          <div style={{ width: 52, height: 52, borderRadius: 14, background: b.color, color: b.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {b.icon}
                          </div>
                          <div>
                            <h3 className="m-0 text-base fw-700 text-1">{b.name}</h3>
                            <Badge variant="neutral" style={{ marginTop: 4, fontSize: 11 }}>{b.category}</Badge>
                          </div>
                        </div>
                        <button className="btn-neutral" style={{ padding: '6px 8px', borderRadius: 6 }}><Edit3 size={14} /></button>
                      </div>

                      <p className="m-0 text-sm text-4" style={{ lineHeight: 1.6 }}>{b.description}</p>

                      <div className="col gap-8 pt-16" style={{ borderTop: '1px dashed var(--border)' }}>
                        <div className="row-between text-sm">
                          <span className="text-4 fw-600">Enrollment</span>
                          <span className="text-1 fw-700">{b.enrolled} / {b.eligible} ({pct}%)</span>
                        </div>
                        <div style={{ background: 'var(--border)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ background: b.iconColor, height: '100%', width: `${pct}%`, borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                        <div className="row-between text-sm">
                          <span className="text-4 fw-600">Cost</span>
                          <span className="text-1 fw-700">{b.cost}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'Enrollment' && (
            <div className="col gap-24 align-center justify-center" style={{ minHeight: 300 }}>
              <div className="p-32 text-center col gap-16" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 420 }}>
                <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)', width: 64, height: 64, margin: '0 auto' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="m-0 text-xl fw-700 text-1">Open Enrollment Management</h3>
                <p className="m-0 text-sm text-4">Launch open enrollment periods, send notifications, and track employee selections across all benefit plans.</p>
                <button className="btn-primary mt-8" style={{ padding: '12px 24px', borderRadius: 8 }}>Start Enrollment Period</button>
              </div>
            </div>
          )}

          {activeTab === 'Reports' && (
            <div className="col gap-24 align-center justify-center" style={{ minHeight: 300 }}>
              <div className="p-32 text-center col gap-16" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 420 }}>
                <div className="icon-chip" style={{ background: 'var(--success-tint)', color: 'var(--success)', width: 64, height: 64, margin: '0 auto' }}>
                  <DollarSign size={32} />
                </div>
                <h3 className="m-0 text-xl fw-700 text-1">Benefits Cost Reports</h3>
                <p className="m-0 text-sm text-4">Analyze total benefits expenditure, per-employee costs, and year-over-year trends.</p>
                <button className="btn-primary mt-8" style={{ padding: '12px 24px', borderRadius: 8 }}>Generate Report</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Benefit Plan" subtitle="Create a new benefit offering for your employees.">
        <div className="col gap-24 p-32">
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Plan Name</label>
            <Input type="text" placeholder="e.g. Dental & Vision Plan" />
          </div>
          <div className="grid-2 gap-16">
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Category</label>
              <Select>
                <option>Health</option>
                <option>Financial</option>
                <option>Wellness</option>
                <option>Education</option>
                <option>Other</option>
              </Select>
            </div>
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Cost Per Employee</label>
              <Input type="text" placeholder="e.g. $200/mo or 3% match" leftIcon={<DollarSign size={16} />} />
            </div>
          </div>
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Who is Eligible?</label>
            <Select>
              <option>All Full-Time Employees</option>
              <option>Full-Time & Part-Time</option>
              <option>Executives Only</option>
              <option>Custom Group</option>
            </Select>
          </div>
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Description</label>
            <Textarea placeholder="Describe what this benefit covers..." style={{ minHeight: 90 }} />
          </div>
          <div className="row-end gap-12 pt-8 border-t border-border">
            <button className="btn-neutral" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary row gap-8" onClick={() => setShowModal(false)}>
              <Plus size={16} /> Create Plan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
