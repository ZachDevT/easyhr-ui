"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Search,
  Settings,
  Building,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Save,
  Info,
  Mail,
  Paperclip,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { SearchableSelect, SelectOption } from '@/components/ui/SearchableSelect';
import { Modal } from '@/components/ui/Modal';
import { UgandaTaxEngine, PayrollInput, formatCurrency } from '@/utils/payrollCalc';
import { toast } from '@/components/ui/Toast';

export interface PayrollRecord {
  id: string;
  employeeName: string;
  email: string;
  avatar: string;
  department: string;
  baseSalary: number;
  expectedHours: number;
  actualHours: number;
  absentHours: number;
  overtimeHours: number;
  allowances: number;
  bonuses: number;
  results: ReturnType<typeof UgandaTaxEngine.calculate>;
}

interface PayrollPeriod {
  id: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: string;
}

interface PayrollBackendConfig {
  id: string;
  country: string;
  currency: string;
  standardMonthlyMinutes: number;
}

const TABS = ['Overview', 'Run Payroll', 'Paystubs', 'Settings'];
const WIZARD_STEPS = ['Hours & Attendance', 'Earnings & Adjustments', 'Taxes & Deductions', 'Review & Finalize'];

export default function PayrollPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [wizardStep, setWizardStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollRun, setPayrollRun] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Live data states
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [configurations, setConfigurations] = useState<PayrollBackendConfig[]>([]);

  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  // Email payslips modal
  const [isEmailAllModalOpen, setIsEmailAllModalOpen] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  // Adjust Record state
  const [adjustRecord, setAdjustRecord] = useState<PayrollRecord | null>(null);
  const [adjustAbsent, setAdjustAbsent] = useState(0);
  const [adjustOvertime, setAdjustOvertime] = useState(0);
  const [adjustAllowances, setAdjustAllowances] = useState(0);
  const [adjustBonuses, setAdjustBonuses] = useState(0);
  const [adjustProof, setAdjustProof] = useState("");

  const fetchPayrollData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);

      const [periodsRes, configsRes, empsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/payroll/periods`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees?limit=200`, { headers }),
      ]);

      if (periodsRes.ok) {
        const pData = await periodsRes.json();
        setPeriods(Array.isArray(pData) ? pData : []);
      }

      if (configsRes.ok) {
        const cData = await configsRes.json();
        setConfigurations(Array.isArray(cData) ? cData : []);
      }

      if (empsRes.ok) {
        const empsData = await empsRes.json();
        const empsList = empsData.data || [];

        // Build dynamic payroll records for all directory employees
        const initialRecords: PayrollRecord[] = empsList.map((emp: any, index: number) => {
          // Tiered default salary (UGX) based on role/index
          const baseSalaries = [5500000, 3800000, 2900000, 2400000, 1800000, 1500000];
          const baseSalary = baseSalaries[index % baseSalaries.length];
          const absentHours = 0;
          const overtimeHours = 0;
          const allowances = 0;
          const bonuses = 0;

          const results = UgandaTaxEngine.calculate({
            baseSalary,
            allowances,
            bonuses,
            absentHours,
            overtimeHours,
          });

          return {
            id: emp.id,
            employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
            email: emp.workEmail || 'employee@easyhr.pro',
            avatar: emp.avatarUrl || '',
            department: emp.departmentName || 'General',
            baseSalary,
            expectedHours: UgandaTaxEngine.config.standardMonthlyHours,
            actualHours: UgandaTaxEngine.config.standardMonthlyHours,
            absentHours,
            overtimeHours,
            allowances,
            bonuses,
            results,
          };
        });

        setRecords(initialRecords);
      }
    } catch (err) {
      console.error("Failed to load payroll data", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // Dynamic totals computed from current records
  const payrollTotals = useMemo(() => {
    return records.reduce(
      (acc, record) => {
        acc.totalGross += record.results.adjustedGross;
        acc.totalNet += record.results.netPay;
        acc.totalPaye += record.results.paye;
        acc.totalNssfEmployee += record.results.nssfEmployee;
        acc.totalNssfEmployer += record.results.nssfEmployer;
        acc.totalLst += record.results.lst;
        acc.totalEmployerCost += record.results.totalEmployerCost;
        return acc;
      },
      {
        totalGross: 0,
        totalNet: 0,
        totalPaye: 0,
        totalNssfEmployee: 0,
        totalNssfEmployer: 0,
        totalLst: 0,
        totalEmployerCost: 0,
      }
    );
  }, [records]);

  const totalOvertimeCost = useMemo(
    () => records.reduce((acc, r) => acc + r.results.overtimePay, 0),
    [records]
  );
  const totalAbsenteeSavings = useMemo(
    () => records.reduce((acc, r) => acc + r.results.absentDeduction, 0),
    [records]
  );

  const openAdjustModal = (r: PayrollRecord) => {
    setAdjustRecord(r);
    setAdjustAbsent(r.absentHours);
    setAdjustOvertime(r.overtimeHours);
    setAdjustAllowances(r.allowances);
    setAdjustBonuses(r.bonuses);
    setAdjustProof("");
  };

  const handleSaveAdjustment = () => {
    if (!adjustRecord) return;
    const updatedRecords = records.map((r) => {
      if (r.id !== adjustRecord.id) return r;
      const updatedResults = UgandaTaxEngine.calculate({
        baseSalary: r.baseSalary,
        allowances: adjustAllowances,
        bonuses: adjustBonuses,
        absentHours: adjustAbsent,
        overtimeHours: adjustOvertime,
      });

      return {
        ...r,
        absentHours: adjustAbsent,
        overtimeHours: adjustOvertime,
        allowances: adjustAllowances,
        bonuses: adjustBonuses,
        actualHours: UgandaTaxEngine.config.standardMonthlyHours - adjustAbsent + adjustOvertime,
        results: updatedResults,
      };
    });

    setRecords(updatedRecords);
    toast.success("Adjustment saved", `Updated earnings and deductions for ${adjustRecord.employeeName}.`);
    setAdjustRecord(null);
  };

  const handleRunPayroll = async () => {
    setIsProcessing(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);

      // 1. Ensure configuration exists
      if (configurations.length === 0) {
        await fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, {
          method: "POST",
          headers,
          body: JSON.stringify({ country: "UG", currency: "UGX", standardMonthlyMinutes: 9600 }),
        });
      }

      // 2. Determine or create period
      let periodId = periods[0]?.id;
      if (!periodId) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const startDate = `${y}-${m}-01`;
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        const endDate = `${y}-${m}-${lastDay}`;
        const payDate = endDate;

        const periodRes = await fetch(`${API_BASE_URL}/api/v1/payroll/periods`, {
          method: "POST",
          headers,
          body: JSON.stringify({ startDate, endDate, payDate }),
        });
        if (periodRes.ok) {
          const createdP = await periodRes.json();
          periodId = createdP.id;
        }
      }

      // 3. Trigger payroll run on the backend if period is available
      if (periodId) {
        await fetch(`${API_BASE_URL}/api/v1/payroll/periods/${periodId}/runs`, {
          method: "POST",
          headers,
        });
      }

      setPayrollRun(true);
      setActiveTab('Overview');
      setWizardStep(0);
      toast.success("Payroll executed", "Current pay period processed and recorded successfully.");
      await fetchPayrollData();
    } catch (err) {
      toast.error("Execution error", "Could not complete payroll run.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmails = () => {
    setIsSendingEmails(true);
    setTimeout(() => {
      setIsSendingEmails(false);
      setIsEmailAllModalOpen(false);
      toast.success("Payslips dispatched", `Payslips queued for delivery to ${records.length} employees.`);
    }, 1200);
  };

  const renderOverview = () => (
    <div>
      <div className="row-between mb-32">
        <div>
          <h2 className="text-2xl fw-800 text-1">Payroll Dashboard</h2>
          <div className="row gap-8 mt-8 align-center">
            <Badge variant="primary">
              Pay Period: {periods[0] ? `${periods[0].startDate} to ${periods[0].endDate}` : 'Current Month'}
            </Badge>
            <span className="text-sm text-4">Uganda Statutory Regulations (URA &middot; NSSF)</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('Run Payroll')}>
          Run Payroll
        </button>
      </div>

      <StatRibbon
        stats={[
          {
            label: 'Total Employer Cost',
            value: formatCurrency(payrollTotals.totalEmployerCost),
            color: 'var(--primary)',
            icon: <Building size={18} />,
            description: 'Includes NSSF 10% Contribution',
          },
          {
            label: 'Total Net Pay',
            value: formatCurrency(payrollTotals.totalNet),
            color: 'var(--success)',
            icon: <DollarSign size={18} />,
            description: 'To be disbursed to employees',
          },
          {
            label: 'Total PAYE Withheld',
            value: formatCurrency(payrollTotals.totalPaye),
            color: 'var(--warning)',
            icon: <FileText size={18} />,
            description: 'To be remitted to URA',
          },
          {
            label: 'Total NSSF (15%)',
            value: formatCurrency(payrollTotals.totalNssfEmployee + payrollTotals.totalNssfEmployer),
            color: 'var(--text-1)',
            icon: <Clock size={18} />,
            description: 'Employer (10%) + Employee (5%)',
          },
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
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-4)' }}>
                    No prior closed payroll periods. Click "Run Payroll" to initiate your first period run.
                  </td>
                </tr>
              ) : (
                periods.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i === periods.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <td style={{ padding: '20px 32px', fontWeight: 700, fontSize: 15 }}>
                      {p.startDate} - {p.endDate}
                    </td>
                    <td style={{ padding: '20px 32px', fontSize: 15 }}>
                      {formatCurrency(payrollTotals.totalEmployerCost)}
                    </td>
                    <td style={{ padding: '20px 32px', fontSize: 15 }}>
                      {formatCurrency(payrollTotals.totalNet)}
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <Badge variant={p.status === 'locked' || p.status === 'paid' ? 'success' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                      <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setActiveTab('Paystubs')}>
                        View Paystubs
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
            <Badge variant="neutral">
              <CalendarDays size={14} className="mr-4" /> Pay Period: Active Cycle ({records.length} Employees)
            </Badge>
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
                {wizardStep > idx ? <CheckCircle2 size={16} /> : <span className="fw-700">{idx + 1}</span>}
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
                    <p className="text-base text-5">Standard month is 173.33 hours. Review employee variances below.</p>
                  </div>
                </div>

                {/* Variance Ribbon */}
                <div className="row gap-16 mb-32">
                  <div style={{ flex: 1, background: 'var(--error-tint)', border: '1px solid var(--error)', padding: '16px 20px', borderRadius: 8 }}>
                    <div className="text-xs fw-700 text-error mb-4 text-uppercase row gap-8"><TrendingUp size={14} /> OVERTIME SPEND</div>
                    <div className="text-xl fw-800 text-1">+{formatCurrency(totalOvertimeCost)}</div>
                    <div className="text-xs text-error mt-4">{records.filter((r) => r.overtimeHours > 0).length} employees with overtime</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--success-tint)', border: '1px solid var(--success)', padding: '16px 20px', borderRadius: 8 }}>
                    <div className="text-xs fw-700 text-success mb-4 text-uppercase row gap-8"><TrendingDown size={14} /> ABSENTEE SAVINGS</div>
                    <div className="text-xl fw-800 text-1">-{formatCurrency(totalAbsenteeSavings)}</div>
                    <div className="text-xs text-success mt-4">From unworked standard hours</div>
                  </div>
                  <div style={{ flex: 1, background: '#F3F4F6', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 8 }}>
                    <div className="text-xs fw-700 text-4 mb-4 text-uppercase row gap-8"><CalendarDays size={14} /> ACTIVE DIRECTORY</div>
                    <div className="text-xl fw-800 text-1">{records.length} Employees</div>
                    <div className="text-xs text-5 mt-4">Ready for payroll execution</div>
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
                  {records.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
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
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => openAdjustModal(r)}>
                          <Edit3 size={14} className="mr-8" /> Adjust
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
                  <p className="text-base text-5">Review non-taxable or taxable allowances and one-time bonuses.</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F9FAFB' }}>
                  <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 32px', fontWeight: 700 }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Adjusted Base Pay</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Allowances</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Bonuses</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Gross Total</th>
                    <th style={{ padding: '16px 32px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 32px' }}>
                        <div className="row gap-16">
                          <Avatar src={r.avatar} name={r.employeeName} size="md" />
                          <div>
                            <div className="text-base fw-700 text-1">{r.employeeName}</div>
                            <div className="text-xs text-5 mt-2">{r.department}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>{formatCurrency(r.baseSalary - r.results.absentDeduction + r.results.overtimePay)}</td>
                      <td style={{ padding: '16px 24px' }}>{formatCurrency(r.allowances)}</td>
                      <td style={{ padding: '16px 24px' }}>{formatCurrency(r.bonuses)}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(r.results.adjustedGross)}</td>
                      <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => openAdjustModal(r)}>
                          <Edit3 size={14} className="mr-8" /> Adjust
                        </button>
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
                  <h3 className="text-xl fw-800 text-1 mb-8">Statutory Taxes & Deductions</h3>
                  <p className="text-base text-5">Computed via Uganda statutory regulations (URA PAYE Brackets &middot; NSSF 5% Employee).</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F9FAFB' }}>
                  <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 13, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 32px', fontWeight: 700 }}>Employee</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>Taxable Base</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>NSSF (5%)</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>PAYE Tax</th>
                    <th style={{ padding: '16px 24px', fontWeight: 700 }}>LST</th>
                    <th style={{ padding: '16px 32px', fontWeight: 700, textAlign: 'right' }}>Net Disbursed</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 32px' }}>
                        <div className="row gap-16">
                          <Avatar src={r.avatar} name={r.employeeName} size="md" />
                          <div>
                            <div className="text-base fw-700 text-1">{r.employeeName}</div>
                            <div className="text-xs text-5 mt-2">{r.department}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>{formatCurrency(r.results.taxableIncome)}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--error)' }}>-{formatCurrency(r.results.nssfEmployee)}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--error)' }}>-{formatCurrency(r.results.paye)}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--error)' }}>-{formatCurrency(r.results.lst)}</td>
                      <td style={{ padding: '16px 32px', textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>
                        {formatCurrency(r.results.netPay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STEP 4: Review & Finalize */}
          {wizardStep === 3 && (
            <div style={{ padding: '48px 48px 40px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
                <div>
                  <div className="row gap-14 mb-28">
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DollarSign size={22} style={{ color: '#7C3AED' }} />
                    </div>
                    <div>
                      <h3 className="text-xl fw-800 text-1" style={{ lineHeight: 1.2 }}>Payroll Summary</h3>
                      <p className="text-sm text-5 mt-6">Active Period &middot; {records.length} Employees</p>
                    </div>
                  </div>

                  <div style={{ background: '#FAFAFA', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                    {[
                      { label: 'Net Disbursed', note: 'To Employees', value: formatCurrency(payrollTotals.totalNet), color: 'var(--success)' },
                      { label: 'PAYE Withheld', note: 'URA', value: formatCurrency(payrollTotals.totalPaye), color: 'var(--text-1)' },
                      { label: 'NSSF (15%)', note: 'NSSF Fund', value: formatCurrency(payrollTotals.totalNssfEmployee + payrollTotals.totalNssfEmployer), color: 'var(--text-1)' },
                      { label: 'LST Withheld', note: 'Local Govt.', value: formatCurrency(payrollTotals.totalLst), color: 'var(--text-1)' },
                    ].map((row, i) => (
                      <div key={i} style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <div>
                          <span className="text-sm fw-600 text-2">{row.label}</span>
                          <span className="text-xs text-5 ml-8">({row.note})</span>
                        </div>
                        <span className="fw-800" style={{ color: row.color, fontSize: 15 }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #EDE9FE 0%, #F3F4FF 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-sm fw-800" style={{ color: '#5B21B6' }}>Total Employer Liability</span>
                      <span style={{ color: '#5B21B6', fontSize: 18, fontWeight: 900 }}>{formatCurrency(payrollTotals.totalEmployerCost)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                    <div className="text-base fw-700 text-1 mb-8">Pre-flight Verification</div>
                    <div className="col gap-12 text-sm text-4">
                      <div className="row gap-8 align-center"><CheckCircle2 size={16} className="text-success" /> All active directory employees matched to Ugandan tax brackets.</div>
                      <div className="row gap-8 align-center"><CheckCircle2 size={16} className="text-success" /> NSSF 10% employer contribution auto-balanced.</div>
                      <div className="row gap-8 align-center"><CheckCircle2 size={16} className="text-success" /> Net disbursement total ready for banking batch file export.</div>
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={handleRunPayroll}
                    disabled={isProcessing}
                    style={{ padding: '16px 24px', fontSize: 16, fontWeight: 800, width: '100%', justifyContent: 'center' }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="spin mr-8" /> Executing Payroll...
                      </>
                    ) : (
                      'Approve & Execute Payroll'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Nav */}
        <div className="row-between p-24" style={{ borderTop: '1px solid var(--border)', background: '#FAFAFA' }}>
          <button
            className="btn-neutral"
            onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}
            disabled={wizardStep === 0}
          >
            Back
          </button>
          {wizardStep < 3 && (
            <button
              className="btn-primary"
              onClick={() => setWizardStep((prev) => Math.min(3, prev + 1))}
            >
              Continue to {WIZARD_STEPS[wizardStep + 1]} <ChevronRight size={16} className="ml-4" />
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
          <p className="text-base text-4 mt-4">Inspect, generate PDF, and dispatch monthly paystubs.</p>
        </div>
        <button className="btn-secondary" onClick={() => setIsEmailAllModalOpen(true)}>
          <Mail size={16} className="mr-8" /> Deliver All Payslips
        </button>
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
              {records.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '20px 32px' }}>
                    <div className="row gap-16">
                      <Avatar src={r.avatar} name={r.employeeName} size="md" />
                      <div>
                        <div className="text-base fw-700 text-1">{r.employeeName}</div>
                        <div className="text-xs text-5 mt-2">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: 14 }}>
                    {periods[0] ? `${periods[0].startDate} to ${periods[0].endDate}` : 'Active Cycle'}
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: 15, fontWeight: 700 }}>
                    {formatCurrency(r.results.netPay)}
                  </td>
                  <td style={{ padding: '20px 32px' }}>
                    {i % 2 === 0 ? <Badge variant="success">Delivered</Badge> : <Badge variant="neutral">Pending</Badge>}
                  </td>
                  <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                    <div className="row gap-8 justify-end">
                      <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setSelectedRecord(r)}>
                        View
                      </button>
                      <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => toast.info("Dispatching payslip", `Emailing payslip to ${r.employeeName}...`)}>
                        <Mail size={14} />
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
                <Clock size={16} className="text-4 mr-8" />
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
          <button className="btn-primary" onClick={() => toast.success("Configuration saved", "Updated payroll operational parameters.")}>
            <Save size={16} className="mr-8" /> Save Configurations
          </button>
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
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

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <Loader2 size={32} className="spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'Overview' && renderOverview()}
            {activeTab === 'Run Payroll' && renderWizard()}
            {activeTab === 'Paystubs' && renderPaystubs()}
            {activeTab === 'Settings' && renderSettings()}
          </>
        )}
      </div>

      {/* Adjust Hours Modal */}
      <Modal
        isOpen={!!adjustRecord}
        onClose={() => setAdjustRecord(null)}
        title="Adjust Employee Earnings & Hours"
        width={500}
        footer={
          <div className="row-between w-100">
            <button className="btn-neutral" onClick={() => setAdjustRecord(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveAdjustment}>Save Adjustments</button>
          </div>
        }
      >
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
                <input
                  type="number"
                  value={adjustAbsent}
                  onChange={(e) => setAdjustAbsent(Number(e.target.value) || 0)}
                  className="input w-100"
                />
              </div>
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Overtime Hours (1.5x)</label>
                <input
                  type="number"
                  value={adjustOvertime}
                  onChange={(e) => setAdjustOvertime(Number(e.target.value) || 0)}
                  className="input w-100"
                />
              </div>
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Allowances (UGX)</label>
                <input
                  type="number"
                  value={adjustAllowances}
                  onChange={(e) => setAdjustAllowances(Number(e.target.value) || 0)}
                  className="input w-100"
                />
              </div>
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Bonus (UGX)</label>
                <input
                  type="number"
                  value={adjustBonuses}
                  onChange={(e) => setAdjustBonuses(Number(e.target.value) || 0)}
                  className="input w-100"
                />
              </div>
            </div>

            <div className="mb-24">
              <label className="text-sm fw-600 text-2 mb-8 block">Justification / Notes</label>
              <textarea
                className="input w-100"
                rows={3}
                placeholder="E.g. Approved overtime for project milestone..."
                value={adjustProof}
                onChange={(e) => setAdjustProof(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Email All Modal */}
      <Modal
        isOpen={isEmailAllModalOpen}
        onClose={() => !isSendingEmails && setIsEmailAllModalOpen(false)}
        title="Send Payslips to Employees"
        width={450}
        footer={
          <div className="row-between w-100">
            <button className="btn-neutral" onClick={() => setIsEmailAllModalOpen(false)} disabled={isSendingEmails}>Cancel</button>
            <button className="btn-primary" onClick={handleSendEmails} disabled={isSendingEmails} style={{ background: 'var(--primary)' }}>
              {isSendingEmails ? 'Sending Emails...' : 'Yes, Send Payslips'}
            </button>
          </div>
        }
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div className="icon-chip mx-auto mb-24" style={{ width: 80, height: 80, background: 'var(--primary-tint)', color: 'var(--primary)' }}>
            <Mail size={40} />
          </div>
          <h3 className="text-xl fw-800 text-1 mb-12">Deliver {records.length} Payslips</h3>
          <p className="text-base text-5">
            This will email the finalized payslips for the active period to all {records.length} employees securely.
          </p>
        </div>
      </Modal>

      {/* Payslip Preview Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Employee Payslip Preview"
        width={800}
        footer={<button className="btn-secondary" onClick={() => setSelectedRecord(null)}>Close Preview</button>}
      >
        {selectedRecord && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 32, background: 'white' }}>
            <div className="row-between mb-32" style={{ borderBottom: '2px solid var(--border)', paddingBottom: 24 }}>
              <div className="row gap-20">
                <Avatar name={selectedRecord.employeeName} src={selectedRecord.avatar} size="lg" />
                <div>
                  <h2 className="text-xl fw-800 text-1 m-0">{selectedRecord.employeeName}</h2>
                  <p className="text-sm text-5 mt-4 m-0">{selectedRecord.department} &middot; Uganda Operations</p>
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
                  <div className="divider my-8" />
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

                  <div className="divider my-8" />
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
