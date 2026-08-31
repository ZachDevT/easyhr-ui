"use client";

import React, { useState } from 'react';
import { CalendarRange, Plus, Search, Sun, Globe, Plane, ChevronRight, Edit3, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const HOLIDAYS = [
  { id: 1, name: "New Year's Day", date: 'Jan 01, 2026', day: 'Thursday', type: 'National', applies: 'All Employees' },
  { id: 2, name: 'Labor Day', date: 'May 01, 2026', day: 'Friday', type: 'National', applies: 'All Employees' },
  { id: 3, name: 'Company Foundation Day', date: 'Jun 15, 2026', day: 'Monday', type: 'Company', applies: 'All Employees' },
  { id: 4, name: 'Independence Day', date: 'Jul 04, 2026', day: 'Saturday', type: 'National', applies: 'All Employees' },
  { id: 5, name: 'Team Building Day', date: 'Aug 10, 2026', day: 'Monday', type: 'Company', applies: 'All Employees' },
  { id: 6, name: 'National Day', date: 'Sep 12, 2026', day: 'Saturday', type: 'National', applies: 'All Employees' },
  { id: 7, name: 'Moi Day', date: 'Oct 10, 2026', day: 'Saturday', type: 'National', applies: 'All Employees' },
  { id: 8, name: 'Thanksgiving Day', date: 'Nov 26, 2026', day: 'Thursday', type: 'National', applies: 'US Employees' },
  { id: 9, name: 'Christmas Day', date: 'Dec 25, 2026', day: 'Friday', type: 'National', applies: 'All Employees' },
  { id: 10, name: 'Year-End Close', date: 'Dec 31, 2026', day: 'Thursday', type: 'Company', applies: 'All Employees' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HolidaysPage() {
  const [activeTab, setActiveTab] = useState('Calendar');
  const [showModal, setShowModal] = useState(false);

  const nationalCount = HOLIDAYS.filter(h => h.type === 'National').length;
  const companyCount = HOLIDAYS.filter(h => h.type === 'Company').length;

  // Group by month for calendar view
  const byMonth: Record<string, typeof HOLIDAYS> = {};
  HOLIDAYS.forEach(h => {
    const monthKey = h.date.split(' ')[0];
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(h);
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader
        title="Company Holidays"
        subtitle="Manage public holidays, company days off, and regional observances."
        icon={<CalendarRange size={28} className="text-white" />}
        tabs={['Calendar', 'List', 'Regions']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }} onClick={() => setShowModal(true)}>
            <Plus size={16} style={{ marginRight: 8 }} /> Add Holiday
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
        <div className="col gap-32">
          <StatRibbon
            stats={[
              { label: 'Total Holidays', value: HOLIDAYS.length, icon: <CalendarRange size={18} />, color: 'var(--primary)', description: 'Calendar year 2026' },
              { label: 'Public / National', value: nationalCount, icon: <Globe size={18} />, color: 'var(--success)', trend: 'Meets statutory minimum', trendType: 'positive', description: 'Government-mandated days' },
              { label: 'Company Days', value: companyCount, icon: <Sun size={18} />, color: 'var(--warning)', trend: 'Same as 2025', trendType: 'neutral', description: 'Internal observances' },
            ]}
          />

          {activeTab === 'Calendar' && (
            <div className="col gap-24">
              {MONTHS.filter(m => byMonth[m]).map(month => (
                <div key={month}>
                  <div className="text-sm fw-800 text-4 uppercase tracking-wider mb-12">{month} 2026</div>
                  <div className="col gap-8">
                    {byMonth[month].map(h => (
                      <Card key={h.id} style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                        <CardBody style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div style={{
                            width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                            background: h.type === 'National' ? 'var(--primary-tint)' : '#FEF3C7',
                            color: h.type === 'National' ? 'var(--primary)' : '#92400E',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <span className="text-xs fw-700">{h.date.split(' ')[1]?.replace(',', '')}</span>
                            <span className="text-xs fw-500">{h.day.slice(0, 3)}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="m-0 text-base fw-700 text-1">{h.name}</h3>
                            <span className="text-sm text-5">{h.applies}</span>
                          </div>
                          <Badge variant={h.type === 'National' ? 'primary' : 'warning'}>{h.type}</Badge>
                          <div className="row gap-8">
                            <button className="btn-neutral" style={{ padding: '6px 8px', borderRadius: 6 }}><Edit3 size={14} /></button>
                            <button className="btn-neutral" style={{ padding: '6px 8px', borderRadius: 6, color: 'var(--error)' }}><Trash2 size={14} /></button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'List' && (
            <Card style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <CardBody style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                    <tr style={{ color: 'var(--text-4)', fontSize: 12, textTransform: 'uppercase' }}>
                      <th style={{ padding: '14px 24px', fontWeight: 700 }}>Holiday</th>
                      <th style={{ padding: '14px 24px', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '14px 24px', fontWeight: 700 }}>Day</th>
                      <th style={{ padding: '14px 24px', fontWeight: 700 }}>Type</th>
                      <th style={{ padding: '14px 24px', fontWeight: 700 }}>Applies To</th>
                      <th style={{ padding: '14px 24px', width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {HOLIDAYS.map((h, idx) => (
                      <tr key={h.id} style={{ borderBottom: idx === HOLIDAYS.length - 1 ? 'none' : '1px solid var(--border)', background: 'white' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{h.name}</td>
                        <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-3)' }}>{h.date}</td>
                        <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-4)' }}>{h.day}</td>
                        <td style={{ padding: '16px 24px' }}><Badge variant={h.type === 'National' ? 'primary' : 'warning'}>{h.type}</Badge></td>
                        <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-4)' }}>{h.applies}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <button className="btn-neutral" style={{ padding: '4px 8px', fontSize: 12 }}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          {activeTab === 'Regions' && (
            <div className="col gap-24 align-center justify-center" style={{ minHeight: 300 }}>
              <div className="p-32 text-center col gap-16" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 420 }}>
                <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)', width: 64, height: 64, margin: '0 auto' }}>
                  <Globe size={32} />
                </div>
                <h3 className="m-0 text-xl fw-700 text-1">Region-Based Schedules</h3>
                <p className="m-0 text-sm text-4">Assign different holiday calendars to employees based on their country or office location. Coming in the next release.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Holiday" subtitle="Add a public or company-specific day off.">
        <div className="col gap-24 p-32">
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Holiday Name</label>
            <Input type="text" placeholder="e.g. Company Foundation Day" />
          </div>
          <div className="grid-2 gap-16">
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Date</label>
              <Input type="date" leftIcon={<CalendarRange size={16} />} />
            </div>
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Holiday Type</label>
              <Select>
                <option>National / Public</option>
                <option>Company Day</option>
                <option>Regional</option>
                <option>Optional / Floating</option>
              </Select>
            </div>
          </div>
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Applies To</label>
            <Select>
              <option>All Employees</option>
              <option>US Employees Only</option>
              <option>EU Employees Only</option>
              <option>Custom Group</option>
            </Select>
          </div>
          <div className="col gap-8">
            <label className="text-sm fw-600 text-2">Recurrence</label>
            <Select>
              <option>One-time (This year only)</option>
              <option>Annual (Repeats every year)</option>
            </Select>
          </div>
          <div className="row-end gap-12 pt-8 border-t border-border">
            <button className="btn-neutral" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary row gap-8" onClick={() => setShowModal(false)}>
              <Plus size={16} /> Add Holiday
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
