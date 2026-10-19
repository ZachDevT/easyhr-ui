/**
 * Dynamic Configurable Payroll Engine for EasyHR
 * Supports Hourly, Monthly Salary, Daily, Overtime-based, Commission-based, and Mixed Compensation models.
 * Multi-country statutory tax, pension, higher rates, allowances, bonuses, penalties, and attendance reconciliation.
 */

export type CompensationModel = 
  | 'hourly'
  | 'monthly_salary'
  | 'daily'
  | 'overtime_based'
  | 'commission_based'
  | 'mixed';

export type RuleScope = 'company' | 'department' | 'job' | 'employee';

export type RuleCategory = 
  | 'base_pay'
  | 'overtime'
  | 'higher_rate'
  | 'allowance'
  | 'bonus'
  | 'commission'
  | 'statutory_tax'
  | 'pension_employee'
  | 'pension_employer'
  | 'penalty_deduction'
  | 'other_deduction';

export type CalculationMethod =
  | 'rate_x_productive_hours'    // Rate * Productive Hours
  | 'fixed_amount'               // Fixed periodic amount
  | 'daily_rate_x_days'          // Daily Rate * Payable Days
  | 'multiplier_x_base_rate'     // (Base Rate * Multiplier) * Overtime Hours
  | 'premium_addition'           // Hours * Base Rate * Additional Premium Multiplier
  | 'percent_of_base'            // % of Base Pay
  | 'percent_of_gross'           // % of Gross Pay
  | 'bracket_marginal_tax';      // Marginal progressive tax brackets

export interface TaxBracket {
  min: number;
  max: number | null; // null for unbounded / excess
  ratePercent: number;
  fixedBase?: number;
}

export interface PayrollRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  scope: RuleScope;
  scopeId?: string; // departmentId, jobId, employeeId if not company
  scopeName?: string;
  countryCode: string; // 'UG', 'KE', 'RW', 'US', 'GB', 'ALL'
  calculationMethod: CalculationMethod;
  rateOrAmount: number; // e.g. hourly rate, flat amount, or percentage (e.g. 10 for 10%)
  multiplier?: number; // e.g. 1.5, 2.0, 0.25
  brackets?: TaxBracket[];
  isTaxable: boolean;
  isPensionable: boolean;
  isRecurring: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  priority: number; // Order of evaluation (lower runs earlier)
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string;
}

export interface EmployeePayrollProfile {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  email: string;
  avatar?: string;
  department: string;
  departmentId?: string;
  jobTitle: string;
  jobId?: string;
  countryCode: string;
  currency: string;
  compensationModel: CompensationModel;
  baseSalary: number; // Monthly base salary or base pay
  hourlyRate: number; // Base hourly rate
  dailyRate: number;  // Base daily rate
  expectedHoursPerWeek: number; // usually 40
  standardMonthlyHours: number; // usually 173.33 (40 * 52 / 12)
  isExemptFromOvertime?: boolean;
  paymentMethod?: string;
  bankOrWalletDetails?: string;
}

export interface BonusPenaltyRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'bonus' | 'penalty';
  category: string; // 'Performance Bonus', 'Attendance Bonus', 'Signing Bonus', 'Unpaid Absence', 'Equipment Damaged', 'Salary Advance', etc.
  amount: number;
  currency: string;
  periodMonth: number; // 1 - 12
  periodYear: number;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  addedBy: string;
  createdAt: string;
}

export interface AttendancePayrollSummary {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  recordedHours: number;        // Raw clock-in to clock-out total
  productiveHours: number;      // Productive work minus unpaid breaks
  billableHours: number;        // Customer/project billable hours
  payableRegularHours: number;  // Regular hours capped at shift schedule
  approvedOvertimeHours: number;// Overtime hours verified and approved
  unapprovedOvertimeHours: number;
  holidaySpecialHours: number;  // Hours worked on public holidays/rest days
  nightShiftHours: number;      // Hours worked during night window
  daysWorked: number;
  expectedDays: number;
  absentDays: number;
  missingPunchCount: number;    // Punches missing clock-out or irregular
}

export interface CalculationBreakdownItem {
  id: string;
  name: string;
  category: RuleCategory;
  description: string;
  amount: number;
  isAddition: boolean; // true = addition to gross / net, false = deduction
  isEmployerCost?: boolean;
  notes?: string;
}

export interface PayrollCalculationResult {
  employeeId: string;
  employeeName: string;
  periodMonth: number;
  periodYear: number;
  currency: string;
  compensationModel: CompensationModel;
  payRateDisplay: string;
  
  // Attendance metrics
  recordedHours: number;
  productiveHours: number;
  productiveHoursPercent: number; // (productive / expected) * 100
  regularPayableHours: number;
  approvedOvertimeHours: number;
  holidaySpecialHours: number;
  daysWorked: number;
  missingPunchWarnings: number;

  // Earnings Components
  regularCompensation: number; // Base pay / Productive Pay
  overtimeCompensation: number;
  higherRateCompensation: number;
  bonusesTotal: number;
  penaltiesTotal: number;
  allowancesTotal: number;
  commissionsTotal: number;
  
  // Totals
  grossPay: number;            // Total Gross before employee deductions
  employeeDeductions: number;  // Taxes + Pension + Penalties + Other deductions
  netPay: number;              // Gross - Employee Deductions
  
  // Employer costs
  employerPension: number;
  employerOtherCosts: number;
  totalEmployerCost: number;   // Gross + Employer contributions

  // Explanatory breakdown
  breakdown: CalculationBreakdownItem[];
  formulaSummary: string;
}

export interface PayrollRunRecord {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  currency: string;
  status: 'draft' | 'calculated' | 'under_review' | 'approved' | 'finalized' | 'paid';
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalEmployerCost: number;
  itemCount: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

/* =========================================================================
   DEFAULT TEMPLATES FOR BEGINNER-FRIENDLY CONFIGURATION
   ========================================================================= */

export const DEFAULT_PAYROLL_TEMPLATES: PayrollRule[] = [
  // 1. Standard Hourly Pay
  {
    id: 'tmpl-hourly-base',
    name: 'Standard Hourly Pay',
    description: 'Calculates base regular earnings as Base Hourly Rate × Eligible Productive Hours',
    category: 'base_pay',
    scope: 'company',
    countryCode: 'ALL',
    calculationMethod: 'rate_x_productive_hours',
    rateOrAmount: 1, // Uses employee's assigned hourlyRate
    isTaxable: true,
    isPensionable: true,
    isRecurring: true,
    requiresApproval: false,
    isActive: true,
    priority: 10,
    effectiveFrom: '2024-01-01',
  },

  // 2. Standard Monthly Fixed Salary
  {
    id: 'tmpl-monthly-salary',
    name: 'Monthly Fixed Salary',
    description: 'Fixed base monthly salary paid across the pay period',
    category: 'base_pay',
    scope: 'company',
    countryCode: 'ALL',
    calculationMethod: 'fixed_amount',
    rateOrAmount: 1, // Uses employee's baseSalary
    isTaxable: true,
    isPensionable: true,
    isRecurring: true,
    requiresApproval: false,
    isActive: true,
    priority: 10,
    effectiveFrom: '2024-01-01',
  },

  // 3. Daily Rate Pay
  {
    id: 'tmpl-daily-rate',
    name: 'Daily Rate Pay',
    description: 'Calculates earnings as Daily Rate × Eligible Payable Days Worked',
    category: 'base_pay',
    scope: 'company',
    countryCode: 'ALL',
    calculationMethod: 'daily_rate_x_days',
    rateOrAmount: 1, // Uses employee's dailyRate
    isTaxable: true,
    isPensionable: true,
    isRecurring: true,
    requiresApproval: false,
    isActive: true,
    priority: 10,
    effectiveFrom: '2024-01-01',
  },

  // 4. Standard Overtime (1.5x)
  {
    id: 'tmpl-overtime-15',
    name: 'Standard Overtime (1.5×)',
    description: 'Approved overtime hours paid at 1.5× the base hourly rate',
    category: 'overtime',
    scope: 'company',
    countryCode: 'ALL',
    calculationMethod: 'multiplier_x_base_rate',
    rateOrAmount: 0,
    multiplier: 1.5,
    isTaxable: true,
    isPensionable: true,
    isRecurring: true,
    requiresApproval: true,
    isActive: true,
    priority: 20,
    effectiveFrom: '2024-01-01',
  },

  // 5. Public Holiday & Weekend Work (2.0x)
  {
    id: 'tmpl-holiday-20',
    name: 'Public Holiday & Rest Day Rate (2.0×)',
    description: 'Double time premium (2.0× hourly rate) for work performed on recognized public holidays',
    category: 'higher_rate',
    scope: 'company',
    countryCode: 'ALL',
    calculationMethod: 'multiplier_x_base_rate',
    rateOrAmount: 0,
    multiplier: 2.0,
    isTaxable: true,
    isPensionable: true,
    isRecurring: true,
    requiresApproval: true,
    isActive: true,
    priority: 25,
    effectiveFrom: '2024-01-01',
  },

  // 6. Night Shift Allowance (+25% Premium)
  {
    id: 'tmpl-night-shift',
    name: 'Night Shift Differential (+25%)',
    description: 'Additional 25% premium on hourly rate for hours worked during scheduled night shifts (10 PM – 6 AM)',
    category: 'higher_rate',
    scope: 'company',
    countryCode: 'ALL',
    calculationMethod: 'premium_addition',
    rateOrAmount: 0,
    multiplier: 0.25,
    isTaxable: true,
    isPensionable: false,
    isRecurring: true,
    requiresApproval: true,
    isActive: true,
    priority: 26,
    effectiveFrom: '2024-01-01',
  },

  // 7. Uganda PAYE Statutory Tax
  {
    id: 'tmpl-ug-paye',
    name: 'Uganda PAYE (Income Tax)',
    description: 'Progressive monthly PAYE tax brackets pursuant to Uganda Tax Law',
    category: 'statutory_tax',
    scope: 'company',
    countryCode: 'UG',
    calculationMethod: 'bracket_marginal_tax',
    rateOrAmount: 0,
    brackets: [
      { min: 0, max: 235000, ratePercent: 0 },
      { min: 235000, max: 335000, ratePercent: 10 },
      { min: 335000, max: 410000, ratePercent: 20 },
      { min: 410000, max: 10000000, ratePercent: 30 },
      { min: 10000000, max: null, ratePercent: 40 }, // 30% + 10% high-earner surcharge
    ],
    isTaxable: false,
    isPensionable: false,
    isRecurring: true,
    requiresApproval: false,
    isActive: true,
    priority: 50,
    effectiveFrom: '2024-01-01',
  },

  // 8. Uganda NSSF Employee Contribution (5%)
  {
    id: 'tmpl-ug-nssf-ee',
    name: 'Uganda NSSF (Employee 5%)',
    description: 'Statutory 5% deduction from gross wages for national social security fund',
    category: 'pension_employee',
    scope: 'company',
    countryCode: 'UG',
    calculationMethod: 'percent_of_gross',
    rateOrAmount: 5,
    isTaxable: false,
    isPensionable: false,
    isRecurring: true,
    requiresApproval: false,
    isActive: true,
    priority: 40,
    effectiveFrom: '2024-01-01',
  },

  // 9. Uganda NSSF Employer Contribution (10%)
  {
    id: 'tmpl-ug-nssf-er',
    name: 'Uganda NSSF (Employer 10%)',
    description: 'Statutory 10% employer contribution matching employee social security',
    category: 'pension_employer',
    scope: 'company',
    countryCode: 'UG',
    calculationMethod: 'percent_of_gross',
    rateOrAmount: 10,
    isTaxable: false,
    isPensionable: false,
    isRecurring: true,
    requiresApproval: false,
    isActive: true,
    priority: 45,
    effectiveFrom: '2024-01-01',
  },

  // 10. Kenya PAYE Statutory
  {
    id: 'tmpl-ke-paye',
    name: 'Kenya PAYE (Income Tax)',
    description: 'Progressive monthly PAYE tax brackets for Kenya',
    category: 'statutory_tax',
    scope: 'company',
    countryCode: 'KE',
    calculationMethod: 'bracket_marginal_tax',
    rateOrAmount: 0,
    brackets: [
      { min: 0, max: 24000, ratePercent: 10 },
      { min: 24000, max: 32333, ratePercent: 25 },
      { min: 32333, max: 500000, ratePercent: 30 },
      { min: 500000, max: 800000, ratePercent: 32.5 },
      { min: 800000, max: null, ratePercent: 35 },
    ],
    isTaxable: false,
    isPensionable: false,
    isRecurring: true,
    requiresApproval: false,
    isActive: false, // Inactive by default unless Kenya selected
    priority: 50,
    effectiveFrom: '2024-01-01',
  },

  // 11. US Standard FICA Deduction (Social Security + Medicare 7.65%)
  {
    id: 'tmpl-us-fica',
    name: 'US FICA (Social Security & Medicare 7.65%)',
    description: 'Employee Federal Insurance Contributions Act statutory deduction',
    category: 'statutory_tax',
    scope: 'company',
    countryCode: 'US',
    calculationMethod: 'percent_of_gross',
    rateOrAmount: 7.65,
    isTaxable: false,
    isPensionable: false,
    isRecurring: true,
    requiresApproval: false,
    isActive: false,
    priority: 50,
    effectiveFrom: '2024-01-01',
  },

  // 12. Transport Allowance
  {
    id: 'tmpl-allowance-transport',
    name: 'Transport Allowance',
    description: 'Monthly flat transport stipend',
    category: 'allowance',
    scope: 'company',
    countryCode: 'ALL',
    calculationMethod: 'fixed_amount',
    rateOrAmount: 150000, // in local currency
    isTaxable: true,
    isPensionable: false,
    isRecurring: true,
    requiresApproval: false,
    isActive: false,
    priority: 30,
    effectiveFrom: '2024-01-01',
  },

  // 13. Attendance Bonus (Configurable)
  {
    id: 'tmpl-bonus-attendance',
    name: 'Full Attendance Bonus',
    description: 'Incentive bonus awarded for zero unexcused tardiness and 100% productive shift completion',
    category: 'bonus',
    scope: 'company',
    countryCode: 'ALL',
    calculationMethod: 'fixed_amount',
    rateOrAmount: 100000,
    isTaxable: true,
    isPensionable: false,
    isRecurring: true,
    requiresApproval: true,
    isActive: false,
    priority: 35,
    effectiveFrom: '2024-01-01',
  },
];

/* =========================================================================
   CORE CALCULATION ENGINE
   ========================================================================= */

/**
 * Reconciles punch records into structured attendance buckets
 */
export function calculateAttendanceSummary(
  punches: Array<{ kind: 'in' | 'out'; occurredAt: string; activity?: string; isBillable?: boolean }>,
  periodStart: string,
  periodEnd: string,
  expectedHoursPerMonth: number = 173.33
): AttendancePayrollSummary {
  const startTs = new Date(periodStart).getTime();
  const endTs = new Date(periodEnd).getTime() + 86400000; // inclusive of end date

  const filteredPunches = punches
    .filter((p) => {
      const t = new Date(p.occurredAt).getTime();
      return t >= startTs && t <= endTs;
    })
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  let totalRecordedMinutes = 0;
  let totalProductiveMinutes = 0;
  let totalBillableMinutes = 0;
  let missingPunchCount = 0;
  const daysWithPunches = new Set<string>();

  for (let i = 0; i < filteredPunches.length; i++) {
    const p = filteredPunches[i];
    if (p.kind === 'in') {
      const inDate = new Date(p.occurredAt);
      daysWithPunches.add(inDate.toISOString().slice(0, 10));

      const nextPunch = filteredPunches[i + 1];
      if (nextPunch && nextPunch.kind === 'out') {
        const outDate = new Date(nextPunch.occurredAt);
        const diffMins = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60)));
        totalRecordedMinutes += diffMins;

        // If not explicit break or unproductive
        const isBreak = (p.activity || '').toLowerCase().includes('break');
        if (!isBreak) {
          totalProductiveMinutes += diffMins;
        }

        if (p.isBillable !== false) {
          totalBillableMinutes += diffMins;
        }

        i++; // skip paired out punch
      } else {
        // Missing clock-out punch
        missingPunchCount++;
        // Count default conservative 4 hours or flag for HR review
        totalRecordedMinutes += 240;
        totalProductiveMinutes += 240;
      }
    }
  }

  const productiveHours = Math.round((totalProductiveMinutes / 60) * 100) / 100;
  const recordedHours = Math.round((totalRecordedMinutes / 60) * 100) / 100;
  const billableHours = Math.round((totalBillableMinutes / 60) * 100) / 100;

  // Regular payable hours capped at standard monthly expected (e.g. 173.33)
  const regularPayableHours = Math.min(productiveHours, expectedHoursPerMonth);
  // Any productive hours beyond expected count as overtime if eligible
  const approvedOvertimeHours = Math.max(0, Math.round((productiveHours - regularPayableHours) * 100) / 100);

  return {
    employeeId: '',
    periodStart,
    periodEnd,
    recordedHours,
    productiveHours,
    billableHours,
    payableRegularHours: regularPayableHours,
    approvedOvertimeHours,
    unapprovedOvertimeHours: 0,
    holidaySpecialHours: 0,
    nightShiftHours: 0,
    daysWorked: daysWithPunches.size,
    expectedDays: 22,
    absentDays: Math.max(0, 22 - daysWithPunches.size),
    missingPunchCount,
  };
}

/**
 * Calculates complete payroll for an employee applying active rules and one-time bonuses/penalties
 */
export function calculateEmployeePayroll(
  profile: EmployeePayrollProfile,
  attendance: AttendancePayrollSummary,
  rules: PayrollRule[],
  bonusesPenalties: BonusPenaltyRecord[] = [],
  periodMonth: number = new Date().getMonth() + 1,
  periodYear: number = new Date().getFullYear()
): PayrollCalculationResult {
  const breakdown: CalculationBreakdownItem[] = [];

  // Filter applicable active rules
  const applicableRules = rules
    .filter((r) => {
      if (!r.isActive) return false;
      // Country match
      if (r.countryCode !== 'ALL' && r.countryCode !== profile.countryCode) return false;
      // Scope match
      if (r.scope === 'department' && r.scopeId && r.scopeId !== profile.departmentId) return false;
      if (r.scope === 'job' && r.scopeId && r.scopeId !== profile.jobId) return false;
      if (r.scope === 'employee' && r.scopeId && r.scopeId !== profile.employeeId) return false;
      return true;
    })
    .sort((a, b) => a.priority - b.priority);

  // 1. Regular Base Compensation
  let regularCompensation = 0;
  let payRateDisplay = '';

  const model = profile.compensationModel || 'hourly';

  switch (model) {
    case 'hourly': {
      const rate = profile.hourlyRate || (profile.baseSalary ? profile.baseSalary / (profile.standardMonthlyHours || 173.33) : 0);
      regularCompensation = Math.round(rate * attendance.productiveHours);
      payRateDisplay = `${formatMoney(rate, profile.currency)} / hr`;
      breakdown.push({
        id: 'base-hourly',
        name: 'Regular Productive Pay',
        category: 'base_pay',
        description: `${formatMoney(rate, profile.currency)} × ${attendance.productiveHours} productive hrs`,
        amount: regularCompensation,
        isAddition: true,
      });
      break;
    }
    case 'monthly_salary': {
      regularCompensation = profile.baseSalary || 0;
      payRateDisplay = `${formatMoney(regularCompensation, profile.currency)} / mo`;
      breakdown.push({
        id: 'base-salary',
        name: 'Monthly Base Salary',
        category: 'base_pay',
        description: 'Fixed contracted monthly salary',
        amount: regularCompensation,
        isAddition: true,
      });
      break;
    }
    case 'daily': {
      const rate = profile.dailyRate || (profile.baseSalary ? profile.baseSalary / 22 : 0);
      const days = attendance.daysWorked || 22;
      regularCompensation = Math.round(rate * days);
      payRateDisplay = `${formatMoney(rate, profile.currency)} / day`;
      breakdown.push({
        id: 'base-daily',
        name: 'Daily Productive Pay',
        category: 'base_pay',
        description: `${formatMoney(rate, profile.currency)} × ${days} payable days`,
        amount: regularCompensation,
        isAddition: true,
      });
      break;
    }
    case 'overtime_based':
    case 'mixed':
    default: {
      // Base salary or hourly
      if (profile.baseSalary > 0) {
        regularCompensation = profile.baseSalary;
        payRateDisplay = `${formatMoney(regularCompensation, profile.currency)} / mo`;
        breakdown.push({
          id: 'base-mixed-salary',
          name: 'Base Salary Component',
          category: 'base_pay',
          description: 'Standard contracted monthly base',
          amount: regularCompensation,
          isAddition: true,
        });
      } else {
        const rate = profile.hourlyRate || 0;
        regularCompensation = Math.round(rate * attendance.productiveHours);
        payRateDisplay = `${formatMoney(rate, profile.currency)} / hr`;
        breakdown.push({
          id: 'base-mixed-hourly',
          name: 'Regular Productive Pay',
          category: 'base_pay',
          description: `${formatMoney(rate, profile.currency)} × ${attendance.productiveHours} hrs`,
          amount: regularCompensation,
          isAddition: true,
        });
      }
      break;
    }
  }

  // Hourly base rate for overtime/premiums
  const baseHourlyRate = profile.hourlyRate || (profile.baseSalary ? profile.baseSalary / (profile.standardMonthlyHours || 173.33) : 0);

  // 2. Overtime Compensation
  let overtimeCompensation = 0;
  if (!profile.isExemptFromOvertime && attendance.approvedOvertimeHours > 0) {
    // Find overtime rule multiplier (default 1.5)
    const otRule = applicableRules.find((r) => r.category === 'overtime');
    const multiplier = otRule?.multiplier || 1.5;
    overtimeCompensation = Math.round(attendance.approvedOvertimeHours * baseHourlyRate * multiplier);
    breakdown.push({
      id: 'comp-overtime',
      name: otRule?.name || `Approved Overtime (${multiplier}×)`,
      category: 'overtime',
      description: `${attendance.approvedOvertimeHours} approved OT hrs @ ${formatMoney(baseHourlyRate * multiplier, profile.currency)}/hr`,
      amount: overtimeCompensation,
      isAddition: true,
    });
  }

  // 3. Higher Rates (Holiday / Night shift)
  let higherRateCompensation = 0;
  if (attendance.holidaySpecialHours > 0) {
    const hrRule = applicableRules.find((r) => r.category === 'higher_rate' && (r.multiplier || 0) >= 1.5);
    const multiplier = hrRule?.multiplier || 2.0;
    const holidayPay = Math.round(attendance.holidaySpecialHours * baseHourlyRate * multiplier);
    higherRateCompensation += holidayPay;
    breakdown.push({
      id: 'comp-holiday',
      name: hrRule?.name || `Public Holiday Work (${multiplier}×)`,
      category: 'higher_rate',
      description: `${attendance.holidaySpecialHours} holiday hrs @ ${formatMoney(baseHourlyRate * multiplier, profile.currency)}/hr`,
      amount: holidayPay,
      isAddition: true,
    });
  }

  if (attendance.nightShiftHours > 0) {
    const nightRule = applicableRules.find((r) => r.name.toLowerCase().includes('night'));
    const multiplier = nightRule?.multiplier || 0.25;
    const nightPay = Math.round(attendance.nightShiftHours * baseHourlyRate * multiplier);
    higherRateCompensation += nightPay;
    breakdown.push({
      id: 'comp-night',
      name: nightRule?.name || 'Night Shift Differential (+25%)',
      category: 'higher_rate',
      description: `${attendance.nightShiftHours} night shift hrs premium`,
      amount: nightPay,
      isAddition: true,
    });
  }

  // 4. Configured Allowances
  let allowancesTotal = 0;
  const allowanceRules = applicableRules.filter((r) => r.category === 'allowance');
  for (const rule of allowanceRules) {
    let amt = 0;
    if (rule.calculationMethod === 'fixed_amount') {
      amt = rule.rateOrAmount;
    } else if (rule.calculationMethod === 'percent_of_base') {
      amt = Math.round((regularCompensation * rule.rateOrAmount) / 100);
    }
    if (amt > 0) {
      allowancesTotal += amt;
      breakdown.push({
        id: `allowance-${rule.id}`,
        name: rule.name,
        category: 'allowance',
        description: rule.description,
        amount: amt,
        isAddition: true,
      });
    }
  }

  // 5. One-time Bonuses & Penalties (from Job tab records for this period)
  let bonusesTotal = 0;
  let penaltiesTotal = 0;

  const periodBonusesPenalties = bonusesPenalties.filter(
    (bp) =>
      bp.employeeId === profile.employeeId &&
      bp.periodMonth === periodMonth &&
      bp.periodYear === periodYear &&
      bp.status === 'approved'
  );

  for (const item of periodBonusesPenalties) {
    if (item.type === 'bonus') {
      bonusesTotal += item.amount;
      breakdown.push({
        id: `bonus-${item.id}`,
        name: item.category,
        category: 'bonus',
        description: item.reason || 'One-time approved bonus (Job section)',
        amount: item.amount,
        isAddition: true,
      });
    } else {
      penaltiesTotal += item.amount;
      breakdown.push({
        id: `penalty-${item.id}`,
        name: item.category,
        category: 'penalty_deduction',
        description: item.reason || 'One-time approved penalty / advance (Job section)',
        amount: item.amount,
        isAddition: false,
      });
    }
  }

  // 6. Configured Recurring Bonuses & Commissions
  let commissionsTotal = 0;
  const commissionRules = applicableRules.filter((r) => r.category === 'commission');
  for (const rule of commissionRules) {
    let amt = 0;
    if (rule.calculationMethod === 'fixed_amount') amt = rule.rateOrAmount;
    else if (rule.calculationMethod === 'percent_of_base') amt = Math.round((regularCompensation * rule.rateOrAmount) / 100);
    if (amt > 0) {
      commissionsTotal += amt;
      breakdown.push({
        id: `comm-${rule.id}`,
        name: rule.name,
        category: 'commission',
        description: rule.description,
        amount: amt,
        isAddition: true,
      });
    }
  }

  // 7. Calculate Gross Pay
  // Gross Earnings = Regular + Overtime + Higher-Rate Premiums + Bonuses + Allowances + Commissions
  const grossPay =
    regularCompensation +
    overtimeCompensation +
    higherRateCompensation +
    bonusesTotal +
    allowancesTotal +
    commissionsTotal;

  // 8. Deductions: Pension Employee
  let employeePension = 0;
  const pensionEeRules = applicableRules.filter((r) => r.category === 'pension_employee');
  for (const rule of pensionEeRules) {
    let amt = 0;
    if (rule.calculationMethod === 'percent_of_gross') {
      amt = Math.round((grossPay * rule.rateOrAmount) / 100);
    } else if (rule.calculationMethod === 'percent_of_base') {
      amt = Math.round((regularCompensation * rule.rateOrAmount) / 100);
    }
    if (amt > 0) {
      employeePension += amt;
      breakdown.push({
        id: `pension-ee-${rule.id}`,
        name: rule.name,
        category: 'pension_employee',
        description: `${rule.rateOrAmount}% employee contribution`,
        amount: amt,
        isAddition: false,
      });
    }
  }

  // 9. Employer Contributions
  let employerPension = 0;
  const pensionErRules = applicableRules.filter((r) => r.category === 'pension_employer');
  for (const rule of pensionErRules) {
    let amt = 0;
    if (rule.calculationMethod === 'percent_of_gross') {
      amt = Math.round((grossPay * rule.rateOrAmount) / 100);
    } else if (rule.calculationMethod === 'percent_of_base') {
      amt = Math.round((regularCompensation * rule.rateOrAmount) / 100);
    }
    if (amt > 0) {
      employerPension += amt;
      breakdown.push({
        id: `pension-er-${rule.id}`,
        name: rule.name,
        category: 'pension_employer',
        description: `${rule.rateOrAmount}% employer contribution (cost to company)`,
        amount: amt,
        isAddition: false,
        isEmployerCost: true,
      });
    }
  }

  // 10. Statutory Taxes (PAYE / Income Tax)
  // Taxable Income = Gross Pay - Employee Pension (in jurisdictions where pension is tax-exempt)
  const taxableIncome = Math.max(0, grossPay - employeePension);
  let statutoryTax = 0;

  const taxRules = applicableRules.filter((r) => r.category === 'statutory_tax');
  for (const rule of taxRules) {
    let taxAmt = 0;
    if (rule.calculationMethod === 'bracket_marginal_tax' && rule.brackets && rule.brackets.length > 0) {
      taxAmt = calculateMarginalTax(taxableIncome, rule.brackets);
    } else if (rule.calculationMethod === 'percent_of_gross') {
      taxAmt = Math.round((grossPay * rule.rateOrAmount) / 100);
    } else if (rule.calculationMethod === 'percent_of_base') {
      taxAmt = Math.round((regularCompensation * rule.rateOrAmount) / 100);
    }

    if (taxAmt > 0) {
      statutoryTax += taxAmt;
      breakdown.push({
        id: `tax-${rule.id}`,
        name: rule.name,
        category: 'statutory_tax',
        description: `Taxable base: ${formatMoney(taxableIncome, profile.currency)}`,
        amount: taxAmt,
        isAddition: false,
      });
    }
  }

  // 11. Total Employee Deductions & Net Pay
  // Total Deductions = Statutory Taxes + Employee Pension + Penalties
  const employeeDeductions = statutoryTax + employeePension + penaltiesTotal;
  const netPay = Math.max(0, grossPay - employeeDeductions);
  const totalEmployerCost = grossPay + employerPension;

  // Expected vs Productive percent
  const expectedMonthlyHours = profile.standardMonthlyHours || 173.33;
  const productiveHoursPercent = expectedMonthlyHours > 0
    ? Math.min(100, Math.round((attendance.productiveHours / expectedMonthlyHours) * 1000) / 10)
    : 100;

  // Formula Summary Text
  const formulaSummary = generateFormulaText(model);

  return {
    employeeId: profile.employeeId,
    employeeName: profile.employeeName,
    periodMonth,
    periodYear,
    currency: profile.currency,
    compensationModel: model,
    payRateDisplay,
    recordedHours: attendance.recordedHours,
    productiveHours: attendance.productiveHours,
    productiveHoursPercent,
    regularPayableHours: attendance.payableRegularHours,
    approvedOvertimeHours: attendance.approvedOvertimeHours,
    holidaySpecialHours: attendance.holidaySpecialHours,
    daysWorked: attendance.daysWorked,
    missingPunchWarnings: attendance.missingPunchCount,
    regularCompensation,
    overtimeCompensation,
    higherRateCompensation,
    bonusesTotal,
    penaltiesTotal,
    allowancesTotal,
    commissionsTotal,
    grossPay,
    employeeDeductions,
    netPay,
    employerPension,
    employerOtherCosts: 0,
    totalEmployerCost,
    breakdown,
    formulaSummary,
  };
}

/**
 * Calculates progressive marginal tax across configured brackets
 */
export function calculateMarginalTax(taxableAmount: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (const b of brackets) {
    if (taxableAmount > b.min) {
      const taxableInBracket = b.max !== null ? Math.min(taxableAmount, b.max) - b.min : taxableAmount - b.min;
      if (taxableInBracket > 0) {
        tax += Math.round((taxableInBracket * b.ratePercent) / 100);
      }
    }
  }
  return tax;
}

/**
 * Generates transparent formula text formatted for UI display matching user's spec
 */
export function generateFormulaText(model: CompensationModel): string {
  switch (model) {
    case 'hourly':
      return [
        'HOURLY compensation: Total monthly compensation=Pay rate * Productive hours',
        'Chargeable Income Gross Total = [Total monthly compensation] + [Total Bonuses] + [Total Higher rates] + [Insurance] - [Total Penalties]',
        'Total Bonuses and Total Penalties = please see details in Job section > One time Bonuses & Penalties table.',
      ].join('\n');
    case 'monthly_salary':
      return [
        'MONTHLY SALARY compensation: Total monthly compensation = Base Fixed Monthly Salary',
        'Chargeable Income Gross Total = [Total monthly compensation] + [Total Overtime] + [Total Bonuses] + [Total Higher rates] + [Allowances] - [Total Penalties]',
        'Total Bonuses and Total Penalties = please see details in Job section > One time Bonuses & Penalties table.',
      ].join('\n');
    case 'daily':
      return [
        'DAILY compensation: Total monthly compensation = Daily Rate * Eligible Payable Days Worked',
        'Chargeable Income Gross Total = [Total monthly compensation] + [Total Bonuses] + [Total Higher rates] + [Allowances] - [Total Penalties]',
        'Total Bonuses and Total Penalties = please see details in Job section > One time Bonuses & Penalties table.',
      ].join('\n');
    case 'overtime_based':
      return [
        'OVERTIME-BASED compensation: Total monthly compensation = (Pay rate * Regular Productive hours) + (Pay rate * Overtime Multiplier * Approved OT hours)',
        'Chargeable Income Gross Total = [Total monthly compensation] + [Total Bonuses] + [Total Higher rates] + [Allowances] - [Total Penalties]',
        'Total Bonuses and Total Penalties = please see details in Job section > One time Bonuses & Penalties table.',
      ].join('\n');
    case 'commission_based':
      return [
        'COMMISSION-BASED compensation: Total monthly compensation = Base Retainer + Configured Commission Earnings',
        'Chargeable Income Gross Total = [Total monthly compensation] + [Total Bonuses] + [Total Higher rates] + [Allowances] - [Total Penalties]',
        'Total Bonuses and Total Penalties = please see details in Job section > One time Bonuses & Penalties table.',
      ].join('\n');
    case 'mixed':
    default:
      return [
        'MIXED compensation: Total monthly compensation = Base Compensation + Overtime Pay + Productive Differentials',
        'Chargeable Income Gross Total = [Total monthly compensation] + [Total Bonuses] + [Total Higher rates] + [Allowances] - [Total Penalties]',
        'Total Bonuses and Total Penalties = please see details in Job section > One time Bonuses & Penalties table.',
      ].join('\n');
  }
}

/**
 * Currency formatter with clean fallbacks
 */
export function formatMoney(amount: number, currency: string = 'UGX'): string {
  try {
    return new Intl.NumberFormat(currency === 'UGX' ? 'en-UG' : 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
