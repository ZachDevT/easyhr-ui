"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Star,
  Plus,
  Search,
  Target,
  TrendingUp,
  CheckSquare,
  Clock,
  ChevronRight,
  BarChart2,
  MessageSquare,
  Loader2,
  Calendar,
  User,
  Award,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";

interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  reviewerUserId: string;
  reviewerName: string;
  reviewCycle: string;
  status: string;
  overallScore: number | null;
  comments: string | null;
  dueDate: string;
  createdAt: string;
}

interface PerformanceGoal {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  description: string | null;
  status: string;
  completionPercentage: number;
  dueDate: string | null;
  createdAt: string;
}

interface EmployeeOption {
  id: string;
  name: string;
  department: string;
  jobTitle?: string;
}

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="row gap-2 align-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          style={{
            fill: i <= Math.round(score) ? "#F59E0B" : "transparent",
            color: i <= Math.round(score) ? "#F59E0B" : "var(--border)",
          }}
        />
      ))}
      <span className="text-sm fw-700 text-1 ml-6">{score.toFixed(1)}</span>
    </div>
  );
}

export default function PerformancePage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("Reviews");

  // Live state
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [cycleFilter, setCycleFilter] = useState("All");

  // New Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    employeeId: "",
    cycle: "Q3 2026",
    status: "submitted",
    score: 5,
    comments: "",
  });

  // New Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    employeeId: "",
    title: "",
    description: "",
    status: "in_progress",
    completionPercentage: 25,
    dueDate: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [reviewsRes, goalsRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/performance/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/performance/goals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(Array.isArray(data) ? data : []);
      }
      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(Array.isArray(data) ? data : []);
      }
      if (empRes.ok) {
        const data = await empRes.json();
        const emps = Array.isArray(data) ? data : data.data || [];
        setEmployees(
          emps.map((e: any) => ({
            id: e.id,
            name: `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.name || "Employee",
            department: e.department || "General",
            jobTitle: e.jobTitle || "",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load performance data", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Employee options for SearchableSelect
  const employeeSelectOptions: SelectOption[] = useMemo(() => {
    return employees.map((emp) => ({
      value: emp.id,
      label: emp.name,
      description: `${emp.jobTitle ? `${emp.jobTitle} · ` : ""}${emp.department}`,
      avatar: true,
    }));
  }, [employees]);

  // Handle Review submission
  const handleCreateReview = async () => {
    if (!reviewForm.employeeId) {
      toast.error("Employee required", "Please select an employee to review.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/performance/reviews/${reviewForm.employeeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reviewCycle: reviewForm.cycle,
          status: reviewForm.status,
          overallScore: Number(reviewForm.score),
          comments: reviewForm.comments,
        }),
      });

      if (res.ok) {
        toast.success("Review recorded", "Performance review saved successfully.");
        setShowReviewModal(false);
        setReviewForm({
          employeeId: "",
          cycle: "Q3 2026",
          status: "submitted",
          score: 5,
          comments: "",
        });
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Review submission failed", err.detail || err.title || "Failed to create review.");
      }
    } catch (err) {
      console.error("Error creating review", err);
      toast.error("Network error", "Unable to reach server.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Goal submission
  const handleCreateGoal = async () => {
    if (!goalForm.employeeId) {
      toast.error("Employee required", "Please select an employee for this goal.");
      return;
    }
    if (!goalForm.title.trim()) {
      toast.error("Title required", "Please provide a goal title.");
      return;
    }
    setIsSubmittingGoal(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/performance/goals/${goalForm.employeeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: goalForm.title,
          description: goalForm.description || null,
          status: goalForm.status,
          completionPercentage: Number(goalForm.completionPercentage),
          dueDate: goalForm.dueDate ? goalForm.dueDate : null,
        }),
      });

      if (res.ok) {
        toast.success("Goal established", "Performance goal tracked successfully.");
        setShowGoalModal(false);
        setGoalForm({
          employeeId: "",
          title: "",
          description: "",
          status: "in_progress",
          completionPercentage: 25,
          dueDate: "",
        });
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Goal creation failed", err.detail || err.title || "Failed to track goal.");
      }
    } catch (err) {
      console.error("Error creating goal", err);
      toast.error("Network error", "Unable to create goal.");
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  // Metrics
  const completedCount = reviews.filter((r) => r.status === "acknowledged" || r.status === "submitted").length;
  const inProgressCount = reviews.filter((r) => r.status === "draft").length;
  const totalReviews = reviews.length;
  const completionRate = totalReviews > 0 ? Math.round((completedCount / totalReviews) * 100) : 100;

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        !searchTerm ||
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reviewerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCycle = cycleFilter === "All" || r.reviewCycle === cycleFilter;
      return matchesSearch && matchesCycle;
    });
  }, [reviews, searchTerm, cycleFilter]);

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <PageHeader
        title="Performance & Reviews"
        subtitle="Manage quarterly review cycles, track employee OKRs, and evaluate structured feedback."
        icon={<Star size={28} className="text-white" />}
        tabs={["Reviews", "Goals", "Cycles"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="row gap-12 align-center">
            {activeTab === "Goals" ? (
              <button
                className="btn-primary row gap-8 align-center"
                style={{
                  background: "var(--gradient)",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 20,
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => setShowGoalModal(true)}
              >
                <Plus size={16} /> New Goal
              </button>
            ) : (
              <button
                className="btn-secondary row gap-8 align-center"
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
                onClick={() => setShowReviewModal(true)}
              >
                <Plus size={16} /> New Review
              </button>
            )}
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", background: "var(--bg-page)" }}>
        <div className="col gap-32">
          <StatRibbon
            stats={[
              {
                label: "Total Reviews",
                value: totalReviews,
                icon: <Star size={18} />,
                color: "var(--primary)",
                description: "All active cycles",
              },
              {
                label: "Completed",
                value: completedCount,
                icon: <CheckSquare size={18} />,
                color: "var(--success)",
                trend: `${completionRate}% rate`,
                trendType: "positive",
                description: "Submitted and verified",
              },
              {
                label: "Active Goals",
                value: goals.length,
                icon: <Target size={18} />,
                color: "var(--warning)",
                trend: "Across organization",
                trendType: "neutral",
                description: "Tracked OKR milestones",
              },
            ]}
          />

          {/* TAB 1: REVIEWS */}
          {activeTab === "Reviews" && (
            <>
              <div className="row-between align-center">
                <div className="col gap-4">
                  <h2 className="text-xl fw-800 text-1 m-0">Review Tracker</h2>
                  <span className="text-sm text-4 fw-500">
                    Live performance records · {filteredReviews.length} evaluations
                  </span>
                </div>
                <div className="row gap-12 align-center">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "white",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "0 16px",
                      height: 40,
                      gap: 10,
                      width: 260,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Search size={15} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: 13.5,
                        color: "var(--text-1)",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <Loader2 size={32} className="animate-spin text-primary" style={{ margin: "0 auto 12px" }} />
                  <span className="text-sm text-4">Loading performance evaluations...</span>
                </div>
              ) : filteredReviews.length > 0 ? (
                <div className="col gap-12">
                  {filteredReviews.map((r) => (
                    <Card
                      key={r.id}
                      style={{
                        borderRadius: 16,
                        border: "1px solid var(--border)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                      }}
                      className="hover-lift"
                    >
                      <CardBody style={{ padding: "20px 28px", display: "flex", alignItems: "center", gap: 20 }}>
                        <Avatar name={r.employeeName} size="md" />
                        <div className="col gap-4 flex-1">
                          <h3 className="m-0 text-base fw-700 text-1">{r.employeeName}</h3>
                          <span className="text-sm text-5">
                            {r.department} · Reviewer: {r.reviewerName} · Cycle: {r.reviewCycle}
                          </span>
                        </div>
                        <div className="col gap-4 align-end">
                          {r.overallScore !== null ? (
                            <ScoreStars score={r.overallScore} />
                          ) : (
                            <span className="text-sm text-5">Not rated yet</span>
                          )}
                          <span className="text-xs text-5">
                            {r.dueDate ? `Due ${r.dueDate}` : `Created ${new Date(r.createdAt).toLocaleDateString()}`}
                          </span>
                        </div>
                        <Badge
                          variant={
                            r.status === "acknowledged" || r.status === "submitted"
                              ? "success"
                              : r.status === "draft"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {r.status.toUpperCase()}
                        </Badge>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "white",
                    borderRadius: 16,
                    border: "1px dashed var(--border)",
                  }}
                >
                  <Award size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
                  <h3 className="text-base fw-700 text-1 m-0 mb-4">No reviews recorded yet</h3>
                  <p className="text-sm text-4 m-0 mb-20">
                    Conduct employee reviews to foster career development and record formal ratings.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowReviewModal(true)}
                    style={{ padding: "10px 24px", borderRadius: 20 }}
                  >
                    Start First Review
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: GOALS */}
          {activeTab === "Goals" && (
            <div className="col gap-24">
              <div className="row-between align-center">
                <div>
                  <h2 className="text-xl fw-800 text-1 m-0">Active Objectives & Goals (OKRs)</h2>
                  <span className="text-sm text-4 fw-500">
                    Track individual and team milestones linked to organizational performance.
                  </span>
                </div>
                <button
                  className="btn-primary row gap-8 align-center"
                  onClick={() => setShowGoalModal(true)}
                  style={{ padding: "10px 20px", borderRadius: 20 }}
                >
                  <Plus size={15} /> Create Goal
                </button>
              </div>

              {isLoading ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <Loader2 size={32} className="animate-spin text-primary" style={{ margin: "0 auto 12px" }} />
                  <span className="text-sm text-4">Loading active goals...</span>
                </div>
              ) : goals.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                  {goals.map((g) => (
                    <Card key={g.id} style={{ borderRadius: 16, border: "1px solid var(--border)" }}>
                      <CardBody className="col gap-16 p-24">
                        <div className="row-between align-start">
                          <div className="col gap-4">
                            <span className="text-xs fw-700 text-primary uppercase">{g.department}</span>
                            <h3 className="m-0 text-base fw-700 text-1">{g.title}</h3>
                            <span className="text-xs text-5">Assigned to: {g.employeeName}</span>
                          </div>
                          <Badge
                            variant={
                              g.status === "achieved"
                                ? "success"
                                : g.status === "in_progress"
                                ? "primary"
                                : "neutral"
                            }
                          >
                            {g.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>

                        {g.description && (
                          <p className="text-xs text-4 m-0" style={{ lineHeight: 1.6 }}>
                            {g.description}
                          </p>
                        )}

                        <div className="col gap-6">
                          <div className="row-between text-xs">
                            <span className="text-4 fw-600">Progress</span>
                            <span className="text-1 fw-700">{g.completionPercentage}%</span>
                          </div>
                          <div style={{ background: "var(--border)", height: 6, borderRadius: 3, overflow: "hidden" }}>
                            <div
                              style={{
                                background: "var(--primary)",
                                height: "100%",
                                width: `${Math.min(100, g.completionPercentage)}%`,
                                borderRadius: 3,
                              }}
                            />
                          </div>
                          {g.dueDate && (
                            <span className="text-xs text-5 mt-4">Due on: {g.dueDate}</span>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "white",
                    borderRadius: 16,
                    border: "1px dashed var(--border)",
                  }}
                >
                  <Target size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
                  <h3 className="text-base fw-700 text-1 m-0 mb-4">No performance goals created yet</h3>
                  <p className="text-sm text-4 m-0 mb-20">
                    Establish key milestones and measurable targets for your team members.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowGoalModal(true)}
                    style={{ padding: "10px 24px", borderRadius: 20 }}
                  >
                    Set Up First Goal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CYCLES */}
          {activeTab === "Cycles" && (
            <div className="grid-3 gap-24">
              {["Q1 2026", "Q2 2026", "Q3 2026"].map((cycle, i) => {
                const cycleReviews = reviews.filter((r) => r.reviewCycle === cycle);
                const avgScore =
                  cycleReviews.length > 0
                    ? (
                        cycleReviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) /
                        cycleReviews.length
                      ).toFixed(1)
                    : "—";

                return (
                  <Card key={cycle} style={{ borderRadius: 16, border: "1px solid var(--border)" }}>
                    <CardBody className="p-24 col gap-16">
                      <div className="row-between align-start">
                        <div className="col gap-4">
                          <h3 className="m-0 text-lg fw-700 text-1">{cycle}</h3>
                          <Badge variant={i === 2 ? "warning" : "success"}>{i === 2 ? "Active" : "Closed"}</Badge>
                        </div>
                        <div
                          className="icon-chip"
                          style={{
                            background: "var(--primary-tint)",
                            color: "var(--primary)",
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <BarChart2 size={18} />
                        </div>
                      </div>
                      <div className="col gap-8 pt-12" style={{ borderTop: "1px dashed var(--border)" }}>
                        <div className="row-between text-sm">
                          <span className="text-4 fw-600">Recorded Reviews</span>
                          <span className="text-1 fw-700">{cycleReviews.length}</span>
                        </div>
                        <div className="row-between text-sm">
                          <span className="text-4 fw-600">Average Rating</span>
                          <span className="text-1 fw-700">{avgScore}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Review */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="New Performance Review"
        subtitle="Submit a formal review score and feedback for an employee."
      >
        <div className="col gap-20 p-24">
          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Employee to Review</label>
            <SearchableSelect
              value={reviewForm.employeeId}
              onChange={(val) => setReviewForm({ ...reviewForm, employeeId: val })}
              placeholder="Select team member..."
              searchPlaceholder="Search by name or department..."
              options={employeeSelectOptions}
            />
          </div>

          <div className="grid-2 gap-16">
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Review Cycle</label>
              <Select
                value={reviewForm.cycle}
                onChange={(e) => setReviewForm({ ...reviewForm, cycle: e.target.value })}
              >
                <option value="Q3 2026">Q3 2026</option>
                <option value="Q4 2026">Q4 2026</option>
                <option value="Annual 2026">Annual 2026</option>
              </Select>
            </div>
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Overall Score (1 - 5 Stars)</label>
              <Select
                value={String(reviewForm.score)}
                onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) })}
              >
                <option value="5">5 - Outstanding</option>
                <option value="4">4 - Exceeds Expectations</option>
                <option value="3">3 - Meets Expectations</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="1">1 - Unsatisfactory</option>
              </Select>
            </div>
          </div>

          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Review Status</label>
            <Select
              value={reviewForm.status}
              onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
            >
              <option value="submitted">Submitted & Finalized</option>
              <option value="draft">Draft Review</option>
              <option value="acknowledged">Acknowledged by Employee</option>
            </Select>
          </div>

          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Evaluation Comments & Feedback</label>
            <Textarea
              placeholder="Highlight key achievements, areas for growth, and leadership impact..."
              value={reviewForm.comments}
              onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
              style={{ minHeight: 100 }}
            />
          </div>

          <div className="row-end gap-12 pt-12 border-t border-border">
            <button
              className="btn-neutral"
              onClick={() => setShowReviewModal(false)}
              disabled={isSubmittingReview}
            >
              Cancel
            </button>
            <button
              className="btn-primary row gap-8 align-center"
              onClick={handleCreateReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
              <span>Save Performance Review</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: New Goal */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Establish Performance Goal (OKR)"
        subtitle="Create an individual or organizational milestone for a team member."
      >
        <div className="col gap-20 p-24">
          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Employee</label>
            <SearchableSelect
              value={goalForm.employeeId}
              onChange={(val) => setGoalForm({ ...goalForm, employeeId: val })}
              placeholder="Select team member..."
              searchPlaceholder="Search by name or department..."
              options={employeeSelectOptions}
            />
          </div>

          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Goal Title</label>
            <Input
              type="text"
              placeholder="E.g., Complete AWS certification, reduce customer ticket response by 30%"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            />
          </div>

          <div className="grid-2 gap-16">
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Status</label>
              <Select
                value={goalForm.status}
                onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value })}
              >
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
                <option value="achieved">Achieved</option>
                <option value="missed">Missed</option>
              </Select>
            </div>
            <div className="col gap-6">
              <label className="text-xs fw-700 text-2">Progress Percentage ({goalForm.completionPercentage}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={goalForm.completionPercentage}
                onChange={(e) => setGoalForm({ ...goalForm, completionPercentage: Number(e.target.value) })}
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>
          </div>

          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Target Due Date</label>
            <Input
              type="date"
              value={goalForm.dueDate}
              onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
            />
          </div>

          <div className="col gap-6">
            <label className="text-xs fw-700 text-2">Goal Description & Success Criteria</label>
            <Textarea
              placeholder="Outline specific milestones, key performance indicators, or expectations..."
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              style={{ minHeight: 90 }}
            />
          </div>

          <div className="row-end gap-12 pt-12 border-t border-border">
            <button
              className="btn-neutral"
              onClick={() => setShowGoalModal(false)}
              disabled={isSubmittingGoal}
            >
              Cancel
            </button>
            <button
              className="btn-primary row gap-8 align-center"
              onClick={handleCreateGoal}
              disabled={isSubmittingGoal}
            >
              {isSubmittingGoal ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
              <span>Create Goal</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
