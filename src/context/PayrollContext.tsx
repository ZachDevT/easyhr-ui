"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  PayrollRule,
  EmployeePayrollProfile,
  BonusPenaltyRecord,
  PayrollRunRecord,
  PayrollCalculationResult,
  AttendancePayrollSummary,
  DEFAULT_PAYROLL_TEMPLATES,
  calculateEmployeePayroll,
  calculateAttendanceSummary,
  formatMoney,
} from '@/utils/payrollEngine';
import { toast } from '@/components/ui/Toast';

export interface PayrollSettings {
  showPayslipsTabToEmployees: boolean; // Admin toggle to allow standard employees to view Payslips tab
  defaultCountry: string;
  defaultCurrency: string;
  standardMonthlyHours: number;
  requireApprovalForOvertime: boolean;
  requireApprovalForBonuses: boolean;
  overtimeRateMultiplier: number;
  holidayRateMultiplier: number;
  weekendRateMultiplier: number;
  dailyStandardHours: number;
}

interface PayrollContextType {
  rules: PayrollRule[];
  employeeProfiles: Record<string, EmployeePayrollProfile>;
  bonusesPenalties: BonusPenaltyRecord[];
  payrollRuns: PayrollRunRecord[];
  payslips: PayrollCalculationResult[];
  settings: PayrollSettings;

  // Rules management
  addRule: (rule: Omit<PayrollRule, 'id'>) => void;
  updateRule: (id: string, updates: Partial<PayrollRule>) => void;
  deleteRule: (id: string) => void;
  toggleRuleActive: (id: string) => void;
  resetRulesToDefault: () => void;

  // Employee Profile & Compensation
  saveEmployeeCompensation: (profile: EmployeePayrollProfile) => void;
  getEmployeeCompensation: (
    employeeId: string,
    employeeName?: string,
    jobTitle?: string,
    department?: string,
    email?: string,
    employeeNumber?: string,
    currency?: string
  ) => EmployeePayrollProfile;

  // Bonuses & Penalties (Job section integration)
  addBonusPenalty: (record: Omit<BonusPenaltyRecord, 'id' | 'createdAt'>) => void;
  updateBonusPenaltyStatus: (id: string, status: 'approved' | 'rejected' | 'pending') => void;
  deleteBonusPenalty: (id: string) => void;
  getEmployeeBonusesPenalties: (employeeId: string) => BonusPenaltyRecord[];

  // Calculation & Payslips
  calculateEmployeeCurrentPayroll: (
    employeeId: string,
    month?: number,
    year?: number,
    employeeName?: string,
    jobTitle?: string,
    department?: string,
    email?: string,
    employeeNumber?: string,
    currency?: string
  ) => PayrollCalculationResult;
  getEmployeeCompensationDetails: (
    employeeId: string,
    employeeName?: string,
    jobTitle?: string,
    department?: string,
    email?: string,
    employeeNumber?: string,
    currency?: string
  ) => PayrollCalculationResult[];
  
  // Payroll Runs Execution
  runPayrollForPeriod: (title: string, periodStart: string, periodEnd: string, payDate: string) => PayrollRunRecord;
  approvePayrollRun: (runId: string) => void;

  // Settings
  updateSettings: (updates: Partial<PayrollSettings>) => void;
  toggleEmployeePayslipsVisibility: () => void;
}

const DEFAULT_SETTINGS: PayrollSettings = {
  showPayslipsTabToEmployees: true, // Default to true, customizable by admin
  defaultCountry: 'UG',
  defaultCurrency: 'UGX',
  standardMonthlyHours: 173.33,
  requireApprovalForOvertime: true,
  requireApprovalForBonuses: true,
  overtimeRateMultiplier: 1.5,
  holidayRateMultiplier: 2.0,
  weekendRateMultiplier: 2.0,
  dailyStandardHours: 8.0,
};

const SEED_BONUSES_PENALTIES: BonusPenaltyRecord[] = [
  {
    id: 'bp-001',
    employeeId: 'emp-bushu',
    employeeName: 'Bushu Hamuli Zacharie',
    type: 'bonus',
    category: 'Performance Bonus',
    amount: 350000,
    currency: 'UGX',
    periodMonth: 10,
    periodYear: 2026,
    reason: 'Exceeded ticket resolution target by 28% in October',
    status: 'approved',
    addedBy: 'Nelson Kivuya Mun (Manager)',
    createdAt: '2026-10-15T10:30:00Z',
  },
  {
    id: 'bp-002',
    employeeId: 'emp-bushu',
    employeeName: 'Bushu Hamuli Zacharie',
    type: 'bonus',
    category: 'Attendance Bonus',
    amount: 150000,
    currency: 'UGX',
    periodMonth: 9,
    periodYear: 2026,
    reason: '100% on-time shift compliance in September',
    status: 'approved',
    addedBy: 'Nelson Kivuya Mun (Manager)',
    createdAt: '2026-09-28T09:15:00Z',
  },
  {
    id: 'bp-003',
    employeeId: 'emp-bushu',
    employeeName: 'Bushu Hamuli Zacharie',
    type: 'penalty',
    category: 'Unpaid Absence Adjustment',
    amount: 85000,
    currency: 'UGX',
    periodMonth: 8,
    periodYear: 2026,
    reason: 'Unexcused absence on August 14th without prior cover',
    status: 'approved',
    addedBy: 'HR Administration',
    createdAt: '2026-08-20T14:00:00Z',
  },
];

const SEED_RUNS: PayrollRunRecord[] = [
  {
    id: 'run-2026-10',
    title: 'October 2026 Regular Payroll',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    payDate: '2026-10-31',
    currency: 'UGX',
    status: 'calculated',
    totalEmployees: 12,
    totalGrossPay: 38400000,
    totalDeductions: 8750000,
    totalNetPay: 29650000,
    totalEmployerCost: 42240000,
    itemCount: 12,
    createdAt: '2026-10-18T16:00:00Z',
  },
  {
    id: 'run-2026-09',
    title: 'September 2026 Regular Payroll',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    payDate: '2026-09-30',
    currency: 'UGX',
    status: 'finalized',
    totalEmployees: 12,
    totalGrossPay: 37200000,
    totalDeductions: 8400000,
    totalNetPay: 28800000,
    totalEmployerCost: 40920000,
    itemCount: 12,
    createdAt: '2026-09-29T17:00:00Z',
    approvedAt: '2026-09-30T10:00:00Z',
    approvedBy: 'HR Director',
  },
  {
    id: 'run-2026-08',
    title: 'August 2026 Regular Payroll',
    periodStart: '2026-08-01',
    periodEnd: '2026-08-31',
    payDate: '2026-08-31',
    currency: 'UGX',
    status: 'paid',
    totalEmployees: 11,
    totalGrossPay: 34100000,
    totalDeductions: 7800000,
    totalNetPay: 26300000,
    totalEmployerCost: 37510000,
    itemCount: 11,
    createdAt: '2026-08-30T15:00:00Z',
    approvedAt: '2026-08-31T09:30:00Z',
    approvedBy: 'Finance Controller',
  },
];

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export function PayrollProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<PayrollRule[]>(DEFAULT_PAYROLL_TEMPLATES);
  const [employeeProfiles, setEmployeeProfiles] = useState<Record<string, EmployeePayrollProfile>>({});
  const [bonusesPenalties, setBonusesPenalties] = useState<BonusPenaltyRecord[]>(SEED_BONUSES_PENALTIES);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRunRecord[]>(SEED_RUNS);
  const [settings, setSettings] = useState<PayrollSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const savedRules = localStorage.getItem('easyhr_payroll_rules');
      if (savedRules) setRules(JSON.parse(savedRules));

      const savedProfiles = localStorage.getItem('easyhr_payroll_profiles');
      if (savedProfiles) setEmployeeProfiles(JSON.parse(savedProfiles));

      const savedBP = localStorage.getItem('easyhr_payroll_bonuses_penalties');
      if (savedBP) setBonusesPenalties(JSON.parse(savedBP));

      const savedRuns = localStorage.getItem('easyhr_payroll_runs');
      if (savedRuns) setPayrollRuns(JSON.parse(savedRuns));

      const savedSettings = localStorage.getItem('easyhr_payroll_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) {
      console.warn('Failed to parse cached payroll state', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('easyhr_payroll_rules', JSON.stringify(rules));
      localStorage.setItem('easyhr_payroll_profiles', JSON.stringify(employeeProfiles));
      localStorage.setItem('easyhr_payroll_bonuses_penalties', JSON.stringify(bonusesPenalties));
      localStorage.setItem('easyhr_payroll_runs', JSON.stringify(payrollRuns));
      localStorage.setItem('easyhr_payroll_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to sync payroll state to localStorage', e);
    }
  }, [rules, employeeProfiles, bonusesPenalties, payrollRuns, settings, isInitialized]);

  // Rule actions
  const addRule = useCallback((newRule: Omit<PayrollRule, 'id'>) => {
    const rule: PayrollRule = {
      ...newRule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setRules((prev) => [...prev, rule]);
    toast.success('Payroll rule created', `Rule "${rule.name}" is now active in payroll calculations.`);
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<PayrollRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    toast.success('Payroll rule updated', 'Changes have been saved to the dynamic rules engine.');
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success('Payroll rule removed', 'The selected rule has been removed from calculations.');
  }, []);

  const toggleRuleActive = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = !r.isActive;
          toast.info(
            updated ? 'Rule activated' : 'Rule deactivated',
            `Rule "${r.name}" is now ${updated ? 'active' : 'inactive'}.`
          );
          return { ...r, isActive: updated };
        }
        return r;
      })
    );
  }, []);

  const resetRulesToDefault = useCallback(() => {
    setRules(DEFAULT_PAYROLL_TEMPLATES);
    toast.success('Templates restored', 'Reset all payroll rules to system factory defaults.');
  }, []);

  // Employee Profile / Compensation
  const saveEmployeeCompensation = useCallback((profile: EmployeePayrollProfile) => {
    setEmployeeProfiles((prev) => ({
      ...prev,
      [profile.employeeId]: profile,
    }));
    toast.success('Compensation updated', `Saved compensation settings for ${profile.employeeName}.`);
  }, []);

  const getEmployeeCompensation = useCallback(
    (
      employeeId: string,
      employeeName?: string,
      jobTitle?: string,
      department?: string,
      email?: string,
      employeeNumber?: string,
      currency?: string
    ): EmployeePayrollProfile => {
      if (employeeProfiles[employeeId]) {
        return employeeProfiles[employeeId];
      }

      // Dynamic fallback based on the actual employee being viewed
      return {
        employeeId,
        employeeName: employeeName || 'Team Member',
        employeeNumber: employeeNumber || '# 10001',
        email: email || '',
        department: department || 'General Organization',
        jobTitle: jobTitle || 'Team Member',
        countryCode: settings.defaultCountry || 'UG',
        currency: currency || settings.defaultCurrency || 'UGX',
        compensationModel: 'hourly',
        hourlyRate: 18500, // 18,500 UGX / hr (~$5/hr)
        baseSalary: 3200000,
        dailyRate: 145000,
        expectedHoursPerWeek: 40,
        standardMonthlyHours: settings.standardMonthlyHours || 173.33,
        isExemptFromOvertime: false,
      };
    },
    [employeeProfiles, settings]
  );

  // One-time Bonuses & Penalties (Job section)
  const addBonusPenalty = useCallback((item: Omit<BonusPenaltyRecord, 'id' | 'createdAt'>) => {
    const record: BonusPenaltyRecord = {
      ...item,
      id: `bp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setBonusesPenalties((prev) => [record, ...prev]);
    toast.success(
      item.type === 'bonus' ? 'One-time bonus recorded' : 'Penalty / deduction recorded',
      `${item.category} of ${formatMoney(item.amount, item.currency)} for ${item.employeeName} has been saved.`
    );
  }, []);

  const updateBonusPenaltyStatus = useCallback((id: string, status: 'approved' | 'rejected' | 'pending') => {
    setBonusesPenalties((prev) =>
      prev.map((bp) => (bp.id === id ? { ...bp, status } : bp))
    );
    toast.success('Status updated', `One-time item is now marked as ${status}.`);
  }, []);

  const deleteBonusPenalty = useCallback((id: string) => {
    setBonusesPenalties((prev) => prev.filter((bp) => bp.id !== id));
    toast.success('Record removed', 'One-time bonus/penalty removed.');
  }, []);

  const getEmployeeBonusesPenalties = useCallback(
    (employeeId: string) => {
      return bonusesPenalties.filter(
        (bp) => bp.employeeId === employeeId || employeeId === 'emp-bushu' || employeeId.includes('bushu')
      );
    },
    [bonusesPenalties]
  );

  // Single month calculation
  const calculateEmployeeCurrentPayroll = useCallback(
    (
      employeeId: string,
      month: number = 10,
      year: number = 2026,
      employeeName?: string,
      jobTitle?: string,
      department?: string,
      email?: string,
      employeeNumber?: string,
      currency?: string
    ): PayrollCalculationResult => {
      const profile = getEmployeeCompensation(employeeId, employeeName, jobTitle, department, email, employeeNumber, currency);

      // Deterministic realistic attendance simulation based on month
      const attendanceVariance = month === 10 ? 168.5 : month === 9 ? 173.33 : 160.0;
      const otHours = month === 10 ? 8.5 : month === 9 ? 12.0 : 4.0;
      const specialHours = month === 10 ? 8.0 : 0;

      const attendance: AttendancePayrollSummary = {
        employeeId,
        periodStart: `${year}-${String(month).padStart(2, '0')}-01`,
        periodEnd: `${year}-${String(month).padStart(2, '0')}-28`,
        recordedHours: attendanceVariance + otHours + 3.0,
        productiveHours: attendanceVariance,
        billableHours: attendanceVariance - 10,
        payableRegularHours: Math.min(attendanceVariance, profile.standardMonthlyHours),
        approvedOvertimeHours: otHours,
        unapprovedOvertimeHours: 0,
        holidaySpecialHours: specialHours,
        nightShiftHours: 0,
        daysWorked: 21,
        expectedDays: 22,
        absentDays: 1,
        missingPunchCount: 0,
      };

      return calculateEmployeePayroll(profile, attendance, rules, bonusesPenalties, month, year);
    },
    [getEmployeeCompensation, rules, bonusesPenalties]
  );

  // Historical compensation details for the table (e.g. October, September, August 2026)
  const getEmployeeCompensationDetails = useCallback(
    (
      employeeId: string,
      employeeName?: string,
      jobTitle?: string,
      department?: string,
      email?: string,
      employeeNumber?: string,
      currency?: string
    ): PayrollCalculationResult[] => {
      const profile = getEmployeeCompensation(employeeId, employeeName, jobTitle, department, email, employeeNumber, currency);
      const months = [
        { month: 10, year: 2026, prodHours: 168.5, otHours: 8.5, specialHours: 8.0 },
        { month: 9, year: 2026, prodHours: 173.33, otHours: 12.0, specialHours: 0 },
        { month: 8, year: 2026, prodHours: 160.0, otHours: 4.0, specialHours: 0 },
      ];

      return months.map((m) => {
        const attendance: AttendancePayrollSummary = {
          employeeId,
          periodStart: `${m.year}-${String(m.month).padStart(2, '0')}-01`,
          periodEnd: `${m.year}-${String(m.month).padStart(2, '0')}-28`,
          recordedHours: m.prodHours + m.otHours + 2.5,
          productiveHours: m.prodHours,
          billableHours: m.prodHours - 8,
          payableRegularHours: Math.min(m.prodHours, profile.standardMonthlyHours),
          approvedOvertimeHours: m.otHours,
          unapprovedOvertimeHours: 0,
          holidaySpecialHours: m.specialHours,
          nightShiftHours: 0,
          daysWorked: 21,
          expectedDays: 22,
          absentDays: 1,
          missingPunchCount: 0,
        };

        return calculateEmployeePayroll(profile, attendance, rules, bonusesPenalties, m.month, m.year);
      });
    },
    [getEmployeeCompensation, rules, bonusesPenalties]
  );

  // Execute a new payroll run
  const runPayrollForPeriod = useCallback(
    (title: string, periodStart: string, periodEnd: string, payDate: string): PayrollRunRecord => {
      const runId = `run-${Date.now()}`;
      const newRun: PayrollRunRecord = {
        id: runId,
        title,
        periodStart,
        periodEnd,
        payDate,
        currency: settings.defaultCurrency || 'UGX',
        status: 'calculated',
        totalEmployees: 12,
        totalGrossPay: 39500000,
        totalDeductions: 8900000,
        totalNetPay: 30600000,
        totalEmployerCost: 43450000,
        itemCount: 12,
        createdAt: new Date().toISOString(),
      };

      setPayrollRuns((prev) => [newRun, ...prev]);
      toast.success('Payroll executed', `Created and calculated run "${title}".`);
      return newRun;
    },
    [settings]
  );

  const approvePayrollRun = useCallback((runId: string) => {
    setPayrollRuns((prev) =>
      prev.map((run) =>
        run.id === runId
          ? {
              ...run,
              status: 'finalized',
              approvedAt: new Date().toISOString(),
              approvedBy: 'HR Administrator',
            }
          : run
      )
    );
    toast.success('Payroll approved', 'Payroll run has been approved and payslips locked for distribution.');
  }, []);

  // Settings updates
  const updateSettings = useCallback((updates: Partial<PayrollSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      toast.success('Settings updated', 'Payroll engine configurations have been saved.');
      return next;
    });
  }, []);

  const toggleEmployeePayslipsVisibility = useCallback(() => {
    setSettings((prev) => {
      const updated = !prev.showPayslipsTabToEmployees;
      toast.info(
        updated ? 'Employee Payslips Tab Enabled' : 'Employee Payslips Tab Hidden',
        updated
          ? 'Employees can now see the Payslips tab on their own profile.'
          : 'The Payslips tab is now hidden from regular employees (HR Admins & Managers can still view it).'
      );
      return { ...prev, showPayslipsTabToEmployees: updated };
    });
  }, []);

  // All payslips cache
  const payslips = useMemo(() => {
    return getEmployeeCompensationDetails('emp-bushu');
  }, [getEmployeeCompensationDetails]);

  return (
    <PayrollContext.Provider
      value={{
        rules,
        employeeProfiles,
        bonusesPenalties,
        payrollRuns,
        payslips,
        settings,
        addRule,
        updateRule,
        deleteRule,
        toggleRuleActive,
        resetRulesToDefault,
        saveEmployeeCompensation,
        getEmployeeCompensation,
        addBonusPenalty,
        updateBonusPenaltyStatus,
        deleteBonusPenalty,
        getEmployeeBonusesPenalties,
        calculateEmployeeCurrentPayroll,
        getEmployeeCompensationDetails,
        runPayrollForPeriod,
        approvePayrollRun,
        updateSettings,
        toggleEmployeePayslipsVisibility,
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
}

export function usePayroll() {
  const context = useContext(PayrollContext);
  if (!context) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
}
