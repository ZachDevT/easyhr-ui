"use client";

import { useState } from 'react';
import { CheckCircle2, PlayCircle, FileText, Users, Building, Laptop, ChevronRight, Mail, Phone, Calendar, ArrowRight, ShieldCheck, HelpCircle, Clock } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const TASKS = [
  { id: 1, title: 'Welcome', category: 'Welcome', formType: 'video' },
  { id: 2, title: 'Profile Setup', category: 'HR', formType: 'profile' },
  { id: 3, title: 'Direct Deposit', category: 'Finance', formType: 'bank' },
  { id: 4, title: 'Handbook', category: 'Policy', formType: 'document' },
];

export default function OnboardingPage() {
  const [tasks, setTasks] = useState(TASKS.map(t => ({ ...t, status: t.id === 1 ? 'completed' : 'pending' })));
  const [activeStep, setActiveStep] = useState(1); // 0-indexed for array, but let's use index
  const [paymentMethod, setPaymentMethod] = useState('Bank Account');
  
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  const markCompletedAndNext = (idx: number) => {
    const newTasks = [...tasks];
    newTasks[idx].status = 'completed';
    setTasks(newTasks);
    if (idx < tasks.length - 1) {
      setActiveStep(idx + 1);
    }
  };

  return (
    <div className="page-container" style={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-page)', overflowY: 'auto' }}>
      
      {/* Compact User Header */}
      <Card style={{ marginBottom: 24, background: 'var(--gradient)', color: 'white', border: 'none', borderRadius: 16, flexShrink: 0 }}>
        <CardBody style={{ padding: '24px 32px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row gap-20">
            <div style={{ padding: 4, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', border: '2px solid white' }}>
              <Avatar name="Sarah Johnson" size="xl" src="https://i.pravatar.cc/150?img=47" />
            </div>
            <div>
              <h1 className="text-2xl fw-800 m-0 mb-4" style={{ color: 'white' }}>Welcome aboard, Sarah! 🎉</h1>
              <div className="row gap-16 text-sm fw-500" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <span>HR Administrator</span>
                <span>•</span>
                <span className="row gap-4"><Building size={14}/> New York Office</span>
                <span>•</span>
                <span className="row gap-4"><Calendar size={14}/> Started: Oct 1, 2026</span>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right', minWidth: 200 }}>
            <div className="text-sm fw-600 mb-8" style={{ color: 'rgba(255,255,255,0.9)' }}>Onboarding Progress</div>
            <div className="row gap-12">
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'white', borderRadius: 3, transition: 'width 0.3s ease' }} />
              </div>
              <span className="text-sm fw-700">{progress}%</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid-2 gap-32" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'flex-start' }}>
        
        {/* Main Content Area */}
        <div className="col gap-24">
          
          {/* Horizontal Stepper */}
          <Card style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <CardBody style={{ padding: '20px 24px' }}>
              <div className="row-between">
                {tasks.map((task, idx) => {
                  const isActive = activeStep === idx;
                  const isCompleted = task.status === 'completed';
                  
                  return (
                    <div key={task.id} className="row" style={{ flex: 1, position: 'relative' }}>
                      <div 
                        className="col-center gap-8" 
                        style={{ 
                          flex: 1, 
                          cursor: 'pointer',
                          opacity: (isActive || isCompleted) ? 1 : 0.5,
                          transition: '0.2s'
                        }}
                        onClick={() => setActiveStep(idx)}
                      >
                        <div 
                          className="icon-chip" 
                          style={{ 
                            width: 36, height: 36, 
                            background: isActive ? 'var(--primary-tint)' : isCompleted ? 'var(--success-tint)' : '#F3F4F6',
                            color: isActive ? 'var(--primary)' : isCompleted ? 'var(--success)' : 'var(--text-4)',
                            border: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                            transition: '0.2s'
                          }}
                        >
                          {isCompleted && !isActive ? <CheckCircle2 size={20}/> : <span className="fw-700 text-sm">{idx + 1}</span>}
                        </div>
                        <span className={`text-xs fw-700 ${isActive ? 'text-primary' : isCompleted ? 'text-1' : 'text-4'}`}>{task.title}</span>
                      </div>
                      
                      {idx < tasks.length - 1 && (
                        <div style={{ 
                          position: 'absolute', top: 18, left: '60%', right: '-40%', height: 2, 
                          background: isCompleted ? 'var(--success)' : '#F3F4F6',
                          zIndex: 0
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Active Step Content */}
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardBody style={{ padding: 40, minHeight: 400 }}>
              
              {tasks[activeStep].formType === 'video' && (
                <div className="col gap-32 max-w-2xl mx-auto">
                  <div className="text-center mb-16">
                    <h2 className="text-2xl fw-800 text-1 mb-8">Welcome to EasyHR!</h2>
                    <p className="text-base text-5">Please upload your profile picture and watch the welcome message.</p>
                  </div>
                  
                  <div className="row gap-24 align-center mb-16">
                    <div style={{ position: 'relative' }}>
                      <Avatar name="Sarah Johnson" size="xl" src="https://i.pravatar.cc/150?img=47" />
                      <div className="icon-chip" style={{ position: 'absolute', bottom: -5, right: -5, width: 28, height: 28, border: '2px solid white', cursor: 'pointer' }}>
                        <span className="text-xs fw-700">+</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg fw-700 text-1 mb-4">Profile Picture</h3>
                      <p className="text-sm text-5">Upload a professional photo for your directory profile.</p>
                    </div>
                  </div>
                  
                  <div className="divider m-0" />

                  <div style={{ width: '100%', height: 240, background: '#111', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}>
                    <PlayCircle size={48} className="text-4 hover-scale" style={{ cursor: 'pointer', transition: '0.2s', color: 'white' }} />
                  </div>
                  
                  <div className="row-between mt-16">
                    <button className="btn-neutral" disabled style={{ padding: '10px 24px' }}>Back</button>
                    <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={() => markCompletedAndNext(activeStep)}>
                      Save & Continue <ArrowRight size={16} style={{ marginLeft: 8 }}/>
                    </button>
                  </div>
                </div>
              )}

              {tasks[activeStep].formType === 'profile' && (
                <div className="col gap-32 max-w-2xl mx-auto">
                  <div>
                    <h2 className="text-2xl fw-800 text-1 mb-8">Complete your Profile</h2>
                    <p className="text-base text-5">Please verify your email addresses and provide your emergency contact information.</p>
                  </div>
                  
                  <div className="grid-2 gap-24">
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Personal Email</label>
                      <Input type="email" placeholder="e.g. sarah@gmail.com" defaultValue="sarah.j@gmail.com" />
                    </div>
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Work Email</label>
                      <Input type="email" disabled defaultValue="sarah.johnson@company.com" style={{ background: '#F9FAFB', color: 'var(--text-4)' }} />
                    </div>
                  </div>

                  <div className="divider m-0" />

                  <h3 className="text-lg fw-800 text-1 m-0">Emergency Contact</h3>
                  
                  <div className="grid-2 gap-24">
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Primary Contact Name</label>
                      <Input type="text" placeholder="e.g. Jane Doe" defaultValue="Michael Johnson" />
                    </div>
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Relationship</label>
                      <Input type="text" placeholder="e.g. Spouse" defaultValue="Husband" />
                    </div>
                    <div className="col gap-12" style={{ gridColumn: '1 / -1' }}>
                      <label className="text-sm fw-700 text-1">Phone Number</label>
                      <Input type="tel" placeholder="(555) 000-0000" defaultValue="(555) 123-4567" />
                    </div>
                  </div>
                  
                  <div className="divider m-0" />
                  
                  <div className="row-between mt-8">
                    <button className="btn-neutral" onClick={() => setActiveStep(activeStep - 1)}>Back</button>
                    <button className="btn-primary" onClick={() => markCompletedAndNext(activeStep)}>
                      Save & Continue <ArrowRight size={16} style={{ marginLeft: 8 }}/>
                    </button>
                  </div>
                </div>
              )}

              {tasks[activeStep].formType === 'bank' && (
                <div className="col gap-32 max-w-2xl mx-auto">
                  <div>
                    <h2 className="text-2xl fw-800 text-1 mb-8">Payment Method Setup</h2>
                    <p className="text-base text-5">Add your payment details so we can process your payroll seamlessly.</p>
                  </div>
                  
                  <div className="col gap-24">
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Payment Method</label>
                      <Select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="Bank Account">Bank Account (Direct Deposit)</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="PayPal">PayPal</option>
                      </Select>
                    </div>

                    {paymentMethod === 'Bank Account' && (
                      <div className="col gap-24">
                        <div className="col gap-12">
                          <label className="text-sm fw-700 text-1">Bank Name</label>
                          <Input type="text" placeholder="e.g. Chase Bank" />
                        </div>
                        <div className="grid-2 gap-24">
                          <div className="col gap-12">
                            <label className="text-sm fw-700 text-1">Routing Number</label>
                            <Input type="text" placeholder="9 digit routing number" />
                          </div>
                          <div className="col gap-12">
                            <label className="text-sm fw-700 text-1">Account Number</label>
                            <Input type="password" placeholder="Account number" />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'Mobile Money' && (
                      <div className="col gap-24">
                        <div className="col gap-12">
                          <label className="text-sm fw-700 text-1">Provider</label>
                          <Select>
                            <option>MTN Mobile Money</option>
                            <option>Airtel Money</option>
                            <option>M-Pesa</option>
                            <option>Orange Money</option>
                          </Select>
                        </div>
                        <div className="col gap-12">
                          <label className="text-sm fw-700 text-1">Registered Mobile Number</label>
                          <Input type="tel" placeholder="e.g. +250 788 123 456" />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'PayPal' && (
                      <div className="col gap-24">
                        <div className="col gap-12">
                          <label className="text-sm fw-700 text-1">PayPal Email Address</label>
                          <Input type="email" placeholder="e.g. sarah@example.com" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-16 text-sm text-5 row gap-12" style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <ShieldCheck size={20} className="text-success" />
                    <span>Your payment information is encrypted and stored securely.</span>
                  </div>

                  <div className="divider m-0" />
                  
                  <div className="row-between mt-8">
                    <button className="btn-neutral" onClick={() => setActiveStep(activeStep - 1)}>Back</button>
                    <button className="btn-primary" onClick={() => markCompletedAndNext(activeStep)}>
                      Authorize Deposit <ArrowRight size={16} style={{ marginLeft: 8 }}/>
                    </button>
                  </div>
                </div>
              )}

              {tasks[activeStep].formType === 'document' && (
                <div className="col gap-32 max-w-2xl mx-auto">
                  <div>
                    <h2 className="text-2xl fw-800 text-1 mb-8">Employee Handbook</h2>
                    <p className="text-base text-5">Please read and acknowledge the company handbook.</p>
                  </div>
                  
                  <div className="p-32 row gap-24" style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div className="icon-chip" style={{ width: 64, height: 64, background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                      <FileText size={32} />
                    </div>
                    <div className="col gap-12">
                      <div>
                        <h4 className="text-lg fw-700 text-1 m-0 mb-4">EasyHR Handbook 2026.pdf</h4>
                        <div className="text-sm text-5">32 pages • Last updated Oct 1, 2026</div>
                      </div>
                      <div>
                        <button className="btn-secondary btn-sm row gap-8 fw-600"><FileText size={14}/> Read Document</button>
                      </div>
                    </div>
                  </div>
                  
                  <label className="row gap-12 p-16 mt-8" style={{ background: 'var(--bg-page)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)' }}>
                    <input type="checkbox" style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <span className="text-sm fw-600 text-1" style={{ lineHeight: 1.4 }}>I acknowledge that I have read and agree to the policies within the handbook.</span>
                  </label>

                  <div className="divider m-0" />
                  
                  <div className="row-between mt-8">
                    <button className="btn-neutral" onClick={() => setActiveStep(activeStep - 1)}>Back</button>
                    <button className="btn-primary" onClick={() => markCompletedAndNext(activeStep)}>
                      Sign & Complete <ArrowRight size={16} style={{ marginLeft: 8 }}/>
                    </button>
                  </div>
                </div>
              )}

            </CardBody>
          </Card>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="col gap-24">
          
          <Card style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-base fw-700 text-1 row gap-12"><Laptop size={18} className="text-primary"/> IT Provisioning</h3>
            </div>
            <CardBody style={{ padding: 24 }}>
              <div className="col gap-20">
                <div className="row gap-12 text-sm">
                  <CheckCircle2 size={18} className="text-success"/> <span className="text-1 fw-600">MacBook Pro 14" Shipped</span>
                </div>
                <div className="row gap-12 text-sm">
                  <CheckCircle2 size={18} className="text-success"/> <span className="text-1 fw-600">Google Workspace Account</span>
                </div>
                <div className="row gap-12 text-sm">
                  <CheckCircle2 size={18} className="text-success"/> <span className="text-1 fw-600">Slack Access</span>
                </div>
                <div className="row gap-12 text-sm">
                  <Clock size={18} className="text-warning"/> <span className="text-1 fw-600">Security Badge</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-base fw-700 text-1 row gap-12"><Users size={18} className="text-primary"/> Your Support Team</h3>
            </div>
            <CardBody style={{ padding: 24 }}>
              <div className="col gap-20">
                <div>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-8">Manager</div>
                  <div className="row gap-12 p-12" style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <Avatar name="David Kim" size="sm" />
                    <div>
                      <div className="text-sm fw-700 text-1">David Kim</div>
                      <div className="text-xs text-5">VP of HR</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs fw-700 text-5 uppercase tracking-wider mb-8">Onboarding Buddy</div>
                  <div className="row gap-12 p-12" style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <Avatar name="Jessica Smith" size="sm" />
                    <div>
                      <div className="text-sm fw-700 text-1">Jessica Smith</div>
                      <div className="text-xs text-5">HR Business Partner</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
}
