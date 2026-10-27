"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign,
  Clock,
  FileText,
  Mail,
  CheckCircle2,
  ChevronRight,
  Search,
  Settings as SettingsIcon,
  Building,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Save,
  Info,
  CalendarDays,
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
  HelpCircle,
  Send,
  RefreshCw,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Receipt,
  HeartPulse,
  Percent,
  Briefcase,
  Layers,
  Calculator,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { usePayroll } from "@/context/PayrollContext";

import {
  PayrollConfig,
  CompensationRecord,
  TaxRule,
  PayrollPeriod,
  PayrollRunSummary,
  PayrollRunItem,
  PayrollPayslip,
  PayrollEmployee,
  Department,
  Position,
  formatMoney,
  toMinor,
  toMajor,
  shortDate,
  monthLabel,
  COUNTRY_OPTIONS,
  COUNTRY_CURRENCIES,
  countryName,
  describeRule,
  PAYROLL_STATUSES,
  parseCompensationDetails,
  calculateChargeableGross,
  calculateUgandaPAYE,
  calculateNSSF,
  estimatePay,
} from "@/components/payroll/payrollModel";

import { PayrollWalkthroughWidget } from "@/components/payroll/PayrollWalkthroughWidget";
import { PayrollHelpModal } from "@/components/payroll/PayrollHelpModal";
import { CompensationModal } from "@/components/payroll/CompensationModal";
import { TaxRuleModal } from "@/components/payroll/TaxRuleModal";
import { PaystubStatementModal } from "@/components/payroll/PaystubStatementModal";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { CurrencySelect } from "@/components/ui/CurrencySelect";

const TABS = ["Overview", "Run Payroll", "Salaries", "Deductions & Rules", "Paystubs", "Settings"];

export default function PayrollPage() {
  const { getToken } = useAuth();
  const { settings, updateSettings, toggleEmployeePayslipsVisibility } = usePayroll();

  // Tab & UI state
  const [activeTab, setActiveTab] = useState("Overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Live Backend Data States
  const [configurations, setConfigurations] = useState<PayrollConfig[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [runs, setRuns] = useState<PayrollRunSummary[]>([]);
  const [compensationList, setCompensationList] = useState<CompensationRecord[]>([]);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Modals state
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [selectedCompEmployeeId, setSelectedCompEmployeeId] = useState<string>("");
  const [isTaxRuleModalOpen, setIsTaxRuleModalOpen] = useState(false);
  const [statementPayslip, setStatementPayslip] = useState<any | null>(null);

  // Wizard state (Run Payroll)
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [activeRun, setActiveRun] = useState<PayrollRunSummary | null>(null);
  const [runItems, setRunItems] = useState<PayrollRunItem[]>([]);
  const [isProcessingRun, setIsProcessingRun] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Dynamic hourly/overtime/holiday/bonus adjustments per employee in active run
  const [employeeAdjustments, setEmployeeAdjustments] = useState<
    Record<
      string,
      {
        productiveHours: number;
        overtimeHours: number;
        holidayHours: number;
        bonusesMinor: number;
        penaltiesMinor: number;
        insuranceMinor: number;
        isSyncedFromClockIn?: boolean;
        clockInTotalHours?: number;
      }
    >
  >({});
  const [editingAdjItem, setEditingAdjItem] = useState<PayrollRunItem | null>(null);
  const [isFormulaDrawerOpen, setIsFormulaDrawerOpen] = useState(false);
  const [formProductiveHours, setFormProductiveHours] = useState("173.33");
  const [formOvertimeHours, setFormOvertimeHours] = useState("0");
  const [formHolidayHours, setFormHolidayHours] = useState("0");
  const [formBonuses, setFormBonuses] = useState("0");
  const [formPenalties, setFormPenalties] = useState("0");
  const [formInsurance, setFormInsurance] = useState("0");

  // Paystubs tab search & filter
  const [paystubSearch, setPaystubSearch] = useState("");
  const [selectedRunIdForPayslips, setSelectedRunIdForPayslips] = useState<string>("");
  const [runPayslips, setRunPayslips] = useState<PayrollPayslip[]>([]);
  const [isLoadingPayslips, setIsLoadingPayslips] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  // Salaries tab filter
  const [salarySearch, setSalarySearch] = useState("");
  const [salaryDeptFilter, setSalaryDeptFilter] = useState("all");

  // Company Settings Form
  const [configCountry, setConfigCountry] = useState(settings.defaultCountry || "UG");
  const [configCurrency, setConfigCurrency] = useState(settings.defaultCurrency || "UGX");
  const [configHours, setConfigHours] = useState(String(settings.standardMonthlyHours || 173.33));
  const [configOvertimeRate, setConfigOvertimeRate] = useState(String(settings.overtimeRateMultiplier || 1.5));
  const [configHolidayRate, setConfigHolidayRate] = useState(String(settings.holidayRateMultiplier || 2.0));
  const [configDailyHours, setConfigDailyHours] = useState(String(settings.dailyStandardHours || 8.0));
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  // --------------------------------------------------------------------------
  // Fetch All Live Payroll Data from Backend
  // --------------------------------------------------------------------------
  const fetchPayrollData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);

      const [
        configsRes,
        rulesRes,
        periodsRes,
        runsRes,
        compRes,
        employeesRes,
        deptsRes,
        timesheetsRes,
        holidaysRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/tax-rules`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/periods`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/runs`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/compensation`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees?limit=200`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/departments`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/timesheets`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/holidays`, { headers }).catch(() => null),
      ]);

      if (configsRes.ok) {
        const cData = await configsRes.json();
        const confs: PayrollConfig[] = Array.isArray(cData) ? cData : [];
        setConfigurations(confs);
        if (confs[0]) {
          setConfigCountry(confs[0].country);
          setConfigCurrency(confs[0].currency);
          setConfigHours(String((confs[0].standardMonthlyMinutes / 60).toFixed(2)));
          if (confs[0].overtimeMultiplier) {
            setConfigOvertimeRate(String(confs[0].overtimeMultiplier));
          }
          if (confs[0].holidayMultiplier) {
            setConfigHolidayRate(String(confs[0].holidayMultiplier));
          }
        }
      }

      if (timesheetsRes && timesheetsRes.ok) {
        const tsData = await timesheetsRes.json();
        setTimesheets(Array.isArray(tsData) ? tsData : tsData?.data || []);
      }

      if (holidaysRes && holidaysRes.ok) {
        const hData = await holidaysRes.json();
        setHolidays(Array.isArray(hData) ? hData : hData?.data || []);
      }

      if (rulesRes.ok) {
        const rData = await rulesRes.json();
        const rulesList = Array.isArray(rData) ? rData : rData.data || [];
        setTaxRules(rulesList);
      }

      let loadedPeriods: PayrollPeriod[] = [];
      if (periodsRes.ok) {
        const pData = await periodsRes.json();
        loadedPeriods = Array.isArray(pData) ? pData : [];
        setPeriods(loadedPeriods);
        if (loadedPeriods.length > 0 && !selectedPeriodId) {
          // Select newest period
          setSelectedPeriodId(loadedPeriods[0].id);
        }
      }

      let loadedRuns: PayrollRunSummary[] = [];
      if (runsRes.ok) {
        const rData = await runsRes.json();
        loadedRuns = Array.isArray(rData) ? rData : rData.data || [];
        setRuns(loadedRuns);
        if (loadedRuns.length > 0 && !selectedRunIdForPayslips) {
          const latestApproved = loadedRuns.find((r) => r.status === "approved") || loadedRuns[0];
          setSelectedRunIdForPayslips(latestApproved.id);
        }
      }

      if (compRes.ok) {
        const compData = await compRes.json();
        setCompensationList(Array.isArray(compData) ? compData : []);
      }

      if (employeesRes.ok) {
        const empData = await employeesRes.json();
        const empList: PayrollEmployee[] = Array.isArray(empData) ? empData : empData.data || [];
        // Only active/onboarding/leave employees are eligible for payroll
        const eligible = empList.filter((e) => PAYROLL_STATUSES.includes(e.status));
        setEmployees(eligible);
      }

      if (deptsRes.ok) {
        const dData = await deptsRes.json();
        const dList: Department[] = dData.data || dData || [];
        setDepartments(dList);

        // Fetch positions per department
        const posArrays = await Promise.all(
          dList.map(async (dept) => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/v1/departments/${dept.id}/positions`, { headers });
              if (!res.ok) return [];
              const p = await res.json();
              return ((p.data || p) as any[])
                .filter((pos) => pos.status === "active")
                .map((pos) => ({ id: pos.id, title: pos.title, departmentName: dept.name }));
            } catch {
              return [];
            }
          })
        );
        setPositions(posArrays.flat());
      }
    } catch (err) {
      console.error("Error loading payroll data:", err);
      toast.error("Could not load payroll data", "Please check your network connection and reload.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, selectedPeriodId, selectedRunIdForPayslips]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // Load payslips whenever the selected run for payslips changes
  const loadPayslipsForRun = useCallback(
    async (runId: string) => {
      if (!runId) return;
      setIsLoadingPayslips(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${runId}/payslips`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data = await res.json();
          setRunPayslips(data.data || []);
        } else {
          setRunPayslips([]);
        }
      } catch (err) {
        console.error("Failed to load payslips", err);
      } finally {
        setIsLoadingPayslips(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    if (selectedRunIdForPayslips) {
      loadPayslipsForRun(selectedRunIdForPayslips);
    }
  }, [selectedRunIdForPayslips, loadPayslipsForRun]);

  // Load items for a run in wizard
  const loadRunItems = useCallback(
    async (runId: string) => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${runId}/items`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const items = await res.json();
          setRunItems(Array.isArray(items) ? items : items.data || []);
        }
      } catch (err) {
        console.error("Failed to load run items", err);
      }
    },
    [getToken]
  );

  // Active config & currency
  const activeConfig = configurations[0] || null;
  const currentCurrency = activeConfig?.currency || settings.defaultCurrency || "UGX";
  const currentCountry = activeConfig?.country || settings.defaultCountry || "UG";
  const activeOvertimeMultiplier = useMemo(() => {
    return activeConfig?.overtimeMultiplier || settings.overtimeRateMultiplier || 1.5;
  }, [activeConfig, settings]);
  const activeHolidayMultiplier = useMemo(() => {
    return activeConfig?.holidayMultiplier || settings.holidayRateMultiplier || 2.0;
  }, [activeConfig, settings]);

  const countrySelectOptions: SelectOption[] = useMemo(() => {
    return COUNTRY_OPTIONS.map((c) => ({
      value: c.code,
      label: `${c.name} (${c.code})`,
      description: `Default currency: ${c.currency}`,
      rightBadge: c.currency,
    }));
  }, []);

  const deptFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "all", label: "All Departments" },
      ...departments.map((d) => ({ value: d.id, label: d.name })),
    ];
  }, [departments]);

  // Synchronize dynamic hours from Clock-in punches and Timesheet submissions into active payroll run
  const syncClockInHours = useCallback(
    async (periodId?: string) => {
      const pId = periodId || selectedPeriodId;
      const p = periods.find((x) => x.id === pId);
      if (!p) {
        toast.info("Select pay period", "Please select a pay period first.");
        return;
      }

      const pStart = new Date(p.startDate).getTime();
      const pEnd = new Date(p.endDate + "T23:59:59").getTime();
      const stdMonthlyHours = activeConfig ? activeConfig.standardMonthlyMinutes / 60 : 173.33;

      let syncedCount = 0;
      const token = await getToken();
      const headers = getAuthHeaders(token);
      const nextAdjustments: Record<string, any> = {};

      for (const emp of employees) {
        // 1. Check if employee has timesheets
        const empTimesheets = timesheets.filter((t) => {
          const matchesEmp = t.employeeId === emp.id || t.employee_id === emp.id;
          if (!matchesEmp) return false;
          const wStart = new Date(t.weekStart || t.week_start).getTime();
          const wEnd = new Date((t.weekEnd || t.week_end) + "T23:59:59").getTime();
          return (wStart >= pStart && wStart <= pEnd) || (wEnd >= pStart && wEnd <= pEnd);
        });

        let totalMinutes = 0;
        let isSynced = false;

        if (empTimesheets.length > 0) {
          totalMinutes = empTimesheets.reduce(
            (sum, t) => sum + (Number(t.totalMinutes || t.total_minutes) || 0),
            0
          );
          isSynced = true;
        } else if (token) {
          // 2. Fall back to raw attendance punches in the period
          try {
            const punchRes = await fetch(
              `${API_BASE_URL}/api/v1/attendance/punches?employeeId=${emp.id}&from=${p.startDate}&to=${p.endDate}&limit=500`,
              { headers }
            );
            if (punchRes.ok) {
              const punchData = await punchRes.json();
              const punches = Array.isArray(punchData) ? punchData : punchData.data || [];
              if (punches.length > 0) {
                const sorted = [...punches].sort(
                  (a, b) =>
                    new Date(a.occurredAt || a.occurred_at).getTime() -
                    new Date(b.occurredAt || b.occurred_at).getTime()
                );
                let lastClockIn: number | null = null;
                let punchMins = 0;
                for (const punch of sorted) {
                  const kind = punch.kind;
                  const time = new Date(punch.occurredAt || punch.occurred_at).getTime();
                  if (kind === "clock_in" || kind === "break_end") {
                    lastClockIn = time;
                  } else if ((kind === "clock_out" || kind === "break_start") && lastClockIn !== null) {
                    const diff = Math.round((time - lastClockIn) / 60000);
                    if (diff > 0 && diff < 24 * 60) {
                      punchMins += diff;
                    }
                    lastClockIn = null;
                  }
                }
                if (punchMins > 0) {
                  totalMinutes = punchMins;
                  isSynced = true;
                }
              }
            }
          } catch {
            // continue with fallback
          }
        }

        const comp = compensationList.find((c) => c.employeeId === emp.id);
        const parsed = parseCompensationDetails(comp);
        const targetStd = parsed.standardHours || stdMonthlyHours;

        if (isSynced && totalMinutes > 0) {
          const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
          const productiveHours = Math.min(totalHours, targetStd);
          const overtimeHours = Math.max(0, Math.round((totalHours - targetStd) * 10) / 10);

          nextAdjustments[emp.id] = {
            productiveHours,
            overtimeHours,
            holidayHours: employeeAdjustments[emp.id]?.holidayHours || 0,
            bonusesMinor: employeeAdjustments[emp.id]?.bonusesMinor || 0,
            penaltiesMinor: employeeAdjustments[emp.id]?.penaltiesMinor || 0,
            insuranceMinor: employeeAdjustments[emp.id]?.insuranceMinor || 0,
            isSyncedFromClockIn: true,
            clockInTotalHours: totalHours,
          };
          syncedCount++;
        } else {
          nextAdjustments[emp.id] = {
            productiveHours: targetStd,
            overtimeHours: employeeAdjustments[emp.id]?.overtimeHours || 0,
            holidayHours: employeeAdjustments[emp.id]?.holidayHours || 0,
            bonusesMinor: employeeAdjustments[emp.id]?.bonusesMinor || 0,
            penaltiesMinor: employeeAdjustments[emp.id]?.penaltiesMinor || 0,
            insuranceMinor: employeeAdjustments[emp.id]?.insuranceMinor || 0,
            isSyncedFromClockIn: false,
            clockInTotalHours: targetStd,
          };
        }
      }

      setEmployeeAdjustments((prev) => ({ ...prev, ...nextAdjustments }));

      if (syncedCount > 0) {
        toast.success(
          "Clock-in synced",
          `Auto-synced hours worked from attendance punches & timesheets for ${syncedCount} employee(s).`
        );
      } else {
        toast.info(
          "Standard hours applied",
          "No clock-in attendance records found for this period. Standard contracted hours applied."
        );
      }
    },
    [selectedPeriodId, periods, activeConfig, employees, timesheets, compensationList, employeeAdjustments, getToken]
  );

  // Map each employee to their most recent compensation record
  const employeeSalaryMap = useMemo(() => {
    const map = new Map<string, CompensationRecord>();
    for (const comp of compensationList) {
      if (!map.has(comp.employeeId)) {
        map.set(comp.employeeId, comp);
      }
    }
    return map;
  }, [compensationList]);

  // Roster with compensation details
  const rosterWithComp = useMemo(() => {
    return employees.map((emp) => {
      const comp = employeeSalaryMap.get(emp.id);
      return {
        ...emp,
        hasSalary: !!comp,
        baseAmountMinor: comp?.baseAmountMinor || 0,
        currency: comp?.currency || currentCurrency,
        effectiveDate: comp?.effectiveDate || null,
        reason: comp?.reason || "",
      };
    });
  }, [employees, employeeSalaryMap, currentCurrency]);

  const employeesMissingSalary = useMemo(() => {
    return rosterWithComp.filter((e) => !e.hasSalary);
  }, [rosterWithComp]);

  // Safe tab routing with automatic tab name normalization and optional modal trigger
  const handleNavigateTab = (tab: string, andOpen?: "compensation" | "rule") => {
    let target = tab;
    if (tab === "Compensation") target = "Salaries";
    if (tab === "Rules") target = "Deductions & Rules";
    setActiveTab(target);
    if (target === "Run Payroll") setWizardStep(0);
    if (andOpen === "compensation") {
      const missing = employeesMissingSalary[0];
      setSelectedCompEmployeeId(missing ? missing.id : employees[0]?.id || "");
      setIsCompModalOpen(true);
    } else if (andOpen === "rule") {
      setIsTaxRuleModalOpen(true);
    }
  };

  // Aggregate stats from the most recent run (or live roster if no run yet)
  const latestApprovedRun = useMemo(() => {
    return runs.find((r) => r.status === "approved") || runs[0] || null;
  }, [runs]);

  const aggregateMetrics = useMemo(() => {
    if (latestApprovedRun) {
      return {
        activeEmployees: latestApprovedRun.employeeCount || employees.length,
        totalGross: latestApprovedRun.totalBasePay + latestApprovedRun.totalEarnings,
        totalDeductions: latestApprovedRun.totalDeductions,
        totalNet: latestApprovedRun.totalNetPay,
        hasRun: true,
      };
    }
    // Estimated from current active roster salaries
    const totalGross = rosterWithComp.reduce((acc, emp) => acc + emp.baseAmountMinor, 0);
    return {
      activeEmployees: employees.length,
      totalGross,
      totalDeductions: 0,
      totalNet: totalGross,
      hasRun: false,
    };
  }, [latestApprovedRun, employees.length, rosterWithComp]);

  // --------------------------------------------------------------------------
  // ACTIONS: Save Settings
  // --------------------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const token = await getToken();
      const minutes = Math.round((parseFloat(configHours) || 173.33) * 60);
      const otMultiplier = parseFloat(configOvertimeRate) || 1.5;
      const holMultiplier = parseFloat(configHolidayRate) || 2.0;

      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          country: configCountry.toUpperCase(),
          currency: configCurrency.toUpperCase(),
          standardMonthlyMinutes: minutes,
          overtimeMultiplier: otMultiplier,
          holidayMultiplier: holMultiplier,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not save payroll settings.");
      }

      updateSettings({
        defaultCountry: configCountry,
        defaultCurrency: configCurrency,
        standardMonthlyHours: parseFloat(configHours) || 173.33,
        overtimeRateMultiplier: otMultiplier,
        holidayRateMultiplier: holMultiplier,
        dailyStandardHours: parseFloat(configDailyHours) || 8.0,
      });

      toast.success("Settings saved", `Payroll set to ${configCountry} (${configCurrency}) with ${otMultiplier}× OT and ${holMultiplier}× Holiday rates.`);
      await fetchPayrollData(true);
    } catch (err: any) {
      toast.error("Save failed", err?.message || "Could not save configuration.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --------------------------------------------------------------------------
  // ACTIONS: Save Employee Compensation
  // --------------------------------------------------------------------------
  const handleSaveCompensation = async (payload: {
    employeeId: string;
    baseAmountMinor: number;
    currency: string;
    country: string;
    effectiveDate: string;
    reason: string;
  }) => {
    const token = await getToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/payroll/compensation`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not save employee compensation.");
    }

    toast.success("Salary saved", "Employee compensation record updated.");
    await fetchPayrollData(true);
  };

  // --------------------------------------------------------------------------
  // ACTIONS: Save Tax / Deduction Rule
  // --------------------------------------------------------------------------
  const handleSaveTaxRule = async (payload: any) => {
    const token = await getToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/payroll/tax-rules`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not save deduction rule.");
    }

    toast.success("Rule saved", `Deduction rule "${payload.ruleName}" is now active.`);
    await fetchPayrollData(true);
  };

  // Toggle active/inactive
  const handleToggleRuleActive = async (ruleId: string, currentActive: boolean) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/tax-rules/${ruleId}`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ active: !currentActive }),
      });
      if (!res.ok) throw new Error("Could not update rule status.");
      toast.info(
        !currentActive ? "Rule activated" : "Rule paused",
        `Deduction is now ${!currentActive ? "active" : "inactive"}.`
      );
      await fetchPayrollData(true);
    } catch (err: any) {
      toast.error("Status update failed", err?.message);
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Are you sure you want to delete "${ruleName}"?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/tax-rules/${ruleId}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!res.ok) throw new Error("Could not delete rule.");
      toast.success("Rule removed", `Deleted "${ruleName}".`);
      await fetchPayrollData(true);
    } catch (err: any) {
      toast.error("Delete failed", err?.message);
    }
  };

  // --------------------------------------------------------------------------
  // ACTIONS: WIZARD & RUN LIFECYCLE
  // --------------------------------------------------------------------------
  // Create a period or use existing
  const handleCreateOrSelectPeriod = async () => {
    if (!activeConfig) {
      toast.error("Settings required", "Please save your country and currency in Settings first.");
      setActiveTab("Settings");
      return;
    }

    setIsProcessingRun(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);

      // Check if period for selected month already exists
      const [y, m] = newPeriodMonth.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const mm = String(m).padStart(2, "0");
      const startDate = `${y}-${mm}-01`;
      const endDate = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`;
      const payDate = endDate;

      let targetPeriod = periods.find((p) => p.startDate === startDate && p.endDate === endDate);

      if (!targetPeriod) {
        // Create new period
        const pRes = await fetch(`${API_BASE_URL}/api/v1/payroll/periods`, {
          method: "POST",
          headers,
          body: JSON.stringify({ startDate, endDate, payDate }),
        });
        if (!pRes.ok) {
          const err = await pRes.json().catch(() => ({}));
          throw new Error(err.detail || "Could not create pay period.");
        }
        targetPeriod = await pRes.json();
        await fetchPayrollData(true);
      }

      if (!targetPeriod) throw new Error("Failed to initialize pay period.");

      setSelectedPeriodId(targetPeriod.id);

      // Check if there's already a run for this period
      const runsForPeriodRes = await fetch(
        `${API_BASE_URL}/api/v1/payroll/periods/${targetPeriod.id}/runs`,
        { headers }
      );
      if (runsForPeriodRes.ok) {
        const existingRuns: any[] = await runsForPeriodRes.json();
        const activeOne = existingRuns.find((r) => r.status === "calculated" || r.status === "draft");
        if (activeOne) {
          setActiveRun(activeOne);
          await loadRunItems(activeOne.id);
          syncClockInHours(targetPeriod.id);
          setWizardStep(1);
          setIsProcessingRun(false);
          return;
        }
      }

      // Proceed to Step 1
      setWizardStep(1);
    } catch (err: any) {
      toast.error("Period setup error", err?.message);
    } finally {
      setIsProcessingRun(false);
    }
  };

  // Execute Calculate Run
  const handleCalculateRun = async () => {
    if (!selectedPeriodId) return;

    if (employeesMissingSalary.length > 0) {
      toast.error(
        "Missing salaries",
        `${employeesMissingSalary.length} active employee(s) do not have a salary set. Please assign their salaries first.`
      );
      return;
    }

    if (taxRules.filter((r) => r.active).length === 0) {
      toast.error(
        "No tax rules active",
        "Add at least one active statutory tax or deduction rule before calculating payroll."
      );
      return;
    }

    setIsProcessingRun(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);

      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/periods/${selectedPeriodId}/runs`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Calculation failed.");
      }

      const createdRun = await res.json();
      setActiveRun(createdRun);
      await loadRunItems(createdRun.id);
      syncClockInHours(selectedPeriodId);
      await fetchPayrollData(true);
      setWizardStep(2); // Go to review
      toast.success("Payroll calculated", "Calculated earnings and statutory deductions with clock-in hours sync.");
    } catch (err: any) {
      toast.error("Calculation failed", err?.message);
    } finally {
      setIsProcessingRun(false);
    }
  };

  // Lock & Finalize Run
  const handleLockRun = async (
    itemsToLock?: Array<{
      employeeId: string;
      basePay: number;
      earnings: number;
      deductions: number;
      netPay: number;
    }>
  ) => {
    if (!activeRun) return;
    setIsProcessingRun(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${activeRun.id}/lock`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: itemsToLock || [] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not lock run.");
      }

      toast.success("Payroll finalized & locked", "Official employee payslips have been generated in the system.");
      await fetchPayrollData(true);
      setSelectedRunIdForPayslips(activeRun.id);
      setWizardStep(3); // Success step
    } catch (err: any) {
      toast.error("Lock failed", err?.message);
    } finally {
      setIsProcessingRun(false);
    }
  };

  // Discard Run
  const handleDiscardRun = async (runId: string) => {
    if (!confirm("Are you sure you want to discard this calculated run? This period will return to draft.")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${runId}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!res.ok) throw new Error("Could not discard run.");
      toast.info("Run discarded", "Pay period reset to draft.");
      setActiveRun(null);
      setRunItems([]);
      setWizardStep(0);
      await fetchPayrollData(true);
    } catch (err: any) {
      toast.error("Discard failed", err?.message);
    }
  };

  // Email payslips
  const handleEmailPayslips = async (runId: string) => {
    setIsSendingEmails(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${runId}/payslips/email`, {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not send payslips.");
      }
      const data = await res.json();
      toast.success("Payslips delivered", `Sent: ${data.sent} · Failed: ${data.failed}`);
      await loadPayslipsForRun(runId);
      await fetchPayrollData(true);
    } catch (err: any) {
      toast.error("Delivery failed", err?.message);
    } finally {
      setIsSendingEmails(false);
    }
  };

  // ==========================================================================
  // TAB 1: OVERVIEW
  // ==========================================================================
  const renderOverview = () => {
    const selectedPeriodObj = periods.find((p) => p.id === selectedPeriodId) || periods[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Walkthrough Widget (Workaround guide) */}
        <PayrollWalkthroughWidget
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onNavigateTab={handleNavigateTab}
          hasConfig={!!activeConfig}
          employeesWithComp={rosterWithComp.filter((e) => e.hasSalary).length}
          totalEmployees={employees.length}
          hasRules={taxRules.filter((r) => r.active).length > 0}
        />

        {/* Missing Salary Notice */}
        {employeesMissingSalary.length > 0 && (
          <div
            style={{
              padding: "14px 18px",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#D97706",
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>
                  Compensation setup needed:{" "}
                </strong>
                <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                  {employeesMissingSalary.length} active employee(s) do not have a monthly base salary recorded. Add their salary so they are included in payroll calculations.
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => handleNavigateTab("Salaries", "compensation")}
              style={{ flexShrink: 0 }}
            >
              Assign Salaries
            </button>
          </div>
        )}

        {/* Aggregate Stat Ribbon */}
        <StatRibbon
          stats={[
            {
              label: "Active on Payroll",
              value: aggregateMetrics.activeEmployees,
              icon: <UserCheck size={18} />,
              color: "var(--primary)",
              description: "Active employees in organization",
            },
            {
              label: "Total Gross Payroll",
              value: formatMoney(aggregateMetrics.totalGross, currentCurrency, { compact: true }),
              icon: <Building size={18} />,
              color: "var(--primary)",
              description: "Total base compensation",
            },
            {
              label: "Total Net Take-Home",
              value: formatMoney(aggregateMetrics.totalNet, currentCurrency, { compact: true }),
              icon: <DollarSign size={18} />,
              color: "#16A34A",
              description: "Take-home pay to team",
            },
            {
              label: "Taxes & Deductions",
              value: formatMoney(aggregateMetrics.totalDeductions, currentCurrency, { compact: true }),
              icon: <FileText size={18} />,
              color: "#EA580C",
              description: "PAYE, NSSF & withholdings",
            },
          ]}
        />

        {/* Current Pay Period Card & Quick Launch */}
        <Card>
          <CardBody style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-1)" }}>
                    {selectedPeriodObj ? monthLabel(selectedPeriodObj.startDate) : "Current Pay Period"}
                  </h3>
                  <Badge variant={selectedPeriodObj?.status === "locked" || selectedPeriodObj?.status === "paid" ? "success" : "primary"}>
                    {selectedPeriodObj ? selectedPeriodObj.status.toUpperCase() : "READY"}
                  </Badge>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-4)", margin: "4px 0 0 0" }}>
                  {selectedPeriodObj
                    ? `Cycle: ${shortDate(selectedPeriodObj.startDate)} to ${shortDate(selectedPeriodObj.endDate)} · Pay Date: ${shortDate(selectedPeriodObj.payDate)}`
                    : "No pay period created yet. Launch the wizard to begin."}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="btn-neutral"
                  onClick={() => setActiveTab("Salaries")}
                >
                  <DollarSign size={14} className="mr-4" /> Salaries ({rosterWithComp.filter((e) => e.hasSalary).length}/{employees.length})
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setActiveTab("Run Payroll");
                    setWizardStep(0);
                  }}
                >
                  <DollarSign size={15} className="mr-6" /> Run Payroll Wizard
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Recent Payroll Runs Table */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-1)" }}>
              Recent Payroll Runs
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-4)" }}>
              {runs.length} run{runs.length === 1 ? "" : "s"} recorded
            </span>
          </div>

          <Card>
            <CardBody style={{ padding: 0 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#FAF9F7", borderBottom: "1px solid var(--card-border)" }}>
                      <th style={{ padding: "12px 18px" }}>Pay Period</th>
                      <th style={{ padding: "12px 18px" }}>Employees</th>
                      <th style={{ padding: "12px 18px" }}>Gross Pay</th>
                      <th style={{ padding: "12px 18px" }}>Deductions</th>
                      <th style={{ padding: "12px 18px" }}>Net Disbursed</th>
                      <th style={{ padding: "12px 18px" }}>Status</th>
                      <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "36px 18px", textAlign: "center", color: "var(--text-4)" }}>
                          No payroll runs processed yet. Click <strong>Run Payroll Wizard</strong> above to process your first pay cycle.
                        </td>
                      </tr>
                    ) : (
                      runs.map((r) => (
                        <tr key={r.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <td style={{ padding: "12px 18px" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-1)" }}>
                              {monthLabel(r.periodStart)}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>
                              {shortDate(r.periodStart)} – {shortDate(r.periodEnd)}
                            </div>
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-2)" }}>
                            {r.employeeCount} staff
                          </td>
                          <td style={{ padding: "12px 18px", fontWeight: 600 }}>
                            {formatMoney(r.totalBasePay + r.totalEarnings, r.currency || currentCurrency)}
                          </td>
                          <td style={{ padding: "12px 18px", color: "#DC2626", fontWeight: 600 }}>
                            -{formatMoney(r.totalDeductions, r.currency || currentCurrency)}
                          </td>
                          <td style={{ padding: "12px 18px", fontWeight: 700, color: "#16A34A" }}>
                            {formatMoney(r.totalNetPay, r.currency || currentCurrency)}
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <Badge variant={r.status === "approved" ? "success" : "warning"}>
                              {r.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              {r.status === "approved" ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn-neutral btn-sm"
                                    onClick={() => {
                                      setSelectedRunIdForPayslips(r.id);
                                      setActiveTab("Paystubs");
                                    }}
                                  >
                                    <Eye size={12} className="mr-4" /> Payslips
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-neutral btn-sm"
                                    disabled={isSendingEmails}
                                    onClick={() => handleEmailPayslips(r.id)}
                                    title="Email payslips to team"
                                  >
                                    <Mail size={12} className="mr-4" /> Email
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn-primary btn-sm"
                                    onClick={() => {
                                      setActiveRun(r);
                                      setSelectedPeriodId(r.payrollPeriodId);
                                      loadRunItems(r.id);
                                      setWizardStep(2);
                                      setActiveTab("Run Payroll");
                                    }}
                                  >
                                    Review &amp; Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-neutral btn-sm"
                                    style={{ color: "#DC2626" }}
                                    onClick={() => handleDiscardRun(r.id)}
                                    title="Discard run"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
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
      </div>
    );
  };

  // ==========================================================================
  // TAB 2: RUN PAYROLL WIZARD
  // ==========================================================================
  const renderRunPayrollWizard = () => {
    return (
      <div style={{ maxWidth: 940, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Wizard Stepper Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#FFFFFF",
            border: "1px solid var(--card-border)",
            borderRadius: 14,
            padding: "14px 20px",
          }}
        >
          {["1. Pay Period & Roster", "2. Calculate & Review", "3. Finalize & Disburse"].map((step, idx) => (
            <React.Fragment key={idx}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: wizardStep >= idx ? 1 : 0.45,
                  cursor: idx <= wizardStep ? "pointer" : "default",
                }}
                onClick={() => {
                  if (idx <= wizardStep) setWizardStep(idx);
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: wizardStep > idx ? "#16A34A" : wizardStep === idx ? "var(--primary)" : "#E4E4E7",
                    color: "#FFFFFF",
                  }}
                >
                  {wizardStep > idx ? <Check size={14} /> : idx + 1}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: wizardStep === idx ? 700 : 500, color: "var(--text-1)" }}>
                  {step}
                </span>
              </div>
              {idx < 2 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: wizardStep > idx ? "#16A34A" : "#E4E4E7",
                    margin: "0 14px",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 0: Select Period & Review Roster */}
        {wizardStep === 0 && (
          <Card>
            <CardHeader title="Step 1: Select Pay Period & Verify Team Compensation" />
            <CardBody style={{ padding: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
                  Choose the month you are running payroll for. EasyHR will verify that all active team members have their base compensation set before computing taxes and deductions.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                      Pay Period Month
                    </label>
                    <input
                      type="month"
                      className="input"
                      value={newPeriodMonth}
                      onChange={(e) => setNewPeriodMonth(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                      Active Company Jurisdiction
                    </label>
                    <div style={{ padding: "9px 12px", background: "#FAF9F7", border: "1px solid var(--card-border)", borderRadius: 10, fontSize: 13 }}>
                      <strong>{countryName(currentCountry)} ({currentCountry})</strong> · Currency: <strong>{currentCurrency}</strong>
                    </div>
                  </div>
                </div>

                {/* Roster Check Summary */}
                <div
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: 10,
                    padding: 16,
                    background: employeesMissingSalary.length === 0 ? "#F0FDF4" : "#FFFBEB",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {employeesMissingSalary.length === 0 ? (
                        <CheckCircle2 size={18} style={{ color: "#16A34A" }} />
                      ) : (
                        <AlertTriangle size={18} style={{ color: "#D97706" }} />
                      )}
                      <strong style={{ fontSize: 13, color: "var(--text-1)" }}>
                        {employeesMissingSalary.length === 0
                          ? `All ${employees.length} active employees have salaries recorded.`
                          : `${employeesMissingSalary.length} employee(s) missing salary configuration.`}
                      </strong>
                    </div>
                    {employeesMissingSalary.length > 0 && (
                      <button
                        type="button"
                        className="btn-neutral btn-sm"
                        onClick={() => setActiveTab("Salaries")}
                      >
                        Assign Missing Salaries
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
                    Active deduction rules for this run: <strong>{taxRules.filter((r) => r.active).length} rule(s)</strong> (PAYE, NSSF, etc.).
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn-neutral" onClick={() => setActiveTab("Overview")}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isProcessingRun}
                    onClick={handleCreateOrSelectPeriod}
                  >
                    {isProcessingRun ? <Loader2 size={14} className="animate-spin mr-6" /> : null}
                    Proceed to Calculation <ChevronRight size={14} className="ml-4" />
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* STEP 1: Ready to Calculate */}
        {wizardStep === 1 && (
          <Card>
            <CardHeader title="Step 2: Calculate Pay Run" />
            <CardBody style={{ padding: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
                  Ready to calculate earnings, progressive income taxes, and statutory deductions for {employees.length} team members for {monthLabel(newPeriodMonth + "-01")}.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div style={{ padding: "14px 16px", background: "#FAF9F7", borderRadius: 10, border: "1px solid var(--card-border)" }}>
                    <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Employees in Run</span>
                    <strong style={{ fontSize: 18, color: "var(--text-1)" }}>{employees.length} staff</strong>
                  </div>
                  <div style={{ padding: "14px 16px", background: "#FAF9F7", borderRadius: 10, border: "1px solid var(--card-border)" }}>
                    <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Active Tax Rules</span>
                    <strong style={{ fontSize: 18, color: "var(--text-1)" }}>
                      {taxRules.filter((r) => r.active).length} Active
                    </strong>
                  </div>
                  <div style={{ padding: "14px 16px", background: "#FAF9F7", borderRadius: 10, border: "1px solid var(--card-border)" }}>
                    <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Disbursement Currency</span>
                    <strong style={{ fontSize: 18, color: "var(--primary)" }}>{currentCurrency}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button type="button" className="btn-neutral" onClick={() => setWizardStep(0)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isProcessingRun}
                    onClick={handleCalculateRun}
                  >
                    {isProcessingRun ? <Loader2 size={14} className="animate-spin mr-6" /> : <Sparkles size={14} className="mr-6" />}
                    Calculate Payroll Now
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* STEP 2: Review Calculated Run Items with Live Dynamic Hourly & Higher Rates */}
        {wizardStep === 2 && (() => {
          // Compute live items for each employee in the active run
          const evaluatedItems = runItems.map((item) => {
            const comp = compensationList.find((c) => c.employeeId === item.employeeId);
            const parsed = parseCompensationDetails(comp);
            const adj = employeeAdjustments[item.employeeId] || {
              productiveHours: parsed.standardHours || 173.33,
              overtimeHours: 0,
              holidayHours: 0,
              bonusesMinor: 0,
              penaltiesMinor: 0,
              insuranceMinor: 0,
            };

            const contractedBaseMinor = comp && comp.baseAmountMinor > 0 ? comp.baseAmountMinor : item.basePay;
            const calc = calculateChargeableGross({
              payRateMinor: parsed.hourlyRateMinor,
              isHourly: parsed.model === "hourly",
              monthlyBaseMinor: contractedBaseMinor,
              productiveHours: adj.productiveHours,
              standardMonthlyHours: parsed.standardHours || (activeConfig ? activeConfig.standardMonthlyMinutes / 60 : (settings.standardMonthlyHours || 173.33)),
              overtimeHours: adj.overtimeHours,
              holidayHours: adj.holidayHours,
              bonusesMinor: adj.bonusesMinor,
              insuranceMinor: adj.insuranceMinor,
              penaltiesMinor: adj.penaltiesMinor,
              overtimeMultiplier: activeOvertimeMultiplier,
              holidayMultiplier: activeHolidayMultiplier,
            });

            const activeRules = taxRules.filter((r) => r.active);
            const empObj = employees.find((e) => e.id === item.employeeId);
            const est = activeRules.length > 0 ? estimatePay(calc.chargeableGrossMinor, activeRules, empObj) : null;
            const paye = est
              ? est.deductions
              : currentCountry === "UG"
                ? calculateUgandaPAYE(calc.chargeableGrossMinor)
                : Math.round(item.deductions * 0.8);
            const nssf = est
              ? 0
              : currentCountry === "UG"
                ? calculateNSSF(calc.chargeableGrossMinor)
                : Math.round(item.deductions * 0.2);
            const totalDeductions = est ? est.deductions : paye + nssf;
            const deductionLabel = est
              ? est.lines.map((l) => `${l.name} ${formatMoney(l.amount, currentCurrency)}`).join(" · ")
              : `PAYE ${formatMoney(paye, currentCurrency)} · NSSF ${formatMoney(nssf, currentCurrency)}`;
            const netPay = Math.max(0, calc.chargeableGrossMinor - totalDeductions);

            return {
              item,
              contractedBaseMinor,
              parsed,
              adj,
              calc,
              paye,
              nssf,
              totalDeductions,
              deductionLabel,
              netPay,
            };
          });

          const totalGrossAll = evaluatedItems.reduce((s, e) => s + e.calc.chargeableGrossMinor, 0);
          const totalDeductionsAll = evaluatedItems.reduce((s, e) => s + e.totalDeductions, 0);
          const totalNetAll = evaluatedItems.reduce((s, e) => s + e.netPay, 0);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card>
                <CardHeader
                  title="Step 3: Review Calculated Payroll & Approve"
                  action={
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn-neutral btn-sm"
                        onClick={() => setIsFormulaDrawerOpen(true)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        title="View calculation formula, higher rates multipliers, and statutory tax rules"
                      >
                        <HelpCircle size={13} style={{ color: "var(--primary)" }} />
                        <span>Calculation Guide</span>
                      </button>
                      <button
                        type="button"
                        className="btn-neutral btn-sm"
                        onClick={() => syncClockInHours()}
                        title="Auto-sync productive and overtime hours from employee clock-in punches and submitted timesheets"
                      >
                        <Clock size={12} className="mr-4" style={{ color: "var(--primary)" }} />
                        Auto-Sync Clock-in
                      </button>
                      {activeRun && (
                        <button
                          type="button"
                          className="btn-neutral btn-sm"
                          style={{ color: "#DC2626" }}
                          onClick={() => handleDiscardRun(activeRun.id)}
                        >
                          <Trash2 size={12} className="mr-4" /> Discard &amp; Recompute
                        </button>
                      )}
                    </div>
                  }
                />
                <CardBody style={{ padding: 0 }}>
                  {/* Aggregate Summary Ribbon */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 16,
                      padding: "16px 20px",
                      background: "#FAF9F7",
                      borderBottom: "1px solid var(--card-border, #E8ECE8)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Total Chargeable Gross</span>
                      <strong style={{ fontSize: 16, color: "var(--text-1)" }}>
                        {formatMoney(totalGrossAll, currentCurrency)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Total Statutory Deductions</span>
                      <strong style={{ fontSize: 16, color: "#DC2626" }}>
                        -{formatMoney(totalDeductionsAll, currentCurrency)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Net Disbursement</span>
                      <strong style={{ fontSize: 16, color: "#16A34A" }}>
                        {formatMoney(totalNetAll, currentCurrency)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Employees in Run</span>
                      <strong style={{ fontSize: 16, color: "var(--text-1)" }}>{runItems.length} Staff</strong>
                    </div>
                  </div>

                  {/* Clean, Non-Congested Run Items Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ background: "#FFFFFF", borderBottom: "1px solid var(--card-border)", color: "var(--text-4)" }}>
                          <th style={{ padding: "12px 18px", position: "sticky", left: 0, background: "#FFFFFF", zIndex: 3, borderRight: "1px solid var(--card-border)" }}>Employee</th>
                          <th style={{ padding: "12px 16px" }}>Pay Model</th>
                          <th style={{ padding: "12px 16px" }}>Hours Worked</th>
                          <th style={{ padding: "12px 16px" }}>Adjustments</th>
                          <th style={{ padding: "12px 16px" }}>Chargeable Gross</th>
                          <th style={{ padding: "12px 16px" }}>Deductions</th>
                          <th style={{ padding: "12px 16px" }}>Net Pay</th>
                          <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluatedItems.map(({ item, contractedBaseMinor, parsed, adj, calc, paye, nssf, totalDeductions, deductionLabel, netPay }) => {
                          const hasAdjustments = calc.totalHigherRatesMinor > 0 || calc.totalBonusesMinor > 0 || calc.totalPenaltiesMinor > 0;
                          return (
                            <tr key={item.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                              {/* Sticky Employee Column */}
                              <td
                                style={{
                                  padding: "14px 18px",
                                  position: "sticky",
                                  left: 0,
                                  background: "#FFFFFF",
                                  zIndex: 2,
                                  borderRight: "1px solid var(--card-border)",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <Avatar name={item.employeeName} size="sm" src={item.avatarUrl} />
                                  <div style={{ minWidth: 0 }}>
                                    <strong style={{ color: "var(--text-1)", display: "block", fontSize: 13, lineHeight: 1.3 }}>
                                      {item.employeeName}
                                    </strong>
                                    <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>
                                      {item.department || "General Staff"}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Pay Model & Baseline Rate */}
                              <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                    background: parsed.model === "hourly" ? "#FEF3C7" : "#F4F4F5",
                                    color: parsed.model === "hourly" ? "#D97706" : "#52525B",
                                    display: "inline-block",
                                  }}
                                >
                                  {parsed.model === "hourly" ? "HOURLY" : "SALARIED"}
                                </span>
                                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>
                                  <strong>{formatMoney(calc.effectiveHourlyRateMinor, currentCurrency)}</strong>/hr
                                  {parsed.model !== "hourly" && (
                                    <span style={{ color: "var(--text-4)", fontSize: 10.5, display: "block" }}>
                                      {formatMoney(contractedBaseMinor, currentCurrency)}/mo base
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Hours Worked (Punched or Contracted) */}
                              <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <strong style={{ color: "var(--text-1)", fontSize: 13 }}>
                                    {adj.productiveHours} hrs
                                  </strong>
                                  {adj.isSyncedFromClockIn ? (
                                    <span
                                      style={{
                                        fontSize: 10.5,
                                        fontWeight: 600,
                                        color: "#15803D",
                                        background: "#DCFCE7",
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                      }}
                                      title="Hours auto-synced from clock-in & attendance records"
                                    >
                                      <Clock size={10} /> Synced
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 11, color: "var(--text-4)" }}>Contracted</span>
                                  )}
                                </div>
                                {(adj.overtimeHours > 0 || adj.holidayHours > 0) && (
                                  <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 2, fontWeight: 500 }}>
                                    {adj.overtimeHours > 0 && `+${adj.overtimeHours}h OT (${activeOvertimeMultiplier}×)`}
                                    {adj.overtimeHours > 0 && adj.holidayHours > 0 && " · "}
                                    {adj.holidayHours > 0 && `+${adj.holidayHours}h Hol (${activeHolidayMultiplier}×)`}
                                  </div>
                                )}
                              </td>

                              {/* Consolidated Adjustments */}
                              <td style={{ padding: "14px 16px", fontSize: 12 }}>
                                {hasAdjustments ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {calc.totalHigherRatesMinor > 0 && (
                                      <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                                        +{formatMoney(calc.totalHigherRatesMinor, currentCurrency)} <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>(OT/Hol)</span>
                                      </span>
                                    )}
                                    {calc.totalBonusesMinor > 0 && (
                                      <span style={{ color: "#16A34A", fontWeight: 600 }}>
                                        +{formatMoney(calc.totalBonusesMinor, currentCurrency)} <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>(Bonus)</span>
                                      </span>
                                    )}
                                    {calc.totalPenaltiesMinor > 0 && (
                                      <span style={{ color: "#DC2626", fontWeight: 600 }}>
                                        -{formatMoney(calc.totalPenaltiesMinor, currentCurrency)} <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>(Penalty)</span>
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--text-4)" }}>—</span>
                                )}
                              </td>

                              {/* Chargeable Gross */}
                              <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>
                                  {formatMoney(calc.chargeableGrossMinor, currentCurrency)}
                                </strong>
                              </td>

                              {/* Deductions with Breakdown */}
                              <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                <strong style={{ fontSize: 13.5, color: "#DC2626" }}>
                                  -{formatMoney(totalDeductions, currentCurrency)}
                                </strong>
                                <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 2 }}>
                                  {deductionLabel}
                                </div>
                              </td>

                              {/* Net Pay */}
                              <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    background: "#DCFCE7",
                                    color: "#15803D",
                                    fontWeight: 700,
                                    fontSize: 13,
                                  }}
                                >
                                  {formatMoney(netPay, currentCurrency)}
                                </span>
                              </td>

                              {/* Actions */}
                              <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                                <div style={{ display: "inline-flex", gap: 6 }}>
                                  <button
                                    type="button"
                                    className="btn-neutral btn-sm"
                                    onClick={() => {
                                      setEditingAdjItem(item);
                                      setFormProductiveHours(String(adj.productiveHours));
                                      setFormOvertimeHours(String(adj.overtimeHours));
                                      setFormHolidayHours(String(adj.holidayHours));
                                      setFormBonuses(String(toMajor(adj.bonusesMinor)));
                                      setFormPenalties(String(toMajor(adj.penaltiesMinor)));
                                      setFormInsurance(String(toMajor(adj.insuranceMinor)));
                                    }}
                                    title="Adjust hours, overtime, holidays, bonuses"
                                  >
                                    Adjust Hours
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-neutral btn-sm"
                                    onClick={() =>
                                      setStatementPayslip({
                                        ...item,
                                        currency: currentCurrency,
                                        productiveHours: adj.productiveHours,
                                        overtimeHours: adj.overtimeHours,
                                        holidayHours: adj.holidayHours,
                                        higherRatesMinor: calc.totalHigherRatesMinor,
                                        bonusesMinor: calc.totalBonusesMinor,
                                        penaltiesMinor: calc.totalPenaltiesMinor,
                                        insuranceMinor: calc.totalInsuranceMinor,
                                        overtimeMultiplier: activeOvertimeMultiplier,
                                        holidayMultiplier: activeHolidayMultiplier,
                                        payModel: parsed.model,
                                        hourlyRateMinor: parsed.hourlyRateMinor,
                                        basePay: calc.baseMonthlyCompensationMinor,
                                        earnings: calc.totalHigherRatesMinor + calc.totalBonusesMinor + calc.totalInsuranceMinor,
                                        deductions: totalDeductions,
                                        netPay,
                                      })
                                    }
                                  >
                                    <Eye size={12} className="mr-4" /> Statement
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Approve Button */}
                  <div style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button type="button" className="btn-neutral" onClick={() => setWizardStep(1)}>
                      Back to Calculation
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={isProcessingRun}
                      onClick={() =>
                        handleLockRun(
                          evaluatedItems.map(({ item, calc, totalDeductions, netPay }) => ({
                            employeeId: item.employeeId,
                            basePay: calc.baseMonthlyCompensationMinor,
                            earnings: Math.max(0, calc.chargeableGrossMinor - calc.baseMonthlyCompensationMinor),
                            deductions: totalDeductions,
                            netPay,
                          }))
                        )
                      }
                      style={{ padding: "10px 22px", fontSize: 13.5 }}
                    >
                      {isProcessingRun ? <Loader2 size={15} className="animate-spin mr-6" /> : <ShieldCheck size={16} className="mr-6" />}
                      Approve &amp; Lock Payroll Run
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>
          );
        })()}

        {/* STEP 3: Completed */}
        {wizardStep === 3 && (
          <Card>
            <CardBody style={{ padding: 40, textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: "#DCFCE7",
                  color: "#16A34A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px 0", color: "var(--text-1)" }}>
                Payroll Finalized &amp; Locked!
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 460, margin: "0 auto 24px auto" }}>
                Official pay statements have been generated for {runItems.length} employees. You can now distribute them via email or view/print individual payslips.
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  type="button"
                  className="btn-neutral"
                  onClick={() => {
                    setActiveTab("Overview");
                    setWizardStep(0);
                  }}
                >
                  Back to Dashboard
                </button>
                {activeRun && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isSendingEmails}
                    onClick={() => handleEmailPayslips(activeRun.id)}
                  >
                    {isSendingEmails ? <Loader2 size={14} className="animate-spin mr-6" /> : <Mail size={15} className="mr-6" />}
                    Email Payslips to Team
                  </button>
                )}
                <button
                  type="button"
                  className="btn-neutral"
                  onClick={() => {
                    if (activeRun) setSelectedRunIdForPayslips(activeRun.id);
                    setActiveTab("Paystubs");
                  }}
                >
                  View Paystubs Archive
                </button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    );
  };

  // ==========================================================================
  // TAB 3: SALARIES & COMPENSATION
  // ==========================================================================
  const renderSalaries = () => {
    const filteredRoster = rosterWithComp.filter((emp) => {
      if (salaryDeptFilter !== "all" && emp.departmentId !== salaryDeptFilter) return false;
      if (salarySearch.trim()) {
        const q = salarySearch.toLowerCase();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        if (!fullName.includes(q) && !emp.jobTitle?.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-1)" }}>
              Employee Salaries &amp; Compensation
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: "3px 0 0 0" }}>
              Configure hourly rates, standard productive hours, or fixed monthly salaries for active staff.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="btn-neutral"
              onClick={() => setIsFormulaDrawerOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <HelpCircle size={14} style={{ color: "var(--primary)" }} />
              Calculation Guide
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSelectedCompEmployeeId(employees[0]?.id || "");
                setIsCompModalOpen(true);
              }}
            >
              <Plus size={14} className="mr-6" /> Set Employee Compensation
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: 260 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: 11, color: "var(--text-4)" }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 34, fontSize: 12.5 }}
              placeholder="Search employee or job title..."
              value={salarySearch}
              onChange={(e) => setSalarySearch(e.target.value)}
            />
          </div>

          <SearchableSelect
            size="sm"
            style={{ width: 190 }}
            options={deptFilterOptions}
            value={salaryDeptFilter}
            onChange={(val) => setSalaryDeptFilter(val)}
            placeholder="All Departments"
            searchPlaceholder="Filter department..."
          />
        </div>

        {/* Roster Table */}
        <Card>
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#FAF9F7", borderBottom: "1px solid var(--card-border)", color: "var(--text-4)" }}>
                    <th style={{ padding: "12px 18px" }}>Employee</th>
                    <th style={{ padding: "12px 18px" }}>Department &amp; Job Title</th>
                    <th style={{ padding: "12px 18px" }}>Pay Model &amp; Rate</th>
                    <th style={{ padding: "12px 18px" }}>Standard Hours</th>
                    <th style={{ padding: "12px 18px" }}>Monthly Base Compensation</th>
                    <th style={{ padding: "12px 18px" }}>Effective Date</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "36px 18px", textAlign: "center", color: "var(--text-4)" }}>
                        No employees match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((emp) => {
                      const comp = compensationList.find((c) => c.employeeId === emp.id);
                      const parsed = parseCompensationDetails(comp);

                      return (
                        <tr key={emp.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <td style={{ padding: "12px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" src={emp.avatar} />
                              <div>
                                <strong style={{ color: "var(--text-1)" }}>
                                  {emp.firstName} {emp.lastName}
                                </strong>
                                {emp.workEmail && (
                                  <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{emp.workEmail}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-3)" }}>
                            <div>{emp.jobTitle || "Staff"}</div>
                            <div style={{ fontSize: 11, color: "var(--text-4)" }}>{emp.department || "General"}</div>
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            {emp.hasSalary ? (
                              <div>
                                <Badge variant="neutral">
                                  {parsed.model === "hourly" ? "HOURLY" : "SALARIED"}
                                </Badge>
                                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                                  {parsed.model === "hourly"
                                    ? `${formatMoney(parsed.hourlyRateMinor, emp.currency)} / hr`
                                    : "Fixed Monthly"}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--text-4)" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-3)", fontSize: 12 }}>
                            {emp.hasSalary ? `${parsed.standardHours} hrs/mo` : "—"}
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            {emp.hasSalary ? (
                              <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>
                                {formatMoney(emp.baseAmountMinor, emp.currency)}
                              </strong>
                            ) : (
                              <span style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>
                                Not set
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-4)", fontSize: 12 }}>
                            {emp.effectiveDate ? shortDate(emp.effectiveDate) : "—"}
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <Badge variant={emp.hasSalary ? "success" : "warning"}>
                              {emp.hasSalary ? "CONFIGURED" : "MISSING"}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-neutral btn-sm"
                              onClick={() => {
                                setSelectedCompEmployeeId(emp.id);
                                setIsCompModalOpen(true);
                              }}
                            >
                              <Edit3 size={12} className="mr-4" /> {emp.hasSalary ? "Update" : "Set Salary"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // ==========================================================================
  // TAB 4: DEDUCTIONS & RULES
  // ==========================================================================
  const renderRules = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-1)" }}>
              Statutory Taxes &amp; Company Deductions
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: "3px 0 0 0" }}>
              Configure progressive income tax brackets, social security withholdings, and custom company deductions.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsTaxRuleModalOpen(true)}
            >
              <Plus size={14} className="mr-6" /> Add Deduction Rule
            </button>
          </div>
        </div>

        <Card>
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#FAF9F7", borderBottom: "1px solid var(--card-border)", color: "var(--text-4)" }}>
                    <th style={{ padding: "12px 18px" }}>Rule Name</th>
                    <th style={{ padding: "12px 18px" }}>Type</th>
                    <th style={{ padding: "12px 18px" }}>Calculation Formula</th>
                    <th style={{ padding: "12px 18px" }}>Applies To</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px 24px", textAlign: "center" }}>
                        <div style={{ maxWidth: 520, margin: "0 auto" }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: "var(--primary-tint, #EFF6FF)",
                              color: "var(--primary, #2563EB)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto 12px auto",
                            }}
                          >
                            <Receipt size={20} />
                          </div>
                          <h4 style={{ fontSize: 14.5, fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-1)" }}>
                            No Statutory or Deduction Rules Yet
                          </h4>
                          <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 16px 0", lineHeight: 1.45 }}>
                            Payroll requires statutory rules (like progressive PAYE or NSSF pension) to calculate employee net pay.
                          </p>
                          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn-primary btn-sm"
                              onClick={() => setIsTaxRuleModalOpen(true)}
                            >
                              <TrendingUp size={13} className="mr-4" /> Add Uganda PAYE Brackets
                            </button>
                            <button
                              type="button"
                              className="btn-neutral btn-sm"
                              onClick={() => setIsTaxRuleModalOpen(true)}
                            >
                              <ShieldCheck size={13} className="mr-4" /> Add NSSF (5% Employee)
                            </button>
                            <button
                              type="button"
                              className="btn-neutral btn-sm"
                              onClick={() => setIsTaxRuleModalOpen(true)}
                            >
                              <Plus size={13} className="mr-4" /> Custom Rule
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    taxRules.map((rule) => {
                      const nameLower = rule.ruleName.toLowerCase();
                      const isProgressive = rule.ruleType === "progressive_tax";
                      const isPension = nameLower.includes("nssf") || nameLower.includes("pension") || nameLower.includes("social");
                      const isHealth = nameLower.includes("health") || nameLower.includes("medical") || nameLower.includes("insurance");
                      const isFixed = rule.amountMinor > 0;

                      return (
                        <tr key={rule.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <td style={{ padding: "12px 18px" }}>
                            <strong style={{ color: "var(--text-1)" }}>{rule.ruleName}</strong>
                            <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>
                              Country: {rule.country} · {rule.currency}
                            </div>
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <Badge variant="neutral">
                              {isProgressive
                                ? "PROGRESSIVE TAX (PAYE)"
                                : isPension
                                ? "PENSION / STATUTORY"
                                : isHealth
                                ? "HEALTH SCHEME"
                                : isFixed
                                ? "FIXED MONTHLY"
                                : "PERCENTAGE DEDUCTION"}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-2)", fontSize: 12.5 }}>
                            {describeRule(rule, rule.currency || currentCurrency)}
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-3)", fontSize: 12 }}>
                            {rule.appliesTo === "all_employees"
                              ? "All Employees"
                              : `${rule.appliesTo.toUpperCase()}`}
                          </td>
                        <td style={{ padding: "12px 18px" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleRuleActive(rule.id, rule.active)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "3px 10px",
                              borderRadius: 999,
                              border: "none",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              background: rule.active ? "#DCFCE7" : "#F4F4F5",
                              color: rule.active ? "#15803D" : "#71717A",
                            }}
                          >
                            {rule.active ? <Check size={12} /> : <X size={12} />}
                            {rule.active ? "ACTIVE" : "PAUSED"}
                          </button>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-neutral btn-sm"
                            style={{ color: "#DC2626" }}
                            onClick={() => handleDeleteRule(rule.id, rule.ruleName)}
                            title="Delete rule"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // ==========================================================================
  // TAB 5: PAYSTUBS
  // ==========================================================================
  const renderPaystubs = () => {
    const filteredPayslips = runPayslips.filter((slip) => {
      if (paystubSearch.trim()) {
        const q = paystubSearch.toLowerCase();
        return slip.employeeName.toLowerCase().includes(q) || slip.email?.toLowerCase().includes(q);
      }
      return true;
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-1)" }}>
              Paystubs &amp; Official Statements
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: "3px 0 0 0" }}>
              Archive of finalized payslips generated for each payroll run.
            </p>
          </div>

          {selectedRunIdForPayslips && (
            <button
              type="button"
              className="btn-neutral"
              disabled={isSendingEmails || runPayslips.length === 0}
              onClick={() => handleEmailPayslips(selectedRunIdForPayslips)}
            >
              {isSendingEmails ? <Loader2 size={14} className="animate-spin mr-6" /> : <Mail size={14} className="mr-6" />}
              Email Payslips to Team
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase" }}>
              Pay Run:
            </label>
            <SearchableSelect
              size="sm"
              style={{ width: 230 }}
              options={runs.map((r) => ({
                value: r.id,
                label: `${monthLabel(r.periodStart)} (${r.status.toUpperCase()})`,
                description: `${shortDate(r.periodStart)} to ${shortDate(r.periodEnd)}`,
              }))}
              value={selectedRunIdForPayslips}
              onChange={(val) => setSelectedRunIdForPayslips(val)}
              placeholder="Select pay run..."
              searchPlaceholder="Search pay run..."
            />
          </div>

          <div style={{ position: "relative", minWidth: 260 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: 11, color: "var(--text-4)" }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 34, fontSize: 12.5 }}
              placeholder="Search employee name..."
              value={paystubSearch}
              onChange={(e) => setPaystubSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Payslips Table */}
        <Card>
          <CardBody style={{ padding: 0 }}>
            {isLoadingPayslips ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-4)" }}>
                <Loader2 size={24} className="animate-spin mb-8 mx-auto" />
                <span>Loading payslips for this run...</span>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#FAF9F7", borderBottom: "1px solid var(--card-border)", color: "var(--text-4)" }}>
                      <th style={{ padding: "12px 18px" }}>Employee</th>
                      <th style={{ padding: "12px 18px" }}>Pay Period</th>
                      <th style={{ padding: "12px 18px" }}>Gross Pay</th>
                      <th style={{ padding: "12px 18px" }}>Deductions</th>
                      <th style={{ padding: "12px 18px" }}>Net Pay</th>
                      <th style={{ padding: "12px 18px" }}>Delivery</th>
                      <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayslips.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "36px 18px", textAlign: "center", color: "var(--text-4)" }}>
                          No payslips found for this run. Once a run is approved and locked, paystubs appear here.
                        </td>
                      </tr>
                    ) : (
                      filteredPayslips.map((slip) => (
                        <tr key={slip.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <td style={{ padding: "12px 18px" }}>
                            <strong style={{ color: "var(--text-1)" }}>{slip.employeeName}</strong>
                            {slip.email && (
                              <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{slip.email}</div>
                            )}
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-3)", fontSize: 12 }}>
                            {shortDate(slip.periodStart)} – {shortDate(slip.periodEnd)}
                          </td>
                          <td style={{ padding: "12px 18px", fontWeight: 600 }}>
                            {formatMoney(slip.basePay + slip.earnings, slip.currency)}
                          </td>
                          <td style={{ padding: "12px 18px", color: "#DC2626", fontWeight: 600 }}>
                            -{formatMoney(slip.deductions, slip.currency)}
                          </td>
                          <td style={{ padding: "12px 18px", fontWeight: 700, color: "#16A34A" }}>
                            {formatMoney(slip.netPay, slip.currency)}
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <Badge variant={slip.deliveryStatus === "delivered" ? "success" : "neutral"}>
                              {slip.deliveryStatus.toUpperCase()}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-neutral btn-sm"
                              onClick={() => setStatementPayslip(slip)}
                            >
                              <Eye size={12} className="mr-4" /> View Statement
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  };

  // ==========================================================================
  // TAB 6: SETTINGS
  // ==========================================================================
  const renderSettings = () => {
    return (
      <div style={{ maxWidth: 840, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-1)" }}>
            Payroll Configuration &amp; Visibility
          </h3>
          <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: "3px 0 0 0" }}>
            Set your primary tax jurisdiction, disbursement currency, and employee portal permissions.
          </p>
        </div>

        {/* Employee Portal Visibility Card */}
        <Card>
          <CardBody style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>
                    Employee Profile Payslips Tab
                  </strong>
                  <Badge variant={settings.showPayslipsTabToEmployees ? "success" : "neutral"}>
                    {settings.showPayslipsTabToEmployees ? "VISIBLE TO ALL" : "HR ONLY"}
                  </Badge>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                  When enabled, employees can view their approved payslips directly on their personal profile page (<code>/people/me</code>). When hidden, only HR Managers can access payslips.
                </p>
              </div>

              <button
                type="button"
                className={settings.showPayslipsTabToEmployees ? "btn-neutral" : "btn-primary"}
                onClick={toggleEmployeePayslipsVisibility}
                style={{ flexShrink: 0 }}
              >
                {settings.showPayslipsTabToEmployees ? "Disable for Employees" : "Enable for Employees"}
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Jurisdiction & Currency Form */}
        <Card>
          <CardHeader title="Company Jurisdiction & Currency" />
          <CardBody style={{ padding: 20 }}>
            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                    Primary Country
                  </label>
                  <SearchableSelect
                    options={countrySelectOptions}
                    value={configCountry}
                    onChange={(code) => {
                      setConfigCountry(code);
                      if (COUNTRY_CURRENCIES[code]) {
                        setConfigCurrency(COUNTRY_CURRENCIES[code]);
                      }
                    }}
                    placeholder="Select primary country..."
                    searchPlaceholder="Search country name or code..."
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                    Disbursement Currency
                  </label>
                  <CurrencySelect
                    value={configCurrency}
                    onChange={(val) => setConfigCurrency(val)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                  Standard Monthly Hours
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  style={{ maxWidth: 280 }}
                  value={configHours}
                  onChange={(e) => setConfigHours(e.target.value)}
                  required
                />
                <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
                  Standard full-time hours (usually 173.33 hours = 40 hours/week × 52 weeks ÷ 12 months).
                </small>
              </div>

              {/* Overtime & Public Holiday Multipliers */}
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--card-border, #E8ECE8)", marginTop: 4 }}>
                <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-1)" }}>
                  Dynamic Overtime &amp; Public Holiday Multipliers
                </h4>
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 14px 0" }}>
                  Configure company policy multipliers for hourly and salaried overtime and public holiday work. These rates dynamically power the clock-in module and the pay engine.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                      Overtime Rate Multiplier (e.g. 1.5×)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="5.0"
                      className="input"
                      value={configOvertimeRate}
                      onChange={(e) => setConfigOvertimeRate(e.target.value)}
                      required
                    />
                    <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
                      Multiplier applied to standard hourly rate when working overtime (default: 1.5×).
                    </small>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                      Public Holiday &amp; Sunday Multiplier (e.g. 2.0×)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="5.0"
                      className="input"
                      value={configHolidayRate}
                      onChange={(e) => setConfigHolidayRate(e.target.value)}
                      required
                    />
                    <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
                      Multiplier applied for shifts on gazetted public holidays or Sunday rest days (default: 2.0×).
                    </small>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                    Standard Daily Threshold (Hours/Day)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    className="input"
                    style={{ maxWidth: 280 }}
                    value={configDailyHours}
                    onChange={(e) => setConfigDailyHours(e.target.value)}
                    required
                  />
                  <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
                    Daily working hours threshold after which overtime starts accumulating in the dashboard clock-in widget (standard: 8.0 hrs/day).
                  </small>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button type="submit" className="btn-primary" disabled={isSavingSettings}>
                  {isSavingSettings ? <Loader2 size={14} className="animate-spin mr-6" /> : <Save size={14} className="mr-6" />}
                  Save Payroll Settings
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle="Manage salaries, calculate deductions, and disburse company payroll on time."
        icon={<DollarSign size={24} />}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="btn-neutral"
              style={{ background: "white", color: "var(--primary)", borderColor: "transparent" }}
              onClick={() => setIsHelpModalOpen(true)}
            >
              <HelpCircle size={15} className="mr-4" /> Setup Guide &amp; Help
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ background: "white", color: "var(--primary)" }}
              onClick={() => {
                setActiveTab("Run Payroll");
                setWizardStep(0);
              }}
            >
              <DollarSign size={15} /> Run Payroll
            </button>
          </div>
        }
        tabs={TABS}
        activeTab={activeTab === "Compensation" ? "Salaries" : activeTab === "Rules" ? "Deductions & Rules" : activeTab}
        onTabChange={(tab) => handleNavigateTab(tab)}
      />

      <main style={{ padding: "0 24px 32px" }}>
        {isLoading ? (
          <div style={{ padding: 64, textAlign: "center", color: "var(--text-4)" }}>
            <Loader2 size={28} className="animate-spin mb-10 mx-auto" style={{ color: "var(--primary)" }} />
            <p style={{ fontSize: 13, margin: 0 }}>Connecting to payroll engine &amp; loading organization records...</p>
          </div>
        ) : (
          <>
            {(activeTab === "Overview" ||
              (!TABS.includes(activeTab) && activeTab !== "Compensation" && activeTab !== "Rules")) &&
              renderOverview()}
            {activeTab === "Run Payroll" && renderRunPayrollWizard()}
            {(activeTab === "Salaries" || activeTab === "Compensation") && renderSalaries()}
            {(activeTab === "Deductions & Rules" || activeTab === "Rules") && renderRules()}
            {activeTab === "Paystubs" && renderPaystubs()}
            {activeTab === "Settings" && renderSettings()}
          </>
        )}
      </main>

      {/* HELP MODAL */}
      <PayrollHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onNavigateTab={(tab) => handleNavigateTab(tab)}
        onOpenAssignSalary={() => {
          const missing = employeesMissingSalary[0];
          setSelectedCompEmployeeId(missing ? missing.id : employees[0]?.id || "");
          setIsCompModalOpen(true);
        }}
        onOpenAddDeduction={() => setIsTaxRuleModalOpen(true)}
        hasConfig={!!activeConfig}
        configuredCountry={currentCountry}
        configuredCurrency={currentCurrency}
        employeesWithComp={rosterWithComp.filter((e) => e.hasSalary).length}
        totalEmployees={employees.length}
        ruleCount={taxRules.filter((r) => r.active).length}
        periodCount={periods.length}
      />

      {/* COMPENSATION MODAL */}
      <CompensationModal
        isOpen={isCompModalOpen}
        onClose={() => setIsCompModalOpen(false)}
        employees={employees}
        currency={currentCurrency}
        country={currentCountry}
        defaultEmployeeId={selectedCompEmployeeId}
        overtimeMultiplier={activeOvertimeMultiplier}
        holidayMultiplier={activeHolidayMultiplier}
        onSave={handleSaveCompensation}
      />

      {/* TAX RULE MODAL */}
      <TaxRuleModal
        isOpen={isTaxRuleModalOpen}
        onClose={() => setIsTaxRuleModalOpen(false)}
        country={currentCountry}
        currency={currentCurrency}
        departments={departments}
        positions={positions}
        onSave={handleSaveTaxRule}
      />

      {/* PAYSTUB STATEMENT MODAL */}
      <PaystubStatementModal
        isOpen={!!statementPayslip}
        onClose={() => setStatementPayslip(null)}
        payslip={statementPayslip}
        currency={currentCurrency}
        overtimeMultiplier={activeOvertimeMultiplier}
        holidayMultiplier={activeHolidayMultiplier}
      />

      {/* ADJUST EMPLOYEE HOURS & RATES MODAL */}
      <Modal
        isOpen={!!editingAdjItem}
        onClose={() => setEditingAdjItem(null)}
        title="Adjust Hours & Higher Rates"
        subtitle={
          editingAdjItem
            ? `Configure productive hours, overtime (${activeOvertimeMultiplier}×), holiday rates (${activeHolidayMultiplier}×), and bonuses for ${editingAdjItem.employeeName}`
            : ""
        }
        width={540}
      >
        {editingAdjItem &&
          (() => {
            const comp = compensationList.find((c) => c.employeeId === editingAdjItem.employeeId);
            const parsed = parseCompensationDetails(comp);
            const pHours = parseFloat(formProductiveHours) || 0;
            const otHours = parseFloat(formOvertimeHours) || 0;
            const holHours = parseFloat(formHolidayHours) || 0;
            const bonMinor = toMinor(parseFloat(formBonuses) || 0);
            const penMinor = toMinor(parseFloat(formPenalties) || 0);
            const insMinor = toMinor(parseFloat(formInsurance) || 0);

            const contractedBaseMinor = comp && comp.baseAmountMinor > 0 ? comp.baseAmountMinor : editingAdjItem.basePay;
            const liveCalc = calculateChargeableGross({
              payRateMinor: parsed.hourlyRateMinor,
              isHourly: parsed.model === "hourly",
              monthlyBaseMinor: contractedBaseMinor,
              productiveHours: pHours,
              standardMonthlyHours: parsed.standardHours || (activeConfig ? activeConfig.standardMonthlyMinutes / 60 : (settings.standardMonthlyHours || 173.33)),
              overtimeHours: otHours,
              holidayHours: holHours,
              bonusesMinor: bonMinor,
              insuranceMinor: insMinor,
              penaltiesMinor: penMinor,
              overtimeMultiplier: activeOvertimeMultiplier,
              holidayMultiplier: activeHolidayMultiplier,
            });

            const activeRules = taxRules.filter((r) => r.active);
            const empObj = employees.find((e) => e.id === editingAdjItem.employeeId);
            const liveEst = activeRules.length > 0 ? estimatePay(liveCalc.chargeableGrossMinor, activeRules, empObj) : null;
            const livePaye = liveEst
              ? liveEst.deductions
              : currentCountry === "UG"
                ? calculateUgandaPAYE(liveCalc.chargeableGrossMinor)
                : Math.round(editingAdjItem.deductions * 0.8);
            const liveNssf = liveEst
              ? 0
              : currentCountry === "UG"
                ? calculateNSSF(liveCalc.chargeableGrossMinor)
                : Math.round(editingAdjItem.deductions * 0.2);
            const liveTotalDeductions = liveEst ? liveEst.deductions : livePaye + liveNssf;
            const liveNet = Math.max(0, liveCalc.chargeableGrossMinor - liveTotalDeductions);

            const empTimesheets = timesheets.filter(
              (t) => t.employeeId === editingAdjItem.employeeId || t.employee_id === editingAdjItem.employeeId
            );
            const totalTsMinutes = empTimesheets.reduce(
              (s, t) => s + (Number(t.totalMinutes || t.total_minutes) || 0),
              0
            );

            const handleSaveAdj = (e: React.FormEvent) => {
              e.preventDefault();
              setEmployeeAdjustments((prev) => ({
                ...prev,
                [editingAdjItem.employeeId]: {
                  productiveHours: pHours,
                  overtimeHours: otHours,
                  holidayHours: holHours,
                  bonusesMinor: bonMinor,
                  penaltiesMinor: penMinor,
                  insuranceMinor: insMinor,
                  isSyncedFromClockIn: prev[editingAdjItem.employeeId]?.isSyncedFromClockIn,
                },
              }));
              setEditingAdjItem(null);
              toast.success("Adjustment saved", `Updated hours and earnings for ${editingAdjItem.employeeName}.`);
            };

            return (
              <form onSubmit={handleSaveAdj} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#FAF9F7",
                    borderRadius: 8,
                    border: "1px solid var(--card-border, #E8ECE8)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-4)", display: "block" }}>Structure</span>
                    <strong style={{ fontSize: 13, color: "var(--text-1)" }}>
                      {parsed.model === "hourly"
                        ? `Hourly: ${formatMoney(parsed.hourlyRateMinor, currentCurrency)}/hr`
                        : "Monthly Salaried"}
                    </strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "var(--text-4)", display: "block" }}>Base Monthly Pay</span>
                    <strong style={{ fontSize: 13, color: "var(--text-1)" }}>
                      {formatMoney(liveCalc.baseMonthlyCompensationMinor, currentCurrency)}
                    </strong>
                  </div>
                </div>

                {totalTsMinutes > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "rgba(37, 99, 235, 0.06)",
                      borderRadius: 8,
                      border: "1px solid rgba(37, 99, 235, 0.16)",
                      fontSize: 11.5,
                      color: "var(--text-2)",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Clock size={13} style={{ color: "var(--primary)" }} />
                      <span><strong>Clock-in &amp; Timesheets:</strong> {(totalTsMinutes / 60).toFixed(1)} hrs recorded for this staff.</span>
                    </span>
                    <button
                      type="button"
                      className="btn-neutral btn-sm"
                      style={{ fontSize: 11, padding: "2px 8px", height: 26 }}
                      onClick={() => {
                        const tsHours = Math.round((totalTsMinutes / 60) * 10) / 10;
                        const std = parsed.standardHours || (activeConfig ? activeConfig.standardMonthlyMinutes / 60 : 173.33);
                        setFormProductiveHours(String(Math.min(tsHours, std)));
                        setFormOvertimeHours(String(Math.max(0, Math.round((tsHours - std) * 10) / 10)));
                      }}
                    >
                      Apply Clock-in Hours
                    </button>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 5 }}>
                      Productive Hours Worked
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input"
                      value={formProductiveHours}
                      onChange={(e) => setFormProductiveHours(e.target.value)}
                      required
                    />
                    <small style={{ fontSize: 11, color: "var(--text-4)" }}>Standard: 173.33 hrs</small>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 5 }}>
                      Overtime Hours ({activeOvertimeMultiplier}× rate)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input"
                      value={formOvertimeHours}
                      onChange={(e) => setFormOvertimeHours(e.target.value)}
                    />
                    <small style={{ fontSize: 11, color: "var(--text-4)" }}>
                      +{formatMoney(liveCalc.overtimeMinor, currentCurrency)}
                    </small>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 5 }}>
                      Public Holiday &amp; Sunday Hours ({activeHolidayMultiplier}×)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input"
                      value={formHolidayHours}
                      onChange={(e) => setFormHolidayHours(e.target.value)}
                    />
                    <small style={{ fontSize: 11, color: "var(--text-4)" }}>
                      +{formatMoney(liveCalc.holidayMinor, currentCurrency)}
                    </small>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 5 }}>
                      One-Time Bonuses ({currentCurrency})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input"
                      value={formBonuses}
                      onChange={(e) => setFormBonuses(e.target.value)}
                    />
                    <small style={{ fontSize: 11, color: "var(--text-4)" }}>Performance / attendance</small>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 5 }}>
                      Insurance &amp; Allowances ({currentCurrency})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input"
                      value={formInsurance}
                      onChange={(e) => setFormInsurance(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: 5 }}>
                      Penalties / Deductions ({currentCurrency})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input"
                      value={formPenalties}
                      onChange={(e) => setFormPenalties(e.target.value)}
                    />
                    <small style={{ fontSize: 11, color: "var(--text-4)" }}>Tardiness / absence</small>
                  </div>
                </div>

                {/* Live Chargeable Summary */}
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--primary-tint, #EFF6FF)",
                    borderRadius: 8,
                    border: "1px solid #BFDBFE",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>Chargeable Gross Total:</span>
                    <strong>{formatMoney(liveCalc.chargeableGrossMinor, currentCurrency)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#DC2626", marginBottom: 4 }}>
                    <span>Statutory Deductions (PAYE + NSSF):</span>
                    <strong>-{formatMoney(liveTotalDeductions, currentCurrency)}</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      borderTop: "1px solid #BFDBFE",
                      paddingTop: 4,
                      fontWeight: 700,
                      color: "#16A34A",
                    }}
                  >
                    <span>Calculated Net Pay:</span>
                    <span>{formatMoney(liveNet, currentCurrency)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn-neutral" onClick={() => setEditingAdjItem(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Adjustments
                  </button>
                </div>
              </form>
            );
          })()}
      </Modal>

      {/* RIGHT-SIDED CALCULATION FORMULA & RULES DRAWER */}
      {isFormulaDrawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setIsFormulaDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              height: "100%",
              background: "#FFFFFF",
              boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--card-border, #E8ECE8)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                background: "#FFFFFF",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--primary-tint, #EFF6FF)",
                      color: "var(--primary, #2563EB)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Calculator size={18} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--text-1)" }}>
                    Payroll Calculation Guide
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
                  Standard formulas for base compensation, higher rates, and statutory taxes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormulaDrawerOpen(false)}
                style={{
                  background: "#F3F4F6",
                  border: "none",
                  borderRadius: 6,
                  padding: 6,
                  cursor: "pointer",
                  color: "var(--text-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Close guide"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {/* Section 1: Salaried vs Hourly */}
              <div style={{ background: "#FAF9F7", border: "1px solid var(--card-border, #E8ECE8)", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Briefcase size={15} style={{ color: "var(--primary)" }} />
                  <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>1. Salaried vs. Hourly Pay Models</strong>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 8px 0" }}>
                    • <strong>Salaried Staff:</strong> Entitled to their contracted fixed monthly salary (e.g. <code>UGX 2,000,000 / month</code>) based on standard monthly business hours (e.g. 173.33 hrs). Day-to-day clock variance does not deduct base salary unless unpaid absence or penalties are applied.
                  </p>
                  <p style={{ margin: 0 }}>
                    • <strong>Hourly Staff:</strong> Compensation is calculated directly from verified productive hours worked:
                    <br />
                    <code style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "4px 8px", borderRadius: 4, fontSize: 12, display: "inline-block", marginTop: 4, color: "var(--text-1)" }}>
                      Monthly Base = Pay Rate × Productive Hours Worked
                    </code>
                  </p>
                </div>
              </div>

              {/* Section 2: Chargeable Income Gross Total */}
              <div style={{ background: "#FAF9F7", border: "1px solid var(--card-border, #E8ECE8)", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Layers size={15} style={{ color: "var(--primary)" }} />
                  <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>2. Chargeable Gross Formula</strong>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 8px 0" }}>
                    Total chargeable gross combines base pay with all overtime additions, rest-day multipliers, bonuses, and allowances minus any penalties:
                  </p>
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6, padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.5 }}>
                    Chargeable Gross = [Base Compensation] + [Higher Rates (OT/Hol)] + [Bonuses] + [Insurance] - [Penalties]
                  </div>
                </div>
              </div>

              {/* Section 3: Higher Rates Multipliers */}
              <div style={{ background: "#FAF9F7", border: "1px solid var(--card-border, #E8ECE8)", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Clock size={15} style={{ color: "var(--primary)" }} />
                  <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>3. Higher Rates (Overtime &amp; Rest Days)</strong>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 6px 0" }}>
                    • <strong>Overtime Hours:</strong> Multiplied by {activeOvertimeMultiplier}× regular hourly rate:
                    <br />
                    <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Overtime Pay = Overtime Hours × Hourly Rate × {activeOvertimeMultiplier}</span>
                  </p>
                  <p style={{ margin: 0 }}>
                    • <strong>Public Holidays &amp; Sundays:</strong> Multiplied by {activeHolidayMultiplier}× regular hourly rate:
                    <br />
                    <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Holiday Pay = Holiday Hours × Hourly Rate × {activeHolidayMultiplier}</span>
                  </p>
                </div>
              </div>

              {/* Section 4: Statutory Deductions */}
              <div style={{ background: "#FAF9F7", border: "1px solid var(--card-border, #E8ECE8)", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Percent size={15} style={{ color: "#DC2626" }} />
                  <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>4. Statutory Deductions (Uganda)</strong>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>PAYE (Pay As You Earn) Progressive Tax Bands:</strong>
                  </p>
                  <ul style={{ margin: "0 0 10px 0", paddingLeft: 18, color: "var(--text-3)" }}>
                    <li>0 – 235,000 UGX: Nil (0%)</li>
                    <li>235,001 – 335,000 UGX: 10%</li>
                    <li>335,001 – 410,000 UGX: 20%</li>
                    <li>410,001 – 10,000,000 UGX: 30%</li>
                    <li>Exceeding 10,000,000 UGX: Additional 10% on excess (40% marginal rate)</li>
                  </ul>
                  <p style={{ margin: 0 }}>
                    <strong>NSSF (National Social Security Fund):</strong>
                    <br />
                    • <strong>5% Employee Contribution</strong> (deducted directly from gross)
                    <br />
                    • <strong>10% Employer Contribution</strong> (remitted by company)
                  </p>
                </div>
              </div>

              {/* Section 5: Net Disbursed Pay */}
              <div style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <CheckCircle2 size={15} style={{ color: "#16A34A" }} />
                  <strong style={{ fontSize: 13.5, color: "#166534" }}>5. Net Disbursed Pay</strong>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "#166534", fontWeight: 600 }}>
                  Net Pay = Total Chargeable Gross - Statutory Deductions (PAYE + NSSF)
                </p>
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--card-border, #E8ECE8)",
                background: "#FAF9F7",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsFormulaDrawerOpen(false)}
                style={{ width: "100%" }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
