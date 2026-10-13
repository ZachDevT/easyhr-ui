"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  Star,
  LayoutDashboard,
  ArrowLeft,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Trash2,
  GripVertical,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Calendar,
  Eye,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { CurrencySelect } from "@/components/ui/CurrencySelect";
import { PageHeader } from "@/components/layout/PageHeader";
import { useHR, Candidate } from "@/context/HRContext";
import { HiringSkeleton } from "@/components/ui/Skeleton";
import { RichTextEditor, RichTextRenderer, formatEmploymentType, formatPostedDate } from "@/components/ui/RichTextEditor";
import { toast } from "@/components/ui/Toast";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  status: string;
  departmentId?: string;
  departmentName: string;
  positionId?: string;
  positionTitle?: string;
  applicantCount: number;
  createdAt?: string;
}

interface DepartmentRole {
  id: string;
  organizationId?: string;
  departmentId?: string;
  title: string;
  level: string;
  reportsTo: string;
  payType: string;
  currency: string;
  minPay: number;
  maxPay: number;
  status: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const STAGES = ["Applied", "Screening", "Interviewing", "Offer", "Hired"];

export default function HiringPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { candidates, isLoading: isLoadingCandidates, updateCandidateStage, refresh: refreshCandidates } = useHR();

  const [activeTab, setActiveTab] = useState("Pipeline");
  const [selectedJob, setSelectedJob] = useState("All Roles");
  const [searchQuery, setSearchQuery] = useState("");

  // View state: 'list' or 'create_job'
  const [viewState, setViewState] = useState<"list" | "create_job">("list");

  // Job postings state
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Job Builder State
  const [builderStep, setBuilderStep] = useState(1);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    positionId: "",
    departmentId: "",
    location: "Remote",
    employmentType: "full_time",
    description: "",
  });

  const [departmentRoles, setDepartmentRoles] = useState<DepartmentRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({
    title: "",
    level: "Mid",
    reportsTo: "Main (Department Head)",
    payType: "Salaried",
    currency: "CAD",
    minPay: 80000,
    maxPay: 120000,
  });

  const fetchJobs = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [jobsRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (jobsRes.ok) {
        const json = await jobsRes.json();
        setJobs(json || []);
      }
      if (deptsRes.ok) {
        const deptJson = await deptsRes.json();
        setDepartments(deptJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load jobs or departments", err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [getToken]);

  const fetchDepartmentRoles = useCallback(async (deptId: string) => {
    if (!deptId) {
      setDepartmentRoles([]);
      return;
    }
    setIsLoadingRoles(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/departments/${deptId}/positions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setDepartmentRoles(json.data || []);
      } else {
        setDepartmentRoles([]);
      }
    } catch (err) {
      console.error("Failed to fetch department roles", err);
      setDepartmentRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (newJob.departmentId) {
      fetchDepartmentRoles(newJob.departmentId);
    } else {
      setDepartmentRoles([]);
    }
  }, [newJob.departmentId, fetchDepartmentRoles]);

  const handleSaveRole = async () => {
    if (!newJob.departmentId || !roleForm.title.trim()) {
      toast.warning("Title required", "Please enter a title for the new role.");
      return;
    }
    setIsSubmittingRole(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/departments/${newJob.departmentId}/positions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: roleForm.title.trim(),
          level: roleForm.level,
          reportsTo: roleForm.reportsTo,
          payType: roleForm.payType,
          currency: roleForm.currency,
          minPay: Number(roleForm.minPay),
          maxPay: Number(roleForm.maxPay),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        toast.success("Role created", `"${roleForm.title.trim()}" added to department.`);
        setShowRoleModal(false);
        setRoleForm({
          title: "",
          level: "Mid",
          reportsTo: "Main (Department Head)",
          payType: "Salaried",
          currency: "CAD",
          minPay: 80000,
          maxPay: 120000,
        });
        await fetchDepartmentRoles(newJob.departmentId);
        setNewJob((prev) => ({
          ...prev,
          positionId: created.id,
          title: created.title,
        }));
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Failed to create role", errJson.detail || errJson.title || "Could not add role.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to create role.");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title.trim()) return;

    setIsSubmittingJob(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newJob.title.trim(),
          description: newJob.description.trim() || "Exciting opportunity to join our growing team.",
          location: newJob.location,
          employmentType: newJob.employmentType,
          status: "published",
          departmentId: newJob.departmentId || null,
          positionId: newJob.positionId || null,
        }),
      });

      if (res.ok) {
        toast.success("Job posting created", `"${newJob.title.trim()}" is now published.`);
        setViewState("list");
        setBuilderStep(1);
        setNewJob({
          title: "",
          positionId: "",
          departmentId: "",
          location: "Remote",
          employmentType: "full_time",
          description: "",
        });
        fetchJobs();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Failed to create job posting", errJson.detail || errJson.title || "Could not publish job.");
      }
    } catch (err: any) {
      console.error("Failed to create job posting", err);
      toast.error("Network error", err.message || "Failed to create job posting.");
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Job status updated", `Status changed to ${status.charAt(0).toUpperCase() + status.slice(1)}.`);
        fetchJobs();
      } else {
        toast.error("Failed to update status", "Could not update job status.");
      }
    } catch (err) {
      console.error("Failed to update job status", err);
      toast.error("Network error", "Unable to update job status.");
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData("candidateId", candidateId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const candidateId = e.dataTransfer.getData("candidateId");
    if (candidateId) {
      updateCandidateStage(candidateId, targetStage);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesJob = selectedJob === "All Roles" || c.role === selectedJob;
    const matchesQuery =
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesJob && matchesQuery;
  });

  // -------------------------------------------------------------
  // VIEW: JOB BUILDER WIZARD
  // -------------------------------------------------------------
  if (viewState === "create_job") {
    return (
      <div className="page-container" style={{ background: "var(--bg-page)", padding: "32px 48px", height: "100%", overflowY: "auto" }}>
        <button className="btn-secondary row gap-8 mb-32" onClick={() => setViewState("list")}>
          <ArrowLeft size={16} /> Back to ATS
        </button>

        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="row-between mb-32 align-end">
            <div>
              <h1 className="text-3xl fw-800 text-1 m-0 mb-8">Job Post Builder</h1>
              <p className="text-lg text-5 m-0">Create a dynamic job posting for your organization.</p>
            </div>

            <div className="row gap-12 align-center">
              {[1, 2].map((step) => (
                <div key={step} className="row gap-8 align-center">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: builderStep >= step ? "var(--primary)" : "white",
                      color: builderStep >= step ? "white" : "var(--text-4)",
                      fontWeight: 700,
                      border: builderStep >= step ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {builderStep > step ? <CheckCircle2 size={16} /> : step}
                  </div>
                  {step < 2 && <div style={{ width: 40, height: 2, background: builderStep > step ? "var(--primary)" : "var(--border)" }} />}
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardBody style={{ padding: 40 }}>
              {builderStep === 1 && (
                <div className="col gap-28">
                  <div>
                    <h2 className="text-2xl fw-800 text-1 m-0">1. Job Details &amp; Department Role</h2>
                    <p className="text-sm text-5 mt-4">Every job opening represents an active role in a department.</p>
                  </div>

                  {/* Department & Location */}
                  <div className="grid-2 gap-24">
                    <div className="col gap-10">
                      <label className="text-sm fw-700 text-1">Department *</label>
                      <select
                        className="select"
                        value={newJob.departmentId}
                        onChange={(e) => {
                          const deptId = e.target.value;
                          setNewJob({ ...newJob, departmentId: deptId, positionId: "", title: "" });
                        }}
                      >
                        <option value="">Select a department...</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col gap-10">
                      <label className="text-sm fw-700 text-1">Location &amp; Work Model</label>
                      <select
                        className="select"
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      >
                        <option value="Remote">Remote</option>
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  {/* Role in Department */}
                  {newJob.departmentId ? (
                    <div className="col gap-14" style={{ background: "#F9FAFB", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
                      <div className="row-between align-center">
                        <div className="row gap-8 align-center">
                          <Briefcase size={18} className="text-primary" />
                          <span className="text-sm fw-700 text-1">Department Role *</span>
                        </div>
                        <button
                          type="button"
                          className="btn-neutral row gap-6 align-center"
                          onClick={() => setShowRoleModal(true)}
                          style={{ fontSize: 13, padding: "6px 12px" }}
                        >
                          <Plus size={14} /> Add New Role
                        </button>
                      </div>

                      {isLoadingRoles ? (
                        <div className="row gap-8 align-center text-sm text-4 py-8">
                          <Loader2 size={16} className="animate-spin text-primary" /> Loading department roles...
                        </div>
                      ) : departmentRoles.length === 0 ? (
                        <div className="col gap-10 p-16" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10 }}>
                          <span className="text-sm fw-700 text-warning">
                            No roles defined for this department yet.
                          </span>
                          <p className="text-xs text-4 m-0">
                            Each job posting must be tied to an organizational role. Please add a role to this department before continuing.
                          </p>
                          <div>
                            <button
                              type="button"
                              className="btn-primary row gap-6 align-center"
                              onClick={() => setShowRoleModal(true)}
                              style={{ fontSize: 13, padding: "8px 16px" }}
                            >
                              <Plus size={14} /> Add Role Now
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="col gap-10">
                          <select
                            className="select"
                            value={newJob.positionId}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "ADD_NEW") {
                                setShowRoleModal(true);
                              } else {
                                const selected = departmentRoles.find((r) => r.id === val);
                                setNewJob({
                                  ...newJob,
                                  positionId: val,
                                  title: selected ? selected.title : "",
                                });
                              }
                            }}
                          >
                            <option value="">Select a role from this department...</option>
                            {departmentRoles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.title} ({role.level}) &bull; Reports to: {role.reportsTo || "Main"}
                              </option>
                            ))}
                            <option value="ADD_NEW">+ Add another role to this department...</option>
                          </select>

                          {newJob.positionId && (() => {
                            const selected = departmentRoles.find((r) => r.id === newJob.positionId);
                            if (!selected) return null;
                            return (
                              <div className="row gap-16 align-center p-12 text-xs flex-wrap" style={{ background: "white", borderRadius: 8, border: "1px solid var(--border)" }}>
                                <Badge variant="primary">{selected.level} Level</Badge>
                                <span className="text-4">
                                  Reports to: <strong className="text-1">{selected.reportsTo || "Main"}</strong>
                                </span>
                                {selected.minPay > 0 && (
                                  <span className="text-4">
                                    Band: <strong className="text-1">{selected.minPay.toLocaleString()} - {selected.maxPay.toLocaleString()} {selected.currency} ({selected.payType})</strong>
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-16 text-sm text-4" style={{ background: "#F9FAFB", borderRadius: 10, border: "1px dashed var(--border)", textAlign: "center" }}>
                      Select a department above to view and assign its associated roles.
                    </div>
                  )}

                  {/* Job Title */}
                  <div className="col gap-10">
                    <label className="text-sm fw-700 text-1">Job Post Title *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Senior Software Engineer"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    />
                    <span className="text-xs text-4">
                      Pre-filled from the chosen role and can be tailored for external job boards.
                    </span>
                  </div>

                  <div className="col gap-10">
                    <label className="text-sm fw-700 text-1">Employment Type</label>
                    <select
                      className="select"
                      value={newJob.employmentType}
                      onChange={(e) => setNewJob({ ...newJob, employmentType: e.target.value })}
                    >
                      <option value="full_time">Full-Time</option>
                      <option value="part_time">Part-Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>

                  <div className="col gap-10">
                    <label className="text-sm fw-700 text-1">Job Description</label>
                    <RichTextEditor
                      value={newJob.description}
                      onChange={(val: string) => setNewJob({ ...newJob, description: val })}
                      placeholder="Describe the responsibilities, qualifications, and role expectations..."
                      minHeight={240}
                    />
                  </div>

                  <div className="divider m-0" />
                  <div className="row-between mt-8">
                    <button className="btn-neutral" onClick={() => setViewState("list")} style={{ padding: "14px 28px" }}>
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => setBuilderStep(2)}
                      disabled={!newJob.title.trim() || !newJob.departmentId || !newJob.positionId}
                      style={{ padding: "14px 36px" }}
                    >
                      Next: Preview &amp; Publish <ArrowRight size={16} style={{ marginLeft: 8 }} />
                    </button>
                  </div>
                </div>
              )}

              {builderStep === 2 && (
                <div className="col gap-32 py-16">
                  <div className="row-between align-center pb-20" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <h2 className="text-2xl fw-800 text-1 m-0">Live WYSIWYG Careers Preview</h2>
                      <p className="text-sm text-5 mt-4">
                        Review how your job posting will look to candidates on the public careers portal before publishing.
                      </p>
                    </div>
                    <div className="row gap-12">
                      <button className="btn-neutral" onClick={() => setBuilderStep(1)} style={{ padding: "10px 20px" }}>
                        Back to Edit
                      </button>
                      <button
                        className="btn-primary row gap-8 align-center"
                        onClick={handleCreateJob}
                        disabled={isSubmittingJob}
                        style={{ padding: "10px 28px" }}
                      >
                        {isSubmittingJob ? <Loader2 size={16} className="animate-spin" /> : null}
                        <span>Publish to Careers Page</span>
                      </button>
                    </div>
                  </div>

                  {/* Careers Job Card Preview */}
                  <div 
                    style={{ 
                      background: "white", 
                      border: "1px solid #E5E7EB", 
                      borderRadius: 18, 
                      padding: "32px 36px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.04)"
                    }}
                  >
                    <div className="row gap-12 mb-16 align-center flex-wrap">
                      <Badge variant="primary">
                        {departments.find((d) => d.id === newJob.departmentId)?.name || "General"}
                      </Badge>
                      <Badge variant="neutral">{newJob.location || "Remote"}</Badge>
                      <Badge variant="neutral">{formatEmploymentType(newJob.employmentType)}</Badge>
                      <Badge variant="neutral" style={{ background: "#F3F4F6", color: "var(--text-3)", fontWeight: 600 }}>
                        <Calendar size={13} style={{ marginRight: 6 }} /> Posted today
                      </Badge>
                    </div>

                    <h1 className="text-3xl fw-800 text-1 m-0 mb-14">{newJob.title}</h1>

                    <div className="row gap-20 text-sm text-5 fw-500 mb-28 flex-wrap" style={{ paddingBottom: 20, borderBottom: "1px solid #F3F4F6" }}>
                      <span className="row gap-6 align-center">
                        <Briefcase size={16} /> {departments.find((d) => d.id === newJob.departmentId)?.name || "General"}
                      </span>
                      <span>&bull;</span>
                      <span className="row gap-6 align-center">
                        <MapPin size={16} /> {newJob.location}
                      </span>
                      <span>&bull;</span>
                      <span className="row gap-6 align-center">
                        <Clock size={16} /> {formatEmploymentType(newJob.employmentType)}
                      </span>
                      <span>&bull;</span>
                      <span className="row gap-6 align-center">
                        <Calendar size={16} /> Posted today
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg fw-800 text-1 mb-12">Job Description &amp; Details</h4>
                      <div style={{ background: "#FAFBFD", padding: 24, borderRadius: 12, border: "1px solid #F3F4F6" }}>
                        <RichTextRenderer content={newJob.description} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ADD ROLE TO DEPARTMENT MODAL */}
        <Modal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title="Add Role to Department"
          subtitle={`Department: ${departments.find((d) => d.id === newJob.departmentId)?.name || "Selected Department"}`}
          footer={
            <div className="row-between w-full align-center" style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
              <button className="btn-neutral" onClick={() => setShowRoleModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary row gap-8 align-center"
                onClick={handleSaveRole}
                disabled={isSubmittingRole || !roleForm.title.trim()}
              >
                {isSubmittingRole ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Save &amp; Select Role</span>
              </button>
            </div>
          }
        >
          <div className="col gap-20">
            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Role Title *</label>
              <Input
                type="text"
                placeholder="e.g. Senior Backend Engineer"
                value={roleForm.title}
                onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })}
              />
            </div>

            <div className="grid-2 gap-16">
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Seniority Level</label>
                <Select
                  value={roleForm.level}
                  onChange={(e) => setRoleForm({ ...roleForm, level: e.target.value })}
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Director">Director</option>
                  <option value="Executive">Executive</option>
                </Select>
              </div>

              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Reports To</label>
                <Select
                  value={
                    roleForm.reportsTo === "Main (Department Head)" ||
                    roleForm.reportsTo === "None" ||
                    departmentRoles.some((r) => r.title === roleForm.reportsTo)
                      ? roleForm.reportsTo
                      : "custom"
                  }
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setRoleForm({ ...roleForm, reportsTo: "" });
                    } else {
                      setRoleForm({ ...roleForm, reportsTo: e.target.value });
                    }
                  }}
                >
                  <option value="Main (Department Head)">Main (Department Head)</option>
                  <option value="None">None (Top-Level Role)</option>
                  {departmentRoles.map((r) => (
                    <option key={r.id} value={r.title}>
                      Role: {r.title} ({r.level})
                    </option>
                  ))}
                  <option value="custom">Custom Title...</option>
                </Select>
                {!["Main (Department Head)", "None"].includes(roleForm.reportsTo) &&
                  !departmentRoles.some((r) => r.title === roleForm.reportsTo) && (
                    <Input
                      type="text"
                      placeholder="Enter reporting manager or role"
                      value={roleForm.reportsTo}
                      onChange={(e) => setRoleForm({ ...roleForm, reportsTo: e.target.value })}
                    />
                  )}
              </div>
            </div>

            <div className="grid-2 gap-16">
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Pay Type</label>
                <Select
                  value={roleForm.payType}
                  onChange={(e) => setRoleForm({ ...roleForm, payType: e.target.value })}
                >
                  <option value="Salaried">Salaried (Annual)</option>
                  <option value="Hourly">Hourly</option>
                </Select>
              </div>

              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Currency</label>
                <CurrencySelect
                  value={roleForm.currency}
                  onChange={(curr) => setRoleForm({ ...roleForm, currency: curr })}
                />
              </div>
            </div>

            <div className="grid-2 gap-16">
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Min Pay</label>
                <Input
                  type="number"
                  value={roleForm.minPay}
                  onChange={(e) => setRoleForm({ ...roleForm, minPay: Number(e.target.value) })}
                />
              </div>
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Max Pay</label>
                <Input
                  type="number"
                  value={roleForm.maxPay}
                  onChange={(e) => setRoleForm({ ...roleForm, maxPay: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN ATS DASHBOARD (Pipeline, Job Postings, Reports)
  // -------------------------------------------------------------
  const isLoading = isLoadingJobs || isLoadingCandidates;

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0, background: "var(--bg-page)", overflowY: "auto" }}>
      {/* Top Header */}
      <div style={{ flexShrink: 0 }}>
        <PageHeader
          title="Applicant Tracking System"
          subtitle="Manage your hiring pipeline, candidate tracking, and custom job postings."
          tabs={["Pipeline", "Job Postings", "Reports"]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={
            <button
              className="btn-secondary"
              style={{ background: "white", color: "var(--primary)", border: "none", padding: "12px 24px", fontSize: 14, fontWeight: 700, borderRadius: 20 }}
              onClick={() => {
                setViewState("create_job");
                setBuilderStep(1);
              }}
            >
              <Plus size={16} style={{ marginRight: 8 }} /> Create Job Post
            </button>
          }
        />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "transparent", position: "relative", marginTop: 16 }}>
        {isLoading ? (
          <HiringSkeleton />
        ) : (
          <>
            {/* ---------------- PIPELINE TAB ---------------- */}
            {activeTab === "Pipeline" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Toolbar */}
                <div className="row-between p-32" style={{ borderBottom: "1px solid var(--border)", background: "white", flexShrink: 0 }}>
                  <div className="row gap-24">
                    <div className="col gap-8">
                      <span className="text-xs fw-800 text-5 uppercase tracking-wider">Active Pipeline</span>
                      <select
                        className="select"
                        style={{ width: 300, fontWeight: 700, padding: 14, fontSize: 16, background: "#F9FAFB" }}
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                      >
                        <option>All Roles</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.title}>{j.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col gap-8">
                      <span className="text-xs fw-800 text-5 uppercase tracking-wider">Search Candidates</span>
                      <div className="search-bar" style={{ display: "flex", alignItems: "center", background: "#F9FAFB", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 20px", width: 400 }}>
                        <Search size={18} className="text-4" style={{ marginRight: 12 }} />
                        <input
                          type="text"
                          placeholder="Search by name, email, role..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ border: "none", background: "transparent", outline: "none", fontSize: 15, width: "100%", fontWeight: 500 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <style dangerouslySetInnerHTML={{
                  __html: `
                    .drag-over {
                      background: #EEF2FF !important;
                      border: 2px dashed var(--primary) !important;
                    }
                  `,
                }} />

                {/* Kanban Board */}
                <div style={{ padding: "32px 48px 64px 48px", display: "flex", gap: 24, alignItems: "flex-start", background: "var(--bg-page)", overflowX: "auto" }}>
                  {STAGES.map((stage) => {
                    const stageCandidates = filteredCandidates.filter((c) => c.stage === stage);
                    return (
                      <div
                        key={stage}
                        style={{ minWidth: 320, width: 320, display: "flex", flexDirection: "column", gap: 16, background: "#F3F4F6", padding: 16, borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)", transition: "all 0.2s" }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, stage)}
                      >
                        <div className="row-between align-center px-4">
                          <div className="row gap-12 align-center">
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: stage === "Hired" ? "var(--success)" : stage === "Offer" ? "var(--warning)" : "var(--primary)",
                              }}
                            />
                            <h3 className="text-sm fw-800 text-1 uppercase tracking-wider m-0">{stage}</h3>
                          </div>
                          <Badge variant="neutral" style={{ fontSize: 13, padding: "4px 12px", background: "white", fontWeight: 800, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            {stageCandidates.length}
                          </Badge>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 400 }}>
                          {stageCandidates.map((candidate) => (
                            <Card
                              key={candidate.id}
                              style={{ cursor: "grab", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", borderRadius: 12, background: "white" }}
                              className="hover-scale"
                              draggable
                              onDragStart={(e: React.DragEvent) => handleDragStart(e, candidate.id)}
                              onClick={() => router.push(`/hiring/candidates/${candidate.id}`)}
                            >
                              <CardBody style={{ padding: 24 }}>
                                <div className="row-between mb-20 align-start">
                                  <Badge variant="neutral" style={{ fontSize: 12, background: "#F3F4F6", color: "var(--text-3)", fontWeight: 700 }}>
                                    {candidate.source}
                                  </Badge>
                                  {candidate.rating && (
                                    <div className="row gap-4 align-center text-warning fw-800 text-sm bg-warning-tint px-8 py-4" style={{ borderRadius: 12 }}>
                                      <Star size={14} fill="currentColor" /> {candidate.rating}.0
                                    </div>
                                  )}
                                </div>

                                <div className="row gap-16 mb-24 align-center">
                                  <Avatar name={candidate.name} size="lg" src={candidate.avatar} style={{ width: 56, height: 56 }} />
                                  <div>
                                    <h4 className="text-lg fw-800 text-1 m-0 mb-4">{candidate.name}</h4>
                                    <p className="text-sm fw-600 text-4 m-0">{candidate.role}</p>
                                  </div>
                                </div>

                                <div className="row-between text-sm fw-600 text-5 pt-16" style={{ borderTop: "1px dashed var(--border)" }}>
                                  <span className="row gap-8 align-center"><Clock size={16} /> {candidate.date}</span>
                                  <span style={{ color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                    Profile <ChevronRight size={16} />
                                  </span>
                                </div>
                              </CardBody>
                            </Card>
                          ))}

                          {stageCandidates.length === 0 && (
                            <div style={{ border: "2px dashed var(--border)", borderRadius: 12, height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)", fontSize: 14, fontWeight: 700 }}>
                              Drop candidate here
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- JOB POSTINGS TAB ---------------- */}
            {activeTab === "Job Postings" && (
              <div style={{ padding: "16px 40px 64px 40px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                <div className="row-between align-center mb-24">
                  <div>
                    <h2 className="text-2xl fw-800 text-1 m-0 mb-4">Active Job Listings</h2>
                    <p className="text-sm text-5 m-0">Manage your published roles and open drafts.</p>
                  </div>
                  <div className="row gap-12">
                    <Link href="/careers" target="_blank" className="btn-neutral row gap-8" style={{ padding: "10px 16px", fontSize: 14 }}>
                      <ExternalLink size={16} /> View Careers Page
                    </Link>
                    <button
                      className="btn-primary row gap-8"
                      onClick={() => {
                        setViewState("create_job");
                        setBuilderStep(1);
                      }}
                      style={{ padding: "10px 16px", fontSize: 14 }}
                    >
                      <Plus size={16} /> New Job Post
                    </button>
                  </div>
                </div>

                {jobs.length === 0 ? (
                  <Card style={{ borderRadius: 16, border: "1px solid var(--border)", textAlign: "center", padding: "48px 24px" }}>
                    <CardBody className="col gap-12 align-center justify-center">
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)" }}>
                        <Briefcase size={24} />
                      </div>
                      <h3 className="m-0 text-base fw-700 text-1">No job postings created yet</h3>
                      <p className="m-0 text-sm text-4" style={{ maxWidth: 420 }}>
                        Create your first job posting to attract candidates and publish positions to your careers page.
                      </p>
                      <button
                        className="btn-primary row gap-8 align-center mt-8"
                        onClick={() => {
                          setViewState("create_job");
                          setBuilderStep(1);
                        }}
                      >
                        <Plus size={16} /> Create Job Post
                      </button>
                    </CardBody>
                  </Card>
                ) : (
                  <div className="grid-2 gap-20">
                    {jobs.map((job) => (
                      <Card key={job.id} style={{ border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", borderRadius: 16 }}>
                        <CardBody style={{ padding: 24 }}>
                          <div className="row-between align-start mb-24">
                            <div className="row gap-16 align-center">
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 12,
                                  background: job.status === "published" ? "var(--primary-tint)" : "var(--bg-body)",
                                  color: job.status === "published" ? "var(--primary)" : "var(--text-4)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Briefcase size={24} />
                              </div>
                              <div>
                                <h3 className="text-lg fw-800 text-1 m-0 mb-4">{job.title}</h3>
                                <Badge variant={job.status === "published" ? "success" : "neutral"} style={{ fontSize: 12, padding: "2px 8px" }}>
                                  {job.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="col gap-4 text-center">
                              <span className="text-2xl fw-800 text-1">{job.applicantCount || 0}</span>
                              <span className="text-xs fw-700 text-4 uppercase tracking-wider">Candidates</span>
                            </div>
                          </div>

                          <div className="row gap-16 text-sm text-5 fw-500 mb-20 flex-wrap" style={{ paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
                            <span className="row gap-6 align-center"><LayoutDashboard size={14} /> {job.departmentName || "General"}</span>
                            <span>•</span>
                            <span className="row gap-6 align-center"><MapPin size={14} /> {job.location}</span>
                            <span>•</span>
                            <span className="row gap-6 align-center"><Clock size={14} /> {formatEmploymentType(job.employmentType)}</span>
                            {job.createdAt && (
                              <>
                                <span>•</span>
                                <span className="row gap-6 align-center"><Calendar size={14} /> {formatPostedDate(job.createdAt)}</span>
                              </>
                            )}
                          </div>

                          <div className="row-between align-center">
                            <div className="row gap-12">
                              <select
                                className="select"
                                style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, fontWeight: 700, background: "#F9FAFB", border: "1px solid var(--border)", cursor: "pointer", outline: "none" }}
                                value={job.status}
                                onChange={(e) => handleUpdateJobStatus(job.id, e.target.value)}
                              >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                            <Link href={`/careers/preview?jobId=${job.id}`} target="_blank" className="text-primary text-sm fw-700 row gap-6" style={{ textDecoration: "none" }}>
                              Preview Job <ArrowRight size={14} />
                            </Link>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- REPORTS TAB ---------------- */}
            {activeTab === "Reports" && (
              <div style={{ padding: "16px 40px 64px 40px" }}>
                <div className="row-between align-center mb-24">
                  <h2 className="text-2xl fw-800 text-1 m-0">Hiring Analytics</h2>
                </div>

                <div className="grid-3 gap-24 mb-24">
                  <Card style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.03)", borderRadius: 16 }}>
                    <CardBody style={{ padding: 24 }}>
                      <div className="row-between mb-16 text-5">
                        <span className="fw-700 uppercase tracking-wider text-xs">Active Postings</span>
                        <Briefcase size={20} />
                      </div>
                      <h3 className="text-3xl fw-800 text-1 m-0 mb-8">{jobs.filter((j) => j.status === "published").length}</h3>
                      <div className="row gap-6 align-center text-sm fw-700 text-success">
                        Published openings
                      </div>
                    </CardBody>
                  </Card>

                  <Card style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.03)", borderRadius: 16 }}>
                    <CardBody style={{ padding: 24 }}>
                      <div className="row-between mb-16 text-5">
                        <span className="fw-700 uppercase tracking-wider text-xs">Total Candidates</span>
                        <Users size={20} />
                      </div>
                      <h3 className="text-3xl fw-800 text-1 m-0 mb-8">{candidates.length}</h3>
                      <div className="row gap-6 align-center text-sm fw-700 text-success">
                        In hiring pipeline
                      </div>
                    </CardBody>
                  </Card>

                  <Card style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.03)", borderRadius: 16 }}>
                    <CardBody style={{ padding: 24 }}>
                      <div className="row-between mb-16 text-5">
                        <span className="fw-700 uppercase tracking-wider text-xs">Hired Candidates</span>
                        <CheckCircle2 size={20} />
                      </div>
                      <h3 className="text-3xl fw-800 text-1 m-0 mb-8">{candidates.filter((c) => c.stage === "Hired").length}</h3>
                      <div className="row gap-6 align-center text-sm fw-700 text-success">
                        Ready for onboarding
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
