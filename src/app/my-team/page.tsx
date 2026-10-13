"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Search,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle?: string;
  department: string;
  location?: string;
  manager?: string;
  managerId?: string;
  status: string;
  avatar?: string;
}

export default function MyTeamPage() {
  const { getToken } = useAuth();
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [query, setQuery] = useState("");

  const loadTeamData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [meRes, empRes, reqRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/employees/me`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/leave/requests`, { headers }),
      ]);

      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson);
      }
      if (empRes.ok) {
        const empJson = await empRes.json();
        setEmployees(Array.isArray(empJson) ? empJson : empJson.data || []);
      }
      if (reqRes.ok) {
        const reqJson = await reqRes.json();
        setRequests(Array.isArray(reqJson) ? reqJson : reqJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load team data", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Determine direct reports or organization team
  const myDirectReports = useMemo(() => {
    if (!currentUser) return employees;
    const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim().toLowerCase();
    const reports = employees.filter((e) => {
      if (e.id === currentUser.id) return false;
      if (e.managerId && e.managerId === currentUser.id) return true;
      if (e.manager && e.manager.trim().toLowerCase() === fullName) return true;
      return false;
    });

    // If no direct reports assigned, show all other team members in organization so view isn't empty
    return reports.length > 0 ? reports : employees.filter((e) => e.id !== currentUser.id);
  }, [employees, currentUser]);

  const filteredTeam = useMemo(() => {
    if (!query.trim()) return myDirectReports;
    const q = query.toLowerCase();
    return myDirectReports.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        (e.jobTitle || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q)
    );
  }, [myDirectReports, query]);

  const teamRequests = useMemo(() => {
    const ids = new Set(myDirectReports.map((e) => e.id));
    return requests.filter((r) => ids.has(r.employeeId));
  }, [myDirectReports, requests]);

  const pendingRequests = useMemo(() => {
    return teamRequests.filter((r) => r.status === "pending" || r.status === "Pending Manager");
  }, [teamRequests]);

  const activeCount = myDirectReports.filter((e) => e.status === "active").length;

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My Team"
        subtitle={`${myDirectReports.length} direct reports · ${currentUser?.department || "Organization"} team workspace`}
        icon={<Users size={28} />}
        tabs={["Overview", "People", "Time off"]}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          <Link
            href="/team-requests"
            className="btn-primary"
            style={{ background: "white", color: "var(--primary)", textDecoration: "none" }}
          >
            <CalendarDays size={16} /> {pendingRequests.length} requests to review
          </Link>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Team members",
              value: myDirectReports.length,
              description: "Assigned roster",
              icon: <Users size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Needs attention",
              value: pendingRequests.length,
              description: "Pending decisions",
              icon: <Clock3 size={20} />,
              color: "var(--warning)",
            },
            {
              label: "Active today",
              value: activeCount,
              description: `${myDirectReports.length - activeCount} onboarding/away`,
              icon: <CheckCircle2 size={20} />,
              color: "var(--success)",
            },
            {
              label: "Organization total",
              value: employees.length,
              description: "Company roster",
              icon: <TrendingUp size={20} />,
              color: "var(--text-4)",
            },
          ]}
        />

        {tab === "Overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) 360px", gap: 20, marginTop: 20 }}>
            <Card>
              <CardBody>
                <SectionHeading
                  title="Team snapshot"
                  description="People, positions, and current statuses"
                />
                {myDirectReports.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center" }}>
                    <Users size={36} className="text-4 mb-12" />
                    <h3 className="text-base fw-700 text-1">No team members assigned</h3>
                    <p className="text-xs text-4 mt-4">Assign employees to report to you to monitor their activities.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                    {myDirectReports.map((e) => (
                      <MemberCard
                        key={e.id}
                        employee={e}
                        pending={teamRequests.filter((r) => r.employeeId === e.id && r.status === "pending").length}
                      />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <div className="col gap-20">
              <Card>
                <CardBody>
                  <SectionHeading title="Manager quick links" />
                  <Action
                    href="/team-requests"
                    icon={<Clock3 />}
                    title={`${pendingRequests.length} requests waiting`}
                    text="Review time-off and coverage approvals"
                    tone="warning"
                  />
                  <Action
                    href="/attendance"
                    icon={<CheckCircle2 />}
                    title="Live attendance tracking"
                    text="View real-time punch timestamps"
                    tone="success"
                  />
                  <Action
                    href="/performance"
                    icon={<TrendingUp />}
                    title="Team performance & goals"
                    text="Conduct reviews and track goal milestones"
                    tone="primary"
                  />
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <SectionHeading title="Team composition" />
                  <div className="col gap-10">
                    <DataRow
                      leading={<Users size={16} color="var(--primary)" />}
                      title={`${myDirectReports.length} Total direct reports`}
                      subtitle={`${activeCount} currently active`}
                    />
                    <DataRow
                      leading={<CalendarDays size={16} color="var(--warning)" />}
                      title={`${teamRequests.length} Total time-off requests filed`}
                      subtitle={`${pendingRequests.length} awaiting decision`}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {tab === "People" && (
          <Card style={{ marginTop: 20 }}>
            <CardBody>
              <SectionHeading
                title="Direct reports directory"
                description="Click any member to open their complete profile"
                action={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 9,
                      minWidth: 240,
                    }}
                  >
                    <Search size={14} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search team members..."
                      style={{ border: 0, outline: 0, width: "100%", fontFamily: "inherit", fontSize: 13 }}
                    />
                  </div>
                }
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
                {filteredTeam.map((e) => (
                  <MemberCard
                    key={e.id}
                    employee={e}
                    pending={teamRequests.filter((r) => r.employeeId === e.id && r.status === "pending").length}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {tab === "Time off" && (
          <Card style={{ marginTop: 20 }}>
            <CardBody>
              <SectionHeading
                title="Team leave timeline"
                description="Recent time-off requests across your team"
                action={
                  <Link href="/team-requests" className="btn-neutral" style={{ textDecoration: "none" }}>
                    Open approval queue
                  </Link>
                }
              />
              {teamRequests.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <CalendarDays size={36} className="text-4 mb-12" />
                  <h3 className="text-base fw-700 text-1">No time off requests filed</h3>
                  <p className="text-xs text-4 mt-4">When team members submit leave requests, they will appear here.</p>
                </div>
              ) : (
                <div className="col gap-10">
                  {teamRequests.map((r) => (
                    <DataRow
                      key={r.id}
                      leading={<Avatar name={r.employeeName} size="sm" />}
                      title={`${r.employeeName} · ${r.type}`}
                      subtitle={`${r.startDate} → ${r.endDate}`}
                      meta={
                        <StatusPill
                          tone={
                            r.status === "approved" || r.status === "Approved"
                              ? "success"
                              : r.status === "rejected" || r.status === "Denied"
                              ? "error"
                              : "warning"
                          }
                        >
                          {r.status}
                        </StatusPill>
                      }
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </main>
    </>
  );
}

function MemberCard({ employee: e, pending }: { employee: TeamMember; pending: number }) {
  const fullName = `${e.firstName} ${e.lastName}`.trim();
  return (
    <Link
      href={`/people/${e.id}`}
      style={{
        padding: 16,
        border: "1px solid var(--border)",
        borderRadius: 12,
        textDecoration: "none",
        background: "linear-gradient(180deg, #fff 0%, #fdfcff 100%)",
        color: "inherit",
      }}
    >
      <div className="row-between align-center">
        <div className="row gap-12 align-center">
          <Avatar src={e.avatar} name={fullName} size="lg" />
          <div>
            <div className="text-sm fw-800 text-1">{fullName}</div>
            <div className="text-xs text-4">{e.jobTitle || "Team Member"}</div>
          </div>
        </div>
        <ArrowUpRight size={16} color="var(--primary)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
        <Mini icon={<MapPin size={12} />} text={e.location || "Remote"} />
        <Mini icon={<Mail size={12} />} text={pending ? `${pending} pending` : "No pending"} />
      </div>
    </Link>
  );
}

function Mini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="row gap-4 text-xs text-4 align-center" style={{ padding: 6, background: "var(--bg-page)", borderRadius: 7 }}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function Action({
  href,
  icon,
  title,
  text,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  tone: "warning" | "success" | "primary";
}) {
  const colors = { warning: "var(--warning)", success: "var(--success)", primary: "var(--primary)" };
  return (
    <Link
      href={href}
      style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)", textDecoration: "none" }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          display: "grid",
          placeItems: "center",
          background: "var(--bg-page)",
          color: colors[tone],
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm fw-700 text-1">{title}</div>
        <div className="text-xs text-4">{text}</div>
      </div>
    </Link>
  );
}
