"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ExternalLink,
  ShieldCheck,
  TimerReset,
  Users,
  XCircle,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { ProgressBar, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface LeaveRequestItem {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  leaveTypeId?: string;
  startDate: string;
  endDate: string;
  hours?: number;
  days?: number;
  reason?: string;
  status: string;
  createdAt?: string;
}

interface EmployeeItem {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  manager?: string;
  managerId?: string;
  avatar?: string;
}

export default function TeamRequestsPage() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [balances, setBalances] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [selected, setSelected] = useState<LeaveRequestItem | null>(null);
  const [note, setNote] = useState("");
  const [isDeciding, setIsDeciding] = useState(false);
  const [tab, setTab] = useState("Needs review");

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [reqRes, empRes, balRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/leave/requests`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/leave/balances`, { headers }),
      ]);

      if (reqRes.ok) {
        const rJson = await reqRes.json();
        setRequests(Array.isArray(rJson) ? rJson : rJson.data || []);
      }
      if (empRes.ok) {
        const eJson = await empRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
      if (balRes.ok) {
        const bJson = await balRes.json();
        const bList = Array.isArray(bJson) ? bJson : bJson.data || [];
        const balMap: Record<string, any> = {};
        for (const b of bList) {
          if (!balMap[b.employeeId]) balMap[b.employeeId] = {};
          balMap[b.employeeId][b.leaveType || b.type || "General"] = b;
        }
        setBalances(balMap);
      }
    } catch (err) {
      console.error("Failed to load team requests data", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pending = useMemo(
    () => requests.filter((r) => r.status === "pending" || r.status === "Pending Manager"),
    [requests]
  );
  const hr = useMemo(
    () => requests.filter((r) => r.status === "Pending HR" || r.status === "manager_approved"),
    [requests]
  );
  const history = useMemo(
    () => requests.filter((r) => ["approved", "Approved", "rejected", "Denied", "cancelled", "Cancelled"].includes(r.status)),
    [requests]
  );

  const visible = tab === "Needs review" ? pending : tab === "With HR" ? hr : history;

  const decide = async (ok: boolean) => {
    if (!selected) return;
    setIsDeciding(true);
    try {
      const token = await getToken();
      if (!token) return;

      const endpoint = ok
        ? `${API_BASE_URL}/api/v1/leave/requests/${selected.id}/approve`
        : `${API_BASE_URL}/api/v1/leave/requests/${selected.id}/decline`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: note.trim() || undefined }),
      });

      if (res.ok) {
        toast.success(
          ok ? "Request approved" : "Request declined",
          ok
            ? `Leave request for ${selected.employeeName} approved.`
            : `Leave request for ${selected.employeeName} declined.`
        );
        setSelected(null);
        setNote("");
        loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Action failed", errJson.detail || errJson.title || "Unable to update request.");
      }
    } catch (err) {
      console.error("Failed to update leave request", err);
      toast.error("Network error", "Failed to update leave request.");
    } finally {
      setIsDeciding(false);
    }
  };

  const getEmp = (empId: string) => employees.find((e) => e.id === empId);

  return (
    <>
      <PageHeader
        title="Team Requests"
        subtitle="Review team impact, record your decision, and route approved requests to HR."
        icon={<ClipboardList size={28} />}
        tabs={["Needs review", "With HR", "History"]}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          <Link
            href="/my-team"
            className="btn-primary"
            style={{ background: "white", color: "var(--primary)", textDecoration: "none" }}
          >
            Back to My Team
          </Link>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Needs review",
              value: pending.length,
              description: "Decisions required",
              icon: <Clock3 size={20} />,
              color: "var(--warning)",
            },
            {
              label: "With HR",
              value: hr.length,
              description: "Manager approved",
              icon: <ShieldCheck size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Approved",
              value: history.filter((x) => x.status === "approved" || x.status === "Approved").length,
              icon: <CheckCircle2 size={20} />,
              color: "var(--success)",
            },
            {
              label: "Team size",
              value: employees.length,
              description: "Active members",
              icon: <Users size={20} />,
              color: "var(--text-4)",
            },
          ]}
        />

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 20, marginTop: 20 }}>
          <Card>
            <CardBody>
              <SectionHeading
                title={tab}
                description={
                  tab === "Needs review"
                    ? "Open a request to review balance, dates, and coverage"
                    : tab === "With HR"
                    ? "Requests awaiting final HR verification"
                    : "Completed and archived team requests"
                }
              />
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <div className="col gap-12">
                  {visible.map((r) => {
                    const person = getEmp(r.employeeId);
                    const bal = balances[r.employeeId]?.[r.type];
                    const pTone =
                      r.status === "approved" || r.status === "Approved"
                        ? "success"
                        : r.status === "rejected" || r.status === "Denied"
                        ? "error"
                        : r.status === "Pending HR" || r.status === "manager_approved"
                        ? "primary"
                        : "warning";

                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelected(r)}
                        style={{
                          padding: 18,
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          background: "white",
                          textAlign: "left",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          width: "100%",
                        }}
                      >
                        <div className="row-between">
                          <div className="row gap-12 align-center">
                            <Avatar src={person?.avatar} name={r.employeeName || (person ? `${person.firstName} ${person.lastName}` : "Team Member")} size="md" />
                            <div>
                              <div className="text-sm fw-800 text-1">{r.employeeName || (person ? `${person.firstName} ${person.lastName}` : "Team Member")}</div>
                              <div className="text-xs text-4">
                                {person?.jobTitle || "Team Member"} · {person?.department || "General"}
                              </div>
                            </div>
                          </div>
                          <StatusPill tone={pTone}>{r.status}</StatusPill>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: 10, marginTop: 14 }}>
                          <Metric label="REQUEST" value={`${r.type} · ${r.hours || (r.days ? r.days * 8 : 8)}h`} />
                          <Metric label="DATES" value={`${r.startDate} → ${r.endDate}`} />
                          <Metric label="AVAILABLE" value={`${bal?.availableMinor ? bal.availableMinor / 100 : bal?.available || "—"} days`} />
                        </div>
                        {r.reason && (
                          <div className="text-xs text-4" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                            {r.reason}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {!visible.length && (
                    <div style={{ padding: 55, textAlign: "center" }}>
                      <CheckCircle2 size={40} color="var(--success)" style={{ margin: "0 auto 12px" }} />
                      <h3 className="text-base fw-800 text-1">Nothing in {tab.toLowerCase()}</h3>
                      <p className="text-xs text-4 mt-4">Requests will appear here as team members submit time off.</p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="col gap-20">
            <Card>
              <CardBody>
                <SectionHeading title="Approval guide" />
                <Guide icon={<CalendarDays />} title="Check dates" text="Confirm no critical team coverage conflicts." />
                <Guide icon={<TimerReset />} title="Review balance" text="HR makes the final policy verification." />
                <Guide icon={<ShieldCheck />} title="Record context" text="Your notes travel with the official record." />
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Team coverage" />
                <div className="row-between mb-8">
                  <span className="text-sm fw-700">Active roster</span>
                  <b>{employees.filter((e) => (e as any).status !== "terminated").length} members</b>
                </div>
                <ProgressBar value={94} color="var(--success)" />
                <p className="text-xs text-4 mt-8">Healthy coverage across all organizational units.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.employeeName} · ${selected.type}` : "Request"}
        subtitle={selected ? `${selected.startDate} to ${selected.endDate}` : ""}
        width={640}
        footer={
          selected?.status === "pending" || selected?.status === "Pending Manager" ? (
            <>
              <button
                className="btn-neutral"
                onClick={() => decide(false)}
                disabled={isDeciding}
                style={{ color: "var(--error)" }}
              >
                {isDeciding ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={15} />} Deny
              </button>
              <button
                className="btn-primary"
                onClick={() => decide(true)}
                disabled={isDeciding}
              >
                {isDeciding ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={15} />} Approve Request
              </button>
            </>
          ) : (
            <button className="btn-neutral" onClick={() => setSelected(null)}>
              Close
            </button>
          )
        }
      >
        {selected && (
          <div className="col gap-16">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Metric label="REQUESTED DURATION" value={`${selected.startDate} to ${selected.endDate}`} />
              <Metric label="LEAVE CATEGORY" value={selected.type} />
            </div>
            {selected.reason && (
              <div style={{ padding: 16, background: "var(--bg-page)", borderRadius: 10 }}>
                <div className="text-xs fw-700 text-5 mb-4">REASON</div>
                <div className="text-sm text-1">{selected.reason}</div>
              </div>
            )}
            <Link
              href={`/people/${selected.employeeId}`}
              className="btn-neutral"
              style={{ textDecoration: "none", justifyContent: "center" }}
            >
              <ExternalLink size={14} /> Open Employee Profile
            </Link>
            {(selected.status === "pending" || selected.status === "Pending Manager") && (
              <div>
                <label className="text-sm fw-700 text-2 mb-8" style={{ display: "block" }}>
                  Decision note (optional)
                </label>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes regarding coverage or special agreements..."
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 11, background: "var(--bg-page)", borderRadius: 8 }}>
      <div className="text-xs fw-700 text-5">{label}</div>
      <div className="text-sm fw-700 text-1" style={{ marginTop: 3 }}>
        {value}
      </div>
    </div>
  );
}

function Guide({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 11, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div
        style={{
          width: 34,
          height: 34,
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
        <div className="text-sm fw-700 text-1">{title}</div>
        <div className="text-xs text-4">{text}</div>
      </div>
    </div>
  );
}
