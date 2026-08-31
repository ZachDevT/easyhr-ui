"use client";

import { useState } from 'react';
import { Mail, Phone, MapPin, Building, Calendar, Clock, Monitor, User, ChevronDown, ChevronUp, FileText, ChevronRight, CheckCircle2, Target, Stethoscope, Heart, Briefcase, Plus, Search } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { CompulsoryMyTimeWidget } from '@/components/widgets';
import { PageHeader } from '@/components/layout/PageHeader';

const TABS = ['Personal', 'Job', 'Documents', 'Time Off', 'Performance', 'Benefits', 'Timesheet', 'Pay Info', 'Emergency'];

export default function ProfilePage() {
  const { currentUser } = useRole();
  const [activeTab, setActiveTab] = useState('Timesheet');

  // Editing state for Personal Tab
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    gender: currentUser.gender,
    birthDate: currentUser.birthDate,
    location: currentUser.location,
    maritalStatus: 'Single',
    ssn: '***-**-1234'
  });

  // State for expanded timesheet rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (day: string) => {
    setExpandedRows(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const timesheetData = [
    { day: 'Mon', date: 'Sep 23', hrs: '8h 00m', time: '9:00 AM - 5:00 PM', details: [
      { project: 'Production', hrs: '4h 00m', time: '9:00 AM - 1:00 PM' },
      { project: 'Lunch', hrs: '0h 30m', time: '1:00 PM - 1:30 PM' },
      { project: 'Production', hrs: '3h 30m', time: '1:30 PM - 5:00 PM' },
    ]},
    { day: 'Tue', date: 'Sep 24', hrs: '8h 00m', time: '9:00 AM - 5:00 PM', details: [
      { project: 'Production', hrs: '3h 00m', time: '9:00 AM - 12:00 PM' },
      { project: 'Meeting', hrs: '1h 00m', time: '12:00 PM - 1:00 PM' },
      { project: 'Lunch', hrs: '0h 30m', time: '1:00 PM - 1:30 PM' },
      { project: 'Production', hrs: '3h 30m', time: '1:30 PM - 5:00 PM' },
    ]},
    { day: 'Wed', date: 'Sep 25', hrs: '8h 00m', time: '9:00 AM - 5:00 PM', details: [] },
    { day: 'Thu', date: 'Sep 26', hrs: '0h 00m', time: '--', details: [] },
  ];

  const handlePersonalSave = () => {
    // In a real app, API call goes here
    setIsEditingPersonal(false);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Banner Area */}
      <div style={{ margin: '24px 24px 0 24px' }}>
        <PageHeader 
          variant="card"
          title={`${currentUser.firstName} ${currentUser.lastName}`}
          subtitle={currentUser.title}
          icon={
            <Avatar 
              name={`${currentUser.firstName} ${currentUser.lastName}`} 
              src={currentUser.avatar} 
              size="xl" 
              style={{ width: 100, height: 100, border: '4px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} 
            />
          }
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 48, padding: '24px', position: 'relative' }}>
        
        {/* Left Column: Vitals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          <div className="mb-24">
            <h3 className="text-sm fw-600 text-2 mb-12">Vitals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="row gap-12 text-xs text-4">
                <Phone size={14} /> <span className="text-1">{currentUser.phone}</span>
              </div>
              <div className="row gap-12 text-xs text-4">
                <Monitor size={14} /> <span className="text-1">{currentUser.email}</span>
              </div>
              <div className="row gap-12 text-xs text-4">
                <Clock size={14} /> <span className="text-1">12:07 PM local time</span>
              </div>
              <div className="row gap-12 text-xs text-4">
                <MapPin size={14} /> <span className="text-1">{currentUser.location}</span>
              </div>
              <div className="row gap-12 text-xs text-4">
                <Building size={14} /> 
                <div className="text-1">
                  <div>{currentUser.department}</div>
                  <div className="text-5 mt-2">Full-Time (In Office)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider mb-24" />

          <div className="mb-24">
            <h3 className="text-sm fw-600 text-2 mb-12">Hire Date</h3>
            <div className="row gap-12 text-xs text-4">
              <Calendar size={14} />
              <div className="text-1">
                <div>{currentUser.hireDate}</div>
                <div className="text-5 mt-2">2y - 6m - 15d</div>
              </div>
            </div>
          </div>

          <div className="divider mb-24" />

          <div className="mb-24">
            <h3 className="text-sm fw-600 text-2 mb-12">Manager</h3>
            <div className="row gap-12">
              <Avatar name={currentUser.manager || 'No Manager'} size="sm" />
              <div className="text-xs">
                <div className="text-1">{currentUser.manager || 'N/A'}</div>
                <div className="text-5 mt-2">Manager</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Tab Content */}
        <div style={{ 
          background: 'var(--card-bg)', 
          borderTopRightRadius: 12, 
          borderBottomRightRadius: 12, 
          borderBottomLeftRadius: 12,
          padding: 32, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          minHeight: 500
        }}>
          
          {/* TIMESHEET TAB */}
          {activeTab === 'Timesheet' && (
            <div>
              <div className="row-between mb-24">
                <h2 className="text-xl text-primary flex items-center gap-8 fw-600" style={{ letterSpacing: '-0.5px' }}>
                  <Clock size={20} /> Timesheet
                </h2>
                <div className="row gap-12">
                  <select className="select" defaultValue="This Pay Period" style={{ width: 180, background: 'var(--bg-page)' }}>
                    <option>This Pay Period</option>
                    <option>Last Pay Period</option>
                  </select>
                  <button className="btn-circle" style={{ background: 'var(--bg-page)' }}><FileText size={16}/></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
                <Card>
                  <CardBody style={{ padding: 0 }}>
                    <div style={{ padding: '16px 24px', background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                      <h3 className="text-base text-primary fw-600">Sep 28–Oct 4</h3>
                    </div>
                    {timesheetData.map((entry, idx, arr) => {
                      const hasDetails = entry.details.length > 0;
                      const isExpanded = expandedRows[entry.day];
                      return (
                        <div key={entry.day} style={{ borderBottom: idx === arr.length -1 ? 'none' : '1px solid var(--border)' }}>
                          <div 
                            style={{ display: 'flex', padding: 24, cursor: hasDetails ? 'pointer' : 'default' }}
                            onClick={() => hasDetails && toggleRow(entry.day)}
                          >
                            <div style={{ width: 80 }}>
                              <div className="text-base text-1 fw-600">{entry.day}</div>
                              <div className="text-xs text-5">{entry.date}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="text-sm text-1">{entry.hrs}</div>
                              <div className="text-xs text-5 mt-4">{entry.time}</div>
                            </div>
                            {hasDetails && (
                              <button className="btn-circle" style={{ width: 32, height: 32, border: 'none' }}>
                                {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                              </button>
                            )}
                          </div>
                          {/* Expanded Details */}
                          {hasDetails && isExpanded && (
                            <div style={{ background: '#F9FAFB', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                              <div style={{ display: 'grid', gap: 12 }}>
                                {entry.details.map((det, i) => (
                                  <div key={i} className="row text-sm text-4" style={{ paddingLeft: 80 }}>
                                    <div style={{ width: 120 }}>{det.project}</div>
                                    <div style={{ width: 80 }} className="text-1">{det.hrs}</div>
                                    <div>{det.time}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardBody>
                </Card>

                <div style={{ position: 'sticky', top: 24 }}>
                  <CompulsoryMyTimeWidget />
                </div>
              </div>
            </div>
          )}

          {/* PERSONAL TAB */}
          {activeTab === 'Personal' && (
            <div>
              <div className="row-between mb-24">
                <h3 className="text-lg fw-600 text-1">Basic Information</h3>
                {!isEditingPersonal && (
                  <button className="btn-secondary btn-sm" onClick={() => setIsEditingPersonal(true)}>Edit Info</button>
                )}
              </div>
              
              {isEditingPersonal ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 24px' }}>
                    <div>
                      <label className="form-label">First Name</label>
                      <input className="input" value={personalForm.firstName} onChange={e => setPersonalForm({...personalForm, firstName: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Last Name</label>
                      <input className="input" value={personalForm.lastName} onChange={e => setPersonalForm({...personalForm, lastName: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Gender</label>
                      <select className="select" value={personalForm.gender} onChange={e => setPersonalForm({...personalForm, gender: e.target.value})}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Non-binary</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Birth Date</label>
                      <input type="date" className="input" value={personalForm.birthDate} onChange={e => setPersonalForm({...personalForm, birthDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Marital Status</label>
                      <select className="select" value={personalForm.maritalStatus} onChange={e => setPersonalForm({...personalForm, maritalStatus: e.target.value})}>
                        <option>Single</option>
                        <option>Married</option>
                        <option>Divorced</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Social Security Number</label>
                      <input type="text" className="input" value={personalForm.ssn} onChange={e => setPersonalForm({...personalForm, ssn: e.target.value})} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Home Address</label>
                      <textarea className="input" rows={2} value={`123 Workspace Ave\n${personalForm.location}`} onChange={e => {}} />
                    </div>
                  </div>
                  <div className="row gap-12 mt-32" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn-neutral" onClick={() => setIsEditingPersonal(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handlePersonalSave}>Save Changes</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 24px' }}>
                  <div>
                    <label className="text-xs text-5 mb-4 block">First Name</label>
                    <div className="text-sm text-1">{personalForm.firstName}</div>
                  </div>
                  <div>
                    <label className="text-xs text-5 mb-4 block">Last Name</label>
                    <div className="text-sm text-1">{personalForm.lastName}</div>
                  </div>
                  <div>
                    <label className="text-xs text-5 mb-4 block">Gender</label>
                    <div className="text-sm text-1">{personalForm.gender}</div>
                  </div>
                  <div>
                    <label className="text-xs text-5 mb-4 block">Birth Date</label>
                    <div className="text-sm text-1">{personalForm.birthDate}</div>
                  </div>
                  <div>
                    <label className="text-xs text-5 mb-4 block">Marital Status</label>
                    <div className="text-sm text-1">{personalForm.maritalStatus}</div>
                  </div>
                  <div>
                    <label className="text-xs text-5 mb-4 block">SSN</label>
                    <div className="text-sm text-1">{personalForm.ssn}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="text-xs text-5 mb-4 block">Home Address</label>
                    <div className="text-sm text-1">123 Workspace Ave, <br/>{personalForm.location}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JOB TAB */}
          {activeTab === 'Job' && (
            <div>
              <div className="row-between mb-24">
                <h3 className="text-lg fw-600 text-1">Employment Details</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 24px' }}>
                <div>
                  <label className="text-xs text-5 mb-4 block">Hire Date</label>
                  <div className="text-sm text-1">{currentUser.hireDate}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Employee Number</label>
                  <div className="text-sm text-1">{currentUser.employeeNumber || '10294'}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Department</label>
                  <div className="text-sm text-1">{currentUser.department}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Division</label>
                  <div className="text-sm text-1">Corporate</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Employment Status</label>
                  <div className="text-sm text-1">Full-Time</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Job Title</label>
                  <div className="text-sm text-1">{currentUser.title}</div>
                </div>
              </div>

              <div className="divider my-32" />
              
              <h3 className="text-lg fw-600 text-1 mb-24">Compensation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 24px' }}>
                <div>
                  <label className="text-xs text-5 mb-4 block">Pay Rate</label>
                  <div className="text-sm text-1">{currentUser.compensation}</div>
                </div>
                <div>
                  <label className="text-xs text-5 mb-4 block">Pay Type</label>
                  <div className="text-sm text-1">{currentUser.payType}</div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'Documents' && (
            <div>
              <div className="row-between mb-24">
                <h3 className="text-lg fw-600 text-1">Employee Documents</h3>
                <button className="btn-secondary btn-sm"><Plus size={16}/> Add Document</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Offer_Letter_Signed.pdf', 'Employee_Handbook_2026.pdf', 'W4_Tax_Form.pdf', 'Confidentiality_Agreement.pdf'].map(doc => (
                  <div key={doc} className="list-row" style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}>
                    <FileText size={18} className="text-primary" style={{ marginRight: 12 }} />
                    <div style={{ flex: 1, fontSize: 14, color: 'var(--text-1)' }}>{doc}</div>
                    <div className="text-xs text-5 mr-16">Added Sep 2026</div>
                    <button className="btn-circle" style={{ border: 'none' }}><ChevronRight size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIME OFF TAB */}
          {activeTab === 'Time Off' && (
            <div>
              <div className="grid-2 gap-24 mb-32">
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center', padding: 32 }}>
                  <h3 className="text-sm text-1 mb-16">Vacation</h3>
                  <p className="text-4xl text-primary mb-4 fw-600">120</p>
                  <p className="text-xs text-5 mb-24">Hours Available</p>
                  <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <div className="text-left">
                      <div className="text-xs text-5 mb-4">Accrued YTD</div>
                      <div className="text-sm fw-600 text-1">140h</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-5 mb-4">Used YTD</div>
                      <div className="text-sm fw-600 text-1">20h</div>
                    </div>
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center', padding: 32 }}>
                  <h3 className="text-sm text-1 mb-16">Sick Leave</h3>
                  <p className="text-4xl text-primary mb-4 fw-600">64</p>
                  <p className="text-xs text-5 mb-24">Hours Available</p>
                  <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <div className="text-left">
                      <div className="text-xs text-5 mb-4">Accrued YTD</div>
                      <div className="text-sm fw-600 text-1">80h</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-5 mb-4">Used YTD</div>
                      <div className="text-sm fw-600 text-1">16h</div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg fw-600 text-1 mb-24">Upcoming Time Off</h3>
              <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border)', borderRadius: 8 }}>
                <p className="text-sm text-5">No upcoming time off scheduled.</p>
              </div>
            </div>
          )}

          {/* PERFORMANCE TAB */}
          {activeTab === 'Performance' && (
            <div>
              <div className="row-between mb-24">
                <h3 className="text-lg fw-600 text-1">Reviews</h3>
              </div>
              <div className="list-row mb-32" style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div className="icon-chip" style={{ background: 'var(--success)', color: 'white', width: 32, height: 32 }}><CheckCircle2 size={16}/></div>
                <div style={{ flex: 1, marginLeft: 16 }}>
                  <div className="text-sm fw-600 text-1">Q3 2026 Self-Assessment</div>
                  <div className="text-xs text-5 mt-4">Completed on Sep 15, 2026</div>
                </div>
                <button className="btn-secondary btn-sm">View</button>
              </div>
              
              <div className="row-between mb-24">
                <h3 className="text-lg fw-600 text-1">Active Goals</h3>
                <button className="btn-secondary btn-sm"><Plus size={16}/> Add Goal</button>
              </div>
              <div className="list-row" style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div className="icon-chip" style={{ width: 32, height: 32 }}><Target size={16}/></div>
                <div style={{ flex: 1, marginLeft: 16 }}>
                  <div className="text-sm fw-600 text-1">Complete Leadership Training</div>
                  <div className="text-xs text-5 mt-4">Due Dec 31, 2026</div>
                </div>
                <Badge variant="primary">In Progress</Badge>
              </div>
            </div>
          )}

          {/* BENEFITS TAB */}
          {activeTab === 'Benefits' && (
            <div>
              <div className="row-between mb-24">
                <h3 className="text-lg fw-600 text-1">Enrolled Plans</h3>
              </div>
              <div className="grid-2 gap-24">
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
                  <div className="row gap-12 mb-16">
                    <Stethoscope className="text-primary" size={24} />
                    <span className="text-base fw-600 text-1">Medical</span>
                  </div>
                  <p className="text-sm text-4 mb-24">BlueCross BlueShield Premium PPO</p>
                  <div className="text-xs text-5 mb-4">Coverage</div>
                  <div className="text-sm text-1">Employee + Family</div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
                  <div className="row gap-12 mb-16">
                    <Heart className="text-primary" size={24} />
                    <span className="text-base fw-600 text-1">Dental</span>
                  </div>
                  <p className="text-sm text-4 mb-24">Delta Dental Comprehensive</p>
                  <div className="text-xs text-5 mb-4">Coverage</div>
                  <div className="text-sm text-1">Employee Only</div>
                </div>
              </div>
            </div>
          )}

          {/* PAY INFO TAB */}
          {activeTab === 'Pay Info' && (
            <div>
              <div className="row-between mb-24">
                <h3 className="text-lg fw-600 text-1">Recent Payslips</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Sep 15 - Sep 30, 2026', 'Sep 1 - Sep 14, 2026', 'Aug 16 - Aug 31, 2026'].map(period => (
                  <div key={period} className="list-row" style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
                    <Briefcase size={18} className="text-primary" style={{ marginRight: 12 }} />
                    <div style={{ flex: 1, fontSize: 14, color: 'var(--text-1)' }}>{period}</div>
                    <button className="btn-secondary btn-sm">Download PDF</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMERGENCY TAB */}
          {activeTab === 'Emergency' && (
            <div>
              <div className="row-between mb-24">
                <h3 className="text-lg fw-600 text-1">Emergency Contacts</h3>
                <button className="btn-secondary btn-sm"><Plus size={16}/> Add Contact</button>
              </div>
              <div className="grid-2 gap-24">
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
                  <Badge variant="primary" style={{ marginBottom: 16 }}>Primary</Badge>
                  <div className="text-base fw-600 text-1 mb-4">David Johnson</div>
                  <div className="text-sm text-5 mb-16">Spouse</div>
                  <div className="row gap-8 text-sm text-4 mb-8"><Phone size={14}/> 555-0198</div>
                  <div className="row gap-8 text-sm text-4"><Mail size={14}/> david.j@example.com</div>
                </div>
                <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 24, background: '#F9FAFB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <button className="btn-circle" style={{ width: 48, height: 48, background: 'white', border: '1px dashed var(--border)' }}>
                      <Plus size={20} className="text-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
