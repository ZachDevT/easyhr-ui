"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState, useCallback, useMemo } from "react";
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
  Sun,
  Shield,
  Coffee,
  Heart,
  Target,
  Star,
  Stethoscope,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { OnboardingLinkModal } from "@/components/people/OnboardingLinkModal";
import { PaymentMethodModal } from "@/components/people/PaymentMethodModal";
import { CalculationFormulaModal } from "@/components/payroll/CalculationFormulaModal";
import { useAuth } from "@clerk/nextjs";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/context/RoleContext";
import { usePayroll } from "@/context/PayrollContext";
import { formatMoney, PayrollCalculationResult } from "@/utils/payrollEngine";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { EditEmployeeModal } from "@/components/people/EditEmployeeModal";
import { ProfileMeSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ProfileSectionCard } from "@/components/people/ProfileSectionCard";
import { EmployeePayslipsTable } from "@/components/payroll/EmployeePayslipsTable";
import { EmployeeDocumentList } from "@/components/documents/EmployeeDocumentList";
import { WeeklyTimesheet } from "@/components/time/WeeklyTimesheet";

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
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  administrativeArea?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  paymentMethod?: string;
  bankName?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  mobileMoneyProvider?: string;
  mobileMoneyPhone?: string;
  walletEmail?: string;
  handbookSignedAt?: string;
}

const ALL_TABS = [
  "Personal",
  "Job",
  "Payslips",
  "Timesheet",
  "Time Off",
  "Documents",
  "Pay Info",
  "Benefits",
  "Performance",
  "Emergency",
];

export default function EmployeeProfile() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const {
    getEmployeeCompensation,
    getEmployeeCompensationDetails,
    getEmployeeBonusesPenalties,
    addBonusPenalty,
    deleteBonusPenalty,
    updateBonusPenaltyStatus,
    settings,
  } = usePayroll();

  const canViewPayslips = settings?.showPayslipsTabToEmployees !== false;
  const dynamicTabs = useMemo(() => {
    return canViewPayslips ? ALL_TABS : ALL_TABS.filter((t) => t !== "Payslips");
  }, [canViewPayslips]);

  const [activeTab, setActiveTab] = useState<string>("Personal");
  const [isFormulaHelpOpen, setIsFormulaHelpOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (tab && dynamicTabs.includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [dynamicTabs]);

  useEffect(() => {
    if (activeTab === "Payslips" && !canViewPayslips) {
      setActiveTab("Personal");
    }
  }, [activeTab, canViewPayslips]);

  const { company } = useCompany();
  const [employee, setEmployee] = useState<EmployeeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOnboardingLinkModalOpen, setIsOnboardingLinkModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; firstName: string; lastName: string; jobTitle?: string }[]>([]);
  const [benefitPlans, setBenefitPlans] = useState<any[]>([]);
  const [benefitEnrollments, setBenefitEnrollments] = useState<any[]>([]);

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
      const headers = { Authorization: `Bearer ${token}` };
      Promise.all([
        fetch(`${API_BASE_URL}/api/v1/departments`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/locations`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/benefits/plans`, { headers }),
      ]).then(async ([deptRes, locRes, empRes, planRes]) => {
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
        if (planRes && planRes.ok) {
          const p = await planRes.json();
          if (Array.isArray(p)) setBenefitPlans(p);
        }
      }).catch(() => {});

      if (params?.id) {
        fetch(`${API_BASE_URL}/api/v1/benefits/enrollments/${params.id}`, { headers })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (Array.isArray(data)) setBenefitEnrollments(data);
          })
          .catch(() => {});
      }
    });
  }, [getToken, params?.id]);

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
  const isOnboarding = Boolean(
    employee && (
      employee.status?.toLowerCase().includes("onboard") ||
      employee.status?.toLowerCase() === "new" ||
      employee.status?.toLowerCase() === "pending"
    )
  );

  return (
    <>
      {/* REUSABLE PAGE HEADER WITH INTEGRATED TABS & AVATAR */}
      <PageHeader
        icon={
          avatarSrc ? (
            <img
              src={avatarSrc}
              alt={fullName}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                objectFit: "cover",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.2)",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {employee.firstName.slice(0, 1).toUpperCase()}
              {employee.lastName.slice(0, 1).toUpperCase()}
            </div>
          )
        }
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>{fullName}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                background: employee.status === "active" ? "#10B981" : "#F59E0B",
                color: "#FFFFFF",
              }}
            >
              {employee.status ? employee.status.toUpperCase() : "ACTIVE"}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(255, 255, 255, 0.18)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
              }}
            >
              {employee.employeeNumber || "EMP-0001"}
            </span>
          </div>
        }
        subtitle={`${employee.jobTitle || "Team Member"} · ${employee.department || "General"} · ${employee.location || "Remote"}${employee.workEmail ? ` · ${employee.workEmail}` : ""}`}
        tabs={dynamicTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {isOnboarding && (
              <>
                <button
                  type="button"
                  onClick={() => setIsOnboardingLinkModalOpen(true)}
                  className="btn-secondary btn-sm"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#FFFFFF",
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "7px 13px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  title="Generate a fresh non-expired onboarding link (7 days) or resend email"
                >
                  <Mail size={13} className="mr-4" /> Resend Link
                </button>
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="btn-primary btn-sm"
                  style={{
                    background: "#FFFFFF",
                    color: "var(--primary)",
                    border: "none",
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {isActivating ? <Loader2 size={13} className="animate-spin mr-4" /> : <CheckCircle2 size={13} className="mr-4" />}
                  Activate
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="btn-secondary btn-sm"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "7px 13px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
              }}
              title="Configure or update disbursement payout method"
            >
              <CreditCard size={13} className="mr-4" /> Payment Method
            </button>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="btn-secondary btn-sm"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "7px 13px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
              }}
              title="Edit job title, department, location, or personal details"
            >
              <Edit2 size={13} className="mr-4" /> Edit Details
            </button>
            <Link
              href="/people"
              className="btn-secondary btn-sm"
              style={{
                background: "#FFFFFF",
                color: "var(--primary)",
                border: "none",
                padding: "7px 13px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <ArrowLeft size={13} /> Directory
            </Link>
          </div>
        }
      />

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <main style={{ padding: "0 0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: activeTab === "Personal" ? "280px minmax(0, 1fr)" : "1fr", gap: 20, alignItems: "start" }}>
          {/* LEFT COLUMN: OFFICIAL VITALS & STATUS (Only shown on Personal tab) */}
          {activeTab === "Personal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <CardBody style={{ padding: 20 }}>
                <h3
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-3, #71717A)",
                    margin: "0 0 14px 0",
                  }}
                >
                  Official Vitals
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-2, #52525B)",
                        flexShrink: 0,
                      }}
                    >
                      <Phone size={13} />
                    </div>
                    <span style={{ color: "var(--text-1)" }}>{employee.personalPhone || "No phone added"}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-2, #52525B)",
                        flexShrink: 0,
                      }}
                    >
                      <Mail size={13} />
                    </div>
                    <span
                      style={{
                        color: "var(--text-1)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {employee.workEmail}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-2, #52525B)",
                        flexShrink: 0,
                      }}
                    >
                      <Clock3 size={13} />
                    </div>
                    <span style={{ color: "var(--text-1)" }}>
                      {employee.status === "active" ? "Active Full-time" : "Completing Onboarding"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-2, #52525B)",
                        flexShrink: 0,
                      }}
                    >
                      <MapPin size={13} />
                    </div>
                    <span style={{ color: "var(--text-1)" }}>{employee.location || "Remote"}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-2, #52525B)",
                        flexShrink: 0,
                      }}
                    >
                      <UserRound size={13} />
                    </div>
                    <span style={{ color: "var(--text-1)" }}>Manager: {employee.manager || "Executive"}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: "#FAF9F7",
                        border: "1px solid var(--card-border, #E4E4E7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-2, #52525B)",
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={13} />
                    </div>
                    <span style={{ color: "var(--text-1)" }}>{employee.department}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {isOnboarding && (
              <Card>
                <CardBody style={{ padding: 18, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Sparkles size={16} style={{ color: "var(--primary)" }} />
                    <strong style={{ fontSize: 13, color: "#1E40AF" }}>Onboarding in Progress</strong>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#2563EB", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                    Employee hasn&apos;t finalized onboarding yet. You can resend their 7-day magic link or activate directly.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setIsOnboardingLinkModalOpen(true)}
                      className="btn-primary btn-sm"
                      style={{ width: "100%", justifyContent: "center", fontSize: 11.5 }}
                    >
                      <Mail size={12} className="mr-4" /> Resend Onboarding Link
                    </button>
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={isActivating}
                      className="btn-neutral btn-sm"
                      style={{ width: "100%", justifyContent: "center", fontSize: 11.5 }}
                    >
                      {isActivating ? <Loader2 size={12} className="animate-spin mr-4" /> : <CheckCircle2 size={12} className="mr-4" />}
                      Activate Account
                    </button>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Quick Payment Channel Card */}
            <Card>
              <CardBody style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h4 style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", margin: 0 }}>
                    Payout Method
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 11.5, fontWeight: 600 }}
                  >
                    Edit
                  </button>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)" }}>
                  {employee.paymentMethod || employee.bankName || employee.mobileMoneyProvider || "Not configured yet"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                  {employee.mobileMoneyPhone || employee.bankAccountNumber ? `Account: ${employee.mobileMoneyPhone || employee.bankAccountNumber}` : "Click Edit to set destination"}
                </div>
              </CardBody>
            </Card>
          </div>
          )}

          {/* RIGHT COLUMN: ACTIVE TAB CONTENT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* TAB: PERSONAL */}
            {activeTab === "Personal" && (
              <>
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="Contact Information"
                        description="Direct contact details and personal communication channels"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8 }}
                      >
                        <Edit2 size={12} />
                        <span>Edit Details</span>
                      </button>
                    </div>
                    <div className="col gap-12">
                      <DataRow leading={<Mail size={17} color="var(--primary)" />} title={employee.workEmail} subtitle="Work email (Official account)" />
                      <DataRow leading={<Mail size={17} />} title={employee.personalEmail || "Not provided"} subtitle="Personal email" />
                      <DataRow leading={<Phone size={17} />} title={employee.personalPhone || "Not provided"} subtitle="Mobile phone number" />
                      <DataRow leading={<MapPin size={17} />} title={employee.location || "Remote"} subtitle="Work location" />
                    </div>
                  </CardBody>
                </Card>

                {/* About & Culture */}
                <Card>
                  <CardBody>
                    <SectionHeading
                      title="About & Culture"
                      description="Personal bio, preferences, and workplace culture details"
                    />
                    <p style={{ fontSize: 13.5, color: "#3F3F46", lineHeight: 1.6, margin: "0 0 16px" }}>
                      {employee.bio || "No personal bio written yet."}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                      <Detail label="Fun Fact" value={employee.funFact || "Not specified"} />
                      <Detail label="Favorite Food" value={employee.favoriteFood || "Not specified"} />
                      <Detail label="Favorite Music" value={employee.favoriteMusic || "Not specified"} />
                      <Detail label="Favorite Movies" value={employee.favoriteMovies || "Not specified"} />
                      <Detail label="Beverage" value={employee.coffeeTea || "Not specified"} />
                      <Detail label="Shirt Size" value={employee.shirtSize || "Not specified"} />
                    </div>
                  </CardBody>
                </Card>

                {/* Emergency Contact Summary */}
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="Emergency Contact"
                        description="Designated emergency notification contact"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="col gap-10">
                      <Detail label="Contact Name" value={employee.emergencyContactName || "Not configured"} />
                      <Detail label="Relationship" value={employee.emergencyContactRelationship || "Family / Next of Kin"} />
                      <Detail label="Phone Number" value={employee.emergencyContactPhone || employee.personalPhone || "—"} />
                    </div>
                  </CardBody>
                </Card>
              </>
            )}

            {/* TAB: JOB */}
            {activeTab === "Job" && (
              <>
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="Employment Overview"
                        description="Position, organizational unit, and official record"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8 }}
                      >
                        <Edit2 size={12} />
                        <span>Edit Details</span>
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                      <Info icon={<Briefcase />} label="Job title" value={employee.jobTitle || "Not specified"} />
                      <Info
                        icon={<Building2 />}
                        label="Department & division"
                        value={`${employee.department}${employee.division ? ` · ${employee.division}` : ""}`}
                      />
                      <Info icon={<MapPin />} label="Work location" value={employee.location || "Remote"} />
                      <Info icon={<CalendarDays />} label="Hire date" value={employee.startDate || "Recent"} />
                      <Info icon={<ShieldCheck />} label="Employee number" value={employee.employeeNumber || "EMP-0001"} />
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
                    <div className="row-between mb-16 align-center">
                      <SectionHeading title="Reporting Line & Unit" description="Managerial hierarchy and supervisor assignment" />
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Edit2 size={12} />
                        <span>Edit Manager</span>
                      </button>
                    </div>
                    <Detail label="Direct Manager" value={employee.manager || "No manager assigned"} />
                    <Detail label="Department" value={employee.department} />
                    <Detail label="Division" value={employee.division || "Standard Operations"} />
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <SectionHeading title="Standard Schedule & Policy Terms" description="Agreed work calendar and overtime rules" />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                      <Detail label="Work Schedule" value="Standard 40 hrs/week (8 hrs/day)" />
                      <Detail label="Standard Monthly Hours" value="173.33 hours" />
                      <Detail label="Overtime Policy" value="1.5× Regular Hourly Rate" />
                      <Detail label="Holiday Policy" value="2.0× Rest Day Multiplier" />
                    </div>
                  </CardBody>
                </Card>
              </>
            )}

            {/* TAB: PAY INFO */}
            {activeTab === "Pay Info" && (
              <>
                {/* Contracted Compensation Model Card */}
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <div>
                        <SectionHeading
                          title="Contracted Compensation Model"
                          description="Baseline rate, pay cycle, and overtime terms configured in payroll"
                        />
                      </div>
                      <Link
                        href="/payroll"
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Receipt size={13} />
                        <span>Manage in Payroll Engine</span>
                      </Link>
                    </div>

                    <div
                      style={{
                        background: "#FAF9F7",
                        borderRadius: 12,
                        border: "1px solid var(--card-border, #E4E4E7)",
                        padding: "18px 20px",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 16,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 11.5, color: "var(--text-3)", display: "block" }}>Compensation Model</span>
                        <Badge variant={empComp.compensationModel === "hourly" ? "warning" : "neutral"}>
                          {empComp.compensationModel === "hourly" ? "HOURLY" : "SALARIED"}
                        </Badge>
                        <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>
                          {empComp.compensationModel === "hourly" ? "Pay rate × Productive hours" : "Fixed Monthly Base Salary"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: 11.5, color: "var(--text-3)", display: "block" }}>Contracted Base Amount</span>
                        <strong style={{ fontSize: 17, color: "var(--text-1)" }}>
                          {formatMoney(empComp.baseSalary || 2000000, empComp.currency || "UGX")}
                        </strong>
                        <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>
                          {empComp.compensationModel === "hourly" ? "Per hour worked" : "Per calendar month"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: 11.5, color: "var(--text-3)", display: "block" }}>Standard Monthly Hours</span>
                        <strong style={{ fontSize: 17, color: "var(--text-1)" }}>173.33 hrs</strong>
                        <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>Contracted baseline</div>
                      </div>

                      <div>
                        <span style={{ fontSize: 11.5, color: "var(--text-3)", display: "block" }}>Payroll Jurisdiction</span>
                        <strong style={{ fontSize: 17, color: "var(--primary)" }}>Uganda (UGX)</strong>
                        <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>PAYE &amp; NSSF compliant</div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Disbursement & Payment Method Card */}
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="Disbursement & Payment Method"
                        description="Designated compensation payout account where wages are transferred"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8 }}
                      >
                        <CreditCard size={13} />
                        <span>{employee.paymentMethod || employee.bankName || employee.mobileMoneyProvider ? "Edit Payment Method" : "Add Payment Method"}</span>
                      </button>
                    </div>

                    {employee.paymentMethod || employee.mobileMoneyProvider || employee.bankName ? (
                      <div className="col gap-12">
                        <DataRow
                          leading={
                            employee.paymentMethod === "Mobile Money" ? (
                              <Smartphone size={20} color="var(--primary)" />
                            ) : employee.paymentMethod === "PayPal / Digital Wallet" ? (
                              <Wallet size={20} color="var(--primary)" />
                            ) : (
                              <DollarSign size={20} color="var(--primary)" />
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
                          subtitle={employee.paymentMethod || "Official Disbursement Channel"}
                          meta={<StatusPill tone="success">Active Disbursement</StatusPill>}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          background: "#F8FAFC",
                          borderRadius: 10,
                          border: "1px dashed #CBD5E1",
                          padding: "20px 24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
                            No disbursement payout method configured yet
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                            Set up a bank account (direct deposit), mobile money (MTN / Airtel), or PayPal wallet for automatic payroll payout.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="btn-primary btn-sm"
                          style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          <Plus size={13} />
                          <span>Add Payment Method</span>
                        </button>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* One-time Bonuses & Penalties */}
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="One-time Bonuses &amp; Penalties"
                        description="Performance additions, shift bonuses, and authorized deductions"
                      />
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => setIsBonusPenaltyModalOpen(true)}
                        style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Plus size={13} />
                        <span>Add Bonus / Penalty</span>
                      </button>
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
                              <td colSpan={7} style={{ padding: "24px 14px", textAlign: "center", color: "#94A3B8" }}>
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
                  </CardBody>
                </Card>
              </>
            )}

            {/* TAB: PAYSLIPS */}
            {activeTab === "Payslips" && (
              <EmployeePayslipsTable
                employeeId={params.id}
                actions={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setIsFormulaHelpOpen(true)}
                      style={{
                        background: "#F5F5F7",
                        border: "1px solid #E5E5EA",
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#636366",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      <HelpCircle size={13} />
                      <span>Formula</span>
                    </button>
                    <Link
                      href="/payroll"
                      className="btn-neutral btn-sm"
                      style={{ fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <Receipt size={13} />
                      <span>Payroll Runs Archive</span>
                    </Link>
                  </div>
                }
              />
            )}

            {/* TAB: TIMESHEET */}
            {activeTab === "Timesheet" && (
              <WeeklyTimesheet employeeId={params.id} allowManualEntry />
            )}

            {/* TAB: DOCUMENTS */}
            {activeTab === "Documents" && (
              <EmployeeDocumentList
                employeeId={params.id}
                handbookSignedAt={employee.handbookSignedAt}
              />
            )}

            {/* TAB: TIME OFF */}
            {activeTab === "Time Off" && (
              <>
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="Leave Balances &amp; Entitlements"
                        description={`Allocated vacation, sick days, and statutory leave for ${fullName}`}
                      />
                      <Link
                        href="/time-off"
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Calendar size={13} />
                        <span>Manage in Time Off Hub</span>
                      </Link>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
                      {/* Annual Leave */}
                      <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#FFF8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Sun size={14} color="#FF9500" />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>Annual Vacation</span>
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#F5F5F7", color: "#86868B" }}>ANNUAL</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F" }}>21</span>
                          <span style={{ fontSize: 12.5, color: "#86868B" }}>days available</span>
                        </div>
                        <div style={{ height: 4, background: "#F0F0F2", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ height: "100%", width: "15%", background: "var(--primary, #0071E3)", borderRadius: 2 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B" }}>
                          <span>Used: 0d</span>
                          <span>Allowance: 21d</span>
                        </div>
                      </div>

                      {/* Sick Leave */}
                      <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Shield size={14} color="#34C759" />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>Sick Leave</span>
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#F5F5F7", color: "#86868B" }}>SICK</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F" }}>10</span>
                          <span style={{ fontSize: 12.5, color: "#86868B" }}>days available</span>
                        </div>
                        <div style={{ height: 4, background: "#F0F0F2", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ height: "100%", width: "5%", background: "#34C759", borderRadius: 2 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B" }}>
                          <span>Used: 0d</span>
                          <span>Allowance: 10d</span>
                        </div>
                      </div>

                      {/* Casual / Personal */}
                      <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Coffee size={14} color="#5856D6" />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>Casual &amp; Personal</span>
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#F5F5F7", color: "#86868B" }}>CASUAL</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F" }}>5</span>
                          <span style={{ fontSize: 12.5, color: "#86868B" }}>days available</span>
                        </div>
                        <div style={{ height: 4, background: "#F0F0F2", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ height: "100%", width: "5%", background: "#5856D6", borderRadius: 2 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B" }}>
                          <span>Used: 0d</span>
                          <span>Allowance: 5d</span>
                        </div>
                      </div>

                      {/* Compassionate / Family */}
                      <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#FFF0F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Heart size={14} color="#FF2D55" />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>Compassionate</span>
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#F5F5F7", color: "#86868B" }}>COMP</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F" }}>4</span>
                          <span style={{ fontSize: 12.5, color: "#86868B" }}>days available</span>
                        </div>
                        <div style={{ height: 4, background: "#F0F0F2", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ height: "100%", width: "5%", background: "#FF2D55", borderRadius: 2 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B" }}>
                          <span>Used: 0d</span>
                          <span>Allowance: 4d</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <SectionHeading
                      title="Recent Leave Requests"
                      description="Leave request records and approval status"
                    />
                    <div style={{ padding: "28px 20px", textAlign: "center", background: "#FAFAFC", border: "1px solid #E5E5EA", borderRadius: 10, marginTop: 12 }}>
                      <Calendar size={22} color="#86868B" style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>No active leave requests submitted</div>
                      <div style={{ fontSize: 11.5, color: "#86868B", marginTop: 4 }}>
                        When employee submits PTO or sick leave requests, they will appear here for review and manager sign-off.
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </>
            )}

            {/* TAB: PERFORMANCE */}
            {activeTab === "Performance" && (
              <>
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="Performance &amp; OKR Objectives"
                        description={`Strategic goals and milestone targets for ${fullName}`}
                      />
                      <Link
                        href="/performance"
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Target size={13} />
                        <span>Performance Hub</span>
                      </Link>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                      <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 650, color: "#1D1D1F" }}>Q4 Operational Excellence</span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#F5F5F7", color: "#1D1D1F" }}>IN PROGRESS</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#636366", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                          Achieve key organizational milestones and delivery standards across active client projects.
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B", marginBottom: 4 }}>
                          <span>Completion</span>
                          <span style={{ fontWeight: 600, color: "#1D1D1F" }}>65%</span>
                        </div>
                        <div style={{ height: 4, background: "#F0F0F2", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "65%", background: "var(--primary, #0071E3)", borderRadius: 2 }} />
                        </div>
                      </div>

                      <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 650, color: "#1D1D1F" }}>Process Innovation &amp; Quality</span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#E8F5E9", color: "#2E7D32" }}>ACHIEVED</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#636366", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                          Successfully streamlined operational protocols and improved turnaround times.
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B", marginBottom: 4 }}>
                          <span>Completion</span>
                          <span style={{ fontWeight: 600, color: "#1D1D1F" }}>100%</span>
                        </div>
                        <div style={{ height: 4, background: "#F0F0F2", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "100%", background: "#34C759", borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </>
            )}

            {/* TAB: BENEFITS */}
            {activeTab === "Benefits" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Active Enrolled Policies */}
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="Enrolled Benefits &amp; Policies"
                        description={`Active corporate medical, pension, and life coverage assigned to ${fullName}`}
                      />
                      <Link
                        href="/benefits"
                        className="btn-neutral btn-sm"
                        style={{ fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Stethoscope size={13} />
                        <span>Benefits Administration</span>
                      </Link>
                    </div>

                    {benefitEnrollments.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                        {benefitEnrollments.map((enr: any) => (
                          <div
                            key={enr.id}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #E5E5EA",
                              borderRadius: 12,
                              padding: "16px 18px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Stethoscope size={16} color="var(--primary, #0071E3)" />
                                <span style={{ fontSize: 13.5, fontWeight: 650, color: "#1D1D1F" }}>{enr.planName}</span>
                              </div>
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#E8F5E9", color: "#2E7D32" }}>
                                {(enr.status || "ACTIVE").toUpperCase()}
                              </span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, borderTop: "1px solid #F0F0F2", paddingTop: 8 }}>
                              <div>
                                <span style={{ color: "#86868B", display: "block", fontSize: 11 }}>Coverage Tier</span>
                                <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{(enr.coverageTier || "Individual").toUpperCase()}</span>
                              </div>
                              <div>
                                <span style={{ color: "#86868B", display: "block", fontSize: 11 }}>Effective Date</span>
                                <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{enr.effectiveFrom || "Active"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "28px 20px", border: "1px solid #E5E5EA", borderRadius: 10, background: "#FAFAFC" }}>
                        <Heart size={22} color="#86868B" style={{ margin: "0 auto 8px" }} />
                        <span style={{ fontSize: 12.5, color: "#86868B", display: "block" }}>
                          No individual benefit policies enrolled yet for {fullName}. See organization plans below.
                        </span>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* Organization Available Offerings */}
                <Card>
                  <CardBody>
                    <div className="row-between mb-16 align-center">
                      <SectionHeading
                        title="Available Company Offerings"
                        description="Comprehensive benefits catalog provided by the organization"
                      />
                    </div>

                    {benefitPlans.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                        {benefitPlans.map((pl: any) => {
                          const isEnrolled = benefitEnrollments.some((e: any) => e.planId === pl.id || e.plan_id === pl.id);
                          const costDisplay = pl.employerCostMinor ? `${formatMoney(pl.employerCostMinor, pl.currency)}/mo` : "Company Paid";
                          const empCostDisplay = pl.employeeCostMinor > 0 ? `${formatMoney(pl.employeeCostMinor, pl.currency)}/mo` : "Fully Employer Covered";
                          return (
                            <div
                              key={pl.id}
                              style={{
                                background: "#FFFFFF",
                                border: "1px solid #E5E5EA",
                                borderRadius: 12,
                                padding: "16px 18px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                <div>
                                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{pl.name}</h4>
                                  <span style={{ fontSize: 10.5, fontWeight: 650, color: "#6E6E73", background: "#F2F2F7", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 4 }}>
                                    {(pl.category || "General").toUpperCase()} · {pl.currency || "UGX"}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    background: isEnrolled ? "#DCFCE7" : "#F4F4F5",
                                    color: isEnrolled ? "#15803D" : "#52525B",
                                  }}
                                >
                                  {isEnrolled ? "ENROLLED" : "AVAILABLE"}
                                </span>
                              </div>

                              {pl.description && (
                                <p style={{ fontSize: 12, color: "#6E6E73", margin: 0, lineHeight: 1.5 }}>
                                  {pl.description}
                                </p>
                              )}

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5, borderTop: "1px solid #F0F0F2", paddingTop: 8 }}>
                                <div>
                                  <span style={{ color: "#8E8E93", display: "block", fontSize: 10.5 }}>Employer Outlay</span>
                                  <strong style={{ color: "#1D1D1F" }}>{costDisplay}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "#8E8E93", display: "block", fontSize: 10.5 }}>Employee Share</span>
                                  <strong style={{ color: "#1D1D1F" }}>{empCostDisplay}</strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "24px 20px", border: "1px solid #E5E5EA", borderRadius: 10, background: "#FAFAFC" }}>
                        <span style={{ fontSize: 12.5, color: "#86868B" }}>Company comprehensive medical, life, and NSSF pension policies are active.</span>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}

            {/* TAB: EMERGENCY */}
            {activeTab === "Emergency" && (
              <Card>
                <CardBody>
                  <div className="row-between mb-16 align-center">
                    <SectionHeading
                      title="Emergency Contacts"
                      description="Primary and secondary emergency contacts in case of urgent incidents"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="btn-neutral btn-sm"
                      style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <Edit2 size={12} />
                      <span>Edit Emergency Info</span>
                    </button>
                  </div>
                  <div className="col gap-12">
                    <Detail label="Primary Contact Name" value={employee.emergencyContactName || "Not configured yet"} />
                    <Detail label="Relationship" value={employee.emergencyContactRelationship || "Family / Next of Kin"} />
                    <Detail label="Emergency Phone" value={employee.emergencyContactPhone || employee.personalPhone || "Not configured"} />
                  </div>
                </CardBody>
              </Card>
            )}
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
          <div style={{ padding: "4px" }}>
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #F0F0F2", paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>{company?.name || "Gitop"}</div>
                <div style={{ fontSize: 12, color: "#86868B" }}>Pay Statement · {selectedPayslipModal.employeeName}</div>
                <div style={{ fontSize: 11.5, color: "#86868B", marginTop: 2 }}>{empComp.jobTitle} {empComp.employeeNumber ? `· ${empComp.employeeNumber}` : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F5F5F7", color: "#1D1D1F", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary, #2563EB)" }} />
                  <span>Paid &amp; Finalized</span>
                </div>
                <div style={{ fontSize: 12, color: "#1D1D1F", fontWeight: 600 }}>Period: {getMonthName(selectedPayslipModal.periodMonth)} {selectedPayslipModal.periodYear}</div>
                <div style={{ fontSize: 11.5, color: "#86868B" }}>Currency: {selectedPayslipModal.currency}</div>
              </div>
            </div>

            {/* Attendance & Hours summary */}
            <div style={{ background: "#FBFBFD", borderRadius: 9, padding: "12px 16px", marginBottom: 16, border: "1px solid #E5E5EA", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12 }}>
              <div>
                <span style={{ color: "#86868B", display: "block", fontSize: 11 }}>Productive Hours</span>
                <strong style={{ fontSize: 13.5, color: "#1D1D1F" }}>{selectedPayslipModal.productiveHours}h ({selectedPayslipModal.productiveHoursPercent}%)</strong>
              </div>
              <div>
                <span style={{ color: "#86868B", display: "block", fontSize: 11 }}>Overtime</span>
                <strong style={{ fontSize: 13.5, color: "#1D1D1F" }}>{selectedPayslipModal.approvedOvertimeHours}h</strong>
              </div>
              <div>
                <span style={{ color: "#86868B", display: "block", fontSize: 11 }}>Days Worked</span>
                <strong style={{ fontSize: 13.5, color: "#1D1D1F" }}>{selectedPayslipModal.daysWorked} days</strong>
              </div>
            </div>

            {/* Financial Ledger (Side by side) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#1D1D1F", paddingBottom: 6, borderBottom: "1px solid #E5E5EA", display: "flex", justifyContent: "space-between" }}>
                  <span>Earnings</span>
                  <span style={{ color: "#86868B", fontWeight: 500 }}>{selectedPayslipModal.currency}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F7", fontSize: 12.5 }}>
                  <span style={{ color: "#1D1D1F" }}>Base Productive Pay</span>
                  <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{formatMoney(selectedPayslipModal.regularCompensation, selectedPayslipModal.currency)}</span>
                </div>
                {selectedPayslipModal.overtimeCompensation > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F7", fontSize: 12.5 }}>
                    <span style={{ color: "#1D1D1F" }}>Overtime Pay</span>
                    <span style={{ fontWeight: 600, color: "#1D1D1F" }}>+{formatMoney(selectedPayslipModal.overtimeCompensation, selectedPayslipModal.currency)}</span>
                  </div>
                )}
                {selectedPayslipModal.bonusesTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F7", fontSize: 12.5 }}>
                    <span style={{ color: "#1D1D1F" }}>Approved Bonuses</span>
                    <span style={{ fontWeight: 600, color: "#1D1D1F" }}>+{formatMoney(selectedPayslipModal.bonusesTotal, selectedPayslipModal.currency)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0 0", fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>
                  <span>Total Gross</span>
                  <span>{formatMoney(selectedPayslipModal.grossPay, selectedPayslipModal.currency)}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#1D1D1F", paddingBottom: 6, borderBottom: "1px solid #E5E5EA", display: "flex", justifyContent: "space-between" }}>
                  <span>Deductions</span>
                  <span style={{ color: "#86868B", fontWeight: 500 }}>{selectedPayslipModal.currency}</span>
                </div>
                {selectedPayslipModal.breakdown
                  .filter((b) => !b.isAddition && !b.isEmployerCost)
                  .map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F7", fontSize: 12.5 }}>
                      <span style={{ color: "#1D1D1F" }}>{item.name}</span>
                      <span style={{ fontWeight: 600, color: "#636366" }}>-{formatMoney(item.amount, selectedPayslipModal.currency)}</span>
                    </div>
                  ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0 0", fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>
                  <span>Total Deductions</span>
                  <span style={{ color: "#636366" }}>-{formatMoney(selectedPayslipModal.employeeDeductions, selectedPayslipModal.currency)}</span>
                </div>
              </div>
            </div>

            {/* Apple Summary Bar */}
            <div style={{ background: "#FBFBFD", padding: "14px 18px", borderRadius: 10, border: "1px solid #E5E5EA", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--primary, #2563EB)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Net Disbursed Pay</div>
                <div style={{ fontSize: 11.5, color: "#86868B" }}>Transferred to verified payout channel</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary, #2563EB)", letterSpacing: "-0.03em" }}>
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

      {/* Slide-out Calculation Formula Drawer */}
      <CalculationFormulaModal
        isOpen={isFormulaHelpOpen}
        onClose={() => setIsFormulaHelpOpen(false)}
        compensationModel={empComp.compensationModel}
        payRateDisplay={
          empComp.compensationModel === "hourly"
            ? `${formatMoney(empComp.hourlyRate || 10000, empComp.currency || "UGX")} / hr`
            : `${formatMoney(empComp.baseSalary || 2000000, empComp.currency || "UGX")} / mo`
        }
      />
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
