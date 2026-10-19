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
  CalendarDays,
  TrendingDown,
  TrendingUp,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Printer,
  Sliders,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { usePayroll } from '@/context/PayrollContext';
import {
  PayrollRule,
  RuleCategory,
  RuleScope,
  CalculationMethod,
  formatMoney,
  PayrollCalculationResult,
  calculateEmployeePayroll,
  AttendancePayrollSummary,
  EmployeePayrollProfile,
} from '@/utils/payrollEngine';

const TABS = ['Overview', 'Rules Engine', 'Run Payroll', 'Paystubs', 'Settings'];
const WIZARD_STEPS = ['Hours & Attendance', 'Earnings & Adjustments', 'Taxes & Deductions', 'Review & Finalize'];

const COUNTRY_CURRENCIES: Record<string, string> = {
  UG: 'UGX', KE: 'KES', RW: 'RWF', TZ: 'TZS', US: 'USD', GB: 'GBP', CA: 'CAD',
  NG: 'NGN', ZA: 'ZAR', GH: 'GHS', IN: 'INR', AU: 'AUD', NZ: 'NZD', EU: 'EUR',
  DE: 'EUR', FR: 'EUR', IE: 'EUR', NL: 'EUR', ES: 'EUR', IT: 'EUR', AE: 'AED',
};

const COUNTRY_OPTIONS = Object.keys(COUNTRY_CURRENCIES).map((code) => ({
  code,
  name: new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code,
  currency: COUNTRY_CURRENCIES[code],
})).sort((a, b) => a.name.localeCompare(b.name));

// Standard simulated workforce roster for comprehensive payroll testing
const DEFAULT_ROSTER: EmployeePayrollProfile[] = [
  {
    employeeId: 'emp-bushu',
    employeeName: 'Bushu Hamuli Zacharie',
    employeeNumber: '# 10974',
    email: 'bushu.zacharie@helpware.com',
    department: 'Regional Staff - Africa',
    jobTitle: 'Customer Support Representative',
    countryCode: 'UG',
    currency: 'UGX',
    compensationModel: 'hourly',
    hourlyRate: 18500,
    baseSalary: 3200000,
    dailyRate: 145000,
    expectedHoursPerWeek: 40,
    standardMonthlyHours: 173.33,
    isExemptFromOvertime: false,
  },
  {
    employeeId: 'emp-brenda',
    employeeName: 'Brenda Nansubuga',
    employeeNumber: '# 10975',
    email: 'brenda.nansubuga@helpware.com',
    department: 'People Operations',
    jobTitle: 'HR Operations Lead',
    countryCode: 'UG',
    currency: 'UGX',
    compensationModel: 'monthly_salary',
    hourlyRate: 26000,
    baseSalary: 4500000,
    dailyRate: 205000,
    expectedHoursPerWeek: 40,
    standardMonthlyHours: 173.33,
    isExemptFromOvertime: true,
  },
  {
    employeeId: 'emp-david',
    employeeName: 'David Okello',
    employeeNumber: '# 10976',
    email: 'david.okello@helpware.com',
    department: 'Engineering & QA',
    jobTitle: 'Senior Systems Architect',
    countryCode: 'UG',
    currency: 'UGX',
    compensationModel: 'monthly_salary',
    hourlyRate: 40000,
    baseSalary: 7200000,
    dailyRate: 325000,
    expectedHoursPerWeek: 40,
    standardMonthlyHours: 173.33,
    isExemptFromOvertime: true,
  },
  {
    employeeId: 'emp-sarah',
    employeeName: 'Sarah Tumusiime',
    employeeNumber: '# 10977',
    email: 'sarah.tumusiime@helpware.com',
    department: 'Customer Experience',
    jobTitle: 'Support Specialist - Night Shift',
    countryCode: 'UG',
    currency: 'UGX',
    compensationModel: 'overtime_based',
    hourlyRate: 16500,
    baseSalary: 2850000,
    dailyRate: 130000,
    expectedHoursPerWeek: 40,
    standardMonthlyHours: 173.33,
    isExemptFromOvertime: false,
  },
  {
    employeeId: 'emp-michael',
    employeeName: 'Michael Kato',
    employeeNumber: '# 10978',
    email: 'michael.kato@helpware.com',
    department: 'Sales & Partnerships',
    jobTitle: 'Account Executive',
    countryCode: 'UG',
    currency: 'UGX',
    compensationModel: 'commission_based',
    hourlyRate: 20000,
    baseSalary: 3500000,
    dailyRate: 160000,
    expectedHoursPerWeek: 40,
    standardMonthlyHours: 173.33,
    isExemptFromOvertime: false,
  },
];

export default function PayrollPage() {
  const { getToken } = useAuth();
  const {
    rules,
    settings,
    payrollRuns,
    bonusesPenalties,
    addRule,
    deleteRule,
    toggleRuleActive,
    resetRulesToDefault,
    toggleEmployeePayslipsVisibility,
    updateSettings,
    runPayrollForPeriod,
    approvePayrollRun,
    getEmployeeCompensationDetails,
  } = usePayroll();

  const [activeTab, setActiveTab] = useState('Overview');
  const [wizardStep, setWizardStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollRunSuccess, setPayrollRunSuccess] = useState(false);
  const [selectedPaystub, setSelectedPaystub] = useState<PayrollCalculationResult | null>(null);

  // Filter for rules engine
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('all');
  const [ruleSearch, setRuleSearch] = useState<string>('');

  // Create rule modal state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    category: 'overtime' as RuleCategory,
    scope: 'company' as RuleScope,
    countryCode: 'UG',
    calculationMethod: 'multiplier_x_base_rate' as CalculationMethod,
    rateOrAmount: 1.5,
    multiplier: 1.5,
    isTaxable: true,
    isPensionable: true,
    requiresApproval: true,
    priority: 20,
  });

  // Paystubs search and period filter
  const [paystubSearch, setPaystubSearch] = useState('');
  const [paystubMonthFilter, setPaystubMonthFilter] = useState('10');

  // Country settings form
  const [countrySearch, setCountrySearch] = useState('');
  const [configCountry, setConfigCountry] = useState(settings.defaultCountry || 'UG');
  const [configCurrency, setConfigCurrency] = useState(settings.defaultCurrency || 'UGX');
  const [configHours, setConfigHours] = useState(String(settings.standardMonthlyHours || 173.33));

  // Live calculated payroll dataset for the active wizard cycle (October 2026)
  const [wizardAttendance, setWizardAttendance] = useState<Record<string, AttendancePayrollSummary>>({
    'emp-bushu': {
      employeeId: 'emp-bushu',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      recordedHours: 180.0,
      productiveHours: 168.5,
      billableHours: 158.5,
      payableRegularHours: 168.5,
      approvedOvertimeHours: 8.5,
      unapprovedOvertimeHours: 0,
      holidaySpecialHours: 8.0,
      nightShiftHours: 0,
      daysWorked: 21,
      expectedDays: 22,
      absentDays: 1,
      missingPunchCount: 0,
    },
    'emp-brenda': {
      employeeId: 'emp-brenda',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      recordedHours: 173.33,
      productiveHours: 173.33,
      billableHours: 173.33,
      payableRegularHours: 173.33,
      approvedOvertimeHours: 0,
      unapprovedOvertimeHours: 0,
      holidaySpecialHours: 0,
      nightShiftHours: 0,
      daysWorked: 22,
      expectedDays: 22,
      absentDays: 0,
      missingPunchCount: 0,
    },
    'emp-david': {
      employeeId: 'emp-david',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      recordedHours: 185.0,
      productiveHours: 173.33,
      billableHours: 170.0,
      payableRegularHours: 173.33,
      approvedOvertimeHours: 0,
      unapprovedOvertimeHours: 0,
      holidaySpecialHours: 0,
      nightShiftHours: 0,
      daysWorked: 22,
      expectedDays: 22,
      absentDays: 0,
      missingPunchCount: 0,
    },
    'emp-sarah': {
      employeeId: 'emp-sarah',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      recordedHours: 176.0,
      productiveHours: 164.0,
      billableHours: 164.0,
      payableRegularHours: 164.0,
      approvedOvertimeHours: 14.0,
      unapprovedOvertimeHours: 0,
      holidaySpecialHours: 0,
      nightShiftHours: 80.0,
      daysWorked: 20,
      expectedDays: 22,
      absentDays: 2,
      missingPunchCount: 1, // Flagged missing punch for audit demonstration
    },
    'emp-michael': {
      employeeId: 'emp-michael',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      recordedHours: 170.0,
      productiveHours: 165.0,
      billableHours: 155.0,
      payableRegularHours: 165.0,
      approvedOvertimeHours: 0,
      unapprovedOvertimeHours: 0,
      holidaySpecialHours: 0,
      nightShiftHours: 0,
      daysWorked: 21,
      expectedDays: 22,
      absentDays: 1,
      missingPunchCount: 0,
    },
  });

  // Calculate current run items from active rules & attendance
  const currentRunItems = useMemo(() => {
    return DEFAULT_ROSTER.map((emp) => {
      const att = wizardAttendance[emp.employeeId] || {
        employeeId: emp.employeeId,
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        recordedHours: 173.33,
        productiveHours: 173.33,
        billableHours: 173.33,
        payableRegularHours: 173.33,
        approvedOvertimeHours: 0,
        unapprovedOvertimeHours: 0,
        holidaySpecialHours: 0,
        nightShiftHours: 0,
        daysWorked: 22,
        expectedDays: 22,
        absentDays: 0,
        missingPunchCount: 0,
      };

      return calculateEmployeePayroll(emp, att, rules, bonusesPenalties, 10, 2026);
    });
  }, [rules, bonusesPenalties, wizardAttendance]);

  // Aggregate totals
  const cycleTotals = useMemo(() => {
    return currentRunItems.reduce(
      (acc, item) => {
        acc.gross += item.grossPay;
        acc.deductions += item.employeeDeductions;
        acc.net += item.netPay;
        acc.employerCost += item.totalEmployerCost;
        acc.overtimeSpend += item.overtimeCompensation;
        acc.productiveHours += item.productiveHours;
        acc.missingPunches += item.missingPunchWarnings;
        return acc;
      },
      {
        gross: 0,
        deductions: 0,
        net: 0,
        employerCost: 0,
        overtimeSpend: 0,
        productiveHours: 0,
        missingPunches: 0,
      }
    );
  }, [currentRunItems]);

  // Adjust modal state in wizard
  const [adjustTarget, setAdjustTarget] = useState<PayrollCalculationResult | null>(null);
  const [adjustHours, setAdjustHours] = useState('');
  const [adjustOt, setAdjustOt] = useState('');

  const handleApplyAdjustment = () => {
    if (!adjustTarget) return;
    const empId = adjustTarget.employeeId;
    const existing = wizardAttendance[empId];
    if (existing) {
      setWizardAttendance({
        ...wizardAttendance,
        [empId]: {
          ...existing,
          productiveHours: Number(adjustHours) || existing.productiveHours,
          approvedOvertimeHours: Number(adjustOt) || existing.approvedOvertimeHours,
          missingPunchCount: 0, // Cleared on audit adjustment
        },
      });
      toast.success('Hours adjusted', `Updated attendance record for ${adjustTarget.employeeName}.`);
    }
    setAdjustTarget(null);
  };

  // Execution of Finalize
  const handleFinalizePayRun = () => {
    setIsProcessing(true);
    setTimeout(() => {
      runPayrollForPeriod('October 2026 Final Payroll', '2026-10-01', '2026-10-31', '2026-10-31');
      setIsProcessing(false);
      setPayrollRunSuccess(true);
      setActiveTab('Overview');
      setWizardStep(0);
      toast.success('Payroll Finalized & Locked', 'October pay statements generated and locked for disbursement.');
    }, 600);
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (ruleCategoryFilter !== 'all' && r.category !== ruleCategoryFilter) return false;
      if (ruleSearch.trim() && !r.name.toLowerCase().includes(ruleSearch.toLowerCase()) && !r.description.toLowerCase().includes(ruleSearch.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rules, ruleCategoryFilter, ruleSearch]);

  // All Paystubs repository
  const allPaystubs = useMemo(() => {
    const list: PayrollCalculationResult[] = [];
    DEFAULT_ROSTER.forEach((emp) => {
      const details = getEmployeeCompensationDetails(emp.employeeId);
      list.push(...details);
    });
    return list.filter((p) => {
      if (paystubMonthFilter !== 'all' && String(p.periodMonth) !== paystubMonthFilter) return false;
      if (paystubSearch.trim() && !p.employeeName.toLowerCase().includes(paystubSearch.toLowerCase())) return false;
      return true;
    });
  }, [getEmployeeCompensationDetails, paystubMonthFilter, paystubSearch]);

  /* =========================================================================
     TAB 1: OVERVIEW
     ========================================================================= */
  const renderOverview = () => (
    <div>
      <div className="row-between mb-32 align-center">
        <div>
          <h2 className="text-2xl fw-800 text-1 m-0">Payroll Engine &amp; Operations</h2>
          <div className="row gap-8 mt-8 align-center">
            <Badge variant="primary">Cycle: October 1 – October 31, 2026</Badge>
            <span className="text-sm text-4">
              Jurisdiction: {settings.defaultCountry} · Currency: {settings.defaultCurrency} · Standard: {settings.standardMonthlyHours}h/mo
            </span>
          </div>
        </div>
        <div className="row gap-10">
          <button className="btn-neutral" onClick={() => setActiveTab('Rules Engine')}>
            <Sliders size={15} className="mr-6" /> Configure Rules
          </button>
          <button className="btn-primary" onClick={() => setActiveTab('Run Payroll')}>
            <DollarSign size={15} className="mr-6" /> Run Payroll Wizard
          </button>
        </div>
      </div>

      {payrollRunSuccess && (
        <div className="mb-24 p-20 row gap-16 align-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, color: '#166534' }}>
          <CheckCircle2 size={24} />
          <div style={{ flex: 1 }}>
            <div className="text-base fw-700">October 2026 Pay Run Successfully Finalized</div>
            <div className="text-xs text-4 mt-2">All employee pay statements and tax schedules have been recorded. You can view or print them in the Paystubs tab.</div>
          </div>
          <button className="btn-secondary btn-sm" onClick={() => setActiveTab('Paystubs')}>
            View Paystubs
          </button>
        </div>
      )}

      {/* Attendance & Time Tracking Audit Alert Banner */}
      {cycleTotals.missingPunches > 0 && (
        <div className="mb-28 p-16 row gap-16 align-center" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10 }}>
          <AlertTriangle size={20} style={{ color: '#D97706' }} />
          <div style={{ flex: 1 }}>
            <span className="text-sm fw-700 text-1">Attendance Audit Notice: </span>
            <span className="text-sm text-4">
              1 employee has an unresolved clock-out or attendance anomaly in this pay cycle. Please review in the Run Payroll wizard before finalizing.
            </span>
          </div>
          <button className="btn-neutral btn-sm" onClick={() => { setActiveTab('Run Payroll'); setWizardStep(0); }}>
            Review Anomaly
          </button>
        </div>
      )}

      {/* Aggregate Stats Ribbon */}
      <StatRibbon
        stats={[
          {
            label: 'Total Employer Cost',
            value: formatMoney(cycleTotals.employerCost, settings.defaultCurrency),
            color: 'var(--primary)',
            icon: <Building size={18} />,
            description: 'Gross pay + 10% employer NSSF',
          },
          {
            label: 'Total Net Disbursed',
            value: formatMoney(cycleTotals.net, settings.defaultCurrency),
            color: '#16A34A',
            icon: <DollarSign size={18} />,
            description: 'Total take-home pay to employees',
          },
          {
            label: 'Statutory Taxes & Deductions',
            value: formatMoney(cycleTotals.deductions, settings.defaultCurrency),
            color: '#EA580C',
            icon: <FileText size={18} />,
            description: 'PAYE + 5% employee NSSF + penalties',
          },
          {
            label: 'Active Employees',
            value: currentRunItems.length,
            color: 'var(--text-1)',
            icon: <Clock size={18} />,
            description: 'Configured on dynamic payroll models',
          },
        ]}
        style={{ marginBottom: 32 }}
      />

      {/* Secondary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        <Card>
          <CardBody style={{ padding: 20 }}>
            <div className="row-between mb-16">
              <h4 className="text-base fw-700 text-1 m-0">Supported Compensation Models</h4>
              <Badge variant="neutral">{DEFAULT_ROSTER.length} Employees</Badge>
            </div>
            <p className="text-xs text-4 mb-16">
              EasyHR dynamically computes each employee based on their contracted model without requiring code changes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div className="row-between p-8" style={{ background: '#F8FAFC', borderRadius: 8 }}>
                <span className="fw-600">Hourly (Rate × Productive Hours)</span>
                <Badge variant="primary">1 Employee</Badge>
              </div>
              <div className="row-between p-8" style={{ background: '#F8FAFC', borderRadius: 8 }}>
                <span className="fw-600">Monthly Fixed Salary</span>
                <Badge variant="primary">2 Employees</Badge>
              </div>
              <div className="row-between p-8" style={{ background: '#F8FAFC', borderRadius: 8 }}>
                <span className="fw-600">Overtime-Based (Base + Tiered Multipliers)</span>
                <Badge variant="primary">1 Employee</Badge>
              </div>
              <div className="row-between p-8" style={{ background: '#F8FAFC', borderRadius: 8 }}>
                <span className="fw-600">Commission &amp; Mixed Compensation</span>
                <Badge variant="primary">1 Employee</Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: 20 }}>
            <div className="row-between mb-16">
              <h4 className="text-base fw-700 text-1 m-0">Attendance &amp; Hours Utilization</h4>
              <Badge variant="success">97.2% Scheduled</Badge>
            </div>
            <p className="text-xs text-4 mb-16">
              Reconciled from biometric and mobile punches: Recorded vs Productive vs Billable vs Overtime.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                <span className="text-xs text-4 block">Productive Hours</span>
                <strong className="text-base text-1">{cycleTotals.productiveHours.toFixed(1)} hrs</strong>
              </div>
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                <span className="text-xs text-4 block">Overtime Spend</span>
                <strong className="text-base text-1" style={{ color: '#16A34A' }}>
                  +{formatMoney(cycleTotals.overtimeSpend, settings.defaultCurrency)}
                </strong>
              </div>
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                <span className="text-xs text-4 block">Active Dynamic Rules</span>
                <strong className="text-base text-1">{rules.filter((r) => r.isActive).length} Active Rules</strong>
              </div>
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                <span className="text-xs text-4 block">Employee Payslips Tab</span>
                <strong className="text-base text-1" style={{ color: settings.showPayslipsTabToEmployees ? '#16A34A' : '#64748B' }}>
                  {settings.showPayslipsTabToEmployees ? 'Enabled for All' : 'HR Only'}
                </strong>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Payroll Runs */}
      <h3 className="text-xl fw-800 text-1 mb-16">Recent Payroll Runs</h3>
      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: '#F9FAFB', color: 'var(--text-4)', fontSize: 12, textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Period &amp; Title</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Total Cost</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Net Disbursed</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollRuns.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div className="fw-700 text-1 text-sm">{p.title}</div>
                      <div className="text-xs text-4 mt-2">{p.periodStart} – {p.periodEnd} (Paid: {p.payDate})</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600 }}>
                      {formatMoney(p.totalEmployerCost, p.currency)}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#16A34A' }}>
                      {formatMoney(p.totalNetPay, p.currency)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Badge variant={p.status === 'paid' || p.status === 'finalized' ? 'success' : 'primary'}>
                        {p.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button
                        className="btn-neutral btn-sm"
                        onClick={() => {
                          setPaystubMonthFilter(p.periodStart.includes('-10-') ? '10' : p.periodStart.includes('-09-') ? '9' : '8');
                          setActiveTab('Paystubs');
                        }}
                      >
                        View Statements
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  /* =========================================================================
     TAB 2: RULES ENGINE
     ========================================================================= */
  const renderRulesEngine = () => (
    <div>
      <div className="row-between mb-24 align-center">
        <div>
          <h2 className="text-2xl fw-800 text-1 m-0">Dynamic Payroll Rules Engine</h2>
          <p className="text-sm text-4 mt-4 m-0">
            Configure formulas, multipliers, allowances, public holiday premiums, and statutory tax brackets without code changes.
          </p>
        </div>
        <div className="row gap-10">
          <button className="btn-neutral btn-sm" onClick={resetRulesToDefault} title="Restore default templates">
            <RefreshCw size={14} className="mr-6" /> Restore Templates
          </button>
          <button className="btn-primary btn-sm" onClick={() => setIsRuleModalOpen(true)}>
            <Plus size={14} className="mr-6" /> Create Payroll Rule
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="row-between mb-20 gap-16 flex-wrap align-center">
        <div className="row gap-6 flex-wrap">
          {['all', 'base_pay', 'overtime', 'higher_rate', 'statutory_tax', 'pension_employee', 'pension_employer', 'allowance', 'bonus'].map((cat) => (
            <button
              key={cat}
              onClick={() => setRuleCategoryFilter(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                borderColor: ruleCategoryFilter === cat ? 'var(--primary)' : 'var(--border)',
                background: ruleCategoryFilter === cat ? 'var(--primary-tint, #EEF2F6)' : '#FFFFFF',
                color: ruleCategoryFilter === cat ? 'var(--primary)' : 'var(--text-2)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }} />
          <input
            className="input"
            style={{ paddingLeft: 34, fontSize: 12.5 }}
            placeholder="Search rules..."
            value={ruleSearch}
            onChange={(e) => setRuleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Rules Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: '#64748B', fontSize: 11.5, textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Rule Name &amp; Description</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Category</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Calculation Method</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Rate / Value</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Scope</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                      No rules match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 20px', maxWidth: 280 }}>
                        <div className="fw-700 text-1">{r.name}</div>
                        <div className="text-xs text-4 mt-2">{r.description}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Badge variant="neutral">{r.category.replace('_', ' ').toUpperCase()}</Badge>
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: 11.5, color: '#334155' }}>
                        {r.calculationMethod.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                        {r.multiplier ? `${r.multiplier}× Multiplier` : r.brackets ? `${r.brackets.length} Tax Brackets` : `${r.rateOrAmount}%`}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          {r.scope.toUpperCase()} ({r.countryCode})
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          type="button"
                          onClick={() => toggleRuleActive(r.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 14,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 11.5,
                            fontWeight: 700,
                            background: r.isActive ? '#DCFCE7' : '#F1F5F9',
                            color: r.isActive ? '#15803D' : '#64748B',
                          }}
                        >
                          {r.isActive ? <Check size={12} /> : <X size={12} />}
                          {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => deleteRule(r.id)}
                          className="btn-neutral btn-sm"
                          style={{ padding: '5px 8px', color: '#DC2626' }}
                          title="Delete rule"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  /* =========================================================================
     TAB 3: RUN PAYROLL WIZARD
     ========================================================================= */
  const renderWizard = () => (
    <div style={{ margin: '0 auto' }}>
      <div className="row-between mb-24 align-center">
        <div>
          <h2 className="text-2xl fw-800 text-1 m-0">Run Payroll Cycle</h2>
          <div className="row gap-8 mt-6">
            <Badge variant="primary">Cycle: October 2026 ({currentRunItems.length} Employees)</Badge>
          </div>
        </div>
        <button className="btn-neutral" onClick={() => setActiveTab('Overview')}>Save &amp; Exit</button>
      </div>

      {/* Stepper Header */}
      <div className="row mb-28" style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        {WIZARD_STEPS.map((step, idx) => (
          <div key={idx} className="row" style={{ flex: 1, alignItems: 'center' }}>
            <div
              className="row gap-10 align-center cursor-pointer"
              onClick={() => setWizardStep(idx)}
              style={{ opacity: wizardStep === idx ? 1 : 0.6 }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  background: wizardStep >= idx ? 'var(--primary)' : '#F1F5F9',
                  color: wizardStep >= idx ? '#FFFFFF' : '#64748B',
                }}
              >
                {wizardStep > idx ? <Check size={14} /> : idx + 1}
              </div>
              <span className="text-xs fw-700 text-1">{step}</span>
            </div>
            {idx < WIZARD_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: wizardStep > idx ? 'var(--primary)' : '#E2E8F0', margin: '0 16px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Wizard Content Container */}
      <Card style={{ overflow: 'hidden', marginBottom: 28 }}>
        <CardBody style={{ padding: 0 }}>
          {/* STEP 1: Hours & Attendance Reconciliation */}
          {wizardStep === 0 && (
            <div>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9' }}>
                <h3 className="text-lg fw-700 text-1 m-0">Step 1: Hours &amp; Attendance Reconciliation</h3>
                <p className="text-xs text-4 mt-4 m-0">
                  Separating Recorded hours, Productive hours, Billable hours, and Approved Overtime before executing pay calculation.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800, fontSize: 12.5 }}>
                  <thead style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: '#64748B', fontSize: 11.5, textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '14px 24px', fontWeight: 700 }}>Employee</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Recorded Hours</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Productive Hours</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Schedule %</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Approved Overtime</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status / Anomaly</th>
                      <th style={{ padding: '14px 24px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRunItems.map((r) => (
                      <tr key={r.employeeId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 24px' }}>
                          <div className="fw-700 text-1">{r.employeeName}</div>
                          <div className="text-xs text-4 mt-1">{r.payRateDisplay} · {r.compensationModel}</div>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#475569' }}>{r.recordedHours} hrs</td>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F766E' }}>{r.productiveHours} hrs</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontWeight: 600, color: r.productiveHoursPercent >= 95 ? '#16A34A' : '#D97706' }}>
                            {r.productiveHoursPercent}%
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {r.approvedOvertimeHours > 0 ? (
                            <Badge variant="warning">{r.approvedOvertimeHours}h (1.5×)</Badge>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>0h</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {r.missingPunchWarnings > 0 ? (
                            <Badge variant="danger">1 Missing Clock-out</Badge>
                          ) : (
                            <Badge variant="success">Punches Reconciled</Badge>
                          )}
                        </td>
                        <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustTarget(r);
                              setAdjustHours(String(r.productiveHours));
                              setAdjustOt(String(r.approvedOvertimeHours));
                            }}
                            className="btn-neutral btn-sm"
                            style={{ fontSize: 11.5 }}
                          >
                            <Edit3 size={12} className="mr-4" /> Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 2: Earnings & Adjustments */}
          {wizardStep === 1 && (
            <div>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9' }}>
                <h3 className="text-lg fw-700 text-1 m-0">Step 2: Earnings &amp; Adjustments</h3>
                <p className="text-xs text-4 mt-4 m-0">
                  Review Base Compensation, Overtime multipliers, Differentials, and One-time Bonuses recorded in the Job section.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800, fontSize: 12.5 }}>
                  <thead style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: '#64748B', fontSize: 11.5, textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '14px 24px', fontWeight: 700 }}>Employee</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Regular Base Pay</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Overtime Pay</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Higher Rates</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Bonuses (Job Sec)</th>
                      <th style={{ padding: '14px 24px', fontWeight: 700, textAlign: 'right' }}>Total Gross</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRunItems.map((r) => (
                      <tr key={r.employeeId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 24px', fontWeight: 600 }}>{r.employeeName}</td>
                        <td style={{ padding: '14px 20px' }}>{formatMoney(r.regularCompensation, r.currency)}</td>
                        <td style={{ padding: '14px 20px', color: r.overtimeCompensation > 0 ? '#16A34A' : '#94A3B8' }}>
                          {r.overtimeCompensation > 0 ? `+${formatMoney(r.overtimeCompensation, r.currency)}` : '—'}
                        </td>
                        <td style={{ padding: '14px 20px', color: r.higherRateCompensation > 0 ? '#2563EB' : '#94A3B8' }}>
                          {r.higherRateCompensation > 0 ? `+${formatMoney(r.higherRateCompensation, r.currency)}` : '—'}
                        </td>
                        <td style={{ padding: '14px 20px', color: r.bonusesTotal > 0 ? '#16A34A' : '#94A3B8' }}>
                          {r.bonusesTotal > 0 ? `+${formatMoney(r.bonusesTotal, r.currency)}` : '—'}
                        </td>
                        <td style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 700 }}>
                          {formatMoney(r.grossPay, r.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Taxes & Deductions */}
          {wizardStep === 2 && (
            <div>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9' }}>
                <h3 className="text-lg fw-700 text-1 m-0">Step 3: Statutory Taxes &amp; Authorized Deductions</h3>
                <p className="text-xs text-4 mt-4 m-0">
                  Applied statutory PAYE marginal tax brackets, 5% employee NSSF, and authorized job penalties.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800, fontSize: 12.5 }}>
                  <thead style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: '#64748B', fontSize: 11.5, textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '14px 24px', fontWeight: 700 }}>Employee</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Gross Pay</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>NSSF Employee (5%)</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>PAYE Income Tax</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Penalties / Adv</th>
                      <th style={{ padding: '14px 24px', fontWeight: 700, textAlign: 'right' }}>Total Deductions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRunItems.map((r) => {
                      const nssf = r.breakdown.find((b) => b.category === 'pension_employee')?.amount || 0;
                      const paye = r.breakdown.find((b) => b.category === 'statutory_tax')?.amount || 0;
                      return (
                        <tr key={r.employeeId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '14px 24px', fontWeight: 600 }}>{r.employeeName}</td>
                          <td style={{ padding: '14px 20px' }}>{formatMoney(r.grossPay, r.currency)}</td>
                          <td style={{ padding: '14px 20px', color: '#DC2626' }}>-{formatMoney(nssf, r.currency)}</td>
                          <td style={{ padding: '14px 20px', color: '#DC2626' }}>-{formatMoney(paye, r.currency)}</td>
                          <td style={{ padding: '14px 20px', color: r.penaltiesTotal > 0 ? '#DC2626' : '#94A3B8' }}>
                            {r.penaltiesTotal > 0 ? `-${formatMoney(r.penaltiesTotal, r.currency)}` : '—'}
                          </td>
                          <td style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                            -{formatMoney(r.employeeDeductions, r.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Finalize */}
          {wizardStep === 3 && (
            <div>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9' }}>
                <h3 className="text-lg fw-700 text-1 m-0">Step 4: Final Review &amp; Executive Approval</h3>
                <p className="text-xs text-4 mt-4 m-0">
                  Review the complete payroll disbursement summary. Once approved, employee payslips will be generated and available.
                </p>
              </div>

              <div style={{ padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <span className="text-xs text-4 block">Total Gross Pay</span>
                    <strong className="text-lg text-1">{formatMoney(cycleTotals.gross, settings.defaultCurrency)}</strong>
                  </div>
                  <div style={{ padding: 16, background: '#FEF2F2', borderRadius: 10, border: '1px solid #FEE2E2' }}>
                    <span className="text-xs text-error block">Total Deductions</span>
                    <strong className="text-lg text-error">-{formatMoney(cycleTotals.deductions, settings.defaultCurrency)}</strong>
                  </div>
                  <div style={{ padding: 16, background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
                    <span className="text-xs text-success block">Total Net Disbursement</span>
                    <strong className="text-lg text-success">{formatMoney(cycleTotals.net, settings.defaultCurrency)}</strong>
                  </div>
                  <div style={{ padding: 16, background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
                    <span className="text-xs text-primary block">Total Employer Cost</span>
                    <strong className="text-lg text-primary">{formatMoney(cycleTotals.employerCost, settings.defaultCurrency)}</strong>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5 }}>
                      <tr>
                        <th style={{ padding: '12px 18px' }}>Employee</th>
                        <th style={{ padding: '12px 18px' }}>Model</th>
                        <th style={{ padding: '12px 18px' }}>Gross</th>
                        <th style={{ padding: '12px 18px' }}>Deductions</th>
                        <th style={{ padding: '12px 18px' }}>Net Pay</th>
                        <th style={{ padding: '12px 18px' }}>Employer Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRunItems.map((r) => (
                        <tr key={r.employeeId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 18px', fontWeight: 600 }}>{r.employeeName}</td>
                          <td style={{ padding: '12px 18px' }}>
                            <Badge variant="neutral">{r.compensationModel.toUpperCase()}</Badge>
                          </td>
                          <td style={{ padding: '12px 18px' }}>{formatMoney(r.grossPay, r.currency)}</td>
                          <td style={{ padding: '12px 18px', color: '#DC2626' }}>-{formatMoney(r.employeeDeductions, r.currency)}</td>
                          <td style={{ padding: '12px 18px', fontWeight: 700, color: '#16A34A' }}>{formatMoney(r.netPay, r.currency)}</td>
                          <td style={{ padding: '12px 18px', fontWeight: 600 }}>{formatMoney(r.totalEmployerCost, r.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stepper Footer Controls */}
      <div className="row-between">
        <button
          className="btn-neutral"
          disabled={wizardStep === 0}
          onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}
        >
          Previous Step
        </button>

        {wizardStep < 3 ? (
          <button className="btn-primary" onClick={() => setWizardStep((prev) => Math.min(3, prev + 1))}>
            Proceed to {WIZARD_STEPS[wizardStep + 1]} <ChevronRight size={16} className="ml-6" />
          </button>
        ) : (
          <button className="btn-primary" onClick={handleFinalizePayRun} disabled={isProcessing}>
            {isProcessing ? <Loader2 size={16} className="animate-spin mr-6" /> : <ShieldCheck size={16} className="mr-6" />}
            Finalize &amp; Approve Payroll Run
          </button>
        )}
      </div>
    </div>
  );

  /* =========================================================================
     TAB 4: PAYSTUBS REPOSITORY
     ========================================================================= */
  const renderPaystubs = () => (
    <div>
      <div className="row-between mb-24 align-center">
        <div>
          <h2 className="text-2xl fw-800 text-1 m-0">Paystubs &amp; Compensation Statements</h2>
          <p className="text-sm text-4 mt-4 m-0">Official calculated payslips across company pay periods.</p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="row-between mb-20 gap-16 flex-wrap align-center">
        <div className="row gap-8 align-center">
          <label className="text-xs fw-700 text-4 uppercase">Period:</label>
          <select
            className="select"
            value={paystubMonthFilter}
            onChange={(e) => setPaystubMonthFilter(e.target.value)}
            style={{ fontSize: 13, minWidth: 160 }}
          >
            <option value="all">All Pay Periods</option>
            <option value="10">October 2026</option>
            <option value="9">September 2026</option>
            <option value="8">August 2026</option>
          </select>
        </div>

        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }} />
          <input
            className="input"
            style={{ paddingLeft: 34, fontSize: 12.5 }}
            placeholder="Search employee name..."
            value={paystubSearch}
            onChange={(e) => setPaystubSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: '#64748B', fontSize: 11.5, textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Pay Period</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Gross Pay</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Deductions</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Net Pay</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '14px 24px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allPaystubs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                      No paystubs found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  allPaystubs.map((p, idx) => (
                    <tr key={`${p.employeeId}-${p.periodMonth}-${p.periodYear}-${idx}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 24px' }}>
                        <div className="fw-700 text-1">{p.employeeName}</div>
                        <div className="text-xs text-4">{p.compensationModel} · {p.payRateDisplay}</div>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#475569' }}>
                        Month {p.periodMonth}, {p.periodYear}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                        {formatMoney(p.grossPay, p.currency)}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#DC2626' }}>
                        -{formatMoney(p.employeeDeductions, p.currency)}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#16A34A' }}>
                        {formatMoney(p.netPay, p.currency)}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Badge variant="success">FINALIZED</Badge>
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedPaystub(p)}
                          className="btn-neutral btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                        >
                          <Eye size={13} /> View Statement
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  /* =========================================================================
     TAB 5: SETTINGS & VISIBILITY TOGGLE
     ========================================================================= */
  const renderSettings = () => (
    <div style={{ maxWidth: 840 }}>
      <h2 className="text-2xl fw-800 text-1 mb-8">Payroll Engine Settings</h2>
      <p className="text-base text-4 mb-28">
        Configure company jurisdiction, currency, standard work hours, and employee portal visibility.
      </p>

      {/* Feature 1: Employee Payslips Tab Visibility Toggle */}
      <Card style={{ marginBottom: 24, border: '1px solid #BFDBFE', background: '#F8FAFC' }}>
        <CardBody style={{ padding: 24 }}>
          <div className="row-between align-center">
            <div style={{ flex: 1, paddingRight: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className="text-base fw-700 text-1 m-0">Employee Profile &amp; Payslips Tab Visibility</h3>
                <Badge variant={settings.showPayslipsTabToEmployees ? 'success' : 'neutral'}>
                  {settings.showPayslipsTabToEmployees ? 'VISIBLE TO EMPLOYEES' : 'RESTRICTED (HR ONLY)'}
                </Badge>
              </div>
              <p className="text-xs text-4 mt-6 m-0" style={{ lineHeight: 1.6 }}>
                When enabled, employees can view the <strong>Payslips</strong> tab and live <strong>Calculation Formula</strong> directly in their profile (<code>/people/me</code>). When disabled, the tab is hidden from regular employees. HR Administrators and Line Managers always retain full access.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleEmployeePayslipsVisibility}
              className={settings.showPayslipsTabToEmployees ? 'btn-neutral' : 'btn-primary'}
              style={{ padding: '10px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {settings.showPayslipsTabToEmployees ? (
                <>
                  <ToggleRight size={18} style={{ color: '#16A34A' }} />
                  <span>Disable for Employees</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={18} />
                  <span>Enable for Employees</span>
                </>
              )}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Jurisdiction & Base Currency */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title="Company Jurisdiction & Currency" />
        <CardBody>
          <div className="row gap-20 mb-20">
            <label className="col gap-8" style={{ flex: 1 }}>
              <span className="text-sm fw-600 text-2">Primary Country</span>
              <select
                className="select"
                value={configCountry}
                onChange={(e) => {
                  const opt = COUNTRY_OPTIONS.find((c) => c.code === e.target.value);
                  setConfigCountry(e.target.value);
                  if (opt?.currency) setConfigCurrency(opt.currency);
                }}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code}) · {c.currency}
                  </option>
                ))}
              </select>
            </label>

            <label className="col gap-8" style={{ flex: 1 }}>
              <span className="text-sm fw-600 text-2">Disbursement Currency</span>
              <input
                className="input"
                maxLength={3}
                value={configCurrency}
                onChange={(e) => setConfigCurrency(e.target.value.toUpperCase())}
              />
            </label>
          </div>

          <label className="col gap-8 mb-24" style={{ maxWidth: 360 }}>
            <span className="text-sm fw-600 text-2">Standard Monthly Expected Hours</span>
            <input
              className="input"
              type="number"
              value={configHours}
              onChange={(e) => setConfigHours(e.target.value)}
            />
            <small className="text-4">Typically 173.33 hours (40 hrs/wk × 52 wks ÷ 12 mos)</small>
          </label>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              updateSettings({
                defaultCountry: configCountry,
                defaultCurrency: configCurrency,
                standardMonthlyHours: Number(configHours) || 173.33,
              });
            }}
          >
            <Save size={15} className="mr-6" /> Save Settings
          </button>
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader
        title="Payroll Engine"
        subtitle="Dynamic, configurable compensation, rule engine, and pay run lifecycle."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '36px 48px', background: 'var(--bg-page)' }}>
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Rules Engine' && renderRulesEngine()}
        {activeTab === 'Run Payroll' && renderWizard()}
        {activeTab === 'Paystubs' && renderPaystubs()}
        {activeTab === 'Settings' && renderSettings()}
      </div>

      {/* MODAL: VIEW / PRINT PAYSTUB STATEMENT */}
      {selectedPaystub && (
        <Modal
          isOpen={!!selectedPaystub}
          onClose={() => setSelectedPaystub(null)}
          title={`Official Pay Statement — Month ${selectedPaystub.periodMonth}, ${selectedPaystub.periodYear}`}
          width={760}
        >
          <div style={{ padding: '8px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>EasyHR / Helpware</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Corporate Payroll Disbursement Statement</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginTop: 8 }}>{selectedPaystub.employeeName}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Model: {selectedPaystub.compensationModel.toUpperCase()} · Rate: {selectedPaystub.payRateDisplay}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge variant="success">PAYSLIP FINALIZED</Badge>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>Period: Month {selectedPaystub.periodMonth}, {selectedPaystub.periodYear}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Currency: {selectedPaystub.currency}</div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
              <div>
                <span style={{ color: '#64748B', display: 'block' }}>Productive Hours:</span>
                <strong style={{ fontSize: 14, color: '#0F766E' }}>{selectedPaystub.productiveHours} hrs</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block' }}>Approved Overtime:</span>
                <strong style={{ fontSize: 14, color: 'var(--text-1)' }}>{selectedPaystub.approvedOvertimeHours} hrs</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block' }}>Days Worked:</span>
                <strong style={{ fontSize: 14, color: 'var(--text-1)' }}>{selectedPaystub.daysWorked} days</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 10 }}>Earnings (Additions)</div>
                <table style={{ width: '100%', fontSize: 12.5 }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0' }}>Base Productive Pay</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>{formatMoney(selectedPaystub.regularCompensation, selectedPaystub.currency)}</td>
                    </tr>
                    {selectedPaystub.overtimeCompensation > 0 && (
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 0' }}>Approved Overtime</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#16A34A' }}>+{formatMoney(selectedPaystub.overtimeCompensation, selectedPaystub.currency)}</td>
                      </tr>
                    )}
                    {selectedPaystub.bonusesTotal > 0 && (
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 0' }}>Bonuses (Job Sec)</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#16A34A' }}>+{formatMoney(selectedPaystub.bonusesTotal, selectedPaystub.currency)}</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '2px solid #CBD5E1' }}>
                      <td style={{ padding: '8px 0', fontWeight: 700 }}>Total Gross</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800 }}>{formatMoney(selectedPaystub.grossPay, selectedPaystub.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 10 }}>Deductions (Subtractions)</div>
                <table style={{ width: '100%', fontSize: 12.5 }}>
                  <tbody>
                    {selectedPaystub.breakdown
                      .filter((b) => !b.isAddition && !b.isEmployerCost)
                      .map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 0' }}>{item.name}</td>
                          <td style={{ padding: '6px 0', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>-{formatMoney(item.amount, selectedPaystub.currency)}</td>
                        </tr>
                      ))}
                    <tr style={{ borderTop: '2px solid #CBD5E1' }}>
                      <td style={{ padding: '8px 0', fontWeight: 700, color: '#991B1B' }}>Total Deductions</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: '#991B1B' }}>-{formatMoney(selectedPaystub.employeeDeductions, selectedPaystub.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: '#DCFCE7', padding: '16px 20px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Net Take-Home Pay</div>
                <div style={{ fontSize: 11, color: '#15803D' }}>Approved for electronic bank / wallet disbursement</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D' }}>
                {formatMoney(selectedPaystub.netPay, selectedPaystub.currency)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-neutral" onClick={() => setSelectedPaystub(null)}>Close</button>
              <button type="button" className="btn-primary" onClick={() => window.print()}>
                <Printer size={15} className="mr-6" /> Print / Save PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CREATE CUSTOM RULE */}
      {isRuleModalOpen && (
        <Modal
          isOpen={isRuleModalOpen}
          onClose={() => setIsRuleModalOpen(false)}
          title="Create Dynamic Payroll Rule"
          width={520}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addRule({
                name: ruleForm.name,
                description: ruleForm.description,
                category: ruleForm.category,
                scope: ruleForm.scope,
                countryCode: ruleForm.countryCode,
                calculationMethod: ruleForm.calculationMethod,
                rateOrAmount: Number(ruleForm.rateOrAmount) || 0,
                multiplier: Number(ruleForm.multiplier) || 1.0,
                isTaxable: ruleForm.isTaxable,
                isPensionable: ruleForm.isPensionable,
                isRecurring: true,
                requiresApproval: ruleForm.requiresApproval,
                isActive: true,
                priority: Number(ruleForm.priority) || 20,
                effectiveFrom: new Date().toISOString().slice(0, 10),
              });
              setIsRuleModalOpen(false);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label className="text-xs fw-700 text-2 block mb-4">Rule Name</label>
              <input
                className="input"
                placeholder="E.g. Weekend Differential or Customer Satisfaction Bonus"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs fw-700 text-2 block mb-4">Description</label>
              <input
                className="input"
                placeholder="Calculation formula explanation..."
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="text-xs fw-700 text-2 block mb-4">Category</label>
                <select
                  className="select"
                  value={ruleForm.category}
                  onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value as RuleCategory })}
                >
                  <option value="overtime">Overtime (1.5x / 2.0x)</option>
                  <option value="higher_rate">Higher Rate / Differential</option>
                  <option value="allowance">Allowance (Transport / Housing)</option>
                  <option value="bonus">Bonus / Incentive</option>
                  <option value="commission">Sales Commission</option>
                  <option value="penalty_deduction">Penalty / Deduction</option>
                </select>
              </div>

              <div>
                <label className="text-xs fw-700 text-2 block mb-4">Calculation Method</label>
                <select
                  className="select"
                  value={ruleForm.calculationMethod}
                  onChange={(e) => setRuleForm({ ...ruleForm, calculationMethod: e.target.value as CalculationMethod })}
                >
                  <option value="multiplier_x_base_rate">Multiplier × Base Rate</option>
                  <option value="rate_x_productive_hours">Rate × Productive Hours</option>
                  <option value="percent_of_gross">% of Gross Earnings</option>
                  <option value="percent_of_base">% of Base Pay</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="text-xs fw-700 text-2 block mb-4">Rate / Multiplier / Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="e.g. 1.5 or 5"
                  value={ruleForm.multiplier}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      multiplier: Number(e.target.value) || 1,
                      rateOrAmount: Number(e.target.value) || 1,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-xs fw-700 text-2 block mb-4">Scope</label>
                <select
                  className="select"
                  value={ruleForm.scope}
                  onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value as RuleScope })}
                >
                  <option value="company">Entire Company</option>
                  <option value="department">Department</option>
                  <option value="job">Specific Job Position</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ruleForm.isTaxable}
                  onChange={(e) => setRuleForm({ ...ruleForm, isTaxable: e.target.checked })}
                />
                Subject to Income Tax (PAYE)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ruleForm.requiresApproval}
                  onChange={(e) => setRuleForm({ ...ruleForm, requiresApproval: e.target.checked })}
                />
                Requires Manager Approval
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn-neutral" onClick={() => setIsRuleModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add Rule to Engine
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ADJUST HOURS & ANOMALY */}
      {adjustTarget && (
        <Modal
          isOpen={!!adjustTarget}
          onClose={() => setAdjustTarget(null)}
          title={`Adjust Attendance Hours — ${adjustTarget.employeeName}`}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p className="text-xs text-4 m-0">
              Audit corrections apply directly to the October 2026 pay cycle calculation.
            </p>

            <div>
              <label className="text-xs fw-700 text-2 block mb-4">Eligible Productive Hours</label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={adjustHours}
                onChange={(e) => setAdjustHours(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs fw-700 text-2 block mb-4">Approved Overtime Hours (1.5×)</label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={adjustOt}
                onChange={(e) => setAdjustOt(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn-neutral" onClick={() => setAdjustTarget(null)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleApplyAdjustment}>Apply &amp; Reconcile</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
