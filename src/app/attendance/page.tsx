"use client";

import React, { useState, useMemo } from 'react';
import { Search, Filter, Clock, MapPin, AlertTriangle, Paperclip, ChevronDown, MonitorPlay, MonitorStop, RefreshCw, CalendarDays, Edit3, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { mockAttendanceRecords, AttendanceRecord, AttendanceStatus, ShiftType } from '@/data/attendance';
import { StatRibbon } from '@/components/ui/StatRibbon';

const TABS = ['Live Attendance', 'Shift Management'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('Live Attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<AttendanceStatus | 'All'>('All');
  
  // Manual Override State
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceRecord | null>(null);
  const [overrideType, setOverrideType] = useState<'Clock In' | 'Clock Out'>('Clock In');
  const [overrideTime, setOverrideTime] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Shift assignment state
  const [assignShiftEmployee, setAssignShiftEmployee] = useState<AttendanceRecord | null>(null);

  // Derived records
  const liveRecords = useMemo(() => {
    return mockAttendanceRecords.filter(r => {
      // Must have shift today to be in live attendance!
      if (!r.hasShiftToday) return false;
      const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' ? true : r.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filter]);

  const allRecords = useMemo(() => {
    return mockAttendanceRecords.filter(r => 
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleForceClock = () => {
    if (!overrideReason.trim()) {
      alert("Please provide a reason for the manual override.");
      return;
    }
    alert(`Successfully forced ${overrideType} for ${selectedEmployee?.employeeName} at ${overrideTime || 'current time'}.`);
    setSelectedEmployee(null);
  };

  const renderStatusBadge = (status: AttendanceStatus, latenessMinutes: number) => {
    if (status === 'Clocked In') return <Badge variant="success"><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', marginRight: 4, display: 'inline-block' }}/> Clocked In</Badge>;
    if (status === 'Clocked Out') return <Badge variant="neutral">Clocked Out</Badge>;
    if (status === 'Late') return <Badge variant="warning">Late ({latenessMinutes}m)</Badge>;
    if (status === 'Missing') return <Badge variant="danger">Missing</Badge>;
    return null;
  };

  const renderShiftBadge = (shift: ShiftType) => {
    if (shift === 'Morning') return <Badge variant="primary" style={{ background: '#E0F2FE', color: '#0284C7' }}>Morning</Badge>;
    if (shift === 'Evening') return <Badge variant="primary" style={{ background: '#FFEDD5', color: '#EA580C' }}>Evening</Badge>;
    if (shift === 'Night') return <Badge variant="primary" style={{ background: '#F3E8FF', color: '#7E22CE' }}>Night</Badge>;
    return <Badge variant="neutral" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Off</Badge>;
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <style>{`
        .employee-card .override-btn {
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          height: 0;
          margin-top: 0;
          padding: 0;
          overflow: hidden;
        }
        .employee-card:hover .override-btn {
          opacity: 1;
          visibility: visible;
          height: 32px;
          margin-top: 16px;
          padding: 6px;
        }
        .shift-cell { position: relative; }
        .shift-cell .edit-shift-btn {
          opacity: 0;
          transition: all 0.2s ease;
        }
        .shift-cell:hover .edit-shift-btn {
          opacity: 1;
        }
      `}</style>
      <PageHeader 
        title="Team Attendance"
        subtitle="Monitor real-time clock-ins, lateness, and manage timesheet overrides."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', background: 'var(--bg-page)' }}>
        
        {activeTab === 'Live Attendance' && (
          <div>
            <div className="row-between mb-24" style={{ flexWrap: 'wrap', gap: 16 }}>
              {/* Compact Inline Stats */}
              <div className="row gap-16" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '100px', padding: '6px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                 <div className="row gap-8 pr-16" style={{ borderRight: '1px solid var(--border)' }}>
                    <MonitorPlay size={14} className="text-4" />
                    <span className="text-sm fw-700 text-1">{mockAttendanceRecords.filter(r => r.hasShiftToday).length} <span className="text-4 fw-500">Expected</span></span>
                 </div>
                 <div className="row gap-8 pr-16" style={{ borderRight: '1px solid var(--border)' }}>
                    <RefreshCw size={14} className="text-success" />
                    <span className="text-sm fw-700 text-1">{liveRecords.filter(r => r.status === 'Clocked In' || r.status === 'Late').length} <span className="text-4 fw-500">Working</span></span>
                 </div>
                 <div className="row gap-8 pr-16" style={{ borderRight: '1px solid var(--border)' }}>
                    <AlertTriangle size={14} className="text-warning" />
                    <span className="text-sm fw-700 text-1">{liveRecords.filter(r => r.status === 'Late').length} <span className="text-4 fw-500">Late</span></span>
                 </div>
                 <div className="row gap-8">
                    <MonitorStop size={14} className="text-error" />
                    <span className="text-sm fw-700 text-1">{liveRecords.filter(r => r.status === 'Missing').length} <span className="text-4 fw-500">Missing</span></span>
                 </div>
              </div>
              
              <div className="row gap-12">
                <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px' }}>
                  <Filter size={14} className="text-4 mr-8"/>
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value as any)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-1)', fontWeight: 600 }}
                  >
                    <option value="All">All Today</option>
                    <option value="Clocked In">Working</option>
                    <option value="Late">Late</option>
                    <option value="Missing">Missing</option>
                  </select>
                </div>

                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 16px', width: 220 }}>
                  <Search size={14} className="text-4" style={{ marginRight: 8 }} />
                  <input 
                    type="text" 
                    placeholder="Search employees..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%' }} 
                  />
                </div>
              </div>
            </div>

            <div className="grid-3 gap-16">
              {liveRecords.map(record => {
                const isClockedOut = record.status === 'Clocked Out';
                const isLate = record.status === 'Late';
                const isMissing = record.status === 'Missing';
                
                return (
                  <Card 
                    key={record.id} 
                    className="employee-card"
                    style={{ 
                      opacity: isClockedOut ? 0.6 : 1, // Dim if clocked out
                      border: isLate ? '1px solid var(--warning)' : isMissing ? '1px solid var(--error)' : '1px solid var(--border)',
                      boxShadow: isClockedOut ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    <CardBody style={{ padding: '20px 24px' }}>
                      <div className="row-between mb-16">
                        <div className="row gap-12">
                          <Avatar src={record.avatar} name={record.employeeName} size="md" />
                          <div>
                            <div className="text-base fw-700 text-1" style={{ lineHeight: 1.2 }}>{record.employeeName}</div>
                            <div className="text-xs text-5 mt-2">{record.department}</div>
                          </div>
                        </div>
                        {renderStatusBadge(record.status, record.latenessMinutes)}
                      </div>

                      <div className="col gap-8 mb-16 text-xs">
                        <div className="row-between">
                          <span className="text-4 row gap-6"><Clock size={12}/> Shift</span>
                          <span className="fw-600 text-2">{record.expectedStartTime} - {record.expectedStartTime.includes('09') ? '17:00 PM' : '06:00 AM'}</span>
                        </div>
                        {!isMissing && (
                          <div className="row-between">
                            <span className="text-4 row gap-6"><MonitorPlay size={12}/> In</span>
                            <span className="fw-600 text-2">{record.clockInTime || '--:--'}</span>
                          </div>
                        )}
                        {isClockedOut && (
                          <div className="row-between">
                            <span className="text-4 row gap-6"><MonitorStop size={12}/> Out</span>
                            <span className="fw-600 text-2">{record.clockOutTime}</span>
                          </div>
                        )}
                        {record.totalWorkedToday && (
                          <div className="row-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                            <span className="text-4">Total Worked</span>
                            <span className="fw-700 text-primary">{record.totalWorkedToday}</span>
                          </div>
                        )}
                      </div>

                      <button 
                        className="btn-secondary w-100 override-btn" 
                        style={{ justifyContent: 'center', fontSize: 12 }}
                        onClick={() => {
                          setSelectedEmployee(record);
                          setOverrideType(record.status === 'Clocked In' || record.status === 'Late' ? 'Clock Out' : 'Clock In');
                          setOverrideTime('');
                          setOverrideReason('');
                        }}
                      >
                        Override
                      </button>
                    </CardBody>
                  </Card>
                );
              })}
              {liveRecords.length === 0 && (
                <div className="col text-center py-40" style={{ gridColumn: '1 / -1' }}>
                  <div className="text-4 mb-16"><Search size={32} /></div>
                  <h3 className="text-lg fw-700 text-1">No scheduled employees found</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Shift Management' && (
          <div>
            <div className="row-between mb-24">
              <div>
                <h3 className="text-xl fw-800 text-1">Weekly Shift Schedule</h3>
                <p className="text-sm text-5 mt-4">Assign working shifts to ensure accurate attendance tracking. Employees on 'Off' days will not be flagged as missing.</p>
              </div>
              <div className="row gap-12">
                <button className="btn-secondary" onClick={() => alert('Opening Default Weekly Schedules...')}>Manage Defaults</button>
                <button className="btn-secondary" onClick={() => alert('Opening Shift Profiles...')}>Shift Profiles</button>
                <button className="btn-primary" onClick={() => alert('Schedule published to team successfully!')}><Send size={16} className="mr-8"/> Publish Schedule</button>
              </div>
            </div>

            <Card style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                <thead style={{ background: '#F9FAFB' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 24px', fontWeight: 700, width: 220 }}>Employee</th>
                    {DAYS.map(day => (
                      <th key={day} style={{ padding: '16px 12px', fontWeight: 700, textAlign: 'center' }}>{day.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRecords.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i === allRecords.length - 1 ? 'none' : '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="row gap-12">
                          <Avatar src={r.avatar} name={r.employeeName} size="sm" />
                          <div>
                            <div className="text-sm fw-700 text-1" style={{ whiteSpace: 'nowrap' }}>{r.employeeName}</div>
                            <div className="text-xs text-5 mt-2">{r.department}</div>
                          </div>
                        </div>
                      </td>
                      {DAYS.map(day => {
                        const shiftType = r.weeklySchedule[day.toLowerCase() as keyof typeof r.weeklySchedule];
                        return (
                          <td key={day} style={{ padding: '16px 8px', textAlign: 'center' }}>
                            <div 
                              className="shift-cell"
                              style={{ display: 'inline-block', cursor: 'pointer', position: 'relative' }}
                              onClick={() => setAssignShiftEmployee(r)}
                              title="Click to reassign shift"
                            >
                              <div className="row gap-4" style={{ alignItems: 'center', justifyContent: 'center' }}>
                                {renderShiftBadge(shiftType)}
                                <div className="edit-shift-btn" style={{ position: 'absolute', right: -12, top: -4, background: 'white', borderRadius: '50%', padding: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                  <Edit3 size={12} className="text-primary"/>
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

      </div>

      {/* Force Clock Modal */}
      <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title="Manager Override" width={500} footer={
        <div className="row-between w-100">
          <button className="btn-neutral" onClick={() => setSelectedEmployee(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleForceClock} style={{ background: 'var(--primary)' }}>
            Confirm {overrideType}
          </button>
        </div>
      }>
        {selectedEmployee && (
          <div>
            <div className="p-16 mb-24" style={{ background: 'var(--primary-tint)', borderRadius: 8, color: 'var(--primary)' }}>
              <div className="row gap-12">
                <AlertTriangle size={20} />
                <span className="text-sm fw-700">You are manually overriding timesheet records for {selectedEmployee.employeeName}. This action will be logged and may affect payroll calculations.</span>
              </div>
            </div>

            <div className="grid-2 gap-20 mb-24">
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Override Action</label>
                <div className="input row-between" style={{ padding: '10px 16px', background: '#F9FAFB' }}>
                  <span className="fw-600">{overrideType}</span>
                  <ChevronDown size={14} className="text-4"/>
                </div>
              </div>
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Time (Optional)</label>
                <input 
                  type="time" 
                  className="input w-100" 
                  value={overrideTime}
                  onChange={(e) => setOverrideTime(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-24">
              <label className="text-sm fw-600 text-2 mb-8 block">Reason for Override <span className="text-error">*</span></label>
              <textarea 
                className="input w-100" 
                rows={3} 
                placeholder="E.g. Employee forgot to clock out, network issues, manager approved early leave..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Shift Modal (Mock interaction) */}
      <Modal isOpen={!!assignShiftEmployee} onClose={() => setAssignShiftEmployee(null)} title="Assign Shift" width={400} footer={
        <div className="row-between w-100">
          <button className="btn-neutral" onClick={() => setAssignShiftEmployee(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => { alert('Shift updated!'); setAssignShiftEmployee(null); }}>Save Shift</button>
        </div>
      }>
        {assignShiftEmployee && (
          <div>
            <div className="text-base fw-700 mb-16">Select Shift for {assignShiftEmployee.employeeName}</div>
            <div className="col gap-12">
              <label className="row gap-12 p-16" style={{ border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="radio" name="shift" defaultChecked />
                <div style={{ flex: 1 }}>
                  <div className="text-sm fw-700 text-1">Morning Shift</div>
                  <div className="text-xs text-5 mt-4">09:00 AM - 17:00 PM</div>
                </div>
              </label>
              <label className="row gap-12 p-16" style={{ border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="radio" name="shift" />
                <div style={{ flex: 1 }}>
                  <div className="text-sm fw-700 text-1">Evening Shift</div>
                  <div className="text-xs text-5 mt-4">14:00 PM - 22:00 PM</div>
                </div>
              </label>
              <label className="row gap-12 p-16" style={{ border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                <input type="radio" name="shift" />
                <div style={{ flex: 1 }}>
                  <div className="text-sm fw-700 text-1">Night Shift</div>
                  <div className="text-xs text-5 mt-4">22:00 PM - 06:00 AM</div>
                </div>
              </label>
              <label className="row gap-12 p-16" style={{ border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: '#F9FAFB' }}>
                <input type="radio" name="shift" />
                <div style={{ flex: 1 }}>
                  <div className="text-sm fw-700 text-4">Day Off</div>
                </div>
              </label>

              <div className="divider my-8" />
              <label className="text-sm fw-600 text-2">Or Custom Hours for this day:</label>
              <div className="row gap-12 mt-8">
                <input type="time" className="input flex-1" defaultValue="10:00" />
                <span className="text-4">to</span>
                <input type="time" className="input flex-1" defaultValue="14:00" />
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
