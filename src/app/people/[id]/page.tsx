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
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRole } from "@/context/RoleContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { EditEmployeeModal } from "@/components/people/EditEmployeeModal";

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
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; firstName: string; lastName: string; jobTitle?: string }[]>([]);

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
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
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
                <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary, #A238FF)" }}>
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
                  <Building2 size={13} style={{ color: "var(--primary, #A238FF)" }} />
                  <span>{employee.department}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={13} style={{ color: "var(--primary, #A238FF)" }} />
                  <span>{employee.location || "Headquarters"}</span>
                </span>
                {employee.workEmail && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Mail size={13} style={{ color: "var(--primary, #A238FF)" }} />
                    <span>{employee.workEmail}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {employee.status === "onboarding" && (
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
                }}
              >
                {isActivating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Activate Employee</span>
              </button>
            )}
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
            {(employee.paymentMethod || employee.mobileMoneyProvider || employee.bankName) && (
              <Card>
                <CardBody>
                  <SectionHeading
                    title="Disbursement & Payroll"
                    description="Designated compensation payout account"
                  />
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
                      meta={<StatusPill tone="success">Active</StatusPill>}
                    />
                  </div>
                </CardBody>
              </Card>
            )}

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
