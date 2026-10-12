"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  UserPlus,
  FileText,
  CheckSquare,
  CalendarDays,
  Send,
  GripVertical,
  Briefcase,
  Users,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useHR } from "@/context/HRContext";

interface Department {
  id: string;
  name: string;
}

export default function HrOnboardingPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("New Hires");
  const [viewState, setViewState] = useState<"dashboard" | "builder">("dashboard");
  const { candidates, onboardings, initiateOnboarding, toggleOnboardingTask, completeOnboarding } = useHR();
  const [expandedRows, setExpandedRows] = useState<(string | number)[]>([]);

  // Real departments from backend
  const [departments, setDepartments] = useState<Department[]>([]);

  // Wizard State
  const [wizardCandidate, setWizardCandidate] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    async function loadDepts() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch("http://localhost:8080/api/v1/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const list: Department[] = json.data || [];
          setDepartments(list);
          if (list.length > 0) setSelectedDeptId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    }
    loadDepts();
  }, [getToken]);

  // Find candidates that are 'Hired' but not yet in onboardings
  const pendingHires = candidates.filter(
    (c) => c.stage === "Hired" && !onboardings.some((o) => o.candidateId === c.id)
  );

  const toggleRow = (id: string | number) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter((rId) => rId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  const openWizard = (candidate: any) => {
    setWizardCandidate(candidate);
    setWizardStep(1);
  };

  const finishWizard = async () => {
    if (!wizardCandidate) return;
    setIsLaunching(true);

    try {
      const token = await getToken();
      const parts = wizardCandidate.name.split(" ");
      const firstName = parts[0] || "New";
      const lastName = parts.slice(1).join(" ") || "Employee";

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 14);
      const isoDate = startDate.toISOString().split("T")[0];

      const deptObj = departments.find((d) => d.id === selectedDeptId);
      const deptName = deptObj ? deptObj.name : "Engineering";

      let createdEmpId: string | undefined = undefined;

      // Create actual employee in backend database
      if (token) {
        const empNumber = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const res = await fetch("http://localhost:8080/api/v1/employees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeNumber: empNumber,
            firstName,
            lastName,
            workEmail: wizardCandidate.email,
            hiredOn: isoDate,
            employmentType: "full_time",
            workerType: "employee",
            workArrangement: "remote",
            fteBasisPoints: 10000,
            payType: "salary",
            jobTitle: wizardCandidate.role,
            departmentId: selectedDeptId || undefined,
          }),
        });

        if (res.ok) {
          const empJson = await res.json();
          createdEmpId = empJson.id;
        }
      }

      await initiateOnboarding(
        wizardCandidate,
        startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        deptName,
        createdEmpId
      );
    } catch (err) {
      console.error("Failed to launch onboarding", err);
    } finally {
      setIsLaunching(false);
      setWizardCandidate(null);
    }
  };

  // Collect uncompleted tasks for Today's Agenda
  const agendaTasks = onboardings.flatMap((o) =>
    o.tasks.filter((t) => !t.completed).map((t) => ({ ...t, employeeName: o.name }))
  );

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      {/* Top Header */}
      <div style={{ padding: "24px 32px 0 32px", flexShrink: 0 }}>
        <PageHeader
          title="Employee Onboarding"
          subtitle="Guide new hires through their transition into your organization."
          variant="card"
          tabs={["New Hires", "Today's Agenda", "Documents & Setup"]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={
            <Link
              href="/people"
              className="btn-secondary row gap-8 align-center"
              style={{
                background: "white",
                color: "var(--primary)",
                border: "none",
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 20,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Users size={16} /> View People Directory
            </Link>
          }
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-page)", padding: "24px 32px 48px 32px" }}>
        {/* ---------------- NEW HIRES TAB ---------------- */}
        {activeTab === "New Hires" && (
          <div className="col gap-32">
            {/* Stat Ribbon */}
            <StatRibbon
              stats={[
                { label: "Active Onboardings", value: onboardings.filter((o) => o.status !== "Completed").length, description: "In progress" },
                { label: "Ready to Onboard", value: pendingHires.length, description: "From ATS hires" },
                { label: "Completed", value: onboardings.filter((o) => o.status === "Completed").length, description: "Active employees" },
                { label: "Avg. Duration", value: "14 Days", description: "Target onboarding" },
              ]}
            />

            {/* Pending Hires Banner */}
            {pendingHires.length > 0 && (
              <div
                className="p-24 col gap-16"
                style={{
                  background: "linear-gradient(135deg, rgba(162, 56, 255, 0.05) 0%, rgba(103, 58, 183, 0.08) 100%)",
                  borderRadius: 16,
                  border: "1px solid rgba(162, 56, 255, 0.2)",
                }}
              >
                <div className="row-between align-center">
                  <div className="row gap-12 align-center">
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <h3 className="m-0 text-base fw-800 text-1">Hired Candidates Ready for Onboarding</h3>
                      <p className="m-0 text-sm text-4 mt-2">These candidates were marked as Hired in the ATS.</p>
                    </div>
                  </div>
                  <Badge variant="primary">{pendingHires.length} Pending</Badge>
                </div>

                <div className="grid-2 gap-16 mt-8">
                  {pendingHires.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="row-between align-center p-16"
                      style={{ background: "white", borderRadius: 12, border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
                    >
                      <div className="row gap-16 align-center">
                        <Avatar name={candidate.name} src={candidate.avatar} size="lg" />
                        <div>
                          <div className="fw-700 text-1 text-base">{candidate.name}</div>
                          <div className="text-sm text-4">{candidate.role}</div>
                        </div>
                      </div>
                      <div className="row gap-12 align-center">
                        <Badge variant="success">Hired</Badge>
                        <button
                          onClick={() => openWizard(candidate)}
                          className="btn-primary"
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            fontSize: 13,
                            background: "var(--gradient)",
                            border: "none",
                            color: "white",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Initiate Onboarding
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Onboardings Table */}
            <div>
              <div className="row-between align-center mb-16">
                <div>
                  <h2 className="text-xl fw-800 text-1 m-0">Onboarding Roster</h2>
                  <p className="text-sm text-5 m-0 mt-2">Manage employee transitions and activate team members.</p>
                </div>
              </div>

              {onboardings.length === 0 ? (
                <Card style={{ borderRadius: 16, border: "1px solid var(--border)", textAlign: "center", padding: "48px 24px" }}>
                  <CardBody className="col gap-12 align-center justify-center">
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)" }}>
                      <ClipboardList size={24} />
                    </div>
                    <h3 className="m-0 text-base fw-700 text-1">No active onboarding workflows</h3>
                    <p className="m-0 text-sm text-4" style={{ maxWidth: 420 }}>
                      When candidates accept job offers and are hired in the ATS, initiate their onboarding here to create their employee profile.
                    </p>
                    <Link href="/hiring" className="btn-primary row gap-8 align-center mt-8" style={{ textDecoration: "none" }}>
                      <Briefcase size={16} /> Go to ATS Pipeline
                    </Link>
                  </CardBody>
                </Card>
              ) : (
                <Card style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)", borderRadius: 16 }}>
                  <CardBody style={{ padding: 0 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead style={{ background: "#F9FAFB", borderBottom: "1px solid var(--border)" }}>
                        <tr style={{ color: "var(--text-4)", fontSize: 12, textTransform: "uppercase" }}>
                          <th style={{ padding: "16px 24px", width: 40 }}></th>
                          <th style={{ padding: "16px 24px", fontWeight: 700 }}>Employee</th>
                          <th style={{ padding: "16px 24px", fontWeight: 700 }}>Role & Dept</th>
                          <th style={{ padding: "16px 24px", fontWeight: 700 }}>Start Date</th>
                          <th style={{ padding: "16px 24px", fontWeight: 700 }}>Progress</th>
                          <th style={{ padding: "16px 24px", fontWeight: 700 }}>Status</th>
                          <th style={{ padding: "16px 24px", width: 140, textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onboardings.map((hire, idx) => {
                          const isExpanded = expandedRows.includes(hire.id);
                          return (
                            <React.Fragment key={hire.id}>
                              <tr
                                style={{
                                  borderBottom: isExpanded || idx === onboardings.length - 1 ? "none" : "1px solid var(--border)",
                                  background: "white",
                                  cursor: "pointer",
                                }}
                                onClick={() => toggleRow(hire.id)}
                              >
                                <td style={{ padding: "20px 0 20px 24px" }}>
                                  {isExpanded ? <ChevronDown size={18} className="text-4" /> : <ChevronRight size={18} className="text-4" />}
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                  <div className="row gap-12 align-center">
                                    <Avatar name={hire.name} size="md" style={{ border: "1px solid var(--border)" }} />
                                    <div>
                                      <span className="fw-700 text-1 text-base">{hire.name}</span>
                                      {hire.employeeId && (
                                        <div className="text-xs text-primary fw-600 mt-2">
                                          <Link
                                            href={`/people/${hire.employeeId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                                          >
                                            View Directory Profile <ExternalLink size={12} />
                                          </Link>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                  <div className="col gap-4">
                                    <div className="fw-600 text-2 text-sm">{hire.role}</div>
                                    <div className="text-xs text-5">{hire.department}</div>
                                  </div>
                                </td>
                                <td style={{ padding: "20px 24px", color: "var(--text-3)", fontSize: 14, fontWeight: 500 }}>
                                  {hire.startDate}
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                  <div className="row gap-12 align-center">
                                    <div style={{ flex: 1, height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden", minWidth: 120 }}>
                                      <div
                                        style={{
                                          width: `${hire.progress}%`,
                                          height: "100%",
                                          background: hire.progress === 100 ? "var(--success)" : "var(--gradient)",
                                          borderRadius: 4,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs fw-700 text-3">{hire.progress}%</span>
                                  </div>
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                  <Badge
                                    variant={
                                      hire.status === "Completed"
                                        ? "success"
                                        : hire.status === "At Risk"
                                        ? "danger"
                                        : hire.status === "On Track"
                                        ? "neutral"
                                        : "warning"
                                    }
                                  >
                                    {hire.status}
                                  </Badge>
                                </td>
                                <td style={{ padding: "20px 24px", textAlign: "right" }}>
                                  <div className="row gap-8 justify-end" onClick={(e) => e.stopPropagation()}>
                                    {hire.status !== "Completed" ? (
                                      <button
                                        onClick={() => completeOnboarding(hire.id)}
                                        className="btn-primary"
                                        style={{
                                          padding: "6px 14px",
                                          fontSize: 12,
                                          fontWeight: 700,
                                          borderRadius: 8,
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Activate
                                      </button>
                                    ) : (
                                      <span className="text-xs fw-700 text-success row gap-4 align-center">
                                        <CheckCircle2 size={14} /> Active
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr style={{ borderBottom: idx === onboardings.length - 1 ? "none" : "1px solid var(--border)", background: "#F9FAFB" }}>
                                  <td colSpan={7} style={{ padding: "16px 24px 32px 64px" }}>
                                    <div className="p-20 bg-white" style={{ borderRadius: 12, border: "1px solid var(--border)" }}>
                                      <h4 className="text-sm fw-700 text-1 mb-16 row gap-8 align-center">
                                        <CheckSquare size={16} className="text-primary" /> Onboarding Checklist
                                      </h4>
                                      <div className="col gap-12">
                                        {hire.tasks.map((task) => (
                                          <div
                                            key={task.id}
                                            className="row gap-12 align-center cursor-pointer"
                                            onClick={() => toggleOnboardingTask(hire.id, task.id)}
                                          >
                                            <div
                                              style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 5,
                                                border: task.completed ? "none" : "2px solid var(--border)",
                                                background: task.completed ? "var(--success)" : "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              {task.completed && <CheckCircle2 size={15} color="white" />}
                                            </div>
                                            <span
                                              className={`text-sm fw-500 ${task.completed ? "text-4" : "text-1"}`}
                                              style={{ textDecoration: task.completed ? "line-through" : "none" }}
                                            >
                                              {task.title}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ---------------- TODAY'S AGENDA TAB ---------------- */}
        {activeTab === "Today's Agenda" && (
          <div className="col gap-24">
            <h2 className="text-xl fw-800 text-1 m-0">Pending Tasks Across Organization</h2>
            {agendaTasks.length === 0 ? (
              <Card style={{ padding: 40, textAlign: "center", borderRadius: 16 }}>
                <CardBody className="col gap-8 align-center justify-center">
                  <CheckCircle2 size={36} className="text-success" />
                  <h3 className="text-base fw-700 text-1 m-0">All onboarding tasks are up to date!</h3>
                </CardBody>
              </Card>
            ) : (
              <div className="col gap-12">
                {agendaTasks.map((task, idx) => (
                  <div key={idx} className="p-16 row-between align-center bg-white" style={{ borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div className="row gap-12 align-center">
                      <CheckSquare size={18} className="text-primary" />
                      <div>
                        <div className="fw-700 text-1 text-sm">{task.title}</div>
                        <div className="text-xs text-4 mt-2">New hire: {task.employeeName}</div>
                      </div>
                    </div>
                    <Badge variant="warning">Action Required</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- DOCUMENTS TAB ---------------- */}
        {activeTab === "Documents & Setup" && (
          <div className="col gap-24">
            <h2 className="text-xl fw-800 text-1 m-0">Standard Compliance Packets</h2>
            <div className="grid-3 gap-20">
              {["Employment Agreement", "Direct Deposit Form", "Company Code of Conduct"].map((doc, idx) => (
                <Card key={idx} style={{ borderRadius: 16 }}>
                  <CardBody className="col gap-12">
                    <FileText size={24} className="text-primary" />
                    <h3 className="text-base fw-700 text-1 m-0">{doc}</h3>
                    <p className="text-xs text-4 m-0">Automatically requested during new hire workflow.</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Initiation Wizard Modal */}
      <Modal
        isOpen={!!wizardCandidate}
        onClose={() => setWizardCandidate(null)}
        title="Initiate Onboarding"
        subtitle={wizardCandidate ? `Configure onboarding for ${wizardCandidate.name}` : ""}
      >
        {wizardCandidate && (
          <div className="col gap-24">
            {wizardStep === 1 && (
              <div className="col gap-20">
                <div className="col gap-8">
                  <label className="text-sm fw-700 text-1">Department</label>
                  <select
                    className="select"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col gap-8">
                  <label className="text-sm fw-700 text-1">Role / Job Title</label>
                  <input type="text" className="input" defaultValue={wizardCandidate.role} disabled />
                </div>
                <div className="col gap-8">
                  <label className="text-sm fw-700 text-1">Work Email</label>
                  <input type="email" className="input" defaultValue={wizardCandidate.email} disabled />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="col gap-16">
                <h4 className="text-sm fw-700 text-1 m-0">Confirm and Create Employee Record</h4>
                <p className="text-sm text-4 m-0">
                  Launching onboarding will register <strong>{wizardCandidate.name}</strong> as an onboarding employee in your organization and prepare their compliance checklists.
                </p>
              </div>
            )}

            <div className="row-between align-center pt-20" style={{ borderTop: "1px solid var(--border)" }}>
              {wizardStep > 1 ? (
                <button className="btn-neutral" onClick={() => setWizardStep(1)}>← Back</button>
              ) : (
                <button className="btn-neutral" onClick={() => setWizardCandidate(null)}>Cancel</button>
              )}
              {wizardStep === 1 ? (
                <button className="btn-primary" onClick={() => setWizardStep(2)}>Next →</button>
              ) : (
                <button
                  className="btn-primary row gap-8 align-center"
                  onClick={finishWizard}
                  disabled={isLaunching}
                >
                  {isLaunching ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  <span>Launch & Register Employee</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
