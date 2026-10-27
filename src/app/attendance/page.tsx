"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Search, Filter, Clock, MapPin, AlertTriangle, ChevronDown, 
  MonitorPlay, MonitorStop, RefreshCw, CalendarDays, Edit3, Send,
  CheckCircle2, LogIn, LogOut, UserCheck, ShieldAlert, Trash2, Plus
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { AttendanceSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { useRole } from "@/context/RoleContext";

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

const TABS = ["Live Attendance", "Shift Management", "Punch Activities"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface ActivityItem {
  id: string;
  name: string;
  code?: string;
  isBillable: boolean;
  color?: string;
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { id: 'act-1', name: 'Production',  isBillable: true,  color: '#7c3aed' },
  { id: 'act-2', name: 'Meeting',     isBillable: true,  color: '#2563eb' },
  { id: 'act-3', name: 'Break',       isBillable: false, color: '#f59e0b' },
  { id: 'act-4', name: 'Lunch',       isBillable: false, color: '#10b981' },
  { id: 'act-5', name: 'Training',    isBillable: true,  color: '#8b5cf6' },
  { id: 'act-6', name: 'Client Work', isBillable: true,  color: '#06b6d4' },
];

function AttendanceContent() {
  const { getToken, isSignedIn } = useAuth();
  const { isHRAdmin, isManager, currentUser } = useRole();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isHRAdmin && !isManager) {
      router.replace("/time");
    }
  }, [isHRAdmin, isManager, router]);
  const initialTab = searchParams?.get("tab") === "activities" ? "Punch Activities" : "Live Attendance";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [records, setRecords] = useState<LiveAttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [punchMessage, setPunchMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Punch Activities state
  const [activities, setActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityBillable, setNewActivityBillable] = useState(true);

  const myRecord = useMemo(() => {
    const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim().toLowerCase();
    return (
      records.find(
        (r) =>
          r.employeeId === currentUser.id ||
          (fullName && r.employeeName.toLowerCase().includes(fullName))
      ) || (records.length > 0 && !isHRAdmin && !isManager ? records[0] : null)
    );
  }, [records, currentUser, isHRAdmin, isManager]);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState('');

  // Current live clock for header
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
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
        title={isHRAdmin || isManager ? "Live Team Attendance" : "Punch Clock & Attendance"}
        subtitle={
          isHRAdmin || isManager
            ? "Real-time employee punches, timesheet monitoring, and manager overrides."
            : "Record daily punches, track working hours, and review personal attendance logs."
        }
        tabs={isHRAdmin || isManager ? TABS : undefined}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px", background: "var(--bg-page)" }}>
        {isLoading ? (
          <AttendanceSkeleton />
        ) : (
          <>
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

            {!isHRAdmin && !isManager ? (
              <div className="col gap-24">
                {/* Personal Daily Summary Cards */}
                <div className="grid-3 gap-16">
                  <Card style={{ borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <CardBody style={{ padding: "20px 24px" }}>
                      <div className="text-xs uppercase fw-700 text-4 mb-8">Today's Status</div>
                      <div className="row-between align-center">
                        <div className="text-xl fw-800 text-1">
                          {myRecord?.status === "clocked_in" ? "Clocked In" : myRecord?.status === "clocked_out" ? "Clocked Out" : "Not Clocked In"}
                        </div>
                        {myRecord && renderStatusBadge(myRecord.status)}
                      </div>
                      <p className="text-xs text-4 mt-6">
                        {myRecord?.status === "clocked_in"
                          ? "Currently working. Remember to clock out when ending your shift."
                          : "Record your working shift timestamps for today."}
                      </p>
                      <div className="row gap-8 mt-14">
                        <button
                          onClick={() => handlePunch("clock_in")}
                          disabled={isPunching || myRecord?.status === "clocked_in"}
                          className="btn"
                          style={{
                            background: "#10B981",
                            color: "white",
                            fontWeight: 700,
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "none",
                            cursor: isPunching || myRecord?.status === "clocked_in" ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            opacity: myRecord?.status === "clocked_in" ? 0.5 : 1,
                            transition: "all 0.2s ease"
                          }}
                        >
                          <LogIn size={14} />
                          {isPunching ? "..." : "Clock In"}
                        </button>
                        <button
                          onClick={() => handlePunch("clock_out")}
                          disabled={isPunching || myRecord?.status !== "clocked_in"}
                          className="btn"
                          style={{
                            background: "#6B7280",
                            color: "white",
                            fontWeight: 700,
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "none",
                            cursor: isPunching || myRecord?.status !== "clocked_in" ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            opacity: myRecord?.status !== "clocked_in" ? 0.5 : 1,
                            transition: "all 0.2s ease"
                          }}
                        >
                          <LogOut size={14} />
                          {isPunching ? "..." : "Clock Out"}
                        </button>
                      </div>
                    </CardBody>
                  </Card>

                  <Card style={{ borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <CardBody style={{ padding: "20px 24px" }}>
                      <div className="text-xs uppercase fw-700 text-4 mb-8">Punches Today</div>
                      <div className="col gap-6">
                        <div className="row-between text-sm">
                          <span className="text-4 row gap-6"><MonitorPlay size={14} className="text-success" /> First Clock In:</span>
                          <span className="fw-700 text-1">{formatTime(myRecord?.clockInAt)}</span>
                        </div>
                        <div className="row-between text-sm">
                          <span className="text-4 row gap-6"><MonitorStop size={14} className="text-4" /> Last Clock Out:</span>
                          <span className="fw-700 text-1">{formatTime(myRecord?.clockOutAt)}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card style={{ borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <CardBody style={{ padding: "20px 24px" }}>
                      <div className="text-xs uppercase fw-700 text-4 mb-8">Total Logged Today</div>
                      <div className="text-2xl fw-800 text-primary">
                        {getWorkedDuration(myRecord?.clockInAt, myRecord?.clockOutAt) || "--"}
                      </div>
                      <p className="text-xs text-4 mt-6">Active tracked working time for today.</p>
                    </CardBody>
                  </Card>
                </div>

                {/* Personal Attendance Record Table */}
                <Card style={{ borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 className="m-0 text-base fw-700 text-1">My Daily Punch Record</h3>
                      <p className="m-0 text-xs text-4 mt-2">Verified time logs for this payroll cycle</p>
                    </div>
                    <Badge variant="neutral">{currentTime ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : ""}</Badge>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ background: "#F9FAFB", borderBottom: "1px solid var(--border)" }}>
                      <tr style={{ color: "var(--text-4)", fontSize: 12, textTransform: "uppercase" }}>
                        <th style={{ padding: "14px 24px", fontWeight: 700 }}>Date</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Clock In</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Clock Out</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Duration</th>
                        <th style={{ padding: "14px 24px", fontWeight: 700, textAlign: "right" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600 }}>
                        {currentTime ? new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) : ""} (Today)
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600 }}>{formatTime(myRecord?.clockInAt)}</td>
                        <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600 }}>{formatTime(myRecord?.clockOutAt)}</td>
                        <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                          {getWorkedDuration(myRecord?.clockInAt, myRecord?.clockOutAt) || "--"}
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                          {renderStatusBadge(myRecord?.status || "absent")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </div>
            ) : (
              <>
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

            {activeTab === "Punch Activities" && (
              <div>
                <div className="row-between mb-24">
                  <div>
                    <h3 className="text-xl fw-800 text-1">Organization Punch Activities</h3>
                    <p className="text-sm text-5 mt-4">
                      Configure clock-in and break activity types. Designate which activities are billable to ensure accurate payroll and timesheet calculations.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 0.8fr)", gap: 24 }}>
                  {/* Left: Activities List */}
                  <Card style={{ borderRadius: 16 }}>
                    <CardBody style={{ padding: "20px 24px" }}>
                      <h4 className="text-base fw-700 text-1 mb-16">Active Clock-in Activities</h4>
                      <div className="col gap-10">
                        {activities.map((act) => (
                          <div
                            key={act.name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "14px 18px",
                              borderRadius: 12,
                              background: "#FAF9F7",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  background: act.color || "#7c3aed",
                                  flexShrink: 0,
                                }}
                              />
                              <div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{act.name}</span>
                                <div className="text-xs text-5 mt-2">
                                  {act.isBillable ? "Tracked as standard productive work hours" : "Recorded as non-working / break time"}
                                </div>
                              </div>
                            </div>

                            <div className="row gap-12 align-center">
                              <Badge variant={act.isBillable ? "success" : "neutral"} style={{ fontSize: 11, padding: "3px 10px" }}>
                                {act.isBillable ? "Billable" : "Non-billable"}
                              </Badge>

                              {isHRAdmin && activities.length > 2 && (
                                <button
                                  type="button"
                                  className="btn-circle"
                                  style={{ width: 30, height: 30, color: "#ef4444" }}
                                  onClick={() => {
                                    setActivities((prev) => prev.filter((a) => a.name !== act.name));
                                    toast.info("Activity removed", `Removed ${act.name} from punch options.`);
                                  }}
                                  title="Remove activity"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>

                  {/* Right: Add Activity Card */}
                  {isHRAdmin && (
                    <Card style={{ borderRadius: 16, height: "fit-content" }}>
                      <CardBody style={{ padding: "20px 24px" }}>
                        <h4 className="text-base fw-700 text-1 mb-8">Add New Activity Type</h4>
                        <p className="text-xs text-5 mb-16">
                          Define a custom task category that team members can pick from their dashboard clock-in button.
                        </p>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!newActivityName.trim()) return;
                            const colors = ["#7c3aed", "#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
                            const color = colors[activities.length % colors.length];
                            setActivities([
                              ...activities,
                              {
                                id: `act-${Date.now()}`,
                                name: newActivityName.trim(),
                                isBillable: newActivityBillable,
                                color,
                              },
                            ]);
                            toast.success("Activity added", `"${newActivityName.trim()}" is now available for time tracking.`);
                            setNewActivityName("");
                            setNewActivityBillable(true);
                          }}
                          className="col gap-14"
                        >
                          <div>
                            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                              Activity Name *
                            </label>
                            <Input
                              placeholder="e.g. Code Review, Field Visit..."
                              value={newActivityName}
                              onChange={(e) => setNewActivityName(e.target.value)}
                              required
                            />
                          </div>

                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              fontSize: 13,
                              cursor: "pointer",
                              padding: "10px 14px",
                              background: "#FAF9F7",
                              borderRadius: 10,
                              border: "1px solid var(--border)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={newActivityBillable}
                              onChange={(e) => setNewActivityBillable(e.target.checked)}
                            />
                            <span>
                              Count as <strong>Billable</strong> working hours in Payroll
                            </span>
                          </label>

                          <button
                            type="submit"
                            className="btn-primary"
                            disabled={!newActivityName.trim()}
                            style={{ justifyContent: "center", marginTop: 4 }}
                          >
                            <Plus size={16} className="mr-6" /> Add Punch Activity
                          </button>
                        </form>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </div>
            )}
              </>
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

export default function AttendancePage() {
  return (
    <React.Suspense fallback={<AttendanceSkeleton />}>
      <AttendanceContent />
    </React.Suspense>
  );
}
