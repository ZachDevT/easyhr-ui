"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClipboardCheck,
  KeyRound,
  Plus,
  ShieldCheck,
  UserMinus,
  Loader2,
  CalendarDays,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DataRow, ProgressBar, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface OffboardingPlan {
  id: string;
  employeeId: string;
  ownerId?: string;
  lastWorkingDay: string;
  reason: string;
  riskStatus: string;
  progressPercentage: number;
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

export default function OffboardingPage() {
  const { getToken } = useAuth();
  const [plans, setPlans] = useState<OffboardingPlan[]>([]);
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    ownerId: "",
    lastWorkingDay: "",
    reason: "",
  });

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [plansRes, empsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/offboarding/plans`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
      ]);

      if (plansRes.ok) {
        const pJson = await plansRes.json();
        setPlans(Array.isArray(pJson) ? pJson : pJson.data || []);
      }
      if (empsRes.ok) {
        const eJson = await empsRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load offboarding plans", err);
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

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.lastWorkingDay || !form.reason.trim()) {
      toast.error("Required fields", "Please select an employee, departure date, and reason.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/offboarding/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: form.employeeId,
          ownerId: form.ownerId || undefined,
          lastWorkingDay: form.lastWorkingDay,
          reason: form.reason.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Offboarding initialized", "Accountable exit plan recorded.");
        setOpenModal(false);
        setForm({ employeeId: "", ownerId: "", lastWorkingDay: "", reason: "" });
        loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Failed", errJson.detail || "Unable to start offboarding.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to create offboarding plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const getEmp = (id: string) => employees.find((e) => e.id === id);

  const activeExits = plans.filter((p) => p.riskStatus !== "complete" && p.progressPercentage < 100);

  return (
    <>
      <PageHeader
        title="Offboarding"
        subtitle="Protect company assets and ensure an accountable, transparent employee departure process."
        icon={<UserMinus size={28} />}
        actions={
          <button
            onClick={() => setOpenModal(true)}
            className="btn-primary"
            style={{ background: "white", color: "var(--primary)" }}
          >
            <Plus size={16} /> Start Offboarding
          </button>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Active departures",
              value: activeExits.length,
              icon: <UserMinus size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Pending revocations",
              value: activeExits.length,
              icon: <KeyRound size={20} />,
              color: "var(--error)",
            },
            {
              label: "Completed exits",
              value: plans.filter((p) => p.progressPercentage === 100 || p.riskStatus === "complete").length,
              icon: <ShieldCheck size={20} />,
              color: "var(--success)",
            },
            {
              label: "Active roster",
              value: employees.length,
              icon: <User size={20} />,
              color: "var(--text-4)",
            },
          ]}
        />

        <Card style={{ marginTop: 20 }}>
          <CardBody>
            <SectionHeading
              title="Employee Departures"
              description="Manage handover items, access removals, and exit interviews"
            />
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : plans.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <UserMinus size={36} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                <h3 className="text-base fw-800 text-1">No active offboarding workflows</h3>
                <p className="text-xs text-4 mt-4 mb-16">
                  Initiate offboarding when an employee resigns or a transition is scheduled.
                </p>
                <button className="btn-primary" onClick={() => setOpenModal(true)}>
                  <Plus size={15} /> Start Offboarding
                </button>
              </div>
            ) : (
              <div className="col gap-10">
                {plans.map((p) => {
                  const emp = getEmp(p.employeeId);
                  const owner = p.ownerId ? getEmp(p.ownerId) : null;
                  const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Team Member";
                  const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : "HR Admin";

                  return (
                    <DataRow
                      key={p.id}
                      leading={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            background: "var(--bg-page)",
                            color: "var(--primary)",
                            fontWeight: 800,
                          }}
                        >
                          {empName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      }
                      title={empName}
                      subtitle={`${emp?.jobTitle || "Team Member"} · Last Day: ${p.lastWorkingDay} · Managed by: ${ownerName}`}
                      meta={
                        <div className="row gap-16 align-center">
                          <div style={{ width: 110 }}>
                            <ProgressBar value={p.progressPercentage || 25} />
                            <span className="text-xs text-5 mt-2 block">{p.progressPercentage || 25}% complete</span>
                          </div>
                          <StatusPill tone={p.riskStatus === "complete" ? "success" : "warning"}>
                            {p.riskStatus || "In Progress"}
                          </StatusPill>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </main>

      {/* Start Offboarding Modal */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Start Employee Offboarding"
        subtitle="Record departure details and designate workflow oversight"
        width={560}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setOpenModal(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreatePlan}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : "Initiate Offboarding"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreatePlan} className="col gap-14">
          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Employee *
            </label>
            <SearchableSelect
              value={form.employeeId}
              onChange={(val) => setForm({ ...form, employeeId: val })}
              options={employeeOptions}
              placeholder="Select departing employee..."
              searchPlaceholder="Search by name, title, or department..."
            />
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Offboarding Coordinator (optional)
            </label>
            <SearchableSelect
              value={form.ownerId}
              onChange={(val) => setForm({ ...form, ownerId: val })}
              options={employeeOptions}
              placeholder="Select coordinating manager or HR lead..."
              searchPlaceholder="Search managers..."
            />
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Last Working Day *
            </label>
            <Input
              type="date"
              value={form.lastWorkingDay}
              onChange={(e) => setForm({ ...form, lastWorkingDay: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Departure Reason *
            </label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Voluntary resignation, contract completion, or relocation"
              required
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
