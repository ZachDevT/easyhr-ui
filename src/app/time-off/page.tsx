"use client";

import { useState } from 'react';
import { CalendarDays, Plane, Plus, Search, CalendarHeart, Palmtree, UserPlus, Clock, ChevronRight, Settings, CheckCircle, Clock as ClockIcon, Ban } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useRole } from '@/context/RoleContext';
import { timeOffBalances } from '@/data/timeOff';
import { PageHeader } from '@/components/layout/PageHeader';

export default function TimeOffPage() {
  const { currentUser } = useRole();

  const historyData = [
    { id: 1, type: 'Vacation', start: 'Oct 12, 2026', end: 'Oct 16, 2026', hours: 40, status: 'Approved' },
    { id: 2, type: 'Sick', start: 'Nov 5, 2026', end: 'Nov 5, 2026', hours: 4, status: 'Pending' },
    { id: 3, type: 'Vacation', start: 'Jul 1, 2026', end: 'Jul 3, 2026', hours: 24, status: 'Approved' },
    { id: 4, type: 'Personal', start: 'May 10, 2026', end: 'May 10, 2026', hours: 8, status: 'Denied' },
  ];

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-page)', padding: 0 }}>
      
      {/* Header */}
      <PageHeader 
        title="Time Off Dashboard"
        icon={<Palmtree size={28} className="text-white" />}
        actions={
          <button className="btn-secondary" style={{ background: 'white' }}>
            <CalendarDays size={14} /> Team Calendar
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start', padding: 32 }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Balances Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {timeOffBalances.map((balance, idx) => (
              <Card key={idx} style={{ padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none', background: 'white' }}>
                <div className="row-between mb-16">
                  <div className="row gap-12">
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 8, 
                      background: balance.type === 'Vacation' ? 'var(--primary-tint)' : balance.type === 'Sick' ? 'var(--warning-tint)' : 'var(--success-tint)', 
                      color: balance.type === 'Vacation' ? 'var(--primary)' : balance.type === 'Sick' ? '#F59E0B' : 'var(--success)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      {balance.type === 'Vacation' ? <Palmtree size={20} /> : 
                       balance.type === 'Sick' ? <CalendarHeart size={20} /> : 
                       <ClockIcon size={20} />}
                    </div>
                    <span className="text-sm fw-700 text-1">{balance.type}</span>
                  </div>
                </div>
                
                <div className="row gap-8 align-end mb-12">
                  <div className="text-3xl fw-800 text-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{balance.hoursAvailable}</div>
                  <div className="text-xs fw-600 text-5 mb-4">Hours</div>
                </div>
                
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ 
                    height: '100%', 
                    background: balance.type === 'Vacation' ? 'var(--gradient)' : balance.type === 'Sick' ? 'var(--warning)' : 'var(--success)', 
                    width: `${(balance.hoursAvailable / (balance.hoursAvailable + balance.hoursUsed)) * 100}%` 
                  }} />
                </div>
                
                <div className="text-xs text-5">
                  {balance.hoursUsed}h used this year
                </div>
              </Card>
            ))}
          </div>

          {/* Time Off History Table */}
          <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none', background: 'white' }}>
            <div className="row-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
              <div className="row gap-12">
                <CalendarDays size={20} className="text-primary" />
                <h2 className="text-lg fw-700 text-1 m-0">Time Off History</h2>
              </div>
              <button className="btn-secondary btn-sm" style={{ background: 'white' }}>
                <Settings size={14} />
              </button>
            </div>
            
            <CardBody style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: '#F9FAFB', color: 'var(--text-4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '16px 32px', fontWeight: 700 }}>Type</th>
                      <th style={{ padding: '16px 32px', fontWeight: 700 }}>Dates</th>
                      <th style={{ padding: '16px 32px', fontWeight: 700 }}>Hours</th>
                      <th style={{ padding: '16px 32px', fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((req, idx) => (
                      <tr key={req.id} style={{ borderBottom: idx === historyData.length - 1 ? 'none' : '1px solid var(--border)' }}>
                        <td style={{ padding: '20px 32px' }}>
                          <div className="row gap-12">
                            <div style={{ 
                              width: 32, height: 32, borderRadius: 6, 
                              background: req.type === 'Vacation' ? 'var(--primary-tint)' : req.type === 'Sick' ? 'var(--warning-tint)' : 'var(--success-tint)', 
                              color: req.type === 'Vacation' ? 'var(--primary)' : req.type === 'Sick' ? '#F59E0B' : 'var(--success)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center' 
                            }}>
                              {req.type === 'Vacation' ? <Palmtree size={16} /> : 
                               req.type === 'Sick' ? <CalendarHeart size={16} /> : 
                               <ClockIcon size={16} />}
                            </div>
                            <span className="text-sm fw-700 text-1">{req.type}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 32px' }}>
                          <div className="text-sm text-1 fw-600">{req.start} {req.start !== req.end ? `- ${req.end}` : ''}</div>
                        </td>
                        <td style={{ padding: '20px 32px' }}>
                          <div className="text-sm fw-800 text-1">-{req.hours}h</div>
                        </td>
                        <td style={{ padding: '20px 32px' }}>
                          {req.status === 'Approved' && <Badge variant="success" className="row gap-4"><CheckCircle size={12}/> Approved</Badge>}
                          {req.status === 'Pending' && <Badge variant="warning" className="row gap-4"><ClockIcon size={12}/> Pending</Badge>}
                          {req.status === 'Denied' && <Badge variant="danger" className="row gap-4"><Ban size={12}/> Denied</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
          
          {/* Company Holidays */}
          <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none', background: 'white' }}>
            <div className="row-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
              <div className="row gap-12">
                <Palmtree size={20} className="text-primary" />
                <h2 className="text-lg fw-700 text-1 m-0">Upcoming Holidays</h2>
              </div>
            </div>
            <CardBody style={{ padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 32 }}>
                {[
                  { name: 'Moi Day', date: 'Oct 10, 2026', mon: 'OCT', d: '10' },
                  { name: 'Jamhuri Day', date: 'Dec 12, 2026', mon: 'DEC', d: '12' },
                ].map((holiday, idx) => (
                  <div key={idx} className="row gap-16 p-16" style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'white', color: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <span className="text-xs fw-700">{holiday.mon}</span>
                      <span className="text-base fw-800">{holiday.d}</span>
                    </div>
                    <div>
                      <div className="text-sm fw-700 text-1">{holiday.name}</div>
                      <Badge variant="neutral" style={{ marginTop: 8 }}>Paid Holiday</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

        </div>

        {/* RIGHT COLUMN: Request Time Off Widget */}
        <div>
          <Card style={{ position: 'sticky', top: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid var(--primary-tint)' }}>
            <div style={{ background: 'var(--gradient)', padding: '24px', borderTopLeftRadius: 12, borderTopRightRadius: 12, color: 'white' }}>
              <div className="row gap-12 mb-8">
                <Plane size={24} />
                <h2 className="text-xl fw-800 m-0" style={{ color: 'white' }}>Request Time Off</h2>
              </div>
              <p className="text-sm" style={{ opacity: 0.9 }}>Submit your request to {currentUser.manager || 'your manager'}.</p>
            </div>
            
            <CardBody style={{ padding: 32 }}>
              <div className="mb-24">
                <label className="text-xs fw-700 text-5 mb-8 block uppercase tracking-wider">Leave Type <span className="text-error">*</span></label>
                <Select style={{ height: 48, fontSize: 15 }}>
                  {timeOffBalances.map((b) => <option key={b.type}>{b.type} (Available: {b.hoursAvailable}h)</option>)}
                </Select>
              </div>
              
              <div className="grid-2 gap-16 mb-24">
                <div>
                  <label className="text-xs fw-700 text-5 mb-8 block uppercase tracking-wider">Start Date <span className="text-error">*</span></label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="text-xs fw-700 text-5 mb-8 block uppercase tracking-wider">End Date <span className="text-error">*</span></label>
                  <Input type="date" />
                </div>
              </div>
              
              <div className="mb-24">
                <label className="text-xs fw-700 text-5 mb-8 block uppercase tracking-wider">Total Hours <span className="text-error">*</span></label>
                <Input type="number" placeholder="0" rightIcon={<span style={{ fontWeight: 600 }}>hrs</span>} />
              </div>
              
              <div className="mb-32">
                <label className="text-xs fw-700 text-5 mb-8 block uppercase tracking-wider">Note to Manager</label>
                <Textarea rows={4} placeholder="I will be away for..." style={{ resize: 'none' }} />
              </div>

              <button 
                style={{ 
                  background: 'var(--primary)', 
                  color: 'white', 
                  width: '100%', 
                  height: 54, 
                  borderRadius: 8, 
                  border: 'none', 
                  fontSize: 16, 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(100, 50, 200, 0.2)'
                }}
              >
                <Plane size={18} /> Submit Request
              </button>
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}
