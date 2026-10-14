"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  Clock,
  FileText,
  Mail,
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
import { Modal } from '@/components/ui/Modal';
import { UgandaTaxEngine, formatCurrency } from '@/utils/payrollCalc';
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

interface PayrollEmployee {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface PayrollCompensation {
  id: string;
  employeeId: string;
  employeeName: string;
  effectiveDate: string;
  currency: string;
  payFrequency: string;
  baseAmountMinor: number;
  payType: string;
  reason: string;
}
interface PayrollPayslip { id:string;employeeId:string;employeeName:string;email:string;periodStart:string;periodEnd:string;payDate:string;currency:string;basePay:number;earnings:number;deductions:number;netPay:number;deliveryStatus:string }

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
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>([]);
  const [compensation, setCompensation] = useState<PayrollCompensation[]>([]);
  const [payrollRunId, setPayrollRunId] = useState('');
  const [payslips, setPayslips] = useState<PayrollPayslip[]>([]);
  const [compensationForm, setCompensationForm] = useState({ employeeId: '', amount: '', effectiveDate: new Date().toISOString().slice(0, 10), reason: '' });
  const [isSavingCompensation, setIsSavingCompensation] = useState(false);
  const [payrollConfigForm, setPayrollConfigForm] = useState({ country: '', currency: '', standardMonthlyMinutes: '' });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [taxRules,setTaxRules]=useState<any[]>([]);
  const [taxRuleForm,setTaxRuleForm]=useState({ruleName:'Income tax',ruleType:'progressive_tax',ratePercent:'0',bands:'[{"upTo":1000000,"ratePercent":0},{"upTo":0,"ratePercent":10}]'});
  const [isSavingTaxRule,setIsSavingTaxRule]=useState(false);

  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  // Email payslips modal

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

      const [periodsRes, configsRes, compensationRes, employeesRes,taxRulesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/payroll/periods`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/compensation`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees?limit=100`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/tax-rules`,{headers}),
      ]);

      if (periodsRes.ok) {
        const pData = await periodsRes.json();
        setPeriods(Array.isArray(pData) ? pData : []);
        const latestLocked=(Array.isArray(pData)?pData:[]).find((p:PayrollPeriod)=>p.status==='locked'||p.status==='paid');
        if(latestLocked){const runsRes=await fetch(`${API_BASE_URL}/api/v1/payroll/periods/${latestLocked.id}/runs`,{headers});if(runsRes.ok){const runs=await runsRes.json();const approved=Array.isArray(runs)?runs.find((run:any)=>run.status==='approved'):null;if(approved){const slipsRes=await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${approved.id}/payslips`,{headers});if(slipsRes.ok){const slips=await slipsRes.json();setPayslips(slips.data||[]);setPayrollRunId(approved.id)}}}}
      }

      if (configsRes.ok) {
        const cData = await configsRes.json();
        const configs = Array.isArray(cData) ? cData : [];
        setConfigurations(configs);
        if (configs[0]) setPayrollConfigForm({ country: configs[0].country, currency: configs[0].currency, standardMonthlyMinutes: String(configs[0].standardMonthlyMinutes) });
      }
      if(taxRulesRes.ok){const d=await taxRulesRes.json();setTaxRules(d.data||[])}
      if (compensationRes.ok) {
        const compData = await compensationRes.json();
        setCompensation(Array.isArray(compData) ? compData : []);
      }
      if (employeesRes.ok) {
        const employeeData = await employeesRes.json();
        const employeeList = Array.isArray(employeeData) ? employeeData : employeeData.data || [];
        setPayrollEmployees(employeeList.filter((e: PayrollEmployee) => e.status === 'active'));
        if (employeeList.length) setCompensationForm((v) => ({ ...v, employeeId: v.employeeId || employeeList.find((e: PayrollEmployee) => e.status === 'active')?.id || '' }));
      }

      // Payroll rows must come from calculated payroll run items; roster
      // membership alone does not imply an employee has an active salary.
      setRecords([]);
    } catch (err) {
      console.error("Failed to load payroll data", err);
      toast.error("Payroll data unavailable", "Refresh the page or contact an administrator if this continues.");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const loadPayslips = useCallback(async (runId:string) => { const token=await getToken();if(!token)return;const response=await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${runId}/payslips`,{headers:getAuthHeaders(token)});if(response.ok){const data=await response.json();setPayslips(data.data||[]);setPayrollRunId(runId)} },[getToken]);
  const emailPayslips = async () => { if(!payrollRunId)return;try{const token=await getToken();if(!token)throw new Error('Not authenticated');const response=await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${payrollRunId}/payslips/email`,{method:'POST',headers:getAuthHeaders(token)});const data=await response.json();if(!response.ok)throw new Error(data.detail||'Could not email payslips');toast.success('Payslips emailed',`${data.sent} sent · ${data.failed} failed`);await loadPayslips(payrollRunId)}catch(e){toast.error('Email failed',e instanceof Error?e.message:'Could not send payslips')} };

  const savePayrollConfiguration = async () => {
    const minutes = Number(payrollConfigForm.standardMonthlyMinutes);
    if (payrollConfigForm.country.trim().length !== 2 || payrollConfigForm.currency.trim().length !== 3 || !Number.isInteger(minutes) || minutes <= 0) {
      toast.error('Check payroll settings', 'Enter a 2-letter country code, 3-letter currency code, and positive monthly minutes.');
      return;
    }
    setIsSavingConfig(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, {
        method: 'POST',
        headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: payrollConfigForm.country.trim().toUpperCase(), currency: payrollConfigForm.currency.trim().toUpperCase(), standardMonthlyMinutes: minutes }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Could not save payroll settings.');
      }
      toast.success('Payroll settings saved', 'Company jurisdiction, currency, and monthly minutes are updated.');
      await fetchPayrollData();
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : 'Could not save payroll settings.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const saveTaxRule=async()=>{setIsSavingTaxRule(true);try{const token=await getToken();if(!token||!configurations[0])throw new Error('Save payroll jurisdiction first');const body={country:configurations[0].country,currency:configurations[0].currency,ruleName:taxRuleForm.ruleName,ruleType:taxRuleForm.ruleType,ratePercent:Number(taxRuleForm.ratePercent),bands:taxRuleForm.ruleType==='progressive_tax'?JSON.parse(taxRuleForm.bands):[]};const response=await fetch(`${API_BASE_URL}/api/v1/payroll/tax-rules`,{method:'POST',headers:{...getAuthHeaders(token),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!response.ok){const e=await response.json().catch(()=>({}));throw new Error(e.detail||'Could not save tax rule')}toast.success('Tax rule saved','Payroll will apply this organization rule to future calculations.');await fetchPayrollData()}catch(e){toast.error('Tax rule not saved',e instanceof Error?e.message:'Invalid rule')}finally{setIsSavingTaxRule(false)}};

  const saveCompensation = async () => {
    const amount = Number(compensationForm.amount);
    if (!configurations.length || !compensationForm.employeeId || !Number.isFinite(amount) || amount <= 0 || !compensationForm.effectiveDate) {
      toast.error('Complete compensation details', 'Save company payroll settings, choose an active employee, and enter a positive monthly salary and effective date.');
      return;
    }
    setIsSavingCompensation(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(`${API_BASE_URL}/api/v1/payroll/compensation`, {
        method: 'POST',
        headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: compensationForm.employeeId,
          country: configurations[0].country,
          effectiveDate: compensationForm.effectiveDate,
          currency: configurations[0].currency,
          baseAmountMinor: Math.round(amount * 100),
          reason: compensationForm.reason.trim(),
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Could not save employee compensation.');
      }
      toast.success('Compensation saved', 'The monthly salary record is effective for the date you selected.');
      setCompensationForm((v) => ({ ...v, amount: '', reason: '' }));
      await fetchPayrollData();
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : 'Could not save employee compensation.');
    } finally {
      setIsSavingCompensation(false);
    }
  };

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

      if (configurations.length === 0) {
        throw new Error("Configure your company payroll jurisdiction and currency in Settings first.");
      }

      let periodId = periods.find((period) => period.status === "draft")?.id;
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
        if (!periodRes.ok) throw new Error("Could not create a payroll period.");
        const createdP = await periodRes.json();
        periodId = createdP.id;
      }

      if (!periodId) throw new Error("No payroll period is available.");
      const runRes = await fetch(`${API_BASE_URL}/api/v1/payroll/periods/${periodId}/runs`, { method: "POST", headers });
      if (!runRes.ok) {
        const error = await runRes.json().catch(() => ({}));
        throw new Error(error.detail || "Payroll calculation failed. Check employee compensation records and payroll settings.");
      }

      const createdRun=await runRes.json();
      const lockRes=await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${createdRun.id}/lock`,{method:'POST',headers});
      if(!lockRes.ok)throw new Error('Payroll calculated, but approval and paystub generation could not be completed.');
      await loadPayslips(createdRun.id);
      setPayrollRun(true);
      setActiveTab('Overview');
      setWizardStep(0);
      toast.success("Payroll executed", "Current pay period processed and recorded successfully.");
      await fetchPayrollData();
    } catch (err) {
      toast.error("Execution error", err instanceof Error ? err.message : "Could not complete payroll run.");
    } finally {
      setIsProcessing(false);
    }
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
            <span className="text-sm text-4">{configurations[0] ? `${configurations[0].country} · ${configurations[0].currency}` : 'Payroll configuration required'}</span>
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
            value: records.length ? formatCurrency(payrollTotals.totalEmployerCost, configurations[0]?.currency || 'UGX') : '—',
            color: 'var(--primary)',
            icon: <Building size={18} />,
            description: 'From finalized payroll run items',
          },
          {
            label: 'Total Net Pay',
            value: records.length ? formatCurrency(payrollTotals.totalNet, configurations[0]?.currency || 'UGX') : '—',
            color: 'var(--success)',
            icon: <DollarSign size={18} />,
            description: 'From finalized payroll run items',
          },
          {
            label: 'Total deductions',
            value: records.length ? formatCurrency(payrollTotals.totalPaye, configurations[0]?.currency || 'UGX') : '—',
            color: 'var(--warning)',
            icon: <FileText size={18} />,
            description: 'From finalized payroll run items',
          },
          {
            label: 'Employees in run',
            value: records.length,
            color: 'var(--text-1)',
            icon: <Clock size={18} />,
            description: 'Included in current payroll calculation',
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

  const renderWizard = () => records.length === 0 ? (
    <Card>
      <CardBody style={{ padding: 32 }}>
        <h2 className="text-2xl fw-800 text-1 mb-8">Payroll calculation is not ready</h2>
        <p className="text-base text-4 mb-16">
          This workspace has no finalized run items to review. Payroll needs effective compensation records for every active employee. Tax and deduction rules are currently implemented only for Uganda; custom company rules are not yet supported.
        </p>
        <p className="text-sm text-4 mb-24">
          Current jurisdiction: {configurations[0]?.country || 'not configured'} · Currency: {configurations[0]?.currency || 'not configured'}
        </p>
        <div className="row gap-12">
          <button className="btn-neutral" onClick={() => setActiveTab('Settings')}>Review payroll settings</button>
          <button className="btn-primary" onClick={handleRunPayroll} disabled={isProcessing || configurations.length === 0}>
            {isProcessing ? <Loader2 size={16} className="spin mr-8" /> : null} Check payroll readiness
          </button>
        </div>
      </CardBody>
    </Card>
  ) : (
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
          <p className="text-base text-4 mt-4">Review generated pay statements and email them to employees.</p>
        </div>
        <button className="btn-primary" disabled={!payrollRunId||payslips.length===0} onClick={emailPayslips}><Mail size={16}/> Email payslips</button>
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
              {payslips.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-4)' }}>Finalize a payroll run to generate payslips.</td></tr>
              )}
              {payslips.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '20px 32px' }}>
                    <div className="row gap-16">
                      <Avatar name={r.employeeName} size="md" />
                      <div>
                        <div className="text-base fw-700 text-1">{r.employeeName}</div>
                        <div className="text-xs text-5 mt-2">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: 14 }}>
                    {r.periodStart} to {r.periodEnd}
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: 15, fontWeight: 700 }}>
                    {formatCurrency(r.netPay / 100, r.currency)}
                  </td>
                  <td style={{ padding: '20px 32px' }}>
                    <Badge variant={r.deliveryStatus==='delivered'?'success':'warning'}>{r.deliveryStatus}</Badge>
                  </td>
                  <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                    <div className="row gap-8 justify-end">
                      <a className="btn-secondary" style={{ padding: '8px 12px' }} href={`/payroll/payslips/${r.id}`} target="_blank">View</a>
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
      <p className="text-base text-4 mb-32">Set the company payroll jurisdiction, currency, and standard work minutes.</p>
      <Card>
        <CardHeader title="Company Payroll Configuration" />
        <CardBody>
          <div className="row gap-20 mb-24">
            <label className="col gap-8" style={{ flex: 1 }}>
              <span className="text-sm fw-600 text-2">Country code (ISO 3166-1)</span>
              <input className="input" maxLength={2} value={payrollConfigForm.country} placeholder="e.g. UG" onChange={(e) => setPayrollConfigForm((v) => ({ ...v, country: e.target.value }))} />
            </label>
            <label className="col gap-8" style={{ flex: 1 }}>
              <span className="text-sm fw-600 text-2">Currency code (ISO 4217)</span>
              <input className="input" maxLength={3} value={payrollConfigForm.currency} placeholder="e.g. UGX" onChange={(e) => setPayrollConfigForm((v) => ({ ...v, currency: e.target.value }))} />
            </label>
          </div>
          <label className="col gap-8 mb-24" style={{ maxWidth: 380 }}>
            <span className="text-sm fw-600 text-2">Standard monthly work minutes</span>
            <input className="input" type="number" min={1} step={1} value={payrollConfigForm.standardMonthlyMinutes} placeholder="Enter your standard monthly minutes" onChange={(e) => setPayrollConfigForm((v) => ({ ...v, standardMonthlyMinutes: e.target.value }))} />
          </label>
          <p className="text-sm text-4 mb-24">Configure your organization’s statutory brackets and deductions below. Payroll runs require at least one active rule for this jurisdiction.</p>
          <button className="btn-primary" onClick={savePayrollConfiguration} disabled={isSavingConfig}>
            {isSavingConfig ? <Loader2 size={16} className="mr-8 spin" /> : <Save size={16} className="mr-8" />}
            Save payroll settings
          </button>
        </CardBody>
      </Card>
      <Card style={{marginTop:24}}><CardHeader title="Statutory tax & deduction rules"/><CardBody><p className="text-sm text-4 mb-16">Rules are stored per company and jurisdiction. Progressive band thresholds are in minor currency units; use <code>0</code> for the final uncapped band.</p><div className="grid-2 gap-12 mb-12"><input className="input" value={taxRuleForm.ruleName} onChange={e=>setTaxRuleForm(v=>({...v,ruleName:e.target.value}))} placeholder="Rule name"/><select className="input" value={taxRuleForm.ruleType} onChange={e=>setTaxRuleForm(v=>({...v,ruleType:e.target.value}))}><option value="progressive_tax">Progressive tax</option><option value="flat_deduction">Percentage deduction</option></select></div>{taxRuleForm.ruleType==='progressive_tax'?<textarea className="input" rows={5} value={taxRuleForm.bands} onChange={e=>setTaxRuleForm(v=>({...v,bands:e.target.value}))}/>:<label className="col gap-8 mb-12">Deduction percentage<input className="input" type="number" min="0" max="100" step="0.01" value={taxRuleForm.ratePercent} onChange={e=>setTaxRuleForm(v=>({...v,ratePercent:e.target.value}))}/></label>}<button className="btn-primary mt-12" disabled={isSavingTaxRule||!configurations.length} onClick={saveTaxRule}>{isSavingTaxRule?'Saving…':'Save tax rule'}</button><div className="col gap-8 mt-20">{taxRules.map(rule=><div key={rule.id} className="row-between p-12" style={{borderTop:'1px solid var(--border)'}}><span><strong>{rule.ruleName}</strong> · {rule.country} · {rule.ruleType}</span><Badge variant="success">Active</Badge></div>)}</div></CardBody></Card>
      <Card style={{ marginTop: 24 }}>
        <CardHeader title="Employee Monthly Compensation" />
        <CardBody>
          <p className="text-sm text-4 mb-20">Set each active employee’s effective monthly salary. Payroll uses the latest record effective on the pay period end date, in the company payroll currency.</p>
          {configurations.length === 0 && <p className="text-sm text-warning mb-16">Save company payroll settings before adding employee compensation.</p>}
          <div className="grid-2 gap-16 mb-16">
            <label className="col gap-8">
              <span className="text-sm fw-600 text-2">Active employee</span>
              <select className="input" value={compensationForm.employeeId} onChange={(e) => setCompensationForm((v) => ({ ...v, employeeId: e.target.value }))}>
                <option value="">Choose an employee</option>
                {payrollEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
              </select>
            </label>
            <label className="col gap-8">
              <span className="text-sm fw-600 text-2">Monthly salary ({configurations[0]?.currency || 'company currency'})</span>
              <input className="input" type="number" min="0.01" step="0.01" value={compensationForm.amount} placeholder="Enter agreed monthly salary" onChange={(e) => setCompensationForm((v) => ({ ...v, amount: e.target.value }))} />
            </label>
          </div>
          <div className="grid-2 gap-16 mb-16">
            <label className="col gap-8">
              <span className="text-sm fw-600 text-2">Effective from</span>
              <input className="input" type="date" value={compensationForm.effectiveDate} onChange={(e) => setCompensationForm((v) => ({ ...v, effectiveDate: e.target.value }))} />
            </label>
            <label className="col gap-8">
              <span className="text-sm fw-600 text-2">Reason (optional)</span>
              <input className="input" maxLength={1000} value={compensationForm.reason} placeholder="New hire, annual review, promotion..." onChange={(e) => setCompensationForm((v) => ({ ...v, reason: e.target.value }))} />
            </label>
          </div>
          <button className="btn-primary mb-24" onClick={saveCompensation} disabled={isSavingCompensation || configurations.length === 0 || payrollEmployees.length === 0}>
            {isSavingCompensation ? <Loader2 size={16} className="mr-8 spin" /> : <Save size={16} className="mr-8" />} Save compensation
          </button>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th className="text-left p-12 text-xs text-4">Employee</th><th className="text-left p-12 text-xs text-4">Effective date</th><th className="text-right p-12 text-xs text-4">Monthly salary</th><th className="text-left p-12 text-xs text-4">Reason</th></tr></thead>
              <tbody>
                {compensation.map((item) => <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}><td className="p-12 text-sm fw-600">{item.employeeName}</td><td className="p-12 text-sm">{item.effectiveDate}</td><td className="p-12 text-sm text-right">{item.currency} {(item.baseAmountMinor / 100).toLocaleString()}</td><td className="p-12 text-sm text-4">{item.reason || '—'}</td></tr>)}
                {compensation.length === 0 && <tr><td colSpan={4} className="p-16 text-sm text-4 text-center">No employee compensation records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader
        title="Payroll Processing"
        subtitle="Configure payroll and review calculated pay runs."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '48px', background: 'var(--bg-page)' }}>
        {payrollRun && activeTab === 'Overview' && (
          <div className="mb-40 p-24 row gap-20" style={{ background: 'var(--success-tint)', border: '1px solid var(--success)', borderRadius: 12, color: 'var(--success)' }}>
            <CheckCircle2 size={32} />
            <div>
              <div className="text-lg fw-800">Payroll calculated</div>
              <div className="text-sm mt-4 fw-600">The run is approved and pay statements are ready. Email them from the Paystubs tab.</div>
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
