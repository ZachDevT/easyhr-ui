"use client";

import React, { useState, useMemo } from 'react';
import { Search, Filter, Clock, MapPin, AlertTriangle, Paperclip, ChevronDown, MonitorPlay, MonitorStop, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { mockAttendanceRecords, AttendanceRecord, AttendanceStatus } from '@/data/attendance';
import { StatRibbon } from '@/components/ui/StatRibbon';

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<AttendanceStatus | 'All'>('All');
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceRecord | null>(null);
  
  // Modal states
  const [overrideType, setOverrideType] = useState<'Clock In' | 'Clock Out'>('Clock In');
  const [overrideTime, setOverrideTime] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const filteredRecords = useMemo(() => {
    return mockAttendanceRecords.filter(r => {
      const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' ? true : r.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filter]);

  const handleForceClock = () => {
    if (!overrideReason.trim()) {
      alert("Please provide a reason for the manual override.");
      return;
    }
    alert(`Successfully forced ${overrideType} for ${selectedEmployee?.employeeName} at ${overrideTime || 'current time'}.`);
    setSelectedEmployee(null);
  };

  const renderStatusBadge = (status: AttendanceStatus, latenessMinutes: number) => {
    if (status === 'Clocked In') return <Badge variant="success">Clocked In</Badge>;
    if (status === 'Clocked Out') return <Badge variant="neutral">Clocked Out</Badge>;
    if (status === 'Late') return <Badge variant="warning">Late ({latenessMinutes}m)</Badge>;
    if (status === 'Missing') return <Badge variant="danger">Missing / Absent</Badge>;
    return null;
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader 
        title="Team Attendance"
        subtitle="Monitor real-time clock-ins, lateness, and manage timesheet overrides."
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '48px', background: 'var(--bg-page)' }}>
        
        {/* Stat Ribbon */}
        <StatRibbon
          stats={[
            { label: 'Total Employees', value: mockAttendanceRecords.length.toString(), icon: <MonitorPlay size={18}/> },
            { label: 'Currently Working', value: mockAttendanceRecords.filter(r => r.status === 'Clocked In' || r.status === 'Late').length.toString(), color: 'var(--success)', icon: <RefreshCw size={18}/> },
            { label: 'Late Today', value: mockAttendanceRecords.filter(r => r.status === 'Late').length.toString(), color: 'var(--warning)', icon: <AlertTriangle size={18}/> },
            { label: 'Absent / Missing', value: mockAttendanceRecords.filter(r => r.status === 'Missing').length.toString(), color: 'var(--error)', icon: <MonitorStop size={18}/> },
          ]}
          style={{ marginBottom: 40 }}
        />

        {/* Toolbar */}
        <div className="row-between mb-32">
          <div className="row gap-8">
            <button className={`btn-${filter === 'All' ? 'primary' : 'secondary'}`} onClick={() => setFilter('All')}>All</button>
            <button className={`btn-${filter === 'Clocked In' ? 'primary' : 'secondary'}`} onClick={() => setFilter('Clocked In')}>Working</button>
            <button className={`btn-${filter === 'Late' ? 'primary' : 'secondary'}`} onClick={() => setFilter('Late')}>Late</button>
            <button className={`btn-${filter === 'Missing' ? 'primary' : 'secondary'}`} onClick={() => setFilter('Missing')}>Missing</button>
          </div>
          
          <div className="row gap-16">
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '10px 20px', width: 250 }}>
              <Search size={16} className="text-4" style={{ marginRight: 8 }} />
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} 
              />
            </div>
            <button className="btn-secondary">
              <Filter size={16} className="mr-8"/> Filter Dept
            </button>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid-3 gap-24">
          {filteredRecords.map(record => (
            <Card key={record.id} style={{ border: record.status === 'Late' ? '1px solid var(--warning)' : record.status === 'Missing' ? '1px solid var(--error)' : '1px solid var(--border)' }}>
              <CardBody style={{ padding: '24px' }}>
                <div className="row-between mb-16">
                  <div className="row gap-16">
                    <Avatar src={record.avatar} name={record.employeeName} size="md" />
                    <div>
                      <div className="text-base fw-700 text-1">{record.employeeName}</div>
                      <div className="text-xs text-5 mt-4">{record.department}</div>
                    </div>
                  </div>
                  {renderStatusBadge(record.status, record.latenessMinutes)}
                </div>

                <div className="divider my-16"/>

                <div className="col gap-12 mb-20">
                  <div className="row-between text-sm">
                    <span className="text-4 row gap-8"><Clock size={14}/> Expected Start</span>
                    <span className="fw-600 text-2">{record.expectedStartTime}</span>
                  </div>
                  <div className="row-between text-sm">
                    <span className="text-4 row gap-8"><Clock size={14}/> Clock In Time</span>
                    <span className="fw-600 text-2">{record.clockInTime || '--:--'}</span>
                  </div>
                  {(record.status === 'Clocked Out' || record.clockOutTime) && (
                    <div className="row-between text-sm">
                      <span className="text-4 row gap-8"><Clock size={14}/> Clock Out Time</span>
                      <span className="fw-600 text-2">{record.clockOutTime}</span>
                    </div>
                  )}
                  {record.totalWorkedToday && (
                    <div className="row-between text-sm">
                      <span className="text-4 row gap-8"><RefreshCw size={14}/> Total Time Today</span>
                      <span className="fw-700 text-primary">{record.totalWorkedToday}</span>
                    </div>
                  )}
                  {record.lastLocation && (
                    <div className="row text-sm mt-8 p-12" style={{ background: '#F9FAFB', borderRadius: 8 }}>
                      <MapPin size={14} className="text-4 mr-8"/>
                      <span className="text-3 truncate">{record.lastLocation}</span>
                    </div>
                  )}
                </div>

                <button 
                  className="btn-secondary w-100" 
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    setSelectedEmployee(record);
                    setOverrideType(record.status === 'Clocked In' || record.status === 'Late' ? 'Clock Out' : 'Clock In');
                    setOverrideTime('');
                    setOverrideReason('');
                  }}
                >
                  Force Override
                </button>
              </CardBody>
            </Card>
          ))}
          {filteredRecords.length === 0 && (
            <div className="col text-center py-40" style={{ gridColumn: '1 / -1' }}>
              <div className="text-4 mb-16"><Search size={32} /></div>
              <h3 className="text-lg fw-700 text-1">No employees found</h3>
              <p className="text-base text-4">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
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

            <div className="p-16" style={{ border: '1px dashed var(--border)', borderRadius: 8, background: '#F9FAFB', textAlign: 'center' }}>
              <Paperclip size={24} className="text-4 mb-8 mx-auto" />
              <div className="text-sm fw-600 text-2">Attach Proof (Optional)</div>
              <div className="text-xs text-5 mt-4">Upload email thread, Slack message screenshot, or manual timesheet.</div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
