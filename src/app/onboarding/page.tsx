"use client";

import React, { useState } from 'react';
import { ClipboardList, Plus, Search, MoreHorizontal, Mail, Bell, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, UserPlus, FileText, CheckSquare, CalendarDays, Send, GripVertical, Link } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useHR } from '@/context/HRContext';

export default function HrOnboardingPage() {
  const [activeTab, setActiveTab] = useState('New Hires');
  const [viewState, setViewState] = useState<'dashboard' | 'builder'>('dashboard');
  const { candidates, onboardings, initiateOnboarding } = useHR();
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Wizard State
  const [wizardCandidate, setWizardCandidate] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Find candidates that are 'Hired' but not yet in onboardings
  const pendingHires = candidates.filter(c => c.stage === 'Hired' && !onboardings.some(o => o.candidateId === c.id));

  const toggleRow = (id: number) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter(rId => rId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  const openWizard = (candidate: any) => {
    setWizardCandidate(candidate);
    setWizardStep(1);
  };

  const finishWizard = () => {
    if (!wizardCandidate) return;
    const dept = wizardCandidate.role.includes('Engineer') ? 'Engineering' : wizardCandidate.role.includes('Sales') ? 'Sales' : 'Product';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14);
    initiateOnboarding(wizardCandidate, startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), dept);
    setWizardCandidate(null);
  };

  // Collect uncompleted tasks for Today's Agenda
  const agendaTasks = onboardings.flatMap(o => 
    o.tasks.filter(t => !t.completed).map(t => ({ ...t, employeeName: o.name }))
  );

  if (viewState === 'builder') {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
        <PageHeader 
          title="Workflow Builder"
          subtitle="Design the onboarding task sequence."
          icon={<FileText size={28} className="text-white" />}
          actions={
            <div className="row gap-12">
              <button className="btn-secondary" onClick={() => setViewState('dashboard')} style={{ background: 'white', color: 'var(--text-2)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => setViewState('dashboard')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }}>
                Save Template
              </button>
            </div>
          }
        />
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-page)', padding: '32px 40px' }}>
          <div className="row gap-32 h-100">
            {/* Left side: Task list */}
            <div className="col gap-24 flex-1">
              <Card style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <CardBody className="p-0">
                  <div className="p-16 border-b border-border bg-neutral row-between align-center">
                    <span className="fw-700 text-1 text-sm uppercase tracking-wider">Pre-boarding Phase</span>
                    <button className="btn-neutral" style={{ padding: 4, borderRadius: 4 }}><Plus size={16}/></button>
                  </div>
                  <div className="col">
                    <div className="row gap-12 align-center p-16 border-b border-border bg-white hover-bg-neutral" style={{ cursor: 'pointer' }}>
                      <GripVertical size={16} className="text-4" />
                      <div className="col gap-4 flex-1">
                        <span className="fw-600 text-1 text-sm">Send Welcome Package</span>
                        <span className="text-xs text-5">Assigned to: HR</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-16 border-b border-border bg-neutral row-between align-center">
                    <span className="fw-700 text-1 text-sm uppercase tracking-wider">First Day</span>
                    <button className="btn-neutral" style={{ padding: 4, borderRadius: 4 }}><Plus size={16}/></button>
                  </div>
                  <div className="col">
                    <div className="row gap-12 align-center p-16 border-b border-border bg-white hover-bg-neutral" style={{ cursor: 'pointer' }}>
                      <GripVertical size={16} className="text-4" />
                      <div className="col gap-4 flex-1">
                        <span className="fw-600 text-1 text-sm">IT Orientation & Laptop Setup</span>
                        <span className="text-xs text-5">Assigned to: IT Dept</span>
                      </div>
                    </div>
                    <div className="row gap-12 align-center p-16 bg-white hover-bg-neutral" style={{ cursor: 'pointer' }}>
                      <GripVertical size={16} className="text-4" />
                      <div className="col gap-4 flex-1">
                        <span className="fw-600 text-1 text-sm">Manager 1:1 Sync</span>
                        <span className="text-xs text-5">Assigned to: Manager</span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
              <button className="btn-secondary row gap-8 align-center justify-center py-16 text-primary fw-700 bg-white" style={{ borderRadius: 12, border: '1px dashed var(--primary)', width: '100%' }}>
                <Plus size={16} /> Add New Phase
              </button>
            </div>
            
            {/* Right side: Task Editor */}
            <div className="col gap-24" style={{ width: 400 }}>
              <Card style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <CardBody className="p-24 col gap-20">
                  <h3 className="m-0 text-lg fw-700 text-1 border-b border-border pb-16">Edit Task</h3>
                  
                  <div className="col gap-8">
                    <label className="text-sm fw-600 text-2">Task Title</label>
                    <input type="text" defaultValue="IT Orientation & Laptop Setup" className="input" />
                  </div>
                  
                  <div className="col gap-8">
                    <label className="text-sm fw-600 text-2">Assignee</label>
                    <select className="select" style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'white' }}>
                      <option>IT Dept</option>
                      <option>New Hire</option>
                      <option>Direct Manager</option>
                      <option>HR</option>
                    </select>
                  </div>
                  
                  <div className="col gap-8">
                    <label className="text-sm fw-600 text-2">Description / Instructions</label>
                    <textarea defaultValue="Hand over the configured MacBook and review security policies." className="input" style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, minHeight: 100 }} />
                  </div>
                  
                  <button className="btn-neutral text-error fw-700 py-12 mt-8" style={{ border: '1px solid var(--error-tint)', borderRadius: 8, background: 'var(--error-tint)' }}>
                    Delete Task
                  </button>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      
      <PageHeader 
        title="Onboarding Management"
        subtitle="Track new hire progress, manage onboarding tasks, and assign workflows."
        icon={<ClipboardList size={28} className="text-white" />}
        tabs={['New Hires', 'Workflows', 'Settings']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }}>
            <Plus size={16} style={{ marginRight: 8 }}/> Add New Hire
          </button>
        }
      />
      
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-page)', display: 'flex' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {activeTab === 'New Hires' && (
            <div className="col gap-32">
              
              {/* Quick Stats */}
              <StatRibbon 
                stats={[
                  { label: 'Active Onboardings', value: onboardings.length, icon: <ClipboardList size={18}/>, color: 'var(--primary)' },
                  { label: 'At Risk', value: onboardings.filter(o => o.status === 'At Risk').length, icon: <AlertCircle size={18}/>, color: 'var(--warning)' },
                  { label: 'Completed (YTD)', value: 45, icon: <CheckCircle2 size={18}/>, color: 'var(--success)' }
                ]}
              />

              {/* Pending from ATS Queue */}
              {pendingHires.length > 0 && (
                <div>
                  <h2 className="text-xl fw-800 text-1 m-0 mb-16 row gap-8 align-center">
                    <UserPlus size={20} className="text-primary" /> Pending from ATS 
                    <span style={{ background: 'var(--primary-tint)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{pendingHires.length}</span>
                  </h2>
                  <div className="col gap-12">
                    {pendingHires.map(candidate => (
                      <div key={candidate.id} className="row-between align-center p-16" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div className="row gap-16 align-center">
                          <Avatar name={candidate.name} src={candidate.avatar} size="lg" />
                          <div>
                            <div className="fw-700 text-1 text-base">{candidate.name}</div>
                            <div className="text-sm text-4">{candidate.role}</div>
                          </div>
                        </div>
                        <div className="row gap-12 align-center">
                          <Badge variant="success">Hired {candidate.date}</Badge>
                          <button onClick={() => openWizard(candidate)} className="btn-primary" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, background: 'var(--gradient)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                            Initiate Onboarding
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Active Onboardings Table */}
              <div>
                <div className="row-between align-center mb-16">
                  <h2 className="text-xl fw-800 text-1 m-0">Active Onboardings</h2>
                  <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 16px', width: 300 }}>
                    <Search size={16} className="text-4" style={{ marginRight: 8 }} />
                    <input type="text" placeholder="Search onboardings..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
                  </div>
                </div>
                
                <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: 16 }}>
                  <CardBody style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                        <tr style={{ color: 'var(--text-4)', fontSize: 12, textTransform: 'uppercase' }}>
                          <th style={{ padding: '16px 24px', width: 40 }}></th>
                          <th style={{ padding: '16px 24px', fontWeight: 700 }}>Employee</th>
                          <th style={{ padding: '16px 24px', fontWeight: 700 }}>Role & Dept</th>
                          <th style={{ padding: '16px 24px', fontWeight: 700 }}>Start Date</th>
                          <th style={{ padding: '16px 24px', fontWeight: 700 }}>Progress</th>
                          <th style={{ padding: '16px 24px', fontWeight: 700 }}>Status</th>
                          <th style={{ padding: '16px 24px', width: 80 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onboardings.map((hire, idx) => {
                          const isExpanded = expandedRows.includes(hire.id);
                          return (
                            <React.Fragment key={hire.id}>
                              <tr style={{ borderBottom: isExpanded || idx === onboardings.length - 1 ? 'none' : '1px solid var(--border)', background: 'white', cursor: 'pointer' }} onClick={() => toggleRow(hire.id)}>
                                <td style={{ padding: '20px 0 20px 24px' }}>
                                  {isExpanded ? <ChevronDown size={18} className="text-4" /> : <ChevronRight size={18} className="text-4" />}
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                  <div className="row gap-12 align-center">
                                    <Avatar name={hire.name} size="md" style={{ border: '1px solid var(--border)' }} />
                                    <span className="fw-700 text-1 text-base">{hire.name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                  <div className="col gap-4">
                                    <div className="fw-600 text-2 text-sm">{hire.role}</div>
                                    <div className="text-xs text-5">{hire.department}</div>
                                  </div>
                                </td>
                                <td style={{ padding: '20px 24px', color: 'var(--text-3)', fontSize: 14, fontWeight: 500 }}>{hire.startDate}</td>
                                <td style={{ padding: '20px 24px' }}>
                                  <div className="row gap-12 align-center">
                                    <div style={{ flex: 1, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden', minWidth: 120 }}>
                                      <div style={{ width: `${hire.progress}%`, height: '100%', background: hire.progress === 100 ? 'var(--success)' : 'var(--gradient)', borderRadius: 4 }} />
                                    </div>
                                    <span className="text-xs fw-700 text-3">{hire.progress}%</span>
                                  </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                  <Badge variant={hire.status === 'Completed' ? 'success' : hire.status === 'At Risk' ? 'error' : hire.status === 'On Track' ? 'neutral' : 'warning'}>
                                    {hire.status}
                                  </Badge>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                  <div className="row gap-8 justify-end">
                                    <button className="btn-neutral" style={{ padding: 8, borderRadius: 8 }} onClick={(e) => e.stopPropagation()}><Mail size={16} className="text-primary" /></button>
                                    <button className="btn-neutral" style={{ padding: 8, borderRadius: 8 }} onClick={(e) => e.stopPropagation()}><MoreHorizontal size={16}/></button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr style={{ borderBottom: idx === onboardings.length - 1 ? 'none' : '1px solid var(--border)', background: '#F9FAFB' }}>
                                  <td colSpan={7} style={{ padding: '16px 24px 32px 64px' }}>
                                    <div className="p-20 bg-white" style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                                      <h4 className="text-sm fw-700 text-1 mb-16 row gap-8 align-center"><CheckSquare size={16} className="text-primary"/> Onboarding Tasks</h4>
                                      <div className="col gap-12">
                                        {hire.tasks.map(task => (
                                          <div key={task.id} className="row gap-12 align-center">
                                            <div style={{ width: 18, height: 18, borderRadius: 4, border: task.completed ? 'none' : '2px solid var(--border)', background: task.completed ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              {task.completed && <CheckCircle2 size={14} color="white" />}
                                            </div>
                                            <span className={`text-sm fw-500 ${task.completed ? 'text-4' : 'text-1'}`} style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}
          
          {/* Workflows Tab */}
          {activeTab === 'Workflows' && (
            <div className="col gap-24">
              <div className="row-between align-center">
                <div>
                  <h2 className="text-xl fw-800 text-1 m-0">Onboarding Templates</h2>
                  <p className="text-sm text-4 mt-4">Manage standard task lists that get assigned to new hires.</p>
                </div>
                <button onClick={() => setViewState('builder')} className="btn-primary" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, background: 'var(--gradient)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  Create Template
                </button>
              </div>

              <div className="grid-2 gap-24">
                {[
                  { name: 'Standard Engineering', tasks: 12, dept: 'Engineering', active: 4 },
                  { name: 'Sales Bootcamp', tasks: 8, dept: 'Sales', active: 1 },
                  { name: 'Executive Onboarding', tasks: 15, dept: 'Leadership', active: 0 },
                  { name: 'General Contractor', tasks: 5, dept: 'All', active: 2 }
                ].map((wf, idx) => (
                  <Card key={idx} style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <CardBody className="p-24 col gap-16">
                      <div className="row-between align-start">
                        <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)', width: 40, height: 40 }}>
                          <FileText size={20}/>
                        </div>
                        <button className="btn-neutral" style={{ padding: 6, borderRadius: 6 }}><MoreHorizontal size={16}/></button>
                      </div>
                      <div>
                        <h3 className="text-lg fw-700 text-1 m-0 mb-4">{wf.name}</h3>
                        <div className="row gap-8 align-center text-xs text-5 fw-600">
                          <Badge variant="neutral">{wf.dept}</Badge>
                          <span>•</span>
                          <span>{wf.tasks} predefined tasks</span>
                        </div>
                      </div>
                      <div className="row-between align-center mt-8 pt-16" style={{ borderTop: '1px dashed var(--border)' }}>
                        <span className="text-sm fw-600 text-4">{wf.active} Active Onboardings</span>
                        <button onClick={() => setViewState('builder')} className="text-primary text-sm fw-700 bg-transparent" style={{ border: 'none', cursor: 'pointer' }}>Edit Workflow</button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'Settings' && (
             <div className="col gap-32 max-w-4xl">
               <div>
                  <h2 className="text-xl fw-800 text-1 m-0">Onboarding Settings</h2>
                  <p className="text-sm text-4 mt-4">Configure global automations and default templates.</p>
               </div>
               
               <Card style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                 <CardBody className="p-0">
                   <div className="p-24 border-b border-border row gap-16 align-center bg-neutral">
                     <Bell className="text-primary" size={24} />
                     <div>
                       <h3 className="m-0 text-lg fw-700 text-1">Automated Nudges</h3>
                       <p className="m-0 text-sm text-4">Set up reminders for tasks and milestones.</p>
                     </div>
                   </div>
                   <div className="p-24 col gap-16">
                     <div className="row-between align-center">
                       <div className="col gap-4">
                         <span className="fw-600 text-2">Pre-boarding Reminder</span>
                         <span className="text-sm text-5">Remind direct manager 3 days before start date.</span>
                       </div>
                       <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                     </div>
                     <div className="row-between align-center">
                       <div className="col gap-4">
                         <span className="fw-600 text-2">Overdue Task Alert</span>
                         <span className="text-sm text-5">Send digest to HR if tasks are 2+ days overdue.</span>
                       </div>
                       <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                     </div>
                   </div>
                 </CardBody>
               </Card>
               
               <Card style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                 <CardBody className="p-0">
                   <div className="p-24 border-b border-border row gap-16 align-center bg-neutral">
                     <Mail className="text-primary" size={24} />
                     <div>
                       <h3 className="m-0 text-lg fw-700 text-1">Welcome Email Template</h3>
                       <p className="m-0 text-sm text-4">This email is sent automatically when initiated.</p>
                     </div>
                   </div>
                   <div className="p-24 col gap-12">
                     <input type="text" defaultValue="Welcome to EasyHR, {employee_name}!" className="input" />
                     <textarea defaultValue="We are so excited to have you join the {department_name} team..." className="input" style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, minHeight: 120 }} />
                   </div>
                 </CardBody>
               </Card>

               <Card style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                 <CardBody className="p-0">
                   <div className="p-24 border-b border-border row gap-16 align-center bg-neutral">
                     <Link className="text-primary" size={24} />
                     <div>
                       <h3 className="m-0 text-lg fw-700 text-1">Integrations & Provisioning</h3>
                       <p className="m-0 text-sm text-4">Automatically provision accounts for new hires.</p>
                     </div>
                   </div>
                   <div className="p-24 col gap-16">
                     <div className="row-between align-center p-16 border border-border" style={{ borderRadius: 12 }}>
                       <div className="row gap-12 align-center">
                         <div style={{ width: 32, height: 32, background: '#E01E5A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>#</div>
                         <div className="col gap-4">
                           <span className="fw-700 text-1">Slack Workspace</span>
                           <span className="text-xs text-5">Auto-invite to #general</span>
                         </div>
                       </div>
                       <button className="btn-secondary text-sm">Disconnect</button>
                     </div>
                   </div>
                 </CardBody>
               </Card>

             </div>
          )}
        </div>

        {/* Right Sidebar: Today's Agenda */}
        {activeTab === 'New Hires' && (
          <div style={{ width: 340, background: 'white', borderLeft: '1px solid var(--border)', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
            <div className="row gap-12 align-center mb-24">
              <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                <CalendarDays size={20} />
              </div>
              <h2 className="text-xl fw-800 text-1 m-0">Today's Agenda</h2>
            </div>
            
            <p className="text-sm text-4 mb-24">
              Here are the onboarding tasks that require your attention today.
            </p>

            <div className="col gap-16 flex-1 overflow-y-auto pr-8">
              {agendaTasks.map(task => (
                <div key={task.id} className="p-16 hover-bg-neutral" style={{ border: '1px solid var(--border)', borderRadius: 12, transition: 'all 0.2s ease', cursor: 'pointer' }}>
                  <div className="row-between align-start mb-8">
                    <span className="text-sm fw-700 text-1">{task.title}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', marginTop: 6 }} />
                  </div>
                  <div className="row gap-8 align-center text-xs text-4 fw-500">
                    <Avatar name={task.employeeName} size="xs" />
                    For {task.employeeName}
                  </div>
                </div>
              ))}
              {agendaTasks.length === 0 && (
                <div className="text-center p-32 text-4 text-sm bg-neutral" style={{ borderRadius: 12 }}>
                  <CheckCircle2 size={32} className="text-success mb-12" style={{ margin: '0 auto' }} />
                  You're all caught up for today!
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* INITIATE ONBOARDING WIZARD — reusable Modal */}
      <Modal
        isOpen={!!wizardCandidate}
        onClose={() => setWizardCandidate(null)}
        title="Initiate Onboarding"
        subtitle={wizardCandidate ? `For ${wizardCandidate.name} (${wizardCandidate.role})` : ''}
      >
        {wizardCandidate && (
          <div className="col" style={{ height: '100%' }}>

            {/* Step progress bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: '0 32px 24px' }}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 4, borderRadius: 2, background: wizardStep >= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: wizardStep >= step ? 'var(--primary)' : 'var(--text-5)', letterSpacing: '0.04em' }}>
                    {step === 1 ? 'Core Details' : step === 2 ? 'Workflow' : 'Review'}
                  </span>
                </div>
              ))}
            </div>

            {/* Step body */}
            <div className="col gap-24" style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>

              {wizardStep === 1 && (
                <>
                  <div className="col gap-8">
                    <label className="text-sm fw-600 text-2">Start Date <span className="text-error">*</span></label>
                    <Input type="date" defaultValue="2026-10-20" leftIcon={<CalendarDays size={16} />} />
                  </div>
                  <div className="col gap-8">
                    <label className="text-sm fw-600 text-2">Direct Manager</label>
                    <Select>
                      <option>Select manager...</option>
                      <option>Sarah Johnson (VP, HR)</option>
                      <option>Michael Scott (Regional Manager)</option>
                    </Select>
                  </div>
                  <div className="col gap-8">
                    <label className="text-sm fw-600 text-2">Department</label>
                    <Select>
                      <option>Engineering</option>
                      <option>Sales</option>
                      <option>Product</option>
                      <option>Marketing</option>
                    </Select>
                  </div>
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <div>
                    <h4 className="m-0 text-base fw-700 text-1">Workflow Template</h4>
                    <p className="m-0 text-sm text-4 mt-4">Select the task set to assign to this new hire.</p>
                  </div>
                  <div className="col gap-12">
                    {['Standard Engineering', 'Sales Bootcamp', 'Executive Onboarding'].map((tmpl, idx) => (
                      <div key={idx} className="row gap-16 align-center p-16" style={{ border: idx === 0 ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', background: idx === 0 ? 'var(--primary-tint)' : 'white', transition: 'all 0.15s' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: idx === 0 ? '6px solid var(--primary)' : '2px solid var(--border)', background: 'white', flexShrink: 0 }} />
                        <div className="col gap-4">
                          <span className="fw-700 text-1 text-base">{tmpl}</span>
                          <span className="text-sm text-5">12 predefined tasks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {wizardStep === 3 && (
                <>
                  <div>
                    <h4 className="m-0 text-base fw-700 text-1">Review & Launch</h4>
                    <p className="m-0 text-sm text-4 mt-4">Everything looks good — confirm to launch the onboarding.</p>
                  </div>
                  <div className="col gap-12">
                    <div className="p-16 col gap-12" style={{ background: 'var(--bg-page)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div className="row gap-12 align-center">
                        <Mail className="text-primary" size={18} />
                        <span className="fw-700 text-1">Automated Welcome Email</span>
                      </div>
                      <p className="text-sm text-4 m-0">Will be sent to <strong>{wizardCandidate.email}</strong> with day-one instructions and credentials.</p>
                      <label className="row gap-8 align-center" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                        <span className="text-sm fw-600 text-2">Send immediately on launch</span>
                      </label>
                    </div>
                    <div className="p-16 col gap-12" style={{ background: 'var(--bg-page)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div className="row gap-12 align-center">
                        <CheckSquare className="text-primary" size={18} />
                        <span className="fw-700 text-1">Task Assignments</span>
                      </div>
                      <p className="text-sm text-4 m-0">12 tasks generated — 4 for IT, 2 for Manager, 6 for New Hire.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            <div className="row-between align-center" style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              {wizardStep > 1 ? (
                <button className="btn-neutral" onClick={() => setWizardStep(wizardStep - 1)}>← Back</button>
              ) : <span />}
              {wizardStep < 3 ? (
                <button className="btn-primary" onClick={() => setWizardStep(wizardStep + 1)}>Continue →</button>
              ) : (
                <button className="btn-primary row gap-8 align-center" onClick={finishWizard} style={{ boxShadow: '0 4px 12px rgba(162,56,255,0.25)' }}>
                  <Send size={15} /> Launch Onboarding
                </button>
              )}
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
