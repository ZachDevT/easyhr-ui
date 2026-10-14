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
  Edit3,
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
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: "",
    category: "health",
    description: "",
    employerCost: 0,
    employeeCost: 0,
    currency: "",
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
    if (role === "Employee") {
      setIsLoading(false);
      return;
    }
    try {
      const token = await getToken();
      if (!token) return;

      const [plansRes, enrollRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/benefits/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/benefits/enrollments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(Array.isArray(data) ? data : []);
      }
      if (enrollRes.ok) {
        const data = await enrollRes.json();
        setEnrollments(Array.isArray(data) ? data : []);
      }
      if (empRes.ok) {
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
  }, [getToken]);

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
          currency: planForm.currency,
        }),
      });

      if (res.ok) {
        toast.success("Benefit plan created", `${planForm.name} is now available for enrollment.`);
        setShowAddPlanModal(false);
        setPlanForm({
          name: "",
          category: "health",
          description: "",
          employerCost: 0,
          employeeCost: 0,
          currency: "",
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

  if (role === "Employee") {
    return (
      <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
        <PageHeader
          title="Benefits Portal"
          subtitle="Health, wellness, and retirement plans"
          icon={<Gift size={28} className="text-white" />}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "var(--accent-subtle, #f1f5f9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              marginBottom: 20,
            }}
          >
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0", color: "var(--text-1)" }}>
            Benefits Administration Restricted
          </h2>
          <p style={{ maxWidth: 480, color: "var(--text-4)", fontSize: 14, margin: "0 0 24px 0", lineHeight: 1.6 }}>
            Plan configuration and company-wide enrollment administration are reserved for HR Administrators.
            To view your individual enrolled benefits and total compensation, access your personal profile.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/dashboard"
              className="btn-neutral"
              style={{ textDecoration: "none", padding: "10px 20px" }}
            >
              Return to Dashboard
            </Link>
            <Link
              href={`/people/${currentUser?.id || ""}`}
              className="btn-primary"
              style={{ textDecoration: "none", padding: "10px 20px" }}
            >
              My Profile & Benefits
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="row gap-12 align-center">
            {activeTab === "Enrollment" ? (
              <button
                className="btn-primary row gap-8 align-center"
                style={{
                  background: "var(--gradient)",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 20,
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => setShowEnrollModal(true)}
              >
                <Plus size={16} /> Enroll Employee
              </button>
            ) : (
              <button
                className="btn-secondary row gap-8 align-center"
                style={{
                  background: "white",
                  color: "var(--primary)",
                  border: "none",
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 20,
                  cursor: "pointer",
                }}
                onClick={() => setShowAddPlanModal(true)}
              >
                <Plus size={16} /> Add Benefit Plan
              </button>
            )}
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", background: "var(--bg-page)" }}>
        <div className="col gap-32">
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
                value: `$${avgCostPerEmp}/mo`,
                icon: <DollarSign size={18} />,
                color: "var(--warning)",
                trend: `$${Math.round(totalMonthlyCost)} total / mo`,
                trendType: "neutral",
                description: "Employer expenditure",
              },
            ]}
          />

          {/* TAB 1: BENEFITS CATALOG */}
          {activeTab === "Benefits" && (
            <div className="col gap-24">
              <div className="row-between align-center">
                <div>
                  <h2 className="text-xl fw-800 text-1 m-0">Benefit Plans Catalog</h2>
                  <span className="text-sm text-4 fw-500">
                    Comprehensive offerings provided by your organization.
                  </span>
                </div>
                <button
                  className="btn-primary row gap-8 align-center"
                  onClick={() => setShowAddPlanModal(true)}
                  style={{ padding: "10px 20px", borderRadius: 20 }}
                >
                  <Plus size={15} /> Add Plan
                </button>
              </div>

              {isLoading ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <Loader2 size={32} className="animate-spin text-primary" style={{ margin: "0 auto 12px" }} />
                  <span className="text-sm text-4">Loading benefit offerings...</span>
                </div>
              ) : plans.length > 0 ? (
                <div className="grid-2 gap-24">
                  {plans.map((b) => {
                    const catStyle = CATEGORY_ICONS[b.category] || CATEGORY_ICONS.other;
                    const eligible = b.eligibleCount || 1;
                    const enrolled = b.enrolledCount || 0;
                    const pct = Math.min(100, Math.round((enrolled / eligible) * 100));
                    const costDisplay = `$${(b.employerCostMinor / 100).toFixed(0)}/mo`;

                    return (
                      <Card
                        key={b.id}
                        style={{
                          borderRadius: 16,
                          border: "1px solid var(--border)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                        }}
                      >
                        <CardBody className="p-28 col gap-20">
                          <div className="row-between align-start">
                            <div className="row gap-16 align-center">
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 14,
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
                                <h3 className="m-0 text-base fw-700 text-1">{b.name}</h3>
                                <Badge variant="neutral" style={{ marginTop: 4, fontSize: 11 }}>
                                  {b.category.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <button
                              className="btn-neutral btn-sm"
                              onClick={() => {
                                setEnrollForm({ ...enrollForm, planId: b.id });
                                setShowEnrollModal(true);
                              }}
                            >
                              Enroll Staff
                            </button>
                          </div>

                          {b.description && (
                            <p className="m-0 text-sm text-4" style={{ lineHeight: 1.6 }}>
                              {b.description}
                            </p>
                          )}

                          <div className="col gap-8 pt-16" style={{ borderTop: "1px dashed var(--border)" }}>
                            <div className="row-between text-sm">
                              <span className="text-4 fw-600">Enrollment</span>
                              <span className="text-1 fw-700">
                                {enrolled} / {eligible} ({pct}%)
                              </span>
                            </div>
                            <div style={{ background: "var(--border)", height: 6, borderRadius: 3, overflow: "hidden" }}>
                              <div
                                style={{
                                  background: catStyle.color,
                                  height: "100%",
                                  width: `${pct}%`,
                                  borderRadius: 3,
                                  transition: "width 0.5s ease",
                                }}
                              />
                            </div>
                            <div className="row-between text-sm">
                              <span className="text-4 fw-600">Employer Cost</span>
                              <span className="text-1 fw-700">{costDisplay}</span>
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
                    borderRadius: 16,
                    border: "1px dashed var(--border)",
                  }}
                >
                  <Gift size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
                  <h3 className="text-base fw-700 text-1 m-0 mb-4">No benefit plans configured</h3>
                  <p className="text-sm text-4 m-0 mb-20">
                    Add medical, retirement, or wellness plans to offer comprehensive coverage.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowAddPlanModal(true)}
                    style={{ padding: "10px 24px", borderRadius: 20 }}
                  >
                    Add First Benefit Plan
                  </button>
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
                <button
                  className="btn-primary row gap-8 align-center"
                  onClick={() => setShowEnrollModal(true)}
                  style={{ padding: "10px 20px", borderRadius: 20 }}
                >
                  <Plus size={15} /> Enroll Employee
                </button>
              </div>

              {isLoading ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <Loader2 size={32} className="animate-spin text-primary" style={{ margin: "0 auto 12px" }} />
                  <span className="text-sm text-4">Loading enrollment records...</span>
                </div>
              ) : enrollments.length > 0 ? (
                <div className="col gap-12">
                  {enrollments.map((enr) => (
                    <Card key={enr.id} style={{ borderRadius: 14, border: "1px solid var(--border)" }}>
                      <CardBody style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div className="row gap-16 align-center">
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background: "var(--primary-tint)",
                              color: "var(--primary)",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Shield size={20} />
                          </div>
                          <div>
                            <h4 className="m-0 text-base fw-700 text-1">{enr.employeeName}</h4>
                            <span className="text-xs text-5">
                              {enr.department} · Plan: <strong>{enr.planName}</strong> ({enr.coverageTier})
                            </span>
                          </div>
                        </div>
                        <div className="row gap-24 align-center">
                          <div className="col gap-2 align-end">
                            <span className="text-xs text-4 fw-600">Coverage Effective</span>
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
                    borderRadius: 16,
                    border: "1px dashed var(--border)",
                  }}
                >
                  <UserCheck size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
                  <h3 className="text-base fw-700 text-1 m-0 mb-4">No employees enrolled yet</h3>
                  <p className="text-sm text-4 m-0 mb-20">
                    Enroll team members in health, retirement, or wellness plans to activate benefits.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowEnrollModal(true)}
                    style={{ padding: "10px 24px", borderRadius: 20 }}
                  >
                    Enroll First Employee
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPORTS */}
          {activeTab === "Reports" && (
            <div className="col gap-24">
              <h2 className="text-xl fw-800 text-1 m-0">Benefits Cost & Distribution</h2>
              <div className="grid-2 gap-24">
                <Card style={{ borderRadius: 16, border: "1px solid var(--border)" }}>
                  <CardBody className="p-24 col gap-16">
                    <h3 className="m-0 text-base fw-700 text-1">Plan Distribution</h3>
                    <div className="col gap-12">
                      {plans.map((p) => (
                        <div key={p.id} className="row-between align-center text-sm">
                          <span className="text-2 fw-600">{p.name}</span>
                          <span className="text-1 fw-700">{p.enrolledCount} enrolled</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card style={{ borderRadius: 16, border: "1px solid var(--border)" }}>
                  <CardBody className="p-24 col gap-16">
                    <h3 className="m-0 text-base fw-700 text-1">Monthly Cost Summary</h3>
                    <div className="row-between text-sm pt-8 border-b border-border pb-8">
                      <span className="text-4">Total Active Policies</span>
                      <strong className="text-1">{totalEnrolled}</strong>
                    </div>
                    <div className="row-between text-sm pt-8 border-b border-border pb-8">
                      <span className="text-4">Estimated Monthly Outlay</span>
                      <strong className="text-1">${Math.round(totalMonthlyCost)} USD</strong>
                    </div>
                    <div className="row-between text-sm pt-8">
                      <span className="text-4">Per-Employee Average</span>
                      <strong className="text-1">${avgCostPerEmp} USD / month</strong>
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
              <Select
                value={planForm.category}
                onChange={(e) => setPlanForm({ ...planForm, category: e.target.value })}
              >
                <option value="health">Health & Medical</option>
                <option value="retirement">Retirement & Financial</option>
                <option value="allowance">Meal & Wellness</option>
                <option value="transit">Transit & Commute</option>
                <option value="other">Other Allowance</option>
              </Select>
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
