"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  CheckCircle2,
  Loader2,
  DollarSign,
  Smartphone,
  Wallet,
  Sparkles,
  Edit2,
  ShieldAlert,
  Calculator,
  Receipt,
  Plus,
  Eye,
  Printer,
  Link2,
  CreditCard,
} from "lucide-react";
import { OnboardingLinkModal } from "@/components/people/OnboardingLinkModal";
import { PaymentMethodModal } from "@/components/people/PaymentMethodModal";
import { useAuth } from "@clerk/nextjs";
import { useRole } from "@/context/RoleContext";
import { usePayroll } from "@/context/PayrollContext";
import { formatMoney, PayrollCalculationResult } from "@/utils/payrollEngine";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { EditEmployeeModal } from "@/components/people/EditEmployeeModal";
import { ProfileMeSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";

interface EmployeeProfileData {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string;
  personalPhone?: string;
  status: string;
  departmentId?: string;
  department: string;
  divisionId?: string;
  division: string;
  locationId?: string;
  location: string;
  managerId?: string;
  manager: string;
  jobTitle?: string;
  startDate?: string;
  avatar?: string;
  createdAt: string;

  // Onboarding & Disbursement details
  birthDate?: string;
  bio?: string;
  avatarUrl?: string;
  shirtSize?: string;
  favoriteFood?: string;
  favoriteMovies?: string;
  favoriteMusic?: string;
  coffeeTea?: string;
  funFact?: string;
  paymentMethod?: string;
  bankName?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  mobileMoneyProvider?: string;
  mobileMoneyPhone?: string;
  walletEmail?: string;
  handbookSignedAt?: string;
}

export default function EmployeeProfile() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const [employee, setEmployee] = useState<EmployeeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOnboardingLinkModalOpen, setIsOnboardingLinkModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; firstName: string; lastName: string; jobTitle?: string }[]>([]);

  const {
    getEmployeeCompensation,
    getEmployeeCompensationDetails,
    getEmployeeBonusesPenalties,
    addBonusPenalty,
    deleteBonusPenalty,
    updateBonusPenaltyStatus,
  } = usePayroll();

  const [selectedPayslipModal, setSelectedPayslipModal] = useState<PayrollCalculationResult | null>(null);
  const [isBonusPenaltyModalOpen, setIsBonusPenaltyModalOpen] = useState(false);
  const [isSavingBonusPenalty, setIsSavingBonusPenalty] = useState(false);
  const [bonusPenaltyForm, setBonusPenaltyForm] = useState({
    type: "bonus" as "bonus" | "penalty",
    category: "Performance Bonus",
    amount: "",
    periodMonth: 10,
    periodYear: 2026,
    reason: "",
  });

  const empId = (params?.id as string) || "";
  const currentFullName = employee ? `${employee.firstName} ${employee.lastName}`.trim() : "Team Member";
  const empComp = getEmployeeCompensation(
    empId,
    currentFullName,
    employee?.jobTitle,
    employee?.department,
    employee?.workEmail,
    employee?.employeeNumber
  );
  const employeeBonusesPenalties = getEmployeeBonusesPenalties(empId);
  const compensationRows = getEmployeeCompensationDetails(
    empId,
    currentFullName,
    employee?.jobTitle,
    employee?.department,
    employee?.workEmail,
    employee?.employeeNumber,
    empComp.currency
  );

  const getMonthName = (m: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[m - 1] || `Month ${m}`;
  };

  useEffect(() => {
    getToken().then((token) => {
      if (!token) return;
      Promise.all([
        fetch(`${API_BASE_URL}/api/v1/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/v1/locations`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]).then(async ([deptRes, locRes, empRes]) => {
        if (deptRes.ok) {
          const d = await deptRes.json();
          setDepartments(Array.isArray(d) ? d : d.data || []);
        }
        if (locRes.ok) {
          const l = await locRes.json();
          setLocations(Array.isArray(l) ? l : l.data || []);
        }
        if (empRes.ok) {
          const emps = await empRes.json();
          setManagers(Array.isArray(emps) ? emps : emps.data || []);
        }
      }).catch(() => {});
    });
  }, [getToken]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !params?.id) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/employees/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      }
    } catch (err) {
      console.error("Failed to load employee profile", err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.id, getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleActivate = async () => {
    if (!employee) return;
    setIsActivating(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/employees/${employee.id}/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Employee activated", `${employee.firstName} ${employee.lastName} is now active.`);
        setEmployee({ ...employee, status: "active" });
      } else {
        toast.error("Activation failed", "Server rejected activation.");
      }
    } catch (err) {
      console.error("Failed to activate employee", err);
      toast.error("Network error", "Unable to activate employee.");
    } finally {
      setIsActivating(false);
    }
  };

  const { isHRAdmin, isManager, currentUser } = useRole();

  if (isLoading) {
    return <ProfileMeSkeleton />;
  }

  // Security check: non-admin, non-manager employees are only permitted to view their own profile (/people/me)
  const isOwnProfile = employee && (
    employee.id === currentUser.id ||
    employee.workEmail?.toLowerCase() === currentUser.email?.toLowerCase()
  );

  if (!isHRAdmin && !isManager && !isOwnProfile) {
    return (
      <main style={{ padding: "64px 24px", maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#FEF2F2",
            color: "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl fw-800 text-1 mb-12">Confidential Record</h1>
        <p className="text-sm text-4 mb-24" style={{ lineHeight: 1.6 }}>
          Detailed employment records, compensation, and personal records of colleagues are confidential to HR Administrators and Line Managers.
        </p>
        <div className="row gap-12 justify-center">
          <Link
            href="/people/me"
            className="btn-primary"
            style={{ textDecoration: "none", padding: "10px 20px", borderRadius: 20 }}
          >
            Go to My Profile
          </Link>
          <Link
            href="/people"
            className="btn-secondary"
            style={{ textDecoration: "none", padding: "10px 20px", borderRadius: 20 }}
          >
            Return to Directory
          </Link>
        </div>
      </main>
    );
  }

  if (!employee) {
    return (
      <main style={{ padding: 48, textAlign: "center" }}>
        <h1 className="text-2xl fw-800 text-1 mb-12">Employee record not found</h1>
        <p className="text-base text-4 mb-24">The requested employee profile does not exist or has been removed.</p>
        <Link href="/people" className="btn-primary" style={{ textDecoration: "none" }}>
          Return to directory
        </Link>
      </main>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  const avatarSrc = employee.avatarUrl || employee.avatar;

  return (
    <>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid var(--card-border, #E4E4E7)",
          boxShadow: "0 2px 12px rgba(17, 17, 24, 0.04)",
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <div style={{ height: 4, background: "var(--gradient)" }} />
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 72,
                height: 72,
                minWidth: 72,
                minHeight: 72,
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #FFFFFF",
                boxShadow: "0 4px 14px rgba(17, 17, 24, 0.1), 0 0 0 1px var(--card-border, #E4E4E7)",
                background: "var(--primary-tint, #F5EBFF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={fullName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary, #2563EB)" }}>
                  {employee.firstName.slice(0, 1).toUpperCase()}
                  {employee.lastName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    color: "var(--text-1, #18181B)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  {fullName}
                </h1>

                <StatusPill tone={employee.status === "active" ? "success" : "warning"}>
                  {employee.status ? employee.status.toUpperCase() : "ACTIVE"}
                </StatusPill>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#F4F4F5",
                    color: "var(--text-2, #52525B)",
                    border: "1px solid var(--card-border, #E4E4E7)",
                  }}
                >
                  {employee.employeeNumber}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-2, #52525B)",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {employee.jobTitle || "Team Member"} <span style={{ color: "var(--text-3, #A1A1AA)" }}>·</span>{" "}
                {employee.department}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--text-3, #71717A)",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Building2 size={13} style={{ color: "var(--primary, #2563EB)" }} />
                  <span>{employee.department}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={13} style={{ color: "var(--primary, #2563EB)" }} />
                  <span>{employee.location || "Headquarters"}</span>
                </span>
                {employee.workEmail && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Mail size={13} style={{ color: "var(--primary, #2563EB)" }} />
                    <span>{employee.workEmail}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
            {employee.status === "onboarding" && (
              <>
                <button
                  onClick={() => setIsOnboardingLinkModalOpen(true)}
                  className="btn-secondary btn-sm"
                  title="Generate a fresh non-expired onboarding link (7 days) or resend email"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 9,
                    fontSize: 12,
                    color: "var(--primary, #2563EB)",
                    borderColor: "var(--primary, #2563EB)",
                    fontWeight: 600,
                  }}
                >
                  <Mail size={13.5} />
                  <span>Resend Onboarding Link</span>
                </button>
                <button
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="btn-primary btn-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {isActivating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Activate Employee</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="btn-neutral btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 600,
              }}
              title="Configure or update disbursement payout method (Bank, Mobile Money, etc.)"
            >
              <CreditCard size={13.5} />
              <span>Payment Method</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-neutral btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Edit2 size={13.5} />
              <span>Edit Details</span>
            </button>
            <Link
              href="/people"
              className="btn-neutral btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 9,
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={13.5} />
              <span>Back</span>
            </Link>
          </div>
        </div>
      </div>

      <main style={{ padding: "0 0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) 340px", gap: 20 }}>
          {/* Main Column */}
          <div className="col gap-20">
            <Card>
              <CardBody>
                <SectionHeading
                  title="Employment overview"
                  description="Position, organizational unit, and official record"
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                  <Info icon={<Briefcase />} label="Job title" value={employee.jobTitle || "Not specified"} />
                  <Info
                    icon={<Building2 />}
                    label="Department & division"
                    value={`${employee.department}${employee.division ? ` · ${employee.division}` : ""}`}
                  />
                  <Info icon={<MapPin />} label="Work location" value={employee.location || "Remote"} />
                  <Info icon={<CalendarDays />} label="Hire date" value={employee.startDate || "Recent"} />
                  <Info icon={<ShieldCheck />} label="Employee number" value={employee.employeeNumber || "EMP-PENDING"} />
                  <div style={{ display: "flex", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        display: "grid",
                        placeItems: "center",
                        background: "var(--primary-tint)",
                        color: "var(--primary)",
                      }}
                    >
                      <Clock3 size={18} />
                    </div>
                    <div>
                      <div className="text-xs text-5">Employment status</div>
                      <div className="mt-4">
                        <StatusPill tone={employee.status === "active" ? "success" : "warning"}>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading
                  title="Compliance & Documentation"
                  description="Onboarding documents and verification records"
                />
                <div className="col gap-12">
                  <DataRow
                    leading={<ShieldCheck size={18} color="var(--success)" />}
                    title="Identity & Employment Verification"
                    subtitle="Primary work authorization verified"
                    meta={<StatusPill tone="success">Verified</StatusPill>}
                  />
                  <DataRow
                    leading={<Mail size={18} color="var(--primary)" />}
                    title="Work Email & Identity Access"
                    subtitle={employee.workEmail}
                    meta={<StatusPill tone="success">Active</StatusPill>}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Compensation & Disbursement */}
            <Card>
              <CardBody>
                <div className="row-between mb-16 align-center">
                  <SectionHeading
                    title="Disbursement & Payment Method"
                    description="Designated compensation payout account where wages are transferred"
                  />
                  {(isHRAdmin || isManager || isOwnProfile) && (
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="btn-neutral btn-sm"
                      style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8 }}
                    >
                      <CreditCard size={13} />
                      <span>{employee.paymentMethod || employee.bankName || employee.mobileMoneyProvider ? "Edit Payment Method" : "Add Payment Method"}</span>
                    </button>
                  )}
                </div>
                {employee.paymentMethod || employee.mobileMoneyProvider || employee.bankName ? (
                  <div className="col gap-12">
                    <DataRow
                      leading={
                        employee.paymentMethod === "Mobile Money" ? (
                          <Smartphone size={18} color="var(--primary)" />
                        ) : employee.paymentMethod === "PayPal / Digital Wallet" ? (
                          <Wallet size={18} color="var(--primary)" />
                        ) : (
                          <DollarSign size={18} color="var(--primary)" />
                        )
                      }
                      title={
                        employee.paymentMethod === "Mobile Money"
                          ? `${employee.mobileMoneyProvider || "Mobile Money"} (${employee.mobileMoneyPhone || "Phone registered"})`
                          : employee.paymentMethod === "PayPal / Digital Wallet"
                          ? `PayPal: ${employee.walletEmail || "Wallet on file"}`
                          : employee.bankName
                          ? `${employee.bankName}${employee.bankAccountNumber ? ` · ····${employee.bankAccountNumber.slice(-4)}` : ""}`
                          : employee.paymentMethod || "Direct Deposit"
                      }
                      subtitle={employee.paymentMethod || "Disbursement Channel"}
                      meta={<StatusPill tone="success">Active Disbursement</StatusPill>}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#F8FAFC",
                      borderRadius: 10,
                      border: "1px dashed #CBD5E1",
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
                        No disbursement method configured yet
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                        Set up a bank account (direct deposit), mobile money (MTN / Airtel), or PayPal wallet for automatic payroll payout.
                      </div>
                    </div>
                    {(isHRAdmin || isManager || isOwnProfile) && (
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="btn-primary btn-sm"
                        style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8 }}
                      >
                        <Plus size={13} />
                        <span>Add Payment Method</span>
                      </button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Payroll Compensation, Formula & Payslips (HR Access) */}
            <Card>
              <CardBody>
                <div className="row-between mb-16 align-center">
                  <SectionHeading
                    title="Compensation & Payslips"
                    description={`Contracted model: ${empComp.compensationModel.toUpperCase()} · ${empComp.currency || 'UGX'}`}
                  />
                  <div className="row gap-8">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => setIsBonusPenaltyModalOpen(true)}
                      style={{ fontSize: 12 }}
                    >
                      <Plus size={13} className="mr-4" /> Add Bonus / Penalty
                    </button>
                    <Link
                      href="/payroll"
                      className="btn-neutral btn-sm"
                      style={{ fontSize: 12, textDecoration: "none" }}
                    >
                      <Receipt size={13} className="mr-4" /> Payroll Engine
                    </Link>
                  </div>
                </div>

                {/* Calculation Formula Card */}
                <div
                  style={{
                    background: "#FAFBFB",
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                    padding: "14px 18px",
                    marginBottom: 20,
                    fontSize: 12.5,
                    lineHeight: 1.7,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Calculator size={14} style={{ color: "#475569" }} />
                    <strong style={{ fontSize: 13, color: "var(--text-1)" }}>Active Calculation Formula</strong>
                  </div>
                  <div style={{ color: "#1E293B", fontWeight: 600, marginBottom: 4 }}>
                    {empComp.compensationModel.toUpperCase()} compensation: Total monthly compensation=
                    {empComp.compensationModel === "hourly"
                      ? "Pay rate * Productive hours"
                      : empComp.compensationModel === "monthly_salary"
                      ? "Fixed monthly salary"
                      : empComp.compensationModel === "daily"
                      ? "Daily rate * Eligible payable days"
                      : empComp.compensationModel === "overtime_based"
                      ? "Pay rate * Regular Productive hours + Overtime pay"
                      : "Base Retainer + Commission rules"}
                  </div>
                  <div style={{ color: "#475569", marginBottom: 4 }}>
                    Chargeable Income Gross Total = [Total monthly compensation] + [Total Bonuses] + [Total Higher rates] + [Insurance] - [Total Penalties]
                  </div>
                  <div style={{ color: "#64748B", fontSize: 11.5 }}>
                    Total Bonuses and Total Penalties = please see details in Job section &gt; One time Bonuses &amp; Penalties table.
                  </div>
                </div>

                {/* Compensation Details Table */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>
                    Compensation Details
                  </div>
                  <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
                      <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", textAlign: "left", fontSize: 11.5 }}>
                        <tr>
                          <th style={{ padding: "10px 14px" }}>Month</th>
                          <th style={{ padding: "10px 14px" }}>Year</th>
                          <th style={{ padding: "10px 14px" }}>Productive %</th>
                          <th style={{ padding: "10px 14px" }}>Rate</th>
                          <th style={{ padding: "10px 14px" }}>Gross</th>
                          <th style={{ padding: "10px 14px" }}>Deductions</th>
                          <th style={{ padding: "10px 14px" }}>Net Pay</th>
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compensationRows.map((row) => (
                          <tr key={`${row.periodYear}-${row.periodMonth}`} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 600 }}>{getMonthName(row.periodMonth)}</td>
                            <td style={{ padding: "10px 14px", color: "var(--text-2)" }}>{row.periodYear}</td>
                            <td style={{ padding: "10px 14px", color: "#0F766E", fontWeight: 600 }}>
                              {row.productiveHoursPercent}% ({row.productiveHours}h)
                            </td>
                            <td style={{ padding: "10px 14px" }}>{row.payRateDisplay}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 600 }}>{formatMoney(row.grossPay, row.currency)}</td>
                            <td style={{ padding: "10px 14px", color: "#DC2626" }}>-{formatMoney(row.employeeDeductions, row.currency)}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: "#16A34A" }}>{formatMoney(row.netPay, row.currency)}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => setSelectedPayslipModal(row)}
                                className="btn-neutral btn-sm"
                                style={{ fontSize: 11, padding: "4px 8px" }}
                              >
                                <Eye size={11} className="mr-4" /> View Payslip
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* One-time Bonuses & Penalties Table */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>
                    One-time Bonuses &amp; Penalties (Job Section Integration)
                  </div>
                  <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 640 }}>
                      <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", textAlign: "left", fontSize: 11.5 }}>
                        <tr>
                          <th style={{ padding: "10px 14px" }}>Type</th>
                          <th style={{ padding: "10px 14px" }}>Category</th>
                          <th style={{ padding: "10px 14px" }}>Amount</th>
                          <th style={{ padding: "10px 14px" }}>Month</th>
                          <th style={{ padding: "10px 14px" }}>Reason</th>
                          <th style={{ padding: "10px 14px" }}>Status</th>
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeBonusesPenalties.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: "20px 14px", textAlign: "center", color: "#94A3B8" }}>
                              No one-time adjustments recorded for this employee.
                            </td>
                          </tr>
                        ) : (
                          employeeBonusesPenalties.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  background: item.type === "bonus" ? "#DCFCE7" : "#FEE2E2",
                                  color: item.type === "bonus" ? "#166534" : "#991B1B",
                                  textTransform: "uppercase",
                                }}>
                                  {item.type}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", fontWeight: 600 }}>{item.category}</td>
                              <td style={{ padding: "10px 14px", fontWeight: 700, color: item.type === "bonus" ? "#16A34A" : "#DC2626" }}>
                                {item.type === "bonus" ? "+" : "-"}{formatMoney(item.amount, item.currency)}
                              </td>
                              <td style={{ padding: "10px 14px" }}>{getMonthName(item.periodMonth)} {item.periodYear}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-3)", maxWidth: 180 }}>{item.reason || "—"}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <StatusPill tone={item.status === "approved" ? "success" : item.status === "pending" ? "warning" : "neutral"}>
                                  {item.status.toUpperCase()}
                                </StatusPill>
                              </td>
                              <td style={{ padding: "10px 14px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: 4 }}>
                                  {item.status === "pending" && (
                                    <button
                                      type="button"
                                      onClick={() => updateBonusPenaltyStatus(item.id, "approved")}
                                      className="btn-neutral btn-sm"
                                      style={{ padding: "2px 6px", fontSize: 10.5, color: "#16A34A" }}
                                    >
                                      Approve
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => deleteBonusPenalty(item.id)}
                                    className="btn-neutral btn-sm"
                                    style={{ padding: "2px 6px", fontSize: 10.5, color: "#DC2626" }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Culture & Bio */}
            {(employee.bio || employee.funFact || employee.favoriteFood || employee.favoriteMusic) && (
              <Card>
                <CardBody>
                  <SectionHeading
                    title="About & Culture"
                    description="Fun facts, favorites, and profile bio"
                  />
                  {employee.bio && (
                    <p style={{ fontSize: 13.5, color: "#3F3F46", lineHeight: 1.6, margin: "0 0 16px" }}>
                      {employee.bio}
                    </p>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                    {employee.funFact && (
                      <Detail label="Fun Fact" value={employee.funFact} />
                    )}
                    {employee.favoriteFood && (
                      <Detail label="Favorite Food" value={employee.favoriteFood} />
                    )}
                    {employee.favoriteMusic && (
                      <Detail label="Favorite Music" value={employee.favoriteMusic} />
                    )}
                    {employee.favoriteMovies && (
                      <Detail label="Favorite Movies" value={employee.favoriteMovies} />
                    )}
                    {employee.coffeeTea && (
                      <Detail label="Beverage" value={employee.coffeeTea} />
                    )}
                    {employee.shirtSize && (
                      <Detail label="Shirt Size" value={employee.shirtSize} />
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="col gap-20">
            <Card>
              <CardBody>
                <SectionHeading title="Contact Information" />
                <div className="col gap-12">
                  <DataRow leading={<Mail size={17} />} title={employee.workEmail} subtitle="Work email" />
                  {employee.personalPhone && (
                    <DataRow leading={<Phone size={17} />} title={employee.personalPhone} subtitle="Mobile" />
                  )}
                  {employee.personalEmail && (
                    <DataRow leading={<Mail size={17} />} title={employee.personalEmail} subtitle="Personal email" />
                  )}
                  <DataRow leading={<MapPin size={17} />} title={employee.location || "Remote"} subtitle="Location" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Reporting Line" />
                <Detail label="Manager" value={employee.manager || "No manager assigned"} />
                <Detail label="Department" value={employee.department} />
              </CardBody>
            </Card>
          </div>
        </div>
      </main>

      {employee && (
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => fetchProfile()}
          employee={employee}
          departments={departments}
          locations={locations}
          managers={managers}
        />
      )}

      {/* MODAL: VIEW / PRINT PAYSLIP */}
      {selectedPayslipModal && (
        <Modal
          isOpen={!!selectedPayslipModal}
          onClose={() => setSelectedPayslipModal(null)}
          title={`Official Pay Statement — ${getMonthName(selectedPayslipModal.periodMonth)} ${selectedPayslipModal.periodYear}`}
          width={760}
        >
          <div style={{ padding: "8px 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: 16, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>Helpware / EasyHR</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Corporate Payroll Disbursement Statement</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", marginTop: 6 }}>{selectedPayslipModal.employeeName}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>ID: {empComp.employeeNumber || "#10974"} · {empComp.jobTitle}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <StatusPill tone="success">PAYSLIP FINALIZED</StatusPill>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>Period: {getMonthName(selectedPayslipModal.periodMonth)} {selectedPayslipModal.periodYear}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Currency: {selectedPayslipModal.currency}</div>
              </div>
            </div>

            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 12, marginBottom: 18, border: "1px solid #E2E8F0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12 }}>
              <div>
                <span style={{ color: "#64748B", display: "block" }}>Productive Hours:</span>
                <strong style={{ fontSize: 14, color: "#0F766E" }}>{selectedPayslipModal.productiveHours} hrs ({selectedPayslipModal.productiveHoursPercent}%)</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", display: "block" }}>Approved Overtime:</span>
                <strong style={{ fontSize: 14, color: "var(--text-1)" }}>{selectedPayslipModal.approvedOvertimeHours} hrs</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", display: "block" }}>Days Worked:</span>
                <strong style={{ fontSize: 14, color: "var(--text-1)" }}>{selectedPayslipModal.daysWorked} days</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#166534", marginBottom: 8 }}>Earnings</div>
                <table style={{ width: "100%", fontSize: 12 }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "5px 0" }}>Base Productive Pay</td>
                      <td style={{ padding: "5px 0", textAlign: "right", fontWeight: 600 }}>{formatMoney(selectedPayslipModal.regularCompensation, selectedPayslipModal.currency)}</td>
                    </tr>
                    {selectedPayslipModal.overtimeCompensation > 0 && (
                      <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "5px 0" }}>Overtime Pay</td>
                        <td style={{ padding: "5px 0", textAlign: "right", fontWeight: 600, color: "#16A34A" }}>+{formatMoney(selectedPayslipModal.overtimeCompensation, selectedPayslipModal.currency)}</td>
                      </tr>
                    )}
                    {selectedPayslipModal.bonusesTotal > 0 && (
                      <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "5px 0" }}>Approved Bonuses</td>
                        <td style={{ padding: "5px 0", textAlign: "right", fontWeight: 600, color: "#16A34A" }}>+{formatMoney(selectedPayslipModal.bonusesTotal, selectedPayslipModal.currency)}</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: "2px solid #CBD5E1" }}>
                      <td style={{ padding: "7px 0", fontWeight: 700 }}>Total Gross</td>
                      <td style={{ padding: "7px 0", textAlign: "right", fontWeight: 800 }}>{formatMoney(selectedPayslipModal.grossPay, selectedPayslipModal.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#991B1B", marginBottom: 8 }}>Deductions</div>
                <table style={{ width: "100%", fontSize: 12 }}>
                  <tbody>
                    {selectedPayslipModal.breakdown
                      .filter((b) => !b.isAddition && !b.isEmployerCost)
                      .map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "5px 0" }}>{item.name}</td>
                          <td style={{ padding: "5px 0", textAlign: "right", color: "#DC2626", fontWeight: 600 }}>-{formatMoney(item.amount, selectedPayslipModal.currency)}</td>
                        </tr>
                      ))}
                    <tr style={{ borderTop: "2px solid #CBD5E1" }}>
                      <td style={{ padding: "7px 0", fontWeight: 700, color: "#991B1B" }}>Total Deductions</td>
                      <td style={{ padding: "7px 0", textAlign: "right", fontWeight: 800, color: "#991B1B" }}>-{formatMoney(selectedPayslipModal.employeeDeductions, selectedPayslipModal.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: "#DCFCE7", padding: "14px 18px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Net Take-Home Pay</div>
                <div style={{ fontSize: 11, color: "#15803D" }}>Approved for disbursement</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#15803D" }}>
                {formatMoney(selectedPayslipModal.netPay, selectedPayslipModal.currency)}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn-neutral btn-sm" onClick={() => setSelectedPayslipModal(null)}>Close</button>
              <button type="button" className="btn-primary btn-sm" onClick={() => window.print()}>
                <Printer size={13} className="mr-4" /> Print / Save PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ADD ONE-TIME BONUS / PENALTY */}
      {isBonusPenaltyModalOpen && (
        <Modal
          isOpen={isBonusPenaltyModalOpen}
          onClose={() => setIsBonusPenaltyModalOpen(false)}
          title={`Record One-time Adjustment — ${fullName}`}
          width={480}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Number(bonusPenaltyForm.amount);
              if (!amt || amt <= 0) {
                toast.error("Invalid amount", "Enter a positive number.");
                return;
              }
              setIsSavingBonusPenalty(true);
              try {
                addBonusPenalty({
                  employeeId: empId,
                  employeeName: fullName,
                  type: bonusPenaltyForm.type,
                  category: bonusPenaltyForm.category,
                  amount: amt,
                  currency: empComp.currency || "UGX",
                  periodMonth: bonusPenaltyForm.periodMonth,
                  periodYear: bonusPenaltyForm.periodYear,
                  reason: bonusPenaltyForm.reason,
                  status: "approved",
                  addedBy: "HR Administrator",
                });
                setIsBonusPenaltyModalOpen(false);
                setBonusPenaltyForm({
                  type: "bonus",
                  category: "Performance Bonus",
                  amount: "",
                  periodMonth: 10,
                  periodYear: 2026,
                  reason: "",
                });
              } finally {
                setIsSavingBonusPenalty(false);
              }
            }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setBonusPenaltyForm({ ...bonusPenaltyForm, type: "bonus", category: "Performance Bonus" })}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: bonusPenaltyForm.type === "bonus" ? "2px solid #16A34A" : "1px solid #E4E4E7",
                    background: bonusPenaltyForm.type === "bonus" ? "#F0FDF4" : "#FFFFFF",
                    fontWeight: 600,
                    fontSize: 12,
                    color: bonusPenaltyForm.type === "bonus" ? "#166534" : "#52525B",
                    cursor: "pointer",
                  }}
                >
                  + Bonus
                </button>
                <button
                  type="button"
                  onClick={() => setBonusPenaltyForm({ ...bonusPenaltyForm, type: "penalty", category: "Unpaid Absence Adjustment" })}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: bonusPenaltyForm.type === "penalty" ? "2px solid #DC2626" : "1px solid #E4E4E7",
                    background: bonusPenaltyForm.type === "penalty" ? "#FEF2F2" : "#FFFFFF",
                    fontWeight: 600,
                    fontSize: 12,
                    color: bonusPenaltyForm.type === "penalty" ? "#991B1B" : "#52525B",
                    cursor: "pointer",
                  }}
                >
                  - Penalty / Deduction
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Category</label>
              <select
                className="select"
                value={bonusPenaltyForm.category}
                onChange={(e) => setBonusPenaltyForm({ ...bonusPenaltyForm, category: e.target.value })}
              >
                {bonusPenaltyForm.type === "bonus" ? (
                  <>
                    <option value="Performance Bonus">Performance Bonus</option>
                    <option value="Attendance Bonus">Attendance Bonus</option>
                    <option value="Signing Bonus">Signing Bonus</option>
                    <option value="Customer Satisfaction Spiff">Customer Satisfaction Spiff</option>
                    <option value="Discretionary Bonus">Discretionary Bonus</option>
                  </>
                ) : (
                  <>
                    <option value="Unpaid Absence Adjustment">Unpaid Absence Adjustment</option>
                    <option value="Salary Advance Repayment">Salary Advance Repayment</option>
                    <option value="Equipment Damage / Loss">Equipment Damage / Loss</option>
                    <option value="Authorized Other Deduction">Authorized Other Deduction</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Amount ({empComp.currency || 'UGX'})</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 250000"
                  value={bonusPenaltyForm.amount}
                  onChange={(e) => setBonusPenaltyForm({ ...bonusPenaltyForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Month</label>
                <select
                  className="select"
                  value={bonusPenaltyForm.periodMonth}
                  onChange={(e) => setBonusPenaltyForm({ ...bonusPenaltyForm, periodMonth: Number(e.target.value) })}
                >
                  <option value={10}>October 2026</option>
                  <option value={9}>September 2026</option>
                  <option value={8}>August 2026</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 650, color: "#3F3F46" }}>Reason / Notes</label>
              <textarea
                className="textarea"
                placeholder="Audit justification..."
                value={bonusPenaltyForm.reason}
                onChange={(e) => setBonusPenaltyForm({ ...bonusPenaltyForm, reason: e.target.value })}
                style={{ minHeight: 60 }}
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="btn-neutral"
                onClick={() => setIsBonusPenaltyModalOpen(false)}
                disabled={isSavingBonusPenalty}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSavingBonusPenalty}>
                {isSavingBonusPenalty ? <Loader2 size={14} className="animate-spin" /> : "Save to Payroll"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {employee && (
        <>
          <OnboardingLinkModal
            isOpen={isOnboardingLinkModalOpen}
            onClose={() => setIsOnboardingLinkModalOpen(false)}
            employeeId={employee.id}
            employeeName={`${employee.firstName} ${employee.lastName}`}
            employeeEmail={employee.personalEmail || employee.workEmail}
          />
          <PaymentMethodModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onSuccess={() => fetchProfile()}
            employeeId={employee.id}
            employeeName={`${employee.firstName} ${employee.lastName}`}
            initialData={{
              paymentMethod: employee.paymentMethod,
              bankName: employee.bankName,
              bankAccountNumber: employee.bankAccountNumber,
              bankRoutingNumber: employee.bankRoutingNumber,
              mobileMoneyProvider: employee.mobileMoneyProvider,
              mobileMoneyPhone: employee.mobileMoneyPhone,
              walletEmail: employee.walletEmail,
            }}
          />
        </>
      )}
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          display: "grid",
          placeItems: "center",
          background: "var(--primary-tint)",
          color: "var(--primary)",
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs text-5">{label}</div>
        <div className="text-sm fw-700 text-1">{value}</div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="row-between" style={{ padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
      <span className="text-xs text-4">{label}</span>
      <strong className="text-sm text-1">{value}</strong>
    </div>
  );
}
