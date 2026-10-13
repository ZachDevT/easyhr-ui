"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useCallback } from "react";
import {
  Network,
  Plus,
  Search,
  MoreHorizontal,
  Users,
  Briefcase,
  ChevronRight,
  Building,
  ArrowLeft,
  UserCircle,
  DollarSign,
  Edit3,
  Shield,
  MapPin,
  Loader2,
  FolderTree,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { CurrencySelect } from "@/components/ui/CurrencySelect";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DepartmentsSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";

interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color: string;
  divisionId?: string;
  parentDepartmentId?: string;
  headEmployeeId?: string;
  headName: string;
  headcount: number;
  activeRoles: number;
  openRoles: number;
  status: string;
}

interface DepartmentRole {
  id: string;
  title: string;
  level: string;
  reportsTo: string;
  payType: string;
  currency: string;
  minPay: number;
  maxPay: number;
  status: string;
  createdAt: string;
}

interface DepartmentMember {
  id: string;
  name: string;
  role: string;
  manager: string;
  location: string;
  avatar?: string;
}

export default function DepartmentsPage() {
  const { getToken } = useAuth();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Directory");
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Department Detail State
  const [deptTab, setDeptTab] = useState("People");
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [roles, setRoles] = useState<DepartmentRole[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Role Wizard State
  const [showRoleWizard, setShowRoleWizard] = useState(false);
  const [roleStep, setRoleStep] = useState(1);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    title: "",
    level: "Mid",
    reportsTo: "Main (Department Head)",
    payType: "Salaried",
    currency: "CAD",
    minPay: 80000,
    maxPay: 120000,
  });

  // Fetch departments list
  const fetchDepartments = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setDepartments(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Fetch department details (members & positions) when selected
  const loadDeptDetails = useCallback(async (deptId: string) => {
    setIsLoadingDetails(true);
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [membersRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/departments/${deptId}/members`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/departments/${deptId}/positions`, { headers }),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data || []);
      }
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.data || []);
      }
    } catch (err) {
      console.error("Failed to load department details", err);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (selectedDept) {
      loadDeptDetails(selectedDept.id);
    }
  }, [selectedDept, loadDeptDetails]);

  // Create new position
  const handleSaveRole = async () => {
    if (!selectedDept || !newRole.title.trim()) return;

    setIsSubmittingRole(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/departments/${selectedDept.id}/positions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newRole.title.trim(),
          level: newRole.level,
          reportsTo: newRole.reportsTo,
          payType: newRole.payType,
          currency: newRole.currency,
          minPay: Number(newRole.minPay),
          maxPay: Number(newRole.maxPay),
        }),
      });

      if (res.ok) {
        toast.success("Position created", `"${newRole.title.trim()}" added to ${selectedDept.name}.`);
        setShowRoleWizard(false);
        setRoleStep(1);
        setNewRole({
          title: "",
          level: "Mid",
          reportsTo: "Main (Department Head)",
          payType: "Salaried",
          currency: "CAD",
          minPay: 80000,
          maxPay: 120000,
        });
        await loadDeptDetails(selectedDept.id);
        fetchDepartments();
      } else {
        toast.error("Failed to create position", "Could not add role to department.");
      }
    } catch (err) {
      console.error("Failed to create position", err);
      toast.error("Network error", "Unable to create position.");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalHeadcount = departments.reduce((acc, d) => acc + (d.headcount || 0), 0);
  const totalActiveRoles = departments.reduce((acc, d) => acc + (d.activeRoles || 0), 0);
  const totalOpenRoles = departments.reduce((acc, d) => acc + (d.openRoles || 0), 0);

  // DETAIL VIEW
  if (selectedDept) {
    return (
      <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
        {/* Deep Department Header */}
        <div style={{ background: "white", padding: "32px 40px 0 40px", display: "flex", flexDirection: "column", gap: 24, borderBottom: "1px solid var(--border)" }}>
          {/* Breadcrumb Navigation */}
          <div className="row gap-8 align-center text-sm fw-600">
            <button
              onClick={() => setSelectedDept(null)}
              className="text-4 hover-text-1"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <ArrowLeft size={16} /> Directory
            </button>
            <span className="text-border">/</span>
            <span className="text-1">{selectedDept.name}</span>
          </div>

          {/* Main Header Info */}
          <div className="row-between align-center" style={{ marginTop: 8 }}>
            <div className="row gap-20 align-center">
              {/* Hanging Avatar */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: `${selectedDept.color || "#1A73E8"}15`,
                  color: selectedDept.color || "#1A73E8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <Network size={36} />
              </div>

              {/* Text Block */}
              <div className="col gap-6">
                <h1 className="m-0 text-3xl fw-800 text-1" style={{ letterSpacing: "-0.5px" }}>
                  {selectedDept.name} Department
                </h1>
                <div className="row gap-16 align-center text-sm text-5 fw-600">
                  <span className="row gap-6 align-center">
                    <UserCircle size={16} className="text-4" /> Head: {selectedDept.headName || "Unassigned"}
                  </span>
                  <span style={{ width: 4, height: 4, borderRadius: 2, background: "var(--border)" }} />
                  <span className="row gap-6 align-center">
                    <Users size={16} className="text-4" /> {selectedDept.headcount} Employees
                  </span>
                  {selectedDept.code && (
                    <>
                      <span style={{ width: 4, height: 4, borderRadius: 2, background: "var(--border)" }} />
                      <Badge variant="neutral">{selectedDept.code}</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {deptTab === "Roles" && (
              <button
                className="btn-primary row gap-8 align-center"
                onClick={() => {
                  setShowRoleWizard(true);
                  setRoleStep(1);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "var(--gradient)",
                  border: "none",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(162, 56, 255, 0.2)",
                }}
              >
                <Plus size={16} /> Create Role
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="row gap-4" style={{ marginLeft: 92, marginTop: 16 }}>
            {["People", "Roles", "Hierarchy"].map((tab) => (
              <button
                key={tab}
                onClick={() => setDeptTab(tab)}
                style={{
                  background: deptTab === tab ? "var(--bg-page)" : "transparent",
                  color: deptTab === tab ? "var(--primary)" : "var(--text-3)",
                  border: "none",
                  padding: "12px 24px",
                  fontSize: 14,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  cursor: "pointer",
                  fontWeight: deptTab === tab ? 700 : 500,
                  transition: "all 0.2s ease",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "40px", background: "var(--bg-page)" }}>
          {isLoadingDetails ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : (
            <>
              {deptTab === "People" && (
                <div className="col gap-24">
                  <div className="row-between align-center">
                    <div className="col gap-4">
                      <h2 className="text-lg fw-700 text-1 m-0">Department Roster</h2>
                      <span className="text-sm text-4 fw-500">{members.length} members</span>
                    </div>
                  </div>

                  {members.length === 0 ? (
                    <Card style={{ borderRadius: 16, border: "1px solid var(--border)", textAlign: "center", padding: "48px 24px" }}>
                      <CardBody className="col gap-12 align-center justify-center">
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)" }}>
                          <Users size={24} />
                        </div>
                        <h3 className="m-0 text-base fw-700 text-1">No employees assigned yet</h3>
                        <p className="m-0 text-sm text-4" style={{ maxWidth: 380 }}>
                          When candidates are hired and complete onboarding into the {selectedDept.name} department, they will appear here automatically.
                        </p>
                      </CardBody>
                    </Card>
                  ) : (
                    <Card style={{ borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                      <CardBody className="p-0">
                        <div className="grid-4 p-16 border-b border-border bg-neutral text-xs fw-700 text-4 uppercase tracking-wider">
                          <div>Employee</div>
                          <div>Role</div>
                          <div>Reports To</div>
                          <div>Location</div>
                        </div>
                        {members.map((p) => (
                          <div key={p.id} className="grid-4 p-16 border-b border-border align-center hover-bg-neutral" style={{ cursor: "pointer" }}>
                            <div className="row gap-12 align-center">
                              <Avatar src={p.avatar} name={p.name} size="sm" />
                              <span className="fw-600 text-1">{p.name}</span>
                            </div>
                            <div className="text-sm fw-600 text-2">{p.role}</div>
                            <div className="text-sm text-5">{p.manager}</div>
                            <div className="row gap-4 align-center text-sm text-5">
                              <MapPin size={14} /> {p.location}
                            </div>
                          </div>
                        ))}
                      </CardBody>
                    </Card>
                  )}
                </div>
              )}

              {deptTab === "Roles" && (
                <div className="col gap-24">
                  <div className="row-between align-center">
                    <div>
                      <h2 className="text-lg fw-700 text-1 m-0">Defined Roles & Positions</h2>
                      <span className="text-sm text-4 fw-500">{roles.length} positions defined in this department</span>
                    </div>
                    <button
                      className="btn-primary row gap-8 align-center"
                      onClick={() => {
                        setShowRoleWizard(true);
                        setRoleStep(1);
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "var(--gradient)",
                        border: "none",
                        color: "white",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={16} /> Add Position
                    </button>
                  </div>

                  {roles.length === 0 ? (
                    <Card style={{ borderRadius: 16, border: "1px solid var(--border)", textAlign: "center", padding: "48px 24px" }}>
                      <CardBody className="col gap-12 align-center justify-center">
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)" }}>
                          <Briefcase size={24} />
                        </div>
                        <h3 className="m-0 text-base fw-700 text-1">No roles defined yet</h3>
                        <p className="m-0 text-sm text-4" style={{ maxWidth: 420 }}>
                          Define structured job positions with compensation bands for this department. These can then be published as job openings.
                        </p>
                        <button
                          className="btn-primary row gap-8 align-center mt-8"
                          onClick={() => {
                            setShowRoleWizard(true);
                            setRoleStep(1);
                          }}
                          style={{
                            padding: "10px 20px",
                            borderRadius: 8,
                            background: "var(--gradient)",
                            border: "none",
                            color: "white",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={16} /> Create First Role
                        </button>
                      </CardBody>
                    </Card>
                  ) : (
                    <div className="grid-3 gap-24">
                      {roles.map((role) => (
                        <Card key={role.id} style={{ borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                          <CardBody className="p-24 col gap-16">
                            <div className="row-between align-start">
                              <div className="col gap-4">
                                <h3 className="m-0 text-lg fw-700 text-1">{role.title}</h3>
                                <Badge variant={role.level === "Lead" || role.level === "Executive" ? "primary" : "neutral"}>
                                  {role.level} Level
                                </Badge>
                              </div>
                            </div>

                            <div className="col gap-12 pt-16 mt-8" style={{ borderTop: "1px dashed var(--border)" }}>
                              <div className="row-between align-center text-sm">
                                <span className="text-4 fw-600">Reports To</span>
                                <span className="text-1 fw-700">{role.reportsTo || "Department Head"}</span>
                              </div>
                              <div className="row-between align-center text-sm">
                                <span className="text-4 fw-600">Pay Type</span>
                                <span className="text-1 fw-700">{role.payType}</span>
                              </div>
                              <div className="row-between align-center text-sm">
                                <span className="text-4 fw-600">Salary Band ({role.currency})</span>
                                <div className="row gap-4 align-center text-success fw-700">
                                  <DollarSign size={14} /> {Number(role.minPay).toLocaleString()} - {Number(role.maxPay).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {deptTab === "Hierarchy" && (
                <div className="col gap-24">
                  <div className="p-32 col gap-20" style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)" }}>
                    <div className="row gap-12 align-center">
                      <FolderTree size={20} className="text-primary" />
                      <h3 className="m-0 text-lg fw-700 text-1">Department Structure</h3>
                    </div>

                    <div style={{ padding: "20px", background: "var(--bg-page)", borderRadius: 12, border: "1px solid var(--border)" }}>
                      <div className="row gap-12 align-center">
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: selectedDept.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Network size={18} />
                        </div>
                        <div>
                          <div className="fw-700 text-1">{selectedDept.name}</div>
                          <div className="text-xs text-4">{selectedDept.code || "NO CODE"} · {selectedDept.headcount} active employees</div>
                        </div>
                      </div>

                      {roles.length > 0 && (
                        <div style={{ marginLeft: 48, marginTop: 16, borderLeft: "2px dashed var(--border)", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                          {roles.map((r) => (
                            <div key={r.id} className="row gap-8 align-center text-sm">
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
                              <span className="fw-600 text-2">{r.title}</span>
                              <Badge variant="neutral">{r.level}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CREATE ROLE MODAL */}
        <Modal
          isOpen={showRoleWizard}
          onClose={() => setShowRoleWizard(false)}
          title="Create New Position"
          subtitle={`For ${selectedDept.name} Department`}
          footer={
            <>
              {roleStep > 1 ? (
                <button className="btn-neutral" onClick={() => setRoleStep(roleStep - 1)}>Back</button>
              ) : <div />}

              {roleStep < 3 ? (
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (!newRole.title.trim()) return;
                    setRoleStep(roleStep + 1);
                  }}
                  disabled={!newRole.title.trim()}
                >
                  Continue
                </button>
              ) : (
                <button
                  className="btn-primary row gap-8 align-center"
                  onClick={handleSaveRole}
                  disabled={isSubmittingRole}
                  style={{
                    background: "var(--gradient)",
                    border: "none",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {isSubmittingRole ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Save Position</span>
                </button>
              )}
            </>
          }
        >
          {/* Progress Steps */}
          <div className="row gap-8 mb-24">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: roleStep >= step ? "var(--primary)" : "var(--border)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>

          {roleStep === 1 && (
            <div className="col gap-24">
              <div className="row gap-12 align-center mb-8">
                <Briefcase className="text-primary" size={24} />
                <h4 className="m-0 text-lg fw-700 text-1">Step 1: Role Details</h4>
              </div>

              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Role Title <span className="text-error">*</span></label>
                <Input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={newRole.title}
                  onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                />
              </div>

              <div className="grid-2 gap-16">
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Seniority Level</label>
                  <Select
                    value={newRole.level}
                    onChange={(e) => setNewRole({ ...newRole, level: e.target.value })}
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
                      newRole.reportsTo === "Main (Department Head)" ||
                      newRole.reportsTo === "None" ||
                      roles.some((r) => r.title === newRole.reportsTo)
                        ? newRole.reportsTo
                        : "custom"
                    }
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setNewRole({ ...newRole, reportsTo: "" });
                      } else {
                        setNewRole({ ...newRole, reportsTo: e.target.value });
                      }
                    }}
                  >
                    <option value="Main (Department Head)">Main (Department Head)</option>
                    <option value="None">None (Top-Level Role)</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.title}>
                        Role: {r.title} ({r.level})
                      </option>
                    ))}
                    <option value="custom">Custom Title...</option>
                  </Select>
                  {(!["Main (Department Head)", "None"].includes(newRole.reportsTo) && !roles.some((r) => r.title === newRole.reportsTo)) && (
                    <Input
                      type="text"
                      placeholder="Enter custom reporting title"
                      value={newRole.reportsTo}
                      onChange={(e) => setNewRole({ ...newRole, reportsTo: e.target.value })}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {roleStep === 2 && (
            <div className="col gap-24">
              <div className="row gap-12 align-center mb-8">
                <DollarSign className="text-primary" size={24} />
                <h4 className="m-0 text-lg fw-700 text-1">Step 2: Compensation Band</h4>
              </div>

              <div className="grid-2 gap-16">
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Pay Type</label>
                  <Select
                    value={newRole.payType}
                    onChange={(e) => setNewRole({ ...newRole, payType: e.target.value })}
                  >
                    <option value="Salaried">Salaried (Annual)</option>
                    <option value="Hourly">Hourly</option>
                  </Select>
                </div>
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Currency</label>
                  <CurrencySelect
                    value={newRole.currency}
                    onChange={(curr) => setNewRole({ ...newRole, currency: curr })}
                  />
                </div>
              </div>

              <div className="grid-2 gap-16">
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Min Pay ({newRole.currency})</label>
                  <Input
                    type="number"
                    value={newRole.minPay}
                    onChange={(e) => setNewRole({ ...newRole, minPay: Number(e.target.value) })}
                  />
                </div>
                <div className="col gap-8">
                  <label className="text-sm fw-600 text-2">Max Pay ({newRole.currency})</label>
                  <Input
                    type="number"
                    value={newRole.maxPay}
                    onChange={(e) => setNewRole({ ...newRole, maxPay: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          {roleStep === 3 && (
            <div className="col gap-20">
              <div className="row gap-12 align-center mb-8">
                <Shield className="text-primary" size={24} />
                <h4 className="m-0 text-lg fw-700 text-1">Step 3: Review Position</h4>
              </div>

              <div style={{ background: "var(--bg-page)", borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", gap: 12, border: "1px solid var(--border)" }}>
                <div className="row-between text-sm">
                  <span className="text-4 fw-600">Department</span>
                  <span className="text-1 fw-700">{selectedDept.name}</span>
                </div>
                <div className="row-between text-sm">
                  <span className="text-4 fw-600">Title</span>
                  <span className="text-1 fw-700">{newRole.title}</span>
                </div>
                <div className="row-between text-sm">
                  <span className="text-4 fw-600">Seniority</span>
                  <span className="text-1 fw-700">{newRole.level} Level</span>
                </div>
                <div className="row-between text-sm">
                  <span className="text-4 fw-600">Reports To</span>
                  <span className="text-1 fw-700">{newRole.reportsTo}</span>
                </div>
                <div className="row-between text-sm">
                  <span className="text-4 fw-600">Compensation Band</span>
                  <span className="text-success fw-700">
                    {newRole.currency} {Number(newRole.minPay).toLocaleString()} - {Number(newRole.maxPay).toLocaleString()} ({newRole.payType})
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // DIRECTORY VIEW
  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <PageHeader
        title="Departments"
        subtitle="Manage company structure, roles, and compensation bands."
        icon={<Network size={28} className="text-white" />}
        tabs={["Directory", "Org Chart"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <a
            href="/departments/new"
            className="btn-secondary row gap-8 align-center"
            style={{
              background: "white",
              color: "var(--primary)",
              border: "none",
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 20,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Plus size={16} /> New Department
          </a>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-page)" }}>
        {isLoading ? (
          <DepartmentsSkeleton />
        ) : (
          <div style={{ padding: "32px 40px" }}>
            {activeTab === "Directory" && (
              <div className="col gap-32">
                <StatRibbon
                  stats={[
                    {
                      label: "Total Departments",
                      value: departments.length,
                      icon: <Building size={18} />,
                      color: "var(--primary)",
                      description: "Active departments",
                    },
                    {
                      label: "Total Headcount",
                      value: totalHeadcount,
                      icon: <Users size={18} />,
                      color: "var(--success)",
                      description: "Active employees",
                    },
                    {
                      label: "Active Roles",
                      value: totalActiveRoles,
                      icon: <Shield size={18} />,
                      color: "var(--text-1)",
                      description: "Defined positions",
                    },
                    {
                      label: "Open Roles",
                      value: totalOpenRoles,
                      icon: <Briefcase size={18} />,
                      color: "var(--warning)",
                      description: "Open job postings",
                    },
                  ]}
                />

                <div className="row-between align-center">
                  <div className="col gap-4">
                    <h2 className="text-xl fw-800 text-1 m-0">Department Directory</h2>
                    <span className="text-sm text-4 fw-500">{filteredDepts.length} departments</span>
                  </div>
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
                      width: 280,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Search size={15} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search departments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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

                {filteredDepts.length === 0 ? (
                  <Card style={{ borderRadius: 16, border: "1px solid var(--border)", textAlign: "center", padding: "48px 24px" }}>
                    <CardBody className="col gap-12 align-center justify-center">
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)" }}>
                        <Network size={24} />
                      </div>
                      <h3 className="m-0 text-base fw-700 text-1">
                        {searchQuery ? "No matching departments found" : "No departments found"}
                      </h3>
                      <p className="m-0 text-sm text-4" style={{ maxWidth: 360 }}>
                        {searchQuery ? "Try refining your search keyword." : "Get started by creating your first department."}
                      </p>
                    </CardBody>
                  </Card>
                ) : (
                  <div className="grid-3 gap-24">
                    {filteredDepts.map((dept) => (
                      <Card
                        key={dept.id}
                        onClick={() => setSelectedDept(dept)}
                        style={{
                          borderRadius: 16,
                          border: "1px solid var(--border)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                        }}
                        className="hover-lift"
                      >
                        <CardBody className="p-24 col gap-20">
                          <div className="row-between align-start">
                            <div className="row gap-12 align-center">
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 12,
                                  background: `${dept.color || "#1A73E8"}15`,
                                  color: dept.color || "#1A73E8",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Network size={24} />
                              </div>
                              <div>
                                <h3 className="m-0 text-lg fw-700 text-1">{dept.name}</h3>
                                <span className="text-xs text-5 fw-600">
                                  Head: {dept.headName || "Unassigned"}
                                </span>
                              </div>
                            </div>
                            <button
                              className="btn-neutral"
                              onClick={(e) => e.stopPropagation()}
                              style={{ padding: 4, borderRadius: 6 }}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </div>

                          <div className="grid-3 gap-12 pt-16" style={{ borderTop: "1px dashed var(--border)" }}>
                            <div className="col gap-4">
                              <span className="text-xs text-4 fw-600 uppercase">Headcount</span>
                              <span className="text-lg fw-800 text-1">{dept.headcount || 0}</span>
                            </div>
                            <div className="col gap-4">
                              <span className="text-xs text-4 fw-600 uppercase">Roles</span>
                              <span className="text-lg fw-800 text-1">{dept.activeRoles || 0}</span>
                            </div>
                            <div className="col gap-4">
                              <span className="text-xs text-4 fw-600 uppercase">Openings</span>
                              <span className="text-lg fw-800 text-warning">{dept.openRoles || 0}</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Org Chart" && (
              <div className="col gap-24 align-center justify-center" style={{ minHeight: 400 }}>
                <div className="p-32 text-center col gap-16" style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", maxWidth: 460 }}>
                  <div className="icon-chip" style={{ background: "var(--primary-tint)", color: "var(--primary)", width: 64, height: 64, margin: "0 auto" }}>
                    <Network size={32} />
                  </div>
                  <h3 className="m-0 text-xl fw-700 text-1">Department Structure</h3>
                  <p className="m-0 text-sm text-4">
                    Explore active departments and their hierarchy by selecting a department from the Directory.
                  </p>
                  <button
                    className="btn-primary mt-8"
                    onClick={() => setActiveTab("Directory")}
                    style={{ background: "var(--gradient)", border: "none", padding: "12px 24px", borderRadius: 8, color: "white", fontWeight: 600, cursor: "pointer" }}
                  >
                    View Directory
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
