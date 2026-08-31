"use client";

import React, { useState, useEffect } from 'react';
import { Network, Plus, Search, MoreHorizontal, Users, Briefcase, ChevronRight, Building, ArrowLeft, UserCircle, DollarSign, Edit3, Shield, X, MapPin, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { CurrencySelect, CURRENCIES } from '@/components/ui/CurrencySelect';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const DEPARTMENTS = [
  { id: 1, name: 'Engineering', head: 'Sarah Johnson', headcount: 45, openRoles: 12, activeRoles: 8, status: 'Healthy', bgColor: '#E8F0FE', color: '#1A73E8' },
  { id: 2, name: 'Sales', head: 'Michael Chang', headcount: 28, openRoles: 4, activeRoles: 5, status: 'Growing', bgColor: '#FCE8E6', color: '#EA4335' },
  { id: 3, name: 'Product', head: 'Elena Rodriguez', headcount: 14, openRoles: 2, activeRoles: 4, status: 'Stable', bgColor: '#FEF7E0', color: '#F9AB00' },
  { id: 4, name: 'Marketing', head: 'David Kim', headcount: 18, openRoles: 1, activeRoles: 6, status: 'Stable', bgColor: '#E6F4EA', color: '#34A853' },
  { id: 5, name: 'People (HR)', head: 'Jessica Smith', headcount: 6, openRoles: 0, activeRoles: 3, status: 'Stable', bgColor: '#F3E8FD', color: '#9334E6' },
];

const MOCK_PEOPLE = [
  { id: 1, name: 'Alex Johnson', role: 'Frontend Team Lead', manager: 'Sarah Johnson', location: 'New York, USA' },
  { id: 2, name: 'Wei Chen', role: 'Senior Backend Engineer', manager: 'Alex Johnson', location: 'Remote, CA' },
  { id: 3, name: 'Maria Garcia', role: 'QA Tester', manager: 'Sarah Johnson', location: 'Austin, TX' },
];

const MOCK_ROLES = [
  { id: 1, title: 'Frontend Team Lead', level: 'Lead', reportsTo: 'VP Engineering', payType: 'Salaried', currency: 'USD', min: '120k', max: '150k' },
  { id: 2, title: 'Senior Backend Engineer', level: 'Senior', reportsTo: 'Engineering Manager', payType: 'Salaried', currency: 'USD', min: '110k', max: '140k' },
  { id: 3, title: 'QA Tester', level: 'Mid', reportsTo: 'QA Manager', payType: 'Hourly', currency: 'CAD', min: '45/hr', max: '65/hr' },
];

export default function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState('Directory');
  const [selectedDept, setSelectedDept] = useState<any>(null);
  
  // Department Detail State
  const [deptTab, setDeptTab] = useState('People');
  
  // Role Wizard State
  const [showRoleWizard, setShowRoleWizard] = useState(false);
  const [roleStep, setRoleStep] = useState(1);
  const [roleType, setRoleType] = useState('Salaried'); // Salaried or Hourly
  const [currency, setCurrency] = useState('CAD');

  if (selectedDept) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
        
        {/* Deep Department Header */}
        <div style={{ background: 'white', padding: '32px 40px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Breadcrumb Navigation */}
          <div className="row gap-8 align-center text-sm fw-600">
            <button onClick={() => setSelectedDept(null)} className="text-4 hover-text-1" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={16} /> Directory
            </button>
            <span className="text-border">/</span>
            <span className="text-1">{selectedDept.name}</span>
          </div>

          {/* Main Header Info */}
          <div className="row-between align-center" style={{ marginTop: 8 }}>
            <div className="row gap-20 align-center">
              {/* Hanging Avatar */}
              <div style={{ width: 72, height: 72, borderRadius: 16, background: selectedDept.bgColor, color: selectedDept.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                <Network size={36} />
              </div>
              
              {/* Text Block */}
              <div className="col gap-6">
                <h1 className="m-0 text-3xl fw-800 text-1" style={{ letterSpacing: '-0.5px' }}>{selectedDept.name} Department</h1>
                <div className="row gap-16 align-center text-sm text-5 fw-600">
                  <span className="row gap-6 align-center"><UserCircle size={16} className="text-4"/> Head: {selectedDept.head}</span>
                  <span style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--border)' }} />
                  <span className="row gap-6 align-center"><Users size={16} className="text-4"/> {selectedDept.headcount} Employees</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {deptTab === 'Roles' && (
              <button className="btn-primary row gap-8 align-center" onClick={() => { setShowRoleWizard(true); setRoleStep(1); }} style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--text-1)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={16} /> Create Role
              </button>
            )}
          </div>

          {/* Tabs - Aligned with Text via Left Margin (72px avatar + 20px gap = 92px) */}
          <div className="row gap-4" style={{ marginLeft: 92, marginTop: 16 }}>
            {['People', 'Roles', 'Hierarchy'].map(tab => (
              <button 
                key={tab}
                onClick={() => setDeptTab(tab)}
                style={{ 
                  background: deptTab === tab ? 'var(--bg-page)' : 'transparent',
                  color: deptTab === tab ? 'var(--primary)' : 'var(--text-3)',
                  border: 'none',
                  padding: '12px 24px',
                  fontSize: 14,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  cursor: 'pointer',
                  fontWeight: deptTab === tab ? 700 : 500,
                  transition: 'all 0.2s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'var(--bg-page)' }}>
          {deptTab === 'People' && (
            <div className="col gap-24">
               <div className="row-between align-center">
                 <div className="col gap-4">
                   <h2 className="text-lg fw-700 text-1 m-0">Department Roster</h2>
                   <span className="text-sm text-4 fw-500">{MOCK_PEOPLE.length} members</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '0 16px', height: 40, gap: 10, width: 260, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                   <Search size={15} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                   <input
                     type="text"
                     placeholder="Search people..."
                     style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text-1)', fontFamily: 'inherit' }}
                   />
                 </div>
               </div>
               
               <Card style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                 <CardBody className="p-0">
                   <div className="grid-4 p-16 border-b border-border bg-neutral text-xs fw-700 text-4 uppercase tracking-wider">
                     <div>Employee</div>
                     <div>Role</div>
                     <div>Reports To</div>
                     <div>Location</div>
                   </div>
                   {MOCK_PEOPLE.map((p, idx) => (
                     <div key={p.id} className="grid-4 p-16 border-b border-border align-center hover-bg-neutral" style={{ cursor: 'pointer' }}>
                       <div className="row gap-12 align-center">
                         <Avatar name={p.name} size="sm" />
                         <span className="fw-600 text-1">{p.name}</span>
                       </div>
                       <div className="text-sm fw-600 text-2">{p.role}</div>
                       <div className="text-sm text-5">{p.manager}</div>
                       <div className="row gap-4 align-center text-sm text-5"><MapPin size={14}/> {p.location}</div>
                     </div>
                   ))}
                 </CardBody>
               </Card>
            </div>
          )}

          {deptTab === 'Roles' && (
            <div className="col gap-24">
               <h2 className="text-lg fw-700 text-1 m-0">Defined Roles & Compensation Structure</h2>
               
               <div className="grid-3 gap-24">
                 {MOCK_ROLES.map(role => (
                   <Card key={role.id} style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                     <CardBody className="p-24 col gap-16">
                       <div className="row-between align-start">
                         <div className="col gap-4">
                           <h3 className="m-0 text-lg fw-700 text-1">{role.title}</h3>
                           <Badge variant={role.level === 'Lead' || role.level === 'Executive' ? 'primary' : 'neutral'}>{role.level} Level</Badge>
                         </div>
                         <button className="btn-neutral" style={{ padding: 6, borderRadius: 6 }}><Edit3 size={16}/></button>
                       </div>
                       
                       <div className="col gap-12 pt-16 mt-8" style={{ borderTop: '1px dashed var(--border)' }}>
                         <div className="row-between align-center text-sm">
                           <span className="text-4 fw-600">Reports To</span>
                           <span className="text-1 fw-700">{role.reportsTo}</span>
                         </div>
                         <div className="row-between align-center text-sm">
                           <span className="text-4 fw-600">Pay Type</span>
                           <span className="text-1 fw-700">{role.payType}</span>
                         </div>
                         <div className="row-between align-center text-sm">
                           <span className="text-4 fw-600">Salary Band ({role.currency})</span>
                           <div className="row gap-4 align-center text-success fw-700">
                             <DollarSign size={14}/> {role.min} - {role.max}
                           </div>
                         </div>
                       </div>
                     </CardBody>
                   </Card>
                 ))}
               </div>
            </div>
          )}

          {deptTab === 'Hierarchy' && (
            <div className="col gap-24 align-center justify-center" style={{ minHeight: 400 }}>
              <div className="p-32 text-center col gap-16" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 400 }}>
                <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)', width: 64, height: 64, margin: '0 auto' }}>
                  <Network size={32} />
                </div>
                <h3 className="m-0 text-xl fw-700 text-1">Interactive Org Chart</h3>
                <p className="m-0 text-sm text-4">Visualizing the department reporting structure requires the advanced charting module. This will be available in the next release.</p>
              </div>
            </div>
          )}
        </div>

        {/* CREATE ROLE SLIDE-OVER PANEL */}
        <Modal 
          isOpen={showRoleWizard} 
          onClose={() => setShowRoleWizard(false)}
          title="Create New Role"
          subtitle={`For ${selectedDept.name} Department`}
          footer={
            <>
              {roleStep > 1 ? (
                <button className="btn-neutral" onClick={() => setRoleStep(roleStep - 1)}>Back</button>
              ) : <div></div>}
              
              {roleStep < 3 ? (
                <button className="btn-primary" onClick={() => setRoleStep(roleStep + 1)}>Continue</button>
              ) : (
                <button className="btn-primary row gap-8 align-center" onClick={() => setShowRoleWizard(false)}>
                  Save Role
                </button>
              )}
            </>
          }
        >
          {/* Progress Steps */}
          <div className="row gap-8 mb-24">
            {[1, 2, 3].map(step => (
              <div key={step} style={{ flex: 1, height: 4, borderRadius: 2, background: roleStep >= step ? 'var(--primary)' : 'var(--card-border)', transition: 'background 0.3s' }} />
            ))}
          </div>

          {roleStep === 1 && (
            <div className="col gap-24">
              <div className="row gap-12 align-center mb-8">
                <Briefcase className="text-primary" size={24} />
                <h4 className="m-0 text-lg fw-700 text-1">Step 1: Core Details & Hierarchy</h4>
              </div>
              
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Role Title</label>
                <Input type="text" placeholder="e.g. Senior Product Designer" />
              </div>
              
              <div className="grid-2 gap-16">
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Level</label>
                  <Select>
                    <option>Junior</option>
                    <option>Mid</option>
                    <option>Senior</option>
                    <option>Lead</option>
                    <option>Executive</option>
                  </Select>
                </div>
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Reports To (Manager Role)</label>
                  <Select>
                    <option>VP Engineering</option>
                    <option>Engineering Manager</option>
                    <option>Team Lead</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {roleStep === 2 && (
            <div className="col gap-24">
              <div className="row gap-12 align-center mb-8">
                <DollarSign className="text-primary" size={24} />
                <h4 className="m-0 text-lg fw-700 text-1">Step 2: Base Compensation</h4>
              </div>
              
              <div className="grid-2 gap-16">
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Payment Type</label>
                  <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <button 
                      onClick={() => setRoleType('Salaried')} 
                      style={{ 
                        flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: roleType === 'Salaried' ? 'white' : 'transparent',
                        color: roleType === 'Salaried' ? 'var(--primary)' : 'var(--text-4)',
                        fontWeight: 700, fontSize: 14,
                        boxShadow: roleType === 'Salaried' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      Salaried
                    </button>
                    <button 
                      onClick={() => setRoleType('Hourly')} 
                      style={{ 
                        flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: roleType === 'Hourly' ? 'white' : 'transparent',
                        color: roleType === 'Hourly' ? 'var(--primary)' : 'var(--text-4)',
                        fontWeight: 700, fontSize: 14,
                        boxShadow: roleType === 'Hourly' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      Hourly
                    </button>
                  </div>
                </div>
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Currency</label>
                  <CurrencySelect value={currency} onChange={setCurrency} />
                </div>
              </div>

              {roleType === 'Hourly' ? (
                <div className="col gap-8 mt-8">
                  <label className="text-sm fw-600 text-2">Hourly Rate</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 45.00" 
                    leftIcon={<span className="fw-700">{CURRENCIES.find(c => c.code === currency)?.symbol || '$'}</span>} 
                  />
                </div>
              ) : (
                <div className="col gap-8 mt-8">
                  <label className="text-sm fw-600 text-2">Salary Band (Range)</label>
                  <div className="row gap-16 align-center">
                    <Input 
                      type="number" 
                      placeholder="Min" 
                      leftIcon={<span className="fw-700">{CURRENCIES.find(c => c.code === currency)?.symbol || '$'}</span>} 
                    />
                    <span className="text-4 fw-600">to</span>
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      leftIcon={<span className="fw-700">{CURRENCIES.find(c => c.code === currency)?.symbol || '$'}</span>} 
                    />
                  </div>
                  <span className="text-xs text-5 mt-4">Defining salary bands allows for negotiation and seniority variance within the same role.</span>
                </div>
              )}
            </div>
          )}

          {roleStep === 3 && (
            <div className="col gap-24">
              <div className="row gap-12 align-center mb-8">
                <Clock className="text-primary" size={24} />
                <h4 className="m-0 text-lg fw-700 text-1">Step 3: Overtime & Holidays</h4>
              </div>
              
              <div className="p-20 bg-neutral border border-border" style={{ borderRadius: 12 }}>
                <div className="row-between align-center mb-16">
                  <div className="col gap-4">
                    <span className="fw-700 text-1">Overtime Eligibility (Non-Exempt)</span>
                    <span className="text-xs text-5">Allow this role to log and be paid for overtime hours.</span>
                  </div>
                  <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
                </div>
                <div className="grid-2 gap-16 border-t border-border pt-16">
                  <div className="col gap-8">
                    <label className="text-xs fw-700 text-2 text-uppercase">Overtime Multiplier</label>
                    <Input 
                      type="number" 
                      defaultValue="1.5" 
                      step="0.1" 
                      rightIcon={<span className="fw-700">x</span>} 
                    />
                  </div>
                  <div className="col gap-8">
                    <label className="text-xs fw-700 text-2 text-uppercase">Double Time (Holidays)</label>
                    <Input 
                      type="number" 
                      defaultValue="2.0" 
                      step="0.1" 
                      rightIcon={<span className="fw-700">x</span>} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid-2 gap-16">
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Holiday Pay Eligibility</label>
                  <Select>
                    <option>Yes (Paid Holidays)</option>
                    <option>No (Unpaid)</option>
                  </Select>
                </div>
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Max Weekly Extra Hours</label>
                  <Input type="number" placeholder="e.g. 10" defaultValue="15" />
                </div>
              </div>
            </div>
          )}
        </Modal>

      </div>
    );
  }

  // DIRECTORY VIEW
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader 
        title="Departments"
        subtitle="Manage company structure, roles, and compensation bands."
        icon={<Network size={28} className="text-white" />}
        tabs={['Directory', 'Org Chart']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <a href="/departments/new" className="btn-secondary row gap-8 align-center" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20, textDecoration: 'none' }}>
            <Plus size={16} /> New Department
          </a>
        }
      />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
        
        {activeTab === 'Directory' && (
          <div className="col gap-32">
            
            <StatRibbon 
              stats={[
                { label: 'Total Departments', value: DEPARTMENTS.length, icon: <Building size={18}/>, color: 'var(--primary)', trend: '+1', trendType: 'positive', description: 'vs last quarter' },
                { label: 'Total Headcount',   value: 111,                icon: <Users size={18}/>,    color: 'var(--success)', trend: '+6',  trendType: 'positive', description: 'New hires this month' },
                { label: 'Active Roles',      value: 26,                 icon: <Shield size={18}/>,   color: 'var(--text-1)', description: 'Across all departments' },
                { label: 'Open Roles',        value: 19,                 icon: <Briefcase size={18}/>,color: 'var(--warning)', trend: '+3', trendType: 'negative', description: 'Positions to fill' }
              ]}
            />

            <div className="row-between align-center">
              <div className="col gap-4">
                <h2 className="text-xl fw-800 text-1 m-0">Department Directory</h2>
                <span className="text-sm text-4 fw-500">{DEPARTMENTS.length} departments</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '0 16px', height: 40, gap: 10, width: 280, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Search size={15} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search departments..."
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text-1)', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div className="grid-3 gap-24">
              {DEPARTMENTS.map(dept => (
                <Card key={dept.id} onClick={() => setSelectedDept(dept)} style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'transform 0.2s' }} className="hover-lift">
                  <CardBody className="p-24 col gap-20">
                    <div className="row-between align-start">
                      <div className="row gap-12 align-center">
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: dept.bgColor, color: dept.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Network size={24} />
                        </div>
                        <div>
                          <h3 className="m-0 text-lg fw-700 text-1">{dept.name}</h3>
                          <span className="text-xs text-5 fw-600">Head: {dept.head}</span>
                        </div>
                      </div>
                      <button className="btn-neutral" onClick={(e) => { e.stopPropagation(); }} style={{ padding: 4, borderRadius: 6 }}><MoreHorizontal size={16}/></button>
                    </div>

                    <div className="grid-3 gap-12 pt-16" style={{ borderTop: '1px dashed var(--border)' }}>
                      <div className="col gap-4">
                        <span className="text-xs text-4 fw-600 uppercase">Headcount</span>
                        <span className="text-lg fw-800 text-1">{dept.headcount}</span>
                      </div>
                      <div className="col gap-4">
                        <span className="text-xs text-4 fw-600 uppercase">Roles</span>
                        <span className="text-lg fw-800 text-1">{dept.activeRoles}</span>
                      </div>
                      <div className="col gap-4">
                        <span className="text-xs text-4 fw-600 uppercase">Openings</span>
                        <span className="text-lg fw-800 text-warning">{dept.openRoles}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Org Chart' && (
          <div className="col gap-24 align-center justify-center" style={{ minHeight: 400 }}>
            <div className="p-32 text-center col gap-16" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 400 }}>
              <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)', width: 64, height: 64, margin: '0 auto' }}>
                <Network size={32} />
              </div>
              <h3 className="m-0 text-xl fw-700 text-1">Interactive Org Chart</h3>
              <p className="m-0 text-sm text-4">Visualizing the company reporting structure requires the advanced charting module. This will be available in the next release.</p>
              <button className="btn-primary mt-8" style={{ background: 'var(--gradient)', border: 'none', padding: '12px 24px', borderRadius: 8, color: 'white', fontWeight: 600 }}>Enable Org Chart Plugin</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
