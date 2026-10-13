"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "@/components/ui/Toast";
import {
  Palmtree,
  CalendarHeart,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Send,
  Sliders,
  Users,
  Calendar,
  Hourglass,
  Layers,
  ArrowRight,
  TrendingUp,
  Info,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface LeaveType {
  id: string;
  code: string;
  name: string;
  unit: "minutes" | "days";
  isPaid: boolean;
  requiresApproval: boolean;
  status: string;
}

interface LeavePolicy {
  id: string;
  leaveTypeId: string;
  leaveTypeCode?: string;
  leaveTypeName?: string;
  name: string;
  description?: string;
  accrualFrequency: string;
  accrualMinutes: number;
  accrualHours?: number;
  maxCarryoverMinutes?: number;
  assignedEmployees?: number;
  status: string;
}

interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  unit: string;
  availableMinutes: number;
  reservedMinutes: number;
  usedMinutes: number;
  availableHours: number;
  usedHours: number;
  accrualFrequency: string;
  accrualHours: number;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  employeeName?: string;
  startDate: string;
  endDate: string;
  requestedMinutes: number;
  status: "pending_manager" | "pending_hr" | "approved" | "rejected" | "cancelled";
  reason?: string;
  createdAt: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle?: string;
}

// ─── Today's date helper ─────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <Badge variant="success">Approved</Badge>;
    case "pending_manager":
      return <Badge variant="warning">Pending Manager</Badge>;
    case "pending_hr":
      return <Badge variant="primary">Pending HR</Badge>;
    case "rejected":
      return <Badge variant="danger">Declined</Badge>;
    case "cancelled":
      return <Badge variant="neutral">Cancelled</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "var(--primary-tint)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-1)",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                margin: "3px 0 0 0",
                fontSize: 12,
                color: "var(--text-4)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div
      style={{
        padding: "52px 24px",
        textAlign: "center",
        color: "var(--text-4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ opacity: 0.3 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13, maxWidth: 360 }}>{message}</p>
    </div>
  );
}

// ─── Data table ───────────────────────────────────────────────────────────────

function DataTable({
  headers,
  children,
  empty,
  isEmpty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty: React.ReactNode;
  isEmpty: boolean;
}) {
  if (isEmpty) return <>{empty}</>;
  return (
    <div style={{ overflowX: "auto", marginTop: 4 }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          fontSize: 13,
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--page-bg, #F7F7F5)",
              borderBottom: "1px solid var(--card-border)",
            }}
          >
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 16px",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-4)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TimeOffPage() {
  const { getToken, isSignedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<"my_leave" | "hr_management">("my_leave");
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info" | "success";
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    variant: "warning",
    confirmLabel: "Confirm",
    onConfirm: () => {},
  });

  const openConfirm = (opts: {
    title: string;
    message: string;
    variant?: "danger" | "warning" | "info" | "success";
    confirmLabel?: string;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      open: true,
      title: opts.title,
      message: opts.message,
      variant: opts.variant || "warning",
      confirmLabel: opts.confirmLabel || "Confirm",
      onConfirm: opts.onConfirm,
    });
  };

  // Form state — Request
  const [requestForm, setRequestForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    hours: 8,
    reason: "",
  });

  // Form state — Leave Type
  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    unit: "minutes" as "minutes" | "days",
    isPaid: true,
    requiresApproval: true,
  });

  // Form state — Policy (aligned to backend CreatePolicyInput)
  const [policyForm, setPolicyForm] = useState({
    leaveTypeId: "",
    name: "",
    accrualFrequency: "monthly" as "none" | "monthly" | "annual" | "weekly",
    accrualHours: 14,
    carryoverLimitHours: 40,
    allowsNegativeBalance: false,
    effectiveFrom: todayISO(),
  });

  // Form state — Adjustment
  const [adjustForm, setAdjustForm] = useState({
    employeeId: "",
    leaveTypeId: "",
    hours: 0,
    reason: "",
  });

  const showNotice = (type: "success" | "error", message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 6000);
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // ─── Auth header helper ───────────────────────────────────────────────────

  const authHeaders = useCallback(
    async () => ({
      Authorization: `Bearer ${await getToken()}`,
      "Content-Type": "application/json",
    }),
    [getToken]
  );

  // ─── Fetch all data (High Performance Single-Roundtrip & Parallel) ─────────

  const loadData = useCallback(async (silent = false) => {
    if (!isSignedIn) return;
    if (!silent) setIsLoading(true);
    try {
      const headers = await authHeaders();

      // 1. Fast Single Aggregated Endpoint: /api/v1/leave/overview
      let overviewSucceeded = false;
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/leave/overview`, { headers });
        if (res.ok) {
          const overview = await res.json();
          overviewSucceeded = true;

          if (overview.currentEmployee?.id) {
            setCurrentEmployeeId(overview.currentEmployee.id);
          }

          if (overview.leaveTypes) {
            setLeaveTypes(overview.leaveTypes);
            if (overview.leaveTypes.length > 0) {
              setRequestForm((p) => (p.leaveTypeId ? p : { ...p, leaveTypeId: overview.leaveTypes[0].id }));
            }
          }

          if (overview.policies) {
            const raw: LeavePolicy[] = overview.policies;
            setPolicies(
              raw.map((p) => ({ ...p, accrualHours: p.accrualMinutes ? p.accrualMinutes / 60 : 0 }))
            );
          }

          if (overview.balances) {
            setBalances(overview.balances);
          }

          if (overview.requests) {
            const items: LeaveRequest[] = overview.requests;
            setAllRequests(items);
            const myEmpId = overview.currentEmployee?.id || currentEmployeeId;
            setMyRequests(myEmpId ? items.filter((x) => x.employeeId === myEmpId) : items);
          }
        }
      } catch (err) {
        console.warn("Overview endpoint fallback", err);
      }

      // 2. Fallback to concurrent Promise.allSettled if overview wasn't available
      if (!overviewSucceeded) {
        let empId = currentEmployeeId;
        const [empRes, typesRes, policiesRes, reqsRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/v1/employees/me`, { headers }),
          fetch(`${API_BASE_URL}/api/v1/leave/types`, { headers }),
          fetch(`${API_BASE_URL}/api/v1/leave/policies`, { headers }),
          fetch(`${API_BASE_URL}/api/v1/leave/requests?limit=100`, { headers }),
        ]);

        if (empRes.status === "fulfilled" && empRes.value.ok) {
          const d = await empRes.value.json();
          empId = d.id;
          setCurrentEmployeeId(d.id);
        }

        if (typesRes.status === "fulfilled" && typesRes.value.ok) {
          const types: LeaveType[] = await typesRes.value.json();
          setLeaveTypes(types);
          if (types.length > 0) {
            setRequestForm((p) => (p.leaveTypeId ? p : { ...p, leaveTypeId: types[0].id }));
          }
        }

        if (policiesRes.status === "fulfilled" && policiesRes.value.ok) {
          const data = await policiesRes.value.json();
          const raw: LeavePolicy[] = Array.isArray(data) ? data : data.data || [];
          setPolicies(
            raw.map((p) => ({ ...p, accrualHours: p.accrualMinutes ? p.accrualMinutes / 60 : 0 }))
          );
        }

        if (reqsRes.status === "fulfilled" && reqsRes.value.ok) {
          const d = await reqsRes.value.json();
          const items: LeaveRequest[] = d.data || [];
          setAllRequests(items);
          setMyRequests(empId ? items.filter((x) => x.employeeId === empId) : items);
        }

        if (empId) {
          try {
            const balRes = await fetch(
              `${API_BASE_URL}/api/v1/leave/balances?employeeId=${empId}`,
              { headers }
            );
            if (balRes.ok) {
              const d = await balRes.json();
              setBalances(d.data || []);
            }
          } catch {}
        }
      }

      // 3. Lazy background prefetch for employee directory (does NOT block initial render!)
      fetch(`${API_BASE_URL}/api/v1/employees?limit=100`, { headers })
        .then((r) => r.json())
        .then((d) => setAllEmployees(d.data || d || []))
        .catch(() => {});
    } catch (err: any) {
      showNotice("error", "Failed to load leave data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, authHeaders]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // ─── Submit leave request ─────────────────────────────────────────────────

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployeeId) {
      showNotice("error", "No active employee profile linked to your account.");
      return;
    }
    if (!requestForm.leaveTypeId || !requestForm.startDate || !requestForm.endDate) {
      showNotice("error", "Please fill in all required fields.");
      return;
    }
    try {
      setActionLoading(true);
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE_URL}/api/v1/leave/requests`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          employeeId: currentEmployeeId,
          leaveTypeId: requestForm.leaveTypeId,
          startDate: requestForm.startDate,
          endDate: requestForm.endDate,
          requestedMinutes: Math.round(requestForm.hours * 60),
          reason: requestForm.reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || "Failed to submit request");
      }

      showNotice("success", "Time-off request submitted successfully!");
      setIsRequestModalOpen(false);
      setRequestForm({ leaveTypeId: leaveTypes[0]?.id || "", startDate: "", endDate: "", hours: 8, reason: "" });
      await loadData();
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Create or Edit leave type ───────────────────────────────────────────

  const handleCreateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      showNotice("error", "Display name is required.");
      return;
    }
    try {
      setActionLoading(true);
      const headers = await authHeaders();

      let code = typeForm.code.trim().toLowerCase().replace(/[\s-]/g, "_");
      if (!code) {
        code = typeForm.name.trim().toLowerCase().replace(/[\s-]/g, "_").replace(/[^a-z0-9_]/g, "");
      }
      if (!code) code = "custom_leave";
      if (!/^[a-z]/.test(code)) code = "lt_" + code;
      if (code.length < 2) code = code + "_leave";

      const url = editingLeaveType
        ? `${API_BASE_URL}/api/v1/leave/types/${editingLeaveType.id}`
        : `${API_BASE_URL}/api/v1/leave/types`;
      const method = editingLeaveType ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          code,
          name: typeForm.name.trim(),
          unit: typeForm.unit,
          isPaid: typeForm.isPaid,
          requiresApproval: typeForm.requiresApproval,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.title || "Failed to save leave type");
      }

      showNotice(
        "success",
        editingLeaveType
          ? `Leave type "${typeForm.name}" updated successfully.`
          : `Leave type "${typeForm.name}" saved successfully.`
      );
      setIsTypeModalOpen(false);
      setEditingLeaveType(null);
      setTypeForm({ code: "", name: "", unit: "minutes", isPaid: true, requiresApproval: true });
      await loadData();
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Create policy ────────────────────────────────────────────────────────

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.leaveTypeId) {
      showNotice("error", "Please select a leave type.");
      return;
    }
    if (!policyForm.name.trim()) {
      showNotice("error", "Policy name is required.");
      return;
    }
    if (!policyForm.effectiveFrom) {
      showNotice("error", "Effective from date is required.");
      return;
    }

    try {
      setActionLoading(true);
      const headers = await authHeaders();

      const carryoverMinutes = Math.round(policyForm.carryoverLimitHours * 60);
      const body = {
        leaveTypeId: policyForm.leaveTypeId,
        name: policyForm.name.trim(),
        accrualFrequency: policyForm.accrualFrequency,
        accrualMinutes:
          policyForm.accrualFrequency === "none" ? 0 : Math.round(policyForm.accrualHours * 60),
        carryoverLimitMinutes: carryoverMinutes,
        allowsNegativeBalance: policyForm.allowsNegativeBalance,
        effectiveFrom: policyForm.effectiveFrom,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/leave/policies`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.title || JSON.stringify(err));
      }

      showNotice("success", `Policy "${policyForm.name}" created successfully.`);
      setIsPolicyModalOpen(false);
      setPolicyForm({
        leaveTypeId: "",
        name: "",
        accrualFrequency: "monthly",
        accrualHours: 14,
        carryoverLimitHours: 40,
        allowsNegativeBalance: false,
        effectiveFrom: todayISO(),
      });
      await loadData();
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Assign to all ────────────────────────────────────────────────────────

  const handleAssignToAll = (policyId: string, policyName: string) => {
    openConfirm({
      title: `Assign "${policyName}" to all employees?`,
      message:
        "This will enroll all active employees into this policy and credit their starting leave balances. This action cannot be undone.",
      variant: "info",
      confirmLabel: "Yes, Assign All",
      onConfirm: async () => {
        try {
          setConfirmDialog((p) => ({ ...p, open: false }));
          setActionLoading(true);
          const headers = await authHeaders();
          const res = await fetch(
            `${API_BASE_URL}/api/v1/leave/policies/${policyId}/assign-all`,
            { method: "POST", headers }
          );

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to assign policy");
          }

          showNotice("success", "Policy successfully assigned to all active employees!");
          await loadData();
        } catch (err: any) {
          showNotice("error", err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // ─── Run accrual ──────────────────────────────────────────────────────────

  const handleRunAccrual = () => {
    openConfirm({
      title: "Run Monthly Accrual?",
      message:
        "This will calculate and credit monthly leave hours (e.g. 14h PTO) to all eligible employees based on their active policies. Only run this once per month.",
      variant: "success",
      confirmLabel: "Run Accrual Now",
      onConfirm: async () => {
        try {
          setConfirmDialog((p) => ({ ...p, open: false }));
          setActionLoading(true);
          const headers = await authHeaders();
          const res = await fetch(`${API_BASE_URL}/api/v1/leave/run-accrual`, {
            method: "POST",
            headers,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Accrual failed");
          }

          const data = await res.json();
          showNotice(
            "success",
            `Monthly accrual completed! ${data.creditsApplied ?? "All"} balance credits applied.`
          );
          await loadData();
        } catch (err: any) {
          showNotice("error", err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // ─── Manual adjustment ────────────────────────────────────────────────────

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.employeeId || !adjustForm.leaveTypeId) {
      showNotice("error", "Please select both an employee and a leave type.");
      return;
    }
    try {
      setActionLoading(true);
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE_URL}/api/v1/leave/adjustments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          employeeId: adjustForm.employeeId,
          leaveTypeId: adjustForm.leaveTypeId,
          amountMinutes: Math.round(adjustForm.hours * 60),
          reason: adjustForm.reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Adjustment failed");
      }

      showNotice(
        "success",
        `${adjustForm.hours > 0 ? "+" : ""}${adjustForm.hours}h leave adjustment applied.`
      );
      setIsAdjustModalOpen(false);
      setAdjustForm({ employeeId: "", leaveTypeId: "", hours: 0, reason: "" });
      await loadData();
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Approve ─────────────────────────────────────────────────────────────

  const handleApprove = async (requestId: string, isHR: boolean) => {
    try {
      setActionLoading(true);
      const headers = await authHeaders();
      const endpoint = isHR
        ? `${API_BASE_URL}/api/v1/leave/requests/${requestId}/approve-hr`
        : `${API_BASE_URL}/api/v1/leave/requests/${requestId}/approve`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ comment: "Approved by administrator" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Approval failed");
      }

      showNotice("success", "Leave request approved.");
      await loadData();
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = allRequests.filter((r) => r.status.startsWith("pending"));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--page-bg, #F7F7F5)",
      }}
    >
      <PageHeader
        title="Leave & Time Off"
        subtitle="Manage leave types, policies, monthly accruals, and employee time-off requests."
        icon={<Palmtree size={26} style={{ color: "var(--primary)" }} />}
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => loadData()}
              className="btn-neutral"
              disabled={isLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {isLoading ? (
                <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
              ) : (
                <RefreshCw size={14} />
              )}
              Refresh
            </button>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={15} />
              Request Leave
            </button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
        {/* Notice */}
        {notice && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: 12,
              marginBottom: 24,
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background:
                notice.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: notice.type === "success" ? "#065F46" : "#991B1B",
              border: `1px solid ${notice.type === "success" ? "#A7F3D0" : "#FECACA"}`,
            }}
          >
            {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notice.message}</span>
            <button
              onClick={() => setNotice(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                opacity: 0.6,
              }}
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1.5px solid var(--card-border)",
            gap: 0,
            marginBottom: 28,
          }}
        >
          {(
            [
              { key: "my_leave", label: "My Balances & Requests", icon: <CalendarHeart size={15} /> },
              {
                key: "hr_management",
                label: "HR Management & Policies",
                icon: <Sliders size={15} />,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "11px 20px",
                fontSize: 13.5,
                fontWeight: 600,
                background: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "2.5px solid var(--primary)"
                    : "2.5px solid transparent",
                color: activeTab === tab.key ? "var(--primary)" : "var(--text-3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: -1.5,
                transition: "all 0.15s ease",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.key === "hr_management" && pendingRequests.length > 0 && (
                <span
                  style={{
                    background: "#EF4444",
                    color: "#fff",
                    borderRadius: 20,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: "18px",
                  }}
                >
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Skeleton loader */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer-box" style={{ height: 140, borderRadius: 16 }} />
              ))}
            </div>
            <div className="shimmer-box" style={{ height: 280, borderRadius: 16 }} />
          </div>
        )}

        {/* ─── TAB 1: My Leave ───────────────────────────────────────────── */}

        {!isLoading && activeTab === "my_leave" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Balance cards */}
            <section>
              <SectionHeader
                icon={<Hourglass size={18} />}
                title="Your Leave Balances"
                subtitle="Available hours across all assigned leave types"
              />

              {balances.length === 0 ? (
                <Card>
                  <CardBody>
                    <EmptyState
                      icon={<Palmtree size={40} />}
                      message="No leave balances assigned yet. Contact HR to get a policy assigned to your account."
                    />
                  </CardBody>
                </Card>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 18,
                  }}
                >
                  {balances.map((b) => {
                    const total = (b.availableHours || 0) + (b.usedHours || 0);
                    const pct = total > 0 ? Math.min(100, Math.round((b.availableHours / total) * 100)) : 100;
                    const barColor =
                      pct > 60 ? "#10B981" : pct > 30 ? "#F59E0B" : "#EF4444";
                    return (
                      <Card key={b.id || b.leaveTypeId}>
                        <CardBody style={{ padding: 22 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: 16,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.07em",
                                color: "var(--primary)",
                                background: "var(--primary-tint)",
                                padding: "3px 9px",
                                borderRadius: 6,
                              }}
                            >
                              {b.leaveTypeCode || "LEAVE"}
                            </span>
                            {b.accrualFrequency && b.accrualFrequency !== "none" && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#059669",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <TrendingUp size={11} />
                                +{b.accrualHours}h/{b.accrualFrequency.slice(0, 2)}
                              </span>
                            )}
                          </div>

                          <h4
                            style={{
                              margin: "0 0 8px 0",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--text-1)",
                            }}
                          >
                            {b.leaveTypeName}
                          </h4>

                          <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 4 }}>
                            <span
                              style={{
                                fontSize: 34,
                                fontWeight: 800,
                                color: "var(--text-1)",
                                lineHeight: 1,
                              }}
                            >
                              {b.availableHours ?? 0}
                            </span>
                            <span style={{ fontSize: 14, color: "var(--text-4)", fontWeight: 600 }}>
                              hrs
                            </span>
                          </div>
                          <p style={{ margin: "0 0 14px 0", fontSize: 11, color: "var(--text-4)" }}>
                            {b.usedHours ?? 0}h used of {total}h total
                          </p>

                          <div
                            style={{
                              height: 6,
                              background: "var(--card-border)",
                              borderRadius: 99,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: barColor,
                                borderRadius: 99,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginTop: 5,
                              fontSize: 10,
                              color: "var(--text-4)",
                            }}
                          >
                            <span>Remaining</span>
                            <span style={{ fontWeight: 700, color: barColor }}>{pct}%</span>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* My request history */}
            <section>
              <Card>
                <CardBody style={{ padding: 28 }}>
                  <SectionHeader
                    icon={<Calendar size={18} />}
                    title="My Leave Requests"
                    subtitle="History of your time-off submissions and approval status"
                    action={
                      <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="btn-neutral"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          color: "var(--primary)",
                          borderColor: "var(--primary)",
                        }}
                      >
                        <Plus size={14} />
                        New Request
                      </button>
                    }
                  />

                  <DataTable
                    headers={["Leave Type", "Period", "Hours", "Reason", "Status", "Applied On"]}
                    isEmpty={myRequests.length === 0}
                    empty={
                      <EmptyState
                        icon={<Palmtree size={40} />}
                        message='No leave requests yet. Click "New Request" or the "Request Leave" button above to apply.'
                      />
                    }
                  >
                    {myRequests.map((req) => (
                      <tr
                        key={req.id}
                        style={{
                          borderBottom: "1px solid var(--card-border)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "var(--page-bg, #F7F7F5)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-1)" }}>
                          {req.leaveTypeName || "Leave"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 12,
                              color: "var(--text-3)",
                            }}
                          >
                            <CalendarDays size={12} style={{ color: "var(--text-4)" }} />
                            {req.startDate} <ArrowRight size={10} /> {req.endDate}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                          {Math.round(req.requestedMinutes / 60)}h
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "var(--text-4)",
                            maxWidth: 200,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {req.reason || "—"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <StatusBadge status={req.status} />
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-4)" }}>
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                </CardBody>
              </Card>
            </section>
          </div>
        )}

        {/* ─── TAB 2: HR Management ──────────────────────────────────────── */}

        {!isLoading && activeTab === "hr_management" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Action banner */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "22px 28px",
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(168,85,247,0.07) 100%)",
                border: "1.5px solid rgba(99,102,241,0.18)",
                borderRadius: 16,
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                  HR Policy & Accrual Engine
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>
                  Configure leave categories, set monthly accrual rates, and manage employee balances.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={handleRunAccrual}
                  disabled={actionLoading}
                  className="btn-neutral"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#059669",
                    borderColor: "#059669",
                  }}
                >
                  <TrendingUp size={14} />
                  Run Monthly Accrual
                </button>
                <button
                  onClick={() => setIsAdjustModalOpen(true)}
                  className="btn-neutral"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
                >
                  <Sliders size={14} />
                  Adjust Balance
                </button>
                <button
                  onClick={() => {
                    setEditingLeaveType(null);
                    setTypeForm({ code: "", name: "", unit: "minutes", isPaid: true, requiresApproval: true });
                    setIsTypeModalOpen(true);
                  }}
                  className="btn-neutral"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "var(--primary)",
                    borderColor: "var(--primary)",
                  }}
                >
                  <Plus size={14} />
                  New Leave Type
                </button>
                <button
                  onClick={() => {
                    setPolicyForm((p) => ({
                      ...p,
                      leaveTypeId: leaveTypes[0]?.id || "",
                      effectiveFrom: todayISO(),
                    }));
                    setIsPolicyModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
                >
                  <Layers size={14} />
                  New Policy
                </button>
              </div>
            </div>

            {/* Leave Types */}
            <section>
              <Card>
                <CardBody style={{ padding: 28 }}>
                  <SectionHeader
                    icon={<Clock size={18} />}
                    title="Configured Leave Types"
                    subtitle="Categories available for policy assignment across your organization"
                    action={
                      <button
                        onClick={() => {
                          setEditingLeaveType(null);
                          setTypeForm({ code: "", name: "", unit: "minutes", isPaid: true, requiresApproval: true });
                          setIsTypeModalOpen(true);
                        }}
                        className="btn-neutral"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          color: "var(--primary)",
                          borderColor: "var(--primary)",
                        }}
                      >
                        <Plus size={14} />
                        Add Type
                      </button>
                    }
                  />
                  <DataTable
                    headers={["Code", "Name", "Unit", "Paid", "Requires Approval", "Status", "Actions"]}
                    isEmpty={leaveTypes.length === 0}
                    empty={
                      <EmptyState
                        icon={<Layers size={40} />}
                        message='No leave types configured. Click "Add Type" to create your first leave category (e.g. PTO, Sick).'
                      />
                    }
                  >
                    {leaveTypes.map((lt) => (
                      <tr
                        key={lt.id}
                        style={{ borderBottom: "1px solid var(--card-border)" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "var(--page-bg, #F7F7F5)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "13px 16px" }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 11,
                              color: "var(--primary)",
                              background: "var(--primary-tint)",
                              padding: "3px 10px",
                              borderRadius: 6,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {lt.code}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            fontWeight: 700,
                            color: "var(--text-1)",
                          }}
                        >
                          {lt.name}
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            textTransform: "capitalize",
                            color: "var(--text-3)",
                          }}
                        >
                          {lt.unit}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          {lt.isPaid ? (
                            <Badge variant="success">Paid</Badge>
                          ) : (
                            <Badge variant="neutral">Unpaid</Badge>
                          )}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          {lt.requiresApproval ? (
                            <Badge variant="warning">Required</Badge>
                          ) : (
                            <Badge variant="neutral">Auto-approved</Badge>
                          )}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <Badge variant={lt.status === "active" ? "success" : "neutral"}>
                            {lt.status}
                          </Badge>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLeaveType(lt);
                              setTypeForm({
                                code: lt.code,
                                name: lt.name,
                                unit: lt.unit as "minutes" | "days",
                                isPaid: lt.isPaid,
                                requiresApproval: lt.requiresApproval,
                              });
                              setIsTypeModalOpen(true);
                            }}
                            className="btn-neutral btn-sm"
                            style={{
                              padding: "4px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                </CardBody>
              </Card>
            </section>

            {/* Policies */}
            <section>
              <Card>
                <CardBody style={{ padding: 28 }}>
                  <SectionHeader
                    icon={<Layers size={18} />}
                    title="Active Leave Policies & Accruals"
                    subtitle="Defines how many hours each leave type accrues per month or year"
                    action={
                      <button
                        onClick={() => {
                          setPolicyForm((p) => ({
                            ...p,
                            leaveTypeId: leaveTypes[0]?.id || "",
                            effectiveFrom: todayISO(),
                          }));
                          setIsPolicyModalOpen(true);
                        }}
                        className="btn-primary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                        }}
                      >
                        <Plus size={14} />
                        New Policy
                      </button>
                    }
                  />
                  <DataTable
                    headers={[
                      "Policy Name",
                      "Leave Type",
                      "Frequency",
                      "Accrual Rate",
                      "Effective From",
                      "Actions",
                    ]}
                    isEmpty={policies.length === 0}
                    empty={
                      <EmptyState
                        icon={<Sliders size={40} />}
                        message='No policies created yet. Click "New Policy" to set up leave accruals for your employees.'
                      />
                    }
                  >
                    {policies.map((p) => (
                      <tr
                        key={p.id}
                        style={{ borderBottom: "1px solid var(--card-border)" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "var(--page-bg, #F7F7F5)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "13px 16px", fontWeight: 700, color: "var(--text-1)" }}>
                          {p.name}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 11,
                              color: "var(--primary)",
                              background: "var(--primary-tint)",
                              padding: "3px 9px",
                              borderRadius: 6,
                            }}
                          >
                            {p.leaveTypeName || p.leaveTypeCode || "—"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            textTransform: "capitalize",
                            color: "var(--text-3)",
                          }}
                        >
                          {p.accrualFrequency}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          {p.accrualFrequency === "none" ? (
                            <span style={{ color: "var(--text-4)", fontSize: 12 }}>Static</span>
                          ) : (
                            <span
                              style={{
                                fontWeight: 800,
                                color: "#059669",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <TrendingUp size={12} />+{(p.accrualMinutes / 60).toFixed(1)}h /{" "}
                              {p.accrualFrequency}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--text-4)" }}>
                          {(p as any).effectiveFrom || "—"}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <button
                            onClick={() => handleAssignToAll(p.id, p.name)}
                            disabled={actionLoading}
                            className="btn-neutral"
                            style={{
                              fontSize: 12,
                              padding: "6px 14px",
                              color: "var(--primary)",
                              borderColor: "var(--primary)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Users size={12} />
                            Assign to All
                          </button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                </CardBody>
              </Card>
            </section>

            {/* Pending Requests */}
            <section>
              <Card>
                <CardBody style={{ padding: 28 }}>
                  <SectionHeader
                    icon={<CheckCircle2 size={18} />}
                    title="Pending Approval Queue"
                    subtitle="Leave requests awaiting manager or HR sign-off"
                    action={
                      pendingRequests.length > 0 ? (
                        <span
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            color: "#DC2626",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 20,
                            padding: "4px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {pendingRequests.length} pending
                        </span>
                      ) : undefined
                    }
                  />
                  <DataTable
                    headers={["Employee", "Type", "Period", "Hours", "Reason", "Stage", "Action"]}
                    isEmpty={pendingRequests.length === 0}
                    empty={
                      <EmptyState
                        icon={<CheckCircle2 size={40} />}
                        message="All leave requests have been processed. No pending approvals."
                      />
                    }
                  >
                    {pendingRequests.map((r) => (
                      <tr
                        key={r.id}
                        style={{ borderBottom: "1px solid var(--card-border)" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "var(--page-bg, #F7F7F5)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "13px 16px", fontWeight: 700, color: "var(--text-1)" }}>
                          {r.employeeName || r.employeeId.slice(0, 8) + "…"}
                        </td>
                        <td style={{ padding: "13px 16px", color: "var(--text-3)" }}>
                          {r.leaveTypeName || "Leave"}
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--text-3)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarDays size={12} style={{ color: "var(--text-4)" }} />
                            {r.startDate} <ArrowRight size={9} /> {r.endDate}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", fontWeight: 700 }}>
                          {Math.round(r.requestedMinutes / 60)}h
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            color: "var(--text-4)",
                            maxWidth: 160,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontSize: 12,
                          }}
                        >
                          {r.reason || "—"}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <StatusBadge status={r.status} />
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <button
                            onClick={() => handleApprove(r.id, r.status === "pending_hr")}
                            disabled={actionLoading}
                            style={{
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#fff",
                              background: "#059669",
                              border: "none",
                              borderRadius: 8,
                              cursor: actionLoading ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              opacity: actionLoading ? 0.6 : 1,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                </CardBody>
              </Card>
            </section>
          </div>
        )}
      </div>

      {/* ─── CONFIRM DIALOG ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog((p) => ({ ...p, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        isLoading={actionLoading}
      />

      {/* ─── MODAL: Request Time Off ─────────────────────────────────────── */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Time Off"
        subtitle="Submit a time-off application to your manager and HR"
        width={520}
      >
        <form onSubmit={handleSubmitRequest} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Leave Type *</label>
            <select
              value={requestForm.leaveTypeId}
              onChange={(e) => setRequestForm({ ...requestForm, leaveTypeId: e.target.value })}
              className="select"
              required
            >
              {leaveTypes.length === 0 && (
                <option value="">No leave types available</option>
              )}
              {leaveTypes.map((t) => {
                const bal = balances.find((b) => b.leaveTypeId === t.id);
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} {bal ? `— ${bal.availableHours}h available` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                value={requestForm.startDate}
                onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">End Date *</label>
              <input
                type="date"
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Total Requested Hours *</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={requestForm.hours}
              onChange={(e) =>
                setRequestForm({ ...requestForm, hours: parseFloat(e.target.value) || 0 })
              }
              className="input"
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Reason / Notes</label>
            <textarea
              rows={3}
              value={requestForm.reason}
              onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              placeholder="Provide context for manager approval (optional)..."
              className="input"
              style={{ resize: "vertical" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 16,
              marginTop: 4,
              borderTop: "1px solid var(--card-border)",
            }}
          >
            <button type="button" onClick={() => setIsRequestModalOpen(false)} className="btn-neutral">
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Send size={14} />
              {actionLoading ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: Create Leave Type ──────────────────────────────────────── */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => {
          setIsTypeModalOpen(false);
          setEditingLeaveType(null);
        }}
        title={editingLeaveType ? "Edit Leave Type" : "Create Custom Leave Type"}
        subtitle={editingLeaveType ? `Updating configuration for ${editingLeaveType.name}` : "Add a new leave category for your organization"}
        width={480}
      >
        <form onSubmit={handleCreateLeaveType} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Code *</label>
              <input
                type="text"
                placeholder="pto or sick_leave"
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toLowerCase().replace(/[\s-]/g, "_") })}
                className="input"
                style={{ fontWeight: 600, letterSpacing: "0.02em" }}
                maxLength={30}
                required
                disabled={Boolean(editingLeaveType)}
              />
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>
                {editingLeaveType ? "System identifier (fixed)" : "Lowercase identifier (e.g. pto, sick_leave)"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Display Name *</label>
              <input
                type="text"
                placeholder="e.g. Paid Time Off"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Measurement Unit</label>
            <select
              value={typeForm.unit}
              onChange={(e) =>
                setTypeForm({ ...typeForm, unit: e.target.value as "minutes" | "days" })
              }
              className="select"
            >
              <option value="minutes">Hours / Minutes</option>
              <option value="days">Calendar Days</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: 24,
              padding: "16px 20px",
              background: "var(--page-bg)",
              borderRadius: 12,
              border: "1px solid var(--card-border)",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-2)",
              }}
            >
              <input
                type="checkbox"
                checked={typeForm.isPaid}
                onChange={(e) => setTypeForm({ ...typeForm, isPaid: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
              />
              <div>
                <div>Paid Leave</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: "var(--text-4)" }}>
                  Salary is paid during this leave
                </div>
              </div>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-2)",
              }}
            >
              <input
                type="checkbox"
                checked={typeForm.requiresApproval}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, requiresApproval: e.target.checked })
                }
                style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
              />
              <div>
                <div>Requires Approval</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: "var(--text-4)" }}>
                  Manager must approve requests
                </div>
              </div>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 16,
              marginTop: 4,
              borderTop: "1px solid var(--card-border)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsTypeModalOpen(false);
                setEditingLeaveType(null);
              }}
              className="btn-neutral"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {actionLoading ? "Saving…" : (editingLeaveType ? "Save Changes" : "Create Leave Type")}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: Create Policy ──────────────────────────────────────────── */}
      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title="Create Leave Policy & Accrual"
        subtitle="Set accrual rates and rules for a leave type"
        width={560}
      >
        <form onSubmit={handleCreatePolicy} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Info note */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "12px 16px",
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--text-3)",
              alignItems: "flex-start",
            }}
          >
            <Info size={14} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
            <span>
              A policy defines how hours are accrued (e.g. 14h PTO per month). After creating,
              use <strong>Assign to All</strong> to enroll all active employees.
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Associated Leave Type *</label>
            <select
              value={policyForm.leaveTypeId}
              onChange={(e) => setPolicyForm({ ...policyForm, leaveTypeId: e.target.value })}
              className="select"
              required
            >
              <option value="">— Select a leave type —</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Policy Name *</label>
            <input
              type="text"
              placeholder="e.g. Standard PTO — 14h/mo"
              value={policyForm.name}
              onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Accrual Frequency *</label>
              <select
                value={policyForm.accrualFrequency}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    accrualFrequency: e.target.value as typeof policyForm.accrualFrequency,
                  })
                }
                className="select"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (lump sum)</option>
                <option value="weekly">Weekly</option>
                <option value="none">None (static allocation)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">
                Hours Per{" "}
                {policyForm.accrualFrequency === "none"
                  ? "Allocation"
                  : policyForm.accrualFrequency === "annual"
                  ? "Year"
                  : policyForm.accrualFrequency === "weekly"
                  ? "Week"
                  : "Month"}
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="14"
                value={policyForm.accrualHours}
                disabled={policyForm.accrualFrequency === "none"}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, accrualHours: parseFloat(e.target.value) || 0 })
                }
                className="input"
                style={{ opacity: policyForm.accrualFrequency === "none" ? 0.5 : 1 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Max Carryover Hours</label>
              <input
                type="number"
                min={0}
                step={1}
                value={policyForm.carryoverLimitHours}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    carryoverLimitHours: parseFloat(e.target.value) || 0,
                  })
                }
                className="input"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Effective From *</label>
              <input
                type="date"
                value={policyForm.effectiveFrom}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, effectiveFrom: e.target.value })
                }
                className="input"
                required
              />
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-2)",
              padding: "12px 16px",
              background: "var(--page-bg)",
              borderRadius: 10,
              border: "1px solid var(--card-border)",
            }}
          >
            <input
              type="checkbox"
              checked={policyForm.allowsNegativeBalance}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, allowsNegativeBalance: e.target.checked })
              }
              style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
            />
            <div>
              <div>Allow Negative Balance</div>
              <div style={{ fontSize: 11, fontWeight: 400, color: "var(--text-4)" }}>
                Employees can take leave even if balance is zero (advance leave)
              </div>
            </div>
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 16,
              marginTop: 4,
              borderTop: "1px solid var(--card-border)",
            }}
          >
            <button type="button" onClick={() => setIsPolicyModalOpen(false)} className="btn-neutral">
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Layers size={14} />
              {actionLoading ? "Saving…" : "Save Policy"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: Manual Adjustment ─────────────────────────────────────── */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Manual Balance Adjustment"
        subtitle="Credit or deduct leave hours for a specific employee"
        width={480}
      >
        <form onSubmit={handleManualAdjustment} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Employee *</label>
            <select
              value={adjustForm.employeeId}
              onChange={(e) => setAdjustForm({ ...adjustForm, employeeId: e.target.value })}
              className="select"
              required
            >
              <option value="">— Select an employee —</option>
              {allEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}{" "}
                  {emp.jobTitle ? `— ${emp.jobTitle}` : `(${emp.workEmail})`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Leave Type *</label>
            <select
              value={adjustForm.leaveTypeId}
              onChange={(e) => setAdjustForm({ ...adjustForm, leaveTypeId: e.target.value })}
              className="select"
              required
            >
              <option value="">— Select leave type —</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Adjustment Hours *</label>
            <input
              type="number"
              step={0.5}
              placeholder="e.g. 8 to add, -4 to deduct"
              value={adjustForm.hours}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, hours: parseFloat(e.target.value) || 0 })
              }
              className="input"
              required
            />
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>
              Use positive values to credit, negative to deduct from the employee&apos;s balance.
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Reason / Justification *</label>
            <input
              type="text"
              placeholder="e.g. Overtime compensation, onboarding bonus"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="input"
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 16,
              marginTop: 4,
              borderTop: "1px solid var(--card-border)",
            }}
          >
            <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="btn-neutral">
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {actionLoading ? "Applying…" : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
