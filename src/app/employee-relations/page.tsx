"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Scale,
  Plus,
  AlertCircle,
  CheckCircle2,
  Search,
  XCircle,
  FileWarning,
  Loader2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface RelationCaseItem {
  id: string;
  employeeId: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description?: string;
}

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  avatar?: string;
}

export default function EmployeeRelationsPage() {
  const { getToken } = useAuth();
  const [cases, setCases] = useState<RelationCaseItem[]>([]);
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Incidents Dashboard");
  const [query, setQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    category: "warning",
    severity: "low",
    description: "",
  });

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [casesRes, empsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/relations/cases`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
      ]);

      if (casesRes.ok) {
        const cJson = await casesRes.json();
        setCases(Array.isArray(cJson) ? cJson : cJson.data || []);
      }
      if (empsRes.ok) {
        const eJson = await empsRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load employee relations cases", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName}`,
      description: `${e.jobTitle || "Team Member"} · ${e.department || "General"}`,
      avatar: true,
    }));
  }, [employees]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.title.trim()) {
      toast.error("Required fields", "Please select an employee and specify the incident title.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/relations/cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: form.employeeId,
          title: form.title.trim(),
          category: form.category,
          severity: form.severity,
          description: form.description.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Incident recorded", "Disciplinary action case established.");
        setShowModal(false);
        setForm({
          employeeId: "",
          title: "",
          category: "warning",
          severity: "low",
          description: "",
        });
        loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Failed", errJson.detail || "Unable to save incident.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to record case.");
    } finally {
      setIsSaving(false);
    }
  };

  const getEmp = (id: string) => employees.find((e) => e.id === id);

  const filteredCases = useMemo(() => {
    if (!query.trim()) return cases;
    const q = query.toLowerCase();
    return cases.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.severity.toLowerCase().includes(q)
    );
  }, [cases, query]);

  const openCasesCount = cases.filter((c) => c.status !== "resolved").length;

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <PageHeader
        title="Employee Relations"
        subtitle="Securely record disciplinary actions, policy investigations, and confidential incident cases."
        icon={<Scale size={28} className="text-white" />}
        tabs={["Incidents Dashboard", "Policy Logs"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            className="btn-secondary"
            onClick={() => setShowModal(true)}
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
          >
            <Plus size={16} style={{ marginRight: 8 }} /> Record Incident
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px", background: "var(--bg-page)" }}>
        <StatRibbon
          stats={[
            {
              label: "Open cases",
              value: openCasesCount,
              icon: <AlertCircle size={20} />,
              color: "var(--warning)",
            },
            {
              label: "Total incidents",
              value: cases.length,
              icon: <FileWarning size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Resolved rate",
              value: cases.length > 0 ? `${Math.round(((cases.length - openCasesCount) / cases.length) * 100)}%` : "100%",
              icon: <CheckCircle2 size={20} />,
              color: "var(--success)",
            },
            {
              label: "Monitored roster",
              value: employees.length,
              icon: <Users size={20} />,
              color: "var(--text-4)",
            },
          ]}
        />

        <Card style={{ marginTop: 20 }}>
          <CardBody>
            <SectionHeading
              title="Confidential Case Log"
              description="Restricted access log of disciplinary notes and warnings"
              action={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 9,
                    minWidth: 260,
                  }}
                >
                  <Search size={15} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search incident cases..."
                    style={{ border: 0, outline: 0, width: "100%", fontFamily: "inherit", fontSize: 13 }}
                  />
                </div>
              }
            />

            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredCases.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Scale size={38} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                <h3 className="text-base fw-800 text-1">No employee relations cases recorded</h3>
                <p className="text-xs text-4 mt-4 mb-16">
                  Maintain compliance by recording formal warnings, suspensions, or policy evaluations.
                </p>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                  <Plus size={15} /> Record Incident Case
                </button>
              </div>
            ) : (
              <div className="col gap-10">
                {filteredCases.map((c) => {
                  const emp = getEmp(c.employeeId);
                  const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Team Member";

                  return (
                    <DataRow
                      key={c.id}
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
                          <FileWarning size={18} />
                        </div>
                      }
                      title={`${c.title} — ${empName}`}
                      subtitle={`Category: ${c.category.toUpperCase()} · Severity: ${c.severity.toUpperCase()}${
                        c.description ? ` · "${c.description}"` : ""
                      }`}
                      meta={
                        <StatusPill tone={c.severity === "critical" || c.severity === "high" ? "error" : "warning"}>
                          {c.status || "Open"}
                        </StatusPill>
                      }
                    />
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Record Case Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Disciplinary Action / Incident"
        subtitle="Establish an official employee relations record"
        width={580}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateCase}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : "Save Incident Record"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCase} className="col gap-14">
          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Employee *
            </label>
            <SearchableSelect
              value={form.employeeId}
              onChange={(val) => setForm({ ...form, employeeId: val })}
              options={employeeOptions}
              placeholder="Select employee..."
              searchPlaceholder="Search by name or department..."
            />
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Case Title / Infraction Summary *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Written Warning: Attendance Policy Violation"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Classification
              </label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="warning">First / Formal Warning</option>
                <option value="suspension">Suspension</option>
                <option value="investigation">Internal Investigation</option>
                <option value="performance_plan">Performance Improvement Plan</option>
                <option value="termination">Termination</option>
              </Select>
            </div>

            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Severity Level
              </label>
              <Select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="low">Low (Documentation)</option>
                <option value="medium">Medium (Corrective Action)</option>
                <option value="high">High (Formal Suspension)</option>
                <option value="critical">Critical (Immediate Escalation)</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Factual Description / Notes
            </label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide objective documentation of dates, facts, and previous discussions..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
