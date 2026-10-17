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
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
    isRecurring: true,
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

        const localMeta = localStorage.getItem("easyhr_holiday_metadata");
        let metaMap: Record<string, { isRecurring?: boolean; description?: string }> = {};
        if (localMeta) {
          try {
            metaMap = JSON.parse(localMeta);
          } catch {}
        }

        const enriched = list.map((h) => {
          const meta = metaMap[h.id] || metaMap[h.name];
          const isRec = meta?.isRecurring ?? true;
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

        const localMeta = localStorage.getItem("easyhr_holiday_metadata");
        let metaMap: Record<string, any> = {};
        if (localMeta) {
          try {
            metaMap = JSON.parse(localMeta);
          } catch {}
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

  const applyTemplate = (tpl: (typeof POPULAR_TEMPLATES)[0]) => {
    setForm({
      ...form,
      name: tpl.name,
      holidayDate: `${selectedYear}-${tpl.monthDay}`,
      holidayType: tpl.type,
      isRecurring: true,
      description: tpl.desc,
    });
  };

  const yearHolidays = useMemo(() => {
    const list: (HolidayItem & { computedDate: string })[] = [];
    const seen = new Set<string>();

    holidays.forEach((h) => {
      const parts = h.holidayDate.split("-");
      const hYear = parseInt(parts[0], 10);
      const monthDay = `${parts[1]}-${parts[2]}`;

      if (h.isRecurring) {
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

    return list.sort((a, b) => a.computedDate.localeCompare(b.computedDate));
  }, [holidays, selectedYear]);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="Company Holidays"
        subtitle="Manage annual recurring holidays, public observances, and custom company days off."
        icon={<CalendarRange size={20} />}
        tabs={["Calendar", "List", "Annual Templates"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Year selector */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                background: "rgba(255, 255, 255, 0.14)",
                height: 34,
                padding: "0 6px",
                borderRadius: 9,
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.22)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 4px !important" as any,
                  height: "24px !important" as any,
                }}
                title="Previous Year"
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: 12.5, padding: "0 6px" }}>{selectedYear}</span>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 4px !important" as any,
                  height: "24px !important" as any,
                }}
                title="Next Year"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <button
              type="button"
              style={{
                background: "#FFFFFF",
                color: "var(--primary)",
                border: "none",
                height: 34,
                padding: "0 14px",
                fontSize: 12.5,
                borderRadius: 9,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
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
              <Plus size={14} />
              <span>Add Holiday</span>
            </button>
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <StatRibbon
          stats={[
            {
              label: `Total Holidays (${selectedYear})`,
              value: yearHolidays.length,
              icon: <CalendarDays size={17} />,
            },
            {
              label: "Annual Recurring",
              value: recurringCount,
              icon: <Repeat size={17} />,
            },
            {
              label: "Company Observances",
              value: companyCount,
              icon: <Sun size={17} />,
            },
            {
              label: "Public / National",
              value: nationalCount,
              icon: <Globe size={17} />,
            },
          ]}
        />

        {/* Annual Recurrence Notice Bar (Clean Brand-Consistent Surface) */}
        <div
          style={{
            padding: "12px 18px",
            background: "#FFFFFF",
            border: "1px solid var(--card-border, #E4E4E7)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "var(--primary-tint)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Repeat size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-1, #18181B)" }}>
                Annual Recurring Holiday Engine
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3, #A1A1AA)", marginTop: 1 }}>
                Holidays marked to repeat annually automatically project onto the same calendar day across all future years.
              </div>
            </div>
          </div>
          {activeTab !== "Annual Templates" && (
            <button
              type="button"
              onClick={() => setActiveTab("Annual Templates")}
              className="btn-neutral btn-sm"
            >
              Browse Annual Templates
            </button>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : activeTab === "Annual Templates" ? (
          /* ─── TAB 3: POPULAR ANNUAL TEMPLATES ─── */
          <Card>
            <CardBody>
              <SectionHeading
                title="Annual Holiday Templates"
                description="Standard public and company holidays pre-configured to repeat every year on their calendar date."
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 14,
                }}
              >
                {POPULAR_TEMPLATES.map((tpl) => {
                  const alreadyAdded = holidays.some(
                    (h) => h.name.toLowerCase() === tpl.name.toLowerCase()
                  );
                  return (
                    <div
                      key={tpl.name}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: "1px solid var(--card-border, #E4E4E7)",
                        background: "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 9,
                            background: "#FAF9F7",
                            border: "1px solid var(--card-border, #E4E4E7)",
                            color: "var(--text-1, #18181B)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <CalendarIcon size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, color: "var(--text-1, #18181B)" }}>
                            {tpl.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-3, #A1A1AA)",
                              marginTop: 2,
                              lineHeight: 1.4,
                            }}
                          >
                            {tpl.desc}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: "#FAF9F7",
                                border: "1px solid var(--card-border, #E4E4E7)",
                                color: "var(--text-2, #52525B)",
                                fontSize: 11,
                              }}
                            >
                              <Repeat size={10} />
                              <span>Yearly · {tpl.monthDay}</span>
                            </span>
                            <StatusPill tone={tpl.type === "national" ? "primary" : "neutral"}>
                              {tpl.type === "national" ? "Public" : "Company"}
                            </StatusPill>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={alreadyAdded ? "btn-neutral btn-sm" : "btn-primary btn-sm"}
                        style={{ width: "100%", justifyContent: "center" }}
                        disabled={alreadyAdded}
                        onClick={() => {
                          applyTemplate(tpl);
                          setShowModal(true);
                        }}
                      >
                        {alreadyAdded ? (
                          <>
                            <CheckCircle2 size={13} color="#059669" />
                            <span>Scheduled in Calendar</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Schedule Annual Holiday</span>
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
          <Card>
            <CardBody>
              <SectionHeading
                title={`${selectedYear} Annual Calendar`}
                description="Scheduled observances grouped by month."
                action={
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        height: 36,
                        border: "1px solid var(--card-border, #E4E4E7)",
                        borderRadius: 9,
                        background: "#FFFFFF",
                      }}
                    >
                      <Search size={14} color="var(--text-3, #A1A1AA)" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filter observances..."
                        style={{
                          border: 0,
                          outline: 0,
                          fontSize: 12.5,
                          width: 150,
                          background: "transparent",
                        }}
                      />
                    </div>
                    <div style={{ width: 160 }}>
                      <Select
                        value={filterType}
                        onValueChange={(val) => setFilterType(val)}
                        options={[
                          { value: "all", label: "All Types" },
                          { value: "company", label: "Company Only" },
                          { value: "national", label: "Public / National" },
                        ]}
                      />
                    </div>
                  </div>
                }
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                {MONTH_NAMES.map((mName, mIdx) => {
                  const monthHolidays = monthGroups[mIdx] || [];
                  const hasItems = monthHolidays.length > 0;
                  return (
                    <div
                      key={mName}
                      style={{
                        border: "1px solid var(--card-border, #E4E4E7)",
                        borderRadius: 12,
                        background: hasItems ? "#FFFFFF" : "#FAF9F7",
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 136,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingBottom: 8,
                          borderBottom: "1px solid var(--card-border, #E4E4E7)",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 13, color: "var(--text-1, #18181B)" }}>
                          {mName}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: "2px 7px",
                            borderRadius: 999,
                            background: hasItems ? "var(--primary-tint)" : "#F4F4F5",
                            color: hasItems ? "var(--primary)" : "var(--text-3, #A1A1AA)",
                          }}
                        >
                          {monthHolidays.length} {monthHolidays.length === 1 ? "day" : "days"}
                        </span>
                      </div>

                      {monthHolidays.length === 0 ? (
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: 11.5, color: "var(--text-3, #A1A1AA)" }}>
                            No holidays scheduled
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            flex: 1,
                          }}
                        >
                          {monthHolidays.map((h) => {
                            const day = parseInt(h.computedDate.split("-")[2], 10);
                            return (
                              <div
                                key={h.id || h.name}
                                style={{
                                  padding: "6px 8px",
                                  borderRadius: 8,
                                  background: "#FAF9F7",
                                  border: "1px solid var(--card-border, #E4E4E7)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    minWidth: 0,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 6,
                                      background: "#FFFFFF",
                                      border: "1px solid var(--card-border, #E4E4E7)",
                                      color: "var(--text-1, #18181B)",
                                      fontSize: 11,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {day}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: "var(--text-1, #18181B)",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {h.name}
                                  </span>
                                </div>
                                {h.isRecurring && (
                                  <span
                                    title="Repeats every year on this day"
                                    style={{ color: "var(--text-3, #A1A1AA)", flexShrink: 0 }}
                                  >
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
                          padding: "5px 8px",
                          borderRadius: 7,
                          border: "1px dashed var(--card-border, #E4E4E7)",
                          background: "#FFFFFF",
                          color: "var(--text-2, #52525B)",
                          fontSize: 11,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <Plus size={11} />
                        <span>Add to {mName}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        ) : (
          /* ─── TAB 2: DETAILED LIST VIEW ─── */
          <Card>
            <CardBody>
              <SectionHeading
                title={`All Company Holidays (${selectedYear})`}
                description="Complete directory of scheduled public and internal company holidays."
                action={
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        height: 36,
                        border: "1px solid var(--card-border, #E4E4E7)",
                        borderRadius: 9,
                        minWidth: 220,
                        background: "#FFFFFF",
                      }}
                    >
                      <Search size={14} color="var(--text-3, #A1A1AA)" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search holidays..."
                        style={{
                          border: 0,
                          outline: 0,
                          width: "100%",
                          fontFamily: "inherit",
                          fontSize: 12.5,
                          background: "transparent",
                        }}
                      />
                    </div>
                    <div style={{ width: 170 }}>
                      <Select
                        value={filterType}
                        onValueChange={(val) => setFilterType(val)}
                        options={[
                          { value: "all", label: "All Classifications" },
                          { value: "company", label: "Company Only" },
                          { value: "national", label: "Public / National" },
                        ]}
                      />
                    </div>
                  </div>
                }
              />

              {filteredHolidays.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <CalendarRange
                    size={32}
                    style={{ margin: "0 auto 10px", color: "var(--text-3, #A1A1AA)" }}
                  />
                  <h3 style={{ fontSize: 15, color: "var(--text-1, #18181B)", margin: 0 }}>
                    No holidays match your filter
                  </h3>
                  <p style={{ fontSize: 12.5, color: "var(--text-3, #A1A1AA)", margin: "4px 0 16px" }}>
                    Add regional public holidays or recurring company days off to your calendar.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                  >
                    <Plus size={14} />
                    <span>Add Holiday</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {filteredHolidays.map((h) => (
                    <DataRow
                      key={h.id || `${h.name}-${h.computedDate}`}
                      leading={
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 9,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#FAF9F7",
                            border: "1px solid var(--card-border, #E4E4E7)",
                            color: "var(--text-1, #18181B)",
                          }}
                        >
                          <CalendarIcon size={16} />
                        </div>
                      }
                      title={
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span>{h.name}</span>
                          {h.isRecurring && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 7px",
                                borderRadius: 6,
                                background: "#FAF9F7",
                                border: "1px solid var(--card-border, #E4E4E7)",
                                color: "var(--text-2, #52525B)",
                                fontSize: 10.5,
                              }}
                            >
                              <Repeat size={10} />
                              <span>Yearly · {h.computedDate.slice(5)}</span>
                            </span>
                          )}
                        </div>
                      }
                      subtitle={`${h.computedDate} · Applies to: ${
                        h.appliesTo === "all" ? "All Team Members" : h.appliesTo
                      }`}
                      meta={
                        <StatusPill tone={h.holidayType === "national" ? "primary" : "neutral"}>
                          {h.holidayType === "national" ? "Public" : "Company"}
                        </StatusPill>
                      }
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* ─── Schedule Company Holiday Modal ─── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Company Holiday"
        subtitle="Configure public or internal observances with annual recurrence rules."
        width={500}
        footer={
          <>
            <button
              type="button"
              className="btn-neutral"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreateHoliday}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : "Save Holiday"}
            </button>
          </>
        }
      >
        <form
          onSubmit={handleCreateHoliday}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {/* Holiday Name */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12.5,
                color: "var(--text-1, #18181B)",
                marginBottom: 6,
              }}
            >
              Holiday Name <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Independence Day, Labour Day, Year-End Close"
              required
            />
          </div>

          {/* Date & Classification Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  color: "var(--text-1, #18181B)",
                  marginBottom: 6,
                }}
              >
                Observed Date <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <Input
                type="date"
                value={form.holidayDate}
                onChange={(e) => setForm({ ...form, holidayDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  color: "var(--text-1, #18181B)",
                  marginBottom: 6,
                }}
              >
                Classification
              </label>
              <Select
                value={form.holidayType}
                onValueChange={(val) => setForm({ ...form, holidayType: val })}
                options={[
                  { value: "company", label: "Company Day Off" },
                  { value: "national", label: "Public / National Holiday" },
                ]}
              />
            </div>
          </div>

          {/* Recurrence Specification Toggle Card (Clean Brand Colors) */}
          <div
            onClick={() => setForm({ ...form, isRecurring: !form.isRecurring })}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: form.isRecurring ? "var(--primary-tint)" : "#FAF9F7",
              border: form.isRecurring
                ? "1px solid var(--primary)"
                : "1px solid var(--card-border, #E4E4E7)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                onClick={(e) => e.stopPropagation()}
                style={{
                  marginTop: 2,
                  width: 16,
                  height: 16,
                  accentColor: "var(--primary)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Repeat size={13.5} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-1, #18181B)" }}>
                    Repeats Every Year on This Specific Date
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-2, #52525B)",
                    margin: "4px 0 0 0",
                    lineHeight: 1.45,
                  }}
                >
                  When enabled, this observance automatically applies year after year on the same calendar date without manual reconfiguration.
                </p>
              </div>
            </div>
          </div>

          {/* Applies To */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12.5,
                color: "var(--text-1, #18181B)",
                marginBottom: 6,
              }}
            >
              Applies To
            </label>
            <Select
              searchable
              searchPlaceholder="Search scope..."
              value={form.appliesTo}
              onValueChange={(val) => setForm({ ...form, appliesTo: val })}
              options={[
                { value: "all", label: "All Employees (Company-wide)" },
                { value: "hq", label: "Headquarters Only" },
                { value: "remote", label: "Remote Team Members Only" },
                { value: "engineering", label: "Engineering Division" },
              ]}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12.5,
                color: "var(--text-1, #18181B)",
                marginBottom: 6,
              }}
            >
              Notes or Observance Details{" "}
              <span style={{ color: "var(--text-3, #A1A1AA)" }}>(Optional)</span>
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
