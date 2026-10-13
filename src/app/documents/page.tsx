"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Download,
  FileText,
  FolderOpen,
  Plus,
  Search,
  ExternalLink,
  Loader2,
  CalendarDays,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DataRow, SectionHeading, StatusPill } from "@/components/ui/ModulePrimitives";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface OrgDocument {
  id: string;
  employeeId?: string;
  employeeName?: string;
  filename: string;
  category: string;
  status: string;
  expiresOn?: string;
  createdAt: string;
}

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  avatar?: string;
}

export default function DocumentsPage() {
  const { getToken } = useAuth();
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [selectedDoc, setSelectedDoc] = useState<OrgDocument | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Document Form
  const [form, setForm] = useState({
    filename: "",
    employeeId: "",
    category: "contract",
    expiresOn: "",
  });

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [docsRes, empsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/documents?limit=100`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
      ]);

      if (docsRes.ok) {
        const dJson = await docsRes.json();
        setDocuments(Array.isArray(dJson) ? dJson : dJson.data || []);
      }
      if (empsRes.ok) {
        const eJson = await empsRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load documents", err);
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

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.filename.trim() || !form.employeeId) {
      toast.error("Required fields", "Please specify a document filename and select an employee.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload-intents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: form.filename.trim(),
          employeeId: form.employeeId,
          category: form.category,
          contentType: "application/pdf",
          sizeBytes: 1048576, // 1MB default descriptor
          expiresOn: form.expiresOn || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Document recorded", "Document indexed in employee record successfully.");
        setIsAddModalOpen(false);
        setForm({ filename: "", employeeId: "", category: "contract", expiresOn: "" });
        loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error("Creation failed", errJson.detail || errJson.title || "Failed to add document.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to connect.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}/download-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.downloadUrl) {
          window.open(json.downloadUrl, "_blank");
        } else {
          toast.info("Document ready", "Document is active in cloud storage.");
        }
      } else {
        toast.error("Download unavailable", "Could not retrieve document download URL.");
      }
    } catch {
      toast.error("Error", "Download request failed.");
    }
  };

  const filteredDocs = useMemo(() => {
    if (!query.trim()) return documents;
    const q = query.toLowerCase();
    return documents.filter(
      (d) =>
        d.filename.toLowerCase().includes(q) ||
        (d.employeeName || "").toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [documents, query]);

  const contractsCount = documents.filter((d) => d.category.toLowerCase().includes("contract")).length;
  const identityCount = documents.filter((d) => d.category.toLowerCase().includes("identity")).length;

  return (
    <>
      <PageHeader
        title="Employee Documents"
        subtitle="Secure records, contracts, identity verifications, and compliance files."
        icon={<FolderOpen size={28} />}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
            style={{ background: "white", color: "var(--primary)" }}
          >
            <Plus size={16} /> Add Document
          </button>
        }
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Total documents",
              value: documents.length,
              icon: <FileText size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Contracts on file",
              value: contractsCount,
              icon: <FolderOpen size={20} />,
              color: "var(--success)",
            },
            {
              label: "Identity & IDs",
              value: identityCount,
              icon: <AlertTriangle size={20} />,
              color: "var(--warning)",
            },
            {
              label: "Team coverage",
              value: employees.length,
              description: "Employees indexed",
              icon: <User size={20} />,
              color: "var(--text-4)",
            },
          ]}
        />

        <Card style={{ marginTop: 20 }}>
          <CardBody>
            <SectionHeading
              title="Document Repository"
              description="Browse, verify, and inspect documents recorded across your team"
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
                    placeholder="Search documents or people..."
                    style={{ border: 0, outline: 0, width: "100%", fontFamily: "inherit", fontSize: 13 }}
                  />
                </div>
              }
            />

            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <FolderOpen size={40} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                <h3 className="text-base fw-700 text-1">No documents recorded yet</h3>
                <p className="text-xs text-4 mt-4">Upload contracts, signed handbooks, or IDs to keep an audit-ready archive.</p>
              </div>
            ) : (
              <div className="col gap-10">
                {filteredDocs.map((doc) => (
                  <DataRow
                    key={doc.id}
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
                        <FileText size={18} />
                      </div>
                    }
                    title={doc.filename}
                    subtitle={`${doc.employeeName || "Team Member"} · ${doc.category.toUpperCase()} · Added ${doc.createdAt.split("T")[0]}`}
                    meta={
                      <div className="row gap-8 align-center">
                        <StatusPill tone={doc.status === "ready" || doc.status === "completed" ? "success" : "neutral"}>
                          {doc.status}
                        </StatusPill>
                        <button
                          className="btn-neutral"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc.id);
                          }}
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    }
                    onClick={() => setSelectedDoc(doc)}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </main>

      {/* Add Document Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Employee Document"
        subtitle="Record and index a compliance or contractual file"
        width={560}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateDocument}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : "Save Document"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateDocument} className="col gap-14">
          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Document Title / Filename *
            </label>
            <Input
              value={form.filename}
              onChange={(e) => setForm({ ...form, filename: e.target.value })}
              placeholder="e.g. Employment_Agreement_2026.pdf"
              required
            />
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Employee *
            </label>
            <SearchableSelect
              value={form.employeeId}
              onChange={(val) => setForm({ ...form, employeeId: val })}
              options={employeeOptions}
              placeholder="Select employee..."
              searchPlaceholder="Search by employee name..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Category
              </label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="contract">Employment Contract</option>
                <option value="identity">National ID / Passport</option>
                <option value="compliance">Compliance & Handbook</option>
                <option value="certification">Professional Certificate</option>
                <option value="other">Other Document</option>
              </Select>
            </div>

            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Expiration Date (optional)
              </label>
              <Input
                type="date"
                value={form.expiresOn}
                onChange={(e) => setForm({ ...form, expiresOn: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Document Details Modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.filename || "Document Details"}
        subtitle={selectedDoc ? `${selectedDoc.employeeName || "Team Member"} · ${selectedDoc.category}` : ""}
        width={540}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setSelectedDoc(null)}>
              Close
            </button>
            {selectedDoc && (
              <button
                className="btn-primary"
                onClick={() => handleDownload(selectedDoc.id)}
              >
                <Download size={15} /> Download Document
              </button>
            )}
          </>
        }
      >
        {selectedDoc && (
          <div className="col gap-14">
            <Detail label="EMPLOYEE" value={selectedDoc.employeeName || "Team Member"} />
            <Detail label="CATEGORY" value={selectedDoc.category.toUpperCase()} />
            <Detail label="STATUS" value={selectedDoc.status} />
            <Detail label="EXPIRY DATE" value={selectedDoc.expiresOn || "No expiration date"} />
            <Detail label="DATE ADDED" value={selectedDoc.createdAt.split("T")[0]} />
            {selectedDoc.employeeId && (
              <Link
                href={`/people/${selectedDoc.employeeId}`}
                className="btn-neutral"
                style={{ textDecoration: "none", justifyContent: "center", marginTop: 8 }}
              >
                <ExternalLink size={14} /> View Employee Profile
              </Link>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
      <div className="text-xs fw-700 text-5 mb-2">{label}</div>
      <div className="text-sm fw-700 text-1">{value}</div>
    </div>
  );
}
