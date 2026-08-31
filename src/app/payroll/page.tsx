"use client";

import { useState } from 'react';
import { DollarSign, Clock, FileText, CheckCircle2, ChevronRight, Download, Filter, Search, Settings, Building, AlertCircle, Edit3, Save, Info } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { ugandaPayrollRecords, payrollTotals, PayrollRecord } from '@/data/ugandaPayroll';
import { formatCurrency } from '@/utils/payrollCalc';

const TABS = ['Overview', 'Run Payroll', 'Paystubs', 'Settings'];
const WIZARD_STEPS = ['Hours & Attendance', 'Earnings & Adjustments', 'Taxes & Deductions', 'Review & Finalize'];

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [wizardStep, setWizardStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollRun, setPayrollRun] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

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
          <p className="text-base text-4 mt-4">Current Cycle: September 2026 (Uganda Regulations applied)</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('Run Payroll')}>
          Run Payroll
        </button>
      </div>

      <StatRibbon
        stats={[
          { label: 'Total Employer Cost', value: formatCurrency(payrollTotals.totalEmployerCost), color: 'var(--primary)', icon: <Building size={18}/>, description: 'Includes NSSF 10% Contribution' },
          { label: 'Total Net Pay', value: formatCurrency(payrollTotals.totalNet), color: 'var(--success)', icon: <DollarSign size={18}/>, description: 'To be disbursed to employees' },
          { label: 'Total PAYE Withheld', value: formatCurrency(payrollTotals.totalPaye), color: 'var(--warning)', icon: <FileText size={18}/>, description: 'To be remitted to URA' },
          { label: 'Total NSSF (15%)', value: formatCurrency(payrollTotals.totalNssfEmployee + payrollTotals.totalNssfEmployer), color: 'var(--text-1)', icon: <Clock size={18}/>, description: 'Employer (10%) + Employee (5%)' },
        ]}
        style={{ marginBottom: 40 }}
      />

      <h3 className="text-xl fw-800 text-1 mb-24">Recent Payroll Runs</h3>
      <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <CardBody style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#F9FAFB', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Period</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Total Cost</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Net Disbursed</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '20px 32px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {['August 2026', 'July 2026', 'June 2026'].map((period, i) => (
                <tr key={i} style={{ borderBottom: i === 2 ? 'none' : '1px solid var(--border)' }}>
                  <td style={{ padding: '20px 32px', fontWeight: 700, fontSize: 15 }}>{period}</td>
                  <td style={{ padding: '20px 32px', fontSize: 15 }}>{formatCurrency(payrollTotals.totalEmployerCost - (i * 500000))}</td>
                  <td style={{ padding: '20px 32px', fontSize: 15 }}>{formatCurrency(payrollTotals.totalNet - (i * 350000))}</td>
                  <td style={{ padding: '20px 32px' }}><Badge variant="success">Completed</Badge></td>
                  <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>View Report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );

  const renderWizard = () => (
    <div style={{ margin: '0 auto' }}>
      <div className="row-between mb-32">
        <h2 className="text-2xl fw-800 text-1">Run Payroll (September 2026)</h2>
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
        <div style={{ padding: 0, minHeight: 450 }}>
          
          {/* STEP 1: Time & Attendance */}
          {wizardStep === 0 && (
            <div>
              <div className="row-between p-32 pb-16">
                <div>
                  <h3 className="text-xl fw-800 text-1 mb-8">Review & Edit Hours</h3>
                  <p className="text-base text-5">Standard month is 173.33 hours. Unworked hours will deduct from base pay, overtime adds 1.5x.</p>
                </div>
                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 20, padding: '10px 20px', width: 250 }}>
                  <Search size={16} className="text-4" style={{ marginRight: 8 }} />
                  <input type="text" placeholder="Search employees..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
                </div>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F9FAFB' }}>
                  <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 32px', fontWeight: 700 }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Base Salary</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Expected Hrs</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Absent Hrs</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Overtime Hrs</th>
                  </tr>
                </thead>
                <tbody>
                  {ugandaPayrollRecords.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 32px' }}>
                        <div className="row gap-16">
                          <Avatar src={r.avatar} name={r.employeeName} size="md" />
                          <div>
                            <div className="text-base fw-700 text-1">{r.employeeName}</div>
                            <div className="text-xs text-5 mt-2">{r.department}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>{formatCurrency(r.baseSalary)}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-4)' }}>173.33</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="input" style={{ width: 80, padding: 8, display: 'inline-block', textAlign: 'center', color: r.absentHours > 0 ? 'var(--error)' : 'inherit', borderColor: r.absentHours > 0 ? 'var(--error)' : 'var(--border)' }}>{r.absentHours}h</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="input" style={{ width: 80, padding: 8, display: 'inline-block', textAlign: 'center', color: r.overtimeHours > 0 ? 'var(--warning)' : 'inherit', borderColor: r.overtimeHours > 0 ? 'var(--warning)' : 'var(--border)' }}>{r.overtimeHours}h</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STEP 2: Earnings & Adjustments */}
          {wizardStep === 1 && (
            <div>
              <div className="row-between p-32 pb-16">
                <div>
                  <h3 className="text-xl fw-800 text-1 mb-8">Allowances & Bonuses</h3>
                  <p className="text-base text-5">Add non-taxable or taxable allowances and one-time bonuses.</p>
                </div>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F9FAFB' }}>
                  <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 32px', fontWeight: 700 }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Adjusted Base Pay</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Allowances</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Bonuses</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Total Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {ugandaPayrollRecords.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 32px' }}>
                        <div className="row gap-16">
                          <Avatar src={r.avatar} name={r.employeeName} size="md" />
                          <span className="text-base fw-700 text-1">{r.employeeName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="text-sm fw-600">{formatCurrency(r.baseSalary - r.results.absentDeduction + r.results.overtimePay)}</div>
                        {(r.absentHours > 0 || r.overtimeHours > 0) && (
                          <div className="text-xs text-warning mt-4 row gap-4"><Info size={12}/> Adjusted for hours</div>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="input row-between" style={{ width: 140, padding: '8px 12px' }}>
                          <span className="text-4 text-xs">UGX</span>
                          <span className="fw-600">{r.allowances.toLocaleString()}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="input row-between" style={{ width: 140, padding: '8px 12px' }}>
                          <span className="text-4 text-xs">UGX</span>
                          <span className="fw-600">{r.bonuses.toLocaleString()}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>
                        {formatCurrency(r.results.adjustedGross)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STEP 3: Taxes & Deductions */}
          {wizardStep === 2 && (
            <div>
              <div className="row-between p-32 pb-16">
                <div>
                  <h3 className="text-xl fw-800 text-1 mb-8">Tax Engine Preview (Uganda)</h3>
                  <p className="text-base text-5">Automatic calculation of NSSF (15%), PAYE (including solidarity tax), and LST.</p>
                </div>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F9FAFB' }}>
                  <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 32px', fontWeight: 700 }}>Employee</th>
                    <th style={{ padding: '16px 20px', fontWeight: 700 }}>Gross Pay</th>
                    <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--error)' }}>NSSF (5%)</th>
                    <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--error)' }}>PAYE</th>
                    <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--error)' }}>LST</th>
                    <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--success)' }}>Net Pay</th>
                    <th style={{ padding: '16px 32px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ugandaPayrollRecords.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 32px' }}>
                        <div className="row gap-12">
                          <Avatar src={r.avatar} name={r.employeeName} size="sm" />
                          <span className="text-sm fw-700 text-1">{r.employeeName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600 }}>{formatCurrency(r.results.adjustedGross)}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--error)' }}>-{formatCurrency(r.results.nssfEmployee)}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--error)' }}>-{formatCurrency(r.results.paye)}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--error)' }}>-{formatCurrency(r.results.lst)}</td>
                      <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(r.results.netPay)}</td>
                      <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setSelectedRecord(r)}>
                          View Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STEP 4: Finalize */}
          {wizardStep === 3 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="icon-chip mx-auto mb-32" style={{ width: 100, height: 100, background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                <DollarSign size={48} />
              </div>
              <h3 className="text-3xl fw-800 text-1 mb-12">Ready to Process Payroll?</h3>
              <p className="text-base text-5 mb-40 max-w-lg mx-auto" style={{ lineHeight: 1.6 }}>
                You are about to finalize payroll for <strong>September 2026</strong>. This will generate payslips and mark statuses as complete. No funds will be moved automatically in this environment.
              </p>
              
              <div className="p-32 mx-auto" style={{ background: '#F9FAFB', borderRadius: 12, border: '1px solid var(--border)', maxWidth: 500, textAlign: 'left' }}>
                <div className="row-between text-base mb-16"><span className="text-4 fw-600">Total Net Disbursed (To Employees)</span> <span className="fw-800 text-1">{formatCurrency(payrollTotals.totalNet)}</span></div>
                <div className="row-between text-base mb-16"><span className="text-4 fw-600">Total PAYE Withheld (To URA)</span> <span className="fw-800 text-1">{formatCurrency(payrollTotals.totalPaye)}</span></div>
                <div className="row-between text-base mb-16"><span className="text-4 fw-600">Total NSSF (15% To Fund)</span> <span className="fw-800 text-1">{formatCurrency(payrollTotals.totalNssfEmployee + payrollTotals.totalNssfEmployer)}</span></div>
                <div className="row-between text-base mb-16"><span className="text-4 fw-600">Total LST Withheld</span> <span className="fw-800 text-1">{formatCurrency(payrollTotals.totalLst)}</span></div>
                <div className="divider my-24"/>
                <div className="row-between text-xl fw-800 text-primary"><span>Total Employer Liability</span> <span>{formatCurrency(payrollTotals.totalEmployerCost)}</span></div>
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
              {isProcessing ? 'Processing...' : 'Complete Payroll Run'}
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
        title="Payroll Processing"
        subtitle="Manage payroll cycles, Ugandan taxes, and compliance."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '48px', background: 'var(--bg-page)' }}>
        {payrollRun && activeTab === 'Overview' && (
          <div className="mb-40 p-24 row gap-20" style={{ background: 'var(--success-tint)', border: '1px solid var(--success)', borderRadius: 12, color: 'var(--success)' }}>
            <CheckCircle2 size={32} />
            <div>
              <div className="text-lg fw-800">Payroll Completed Successfully!</div>
              <div className="text-sm mt-4 fw-600">Payslips have been generated and sent to employees. Tax liabilities logged for remittance.</div>
            </div>
          </div>
        )}
        
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Run Payroll' && renderWizard()}
        
      </div>

      {/* Payslip Modal */}
      <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="Employee Payslip Preview" width={800} footer={<button className="btn-secondary" onClick={() => setSelectedRecord(null)}>Close Preview</button>}>
        {selectedRecord && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 32, background: 'white' }}>
            <div className="row-between mb-32" style={{ borderBottom: '2px solid var(--border)', paddingBottom: 24 }}>
              <div className="row gap-20">
                    <Avatar name={selectedRecord.employeeName} src={selectedRecord.avatar} size="lg" />
                    <div>
                      <h2 className="text-xl fw-800 text-1 m-0">{selectedRecord.employeeName}</h2>
                      <p className="text-sm text-5 mt-4 m-0">{selectedRecord.department} • Uganda Operations</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-2xl fw-800 text-success">{formatCurrency(selectedRecord.results.netPay)}</div>
                    <div className="text-sm fw-600 text-4 mt-4">NET PAY</div>
                  </div>
                </div>

                <div className="grid-2 gap-40">
                  {/* Earnings */}
                  <div>
                    <h3 className="text-sm fw-800 text-4 mb-16 text-uppercase tracking-wider">Earnings</h3>
                    <div className="col gap-12">
                      <div className="row-between text-base"><span className="text-2 fw-600">Base Salary</span> <span className="fw-700">{formatCurrency(selectedRecord.baseSalary)}</span></div>
                      {selectedRecord.absentHours > 0 && (
                        <div className="row-between text-base"><span className="text-2 fw-600">Absent Deduction ({selectedRecord.absentHours}h)</span> <span className="fw-700 text-error">-{formatCurrency(selectedRecord.results.absentDeduction)}</span></div>
                      )}
                      {selectedRecord.overtimeHours > 0 && (
                        <div className="row-between text-base"><span className="text-2 fw-600">Overtime Pay ({selectedRecord.overtimeHours}h)</span> <span className="fw-700 text-success">+{formatCurrency(selectedRecord.results.overtimePay)}</span></div>
                      )}
                      {selectedRecord.allowances > 0 && (
                        <div className="row-between text-base"><span className="text-2 fw-600">Allowances</span> <span className="fw-700">{formatCurrency(selectedRecord.allowances)}</span></div>
                      )}
                      {selectedRecord.bonuses > 0 && (
                        <div className="row-between text-base"><span className="text-2 fw-600">Bonuses</span> <span className="fw-700">{formatCurrency(selectedRecord.bonuses)}</span></div>
                      )}
                      <div className="divider my-8"/>
                      <div className="row-between text-lg"><span className="text-1 fw-800">Gross Earnings</span> <span className="fw-800 text-primary">{formatCurrency(selectedRecord.results.adjustedGross)}</span></div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h3 className="text-sm fw-800 text-4 mb-16 text-uppercase tracking-wider">Taxes & Deductions</h3>
                    <div className="col gap-12">
                      <div className="row-between text-base"><span className="text-2 fw-600">NSSF Employee (5%)</span> <span className="fw-700 text-error">-{formatCurrency(selectedRecord.results.nssfEmployee)}</span></div>
                      <div className="row-between text-base"><span className="text-2 fw-600">PAYE Tax</span> <span className="fw-700 text-error">-{formatCurrency(selectedRecord.results.paye)}</span></div>
                      <div className="row-between text-base"><span className="text-2 fw-600">Local Service Tax (LST)</span> <span className="fw-700 text-error">-{formatCurrency(selectedRecord.results.lst)}</span></div>
                      
                      <div className="divider my-8"/>
                      <div className="row-between text-lg"><span className="text-1 fw-800">Total Deductions</span> <span className="fw-800 text-error">-{formatCurrency(selectedRecord.results.nssfEmployee + selectedRecord.results.paye + selectedRecord.results.lst)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="mt-32 p-24" style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <h3 className="text-sm fw-800 text-4 mb-16 text-uppercase tracking-wider">Employer Contributions</h3>
                  <div className="row-between text-base"><span className="text-2 fw-600">NSSF Employer (10%)</span> <span className="fw-700">{formatCurrency(selectedRecord.results.nssfEmployer)}</span></div>
                </div>
              </div>
        )}
      </Modal>

    </div>
  );
}
