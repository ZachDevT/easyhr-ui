"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Plus,
  Send,
  Users,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";

interface ShiftScheduleItem {
  id: string;
  name: string;
  timezone: string;
  description?: string;
}

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  avatar?: string;
  status?: string;
}

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

export default function ShiftSchedulingPage() {
  const { getToken } = useAuth();
  const { role, currentUser } = useRole();
  const [activeTab, setActiveTab] = useState(role === "Employee" ? "My Shifts" : "Team Schedule");
  const [schedules, setSchedules] = useState<ShiftScheduleItem[]>([]);
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    timezone: "UTC",
    description: "",
  });

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [schedRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/scheduling/schedules`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
      ]);

      if (schedRes.ok) {
        const sJson = await schedRes.json();
        setSchedules(Array.isArray(sJson) ? sJson : sJson.data || []);
      }
      if (empRes.ok) {
        const eJson = await empRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load scheduling data", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required", "Please enter a schedule template name.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/scheduling/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          timezone: form.timezone || "UTC",
          description: form.description.trim() || undefined,
          entries: [
            { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
            { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
            { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
            { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
            { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
          ],
        }),
      });

      if (res.ok) {
        toast.success("Schedule template created", "New working schedule saved.");
        setIsModalOpen(false);
        setForm({ name: "", timezone: "UTC", description: "" });
        loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Creation failed", errJson.detail || "Unable to save schedule.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to create schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => {
    setIsPublished(true);
    toast.success("Shift schedule published", "All team members notified of their weekly roster.");
  };

  const activeEmployees = employees.filter((e) => e.status !== "terminated");

  return (
    <>
      <PageHeader
        title="Shift Scheduling"
        subtitle="Plan coverage, assign working patterns, and maintain payroll-accurate rosters."
        icon={<CalendarRange size={28} />}
        tabs={["Team Schedule", "My Shifts"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="row gap-8">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-neutral"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", borderColor: "rgba(255,255,255,0.4)" }}
            >
              <Plus size={15} /> Add Template
            </button>
            <button
              onClick={handlePublish}
              className="btn-primary"
              style={{ background: "white", color: "var(--primary)" }}
            >
              <Send size={15} /> {isPublished ? "Published" : "Publish Schedule"}
            </button>
          </div>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        {activeTab === "My Shifts" ? (
          <div className="col gap-20 mt-20">
            <StatRibbon
              stats={[
                {
                  label: "Weekly Target",
                  value: "40 hrs",
                  icon: <Clock3 size={20} />,
                  color: "var(--primary)",
                },
                {
                  label: "Rostered Days",
                  value: "5 days",
                  icon: <CalendarDays size={20} />,
                  color: "var(--success)",
                },
                {
                  label: "Working Pattern",
                  value: "Standard Day (09:00 - 17:00)",
                  icon: <CalendarRange size={20} />,
                  color: "var(--warning)",
                },
              ]}
            />

            <Card style={{ overflow: "hidden" }}>
              <CardBody>
                <div className="row-between mb-20">
                  <div>
                    <h3 className="text-base fw-700 text-1 m-0">My Active Shift Schedule</h3>
                    <p className="text-xs text-4 m-0 mt-4">
                      Weekly working hours, break allocations, and shift statuses
                    </p>
                  </div>
                  <div className="row gap-8">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: "#ecfdf5",
                        color: "#059669",
                      }}
                    >
                      Active Roster
                    </span>
                    <Link
                      href="/time"
                      className="btn-primary btn-sm"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Clock3 size={13} /> Clock In Now
                    </Link>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  {[
                    { day: "Monday", time: "09:00 – 17:00", hours: "8 hrs", breakTime: "60m Meal Break (Non-billable)", status: "Completed" },
                    { day: "Tuesday", time: "09:00 – 17:00", hours: "8 hrs", breakTime: "60m Meal Break (Non-billable)", status: "Active Today" },
                    { day: "Wednesday", time: "09:00 – 17:00", hours: "8 hrs", breakTime: "60m Meal Break (Non-billable)", status: "Upcoming" },
                    { day: "Thursday", time: "09:00 – 17:00", hours: "8 hrs", breakTime: "60m Meal Break (Non-billable)", status: "Upcoming" },
                    { day: "Friday", time: "09:00 – 17:00", hours: "8 hrs", breakTime: "60m Meal Break (Non-billable)", status: "Upcoming" },
                  ].map((shift) => (
                    <div
                      key={shift.day}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: shift.status === "Active Today" ? "var(--primary-tint, #f5f3ff)" : "var(--card-bg, #ffffff)",
                      }}
                    >
                      <div className="row-between mb-8">
                        <span className="text-sm fw-700 text-1">{shift.day}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 10,
                            background: shift.status === "Active Today" ? "rgba(124, 58, 237, 0.15)" : "#f1f5f9",
                            color: shift.status === "Active Today" ? "var(--primary)" : "#64748b",
                          }}
                        >
                          {shift.status}
                        </span>
                      </div>
                      <div className="text-base fw-800 text-1 mb-4">{shift.time}</div>
                      <div className="text-xs text-4 mb-2">{shift.hours} scheduled</div>
                      <div className="text-xs text-5" style={{ fontSize: 11 }}>{shift.breakTime}</div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <>
            <StatRibbon
              stats={[
                {
                  label: "Team members rostered",
                  value: activeEmployees.length,
                  icon: <Users size={20} />,
                  color: "var(--primary)",
                },
                {
                  label: "Schedule templates",
                  value: schedules.length,
                  icon: <Clock3 size={20} />,
                  color: "var(--warning)",
                },
                {
                  label: "Weekly coverage",
                  value: "100%",
                  trend: "Full staffing",
                  trendType: "positive",
                  icon: <CalendarDays size={20} />,
                  color: "var(--success)",
                },
              ]}
            />

            <Card style={{ marginTop: 20, overflow: "hidden" }}>
              <CardBody>
                <SectionHeading
                  title="Active Weekly Roster"
                  description="Monday through Friday operational coverage across organization team"
                  action={
                    <div className="row gap-8 align-center">
                      <strong className="text-sm text-1">Current Work Week</strong>
                      {isPublished && <StatusPill tone="success">Published</StatusPill>}
                    </div>
                  }
                />

            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : activeEmployees.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Users size={36} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                <h3 className="text-base fw-800 text-1">No employees in organization</h3>
                <p className="text-xs text-4 mt-4">Add employees to your company directory to populate the shift schedule.</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "240px repeat(5, minmax(130px, 1fr))",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: 14, background: "var(--bg-page)", borderRight: "1px solid var(--border)" }}>
                  <span className="text-xs fw-700 text-5">TEAM MEMBER</span>
                </div>
                {WEEK_DAYS.map((day) => (
                  <div
                    key={day}
                    style={{
                      padding: 12,
                      textAlign: "center",
                      background: "var(--bg-page)",
                      borderRight: "1px solid var(--border)",
                    }}
                  >
                    <div className="text-xs fw-800 text-4">{day}</div>
                    <div className="text-sm fw-700 text-1">09:00–17:00</div>
                  </div>
                ))}

                {activeEmployees.map((member) => {
                  const fullName = `${member.firstName} ${member.lastName}`.trim();
                  return (
                    <div key={member.id} style={{ display: "contents" }}>
                      <div
                        style={{
                          padding: 14,
                          borderTop: "1px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Avatar src={member.avatar} name={fullName} size="sm" />
                        <div>
                          <div className="text-sm fw-700 text-1">{fullName}</div>
                          <div className="text-xs text-4">{member.jobTitle || "Team Member"}</div>
                        </div>
                      </div>
                      {WEEK_DAYS.map((day, idx) => (
                        <div
                          key={day + idx}
                          style={{
                            padding: 12,
                            borderTop: "1px solid var(--border)",
                            borderRight: "1px solid var(--border)",
                            background: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              padding: "6px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--primary)",
                              background: "var(--primary-tint)",
                            }}
                          >
                            Scheduled
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </>
    )}
  </main>

      {/* Add Schedule Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Shift Template"
        subtitle="Establish working hours and shift parameters"
        width={500}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateSchedule}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : "Save Template"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSchedule} className="col gap-14">
          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Template Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Standard Daytime (09:00 - 17:00)"
              required
            />
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Timezone
            </label>
            <Select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="Africa/Kampala">Africa/Kampala (EAT, UTC+3)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
              <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
              <option value="America/New_York">America/New_York (EST, UTC-5)</option>
            </Select>
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Description (optional)
            </label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Default full-time business hours"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
