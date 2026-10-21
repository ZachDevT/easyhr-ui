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
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { toast } from "@/components/ui/Toast";
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
} from "@/components/payroll/payrollModel";

import { PayrollWalkthroughWidget } from "@/components/payroll/PayrollWalkthroughWidget";
import { PayrollHelpModal } from "@/components/payroll/PayrollHelpModal";
import { CompensationModal } from "@/components/payroll/CompensationModal";
import { TaxRuleModal } from "@/components/payroll/TaxRuleModal";
import { PaystubStatementModal } from "@/components/payroll/PaystubStatementModal";

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
  const [statementPayslip, setStatementPayslip] = useState<PayrollPayslip | PayrollRunItem | null>(null);

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
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/tax-rules`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/periods`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/runs`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/compensation`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees?limit=200`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/departments`, { headers }),
      ]);

      if (configsRes.ok) {
        const cData = await configsRes.json();
        const confs: PayrollConfig[] = Array.isArray(cData) ? cData : [];
        setConfigurations(confs);
        if (confs[0]) {
          setConfigCountry(confs[0].country);
          setConfigCurrency(confs[0].currency);
          setConfigHours(String((confs[0].standardMonthlyMinutes / 60).toFixed(2)));
        }
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

      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          country: configCountry.toUpperCase(),
          currency: configCurrency.toUpperCase(),
          standardMonthlyMinutes: minutes,
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
      });

      toast.success("Settings saved", `Payroll set to ${configCountry} (${configCurrency}).`);
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
      await fetchPayrollData(true);
      setWizardStep(2); // Go to review
      toast.success("Payroll calculated", "Calculated earnings and statutory deductions for all eligible staff.");
    } catch (err: any) {
      toast.error("Calculation failed", err?.message);
    } finally {
      setIsProcessingRun(false);
    }
  };

  // Lock & Finalize Run
  const handleLockRun = async () => {
    if (!activeRun) return;
    setIsProcessingRun(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/payroll/runs/${activeRun.id}/lock`, {
        method: "POST",
        headers: getAuthHeaders(token),
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
          onNavigateTab={setActiveTab}
          hasConfig={!!activeConfig}
          employeesWithComp={rosterWithComp.filter((e) => e.hasSalary).length}
          totalEmployees={employees.length}
          hasRules={taxRules.filter((r) => r.active).length > 0}
        />

        {/* Missing Salary Notice */}
        {employeesMissingSalary.length > 0 && (
          <div
            style={{
              padding: "12px 18px",
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
              <AlertTriangle size={20} style={{ color: "#D97706", flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 13, color: "var(--text-1)" }}>
                  Compensation setup needed:{" "}
                </strong>
                <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                  {employeesMissingSalary.length} active employee(s) do not have a monthly base salary recorded. Add their salary so they are included in payroll calculations.
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-neutral btn-sm"
              onClick={() => setActiveTab("Salaries")}
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

        {/* STEP 2: Review Calculated Run Items */}
        {wizardStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <CardHeader
                title="Step 3: Review Calculated Payroll & Approve"
                action={
                  activeRun && (
                    <button
                      type="button"
                      className="btn-neutral btn-sm"
                      style={{ color: "#DC2626" }}
                      onClick={() => handleDiscardRun(activeRun.id)}
                    >
                      <Trash2 size={12} className="mr-4" /> Discard &amp; Recompute
                    </button>
                  )
                }
              />
              <CardBody style={{ padding: 0 }}>
                {/* Aggregate Summary Ribbon */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    padding: "16px 20px",
                    background: "#FAF9F7",
                    borderBottom: "1px solid var(--card-border)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Total Gross</span>
                    <strong style={{ fontSize: 15, color: "var(--text-1)" }}>
                      {formatMoney(runItems.reduce((s, i) => s + i.basePay + i.earnings, 0), currentCurrency)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Total Deductions</span>
                    <strong style={{ fontSize: 15, color: "#DC2626" }}>
                      -{formatMoney(runItems.reduce((s, i) => s + i.deductions, 0), currentCurrency)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Net Take-Home Pay</span>
                    <strong style={{ fontSize: 16, color: "#16A34A" }}>
                      {formatMoney(runItems.reduce((s, i) => s + i.netPay, 0), currentCurrency)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11.5, color: "var(--text-4)", display: "block" }}>Employees Count</span>
                    <strong style={{ fontSize: 15, color: "var(--text-1)" }}>{runItems.length} Staff</strong>
                  </div>
                </div>

                {/* Run Items Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: "#FFFFFF", borderBottom: "1px solid var(--card-border)", color: "var(--text-4)" }}>
                        <th style={{ padding: "12px 18px" }}>Employee</th>
                        <th style={{ padding: "12px 18px" }}>Department</th>
                        <th style={{ padding: "12px 18px" }}>Base Salary</th>
                        <th style={{ padding: "12px 18px" }}>Deductions</th>
                        <th style={{ padding: "12px 18px" }}>Net Pay</th>
                        <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <td style={{ padding: "12px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={item.employeeName} size="sm" src={item.avatarUrl} />
                              <strong style={{ color: "var(--text-1)" }}>{item.employeeName}</strong>
                            </div>
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--text-3)" }}>
                            {item.department || "General"}
                          </td>
                          <td style={{ padding: "12px 18px", fontWeight: 600 }}>
                            {formatMoney(item.basePay, currentCurrency)}
                          </td>
                          <td style={{ padding: "12px 18px", color: "#DC2626", fontWeight: 600 }}>
                            -{formatMoney(item.deductions, currentCurrency)}
                          </td>
                          <td style={{ padding: "12px 18px", color: "#16A34A", fontWeight: 700 }}>
                            {formatMoney(item.netPay, currentCurrency)}
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-neutral btn-sm"
                              onClick={() => setStatementPayslip({ ...item, currency: currentCurrency })}
                            >
                              <Eye size={12} className="mr-4" /> Preview
                            </button>
                          </td>
                        </tr>
                      ))}
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
                    onClick={handleLockRun}
                    style={{ padding: "10px 22px", fontSize: 13.5 }}
                  >
                    {isProcessingRun ? <Loader2 size={15} className="animate-spin mr-6" /> : <ShieldCheck size={16} className="mr-6" />}
                    Approve &amp; Lock Payroll Run
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

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
              Every active staff member must have an effective monthly salary to be included in payroll cycles.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setSelectedCompEmployeeId(employees[0]?.id || "");
              setIsCompModalOpen(true);
            }}
          >
            <Plus size={14} className="mr-6" /> Set Employee Salary
          </button>
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

          <select
            className="select"
            style={{ width: 180, fontSize: 12.5 }}
            value={salaryDeptFilter}
            onChange={(e) => setSalaryDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
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
                    <th style={{ padding: "12px 18px" }}>Monthly Salary</th>
                    <th style={{ padding: "12px 18px" }}>Effective Date</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "36px 18px", textAlign: "center", color: "var(--text-4)" }}>
                        No employees match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((emp) => (
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
                    ))
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
                      <td colSpan={6} style={{ padding: "36px 18px", textAlign: "center", color: "var(--text-4)" }}>
                        No deduction rules configured. Click <strong>Add Deduction Rule</strong> or choose a 1-click template to add statutory rules.
                      </td>
                    </tr>
                  ) : (
                    taxRules.map((rule) => (
                      <tr key={rule.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        <td style={{ padding: "12px 18px" }}>
                          <strong style={{ color: "var(--text-1)" }}>{rule.ruleName}</strong>
                          <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>
                            Country: {rule.country} · {rule.currency}
                          </div>
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <Badge variant="neutral">
                            {rule.ruleType === "progressive_tax" ? "PROGRESSIVE TAX" : "FLAT DEDUCTION"}
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
                    ))
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
            <select
              className="select"
              style={{ width: 220, fontSize: 12.5 }}
              value={selectedRunIdForPayslips}
              onChange={(e) => setSelectedRunIdForPayslips(e.target.value)}
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {monthLabel(r.periodStart)} ({r.status.toUpperCase()})
                </option>
              ))}
            </select>
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
                  <select
                    className="select"
                    value={configCountry}
                    onChange={(e) => {
                      const code = e.target.value;
                      setConfigCountry(code);
                      if (COUNTRY_CURRENCIES[code]) {
                        setConfigCurrency(COUNTRY_CURRENCIES[code]);
                      }
                    }}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code}) · {c.currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                    Disbursement Currency (3 Letters)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    className="input"
                    value={configCurrency}
                    onChange={(e) => setConfigCurrency(e.target.value.toUpperCase())}
                    required
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main style={{ padding: "0 24px 32px" }}>
        {isLoading ? (
          <div style={{ padding: 64, textAlign: "center", color: "var(--text-4)" }}>
            <Loader2 size={28} className="animate-spin mb-10 mx-auto" style={{ color: "var(--primary)" }} />
            <p style={{ fontSize: 13, margin: 0 }}>Connecting to payroll engine &amp; loading organization records...</p>
          </div>
        ) : (
          <>
            {activeTab === "Overview" && renderOverview()}
            {activeTab === "Run Payroll" && renderRunPayrollWizard()}
            {activeTab === "Salaries" && renderSalaries()}
            {activeTab === "Deductions & Rules" && renderRules()}
            {activeTab === "Paystubs" && renderPaystubs()}
            {activeTab === "Settings" && renderSettings()}
          </>
        )}
      </main>

      {/* HELP MODAL */}
      <PayrollHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab === "Run Payroll") setWizardStep(0);
        }}
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
      />
    </>
  );
}
