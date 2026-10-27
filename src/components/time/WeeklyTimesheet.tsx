"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { CompulsoryMyTimeWidget } from "@/components/widgets";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";

interface AttendancePunch {
  id: string;
  employeeId: string;
  kind: string;
  occurredAt: string;
  source?: string;
  activity?: string;
  isBillable?: boolean;
}

interface Session {
  activity: string;
  minutes: number;
  range: string;
  isBillable: boolean;
  isOngoing: boolean;
}

interface DayRow {
  label: string;
  dateLabel: string;
  iso: string;
  isToday: boolean;
  minutes: number;
  range: string;
  sessions: Session[];
}

interface WeeklyTimesheetProps {
  /** Employee to show. Omit for the signed-in user. */
  employeeId?: string;
  /** Change this value to force a reload (e.g. after a manual entry). */
  refreshKey?: number;
  /** Weekly target in hours used for progress & overtime. */
  weeklyTargetHours?: number;
  title?: string;
  subtitle?: string;
  /** Allow adding manual time entries via modal. */
  allowManualEntry?: boolean;
  /** Show the live clock-in widget alongside the weekly timesheet. */
  showClockWidget?: boolean;
  headerActions?: React.ReactNode;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const isIn = (k?: string) => !!k && ["in", "clock_in", "break_end"].includes(k.toLowerCase());
const isOut = (k?: string) => !!k && ["out", "clock_out", "break_start"].includes(k.toLowerCase());
const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
export const fmtMinutes = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;

/** Shared weekly timesheet used on /time and inside employee profiles (/people/me and /people/[id]). */
export function WeeklyTimesheet({
  employeeId,
  refreshKey = 0,
  weeklyTargetHours = 40,
  title = "Weekly Timesheet",
  subtitle = "Synced attendance logs, daily work sessions, and billable hours breakdown.",
  allowManualEntry = false,
  showClockWidget = false,
  headerActions,
}: WeeklyTimesheetProps) {
  const { getToken } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [punches, setPunches] = useState<AttendancePunch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState<number | null>(null);

  // Manual entry modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualActivity, setManualActivity] = useState("Production");
  const [manualIsBillable, setManualIsBillable] = useState(true);
  const [manualStartTime, setManualStartTime] = useState("09:00");
  const [manualEndTime, setManualEndTime] = useState("17:00");

  useEffect(() => {
    setNow(Date.now());
    setManualDate(new Date().toISOString().slice(0, 10));
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const qs = new URLSearchParams({ limit: "500" });
      if (employeeId) qs.set("employeeId", employeeId);
      const res = await fetch(`${API_BASE_URL}/api/v1/attendance/punches?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPunches(Array.isArray(json) ? json : json.data || []);
      }
    } catch {
      /* empty state */
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, getToken]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleSaveManualEntry = async () => {
    if (!manualDate || !manualStartTime || !manualEndTime) {
      toast.error("Missing required fields", "Please enter date, start time, and end time.");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const startOccurred = `${manualDate}T${manualStartTime}:00Z`;
      const endOccurred = `${manualDate}T${manualEndTime}:00Z`;

      const inRes = await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          employeeId: employeeId || undefined,
          kind: "clock_in",
          occurredAt: startOccurred,
          source: "manual",
          activity: manualActivity,
          isBillable: manualIsBillable,
        }),
      });
      if (!inRes.ok) throw new Error("Failed to record clock-in punch");

      const outRes = await fetch(`${API_BASE_URL}/api/v1/attendance/punches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          employeeId: employeeId || undefined,
          kind: "clock_out",
          occurredAt: endOccurred,
          source: "manual",
          activity: manualActivity,
          isBillable: manualIsBillable,
        }),
      });
      if (!outRes.ok) throw new Error("Failed to record clock-out punch");

      toast.success("Time entry saved", "Punch records added to the timesheet.");
      setModalOpen(false);
      await load();
    } catch (err: any) {
      toast.error("Failed to save entry", err.message || "Unable to record punches.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { days, weekLabel } = useMemo(() => {
    const base = new Date(now ?? Date.now());
    base.setDate(base.getDate() + weekOffset * 7);
    const dow = base.getDay();
    const mon = new Date(base);
    mon.setDate(base.getDate() + (dow === 0 ? -6 : 1 - dow));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const todayIso = localIso(new Date(now ?? Date.now()));

    const sorted = [...punches].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

    const rows: DayRow[] = DAY_NAMES.map((label, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const iso = localIso(d);
      const dayPunches = sorted.filter((p) => p.occurredAt && localIso(new Date(p.occurredAt)) === iso);
      const sessions: Session[] = [];
      for (let j = 0; j < dayPunches.length; j++) {
        const cur = dayPunches[j];
        if (!isIn(cur.kind)) continue;
        const start = new Date(cur.occurredAt);
        const next = dayPunches[j + 1];
        let end: Date;
        let isOngoing = false;
        if (next && isOut(next.kind)) {
          end = new Date(next.occurredAt);
          j++;
        } else if (iso === todayIso && now) {
          end = new Date(now);
          isOngoing = true;
        } else {
          continue;
        }
        const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
        sessions.push({
          activity: cur.activity || (cur.source === "mobile" ? "Mobile" : "Production"),
          minutes,
          range: `${fmtTime(start)} – ${isOngoing ? "now" : fmtTime(end)}`,
          isBillable: cur.isBillable ?? true,
          isOngoing,
        });
      }
      const minutes = sessions.reduce((s, x) => s + x.minutes, 0);
      const first = sessions[0]?.range.split(" – ")[0];
      const last = sessions[sessions.length - 1]?.range.split(" – ")[1];
      return {
        label,
        dateLabel: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
        iso,
        isToday: iso === todayIso,
        minutes,
        range: first ? `${first} – ${last}` : "",
        sessions,
      };
    });

    return {
      days: rows,
      weekLabel: `${MONTHS[mon.getMonth()]} ${mon.getDate()} – ${MONTHS[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`,
    };
  }, [punches, weekOffset, now]);

  const totalMinutes = days.reduce((s, d) => s + d.minutes, 0);
  const daysWorked = days.filter((d) => d.minutes > 0).length;
  const targetMinutes = weeklyTargetHours * 60;
  const overtime = Math.max(0, totalMinutes - targetMinutes);
  const progress = Math.min(100, Math.round((totalMinutes / Math.max(1, targetMinutes)) * 100));
  const billableMinutes = days.reduce((s, d) => s + d.sessions.filter((x) => x.isBillable).reduce((a, x) => a + x.minutes, 0), 0);
  const maxDay = Math.max(8 * 60, ...days.map((d) => d.minutes));

  const timesheetCard = (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: "1px solid #F0F0F2", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>{title}</h3>
          {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#6E6E73" }}>{subtitle}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", alignItems: "center", background: "#F5F5F7", borderRadius: 8, padding: 2, border: "1px solid #E5E5EA" }}>
            <button type="button" onClick={() => setWeekOffset((w) => w - 1)} style={navBtn} aria-label="Previous week">
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F", padding: "0 10px", minWidth: 148, textAlign: "center" }}>{weekLabel}</span>
            <button type="button" onClick={() => setWeekOffset((w) => w + 1)} style={navBtn} aria-label="Next week">
              <ChevronRight size={14} />
            </button>
          </div>
          {weekOffset !== 0 && (
            <button type="button" className="btn-neutral btn-sm" style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7 }} onClick={() => setWeekOffset(0)}>
              This week
            </button>
          )}
          {allowManualEntry && (
            <button
              type="button"
              className="btn-primary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 12px", borderRadius: 8 }}
              onClick={() => setModalOpen(true)}
            >
              <Plus size={13} /> Add Time Entry
            </button>
          )}
          {headerActions}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid #F0F0F2", background: "#FBFBFD" }}>
        {[
          { label: "Weekly Total", value: fmtMinutes(totalMinutes), sub: `${progress}% of ${weeklyTargetHours}h target` },
          { label: "Days Logged", value: String(daysWorked), sub: daysWorked ? `${fmtMinutes(Math.round(totalMinutes / daysWorked))} daily avg` : "No shifts" },
          { label: "Billable Time", value: fmtMinutes(billableMinutes), sub: totalMinutes ? `${Math.round((billableMinutes / totalMinutes) * 100)}% of total` : "—" },
          { label: "Overtime", value: fmtMinutes(overtime), sub: overtime ? `Above ${weeklyTargetHours}h` : "Within schedule" },
        ].map((m, i) => (
          <div key={m.label} style={{ padding: "12px 20px", borderLeft: i ? "1px solid #F0F0F2" : "none" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
            <div style={{ fontSize: 11, color: "#86868B", marginTop: 1 }}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 3, background: "#F0F0F2" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "var(--primary, #2563EB)", transition: "width 0.3s" }} />
      </div>

      {/* Days */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 36 }}>
          <Loader2 size={20} className="animate-spin" color="#86868B" />
        </div>
      ) : (
        days.map((d) => {
          const has = d.sessions.length > 0;
          const open = !!expanded[d.iso];
          return (
            <div key={d.iso} style={{ borderTop: "1px solid #F5F5F7" }}>
              <div
                onClick={() => has && setExpanded((e) => ({ ...e, [d.iso]: !e[d.iso] }))}
                style={{
                  display: "grid",
                  gridTemplateColumns: "96px 1fr 150px 88px 20px",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 20px",
                  cursor: has ? "pointer" : "default",
                  background: open ? "#FAFAFC" : "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: d.minutes ? "#1D1D1F" : "#86868B" }}>
                    {d.label}
                    {d.isToday && <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 600, color: "var(--primary, #2563EB)" }}>Today</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#86868B" }}>{d.dateLabel}</div>
                </div>
                <div style={{ height: 6, background: "#F0F0F2", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((d.minutes / maxDay) * 100)}%`, background: d.minutes ? "var(--primary, #2563EB)" : "transparent", borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: "#6E6E73", whiteSpace: "nowrap" }}>{d.range || "No punches"}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: d.minutes ? "#1D1D1F" : "#86868B", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {fmtMinutes(d.minutes)}
                </div>
                <div style={{ color: "#86868B", display: "flex", justifyContent: "flex-end" }}>
                  {has && <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />}
                </div>
              </div>
              {open && (
                <div style={{ background: "#FAFAFC", padding: "2px 20px 10px 128px", borderTop: "1px solid #F0F0F2" }}>
                  {d.sessions.map((s, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 150px 88px 20px", gap: 12, alignItems: "center", padding: "6px 0", borderTop: i ? "1px dashed #E5E5EA" : "none" }}>
                      <div style={{ fontSize: 12.5, color: "#1D1D1F", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.isOngoing ? "var(--primary, #2563EB)" : "#86868B" }} />
                        <span style={{ fontWeight: 600 }}>{s.activity}</span>
                        <span style={{ fontSize: 11, color: "#6E6E73", background: "#F0F0F2", padding: "1px 6px", borderRadius: 4 }}>
                          {s.isBillable ? "Billable" : "Non-billable"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6E6E73" }}>{s.range}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1D1D1F", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtMinutes(s.minutes)}</div>
                      <div />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      {showClockWidget ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 310px", gap: 20, alignItems: "start" }}>
          {timesheetCard}
          <div style={{ position: "sticky", top: 24 }}>
            <CompulsoryMyTimeWidget />
          </div>
        </div>
      ) : (
        timesheetCard
      )}

      {allowManualEntry && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add Time Entry"
          footer={
            <>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveManualEntry} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Entry"}
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Activity</label>
                <select className="form-select" value={manualActivity} onChange={(e) => setManualActivity(e.target.value)}>
                  <option value="Production">Production</option>
                  <option value="Client Work">Client Work</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Training">Training</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Billing Type</label>
                <select
                  className="form-select"
                  value={manualIsBillable ? "billable" : "non_billable"}
                  onChange={(e) => setManualIsBillable(e.target.value === "billable")}
                >
                  <option value="billable">Billable</option>
                  <option value="non_billable">Non-billable</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-input" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input type="time" className="form-input" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

const navBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  border: "none",
  background: "transparent",
  borderRadius: 6,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#1D1D1F",
};
