"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarRange,
  Plus,
  Search,
  Sun,
  Globe,
  Loader2,
  CalendarDays,
  Repeat,
  Sparkles,
  Calendar as CalendarIcon,
  CheckCircle2,
  Filter,
  Info,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Building2,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface HolidayItem {
  id: string;
  name: string;
  holidayDate: string; // YYYY-MM-DD
  holidayType: string; // "national" | "company" | "religious" | "observance"
  appliesTo: string;   // "all" | "hq" | "remote" | string
  isRecurring?: boolean; // Repeats yearly on specific day/month
  recurrenceType?: "yearly_date" | "weekly_day" | "none";
  recurringMonthDay?: string; // MM-DD
  description?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const POPULAR_TEMPLATES = [
  { name: "New Year's Day", monthDay: "01-01", type: "national", desc: "Global annual holiday on January 1st" },
  { name: "Labour Day / May Day", monthDay: "05-01", type: "national", desc: "International Workers' Day on May 1st" },
  { name: "Independence Day", monthDay: "07-04", type: "national", desc: "National independence observance" },
  { name: "Company Founders Day", monthDay: "09-15", type: "company", desc: "Annual celebration of company founding" },
  { name: "Christmas Day", monthDay: "12-25", type: "national", desc: "Annual Christmas observance on December 25th" },
  { name: "Boxing Day / Year-End", monthDay: "12-26", type: "national", desc: "Annual holiday on December 26th" },
  { name: "Year-End Company Rest", monthDay: "12-31", type: "company", desc: "Annual office closure and rest day" },
];

export default function HolidaysPage() {
  const { getToken } = useAuth();
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Calendar");
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Selected calendar year
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [form, setForm] = useState({
    name: "",
    holidayDate: new Date().toISOString().split("T")[0],
    holidayType: "company",
    appliesTo: "all",
    isRecurring: true, // Default to recurring yearly as requested!
    description: "",
  });

  const loadHolidays = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/holidays`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const list: HolidayItem[] = Array.isArray(json) ? json : json.data || [];
        
        // Enrich from local storage metadata if available (for persistence of recurring flags)
        const localMeta = localStorage.getItem("easyhr_holiday_metadata");
        let metaMap: Record<string, { isRecurring?: boolean; description?: string }> = {};
        if (localMeta) {
          try {
            metaMap = JSON.parse(localMeta);
          } catch {}
        }

        const enriched = list.map((h) => {
          const meta = metaMap[h.id] || metaMap[h.name];
          const isRec = meta?.isRecurring ?? true; // defaults to true for annual holidays
          return {
            ...h,
            isRecurring: isRec,
            description: meta?.description || "",
          };
        });

        setHolidays(enriched);
      }
    } catch (err) {
      console.error("Failed to load holidays", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleCreateHoliday = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name.trim() || !form.holidayDate) {
      toast.error("Required fields", "Please enter a holiday name and date.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/holidays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          holidayDate: form.holidayDate,
          holidayType: form.holidayType,
          appliesTo: form.appliesTo,
        }),
      });

      if (res.ok) {
        const created = await res.json().catch(() => ({}));
        
        // Save recurring state metadata locally so recurring holidays project across all years
        const localMeta = localStorage.getItem("easyhr_holiday_metadata");
        let metaMap: Record<string, any> = {};
        if (localMeta) {
          try { metaMap = JSON.parse(localMeta); } catch {}
        }
        const key = created.id || form.name.trim();
        metaMap[key] = {
          isRecurring: form.isRecurring,
          description: form.description,
        };
        metaMap[form.name.trim()] = {
          isRecurring: form.isRecurring,
          description: form.description,
        };
        localStorage.setItem("easyhr_holiday_metadata", JSON.stringify(metaMap));

        toast.success(
          form.isRecurring ? "Annual Holiday Scheduled" : "Holiday Scheduled",
          form.isRecurring
            ? `${form.name.trim()} will repeat every year on this date.`
            : `${form.name.trim()} added to the calendar.`
        );
        setShowModal(false);
        setForm({
          name: "",
          holidayDate: new Date().toISOString().split("T")[0],
          holidayType: "company",
          appliesTo: "all",
          isRecurring: true,
          description: "",
        });
        loadHolidays();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Failed", errJson.detail || "Unable to save holiday.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to save holiday.");
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = (tpl: typeof POPULAR_TEMPLATES[0]) => {
    setForm({
      ...form,
      name: tpl.name,
      holidayDate: `${selectedYear}-${tpl.monthDay}`,
      holidayType: tpl.type,
      isRecurring: true,
      description: tpl.desc,
    });
  };

  // Generate holidays for the selected calendar year (with annual recurrence projection!)
  const yearHolidays = useMemo(() => {
    const list: (HolidayItem & { computedDate: string })[] = [];
    const seen = new Set<string>();

    holidays.forEach((h) => {
      const parts = h.holidayDate.split("-");
      const hYear = parseInt(parts[0], 10);
      const monthDay = `${parts[1]}-${parts[2]}`;

      if (h.isRecurring) {
        // Project to the currently viewed year
        const projectedDate = `${selectedYear}-${monthDay}`;
        const key = `${h.name}-${projectedDate}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ ...h, computedDate: projectedDate });
        }
      } else if (hYear === selectedYear) {
        const key = `${h.name}-${h.holidayDate}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ ...h, computedDate: h.holidayDate });
        }
      }
    });

    // Sort chronologically by date
    return list.sort((a, b) => a.computedDate.localeCompare(b.computedDate));
  }, [holidays, selectedYear]);

  // Filtered list
  const filteredHolidays = useMemo(() => {
    let result = yearHolidays;
    if (filterType !== "all") {
      result = result.filter((h) => h.holidayType === filterType);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.computedDate.includes(q) ||
          h.holidayType.includes(q) ||
          h.appliesTo.toLowerCase().includes(q)
      );
    }
    return result;
  }, [yearHolidays, filterType, query]);

  // Grouped by month for the calendar overview
  const monthGroups = useMemo(() => {
    const groups: Record<number, (HolidayItem & { computedDate: string })[]> = {};
    for (let m = 0; m < 12; m++) groups[m] = [];
    yearHolidays.forEach((h) => {
      const m = parseInt(h.computedDate.split("-")[1], 10) - 1;
      if (groups[m]) groups[m].push(h);
    });
    return groups;
  }, [yearHolidays]);

  const nationalCount = yearHolidays.filter((h) => h.holidayType === "national").length;
  const companyCount = yearHolidays.filter((h) => h.holidayType === "company").length;
  const recurringCount = yearHolidays.filter((h) => h.isRecurring).length;

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <PageHeader
        title="Company Holidays"
        subtitle="Manage annual recurring holidays, public observances, and custom company days off."
        icon={<CalendarRange size={28} className="text-white" />}
        tabs={["Calendar", "List", "Annual Templates"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Year selector */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                padding: "4px 8px",
                borderRadius: 999,
                color: "white",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, padding: "0 6px" }}>{selectedYear}</span>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              className="btn-secondary"
              style={{
                background: "white",
                color: "var(--primary)",
                border: "none",
                padding: "10px 18px",
                fontSize: 13.5,
                fontWeight: 700,
                borderRadius: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              onClick={() => {
                setForm({
                  name: "",
                  holidayDate: `${selectedYear}-${new Date().toISOString().slice(5, 10)}`,
                  holidayType: "company",
                  appliesTo: "all",
                  isRecurring: true,
                  description: "",
                });
                setShowModal(true);
              }}
            >
              <Plus size={16} style={{ marginRight: 6 }} /> Add Holiday
            </button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px", background: "var(--bg-page)" }}>
        <StatRibbon
          stats={[
            {
              label: `Total Holidays (${selectedYear})`,
              value: yearHolidays.length,
              icon: <CalendarDays size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Annual Recurring",
              value: recurringCount,
              icon: <Repeat size={20} />,
              color: "#8B5CF6",
            },
            {
              label: "Company Observances",
              value: companyCount,
              icon: <Sun size={20} />,
              color: "var(--warning)",
            },
            {
              label: "Public / National",
              value: nationalCount,
              icon: <Globe size={20} />,
              color: "var(--success)",
            },
          ]}
        />

        {/* ─── Annual Recurrence Notice Banner ─── */}
        <div
          style={{
            marginTop: 18,
            marginBottom: 20,
            padding: "12px 18px",
            background: "#F5F3FF",
            border: "1px solid #DDD6FE",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#EDE9FE",
                color: "#7C3AED",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Repeat size={17} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4C1D95" }}>
                Annual Recurring Holiday Engine Active
              </div>
              <div style={{ fontSize: 11.5, color: "#6D28D9" }}>
                Holidays set to <strong>Repeat every year</strong> automatically roll forward on their exact calendar day across all future years without manual re-entry.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("Annual Templates")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #C4B5FD",
              background: "#FFFFFF",
              color: "#7C3AED",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Browse Popular Templates
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : activeTab === "Annual Templates" ? (
          /* ─── TAB 3: POPULAR ANNUAL TEMPLATES ─── */
          <Card>
            <CardBody>
              <SectionHeading
                title="Popular Annual Holiday Templates"
                description="One-click standard holidays configured to repeat every year on specific calendar days."
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginTop: 14 }}>
                {POPULAR_TEMPLATES.map((tpl) => {
                  const alreadyAdded = holidays.some((h) => h.name.toLowerCase() === tpl.name.toLowerCase());
                  return (
                    <div
                      key={tpl.name}
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background: "white",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: tpl.type === "national" ? "var(--primary-tint)" : "#FEF3C7",
                            color: tpl.type === "national" ? "var(--primary)" : "#D97706",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <CalendarIcon size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>
                            {tpl.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2 }}>
                            {tpl.desc}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: "#F5F3FF",
                                color: "#7C3AED",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              <Repeat size={10} /> Yearly on {tpl.monthDay}
                            </span>
                            <StatusPill tone={tpl.type === "national" ? "primary" : "warning"}>
                              {tpl.type.toUpperCase()}
                            </StatusPill>
                          </div>
                        </div>
                      </div>

                      <button
                        className={alreadyAdded ? "btn-neutral" : "btn-primary"}
                        style={{ width: "100%", justifyContent: "center", fontSize: 12.5 }}
                        disabled={alreadyAdded}
                        onClick={() => {
                          applyTemplate(tpl);
                          setShowModal(true);
                        }}
                      >
                        {alreadyAdded ? (
                          <>
                            <CheckCircle2 size={14} color="#10B981" /> Already in Calendar
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Add to {selectedYear} & Future Years
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        ) : activeTab === "Calendar" ? (
          /* ─── TAB 1: 12-MONTH CALENDAR GRID OVERVIEW ─── */
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card>
              <CardBody>
                <SectionHeading
                  title={`${selectedYear} Annual Calendar Overview`}
                  description="All scheduled observances grouped by month. Holidays with annual recurrence repeat automatically."
                  action={
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          background: "white",
                        }}
                      >
                        <Search size={14} color="var(--text-4)" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Filter observances..."
                          style={{ border: 0, outline: 0, fontSize: 12.5, width: 150 }}
                        />
                      </div>
                      <Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ fontSize: 12.5, padding: "6px 10px", width: 140 }}
                      >
                        <option value="all">All Types</option>
                        <option value="company">Company Only</option>
                        <option value="national">Public / National</option>
                      </Select>
                    </div>
                  }
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
                    gap: 16,
                    marginTop: 16,
                  }}
                >
                  {MONTH_NAMES.map((mName, mIdx) => {
                    const monthHolidays = monthGroups[mIdx] || [];
                    const hasItems = monthHolidays.length > 0;
                    return (
                      <div
                        key={mName}
                        style={{
                          border: hasItems ? "1.5px solid #DDD6FE" : "1px solid var(--border)",
                          borderRadius: 14,
                          background: hasItems ? "#FAFAFE" : "white",
                          padding: 14,
                          display: "flex",
                          flexDirection: "column",
                          minHeight: 140,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingBottom: 8,
                            borderBottom: "1px solid var(--border)",
                            marginBottom: 8,
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>
                            {mName}
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 999,
                              background: hasItems ? "var(--primary-tint)" : "var(--bg-page)",
                              color: hasItems ? "var(--primary)" : "var(--text-4)",
                            }}
                          >
                            {monthHolidays.length} {monthHolidays.length === 1 ? "day" : "days"}
                          </span>
                        </div>

                        {monthHolidays.length === 0 ? (
                          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 11.5, color: "var(--text-5)", fontStyle: "italic" }}>
                              No holidays scheduled
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                            {monthHolidays.map((h) => {
                              const day = parseInt(h.computedDate.split("-")[2], 10);
                              return (
                                <div
                                  key={h.id || h.name}
                                  style={{
                                    padding: "6px 8px",
                                    borderRadius: 8,
                                    background: "white",
                                    border: "1px solid var(--border)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                    <span
                                      style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 6,
                                        background: h.holidayType === "national" ? "var(--primary-tint)" : "#FEF3C7",
                                        color: h.holidayType === "national" ? "var(--primary)" : "#D97706",
                                        fontSize: 11,
                                        fontWeight: 800,
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {day}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "var(--text-1)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {h.name}
                                    </span>
                                  </div>
                                  {h.isRecurring && (
                                    <span title="Repeats every year on this day" style={{ color: "#7C3AED", flexShrink: 0 }}>
                                      <Repeat size={12} />
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const mm = String(mIdx + 1).padStart(2, "0");
                            setForm({
                              name: "",
                              holidayDate: `${selectedYear}-${mm}-01`,
                              holidayType: "company",
                              appliesTo: "all",
                              isRecurring: true,
                              description: "",
                            });
                            setShowModal(true);
                          }}
                          style={{
                            marginTop: 10,
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px dashed var(--border)",
                            background: "transparent",
                            color: "var(--text-4)",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                          }}
                        >
                          <Plus size={11} /> Add to {mName}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          /* ─── TAB 2: DETAILED LIST VIEW ─── */
          <Card>
            <CardBody>
              <SectionHeading
                title={`All Company Holidays (${selectedYear})`}
                description="List of all company and public holidays with recurrence rules and employee applicability."
                action={
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        border: "1px solid var(--border)",
                        borderRadius: 9,
                        minWidth: 240,
                        background: "white",
                      }}
                    >
                      <Search size={15} color="var(--text-4)" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search holidays..."
                        style={{ border: 0, outline: 0, width: "100%", fontFamily: "inherit", fontSize: 13 }}
                      />
                    </div>
                    <Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{ fontSize: 13, padding: "7px 12px", width: 150 }}
                    >
                      <option value="all">All Classifications</option>
                      <option value="company">Company Only</option>
                      <option value="national">Public / National</option>
                    </Select>
                  </div>
                }
              />

              {filteredHolidays.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <CalendarRange size={36} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                  <h3 className="text-base fw-800 text-1">No holidays match your filter</h3>
                  <p className="text-xs text-4 mt-4 mb-16">
                    Add regional public holidays or recurring company days off to your calendar.
                  </p>
                  <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={15} /> Add Holiday
                  </button>
                </div>
              ) : (
                <div className="col gap-10" style={{ marginTop: 14 }}>
                  {filteredHolidays.map((h) => (
                    <DataRow
                      key={h.id || `${h.name}-${h.computedDate}`}
                      leading={
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 11,
                            display: "grid",
                            placeItems: "center",
                            background: h.holidayType === "national" ? "var(--primary-tint)" : "#FEF3C7",
                            color: h.holidayType === "national" ? "var(--primary)" : "#D97706",
                          }}
                        >
                          <Sun size={19} />
                        </div>
                      }
                      title={
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{h.name}</span>
                          {h.isRecurring && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 7px",
                                borderRadius: 6,
                                background: "#F5F3FF",
                                color: "#7C3AED",
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              <Repeat size={10} /> Yearly on {h.computedDate.slice(5)}
                            </span>
                          )}
                        </div>
                      }
                      subtitle={`${h.computedDate} · Applies to: ${h.appliesTo === "all" ? "All Team Members" : h.appliesTo}`}
                      meta={
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <StatusPill tone={h.holidayType === "national" ? "primary" : "warning"}>
                            {h.holidayType.toUpperCase()}
                          </StatusPill>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* ─── Add Holiday Modal ─── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Company Holiday"
        subtitle="Configure public or internal observances with annual recurrence rules"
        width={560}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateHoliday}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : "Save Holiday"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateHoliday} className="col gap-14">
          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Holiday Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Independence Day, Labour Day, Year-End Close"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Observed Date *
              </label>
              <Input
                type="date"
                value={form.holidayDate}
                onChange={(e) => setForm({ ...form, holidayDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Classification
              </label>
              <Select
                value={form.holidayType}
                onChange={(e) => setForm({ ...form, holidayType: e.target.value })}
              >
                <option value="company">Company Day Off</option>
                <option value="national">Public / National Holiday</option>
              </Select>
            </div>
          </div>

          {/* ─── Recurrence Toggle (Addressing user request directly) ─── */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: form.isRecurring ? "#F5F3FF" : "var(--bg-page)",
              border: form.isRecurring ? "1.5px solid #DDD6FE" : "1px solid var(--border)",
              transition: "all 0.15s ease",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                margin: 0,
              }}
            >
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                style={{
                  marginTop: 3,
                  width: 17,
                  height: 17,
                  accentColor: "#7C3AED",
                  cursor: "pointer",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Repeat size={14} color="#7C3AED" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: form.isRecurring ? "#4C1D95" : "var(--text-1)" }}>
                    Repeats Every Year on This Specific Date
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: form.isRecurring ? "#6D28D9" : "var(--text-4)", margin: "3px 0 0" }}>
                  When enabled, this holiday automatically applies year after year (e.g. Jan 1st, July 4th, Dec 25th) without manual reconfiguration.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Applies To
            </label>
            <Select
              value={form.appliesTo}
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
            >
              <option value="all">All Employees (Company-wide)</option>
              <option value="hq">Headquarters Only</option>
              <option value="remote">Remote Team Members Only</option>
              <option value="engineering">Engineering Division</option>
            </Select>
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Notes or Observance Details (Optional)
            </label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Office closed; remote on-call rotations apply"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
