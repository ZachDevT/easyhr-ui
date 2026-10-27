"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, MapPin, Search, Users, UserPlus, Link2, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useChat } from "@/context/ChatContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { PeopleDirectorySkeleton } from "@/components/ui/Skeleton";
import { useRole } from "@/context/RoleContext";

import { AddHireModal } from "@/components/people/AddHireModal";
import { OnboardingLinkModal } from "@/components/people/OnboardingLinkModal";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  workEmail: string;
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
  hiredOn?: string;
  avatar?: string;
}

export default function PeopleDirectory() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isHRAdmin, isManager, currentUser } = useRole();
  const { openOrCreateDM } = useChat();
  const [openingDmId, setOpeningDmId] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>(["All"]);
  const [rawDepartments, setRawDepartments] = useState<{ id: string; name: string }[]>([]);
  const [rawLocations, setRawLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddHireOpen, setIsAddHireOpen] = useState(false);
  const [onboardingLinkEmployee, setOnboardingLinkEmployee] = useState<Employee | null>(null);

  const handleStartDM = async (ev: React.MouseEvent, emp: Employee) => {
    ev.preventDefault();
    ev.stopPropagation();
    try {
      setOpeningDmId(emp.id);
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Colleague';
      const ch = await openOrCreateDM(emp.id, fullName);
      router.push(`/chat?channelId=${ch.id}&tab=dms`);
    } catch (err: any) {
      console.error('Failed to open DM:', err);
      router.push(`/chat?dm=${emp.id}&tab=dms`);
    } finally {
      setOpeningDmId(null);
    }
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [empRes, deptRes, locRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/employees?limit=100`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/departments`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/locations`, { headers }),
      ]);

      if (empRes.ok) {
        const empJson = await empRes.json();
        const list: Employee[] = empJson.data || [];
        setEmployees(list);
      }

      if (deptRes.ok) {
        const deptJson = await deptRes.json();
        const rawDepts = deptJson.data || [];
        setRawDepartments(rawDepts);
        const deptNames: string[] = rawDepts.map((d: any) => String(d.name)).filter(Boolean);
        setDepartments(["All", ...Array.from(new Set<string>(deptNames))]);
      }

      if (locRes.ok) {
        const locJson = await locRes.json();
        setRawLocations(locJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load people directory", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filtered = employees.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName} ${e.jobTitle || ""} ${e.department || ""} ${e.location || ""}`.toLowerCase();
    const matchesSearch = searchQuery === "" || fullName.includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "All" || e.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <>
      <PageHeader
        title="People Directory"
        subtitle="Find and connect with everyone across your organization."
        icon={<Users size={28} />}
        actions={
          isHRAdmin ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setIsAddHireOpen(true)}
                className="btn-primary row gap-8 align-center"
                style={{
                  background: "white",
                  color: "var(--primary)",
                  border: "none",
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 20,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <UserPlus size={16} /> Add Hire Manually
              </button>
              <Link
                href="/onboarding"
                style={{
                  padding: "10px 18px",
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "white",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Onboarding Pipeline
              </Link>
            </div>
          ) : undefined
        }
      />

      <AddHireModal
        isOpen={isAddHireOpen}
        onClose={() => setIsAddHireOpen(false)}
        onSuccess={fetchEmployees}
        departments={rawDepartments}
        locations={rawLocations}
        managers={employees}
      />

      {onboardingLinkEmployee && (
        <OnboardingLinkModal
          isOpen={Boolean(onboardingLinkEmployee)}
          onClose={() => setOnboardingLinkEmployee(null)}
          employeeId={onboardingLinkEmployee.id}
          employeeName={`${onboardingLinkEmployee.firstName} ${onboardingLinkEmployee.lastName}`}
          employeeEmail={onboardingLinkEmployee.workEmail}
        />
      )}

      <main style={{ padding: "0 24px 32px" }}>
        {isLoading ? (
          <PeopleDirectorySkeleton />
        ) : (
          <Card>
            <CardBody>
              <SectionHeading
                title={`${filtered.length} employees`}
                description="Live organization directory synchronized with employment records"
                action={
                  <div className="row gap-8">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        minWidth: 280,
                        background: "white",
                      }}
                    >
                      <Search size={15} style={{ color: "var(--text-4)" }} />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name, role, team, location..."
                        style={{
                          border: 0,
                          outline: 0,
                          width: "100%",
                          fontFamily: "inherit",
                          fontSize: 13.5,
                        }}
                      />
                    </div>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "8px 14px",
                        fontFamily: "inherit",
                        fontSize: 13.5,
                        background: "white",
                        outline: "none",
                      }}
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                }
              />

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 20px" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "var(--bg-page)",
                      color: "var(--text-4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    <Users size={28} />
                  </div>
                  <h3 className="text-lg fw-700 text-1 m-0 mb-8">
                    {searchQuery || selectedDept !== "All"
                      ? "No employees match your search"
                      : "No employees registered yet"}
                  </h3>
                  <p className="text-sm text-4 m-0" style={{ maxWidth: 440, margin: "0 auto 20px" }}>
                    {searchQuery || selectedDept !== "All"
                      ? "Try adjusting your search criteria or department filter."
                      : "Employees will appear here automatically when candidates are hired through the ATS and onboarded."}
                  </p>
                  {!searchQuery && selectedDept === "All" && isHRAdmin && (
                    <Link
                      href="/onboarding"
                      className="btn-primary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 24px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      <UserPlus size={16} /> Go to Onboarding
                    </Link>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 16,
                  }}
                >
                  {filtered.map((e) => {
                    const isSelf = e.id === currentUser.id || e.workEmail?.toLowerCase() === currentUser.email?.toLowerCase();
                    const canViewDetails = isHRAdmin || isManager || isSelf;
                    const targetHref = isSelf ? "/people/me" : `/people/${e.id}`;

                    const cardContent = (
                      <>
                        <div className="row-between mb-16 align-start">
                          <div className="row gap-12 align-center">
                            <Avatar
                              src={e.avatar}
                              name={`${e.firstName} ${e.lastName}`}
                              size="lg"
                            />
                            <div>
                              <div className="text-base fw-800 text-1">
                                {e.firstName} {e.lastName}
                                {isSelf && (
                                  <span
                                    style={{
                                      marginLeft: 6,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: "var(--primary)",
                                      background: "var(--primary-tint)",
                                      padding: "2px 6px",
                                      borderRadius: 6,
                                    }}
                                  >
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-4 fw-600">
                                {e.jobTitle || "Team Member"}
                              </div>
                            </div>
                          </div>
                          {canViewDetails && <ChevronRight size={17} color="var(--text-5)" />}
                        </div>

                        <div className="col gap-8 text-xs text-4">
                          <div className="row gap-8 align-center">
                            <Building2 size={13} />
                            <span>{e.department} {e.division ? `· ${e.division}` : ""}</span>
                          </div>
                          <div className="row gap-8 align-center">
                            <MapPin size={13} />
                            <span>{e.location || "Headquarters"}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <StatusPill
                            tone={
                              e.status === "active"
                                ? "success"
                                : (e.status?.toLowerCase().includes("onboard") || e.status?.toLowerCase() === "new")
                                ? "warning"
                                : "neutral"
                            }
                          >
                            {e.status}
                          </StatusPill>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={(ev) => handleStartDM(ev, e)}
                                disabled={openingDmId === e.id}
                                className="btn-secondary btn-sm"
                                style={{
                                  fontSize: 11.5,
                                  padding: "5px 11px",
                                  borderRadius: 8,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  color: "var(--text-1, #18181B)",
                                  fontWeight: 650,
                                  border: "1px solid var(--border, #E4E4E7)",
                                  background: "#FFFFFF",
                                  cursor: "pointer",
                                }}
                                title={`Send a direct message to ${e.firstName}`}
                              >
                                {openingDmId === e.id ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Opening...</span>
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare size={12} style={{ color: "var(--primary, #2563EB)" }} />
                                    <span>Message</span>
                                  </>
                                )}
                              </button>
                            )}
                            {(e.status?.toLowerCase().includes("onboard") || e.status?.toLowerCase() === "new" || e.status?.toLowerCase() === "pending") && isHRAdmin && (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  ev.stopPropagation();
                                  setOnboardingLinkEmployee(e);
                                }}
                                className="btn-neutral btn-sm"
                                style={{
                                  fontSize: 11.5,
                                  padding: "4px 10px",
                                  borderRadius: 8,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color: "var(--primary, #2563EB)",
                                  fontWeight: 650,
                                }}
                                title="Resend or copy employee onboarding link"
                              >
                                <Link2 size={12} />
                                <span>Resend Link</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    );

                    if (canViewDetails) {
                      return (
                        <Link
                          key={e.id}
                          href={targetHref}
                          style={{
                            display: "block",
                            padding: 20,
                            border: "1px solid var(--border)",
                            borderRadius: 14,
                            textDecoration: "none",
                            color: "inherit",
                            background: "white",
                            transition: "all 0.2s",
                          }}
                          className="hover-lift"
                        >
                          {cardContent}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={e.id}
                        style={{
                          display: "block",
                          padding: 20,
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                          color: "inherit",
                          background: "white",
                        }}
                      >
                        {cardContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </main>
    </>
  );
}
