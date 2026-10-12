"use client";

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
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";

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
}

export default function EmployeeProfile() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const [employee, setEmployee] = useState<EmployeeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !params?.id) return;

      const res = await fetch(`http://localhost:8080/api/v1/employees/${params.id}`, {
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

      const res = await fetch(`http://localhost:8080/api/v1/employees/${employee.id}/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setEmployee({ ...employee, status: "active" });
      }
    } catch (err) {
      console.error("Failed to activate employee", err);
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
