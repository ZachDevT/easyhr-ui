"use client";

import { useState } from 'react';
import { Clock, Calendar, ChevronLeft, ChevronRight, Plus, Download, Filter, FileText, ChevronDown, ChevronUp, History, PlaySquare, Settings, CheckCircle } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { useRole } from '@/context/RoleContext';
import { CompulsoryMyTimeWidget } from '@/components/widgets';
import { PageHeader } from '@/components/layout/PageHeader';

export default function TimeTrackingPage() {
  const { currentUser } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('Sep 23 - Sep 29, 2026');
  
  // State for expanded timesheet rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (day: string) => {
    setExpandedRows(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const timesheetData = [
    { day: 'Mon', date: 'Sep 23', hrs: '8h 00m', time: '9:00 AM - 5:00 PM', status: 'approved', details: [
      { project: 'Production', hrs: '4h 00m', time: '9:00 AM - 1:00 PM' },
      { project: 'Lunch', hrs: '0h 30m', time: '1:00 PM - 1:30 PM' },
      { project: 'Production', hrs: '3h 30m', time: '1:30 PM - 5:00 PM' },
    ]},
    { day: 'Tue', date: 'Sep 24', hrs: '8h 00m', time: '9:00 AM - 5:00 PM', status: 'approved', details: [
      { project: 'Production', hrs: '3h 00m', time: '9:00 AM - 12:00 PM' },
      { project: 'Meeting', hrs: '1h 00m', time: '12:00 PM - 1:00 PM' },
      { project: 'Lunch', hrs: '0h 30m', time: '1:00 PM - 1:30 PM' },
      { project: 'Production', hrs: '3h 30m', time: '1:30 PM - 5:00 PM' },
    ]},
    { day: 'Wed', date: 'Sep 25', hrs: '8h 00m', time: '9:00 AM - 5:00 PM', status: 'pending', details: [] },
    { day: 'Thu', date: 'Sep 26', hrs: '0h 00m', time: '--', status: 'none', details: [] },
    { day: 'Fri', date: 'Sep 27', hrs: '0h 00m', time: '--', status: 'none', details: [] },
  ];

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-page)', padding: 0 }}>
      
      {/* Header */}
      <PageHeader 
        title="Time Tracking"
        icon={<Clock size={28} className="text-white" />}
        actions={
          <>
            <button className="btn-secondary" style={{ background: 'white' }}>
              <Download size={14} /> Export
            </button>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Add Time Entry
            </button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start', padding: 32 }}>
        
        {/* LEFT COLUMN: Summary Cards + Timesheet List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Bamboo Style Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Card style={{ padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none' }}>
              <div className="row-between mb-8">
                <span className="text-sm fw-600 text-2">This Week</span>
                <Clock size={16} className="text-primary" />
              </div>
              <div className="text-2xl fw-700 text-1 mb-12">24h 00m</div>
              <div style={{ background: 'var(--border)', height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ background: 'var(--gradient)', height: '100%', width: '60%', borderRadius: 2 }} />
              </div>
              <div className="text-xs text-5">40h Target • 16h remaining</div>
            </Card>

            <Card style={{ padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none' }}>
              <div className="row-between mb-8">
                <span className="text-sm fw-600 text-2">Pay Period Total</span>
                <Calendar size={16} className="text-success" />
              </div>
              <div className="text-2xl fw-700 text-1 mb-12">104h 30m</div>
              <div style={{ background: 'var(--border)', height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ background: 'var(--success)', height: '100%', width: '65%', borderRadius: 2 }} />
              </div>
              <div className="text-xs text-5">Sep 15 - Sep 30 • 160h Target</div>
            </Card>

            <Card style={{ padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none' }}>
              <div className="row-between mb-8">
                <span className="text-sm fw-600 text-2">Overtime</span>
                <History size={16} className="text-warning" />
              </div>
              <div className="text-2xl fw-700 text-1 mb-12">0h 00m</div>
              <div style={{ background: 'var(--border)', height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ background: 'var(--warning)', height: '100%', width: '0%', borderRadius: 2 }} />
              </div>
              <div className="text-xs text-5">No overtime recorded</div>
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
                  <button className="btn-circle" style={{ width: 28, height: 28 }}><ChevronLeft size={16} /></button>
                  <span className="text-sm fw-600 text-1 px-8">{currentDate}</span>
                  <button className="btn-circle" style={{ width: 28, height: 28 }}><ChevronRight size={16} /></button>
                </div>
                <button className="btn-secondary btn-sm" style={{ background: 'white' }}>
                  <Settings size={14} />
                </button>
              </div>
            </div>

            <CardBody style={{ padding: 0 }}>
              {timesheetData.map((entry, idx, arr) => {
                const hasDetails = entry.details.length > 0;
                const isExpanded = expandedRows[entry.day];
                return (
                  <div key={entry.day} style={{ borderBottom: idx === arr.length -1 ? 'none' : '1px solid var(--border)' }}>
                    <div 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '120px 180px 1fr 100px', 
                        alignItems: 'center', 
                        padding: '24px 32px', 
                        cursor: hasDetails ? 'pointer' : 'default', 
                        background: isExpanded ? '#FAFAFA' : 'white',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => hasDetails && toggleRow(entry.day)}
                      onMouseEnter={(e) => { if(hasDetails && !isExpanded) e.currentTarget.style.background = '#F9FAFB'; }}
                      onMouseLeave={(e) => { if(hasDetails && !isExpanded) e.currentTarget.style.background = 'white'; }}
                    >
                      {/* Date Col */}
                      <div className="row gap-12">
                        <div style={{ 
                          width: 48, height: 48, 
                          borderRadius: 8, 
                          background: entry.hrs !== '0h 00m' ? 'var(--primary-tint)' : 'var(--bg-page)',
                          color: entry.hrs !== '0h 00m' ? 'var(--primary)' : 'var(--text-4)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <span className="text-sm fw-700">{entry.day}</span>
                        </div>
                        <div className="text-xs text-5 fw-600">{entry.date.split(' ')[1]}</div>
                      </div>

                      {/* Time Log Col */}
                      <div>
                        <div className="text-base fw-700 text-1">{entry.hrs}</div>
                        <div className="text-xs text-5 mt-4">{entry.time}</div>
                      </div>

                      {/* Status / Entries Badge Col */}
                      <div className="row gap-12 justify-start">
                        {entry.status === 'approved' && <Badge variant="success" className="row gap-4"><CheckCircle size={12} /> Approved</Badge>}
                        {entry.status === 'pending' && <Badge variant="warning">Pending</Badge>}
                        {hasDetails && (
                          <span className="text-xs fw-600 text-4 px-8 py-4" style={{ background: 'var(--border)', borderRadius: 12 }}>
                            {entry.details.length} entries
                          </span>
                        )}
                      </div>

                      {/* Action Col */}
                      <div className="row justify-end">
                        {hasDetails && (
                          <div style={{ color: 'var(--text-4)' }}>
                            {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {hasDetails && isExpanded && (
                      <div style={{ background: '#FAFAFA', padding: '0 32px 24px 152px', borderLeft: '3px solid var(--primary)' }}>
                        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                          <div style={{ display: 'grid', gap: 12 }}>
                            {entry.details.map((det, i) => (
                              <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 100px 1fr', alignItems: 'center' }}>
                                <div className="text-sm fw-600 text-2 row gap-8">
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-4)' }} />
                                  {det.project}
                                </div>
                                <div className="text-sm fw-700 text-1">{det.hrs}</div>
                                <div className="text-xs text-5">{det.time}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardBody>
          </Card>
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
        title="Add Time Entry"
        footer={
          <>
            <button className="btn-neutral" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => setModalOpen(false)}>Save Entry</button>
          </>
        }
      >
        <div className="grid-2 gap-24 mb-24">
          <div>
            <label className="form-label">Date <span className="text-error">*</span></label>
            <input type="date" className="input" defaultValue="2026-09-25" />
          </div>
          <div>
            <label className="form-label">Project</label>
            <select className="select">
              <option>Internal Admin</option>
              <option>Client Work</option>
              <option>Research</option>
            </select>
          </div>
        </div>
        <div className="grid-2 gap-24 mb-24">
          <div>
            <label className="form-label">Start Time <span className="text-error">*</span></label>
            <input type="time" className="input" defaultValue="09:00" />
          </div>
          <div>
            <label className="form-label">End Time <span className="text-error">*</span></label>
            <input type="time" className="input" defaultValue="17:00" />
          </div>
        </div>
        <div>
          <label className="form-label">Note (Optional)</label>
          <textarea className="input" rows={3} placeholder="What did you work on?" />
        </div>
      </Modal>
    </div>
  );
}
