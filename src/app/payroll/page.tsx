"use client";

import { useState } from 'react';
import { DollarSign, Clock, FileText, CheckCircle2, ChevronRight, Download, Filter, Search, Settings, Building, AlertCircle, Edit3, Save, Info, Mail, Paperclip, CalendarDays, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { SearchableSelect, SelectOption } from '@/components/ui/SearchableSelect';
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
  
  // New Modals State
  const [isEmailAllModalOpen, setIsEmailAllModalOpen] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  
  const [adjustRecord, setAdjustRecord] = useState<PayrollRecord | null>(null);
  const [adjustProof, setAdjustProof] = useState("");

  const handleRunPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPayrollRun(true);
      setActiveTab('Overview');
      setWizardStep(0);
    }, 2000);
  };

  const handleSendEmails = () => {
    setIsSendingEmails(true);
    setTimeout(() => {
      setIsSendingEmails(false);
      setIsEmailAllModalOpen(false);
      alert('Payslips queued for delivery successfully!');
    }, 1500);
  };

  // Variances Math
  const totalOvertimeCost = ugandaPayrollRecords.reduce((acc, r) => acc + r.results.overtimePay, 0);
  const totalAbsenteeSavings = ugandaPayrollRecords.reduce((acc, r) => acc + r.results.absentDeduction, 0);
  const totalSickLeaveHours = 24; // Mock
  const totalPTOHours = 48; // Mock

  const renderOverview = () => (
    <div>
      <div className="row-between mb-32">
        <div>
          <h2 className="text-2xl fw-800 text-1">Payroll Dashboard</h2>
          <div className="row gap-8 mt-8">
            <Badge variant="primary">Pay Period: Aug 1 - Aug 31, 2026</Badge>
            <span className="text-sm text-4">Uganda Regulations</span>
          </div>
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
              {['July 1 - July 31, 2026', 'June 1 - June 30, 2026', 'May 1 - May 31, 2026'].map((period, i) => (
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
        <div>
          <h2 className="text-2xl fw-800 text-1">Run Payroll</h2>
          <div className="row gap-8 mt-8">
            <Badge variant="neutral"><CalendarDays size={14} className="mr-4"/> Pay Period: Aug 1, 2026 - Aug 31, 2026</Badge>
          </div>
        </div>
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
              <div className="p-32 pb-0">
                <div className="row-between mb-24">
                  <div>
                    <h3 className="text-xl fw-800 text-1 mb-8">Review & Adjust Hours</h3>
                    <p className="text-base text-5">Standard month is 173.33 hours. Review variances below.</p>
                  </div>
                  <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 20, padding: '10px 20px', width: 250 }}>
                    <Search size={16} className="text-4" style={{ marginRight: 8 }} />
                    <input type="text" placeholder="Search employees..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
                  </div>
                </div>

                {/* Variance Ribbon */}
                <div className="row gap-16 mb-32">
                  <div style={{ flex: 1, background: 'var(--error-tint)', border: '1px solid var(--error)', padding: '16px 20px', borderRadius: 8 }}>
                    <div className="text-xs fw-700 text-error mb-4 text-uppercase row gap-8"><TrendingUp size={14}/> OVERTIME SPEND</div>
                    <div className="text-xl fw-800 text-1">+{formatCurrency(totalOvertimeCost)}</div>
                    <div className="text-xs text-error mt-4">{ugandaPayrollRecords.filter(r => r.overtimeHours > 0).length} employees with overtime</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--success-tint)', border: '1px solid var(--success)', padding: '16px 20px', borderRadius: 8 }}>
                    <div className="text-xs fw-700 text-success mb-4 text-uppercase row gap-8"><TrendingDown size={14}/> ABSENTEE SAVINGS</div>
                    <div className="text-xl fw-800 text-1">-{formatCurrency(totalAbsenteeSavings)}</div>
                    <div className="text-xs text-success mt-4">From unworked standard hours</div>
                  </div>
                  <div style={{ flex: 1, background: '#F3F4F6', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 8 }}>
                    <div className="text-xs fw-700 text-4 mb-4 text-uppercase row gap-8"><CalendarDays size={14}/> LEAVE TAKEN</div>
                    <div className="text-xl fw-800 text-1">{totalPTOHours + totalSickLeaveHours} hrs</div>
                    <div className="text-xs text-5 mt-4">Sick Leave: {totalSickLeaveHours}h, PTO: {totalPTOHours}h</div>
                  </div>
                </div>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F9FAFB' }}>
                  <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 32px', fontWeight: 700 }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Base Salary</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Expected</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Absent</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Overtime</th>
                    <th style={{ padding: '16px 32px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
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
                      <td style={{ padding: '16px 24px', color: 'var(--text-4)' }}>173.33h</td>
                      <td style={{ padding: '16px 24px' }}>
                        {r.absentHours > 0 ? (
                          <Badge variant="danger">{r.absentHours}h</Badge>
                        ) : (
                          <span className="text-4">0h</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {r.overtimeHours > 0 ? (
                          <Badge variant="warning">{r.overtimeHours}h</Badge>
                        ) : (
                          <span className="text-4">0h</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setAdjustRecord(r)}>
                          <Edit3 size={14} className="mr-8"/> Adjust
                        </button>
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
                You are about to finalize payroll for <strong>Aug 1 - Aug 31, 2026</strong>. This will generate payslips and mark statuses as complete. No funds will be moved automatically in this environment.
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

  const renderPaystubs = () => (
    <div>
      <div className="row-between mb-32">
        <div>
          <h2 className="text-2xl fw-800 text-1">Employee Paystubs</h2>
          <p className="text-base text-4 mt-4">View and distribute generated payslips to employees.</p>
        </div>
        <div className="row gap-16">
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '10px 20px', width: 250 }}>
            <Search size={16} className="text-4" style={{ marginRight: 8 }} />
            <input type="text" placeholder="Search employees..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
          </div>
          <button className="btn-secondary">
            <Filter size={16} className="mr-8"/> Filter Period
          </button>
          <button className="btn-primary" onClick={() => setIsEmailAllModalOpen(true)}>
            <Mail size={16} className="mr-8"/> Email All Payslips
          </button>
        </div>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#F9FAFB', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Employee</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Period</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Net Pay</th>
                <th style={{ padding: '20px 32px', fontWeight: 700 }}>Delivery Status</th>
                <th style={{ padding: '20px 32px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ugandaPayrollRecords.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '20px 32px' }}>
                    <div className="row gap-16">
                      <Avatar src={r.avatar} name={r.employeeName} size="md" />
                      <div>
                        <div className="text-base fw-700 text-1">{r.employeeName}</div>
                        <div className="text-xs text-5 mt-2">{r.employeeName.split(' ')[0].toLowerCase()}@easyhr.com</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: 14 }}>July 2026</td>
                  <td style={{ padding: '20px 32px', fontSize: 15, fontWeight: 700 }}>{formatCurrency(r.results.netPay)}</td>
                  <td style={{ padding: '20px 32px' }}>
                    {i % 3 === 0 ? <Badge variant="success">Delivered</Badge> : <Badge variant="neutral">Not Sent</Badge>}
                  </td>
                  <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                    <div className="row gap-8 justify-end">
                      <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setSelectedRecord(r)}>
                        View
                      </button>
                      <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => alert(`Emailing payslip to ${r.employeeName}`)}>
                        <Mail size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div style={{ maxWidth: 800 }}>
      <h2 className="text-2xl fw-800 text-1 mb-8">Payroll Settings</h2>
      <p className="text-base text-4 mb-32">Configure global tax engines, standard work hours, and overtime rules.</p>
      
      <Card style={{ marginBottom: 32 }}>
        <CardHeader title="Tax Jurisdiction" />
        <CardBody>
          <div className="row gap-20 mb-24">
            <div style={{ flex: 1 }}>
              <label className="text-sm fw-600 text-2 mb-8 block">Operating Country</label>
              <SearchableSelect
                value="UG"
                onChange={(v) => console.log(v)}
                options={[
                  { value: 'UG', label: 'Uganda', description: 'Active - URA Rates' },
                  { value: 'KE', label: 'Kenya', description: 'KRA Rates' },
                  { value: 'RW', label: 'Rwanda', description: 'RRA Rates' },
                  { value: 'NG', label: 'Nigeria', description: 'FIRS Rates' },
                ]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-sm fw-600 text-2 mb-8 block">Currency Display</label>
              <CurrencySelect value="UGX" onChange={(v) => console.log(v)} />
            </div>
          </div>
          <div className="p-16" style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div className="text-sm fw-700 text-1 mb-8">Uganda Tax Engine Details</div>
            <div className="text-sm text-5 mb-4">PAYE Brackets: 2024/2025 applied (Includes 10% Solidarity Tax &gt; 10M)</div>
            <div className="text-sm text-5">NSSF: 5% Employee / 10% Employer</div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Work Hours & Multipliers" />
        <CardBody>
          <div className="row gap-20 mb-24">
            <div style={{ flex: 1 }}>
              <label className="text-sm fw-600 text-2 mb-8 block">Standard Monthly Hours</label>
              <div className="input" style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
                <Clock size={16} className="text-4 mr-8"/>
                <input type="number" defaultValue="173.33" style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }} />
              </div>
              <p className="text-xs text-4 mt-4">Used to calculate hourly rates for deductions/overtime.</p>
            </div>
          </div>
          
          <div className="row gap-20 mb-24">
            <div style={{ flex: 1 }}>
              <label className="text-sm fw-600 text-2 mb-8 block">Standard Overtime Rate (1.5x)</label>
              <div className="input" style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
                <span className="text-4 fw-600 mr-8">x</span>
                <input type="number" defaultValue="1.5" step="0.1" style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }} />
              </div>
              <p className="text-xs text-4 mt-4">Multiplier applied to base hourly rate for OT.</p>
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-sm fw-600 text-2 mb-8 block">Holiday / Rest Day Rate (2.0x)</label>
              <div className="input" style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
                <span className="text-4 fw-600 mr-8">x</span>
                <input type="number" defaultValue="2.0" step="0.1" style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }} />
              </div>
              <p className="text-xs text-4 mt-4">Multiplier for hours worked on public holidays.</p>
            </div>
          </div>
          <button className="btn-primary"><Save size={16} className="mr-8"/> Save Configurations</button>
        </CardBody>
      </Card>
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
              <div className="text-sm mt-4 fw-600">Payslips have been generated and tax liabilities logged for remittance. You can now distribute payslips in the Paystubs tab.</div>
            </div>
          </div>
        )}
        
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Run Payroll' && renderWizard()}
        {activeTab === 'Paystubs' && renderPaystubs()}
        {activeTab === 'Settings' && renderSettings()}
        
      </div>

      {/* Adjust Hours Modal */}
      <Modal isOpen={!!adjustRecord} onClose={() => setAdjustRecord(null)} title="Adjust Employee Hours" width={500} footer={
        <div className="row-between w-100">
          <button className="btn-neutral" onClick={() => setAdjustRecord(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => { alert('Hours adjusted and proof attached!'); setAdjustRecord(null); }}>Save Adjustments</button>
        </div>
      }>
        {adjustRecord && (
          <div>
            <div className="row gap-16 mb-24 pb-24" style={{ borderBottom: '1px solid var(--border)' }}>
              <Avatar src={adjustRecord.avatar} name={adjustRecord.employeeName} size="md" />
              <div>
                <div className="text-base fw-700 text-1">{adjustRecord.employeeName}</div>
                <div className="text-sm text-5">{adjustRecord.department}</div>
              </div>
            </div>
            
            <div className="grid-2 gap-20 mb-24">
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Absent Hours (Unpaid)</label>
                <input type="number" defaultValue={adjustRecord.absentHours} className="input w-100" />
              </div>
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Overtime Hours (1.5x)</label>
                <input type="number" defaultValue={adjustRecord.overtimeHours} className="input w-100" />
              </div>
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Sick Leave (Paid)</label>
                <input type="number" defaultValue={0} className="input w-100" />
              </div>
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">PTO (Paid)</label>
                <input type="number" defaultValue={0} className="input w-100" />
              </div>
            </div>

            <div className="mb-24">
              <label className="text-sm fw-600 text-2 mb-8 block">Justification / Notes</label>
              <textarea 
                className="input w-100" 
                rows={3} 
                placeholder="E.g. Approved overtime for project launch..."
                value={adjustProof}
                onChange={(e) => setAdjustProof(e.target.value)}
              />
            </div>

            <div className="p-16" style={{ border: '1px dashed var(--border)', borderRadius: 8, background: '#F9FAFB', textAlign: 'center' }}>
              <Paperclip size={24} className="text-4 mb-8 mx-auto" />
              <div className="text-sm fw-600 text-2">Attach Proof (Timesheet/Approval)</div>
              <div className="text-xs text-5 mt-4">Upload PDF, JPG, PNG</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Email All Modal */}
      <Modal isOpen={isEmailAllModalOpen} onClose={() => !isSendingEmails && setIsEmailAllModalOpen(false)} title="Send Payslips to Employees" width={450} footer={
        <div className="row-between w-100">
          <button className="btn-neutral" onClick={() => setIsEmailAllModalOpen(false)} disabled={isSendingEmails}>Cancel</button>
          <button className="btn-primary" onClick={handleSendEmails} disabled={isSendingEmails} style={{ background: 'var(--primary)' }}>
            {isSendingEmails ? 'Sending Emails...' : 'Yes, Send Payslips'}
          </button>
        </div>
      }>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div className="icon-chip mx-auto mb-24" style={{ width: 80, height: 80, background: 'var(--primary-tint)', color: 'var(--primary)' }}>
            <Mail size={40} />
          </div>
          <h3 className="text-xl fw-800 text-1 mb-12">Deliver {ugandaPayrollRecords.length} Payslips</h3>
          <p className="text-base text-5">
            This will email the finalized payslips for the period <strong>July 2026</strong> to all {ugandaPayrollRecords.length} employees securely as a PDF attachment.
          </p>
        </div>
      </Modal>

      {/* Payslip Preview Modal */}
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
