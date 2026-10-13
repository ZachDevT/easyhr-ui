"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Zap,
  Plus,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Folder,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RichTextEditor, RichTextRenderer } from "@/components/ui/RichTextEditor";
import { toast } from "@/components/ui/Toast";

interface Macro {
  id: string;
  organizationId: string;
  title: string;
  shortcut: string;
  category: string;
  subject: string;
  bodyHtml: string;
  createdAt: string;
}

export default function EmailMacrosPage() {
  const { getToken, isSignedIn } = useAuth();

  const [macros, setMacros] = useState<Macro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formState, setFormState] = useState({
    title: "",
    shortcut: "",
    category: "hiring",
    subject: "",
    bodyHtml: "",
  });

  // Confirm delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: "",
    title: "",
  });

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
    if (type === "success") {
      toast.success("Success", text);
    } else {
      toast.error("Notice", text);
    }
  };

  const loadMacros = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/messaging/macros`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setMacros(json.data || []);
      }
    } catch (err: any) {
      showNotice("error", "Failed to load macros: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    loadMacros();
  }, [loadMacros]);

  const handleOpenCreate = () => {
    setEditingMacro(null);
    setFormState({
      title: "",
      shortcut: "",
      category: "hiring",
      subject: "",
      bodyHtml: "<p>Dear {{candidate_name}},</p><p></p><p>Best regards,<br/><strong>{{company}} Team</strong></p>",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (macro: Macro) => {
    setEditingMacro(macro);
    setFormState({
      title: macro.title,
      shortcut: macro.shortcut,
      category: macro.category,
      subject: macro.subject,
      bodyHtml: macro.bodyHtml,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.shortcut || !formState.subject) {
      showNotice("error", "Title, shortcut, and subject are required.");
      return;
    }

    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) return;

      const cleanShortcut = formState.shortcut.replace(/^\//, "").trim().toLowerCase();

      let res: Response;
      if (editingMacro) {
        res = await fetch(`${API_BASE_URL}/api/v1/messaging/macros/${editingMacro.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formState.title,
            shortcut: cleanShortcut,
            category: formState.category,
            subject: formState.subject,
            bodyHtml: formState.bodyHtml,
          }),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/v1/messaging/macros`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formState.title,
            shortcut: cleanShortcut,
            category: formState.category,
            subject: formState.subject,
            bodyHtml: formState.bodyHtml,
          }),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save macro");
      }

      showNotice("success", `Macro "/${cleanShortcut}" saved successfully!`);
      setIsModalOpen(false);
      await loadMacros();
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/messaging/macros/${deleteConfirm.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to delete macro");
      }
      showNotice("success", "Macro deleted successfully.");
      setDeleteConfirm({ open: false, id: "", title: "" });
      await loadMacros();
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const filteredMacros = macros.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--page-bg, #F7F7F5)" }}>
      <PageHeader
        title="Email Macros & Canned Responses"
        subtitle="Manage quick shortcut templates (e.g. /interview, /rejection) with dynamic candidate variables."
        icon={<Zap size={26} style={{ color: "var(--primary)" }} />}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => loadMacros()} className="btn-neutral" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={handleOpenCreate} className="btn-primary" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Plus size={15} /> New Macro
            </button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
        {notice && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 13.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: notice.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: notice.type === "success" ? "#065F46" : "#991B1B",
              border: `1px solid ${notice.type === "success" ? "#A7F3D0" : "#FECACA"}`,
            }}
          >
            {notice.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Search bar & info banner */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid var(--card-border)",
              width: 340,
            }}
          >
            <Search size={15} style={{ color: "var(--text-4)" }} />
            <input
              type="text"
              placeholder="Search by title, shortcut, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: 13, width: "100%" }}
            />
          </div>

          <div style={{ fontSize: 12, color: "var(--text-4)" }}>
            Tip: Type <code style={{ background: "var(--primary-tint)", color: "var(--primary)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>/</code> in the candidate email composer to invoke these templates.
          </div>
        </div>

        {/* Macros Grid */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-box" style={{ height: 220, borderRadius: 16 }} />
            ))}
          </div>
        ) : filteredMacros.length === 0 ? (
          <Card>
            <CardBody style={{ padding: 48, textAlign: "center", color: "var(--text-4)" }}>
              <Zap size={36} style={{ margin: "0 auto 12px auto", opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No macros found. Click &quot;New Macro&quot; to build your first template.</p>
            </CardBody>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {filteredMacros.map((macro) => (
              <Card key={macro.id}>
                <CardBody style={{ padding: 22, display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "var(--primary)",
                          background: "var(--primary-tint)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          letterSpacing: "0.04em",
                        }}
                      >
                        /{macro.shortcut}
                      </span>
                      <h4 style={{ margin: "8px 0 2px 0", fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                        {macro.title}
                      </h4>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleOpenEdit(macro)}
                        className="btn-neutral"
                        style={{ padding: "6px 8px", borderRadius: 8 }}
                        title="Edit macro"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, id: macro.id, title: macro.title })}
                        className="btn-neutral"
                        style={{ padding: "6px 8px", borderRadius: 8, color: "#EF4444" }}
                        title="Delete macro"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 8 }}>
                    <strong>Subject:</strong> {macro.subject}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      maxHeight: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: 12,
                      color: "var(--text-4)",
                      background: "var(--page-bg, #FAFAFA)",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--card-border)",
                      marginBottom: 12,
                    }}
                  >
                    <RichTextRenderer html={macro.bodyHtml} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--text-4)" }}>
                    <span style={{ textTransform: "capitalize" }}>Category: {macro.category}</span>
                    <span>Ready in composer</span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ─── MODAL: Create / Edit Macro ──────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMacro ? `Edit Macro /${editingMacro.shortcut}` : "Create New Email Macro"}
        subtitle="Configure canned responses with dynamic candidate tags"
        width={720}
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Macro Title *</label>
              <input
                type="text"
                placeholder="e.g. Formal Interview Invitation"
                value={formState.title}
                onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                className="input"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Shortcut Trigger *</label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    background: "var(--card-border)",
                    padding: "9px 12px",
                    borderRadius: "8px 0 0 8px",
                    fontWeight: 800,
                    fontSize: 13,
                    color: "var(--text-3)",
                  }}
                >
                  /
                </span>
                <input
                  type="text"
                  placeholder="interview"
                  value={formState.shortcut}
                  onChange={(e) => setFormState({ ...formState, shortcut: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })}
                  className="input"
                  style={{ borderRadius: "0 8px 8px 0" }}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Category</label>
              <select
                value={formState.category}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                className="select"
              >
                <option value="hiring">Hiring / Recruiting</option>
                <option value="onboarding">Onboarding</option>
                <option value="general">General Team</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">Default Email Subject *</label>
              <input
                type="text"
                placeholder="e.g. Interview Invitation: {{role}} at {{company}}"
                value={formState.subject}
                onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          {/* Placeholders helper pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11, color: "var(--text-4)" }}>
            <span style={{ fontWeight: 700 }}>Variables:</span>
            {["{{candidate_name}}", "{{role}}", "{{company}}"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFormState({ ...formState, bodyHtml: formState.bodyHtml + " " + tag })}
                style={{
                  background: "var(--page-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                  color: "var(--primary)",
                  fontWeight: 600,
                }}
              >
                + {tag}
              </button>
            ))}
          </div>

          {/* WYSIWYG editor for email body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Email Body Template (WYSIWYG) *</label>
            <RichTextEditor
              value={formState.bodyHtml}
              onChange={(val) => setFormState({ ...formState, bodyHtml: val })}
              placeholder="Write the macro template body..."
              minHeight="220px"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: "1px solid var(--card-border)" }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-neutral">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary" style={{ minWidth: 110 }}>
              {isSaving ? "Saving…" : "Save Macro"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── CONFIRM DELETE DIALOG ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: "", title: "" })}
        onConfirm={handleDelete}
        title={`Delete macro "${deleteConfirm.title}"?`}
        message="This macro will no longer be available in the composer shortcut list."
        variant="danger"
        confirmLabel="Delete Macro"
      />
    </div>
  );
}
