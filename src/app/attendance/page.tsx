"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Search, Filter, Clock, MapPin, AlertTriangle, ChevronDown, 
  MonitorPlay, MonitorStop, RefreshCw, CalendarDays, Edit3, Send,
  CheckCircle2, LogIn, LogOut, UserCheck, ShieldAlert
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { AttendanceSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";

export interface LiveAttendanceItem {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  avatar: string;
  date: string;
  status: "clocked_in" | "clocked_out" | "absent" | "late";
  clockInAt?: string | null;
  clockOutAt?: string | null;
  lateMinutes?: number;
}

const TABS = ["Live Attendance", "Shift Management"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AttendancePage() {
  const { getToken, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState("Live Attendance");
  const [records, setRecords] = useState<LiveAttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [punchMessage, setPunchMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Current live clock for header
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Manual Override State
  const [selectedEmployee, setSelectedEmployee] = useState<LiveAttendanceItem | null>(null);
  const [overrideType, setOverrideType] = useState<"clock_in" | "clock_out">("clock_in");
  const [overrideTime, setOverrideTime] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Shift assignment state
  const [assignShiftEmployee, setAssignShiftEmployee] = useState<LiveAttendanceItem | null>(null);

  // Fetch Live Attendance from Go backend
  const fetchAttendance = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }
    try {
      const token = await getToken();
      if (!token) return;

      const url = new URL(`${API_BASE_URL}/api/v1/attendance/live`);
      if (selectedDate) url.searchParams.set("date", selectedDate);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setRecords(json.data || []);
      } else {
        console.error("Failed to load attendance", await res.text());
      }
    } catch (err) {
      console.error("Error fetching live attendance:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn, selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Handle Self Punch (Clock In / Clock Out)
  const handlePunch = async (kind: "clock_in" | "clock_out") => {
    setIsPunching(true);
    setPunchMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          kind,
          source: "web",
          occurredAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.title || "Failed to record punch");
      }

      toast.success(
        kind === "clock_in" ? "Clocked in successfully" : "Clocked out successfully",
        `Recorded at ${currentTime}.`
      );
      setPunchMessage({
        type: "success",
        text: `Successfully ${kind === "clock_in" ? "clocked in" : "clocked out"} at ${currentTime}`,
      });
      await fetchAttendance();
    } catch (err: any) {
      toast.error("Attendance punch failed", err.message || "Failed to submit attendance punch.");
      setPunchMessage({
        type: "error",
        text: err.message || "Failed to submit attendance punch",
      });
    } finally {
      setIsPunching(false);
    }
  };

  // Handle Manager Override Punch
  const handleForceClock = async () => {
    if (!selectedEmployee) return;
    if (!overrideReason.trim()) {
      toast.warning("Reason required", "Please enter a reason for this manual override.");
      return;
    }

    setIsSubmittingOverride(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      let occurredAt = new Date().toISOString();
      if (overrideTime) {
        const [hours, minutes] = overrideTime.split(":");
        const d = new Date(selectedDate);
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
        occurredAt = d.toISOString();
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: selectedEmployee.employeeId,
          kind: overrideType,
          source: "web",
          occurredAt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.title || "Failed to apply override");
      }

      toast.success(
        "Override recorded",
        `Recorded ${overrideType === "clock_in" ? "Clock In" : "Clock Out"} override for ${selectedEmployee.employeeName}.`
      );
      setSelectedEmployee(null);
      setOverrideReason("");
      setOverrideTime("");
      await fetchAttendance();
    } catch (err: any) {
      toast.error("Override failed", err.message || "Failed to process manual override.");
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        r.employeeName.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query) ||
        r.employeeNumber.toLowerCase().includes(query) ||
        r.jobTitle.toLowerCase().includes(query);

      const matchesStatus = 
        statusFilter === "All" ? true : r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  // Status Counts
  const stats = useMemo(() => {
    const total = records.length;
    const clockedIn = records.filter((r) => r.status === "clocked_in").length;
    const clockedOut = records.filter((r) => r.status === "clocked_out").length;
    const absent = records.filter((r) => r.status === "absent").length;
    return { total, clockedIn, clockedOut, absent };
  }, [records]);

  // Format punch timestamps
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  // Calculate worked duration
  const getWorkedDuration = (inIso?: string | null, outIso?: string | null) => {
    if (!inIso) return null;
    const start = new Date(inIso).getTime();
    const end = outIso ? new Date(outIso).getTime() : Date.now();
    const diffMs = end - start;
    if (diffMs <= 0) return null;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const renderStatusBadge = (status: string) => {
    if (status === "clocked_in") {
      return (
        <Badge variant="success">
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", marginRight: 6, display: "inline-block", boxShadow: "0 0 6px #10B981" }} />
          Clocked In
        </Badge>
      );
    }
    if (status === "clocked_out") {
      return <Badge variant="neutral">Clocked Out</Badge>;
    }
    return <Badge variant="danger">Absent</Badge>;
  };

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <PageHeader 
        title="Live Team Attendance"
        subtitle="Real-time employee punches, timesheet monitoring, and manager overrides."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px", background: "var(--bg-page)" }}>
        {isLoading ? (
          <AttendanceSkeleton />
        ) : (
          <>
            {/* Quick Self-Service Punch Bar */}
            <div 
              style={{ 
                background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", 
                borderRadius: 16, 
                padding: "24px 32px", 
                color: "white", 
                marginBottom: 28,
                boxShadow: "0 10px 25px -5px rgba(30, 27, 75, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 20
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div 
                  style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 14, 
                    background: "rgba(255, 255, 255, 0.12)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                >
                  <Clock size={28} className="text-white" />
                </div>
                <div>
                  <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A5B4FC", fontWeight: 700 }}>
                    My Daily Timecard &bull; {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2, display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span>{currentTime || "--:--:--"}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#C7D2FE" }}>Local Time</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => handlePunch("clock_in")}
                  disabled={isPunching}
                  className="btn"
                  style={{
                    background: "#10B981",
                    color: "white",
                    fontWeight: 700,
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "none",
                    cursor: isPunching ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <LogIn size={18} />
                  {isPunching ? "Punching..." : "Clock In"}
                </button>

                <button
                  onClick={() => handlePunch("clock_out")}
                  disabled={isPunching}
                  className="btn"
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    color: "white",
                    fontWeight: 700,
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    cursor: isPunching ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    transition: "all 0.2s ease"
                  }}
                >
                  <LogOut size={18} />
                  {isPunching ? "Punching..." : "Clock Out"}
                </button>
              </div>
            </div>

            {punchMessage && (
              <div 
                style={{ 
                  background: punchMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
                  color: punchMessage.type === "success" ? "#065F46" : "#991B1B",
                  border: `1px solid ${punchMessage.type === "success" ? "#A7F3D0" : "#FECACA"}`,
                  borderRadius: 10,
                  padding: "12px 20px",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                <span>{punchMessage.text}</span>
                <button 
                  onClick={() => setPunchMessage(null)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}
                >
                  &times;
                </button>
              </div>
            )}

            {activeTab === "Live Attendance" && (
              <div>
                {/* Stats & Filters Bar */}
                <div className="row-between mb-24" style={{ flexWrap: "wrap", gap: 16 }}>
                  {/* Inline Stats Ribbon */}
                  <div 
                    className="row gap-16" 
                    style={{ 
                      background: "white", 
                      border: "1px solid var(--border)", 
                      borderRadius: "100px", 
                      padding: "8px 24px", 
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)" 
                    }}
                  >
                    <div className="row gap-8 pr-16" style={{ borderRight: "1px solid var(--border)" }}>
                      <UserCheck size={16} className="text-4" />
                      <span className="text-sm fw-700 text-1">{stats.total} <span className="text-4 fw-500">Scheduled</span></span>
                    </div>
                    <div className="row gap-8 pr-16" style={{ borderRight: "1px solid var(--border)" }}>
                      <RefreshCw size={16} style={{ color: "#10B981" }} />
                      <span className="text-sm fw-700 text-1">{stats.clockedIn} <span className="text-4 fw-500">Working</span></span>
                    </div>
                    <div className="row gap-8 pr-16" style={{ borderRight: "1px solid var(--border)" }}>
                      <MonitorStop size={16} style={{ color: "#64748B" }} />
                      <span className="text-sm fw-700 text-1">{stats.clockedOut} <span className="text-4 fw-500">Clocked Out</span></span>
                    </div>
                    <div className="row gap-8">
                      <AlertTriangle size={16} style={{ color: "#EF4444" }} />
                      <span className="text-sm fw-700 text-1">{stats.absent} <span className="text-4 fw-500">Absent</span></span>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="row gap-12" style={{ flexWrap: "wrap" }}>
                    {/* Date Picker */}
                    <div style={{ display: "flex", alignItems: "center", background: "white", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 14px" }}>
                      <CalendarDays size={14} className="text-4 mr-8" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, cursor: "pointer", color: "var(--text-1)", fontWeight: 600 }}
                      />
                    </div>

                    {/* Status Dropdown */}
                    <div style={{ display: "flex", alignItems: "center", background: "white", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 14px" }}>
                      <Filter size={14} className="text-4 mr-8"/>
                      <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, cursor: "pointer", color: "var(--text-1)", fontWeight: 600 }}
                      >
                        <option value="All">All Today</option>
                        <option value="clocked_in">Working</option>
                        <option value="clocked_out">Clocked Out</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>

                    {/* Search */}
                    <div className="search-bar" style={{ display: "flex", alignItems: "center", background: "white", border: "1px solid var(--border)", borderRadius: 20, padding: "6px 16px", width: 220 }}>
                      <Search size={14} className="text-4" style={{ marginRight: 8 }} />
                      <input 
                        type="text" 
                        placeholder="Search employees..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%" }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Team Roster Grid */}
                <div className="grid-3 gap-16">
                  {filteredRecords.map((record) => {
                    const isWorking = record.status === "clocked_in";
                    const isClockedOut = record.status === "clocked_out";
                    const isAbsent = record.status === "absent";
                    const duration = getWorkedDuration(record.clockInAt, record.clockOutAt);

                    return (
                      <Card 
                        key={record.employeeId} 
                        style={{ 
                          opacity: isClockedOut ? 0.75 : 1,
                          border: isWorking ? "1px solid #10B981" : isAbsent ? "1px solid var(--border)" : "1px solid var(--border)",
                          boxShadow: isWorking ? "0 4px 12px rgba(16, 185, 129, 0.08)" : "0 2px 8px rgba(0,0,0,0.02)",
                          borderRadius: 16,
                          transition: "all 0.2s ease"
                        }}
                      >
                        <CardBody style={{ padding: "20px 24px" }}>
                          <div className="row-between mb-16">
                            <div className="row gap-12">
                              <Avatar src={record.avatar} name={record.employeeName} size="md" />
                              <div>
                                <div className="text-base fw-700 text-1" style={{ lineHeight: 1.2 }}>{record.employeeName}</div>
                                <div className="text-xs text-5 mt-2">{record.jobTitle || record.department}</div>
                              </div>
                            </div>
                            {renderStatusBadge(record.status)}
                          </div>

                          <div className="col gap-8 mb-16 text-xs" style={{ background: "#F9FAFB", padding: "12px 14px", borderRadius: 10 }}>
                            <div className="row-between">
                              <span className="text-4 row gap-6"><Clock size={12}/> Shift</span>
                              <span className="fw-600 text-2">09:00 AM - 17:00 PM</span>
                            </div>

                            <div className="row-between">
                              <span className="text-4 row gap-6"><MonitorPlay size={12}/> Clock In</span>
                              <span className="fw-600 text-2">{formatTime(record.clockInAt)}</span>
                            </div>

                            {isClockedOut && (
                              <div className="row-between">
                                <span className="text-4 row gap-6"><MonitorStop size={12}/> Clock Out</span>
                                <span className="fw-600 text-2">{formatTime(record.clockOutAt)}</span>
                              </div>
                            )}

                            {duration && (
                              <div className="row-between pt-6" style={{ borderTop: "1px solid #E5E7EB" }}>
                                <span className="text-4">Total Logged</span>
                                <span className="fw-700 text-primary">{duration}</span>
                              </div>
                            )}
                          </div>

                          <button 
                            className="btn-secondary w-100" 
                            style={{ justifyContent: "center", fontSize: 12, borderRadius: 8 }}
                            onClick={() => {
                              setSelectedEmployee(record);
                              setOverrideType(record.status === "clocked_in" ? "clock_out" : "clock_in");
                              setOverrideTime("");
                              setOverrideReason("");
                            }}
                          >
                            <ShieldAlert size={14} className="mr-6" /> Supervisor Override
                          </button>
                        </CardBody>
                      </Card>
                    );
                  })}

                  {filteredRecords.length === 0 && (
                    <div className="col text-center py-40" style={{ gridColumn: "1 / -1" }}>
                      <div className="text-4 mb-16"><Search size={32} /></div>
                      <h3 className="text-lg fw-700 text-1">No attendance records found</h3>
                      <p className="text-sm text-5 mt-4">There are no punches registered for this filter or date selection.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Shift Management" && (
              <div>
                <div className="row-between mb-24">
                  <div>
                    <h3 className="text-xl fw-800 text-1">Weekly Shift Schedule</h3>
                    <p className="text-sm text-5 mt-4">Assign working shifts to team members to ensure real-time attendance accuracy.</p>
                  </div>
                  <div className="row gap-12">
                    <button className="btn-primary" onClick={() => toast.success("Schedule published", "Published to all active employees successfully.")}>
                      <Send size={16} className="mr-8"/> Publish Schedule
                    </button>
                  </div>
                </div>

                <Card style={{ overflow: "hidden", borderRadius: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 900 }}>
                    <thead style={{ background: "#F9FAFB" }}>
                      <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-4)", fontSize: 12, textTransform: "uppercase" }}>
                        <th style={{ padding: "16px 24px", fontWeight: 700, width: 220 }}>Employee</th>
                        {DAYS.map((day) => (
                          <th key={day} style={{ padding: "16px 12px", fontWeight: 700, textAlign: "center" }}>{day.slice(0, 3)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={r.employeeId} style={{ borderBottom: i === records.length - 1 ? "none" : "1px solid var(--border)" }}>
                          <td style={{ padding: "16px 24px" }}>
                            <div className="row gap-12">
                              <Avatar src={r.avatar} name={r.employeeName} size="sm" />
                              <div>
                                <div className="text-sm fw-700 text-1" style={{ whiteSpace: "nowrap" }}>{r.employeeName}</div>
                                <div className="text-xs text-5 mt-2">{r.department || "General"}</div>
                              </div>
                            </div>
                          </td>
                          {DAYS.map((day, dIdx) => (
                            <td key={day} style={{ padding: "16px 8px", textAlign: "center" }}>
                              <div 
                                style={{ display: "inline-block", cursor: "pointer" }}
                                onClick={() => setAssignShiftEmployee(r)}
                                title="Click to edit shift"
                              >
                                {dIdx < 5 ? (
                                  <Badge variant="primary" style={{ background: "#E0F2FE", color: "#0284C7" }}>Morning</Badge>
                                ) : (
                                  <Badge variant="neutral" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>Off</Badge>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Force Clock / Supervisor Override Modal */}
      <Modal 
        isOpen={!!selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        title="Supervisor Override Punch" 
        width={500} 
        footer={
          <div className="row-between w-100">
            <button className="btn-neutral" onClick={() => setSelectedEmployee(null)} disabled={isSubmittingOverride}>
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={handleForceClock} 
              disabled={isSubmittingOverride}
              style={{ background: "var(--primary)" }}
            >
              {isSubmittingOverride ? "Recording..." : `Confirm ${overrideType === "clock_in" ? "Clock In" : "Clock Out"}`}
            </button>
          </div>
        }
      >
        {selectedEmployee && (
          <div>
            <div className="p-16 mb-24" style={{ background: "var(--primary-tint)", borderRadius: 10, color: "var(--primary)" }}>
              <div className="row gap-12">
                <AlertTriangle size={20} />
                <span className="text-sm fw-700">
                  You are manually recording an attendance punch for <strong>{selectedEmployee.employeeName}</strong>. This override will be recorded in the immutable audit log.
                </span>
              </div>
            </div>

            <div className="grid-2 gap-20 mb-24">
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Override Action</label>
                <select 
                  className="input w-100" 
                  value={overrideType} 
                  onChange={(e) => setOverrideType(e.target.value as any)}
                >
                  <option value="clock_in">Clock In</option>
                  <option value="clock_out">Clock Out</option>
                </select>
              </div>
              <div>
                <label className="text-sm fw-600 text-2 mb-8 block">Punch Time</label>
                <input 
                  type="time" 
                  className="input w-100" 
                  value={overrideTime}
                  onChange={(e) => setOverrideTime(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-24">
              <label className="text-sm fw-600 text-2 mb-8 block">Reason for Override <span className="text-error">*</span></label>
              <textarea 
                className="input w-100" 
                rows={3} 
                placeholder="E.g. Employee forgot badge, network connectivity issue, approved field work..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Shift Modal */}
      <Modal 
        isOpen={!!assignShiftEmployee} 
        onClose={() => setAssignShiftEmployee(null)} 
        title="Assign Shift Profile" 
        width={400} 
        footer={
          <div className="row-between w-100">
            <button className="btn-neutral" onClick={() => setAssignShiftEmployee(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => { toast.success("Shift assigned", "Employee shift schedule updated."); setAssignShiftEmployee(null); }}>Save Changes</button>
          </div>
        }
      >
        {assignShiftEmployee && (
          <div>
            <div className="text-base fw-700 mb-16">Select Shift for {assignShiftEmployee.employeeName}</div>
            <div className="col gap-12">
              <label className="row gap-12 p-16" style={{ border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer" }}>
                <input type="radio" name="shift" defaultChecked />
                <div style={{ flex: 1 }}>
                  <div className="text-sm fw-700 text-1">Standard Morning (09:00 - 17:00)</div>
                  <div className="text-xs text-5 mt-2">8 Hours &bull; 1 hr lunch break</div>
                </div>
              </label>
              <label className="row gap-12 p-16" style={{ border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer" }}>
                <input type="radio" name="shift" />
                <div style={{ flex: 1 }}>
                  <div className="text-sm fw-700 text-1">Evening Shift (14:00 - 22:00)</div>
                  <div className="text-xs text-5 mt-2">8 Hours &bull; Shift allowance applies</div>
                </div>
              </label>
              <label className="row gap-12 p-16" style={{ border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", background: "#F9FAFB" }}>
                <input type="radio" name="shift" />
                <div style={{ flex: 1 }}>
                  <div className="text-sm fw-700 text-4">Scheduled Off</div>
                </div>
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
