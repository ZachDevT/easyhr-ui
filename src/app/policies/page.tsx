"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Book,
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  CheckSquare,
  UploadCloud,
  Users,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";

interface PolicyItem {
  id: string;
  documentId?: string | null;
  title: string;
  category: string;
  requiresSignature: boolean;
  status: string;
  createdAt?: string;
}

const CATEGORIES = ["General", "Operations", "Security", "Compliance", "Time Off", "Compensation"];

export default function PoliciesPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("Policy Library");
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Policy Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newRequiresSig, setNewRequiresSig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);
      const res = await fetch(`${API_BASE_URL}/api/v1/policies`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPolicies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load policies", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleCreatePolicy = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/policies`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          requiresSignature: newRequiresSig,
        }),
      });

      if (res.ok) {
        toast.success("Policy published", `"${newTitle}" added to the policy repository.`);
        setIsModalOpen(false);
        setNewTitle("");
        setNewCategory("General");
        setNewRequiresSig(false);
        fetchPolicies();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Failed to create policy", err.detail || "Server error.");
      }
    } catch (err) {
      toast.error("Error", "Could not create policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const sigRequiredCount = policies.filter((p) => p.requiresSignature).length;
  const activeCount = policies.filter((p) => p.status === "active").length;

  return (
    <div
      className="page-container"
      style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}
    >
      <PageHeader
        title="Company Policies"
        subtitle="Distribute handbooks, track compliance, and manage company rules."
        icon={<Book size={28} className="text-white" />}
        tabs={["Policy Library", "Acknowledgments", "Categories"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            className="btn-secondary"
            onClick={() => setIsModalOpen(true)}
            style={{
              background: "white",
              color: "var(--primary)",
              border: "none",
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 20,
              cursor: "pointer",
            }}
          >
            <UploadCloud size={16} style={{ marginRight: 8 }} /> Add Policy
          </button>
        }
      />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
          background: "var(--bg-page)",
        }}
      >
        {activeTab === "Policy Library" && (
          <div className="col gap-32">
            <StatRibbon
              stats={[
                {
                  label: "Total Policies",
                  value: policies.length,
                  icon: <Book size={18} />,
                  color: "var(--primary)",
                  description: "In company repository",
                },
                {
                  label: "Requires Signature",
                  value: sigRequiredCount,
                  icon: <CheckSquare size={18} />,
                  color: "var(--warning)",
                  description: "Mandatory acknowledgment",
                },
                {
                  label: "Active Policies",
                  value: activeCount,
                  icon: <ShieldAlert size={18} />,
                  color: "var(--success)",
                  description: "Enforced across workforce",
                },
              ]}
            />

            <div className="row-between align-center">
              <h2 className="text-xl fw-800 text-1 m-0">Document Repository</h2>
              <div
                className="search-bar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  padding: "8px 16px",
                  width: 320,
                }}
              >
                <Search size={16} className="text-4" style={{ marginRight: 8 }} />
                <input
                  type="text"
                  placeholder="Search policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 14,
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
                <Loader2 size={32} className="spin text-primary" />
              </div>
            ) : filteredPolicies.length === 0 ? (
              <Card style={{ borderRadius: 16 }}>
                <CardBody className="p-48 col align-center justify-center text-center gap-16">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "var(--primary-tint)",
                      color: "var(--primary)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Book size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg fw-700 text-1 mb-4">No policies in repository</h3>
                    <p className="text-sm text-4 m-0">
                      Upload your employee handbook, code of conduct, or IT security rules.
                    </p>
                  </div>
                  <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} /> Add First Policy
                  </button>
                </CardBody>
              </Card>
            ) : (
              <div className="grid-2 gap-24">
                {filteredPolicies.map((policy) => (
                  <Card
                    key={policy.id}
                    style={{
                      borderRadius: 16,
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                    }}
                    className="hover-lift"
                  >
                    <CardBody className="p-24 col gap-16">
                      <div className="row-between align-start">
                        <div className="row gap-16 align-center">
                          <div
                            className="icon-chip"
                            style={{
                              background: "var(--primary-tint)",
                              color: "var(--primary)",
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <FileText size={24} />
                          </div>
                          <div>
                            <h3 className="m-0 text-lg fw-700 text-1">{policy.title}</h3>
                            <span className="text-sm text-5 fw-600">
                              Published {policy.createdAt || "Recently"}
                            </span>
                          </div>
                        </div>
                        <Badge variant={policy.status === "active" ? "success" : "neutral"}>
                          {policy.status}
                        </Badge>
                      </div>

                      <div
                        className="row-between align-center pt-16 mt-8"
                        style={{ borderTop: "1px dashed var(--border)" }}
                      >
                        <Badge variant="neutral">{policy.category}</Badge>
                        {policy.requiresSignature ? (
                          <div className="row gap-8 align-center text-sm">
                            <CheckSquare size={16} className="text-warning" />
                            <span className="fw-600 text-warning">Signature required</span>
                          </div>
                        ) : (
                          <span className="text-sm text-5">Informational only</span>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Acknowledgments" && (
          <div className="col gap-24 align-center justify-center" style={{ minHeight: 400 }}>
            <div
              className="p-32 text-center col gap-16"
              style={{
                background: "white",
                borderRadius: 16,
                border: "1px solid var(--border)",
                maxWidth: 480,
              }}
            >
              <div
                className="icon-chip"
                style={{
                  background: "var(--primary-tint)",
                  color: "var(--primary)",
                  width: 64,
                  height: 64,
                  margin: "0 auto",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CheckSquare size={32} />
              </div>
              <h3 className="m-0 text-xl fw-700 text-1">Signature Tracking</h3>
              <p className="m-0 text-sm text-4">
                {sigRequiredCount === 0
                  ? "No policies currently require mandatory digital signature."
                  : `${sigRequiredCount} active ${sigRequiredCount === 1 ? "policy requires" : "policies require"} employee acknowledgment upon onboarding.`}
              </p>
              {sigRequiredCount > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                  {policies
                    .filter((p) => p.requiresSignature)
                    .map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "var(--bg-page)",
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                        }}
                      >
                        <span className="fw-600 text-1">{p.title}</span>
                        <Badge variant="warning">Pending</Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Categories" && (
          <div className="col gap-24">
            <h3 className="text-lg fw-700 text-1 mb-8">Policy Categories</h3>
            <div className="grid-3 gap-16">
              {CATEGORIES.map((cat) => {
                const count = policies.filter((p) => p.category === cat).length;
                return (
                  <Card key={cat}>
                    <CardBody className="p-20 row-between align-center">
                      <div>
                        <div className="fw-700 text-1 text-base">{cat}</div>
                        <div className="text-xs text-4 mt-2">
                          {count} {count === 1 ? "policy" : "policies"}
                        </div>
                      </div>
                      <Badge variant={count > 0 ? "primary" : "neutral"}>{count}</Badge>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Policy Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Company Policy"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Policy Title
            </label>
            <Input
              placeholder="e.g. Employee Handbook 2026, Remote Work Policy"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Category
            </label>
            <Select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px",
              borderRadius: 8,
              background: "var(--bg-page)",
              cursor: "pointer",
            }}
            onClick={() => setNewRequiresSig(!newRequiresSig)}
          >
            <input
              type="checkbox"
              checked={newRequiresSig}
              onChange={(e) => setNewRequiresSig(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                Require employee digital signature
              </div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>
                Requires new and existing employees to sign during onboarding and compliance reviews
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 12,
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
            }}
          >
            <button
              className="btn-neutral"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreatePolicy}
              disabled={!newTitle.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 size={14} className="spin mr-4" />}
              Publish Policy
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
