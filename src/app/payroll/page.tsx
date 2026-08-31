"use client";

import { useState } from 'react';
import { DollarSign, Clock, FileText, CheckCircle2, ChevronRight, Download, Filter, Search, Settings, Building, AlertCircle, Edit3, Save } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { payrollData } from '@/data/timeData';
import { PageHeader } from '@/components/layout/PageHeader';

const TABS = ['Overview', 'Run Payroll', 'Paystubs', 'Settings'];
const WIZARD_STEPS = ['Review Hours', 'Adjustments', 'Taxes & Deductions', 'Review & Fund'];

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [wizardStep, setWizardStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollRun, setPayrollRun] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const handleRunPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPayrollRun(true);
      setActiveTab('Overview');
      setWizardStep(0);
    }, 2000);
  };

  const renderOverview = () => (
    <div>
      <div className="row-between mb-32">
        <div>
          <h2 className="text-2xl fw-800 text-1">Payroll Dashboard</h2>
          <p className="text-base text-4 mt-4">Current Cycle: Sep 16 - Sep 30, 2026</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('Run Payroll')}>
          Run Payroll
        </button>
      </div>

      <div className="grid-3 mb-40 gap-24">
        <Card style={{ background: 'var(--primary-tint)', border: '1px solid var(--primary)', borderColor: 'rgba(162, 56, 255, 0.3)', boxShadow: '0 8px 24px rgba(162, 56, 255, 0.15)' }}>
          <CardBody style={{ padding: 24 }}>
            <div className="text-sm fw-700 text-primary mb-12 text-uppercase tracking-wider">Total Cash Required</div>
            <div className="text-4xl fw-800 text-primary mb-8">$124,500.00</div>
            <div className="text-xs fw-700 text-primary row gap-8"><AlertCircle size={14}/> Due by Oct 2, 2026</div>
          </CardBody>
        </Card>
        <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <CardBody style={{ padding: 24 }}>
            <div className="text-sm fw-700 text-5 mb-12 text-uppercase tracking-wider">Net Pay</div>
            <div className="text-4xl fw-800 text-1 mb-8">$92,350.00</div>
            <div className="text-xs fw-600 text-5">To 42 Employees</div>
          </CardBody>
        </Card>
        <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <CardBody style={{ padding: 24 }}>
            <div className="text-sm fw-700 text-5 mb-12 text-uppercase tracking-wider">Taxes & Deductions</div>
            <div className="text-4xl fw-800 text-1 mb-8">$32,150.00</div>
            <div className="text-xs fw-600 text-5">Employer & Employee Total</div>
          </CardBody>
        </Card>
      </div>

      <h3 className="text-xl fw-800 text-1 mb-24">Year-to-Date Summary</h3>
      <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <CardBody style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#F9FAFB', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Category</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Q1</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Q2</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Q3 (To Date)</th>
                <th style={{ padding: '20px 32px', fontWeight: 700, textAlign: 'right' }}>YTD Total</th>
              </tr>
            </thead>
            <tbody>
              {['Gross Payroll', 'Employer Taxes', 'Benefits Contributions', 'Total Company Cost'].map((row, i) => (
                <tr key={i} style={{ borderBottom: i === 3 ? 'none' : '1px solid var(--border)' }}>
                  <td style={{ padding: '20px 32px', fontWeight: i === 3 ? 800 : 600, fontSize: 15 }}>{row}</td>
                  <td style={{ padding: '20px 32px', fontSize: 15 }}>$350,000</td>
                  <td style={{ padding: '20px 32px', fontSize: 15 }}>$365,000</td>
                  <td style={{ padding: '20px 32px', fontSize: 15 }}>$380,000</td>
                  <td style={{ padding: '20px 32px', textAlign: 'right', fontWeight: 800, fontSize: 15, color: i === 3 ? 'var(--primary)' : 'inherit' }}>$1,095,000</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );

  const renderWizard = () => (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="row-between mb-32">
        <h2 className="text-2xl fw-800 text-1">Run Payroll (Sep 16 - Sep 30)</h2>
        <button className="btn-neutral" onClick={() => setActiveTab('Overview')}>Save & Exit</button>
      </div>

      {/* Stepper */}
      <div className="row mb-32" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        {WIZARD_STEPS.map((step, idx) => (
          <div key={idx} className="row" style={{ flex: 1 }}>
            <div className="row gap-12" style={{ opacity: wizardStep === idx ? 1 : 0.5 }}>
              <div className="icon-chip" style={{ width: 32, height: 32, background: wizardStep >= idx ? 'var(--primary)' : '#F3F4F6', color: wizardStep >= idx ? 'white' : 'var(--text-4)' }}>
                {wizardStep > idx ? <CheckCircle2 size={16}/> : <span className="fw-700">{idx + 1}</span>}
              </div>
              <span className="text-sm fw-700 text-1">{step}</span>
            </div>
            {idx < WIZARD_STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: wizardStep > idx ? 'var(--primary)' : 'var(--border)', margin: '0 24px' }} />}
          </div>
        ))}
      </div>

      {/* Wizard Card Container */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: 48, minHeight: 450 }}>
          
          {/* STEP 1 */}
          {wizardStep === 0 && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-xl fw-800 text-1 mb-8">Review & Edit Timesheets</h3>
                  <p className="text-base text-5">Adjust any incorrect hours before proceeding. All edits are audited.</p>
                </div>
                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 20, padding: '10px 20px', width: 250 }}>
                  <Search size={16} className="text-4" style={{ marginRight: 8 }} />
                  <input type="text" placeholder="Search employees..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
                </div>
              </div>
              
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#F9FAFB' }}>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                      <th style={{ padding: '16px 24px', fontWeight: 700 }}>Employee</th>
                      <th style={{ padding: '16px 24px', fontWeight: 700 }}>Regular</th>
                      <th style={{ padding: '16px 24px', fontWeight: 700 }}>Overtime</th>
                      <th style={{ padding: '16px 24px', fontWeight: 700 }}>PTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.slice(0, 5).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div className="row gap-16">
                            <Avatar src={r.avatar} name={r.name} size="md" />
                            <span className="text-base fw-700 text-1">{r.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div className="input" style={{ width: 80, padding: 8, display: 'inline-block', textAlign: 'center' }}>{r.regular}h</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div className="input" style={{ width: 80, padding: 8, display: 'inline-block', textAlign: 'center', color: r.overtime > 0 ? 'var(--warning)' : 'inherit', borderColor: r.overtime > 0 ? 'var(--warning)' : 'var(--border)' }}>{r.overtime}h</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div className="input" style={{ width: 80, padding: 8, display: 'inline-block', textAlign: 'center' }}>{r.pto}h</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {wizardStep === 1 && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-xl fw-800 text-1 mb-8">Bonuses & Adjustments</h3>
                  <p className="text-base text-5">Add one-time bonuses, commissions, or expense reimbursements.</p>
                </div>
              </div>
              
              <div className="row-between p-24 mb-24" style={{ border: '2px dashed var(--border)', borderRadius: 12 }}>
                <div className="row gap-20">
                  <Avatar name="Wei Chen" size="md" />
                  <div>
                    <div className="text-base fw-700 text-1 mb-4">Wei Chen</div>
                    <Badge variant="success">Sign-on Bonus</Badge>
                  </div>
                </div>
                <div className="text-xl fw-800 text-success">+$5,000.00</div>
              </div>
              <button className="btn-secondary w-full" style={{ padding: 16, borderStyle: 'dashed', borderWidth: 2, fontSize: 15, fontWeight: 700 }}>+ Add New Adjustment</button>
            </div>
          )}

          {/* STEP 3 */}
          {wizardStep === 2 && (
            <div>
              <div className="row-between mb-24">
                <div>
                  <h3 className="text-xl fw-800 text-1 mb-8">Taxes & Deductions Preview</h3>
                  <p className="text-base text-5">A breakdown of estimated employer and employee liabilities.</p>
                </div>
              </div>
              <div className="grid-2 gap-32">
                <div className="p-32" style={{ background: '#F9FAFB', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <h4 className="text-base fw-800 text-1 mb-24">Employee Deductions</h4>
                  <div className="row-between text-base mb-16"><span className="text-4">Federal Income Tax</span> <span className="fw-700">-$18,400.00</span></div>
                  <div className="row-between text-base mb-16"><span className="text-4">State Income Tax</span> <span className="fw-700">-$6,200.00</span></div>
                  <div className="row-between text-base mb-16"><span className="text-4">Health Insurance</span> <span className="fw-700">-$4,100.00</span></div>
                  <div className="row-between text-base"><span className="text-4">401(k) Contributions</span> <span className="fw-700">-$3,450.00</span></div>
                </div>
                <div className="p-32" style={{ background: '#F9FAFB', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <h4 className="text-base fw-800 text-1 mb-24">Employer Taxes</h4>
                  <div className="row-between text-base mb-16"><span className="text-4">Social Security (FICA)</span> <span className="fw-700">$7,719.00</span></div>
                  <div className="row-between text-base mb-16"><span className="text-4">Medicare</span> <span className="fw-700">$1,805.00</span></div>
                  <div className="row-between text-base"><span className="text-4">FUTA (Unemployment)</span> <span className="fw-700">$420.00</span></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {wizardStep === 3 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="icon-chip mx-auto mb-32" style={{ width: 100, height: 100, background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                <DollarSign size={48} />
              </div>
              <h3 className="text-3xl fw-800 text-1 mb-12">Ready to Fund?</h3>
              <p className="text-base text-5 mb-40 max-w-md mx-auto" style={{ lineHeight: 1.6 }}>
                By running payroll, <strong>$124,500.00</strong> will be debited from your primary company bank account ending in ****1234 on Oct 1, 2026.
              </p>
              
              <div className="p-32 mx-auto" style={{ background: '#F9FAFB', borderRadius: 12, border: '1px solid var(--border)', maxWidth: 400, textAlign: 'left' }}>
                <div className="row-between text-base mb-16"><span className="text-4">Direct Deposits (42)</span> <span className="fw-700">$92,350.00</span></div>
                <div className="row-between text-base mb-16"><span className="text-4">Tax Payments</span> <span className="fw-700">$32,150.00</span></div>
                <div className="divider my-16"/>
                <div className="row-between text-xl fw-800 text-1"><span>Total Debit</span> <span>$124,500.00</span></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="card-header row-between" style={{ background: '#F9FAFB', borderTop: '1px solid var(--border)', padding: '24px 48px' }}>
          <button className="btn-neutral" onClick={() => setWizardStep(Math.max(0, wizardStep - 1))} disabled={wizardStep === 0} style={{ padding: '12px 24px', fontSize: 15 }}>
            Back
          </button>
          
          {wizardStep < 3 ? (
            <button className="btn-primary" onClick={() => setWizardStep(wizardStep + 1)} style={{ padding: '12px 32px', fontSize: 15 }}>
              Continue to {WIZARD_STEPS[wizardStep + 1]} <ChevronRight size={18}/>
            </button>
          ) : (
            <button className="btn-primary" onClick={handleRunPayroll} disabled={isProcessing} style={{ padding: '12px 40px', fontSize: 16, background: 'var(--success)' }}>
              {isProcessing ? 'Processing...' : 'Submit Payroll'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      {/* Top Banner */}
      <PageHeader 
        title="Payroll System"
        subtitle="Manage payroll cycles, taxes, and settings."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '48px', background: 'var(--bg-page)' }}>
        {payrollRun && activeTab === 'Overview' && (
          <div className="mb-40 p-24 row gap-20" style={{ background: 'var(--success-tint)', border: '1px solid var(--success)', borderRadius: 12, color: 'var(--success)' }}>
            <CheckCircle2 size={32} />
            <div>
              <div className="text-lg fw-800">Payroll Submitted Successfully!</div>
              <div className="text-sm mt-4 fw-600">Funds will be debited on Oct 1, 2026. Direct deposits clear on Oct 3.</div>
            </div>
          </div>
        )}
        
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Run Payroll' && renderWizard()}
        
        {activeTab === 'Paystubs' && (
          <div>
            <h2 className="text-2xl fw-800 text-1 mb-32">Paystub History</h2>
            <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <CardBody style={{ padding: 0 }}>
                {['Sep 1 - Sep 15, 2026', 'Aug 16 - Aug 31, 2026', 'Aug 1 - Aug 15, 2026'].map((period, i) => (
                  <div key={i} className="row-between p-32" style={{ borderBottom: i === 2 ? 'none' : '1px solid var(--border)' }}>
                    <div className="row gap-24">
                      <div className="icon-chip" style={{ width: 56, height: 56, background: 'var(--primary-tint)', color: 'var(--primary)' }}><FileText size={24}/></div>
                      <div>
                        <div className="text-lg fw-800 text-1">{period}</div>
                        <div className="text-base text-5 mt-4 row gap-12">
                          <span>Regular Run</span>
                          <span>•</span>
                          <span className="text-success fw-700">Paid</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }}><Download size={16} /> Download Package</button>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div style={{ maxWidth: 900 }}>
            <div className="row-between mb-32">
              <h2 className="text-2xl fw-800 text-1">Payroll Configuration</h2>
              {!isEditingSettings ? (
                <button className="btn-secondary row gap-8" onClick={() => setIsEditingSettings(true)}><Edit3 size={16}/> Edit Settings</button>
              ) : (
                <div className="row gap-16">
                  <button className="btn-neutral" onClick={() => setIsEditingSettings(false)}>Cancel</button>
                  <button className="btn-primary row gap-8" onClick={() => setIsEditingSettings(false)}><Save size={16}/> Save Changes</button>
                </div>
              )}
            </div>

            <div className="col gap-40">
              <Card style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                  <h3 className="text-lg fw-800 text-1 row gap-12"><Building size={20} className="text-primary"/> Company Bank Account</h3>
                </div>
                <CardBody style={{ padding: 32 }}>
                  {!isEditingSettings ? (
                    <div className="p-24" style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 12 }}>
                      <div className="text-base fw-800 text-1">Silicon Valley Bank</div>
                      <div className="text-sm text-5 mt-4">Checking •••• 1234</div>
                    </div>
                  ) : (
                    <div className="col gap-24 max-w-md">
                      <div className="col gap-8">
                        <label className="text-sm fw-700 text-1">Bank Name</label>
                        <input type="text" className="input" defaultValue="Silicon Valley Bank" />
                      </div>
                      <div className="col gap-8">
                        <label className="text-sm fw-700 text-1">Routing Number</label>
                        <input type="text" className="input" defaultValue="122000496" />
                      </div>
                      <div className="col gap-8">
                        <label className="text-sm fw-700 text-1">Account Number</label>
                        <input type="password" className="input" defaultValue="123456789" />
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                  <h3 className="text-lg fw-800 text-1 row gap-12"><Clock size={20} className="text-primary"/> Pay Schedule</h3>
                </div>
                <CardBody style={{ padding: 32 }}>
                  {!isEditingSettings ? (
                    <div className="p-24" style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 12 }}>
                      <div className="text-base fw-800 text-1">Semi-Monthly</div>
                      <div className="text-sm text-5 mt-4">Paid on the 1st and 15th of the month.</div>
                    </div>
                  ) : (
                    <div className="col gap-24 max-w-md">
                      <div className="col gap-8">
                        <label className="text-sm fw-700 text-1">Frequency</label>
                        <select className="select" defaultValue="Semi-Monthly">
                          <option>Weekly</option>
                          <option>Bi-Weekly</option>
                          <option>Semi-Monthly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                      <div className="col gap-8">
                        <label className="text-sm fw-700 text-1">First Pay Date</label>
                        <input type="date" className="input" defaultValue="2026-10-01" />
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
