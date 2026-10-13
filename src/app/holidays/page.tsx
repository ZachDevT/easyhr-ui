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
  holidayDate: string;
  holidayType: string;
  appliesTo: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HolidaysPage() {
  const { getToken } = useAuth();
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Calendar");
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    name: "",
    holidayDate: "",
    holidayType: "company",
    appliesTo: "all",
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
        setHolidays(Array.isArray(json) ? json : json.data || []);
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

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.success("Holiday registered", "Company holiday added to calendar.");
        setShowModal(false);
        setForm({ name: "", holidayDate: "", holidayType: "company", appliesTo: "all" });
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

  const filteredHolidays = useMemo(() => {
    if (!query.trim()) return holidays;
    const q = query.toLowerCase();
    return holidays.filter(
      (h) => h.name.toLowerCase().includes(q) || h.holidayDate.includes(q) || h.holidayType.includes(q)
    );
  }, [holidays, query]);

  const nationalCount = holidays.filter((h) => h.holidayType === "national").length;
  const companyCount = holidays.filter((h) => h.holidayType === "company").length;

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <PageHeader
        title="Company Holidays"
        subtitle="Manage public holidays, company days off, and regional observances."
        icon={<CalendarRange size={28} className="text-white" />}
        tabs={["Calendar", "List"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            className="btn-secondary"
            style={{
              background: "white",
              color: "var(--primary)",
              border: "none",
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 20,
              cursor: "pointer",
            }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} style={{ marginRight: 8 }} /> Add Holiday
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px", background: "var(--bg-page)" }}>
        <StatRibbon
          stats={[
            {
              label: "Total holidays",
              value: holidays.length,
              icon: <CalendarDays size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Company observances",
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

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <Card style={{ marginTop: 20 }}>
            <CardBody>
              <SectionHeading
                title={activeTab === "Calendar" ? "Annual Holiday Schedule" : "All Company Holidays"}
                description="Holidays automatically exempt employees from daily punch requirements"
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
                    <Search size={15} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search holidays..."
                      style={{ border: 0, outline: 0, width: "100%", fontFamily: "inherit", fontSize: 13 }}
                    />
                  </div>
                }
              />

              {filteredHolidays.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <CalendarRange size={36} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                  <h3 className="text-base fw-800 text-1">No company holidays scheduled</h3>
                  <p className="text-xs text-4 mt-4 mb-16">
                    Add regional public holidays or company retreat days to your calendar.
                  </p>
                  <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={15} /> Add Holiday
                  </button>
                </div>
              ) : (
                <div className="col gap-10">
                  {filteredHolidays.map((h) => (
                    <DataRow
                      key={h.id}
                      leading={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            display: "grid",
                            placeItems: "center",
                            background: "var(--primary-tint)",
                            color: "var(--primary)",
                          }}
                        >
                          <Sun size={18} />
                        </div>
                      }
                      title={h.name}
                      subtitle={`${h.holidayDate} · Applies to: ${h.appliesTo === "all" ? "All Team Members" : h.appliesTo}`}
                      meta={
                        <StatusPill tone={h.holidayType === "national" ? "primary" : "warning"}>
                          {h.holidayType.toUpperCase()}
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

      {/* Add Holiday Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Company Holiday"
        subtitle="Add a public or internal holiday to the work calendar"
        width={540}
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
              placeholder="e.g. Independence Day or Year-End Close"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Date *
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

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Applies To
            </label>
            <Select
              value={form.appliesTo}
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
            >
              <option value="all">All Employees</option>
              <option value="hq">Headquarters Only</option>
              <option value="remote">Remote Team Members</option>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
