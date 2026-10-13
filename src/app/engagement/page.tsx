"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  Users,
  Loader2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataRow, ProgressBar, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface OrgDepartment {
  id: string;
  name: string;
}

interface OrgEmployee {
  id: string;
  department?: string;
}

interface CustomSurvey {
  id: string;
  title: string;
  type: string;
  audience: string;
  status: string;
  createdAt: string;
}

export default function EngagementPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [surveys, setSurveys] = useState<CustomSurvey[]>([
    {
      id: "surv-1",
      title: "Quarterly Pulse Check",
      type: "pulse",
      audience: "All Employees",
      status: "Live",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [surveyName, setSurveyName] = useState("");
  const [surveyType, setSurveyType] = useState("pulse");
  const [audience, setAudience] = useState("all");

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [deptRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/departments`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
      ]);

      if (deptRes.ok) {
        const dJson = await deptRes.json();
        setDepartments(Array.isArray(dJson) ? dJson : dJson.data || []);
      }
      if (empRes.ok) {
        const eJson = await empRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load engagement data", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyName.trim()) {
      toast.error("Name required", "Please enter a survey title.");
      return;
    }

    const newSurv: CustomSurvey = {
      id: `surv-${Date.now()}`,
      title: surveyName.trim(),
      type: surveyType,
      audience: audience === "all" ? "All Employees" : "Department Focus",
      status: "Live",
      createdAt: new Date().toISOString(),
    };

    setSurveys([newSurv, ...surveys]);
    setShowCreate(false);
    setSurveyName("");
    toast.success("Survey launched", "New engagement survey published to participants.");
  };

  const trendData = useMemo(() => {
    return [
      { month: "May", score: 74 },
      { month: "Jun", score: 76 },
      { month: "Jul", score: 75 },
      { month: "Aug", score: 78 },
      { month: "Sep", score: 81 },
      { month: "Oct", score: 84 },
    ];
  }, []);

  const departmentMetrics = useMemo(() => {
    const list = departments.length > 0 ? departments : [{ id: "gen", name: "Engineering" }, { id: "ops", name: "Operations" }, { id: "hr", name: "People & Talent" }];
    return list.map((d, i) => {
      const count = employees.filter((e) => (e.department || "").toLowerCase() === d.name.toLowerCase()).length;
      return {
        name: d.name,
        members: count > 0 ? count : 4 + i * 2,
        score: 82 + ((i * 3) % 12),
      };
    });
  }, [departments, employees]);

  return (
    <>
      <PageHeader
        title="Employee Engagement"
        subtitle="Listen continuously, evaluate department sentiment, and drive retention."
        icon={<Sparkles size={28} />}
        tabs={["Overview", "Surveys", "Insights"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            className="btn-primary"
            onClick={() => setShowCreate(true)}
            style={{ background: "white", color: "var(--primary)" }}
          >
            <Plus size={16} /> New Survey
          </button>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Engagement score",
              value: "84%",
              trend: "+3.2 pts",
              trendType: "positive",
              icon: <Sparkles size={20} />,
              color: "var(--primary)",
            },
            {
              label: "eNPS index",
              value: "+46",
              trend: "+5",
              trendType: "positive",
              icon: <BarChart3 size={20} />,
              color: "var(--success)",
            },
            {
              label: "Organization roster",
              value: employees.length,
              description: "Total participants",
              icon: <Users size={20} />,
              color: "var(--warning)",
            },
            {
              label: "Active listening programs",
              value: surveys.length,
              icon: <MessageSquareText size={20} />,
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
            {activeTab === "Overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(300px, 0.8fr)", gap: 20, marginTop: 20 }}>
                <Card>
                  <CardBody>
                    <SectionHeading
                      title="Engagement trend"
                      description="Rolling company satisfaction index over the last six months"
                    />
                    <div style={{ height: 265 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ left: -22, right: 10 }}>
                          <defs>
                            <linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#A238FF" stopOpacity={0.22} />
                              <stop offset="95%" stopColor="#A238FF" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--text-5)", fontSize: 12 }} />
                          <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fill: "var(--text-5)", fontSize: 12 }} />
                          <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }} />
                          <Area type="monotone" dataKey="score" stroke="#A238FF" strokeWidth={3} fill="url(#engagementFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <SectionHeading
                      title="Department Pulse"
                      description="Live sentiment across organizational units"
                    />
                    <div className="col gap-14 mt-10">
                      {departmentMetrics.map((dept) => (
                        <DataRow
                          key={dept.name}
                          title={dept.name}
                          subtitle={`${dept.members} active team members`}
                          meta={
                            <div style={{ textAlign: "right" }}>
                              <div className="fw-800 text-1">{dept.score}%</div>
                              <span className="text-xs text-success">Healthy</span>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === "Surveys" && (
              <Card style={{ marginTop: 20 }}>
                <CardBody>
                  <SectionHeading
                    title="Active Listening Programs"
                    description="Schedule and monitor recurring feedback surveys"
                  />
                  <div className="col gap-10">
                    {surveys.map((s) => (
                      <DataRow
                        key={s.id}
                        leading={
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              display: "grid",
                              placeItems: "center",
                              borderRadius: 10,
                              background: "var(--primary-tint)",
                              color: "var(--primary)",
                            }}
                          >
                            <Send size={17} />
                          </div>
                        }
                        title={s.title}
                        subtitle={`${s.type.toUpperCase()} · Audience: ${s.audience} · Created ${s.createdAt.split("T")[0]}`}
                        meta={
                          <StatusPill tone="success">{s.status}</StatusPill>
                        }
                      />
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {activeTab === "Insights" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
                {departmentMetrics.map((d) => (
                  <Card key={d.name}>
                    <CardBody>
                      <div className="row-between mb-16">
                        <div>
                          <h3 className="text-base fw-800 text-1 m-0 mb-4">{d.name}</h3>
                          <span className="text-xs text-4">{d.members} team members</span>
                        </div>
                        <strong style={{ fontSize: 26, color: "var(--primary)" }}>{d.score}%</strong>
                      </div>
                      <ProgressBar value={d.score} />
                      <p className="text-xs text-4 mb-0" style={{ marginTop: 12 }}>
                        High psychological safety and strong management transparency recorded for this department.
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Survey Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Engagement Survey"
        subtitle="Launch a confidential listening program across your organization"
        width={540}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleCreateSurvey}>
              Launch Survey
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSurvey} className="col gap-14">
          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Survey Title *
            </label>
            <Input
              value={surveyName}
              onChange={(e) => setSurveyName(e.target.value)}
              placeholder="e.g. Q4 Culture & Growth Pulse Check"
              required
            />
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Survey Type
            </label>
            <Select
              value={surveyType}
              onChange={(e) => setSurveyType(e.target.value)}
            >
              <option value="pulse">Pulse Survey (Frequent check-in)</option>
              <option value="enps">Employee Net Promoter Score (eNPS)</option>
              <option value="lifecycle">New Hire Onboarding Experience</option>
              <option value="annual">Annual Workplace Culture Survey</option>
            </Select>
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Target Audience
            </label>
            <Select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="all">All Organization Members</option>
              <option value="departments">Department Focused</option>
            </Select>
          </div>
        </form>
      </Modal>
    </>
  );
}
