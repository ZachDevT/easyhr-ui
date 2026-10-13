"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  GitBranch,
  Plus,
  Settings2,
  Zap,
  Loader2,
  XCircle,
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

interface WorkflowDef {
  id: string;
  name: string;
  triggerType: string;
  status: string;
}

interface WorkflowInboxItem {
  id: string;
  runId: string;
  status: string;
  createdAt: string;
}

export default function WorkflowsPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState("Workflows");
  const [workflows, setWorkflows] = useState<WorkflowDef[]>([]);
  const [inboxTasks, setInboxTasks] = useState<WorkflowInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Builder Modal
  const [builderOpen, setBuilderOpen] = useState(false);
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [triggerType, setTriggerType] = useState("request_submitted");

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [wfRes, inboxRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/workflows/definitions`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/workflows/inbox`, { headers }),
      ]);

      if (wfRes.ok) {
        const wfJson = await wfRes.json();
        setWorkflows(Array.isArray(wfJson) ? wfJson : wfJson.data || []);
      }
      if (inboxRes.ok) {
        const inboxJson = await inboxRes.json();
        setInboxTasks(Array.isArray(inboxJson) ? inboxJson : inboxJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load workflows", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowName.trim()) {
      toast.error("Name required", "Please enter a workflow name.");
      return;
    }

    setIsSavingWorkflow(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/workflows/definitions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: workflowName.trim(),
          triggerType,
        }),
      });

      if (res.ok) {
        toast.success("Workflow deployed", "New automated workflow definition created.");
        setBuilderOpen(false);
        setWorkflowName("");
        loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Deployment failed", errJson.detail || "Unable to save workflow.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to create workflow.");
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  const handleDecideTask = async (taskId: string, decision: "approved" | "rejected") => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/workflows/tasks/${taskId}/decide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      });

      if (res.ok) {
        toast.success(
          decision === "approved" ? "Task approved" : "Task rejected",
          `Workflow step marked as ${decision}.`
        );
        loadData();
      } else {
        toast.error("Action failed", "Unable to update workflow task.");
      }
    } catch {
      toast.error("Network error", "Unable to record decision.");
    }
  };

  const activeWorkflowsCount = workflows.filter((w) => w.status === "active").length;

  return (
    <>
      <PageHeader
        title="Workflows & Approvals"
        subtitle="Automate approvals, route requests, and enforce compliance across every people operation."
        icon={<GitBranch size={28} />}
        tabs={["Workflows", "My approvals", "Activity"]}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          <button
            className="btn-primary"
            onClick={() => setBuilderOpen(true)}
            style={{ background: "white", color: "var(--primary)" }}
          >
            <Plus size={16} /> New Workflow
          </button>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Active workflows",
              value: activeWorkflowsCount,
              icon: <Zap size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Pending approvals",
              value: inboxTasks.length,
              icon: <Clock3 size={20} />,
              color: "var(--warning)",
            },
            {
              label: "Configured triggers",
              value: workflows.length,
              icon: <CheckCircle2 size={20} />,
              color: "var(--success)",
            },
            {
              label: "Automation rate",
              value: "99.8%",
              description: "Zero manual friction",
              icon: <Settings2 size={20} />,
              color: "var(--text-4)",
            },
          ]}
        />

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            {tab === "Workflows" && (
              <Card style={{ marginTop: 20 }}>
                <CardBody>
                  <SectionHeading
                    title="Workflow Library"
                    description="Reusable approval logic across every operational category"
                  />
                  {workflows.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center" }}>
                      <GitBranch size={38} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                      <h3 className="text-base fw-800 text-1">No custom workflows created yet</h3>
                      <p className="text-xs text-4 mt-4 mb-16">
                        Set up automated approval routes for time-off, expense requests, or promotion recommendations.
                      </p>
                      <button className="btn-primary" onClick={() => setBuilderOpen(true)}>
                        <Plus size={15} /> Create First Workflow
                      </button>
                    </div>
                  ) : (
                    <div className="col gap-10">
                      {workflows.map((w) => (
                        <DataRow
                          key={w.id}
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
                              <GitBranch size={17} />
                            </div>
                          }
                          title={w.name}
                          subtitle={`Trigger: ${w.triggerType.replace(/_/g, " ")}`}
                          meta={
                            <div className="row gap-12 align-center">
                              <StatusPill tone={w.status === "active" ? "success" : "neutral"}>
                                {w.status.toUpperCase()}
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

            {tab === "My approvals" && (
              <Card style={{ marginTop: 20 }}>
                <CardBody>
                  <SectionHeading
                    title="Waiting for your decision"
                    description="Tasks routed to you that require approval or signoff"
                  />
                  {inboxTasks.length === 0 ? (
                    <div style={{ padding: 50, textAlign: "center" }}>
                      <CheckCircle2 size={38} color="var(--success)" style={{ margin: "0 auto 12px" }} />
                      <h3 className="text-base fw-800 text-1">You are completely caught up</h3>
                      <p className="text-xs text-4 mt-4">There are no pending workflow approvals waiting for you.</p>
                    </div>
                  ) : (
                    <div className="col gap-10">
                      {inboxTasks.map((task) => (
                        <DataRow
                          key={task.id}
                          leading={
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                background: "var(--primary-tint)",
                                color: "var(--primary)",
                              }}
                            >
                              <Clock3 size={18} />
                            </div>
                          }
                          title={`Workflow Task Run: ${task.runId.slice(0, 8)}`}
                          subtitle={`Created ${task.createdAt.split("T")[0]}`}
                          meta={
                            <div className="row gap-8">
                              <button
                                className="btn-neutral"
                                onClick={() => handleDecideTask(task.id, "rejected")}
                                style={{ color: "var(--error)" }}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                              <button
                                className="btn-primary"
                                onClick={() => handleDecideTask(task.id, "approved")}
                              >
                                <Check size={14} /> Approve
                              </button>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {tab === "Activity" && (
              <Card style={{ marginTop: 20 }}>
                <CardBody>
                  <SectionHeading
                    title="Workflow Activity Log"
                    description="Audit-ready timeline of automated and manager events"
                  />
                  <div className="col gap-10">
                    <DataRow
                      leading={<CheckCircle2 size={18} color="var(--success)" />}
                      title="System Onboarding Workflow Engine Active"
                      subtitle="Continuous operational pipeline initialized"
                      meta={<StatusPill tone="success">Operational</StatusPill>}
                    />
                    <DataRow
                      leading={<CheckCircle2 size={18} color="var(--primary)" />}
                      title="Time Off Accrual & Leave Approval Engine Active"
                      subtitle="Routing employee submissions to managers and HR"
                      meta={<StatusPill tone="primary">Live</StatusPill>}
                    />
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </main>

      {/* New Workflow Modal */}
      <Modal
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title="Create Automated Workflow"
        subtitle="Define triggers and multi-step approval routing"
        width={580}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setBuilderOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateWorkflow}
              disabled={isSavingWorkflow}
            >
              {isSavingWorkflow ? <Loader2 size={15} className="animate-spin" /> : "Deploy Workflow"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateWorkflow} className="col gap-14">
          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Workflow Name *
            </label>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g. Equipment Request Approval"
              required
            />
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Event Trigger
            </label>
            <Select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
            >
              <option value="request_submitted">Employee Request Submitted</option>
              <option value="employee_onboarded">New Hire Onboarded</option>
              <option value="status_changed">Employee Status Changed</option>
              <option value="document_uploaded">Compliance Document Uploaded</option>
              <option value="scheduled_time">Scheduled Periodic Review</option>
            </Select>
          </div>

          <div
            style={{
              padding: 16,
              border: "1px dashed var(--primary)",
              borderRadius: 12,
              background: "var(--primary-tint)",
            }}
          >
            <div className="text-xs fw-800 text-primary mb-2">Automated Execution</div>
            <div className="text-xs text-4" style={{ lineHeight: 1.5 }}>
              This workflow executes immediately when triggered. Tasks are assigned based on organizational reporting lines.
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
