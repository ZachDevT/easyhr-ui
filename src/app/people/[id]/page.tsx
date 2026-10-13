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
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
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

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
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

  return (
    <>
      <PageHeader
        title={
          <div className="row gap-16 align-center">
            <Avatar src={employee.avatar} name={`${employee.firstName} ${employee.lastName}`} size="lg" />
            <span>{employee.firstName} {employee.lastName}</span>
          </div>
        }
        subtitle={`${employee.jobTitle || "Team Member"} · ${employee.department}`}
        icon={<UserRound size={28} />}
        actions={
          <div className="row gap-12 align-center">
            {employee.status === "onboarding" && (
              <button
                onClick={handleActivate}
                disabled={isActivating}
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
              >
                {isActivating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Activate as Active Employee</span>
              </button>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-secondary row gap-6 align-center"
              style={{
                background: "white",
                color: "var(--text-1)",
                padding: "10px 18px",
                borderRadius: 20,
                border: "1px solid var(--border)",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              <Edit2 size={15} /> Edit Details
            </button>
            <Link
              href="/people"
              className="btn-secondary row gap-6 align-center"
              style={{
                background: "white",
                color: "var(--text-1)",
                textDecoration: "none",
                padding: "10px 20px",
                borderRadius: 20,
                border: "1px solid var(--border)",
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={15} /> Back
            </Link>
          </div>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
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
