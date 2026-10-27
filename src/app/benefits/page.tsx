"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Gift,
  Plus,
  Search,
  Heart,
  Shield,
  Coffee,
  Landmark,
  CheckCircle2,
  Users,
  DollarSign,
  Edit2,
  Edit3,
  Trash2,
  Loader2,
  UserCheck,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";
import { useRole } from "@/context/RoleContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";
import { formatMoney } from "@/components/payroll/payrollModel";

interface BenefitPlan {
  id: string;
  name: string;
  category: string;
  description: string | null;
  employerCostMinor: number;
  employeeCostMinor: number;
  currency: string;
  enrolledCount: number;
  eligibleCount: number;
}

interface BenefitEnrollment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  planId: string;
  planName: string;
  category: string;
  coverageTier: string;
  status: string;
  employerCostMinor: number;
  employeeCostMinor: number;
  currency: string;
  effectiveFrom: string;
}

interface EmployeeOption {
  id: string;
  name: string;
  department: string;
  jobTitle?: string;
}

const CATEGORY_ICONS: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  health: { icon: <Heart size={22} />, bg: "#FEF2F2", color: "#EF4444" },
  retirement: { icon: <Landmark size={22} />, bg: "#F0FDF4", color: "#22C55E" },
  allowance: { icon: <Coffee size={22} />, bg: "#FFFBEB", color: "#F59E0B" },
  transit: { icon: <Shield size={22} />, bg: "#EFF6FF", color: "#3B82F6" },
  other: { icon: <Gift size={22} />, bg: "#F5F3FF", color: "#8B5CF6" },
};

export default function BenefitsPage() {
  const { getToken } = useAuth();
  const { role, currentUser } = useRole();
  const [activeTab, setActiveTab] = useState("Benefits");

  // Live state
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [enrollments, setEnrollments] = useState<BenefitEnrollment[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BenefitPlan | null>(null);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: "",
    category: "Health & Medical",
    description: "",
    employerCost: 0,
    employeeCost: 0,
    currency: "UGX",
  });
  const [editPlanForm, setEditPlanForm] = useState({
    name: "",
    category: "Health & Medical",
    description: "",
    employerCost: 0,
    employeeCost: 0,
    currency: "UGX",
  });

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    employeeId: "",
    planId: "",
    coverageTier: "individual",
    effectiveFrom: new Date().toISOString().slice(0, 10),
  });

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [plansRes, enrollRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/benefits/plans`, { headers }).catch(() => null),
        fetch(
          role === "Employee" && currentUser?.id
            ? `${API_BASE_URL}/api/v1/benefits/enrollments/${currentUser.id}`
            : `${API_BASE_URL}/api/v1/benefits/enrollments`,
          { headers }
        ).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }).catch(() => null),
      ]);

      if (plansRes && plansRes.ok) {
        const data = await plansRes.json();
        setPlans(Array.isArray(data) ? data : []);
      }
      if (enrollRes && enrollRes.ok) {
        const data = await enrollRes.json();
        setEnrollments(Array.isArray(data) ? data : []);
      }
      if (empRes && empRes.ok) {
        const data = await empRes.json();
        const emps = Array.isArray(data) ? data : data.data || [];
        setEmployees(
          emps.map((e: any) => ({
            id: e.id,
            name: `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.name || "Employee",
            department: e.department || "General",
            jobTitle: e.jobTitle || "",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load benefits data", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, role, currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Employee options for SearchableSelect
  const employeeSelectOptions: SelectOption[] = useMemo(() => {
    return employees.map((emp) => ({
      value: emp.id,
      label: emp.name,
      description: `${emp.jobTitle ? `${emp.jobTitle} · ` : ""}${emp.department}`,
      avatar: true,
    }));
  }, [employees]);

  // Handle Create Plan
  const handleCreatePlan = async () => {
    if (!planForm.name.trim() || !/^[A-Za-z]{3}$/.test(planForm.currency)) {
      toast.error("Plan details required", "Enter a plan name and a three-letter currency code.");
      return;
    }
    setIsSubmittingPlan(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/benefits/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: planForm.name,
          category: planForm.category,
          description: planForm.description || null,
          employerCostMinor: Math.round(Number(planForm.employerCost) * 100),
          employeeCostMinor: Math.round(Number(planForm.employeeCost) * 100),
          currency: planForm.currency.toUpperCase(),
        }),
      });

      if (res.ok) {
        toast.success("Benefit plan created", `${planForm.name} is now available for enrollment.`);
        setShowAddPlanModal(false);
        setPlanForm({
          name: "",
          category: "Health & Medical",
          description: "",
          employerCost: 0,
          employeeCost: 0,
          currency: "UGX",
        });
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Creation failed", err.detail || err.title || "Unable to create benefit plan.");
      }
    } catch (err) {
      console.error("Error creating benefit plan", err);
      toast.error("Network error", "Unable to reach server.");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Handle Update Plan
  const handleOpenEditPlan = (plan: BenefitPlan) => {
    setEditingPlan(plan);
    setEditPlanForm({
      name: plan.name,
      category: plan.category || "Health & Medical",
      description: plan.description || "",
      employerCost: plan.employerCostMinor / 100,
      employeeCost: plan.employeeCostMinor / 100,
      currency: plan.currency || "UGX",
    });
    setShowEditPlanModal(true);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;
    if (!editPlanForm.name.trim() || !/^[A-Za-z]{3}$/.test(editPlanForm.currency)) {
      toast.error("Plan details required", "Enter a plan name and a three-letter currency code.");
      return;
    }
    setIsSubmittingPlan(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/benefits/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editPlanForm.name,
          category: editPlanForm.category,
          description: editPlanForm.description || null,
          employerCostMinor: Math.round(Number(editPlanForm.employerCost) * 100),
          employeeCostMinor: Math.round(Number(editPlanForm.employeeCost) * 100),
          currency: editPlanForm.currency.toUpperCase(),
        }),
      });

      if (res.ok) {
        toast.success("Benefit plan updated", `Changes to ${editPlanForm.name} saved.`);
        setShowEditPlanModal(false);
        setEditingPlan(null);
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Update failed", err.detail || err.title || "Unable to update benefit plan.");
      }
    } catch (err) {
      console.error("Error updating benefit plan", err);
      toast.error("Network error", "Unable to update benefit plan.");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Handle Delete Plan
  const handleDeletePlan = async (plan: BenefitPlan) => {
    if (!confirm(`Are you sure you want to delete the plan "${plan.name}"? Active employee enrollments under this policy will also be removed.`)) return;
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/benefits/plans/${plan.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok || res.status === 204) {
        toast.success("Plan removed", `Deleted "${plan.name}".`);
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Delete failed", err.detail || "Unable to delete plan.");
      }
    } catch (err) {
      console.error("Error deleting plan", err);
      toast.error("Network error", "Unable to delete plan.");
    }
  };

  // Handle Enroll Employee
  const handleEnrollEmployee = async () => {
    if (!enrollForm.employeeId) {
      toast.error("Employee required", "Please select an employee to enroll.");
      return;
    }
    if (!enrollForm.planId) {
      toast.error("Plan required", "Please select a benefit plan.");
      return;
    }
    setIsSubmittingEnroll(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/benefits/enrollments/${enrollForm.employeeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: enrollForm.planId,
          coverageTier: enrollForm.coverageTier,
          effectiveFrom: enrollForm.effectiveFrom,
        }),
      });

      if (res.ok) {
        toast.success("Employee enrolled", "Coverage record established.");
        setShowEnrollModal(false);
        setEnrollForm({
          employeeId: "",
          planId: "",
          coverageTier: "individual",
          effectiveFrom: new Date().toISOString().slice(0, 10),
        });
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Enrollment failed", err.detail || err.title || "Unable to enroll employee.");
      }
    } catch (err) {
      console.error("Error enrolling employee", err);
      toast.error("Network error", "Unable to enroll employee.");
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  // Metrics
  const totalEnrolled = enrollments.length;
  const totalMonthlyCost = plans.reduce((acc, p) => acc + (p.employerCostMinor / 100) * (p.enrolledCount || 0), 0);
  const avgCostPerEmp = totalEnrolled > 0 ? Math.round(totalMonthlyCost / totalEnrolled) : 0;
  const primaryCurrency = plans[0]?.currency || "UGX";

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <PageHeader
        title="Company Benefits & Offerings"
        subtitle="Manage employee benefit plans, track enrollments, and administer insurance offerings."
        icon={<Gift size={28} className="text-white" />}
        tabs={["Benefits", "Enrollment", "Reports"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          role !== "Employee" ? (
            <div className="row gap-12 align-center">
              {activeTab === "Enrollment" ? (
                <button
                  className="btn-primary row gap-8 align-center"
                  style={{
                    background: "var(--gradient)",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: 10,
                    color: "white",
                    fontWeight: 650,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowEnrollModal(true)}
                >
                  <Plus size={15} /> Enroll Employee
                </button>
              ) : (
                <button
                  className="btn-secondary row gap-8 align-center"
                  style={{
                    background: "white",
                    color: "var(--primary)",
                    border: "none",
                    padding: "9px 18px",
                    fontSize: 13,
                    fontWeight: 650,
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowAddPlanModal(true)}
                >
                  <Plus size={15} /> Add Benefit Plan
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/people/me?tab=Benefits"
              className="btn-secondary btn-sm"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              My Enrolled Coverage
            </Link>
          )
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: "var(--bg-page)" }}>
        <div className="col gap-28">
          <StatRibbon
            stats={[
              {
                label: "Active Plans",
                value: plans.length,
                icon: <Gift size={18} />,
                color: "var(--primary)",
                description: "Available company offerings",
              },
              {
                label: "Total Enrolled",
                value: `${totalEnrolled}`,
                icon: <Users size={18} />,
                color: "var(--success)",
                trend: `${totalEnrolled} active policies`,
                trendType: "positive",
                description: "Employees with coverage",
              },
              {
                label: "Average Cost / Enrollee",
                value: plans.length > 0 ? `${formatMoney(avgCostPerEmp * 100, primaryCurrency)}/mo` : "0/mo",
                icon: <DollarSign size={18} />,
                color: "var(--warning)",
                trend: plans.length > 0 ? `${formatMoney(totalMonthlyCost * 100, primaryCurrency)} total / mo` : "0 total / mo",
                trendType: "neutral",
                description: "Employer expenditure",
              },
            ]}
          />

          {/* TAB 1: BENEFITS CATALOG */}
          {activeTab === "Benefits" && (
            <div className="col gap-20">
              <div className="row-between align-center">
                <div>
                  <h2 className="text-xl fw-800 text-1 m-0">Benefit Plans Catalog</h2>
                  <span className="text-sm text-4 fw-500">
                    Comprehensive offerings provided by your organization.
                  </span>
                </div>
                {role !== "Employee" && (
                  <button
                    className="btn-primary row gap-8 align-center"
                    onClick={() => setShowAddPlanModal(true)}
                    style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13 }}
                  >
                    <Plus size={14} /> Add Plan
                  </button>
                )}
              </div>

              {isLoading ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <Loader2 size={32} className="animate-spin text-primary" style={{ margin: "0 auto 12px" }} />
                  <span className="text-sm text-4">Loading benefit offerings...</span>
                </div>
              ) : plans.length > 0 ? (
                <div className="grid-2 gap-20">
                  {plans.map((b) => {
                    const catStyle = CATEGORY_ICONS[b.category] || CATEGORY_ICONS.other;
                    const eligible = b.eligibleCount || 1;
                    const enrolled = b.enrolledCount || 0;
                    const pct = Math.min(100, Math.round((enrolled / eligible) * 100));
                    const costDisplay = `${formatMoney(b.employerCostMinor, b.currency)}/mo`;
                    const employeeCostDisplay = b.employeeCostMinor > 0 ? `${formatMoney(b.employeeCostMinor, b.currency)}/mo` : "Fully Employer Funded";

                    return (
                      <Card
                        key={b.id}
                        style={{
                          borderRadius: 14,
                          border: "1px solid #E5E5EA",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                          background: "#FFFFFF",
                        }}
                      >
                        <CardBody className="p-24 col gap-16">
                          <div className="row-between align-start">
                            <div className="row gap-14 align-center">
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 10,
                                  background: catStyle.bg,
                                  color: catStyle.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {catStyle.icon}
                              </div>
                              <div>
                                <h3 className="m-0 text-base fw-700 text-1" style={{ fontSize: 15 }}>{b.name}</h3>
                                <span
                                  style={{
                                    display: "inline-block",
                                    marginTop: 4,
                                    fontSize: 10.5,
                                    fontWeight: 650,
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                    background: "#F2F2F7",
                                    color: "#6E6E73",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.03em",
                                  }}
                                >
                                  {b.category} · {b.currency}
                                </span>
                              </div>
                            </div>

                            {/* Plan Card Actions */}
                            <div className="row gap-6 align-center">
                              {role !== "Employee" ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn-neutral btn-sm"
                                    onClick={() => handleOpenEditPlan(b)}
                                    title="Edit benefit plan details and contribution costs"
                                    style={{ padding: "6px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}
                                  >
                                    <Edit2 size={12} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-neutral btn-sm"
                                    onClick={() => handleDeletePlan(b)}
                                    title="Delete benefit plan"
                                    style={{ padding: "6px 8px", color: "#DC2626" }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-primary btn-sm"
                                    onClick={() => {
                                      setEnrollForm({ ...enrollForm, planId: b.id });
                                      setShowEnrollModal(true);
                                    }}
                                    style={{ padding: "6px 12px", fontSize: 12 }}
                                  >
                                    Enroll Staff
                                  </button>
                                </>
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", background: "#DCFCE7", padding: "3px 8px", borderRadius: 6 }}>
                                  Available
                                </span>
                              )}
                            </div>
                          </div>

                          {b.description && (
                            <p className="m-0 text-sm text-4" style={{ lineHeight: 1.5, color: "#6E6E73", fontSize: 12.5 }}>
                              {b.description}
                            </p>
                          )}

                          <div className="col gap-10 pt-12" style={{ borderTop: "1px solid #F0F0F2" }}>
                            <div className="row-between text-xs" style={{ color: "#6E6E73" }}>
                              <span className="fw-600">Company Enrollment</span>
                              <span className="fw-700 text-1">
                                {enrolled} / {eligible} ({pct}%)
                              </span>
                            </div>
                            <div style={{ background: "#F2F2F7", height: 5, borderRadius: 3, overflow: "hidden" }}>
                              <div
                                style={{
                                  background: "var(--primary, #2563EB)",
                                  height: "100%",
                                  width: `${pct}%`,
                                  borderRadius: 3,
                                  transition: "width 0.4s ease",
                                }}
                              />
                            </div>
                            <div className="grid-2 gap-12 pt-4">
                              <div style={{ background: "#F9F9FB", padding: "8px 12px", borderRadius: 8, border: "1px solid #F0F0F2" }}>
                                <span style={{ fontSize: 10.5, color: "#8E8E93", display: "block" }}>Employer Contribution</span>
                                <strong style={{ fontSize: 13, color: "#1D1D1F" }}>{costDisplay}</strong>
                              </div>
                              <div style={{ background: "#F9F9FB", padding: "8px 12px", borderRadius: 8, border: "1px solid #F0F0F2" }}>
                                <span style={{ fontSize: 10.5, color: "#8E8E93", display: "block" }}>Employee Contribution</span>
                                <strong style={{ fontSize: 13, color: "#1D1D1F" }}>{employeeCostDisplay}</strong>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "white",
                    borderRadius: 14,
                    border: "1px dashed var(--border)",
                  }}
                >
                  <Gift size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
                  <h3 className="text-base fw-700 text-1 m-0 mb-4">No benefit plans configured</h3>
                  <p className="text-sm text-4 m-0 mb-20">
                    Add medical, retirement, or wellness plans to offer comprehensive coverage.
                  </p>
                  {role !== "Employee" && (
                    <button
                      className="btn-primary"
                      onClick={() => setShowAddPlanModal(true)}
                      style={{ padding: "8px 20px", borderRadius: 8 }}
                    >
                      Add First Benefit Plan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENROLLMENT TRACKER */}
          {activeTab === "Enrollment" && (
            <div className="col gap-24">
              <div className="row-between align-center">
                <div>
                  <h2 className="text-xl fw-800 text-1 m-0">Employee Enrollment Tracker</h2>
                  <span className="text-sm text-4 fw-500">
                    Active coverage policies assigned to individual staff members.
                  </span>
                </div>
                {role !== "Employee" && (
                  <button
                    className="btn-primary row gap-8 align-center"
                    onClick={() => setShowEnrollModal(true)}
                    style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13 }}
                  >
                    <Plus size={14} /> Enroll Employee
                  </button>
                )}
              </div>

              {isLoading ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <Loader2 size={32} className="animate-spin text-primary" style={{ margin: "0 auto 12px" }} />
                  <span className="text-sm text-4">Loading enrollment records...</span>
                </div>
              ) : enrollments.length > 0 ? (
                <div className="col gap-12">
                  {enrollments.map((enr) => (
                    <Card key={enr.id} style={{ borderRadius: 12, border: "1px solid #E5E5EA", background: "#FFFFFF" }}>
                      <CardBody style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div className="row gap-14 align-center">
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: "var(--primary-tint)",
                              color: "var(--primary)",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Shield size={18} />
                          </div>
                          <div>
                            <h4 className="m-0 text-base fw-700 text-1" style={{ fontSize: 14 }}>{enr.employeeName}</h4>
                            <span className="text-xs text-4">
                              {enr.department} · Plan: <strong>{enr.planName}</strong> ({enr.coverageTier})
                            </span>
                          </div>
                        </div>
                        <div className="row gap-20 align-center">
                          <div className="col gap-2 align-end">
                            <span className="text-xs text-4 fw-600">Effective Date</span>
                            <span className="text-sm fw-700 text-1">{enr.effectiveFrom}</span>
                          </div>
                          <Badge variant={enr.status === "active" ? "success" : "neutral"}>
                            {enr.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "white",
                    borderRadius: 14,
                    border: "1px dashed var(--border)",
                  }}
                >
                  <UserCheck size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
                  <h3 className="text-base fw-700 text-1 m-0 mb-4">No employees enrolled yet</h3>
                  <p className="text-sm text-4 m-0 mb-20">
                    Enroll team members in health, retirement, or wellness plans to activate benefits.
                  </p>
                  {role !== "Employee" && (
                    <button
                      className="btn-primary"
                      onClick={() => setShowEnrollModal(true)}
                      style={{ padding: "8px 20px", borderRadius: 8 }}
                    >
                      Enroll First Employee
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPORTS */}
          {activeTab === "Reports" && (
            <div className="col gap-20">
              <h2 className="text-xl fw-800 text-1 m-0">Benefits Cost & Distribution</h2>
              <div className="grid-2 gap-20">
                <Card style={{ borderRadius: 14, border: "1px solid #E5E5EA", background: "#FFFFFF" }}>
                  <CardBody className="p-20 col gap-14">
                    <h3 className="m-0 text-base fw-700 text-1">Plan Distribution</h3>
                    <div className="col gap-10">
                      {plans.map((p) => (
                        <div key={p.id} className="row-between align-center text-sm">
                          <span className="text-2 fw-600">{p.name}</span>
                          <span className="text-1 fw-700">{p.enrolledCount} enrolled</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card style={{ borderRadius: 14, border: "1px solid #E5E5EA", background: "#FFFFFF" }}>
                  <CardBody className="p-20 col gap-14">
                    <h3 className="m-0 text-base fw-700 text-1">Monthly Cost Summary</h3>
                    <div className="row-between text-sm pt-8 border-b border-border pb-8">
                      <span className="text-4">Total Active Policies</span>
                      <strong className="text-1">{totalEnrolled}</strong>
                    </div>
                    <div className="row-between text-sm pt-8 border-b border-border pb-8">
                      <span className="text-4">Estimated Monthly Outlay</span>
                      <strong className="text-1">{formatMoney(totalMonthlyCost * 100, primaryCurrency)}</strong>
                    </div>
                    <div className="row-between text-sm pt-8">
                      <span className="text-4">Per-Employee Average</span>
                      <strong className="text-1">{formatMoney(avgCostPerEmp * 100, primaryCurrency)} / month</strong>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Benefit Plan */}
      <Modal
        isOpen={showAddPlanModal}
        onClose={() => setShowAddPlanModal(false)}
        title="Add Benefit Plan"
        subtitle="Create a new benefit offering for your employees."
      >
        <div className="col gap-20 p-24">
          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Plan Name</label>
            <Input
              type="text"
              placeholder="e.g. Dental & Vision Care, Tech Equipment Stipend"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            />
          </div>

          <div className="grid-2 gap-16">
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Category</label>
              <Input type="text" maxLength={80} placeholder="e.g. Health cover, lunch stipend, pension" value={planForm.category} onChange={(e) => setPlanForm({ ...planForm, category: e.target.value })} />
            </div>
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Currency (ISO code)</label>
              <Input
                type="text"
                maxLength={3}
                placeholder="e.g. UGX"
                value={planForm.currency}
                onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid-2 gap-16">
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Employer Cost per Employee / Month ({planForm.currency || "currency"})</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={String(planForm.employerCost)}
                onChange={(e) => setPlanForm({ ...planForm, employerCost: Number(e.target.value) })}
                leftIcon={<DollarSign size={16} />}
              />
            </div>
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Employee Cost / Month ({planForm.currency || "currency"})</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={String(planForm.employeeCost)}
                onChange={(e) => setPlanForm({ ...planForm, employeeCost: Number(e.target.value) })}
                leftIcon={<DollarSign size={16} />}
              />
            </div>
          </div>

          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Plan Description</label>
            <Textarea
              placeholder="Describe coverage details, eligibility rules, and reimbursement terms..."
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              style={{ minHeight: 90 }}
            />
          </div>

          <div className="row-end gap-12 pt-12 border-t border-border">
            <button
              className="btn-neutral"
              onClick={() => setShowAddPlanModal(false)}
              disabled={isSubmittingPlan}
            >
              Cancel
            </button>
            <button
              className="btn-primary row gap-8 align-center"
              onClick={handleCreatePlan}
              disabled={isSubmittingPlan}
            >
              {isSubmittingPlan ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span>Create Plan</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Edit Benefit Plan */}
      <Modal
        isOpen={showEditPlanModal}
        onClose={() => {
          setShowEditPlanModal(false);
          setEditingPlan(null);
        }}
        title="Edit Benefit Plan"
        subtitle="Update plan coverage terms, contribution rates, and eligible currency."
      >
        <div className="col gap-20 p-24">
          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Plan Name</label>
            <Input
              type="text"
              placeholder="e.g. Comprehensive Health Cover"
              value={editPlanForm.name}
              onChange={(e) => setEditPlanForm({ ...editPlanForm, name: e.target.value })}
            />
          </div>

          <div className="grid-2 gap-16">
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Category</label>
              <Input
                type="text"
                maxLength={80}
                placeholder="e.g. Health cover, lunch stipend, pension"
                value={editPlanForm.category}
                onChange={(e) => setEditPlanForm({ ...editPlanForm, category: e.target.value })}
              />
            </div>
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Currency (ISO code)</label>
              <Input
                type="text"
                maxLength={3}
                placeholder="e.g. UGX"
                value={editPlanForm.currency}
                onChange={(e) => setEditPlanForm({ ...editPlanForm, currency: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid-2 gap-16">
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Employer Cost / Month ({editPlanForm.currency || "currency"})</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={String(editPlanForm.employerCost)}
                onChange={(e) => setEditPlanForm({ ...editPlanForm, employerCost: Number(e.target.value) })}
              />
            </div>
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Employee Cost / Month ({editPlanForm.currency || "currency"})</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={String(editPlanForm.employeeCost)}
                onChange={(e) => setEditPlanForm({ ...editPlanForm, employeeCost: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Plan Description</label>
            <Textarea
              placeholder="Describe coverage details, eligibility rules, and reimbursement terms..."
              value={editPlanForm.description}
              onChange={(e) => setEditPlanForm({ ...editPlanForm, description: e.target.value })}
              style={{ minHeight: 90 }}
            />
          </div>

          <div className="row-end gap-12 pt-12 border-t border-border">
            <button
              className="btn-neutral"
              onClick={() => {
                setShowEditPlanModal(false);
                setEditingPlan(null);
              }}
              disabled={isSubmittingPlan}
            >
              Cancel
            </button>
            <button
              className="btn-primary row gap-8 align-center"
              onClick={handleUpdatePlan}
              disabled={isSubmittingPlan}
            >
              {isSubmittingPlan ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Enroll Employee */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Enroll Employee in Benefit Plan"
        subtitle="Assign coverage to a team member."
      >
        <div className="col gap-20 p-24">
          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Employee</label>
            <SearchableSelect
              value={enrollForm.employeeId}
              onChange={(val) => setEnrollForm({ ...enrollForm, employeeId: val })}
              placeholder="Select team member..."
              searchPlaceholder="Search by name or department..."
              options={employeeSelectOptions}
            />
          </div>

          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Benefit Plan</label>
            <Select
              value={enrollForm.planId}
              onChange={(e) => setEnrollForm({ ...enrollForm, planId: e.target.value })}
            >
              <option value="">Select a benefit plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category.toUpperCase()})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid-2 gap-16">
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Coverage Tier</label>
              <Select
                value={enrollForm.coverageTier}
                onChange={(e) => setEnrollForm({ ...enrollForm, coverageTier: e.target.value })}
              >
                <option value="individual">Individual Coverage</option>
                <option value="family">Family / Dependents Coverage</option>
              </Select>
            </div>
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Effective From</label>
              <Input
                type="date"
                value={enrollForm.effectiveFrom}
                onChange={(e) => setEnrollForm({ ...enrollForm, effectiveFrom: e.target.value })}
              />
            </div>
          </div>

          <div className="row-end gap-12 pt-12 border-t border-border">
            <button
              className="btn-neutral"
              onClick={() => setShowEnrollModal(false)}
              disabled={isSubmittingEnroll}
            >
              Cancel
            </button>
            <button
              className="btn-primary row gap-8 align-center"
              onClick={handleEnrollEmployee}
              disabled={isSubmittingEnroll}
            >
              {isSubmittingEnroll ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              <span>Enroll Employee</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
