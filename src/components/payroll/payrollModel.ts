// Shared payroll types + helpers. Shapes mirror the Go API in EasyHrBE/internal/payroll.
// All money values from the API are in minor units (amount × 100).

export interface PayrollConfig {
  id: string;
  country: string;
  currency: string;
  standardMonthlyMinutes: number;
}

export interface CompensationRecord {
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

export interface TaxBand {
  upTo: number; // minor units, 0 = "everything above"
  ratePercent: number;
}

export interface TaxRule {
  id: string;
  country: string;
  currency: string;
  ruleName: string;
  ruleType: 'progressive_tax' | 'flat_deduction';
  bands: TaxBand[] | null;
  ratePercent: number;
  amountMinor: number;
  appliesTo: 'all_employees' | 'department' | 'position';
  appliesToId?: string;
  cadence: string;
  active: boolean;
}

export interface PayrollPeriod {
  id: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: 'draft' | 'processing' | 'review' | 'locked' | 'paid';
}

export interface PayrollRunSummary {
  id: string;
  payrollPeriodId: string;
  status: 'draft' | 'calculated' | 'approved';
  periodStart: string;
  periodEnd: string;
  payDate: string;
  periodStatus: string;
  currency: string;
  employeeCount: number;
  totalBasePay: number;
  totalEarnings: number;
  totalDeductions: number;
  totalNetPay: number;
  payslipsSent: number;
  createdAt: string;
  approvedAt: string | null;
}

export interface PayrollRunItem {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  avatarUrl: string;
  basePay: number;
  earnings: number;
  deductions: number;
  netPay: number;
}

export interface PayrollPayslip {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  currency: string;
  basePay: number;
  earnings: number;
  deductions: number;
  netPay: number;
  deliveryStatus: 'pending' | 'delivered' | 'manual';
}

export interface PayrollEmployee {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  workEmail?: string;
  status: string;
  departmentId?: string | null;
  department?: string;
  jobTitle?: string | null;
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Position {
  id: string;
  title: string;
  departmentName: string;
}

/** Employees the backend includes in a pay run (see InitiateRun). */
export const PAYROLL_STATUSES = ['active', 'leave', 'onboarding'];

export const COUNTRY_CURRENCIES: Record<string, string> = {
  UG: 'UGX', KE: 'KES', RW: 'RWF', TZ: 'TZS', BI: 'BIF', SS: 'SSP', ET: 'ETB', CD: 'CDF',
  NG: 'NGN', GH: 'GHS', ZA: 'ZAR', ZM: 'ZMW', MW: 'MWK', EG: 'EGP', US: 'USD', CA: 'CAD',
  GB: 'GBP', IE: 'EUR', DE: 'EUR', FR: 'EUR', NL: 'EUR', BE: 'EUR', ES: 'EUR', IT: 'EUR',
  AE: 'AED', SA: 'SAR', IN: 'INR', SG: 'SGD', AU: 'AUD', NZ: 'NZD', BR: 'BRL', MX: 'MXN',
  CH: 'CHF', JP: 'JPY', CN: 'CNY',
};

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

export const COUNTRY_OPTIONS = Object.keys(COUNTRY_CURRENCIES)
  .map((code) => ({ code, name: countryName(code), currency: COUNTRY_CURRENCIES[code] }))
  .sort((a, b) => a.name.localeCompare(b.name));

/* ------------------------------------------------------------------ money */

export const toMinor = (major: number) => Math.round(major * 100);
export const toMajor = (minor: number) => minor / 100;

export function formatMoney(minor: number, currency: string, opts: { compact?: boolean } = {}): string {
  const value = toMajor(minor || 0);
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'code',
      notation: opts.compact ? 'compact' : 'standard',
      maximumFractionDigits: opts.compact ? 1 : value % 1 === 0 ? 0 : 2,
    })
      .format(value)
      .replace(/\u00a0/g, ' ');
  } catch {
    return `${currency} ${value.toLocaleString('en')}`;
  }
}

/* ------------------------------------------------------------------ dates */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-10-01" → "October 2026" without timezone drift. */
export function monthLabel(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number);
  if (!y || !m) return isoDate;
  return `${MONTHS[m - 1]} ${y}`;
}

/** "2026-10-31" → "31 Oct 2026" */
export function shortDate(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** "2026-10" → { start: 2026-10-01, end: 2026-10-31 } */
export function monthBounds(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, '0');
  return { start: `${y}-${mm}-01`, end: `${y}-${mm}-${String(last).padStart(2, '0')}` };
}

export function addMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function employeeName(e: PayrollEmployee): string {
  return `${e.preferredName || e.firstName} ${e.lastName}`.trim();
}

/* ------------------------------------------------------------ calculation */

export interface DeductionLine {
  ruleId: string;
  name: string;
  amount: number;
}

/**
 * Mirrors ConfiguredEngine.Calculate in the backend so previews match what a
 * real pay run will produce. Position-scoped rules can't be matched from the
 * directory payload, so they are skipped (and flagged) in previews.
 */
export function estimatePay(
  baseMinor: number,
  rules: TaxRule[],
  employee?: { departmentId?: string | null },
): { lines: DeductionLine[]; deductions: number; net: number; skippedPositionRules: number } {
  const lines: DeductionLine[] = [];
  let skippedPositionRules = 0;
  for (const rule of rules) {
    if (!rule.active) continue;
    if (rule.appliesTo === 'department') {
      if (!employee || employee.departmentId !== rule.appliesToId) continue;
    }
    if (rule.appliesTo === 'position') {
      skippedPositionRules++;
      continue;
    }
    let amount = 0;
    if (rule.ruleType === 'flat_deduction') {
      amount = rule.amountMinor > 0 ? rule.amountMinor : Math.floor((baseMinor * Math.trunc(rule.ratePercent * 10000)) / 1_000_000);
    } else {
      amount = progressiveTax(baseMinor, rule.bands || []);
    }
    lines.push({ ruleId: rule.id, name: rule.ruleName, amount });
  }
  let deductions = lines.reduce((s, l) => s + l.amount, 0);
  if (deductions > baseMinor) deductions = baseMinor;
  return { lines, deductions, net: baseMinor - deductions, skippedPositionRules };
}

function progressiveTax(base: number, input: TaxBand[]): number {
  const bands = [...input].sort((a, b) => {
    if (a.upTo === 0) return 1;
    if (b.upTo === 0) return -1;
    return a.upTo - b.upTo;
  });
  let remaining = base;
  let lower = 0;
  let tax = 0;
  for (const b of bands) {
    let width = remaining;
    if (b.upTo > 0 && width > b.upTo - lower) width = b.upTo - lower;
    tax += Math.trunc((width * b.ratePercent) / 100);
    remaining -= width;
    if (b.upTo > 0) lower = b.upTo;
    if (remaining <= 0) break;
  }
  if (remaining > 0 && bands.length) tax += Math.trunc((remaining * bands[bands.length - 1].ratePercent) / 100);
  return tax;
}

/** Plain-English summary of a rule, e.g. "5% of salary" or "Tax bands · 5 levels". */
export function describeRule(rule: TaxRule, currency: string): string {
  if (rule.ruleType === 'progressive_tax') {
    const n = rule.bands?.length || 0;
    return `Income tax bands · ${n} level${n === 1 ? '' : 's'}`;
  }
  if (rule.amountMinor > 0) return `${formatMoney(rule.amountMinor, currency)} fixed each month`;
  return `${Number(rule.ratePercent)}% of salary`;
}

/* -------------------------------------------------------------- templates */

export interface RuleTemplate {
  ruleName: string;
  ruleType: TaxRule['ruleType'];
  ratePercent: number;
  amountMinor: number;
  bands: TaxBand[];
  note: string;
}

/**
 * Starter rules per country. Rates are a convenience starting point only —
 * admins should confirm them with their tax authority.
 */
export const COUNTRY_TEMPLATES: Record<string, RuleTemplate[]> = {
  UG: [
    {
      ruleName: 'PAYE',
      ruleType: 'progressive_tax',
      ratePercent: 0,
      amountMinor: 0,
      bands: [
        { upTo: toMinor(235_000), ratePercent: 0 },
        { upTo: toMinor(335_000), ratePercent: 10 },
        { upTo: toMinor(410_000), ratePercent: 20 },
        { upTo: toMinor(10_000_000), ratePercent: 30 },
        { upTo: 0, ratePercent: 40 },
      ],
      note: 'Monthly income tax for residents (URA bands)',
    },
    {
      ruleName: 'NSSF (employee 5%)',
      ruleType: 'flat_deduction',
      ratePercent: 5,
      amountMinor: 0,
      bands: [],
      note: 'Employee share of the National Social Security Fund',
    },
  ],
};

/* -------------------------------------------------------------- Uganda / Dynamic Calculation Engine */

export interface ParsedCompensation {
  model: 'hourly' | 'monthly_salary';
  hourlyRateMinor: number;
  monthlyBaseMinor: number;
  standardHours: number;
  displaySummary: string;
}

/**
 * Extracts hourly vs salaried metadata from a compensation record.
 * Handles patterns like "HOURLY: 18500 UGX/hr (173.33 hrs)" or defaults to salaried.
 */
export function parseCompensationDetails(comp?: CompensationRecord | null): ParsedCompensation {
  if (!comp || comp.baseAmountMinor <= 0) {
    return {
      model: 'monthly_salary',
      hourlyRateMinor: 0,
      monthlyBaseMinor: 0,
      standardHours: 173.33,
      displaySummary: 'Not configured',
    };
  }

  const reason = (comp.reason || '').trim();
  const isHourly = comp.payType === 'hourly' || reason.toLowerCase().startsWith('hourly');

  if (isHourly) {
    // Try to extract hourly rate from reason e.g. "HOURLY: 18500 UGX/hr (173.33 hrs)"
    const match = reason.match(/HOURLY:\s*(\d+(?:\.\d+)?)/i);
    let hourlyRateMinor = 0;
    if (match) {
      hourlyRateMinor = toMinor(parseFloat(match[1]));
    } else {
      hourlyRateMinor = Math.round(comp.baseAmountMinor / 173.33);
    }

    return {
      model: 'hourly',
      hourlyRateMinor,
      monthlyBaseMinor: comp.baseAmountMinor,
      standardHours: 173.33,
      displaySummary: `${formatMoney(hourlyRateMinor, comp.currency)} / hr (Hourly)`,
    };
  }

  return {
    model: 'monthly_salary',
    hourlyRateMinor: Math.round(comp.baseAmountMinor / 173.33),
    monthlyBaseMinor: comp.baseAmountMinor,
    standardHours: 173.33,
    displaySummary: `${formatMoney(comp.baseAmountMinor, comp.currency)} / mo (Salaried)`,
  };
}

export interface GrossCalculationParams {
  payRateMinor: number; // Hourly rate (or monthly equivalent / 173.33)
  isHourly: boolean;
  monthlyBaseMinor: number;
  productiveHours: number; // e.g. 173.33, 160
  overtimeHours?: number; // 1.5x regular pay
  holidayHours?: number; // 2.0x regular pay (Public holidays & Sundays)
  bonusesMinor?: number; // One-time bonuses
  insuranceMinor?: number; // Insurance / Allowances
  penaltiesMinor?: number; // Tardiness, absence penalties
}

export interface GrossCalculationResult {
  baseMonthlyCompensationMinor: number;
  totalHigherRatesMinor: number;
  overtimeMinor: number;
  holidayMinor: number;
  totalBonusesMinor: number;
  totalInsuranceMinor: number;
  totalPenaltiesMinor: number;
  chargeableGrossMinor: number;
}

/**
 * Basic Uganda & Enterprise Chargeable Income formula:
 * HOURLY compensation: Total monthly compensation = Pay rate * Productive hours
 * Higher rates = Overtime (1.5x) + Public Holidays / Sundays (2.0x)
 * Chargeable Income Gross Total = [Total monthly compensation] + [Total Bonuses] + [Total Higher rates] + [Insurance] - [Total Penalties]
 */
export function calculateChargeableGross(params: GrossCalculationParams): GrossCalculationResult {
  const {
    payRateMinor,
    isHourly,
    monthlyBaseMinor,
    productiveHours,
    overtimeHours = 0,
    holidayHours = 0,
    bonusesMinor = 0,
    insuranceMinor = 0,
    penaltiesMinor = 0,
  } = params;

  let baseMonthlyCompensationMinor = 0;
  if (isHourly && payRateMinor > 0) {
    baseMonthlyCompensationMinor = Math.round(payRateMinor * Math.max(0, productiveHours));
  } else {
    baseMonthlyCompensationMinor = monthlyBaseMinor;
  }

  const effectiveHourlyRateMinor = isHourly
    ? payRateMinor
    : Math.round(monthlyBaseMinor / 173.33);

  // Overtime = 1.5x regular pay rate
  const overtimeMinor = Math.round(Math.max(0, overtimeHours) * effectiveHourlyRateMinor * 1.5);
  // Public Holidays & Sundays = 2.0x regular pay rate
  const holidayMinor = Math.round(Math.max(0, holidayHours) * effectiveHourlyRateMinor * 2.0);
  const totalHigherRatesMinor = overtimeMinor + holidayMinor;

  const totalBonusesMinor = Math.max(0, bonusesMinor);
  const totalInsuranceMinor = Math.max(0, insuranceMinor);
  const totalPenaltiesMinor = Math.max(0, penaltiesMinor);

  // Chargeable Gross Total formula
  const chargeableGrossMinor = Math.max(
    0,
    baseMonthlyCompensationMinor +
      totalBonusesMinor +
      totalHigherRatesMinor +
      totalInsuranceMinor -
      totalPenaltiesMinor
  );

  return {
    baseMonthlyCompensationMinor,
    totalHigherRatesMinor,
    overtimeMinor,
    holidayMinor,
    totalBonusesMinor,
    totalInsuranceMinor,
    totalPenaltiesMinor,
    chargeableGrossMinor,
  };
}

/**
 * Standard Uganda PAYE Progressive Tax calculation (URA Brackets)
 * Slices:
 * Up to 235,000 UGX: 0%
 * 235,000 - 335,000 UGX: 10%
 * 335,000 - 410,000 UGX: 20%
 * 410,000 - 10,000,000 UGX: 30%
 * Above 10,000,000 UGX: 40%
 */
export function calculateUgandaPAYE(chargeableGrossMinor: number): number {
  const bands: TaxBand[] = [
    { upTo: toMinor(235_000), ratePercent: 0 },
    { upTo: toMinor(335_000), ratePercent: 10 },
    { upTo: toMinor(410_000), ratePercent: 20 },
    { upTo: toMinor(10_000_000), ratePercent: 30 },
    { upTo: 0, ratePercent: 40 },
  ];
  return progressiveTax(chargeableGrossMinor, bands);
}

/**
 * Uganda Statutory NSSF (5% Employee Pension)
 */
export function calculateNSSF(chargeableGrossMinor: number): number {
  return Math.round(chargeableGrossMinor * 0.05);
}

