"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Award,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface PromotionRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  effectiveDate: string;
  previousJobTitle?: string;
  newJobTitle: string;
  previousCompensationMinor?: number;
  newCompensationMinor?: number;
  rationale?: string;
  status: string;
}

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  avatar?: string;
  manager?: string;
}

export default function PromotionsPage() {
  const { getToken } = useAuth();
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    newJobTitle: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    newCompensation: "",
    rationale: "",
  });

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [promoRes, empsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/promotions`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
      ]);

      if (promoRes.ok) {
        const pJson = await promoRes.json();
        setPromotions(Array.isArray(pJson) ? pJson : pJson.data || []);
      }
      if (empsRes.ok) {
        const eJson = await empsRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load promotions", err);
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
      description: `Current: ${e.jobTitle || "Team Member"} · ${e.department || "General"}`,
      avatar: true,
    }));
  }, [employees]);

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.newJobTitle.trim() || !form.effectiveDate) {
      toast.error("Required fields", "Please select an employee, title, and effective date.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const compMinor = form.newCompensation ? Math.round(Number(form.newCompensation) * 100) : undefined;

      const res = await fetch(`${API_BASE_URL}/api/v1/promotions/${form.employeeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newJobTitle: form.newJobTitle.trim(),
          effectiveDate: form.effectiveDate,
          newCompensationMinor: compMinor,
          rationale: form.rationale.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Promotion executed", "Career advancement recorded and employee profile updated.");
        setIsModalOpen(false);
        setForm({
          employeeId: "",
          newJobTitle: "",
          effectiveDate: new Date().toISOString().split("T")[0],
          newCompensation: "",
          rationale: "",
        });
        loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Execution failed", errJson.detail || "Unable to record promotion.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to execute promotion.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPromotions = useMemo(() => {
    if (!query.trim()) return promotions;
    const q = query.toLowerCase();
    return promotions.filter(
      (p) =>
        (p.employeeName || "").toLowerCase().includes(q) ||
        p.newJobTitle.toLowerCase().includes(q) ||
        (p.previousJobTitle || "").toLowerCase().includes(q)
    );
  }, [promotions, query]);

  const getEmp = (id: string) => employees.find((e) => e.id === id);

  return (
    <>
      <PageHeader
        title="Promotions & Career Growth"
        subtitle="Track advancement, manage title transitions, and celebrate career milestones."
        icon={<TrendingUp size={28} />}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ background: "white", color: "var(--primary)" }}
          >
            <Plus size={16} /> Record Promotion
          </button>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Career advancements",
              value: promotions.length,
              icon: <Award size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Organization roster",
              value: employees.length,
              icon: <User size={20} />,
              color: "var(--success)",
            },
            {
              label: "Retention health",
              value: "96.4%",
              trend: "+2.1%",
              trendType: "positive",
              icon: <CheckCircle2 size={20} />,
              color: "var(--warning)",
            },
          ]}
        />

        <Card style={{ marginTop: 20 }}>
          <CardBody>
            <SectionHeading
              title="Career Progression History"
              description="Official record of promotions, title adjustments, and compensation growth"
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
                    placeholder="Search promotions..."
                    style={{ border: 0, outline: 0, width: "100%", fontFamily: "inherit", fontSize: 13 }}
                  />
                </div>
              }
            />

            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredPromotions.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Award size={38} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                <h3 className="text-base fw-800 text-1">No promotions recorded yet</h3>
                <p className="text-xs text-4 mt-4 mb-16">
                  Record career growth milestones when team members are promoted to new roles.
                </p>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                  <Plus size={15} /> Record First Promotion
                </button>
              </div>
            ) : (
              <div className="col gap-10">
                {filteredPromotions.map((p) => {
                  const emp = getEmp(p.employeeId);
                  const name = p.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : "Team Member");

                  return (
                    <DataRow
                      key={p.id}
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
                          <TrendingUp size={18} />
                        </div>
                      }
                      title={
                        <div className="row gap-8 align-center">
                          <span>{name}</span>
                          <span className="text-xs text-5">
                            {p.previousJobTitle || "Previous Role"} → <b className="text-primary">{p.newJobTitle}</b>
                          </span>
                        </div>
                      }
                      subtitle={`Effective: ${p.effectiveDate}${p.rationale ? ` · "${p.rationale}"` : ""}`}
                      meta={
                        <StatusPill tone={p.status === "completed" || p.status === "executed" ? "success" : "primary"}>
                          {p.status || "Promoted"}
                        </StatusPill>
                      }
                    />
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </main>

      {/* Record Promotion Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Career Promotion"
        subtitle="Advance an employee to a new role and establish updated terms"
        width={580}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreatePromotion}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : "Confirm Promotion"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreatePromotion} className="col gap-14">
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
              New Job Title / Position *
            </label>
            <Input
              value={form.newJobTitle}
              onChange={(e) => setForm({ ...form, newJobTitle: e.target.value })}
              placeholder="e.g. Senior Lead Developer or Regional Operations Manager"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Effective Date *
              </label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                New Annual Compensation ($) (optional)
              </label>
              <Input
                type="number"
                placeholder="e.g. 75000"
                value={form.newCompensation}
                onChange={(e) => setForm({ ...form, newCompensation: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Advancement Rationale / Justification
            </label>
            <Textarea
              rows={3}
              value={form.rationale}
              onChange={(e) => setForm({ ...form, rationale: e.target.value })}
              placeholder="Exceeded performance targets, mentorship leadership, technical achievements..."
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
