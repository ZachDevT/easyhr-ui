"use client";

import React, { useState } from 'react';
import { Scale, Plus, AlertCircle, CheckCircle2, Search, XCircle, ChevronRight, Gavel, FileWarning, ArrowRight, FileSignature, Calendar, UserMinus, ShieldAlert } from 'lucide-react';
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

const CASES = [
  { id: 1, employee: 'Mark Spencer', type: 'First Warning', reason: 'Unexcused Absences', status: 'Pending Review', date: 'Oct 14, 2026', severity: 'Low' },
  { id: 2, employee: 'Linda Ray', type: 'Paid Suspension', reason: 'Policy Violation (Security)', status: 'Active Suspension', date: 'Oct 10, 2026', severity: 'High' },
  { id: 3, employee: 'Kevin Heart', type: 'Termination', reason: 'Gross Misconduct', status: 'Processing', date: 'Oct 02, 2026', severity: 'Critical' },
];

export default function EmployeeRelationsPage() {
  const [activeTab, setActiveTab] = useState('Incidents Dashboard');
  
  // Modal State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [actionType, setActionType] = useState('warning'); // warning, suspension, termination
  
  // Dynamic Form State
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payType, setPayType] = useState('without_pay'); // for suspension
  const [severance, setSeverance] = useState('no'); // for termination

  const handleClose = () => {
    setShowWizard(false);
    setTimeout(() => {
      setWizardStep(1);
      setActionType('warning');
    }, 300);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      
      <PageHeader 
        title="Employee Relations"
        subtitle="Securely manage disciplinary actions, suspensions, and terminations."
        icon={<Scale size={28} className="text-white" />}
        tabs={['Incidents Dashboard', 'Terminations', 'Settings']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button className="btn-secondary text-error" onClick={() => setShowWizard(true)} style={{ background: 'white', border: '1px solid var(--error-tint)', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }}>
            <Plus size={16} style={{ marginRight: 8 }}/> New Action
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
        {activeTab === 'Incidents Dashboard' && (
          <div className="col gap-32">
            <StatRibbon 
              stats={[
                { label: 'Active Cases', value: CASES.length, icon: <Scale size={18}/>, color: 'var(--primary)', trend: '-2 vs last month', trendType: 'positive', description: 'Open disciplinary files' },
                { label: 'Suspensions', value: 1, icon: <AlertCircle size={18}/>, color: 'var(--warning)', description: 'Currently suspended' },
                { label: 'Terminations (MTD)', value: 2, icon: <XCircle size={18}/>, color: 'var(--error)', trend: 'Same as last month', trendType: 'neutral', description: 'Month to date' }
              ]}
            />

            <div className="row-between align-center">
              <div className="col gap-4">
                <h2 className="text-xl fw-800 text-1 m-0">Recent Incidents</h2>
                <span className="text-sm text-4 fw-500">{CASES.length} active cases</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '0 16px', height: 40, gap: 10, width: 280, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Search size={15} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search cases..."
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text-1)', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div className="col gap-16">
              {CASES.map(c => (
                <Card key={c.id} style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', cursor: 'pointer' }} className="hover-lift">
                  <CardBody className="p-24" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
                      <Avatar name={c.employee} size="md" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h3 className="m-0 text-lg fw-700 text-1">{c.employee}</h3>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }} className="text-sm text-5">
                          <Badge variant={c.severity === 'Critical' ? 'error' : c.severity === 'High' ? 'warning' : 'neutral'}>{c.type}</Badge>
                          <span>•</span>
                          <span className="fw-600">{c.reason}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span className="text-sm fw-600 text-2">{c.status}</span>
                      <span className="text-xs text-5">Opened {c.date}</span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Terminations' && (
          <div className="col gap-24 align-center justify-center" style={{ minHeight: 400 }}>
            <div className="p-32 text-center col gap-16" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 450 }}>
              <div className="icon-chip" style={{ background: 'var(--error-tint)', color: 'var(--error)', width: 64, height: 64, margin: '0 auto' }}>
                <Gavel size={32} />
              </div>
              <h3 className="m-0 text-xl fw-700 text-1">Termination Workflow</h3>
              <p className="m-0 text-sm text-4">Standardize offboarding with legal checklists, final paycheck calculations, and IT revocation.</p>
              <button onClick={() => { setShowWizard(true); setActionType('termination'); }} className="btn-primary mt-8 bg-error border-none text-white fw-700" style={{ padding: '12px 24px', borderRadius: 8 }}>Process Termination</button>
            </div>
          </div>
        )}
        
        {activeTab === 'Settings' && (
            <div className="p-32 text-center text-4">
              Disciplinary Settings coming soon...
            </div>
        )}
      </div>

      <Modal 
        isOpen={showWizard} 
        onClose={handleClose}
        title="Disciplinary Action Workflow"
        subtitle="Securely record warnings, suspensions, or terminations."
      >
        <div className="col h-100" style={{ padding: '32px' }}>
          
          {/* Progress Indicators */}
          <div className="row gap-8 mb-32">
            {[1, 2, 3].map(step => (
              <div key={step} style={{ height: 4, flex: 1, borderRadius: 2, background: step <= wizardStep ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>

          <div className="flex-1 col">
            {wizardStep === 1 && (
              <div className="col gap-24">
                <div className="col gap-8">
                  <div className="row gap-12 align-center mb-8">
                    <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                      <ShieldAlert size={20} />
                    </div>
                    <h3 className="m-0 text-lg fw-700 text-1">Select Action Type</h3>
                  </div>
                  <p className="m-0 text-sm text-4">Choose the severity of the disciplinary action. Formal documents will be generated automatically for signatures.</p>
                </div>
                
                <div className="col gap-16 mt-8">
                  {[
                    { id: 'warning', icon: <FileWarning size={20}/>, color: 'var(--warning)', title: 'Formal Warning', desc: 'Generate a written warning for the employee file.' },
                    { id: 'suspension', icon: <AlertCircle size={20}/>, color: '#f59e0b', title: 'Suspension', desc: 'Temporarily suspend the employee with or without pay.' },
                    { id: 'termination', icon: <UserMinus size={20}/>, color: 'var(--error)', title: 'Termination', desc: 'Initiate a complete offboarding and termination workflow.' }
                  ].map(type => (
                    <div key={type.id} onClick={() => setActionType(type.id)} className="row gap-16 align-start p-20 hover-lift" style={{ border: actionType === type.id ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', background: actionType === type.id ? '#FAFAFA' : 'white', transition: 'all 0.2s' }}>
                      <div className="icon-chip" style={{ background: 'white', color: type.color, border: '1px solid var(--border)' }}>
                        {type.icon}
                      </div>
                      <div className="col gap-4 flex-1">
                        <span className="fw-700 text-1">{type.title}</span>
                        <span className="text-sm text-4">{type.desc}</span>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: actionType === type.id ? '7px solid var(--primary)' : '2px solid var(--border)', background: 'white', transition: 'all 0.2s' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="col gap-32">
                <div className="col gap-8 mb-8">
                  <h3 className="m-0 text-lg fw-700 text-1">Action Details</h3>
                  <p className="m-0 text-sm text-4">Provide the specifics for this {actionType}.</p>
                </div>

                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Employee</label>
                  <SearchableSelect 
                    value={selectedEmployee}
                    onChange={setSelectedEmployee}
                    placeholder="Select an employee..."
                    searchPlaceholder="Search employees by name or department..."
                    options={[
                      { value: 'mark', label: 'Mark Spencer', description: 'Engineering', avatar: true },
                      { value: 'linda', label: 'Linda Ray', description: 'Sales', avatar: true },
                      { value: 'kevin', label: 'Kevin Heart', description: 'Marketing', avatar: true },
                      { value: 'jessica', label: 'Jessica Smith', description: 'Human Resources', avatar: true }
                    ]}
                  />
                </div>

                {/* DYNAMIC FORM: WARNING */}
                {actionType === 'warning' && (
                  <>
                    <div className="col gap-8">
                      <label className="text-sm fw-600 text-2">Infraction Category</label>
                      <Select>
                        <option>Attendance / Punctuality</option>
                        <option>Performance Issues</option>
                        <option>Code of Conduct Violation</option>
                        <option>Safety Violation</option>
                      </Select>
                    </div>
                    <div className="col gap-8">
                      <label className="text-sm fw-600 text-2">Incident Description</label>
                      <Textarea placeholder="Provide a detailed, objective account of what occurred..." style={{ minHeight: 120, resize: 'vertical' }} />
                    </div>
                  </>
                )}

                {/* DYNAMIC FORM: SUSPENSION */}
                {actionType === 'suspension' && (
                  <>
                    <div className="col gap-8">
                      <label className="text-sm fw-600 text-2">Suspension Type (Pay Status)</label>
                      <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                        <button 
                          onClick={() => setPayType('without_pay')} 
                          style={{ 
                            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: payType === 'without_pay' ? 'white' : 'transparent',
                            color: payType === 'without_pay' ? 'var(--primary)' : 'var(--text-4)',
                            fontWeight: 700, fontSize: 14,
                            boxShadow: payType === 'without_pay' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          Without Pay
                        </button>
                        <button 
                          onClick={() => setPayType('with_pay')} 
                          style={{ 
                            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: payType === 'with_pay' ? 'white' : 'transparent',
                            color: payType === 'with_pay' ? 'var(--primary)' : 'var(--text-4)',
                            fontWeight: 700, fontSize: 14,
                            boxShadow: payType === 'with_pay' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          With Pay (Investigation)
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid-2 gap-16">
                      <div className="col gap-8">
                        <label className="text-sm fw-600 text-2">Start Date</label>
                        <Input type="date" leftIcon={<Calendar size={16} />} />
                      </div>
                      <div className="col gap-8">
                        <label className="text-sm fw-600 text-2">Expected Return</label>
                        <Input type="date" leftIcon={<Calendar size={16} />} />
                      </div>
                    </div>

                    <div className="col gap-8">
                      <label className="text-sm fw-600 text-2">Reason for Suspension</label>
                      <Textarea placeholder="Detail the reasons for this suspension..." style={{ minHeight: 100, resize: 'vertical' }} />
                    </div>
                  </>
                )}

                {/* DYNAMIC FORM: TERMINATION */}
                {actionType === 'termination' && (
                  <>
                    <div className="col gap-8 p-16" style={{ background: 'var(--error-tint)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div className="row gap-8 align-center">
                        <XCircle size={16} className="text-error" />
                        <span className="fw-700 text-error text-sm">Critical Action Notice</span>
                      </div>
                      <p className="m-0 text-sm text-error" style={{ opacity: 0.9 }}>Terminations will immediately trigger offboarding checklists and disable IT access upon the effective date.</p>
                    </div>

                    <div className="grid-2 gap-16">
                      <div className="col gap-8">
                        <label className="text-sm fw-600 text-2">Effective Date</label>
                        <Input type="date" leftIcon={<Calendar size={16} />} />
                      </div>
                      <div className="col gap-8">
                        <label className="text-sm fw-600 text-2">Termination Type</label>
                        <Select>
                          <option>Involuntary (With Cause)</option>
                          <option>Involuntary (Without Cause / Layoff)</option>
                          <option>Voluntary (Resignation)</option>
                        </Select>
                      </div>
                    </div>

                    <div className="col gap-8">
                      <label className="text-sm fw-600 text-2">Severance Package Included?</label>
                      <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                        <button 
                          onClick={() => setSeverance('no')} 
                          style={{ 
                            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: severance === 'no' ? 'white' : 'transparent',
                            color: severance === 'no' ? 'var(--text-1)' : 'var(--text-4)',
                            fontWeight: 700, fontSize: 14,
                            boxShadow: severance === 'no' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          No Severance
                        </button>
                        <button 
                          onClick={() => setSeverance('yes')} 
                          style={{ 
                            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: severance === 'yes' ? 'white' : 'transparent',
                            color: severance === 'yes' ? 'var(--text-1)' : 'var(--text-4)',
                            fontWeight: 700, fontSize: 14,
                            boxShadow: severance === 'yes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          Yes, Include Severance
                        </button>
                      </div>
                    </div>

                    <div className="col gap-8">
                      <label className="text-sm fw-600 text-2">Offboarding Checks</label>
                      <div className="col gap-12 mt-8">
                        <label className="row gap-12 align-center" style={{ cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                          <span className="text-sm fw-500 text-2">Revoke System Access (Email, Slack, VPN)</span>
                        </label>
                        <label className="row gap-12 align-center" style={{ cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                          <span className="text-sm fw-500 text-2">Request Equipment Return (Laptop, Badge)</span>
                        </label>
                        <label className="row gap-12 align-center" style={{ cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                          <span className="text-sm fw-500 text-2">Generate Final Paycheck Notice</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="col gap-24 flex-1 justify-center pb-64">
                <div className="icon-chip" style={{ background: 'var(--success-tint)', color: 'var(--success)', width: 64, height: 64, margin: '0 auto' }}>
                  <CheckCircle2 size={32} />
                </div>
                <div className="text-center col gap-8">
                  <h3 className="m-0 text-xl fw-800 text-1">Ready to Finalize</h3>
                  <p className="m-0 text-sm text-4 leading-relaxed max-w-sm mx-auto">
                    You are about to process a formal <strong>{actionType}</strong>. 
                    Official documents will be generated and routed to the required parties for electronic signature.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="row-between align-center pt-24 border-t border-border mt-auto">
            {wizardStep > 1 ? (
              <button className="btn-neutral" onClick={() => setWizardStep(s => s - 1)}>
                Back
              </button>
            ) : <div/>}
            
            {wizardStep < 3 ? (
              <button className="btn-primary" onClick={() => setWizardStep(s => s + 1)}>
                Continue
              </button>
            ) : (
              <button className="btn-primary" onClick={handleClose} style={{ background: actionType === 'termination' ? 'var(--error)' : 'var(--primary)' }}>
                {actionType === 'termination' ? 'Execute Termination' : 'Generate Documents'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
