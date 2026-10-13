"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Send,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Search,
  Eye,
  Bookmark,
  ChevronDown,
} from "lucide-react";
import { RichTextEditor, RichTextRenderer, SlashCommandMacro } from "@/components/ui/RichTextEditor";
import { Modal } from "@/components/ui/Modal";
import { useCompany } from "@/context/CompanyContext";
import { toast } from "@/components/ui/Toast";

export interface MacroItem {
  id: string;
  title: string;
  shortcut: string;
  category: string;
  subject: string;
  bodyHtml: string;
}

interface EmailComposerProps {
  applicantId: string;
  candidateEmail: string;
  candidateName: string;
  candidateRole?: string;
  threadId?: string; // If present, this is a reply to an existing thread
  initialSubject?: string;
  onSent?: (result: any) => void;
  onCancel?: () => void;
}

export function EmailComposer({
  applicantId,
  candidateEmail,
  candidateName,
  candidateRole = "Candidate",
  threadId,
  initialSubject = "",
  onSent,
  onCancel,
}: EmailComposerProps) {
  const { getToken } = useAuth();
  const { company } = useCompany();

  const [subject, setSubject] = useState(
    initialSubject || (threadId ? `Re: Application for ${candidateRole}` : `Regarding your application for ${candidateRole} - ${company?.name || "ProjectEasyHR"}`)
  );
  const [bodyHtml, setBodyHtml] = useState("<p>Hi " + candidateName + ",</p><p></p>");
  const [macros, setMacros] = useState<MacroItem[]>([]);
  const [isLoadingMacros, setIsLoadingMacros] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Macro picker dropdown state
  const [showMacros, setShowMacros] = useState(false);
  const [showMacroPicker, setShowMacroPicker] = useState(false);
  const [macroSearch, setMacroSearch] = useState("");
  const [previewMacro, setPreviewMacro] = useState<SlashCommandMacro | MacroItem | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fetch macros on mount
  useEffect(() => {
    async function fetchMacros() {
      try {
        setIsLoadingMacros(true);
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/messaging/macros`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setMacros(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load macros", err);
      } finally {
        setIsLoadingMacros(false);
      }
    }
    fetchMacros();
  }, [getToken]);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMacroPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Replace placeholders in macro content
  const applyMacroPlaceholders = (text: string) => {
    if (!text) return "";
    const compName = company?.name || "ProjectEasyHR";
    return text
      .replace(/\{\{\s*candidate_?name\s*\}\}/gi, candidateName)
      .replace(/\{\{\s*name\s*\}\}/gi, candidateName)
      .replace(/\{\{\s*(?:job_?)?role\s*\}\}/gi, candidateRole)
      .replace(/\{\{\s*job_?title\s*\}\}/gi, candidateRole)
      .replace(/\{\{\s*position\s*\}\}/gi, candidateRole)
      .replace(/\{\{\s*company(?:_name)?\s*\}\}/gi, compName);
  };

  const handleApplyMacro = (macro: SlashCommandMacro | MacroItem) => {
    const newSubject = applyMacroPlaceholders(macro.subject || "");
    const newBody = applyMacroPlaceholders(macro.bodyHtml);

    if (!threadId) {
      setSubject(newSubject);
    }
    setBodyHtml(newBody);
    setShowMacroPicker(false);
    setMacroSearch("");
    setPreviewMacro(null);

    setStatusMessage({
      type: "success",
      text: `Applied macro "${macro.title}" — subject and body prepopulated.`,
    });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateEmail) {
      setStatusMessage({ type: "error", text: "Candidate email is missing." });
      return;
    }
    if (!subject.trim()) {
      setStatusMessage({ type: "error", text: "Subject line is required." });
      return;
    }
    if (!bodyHtml.trim() || bodyHtml === "<p></p>") {
      setStatusMessage({ type: "error", text: "Email body cannot be empty." });
      return;
    }

    try {
      setIsSending(true);
      setStatusMessage(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const senderName = company?.name ? `${company.name} Talent Team` : "Hiring Team";
      const senderEmail = "notifications@recruter.easyhr.pro";

      let res: Response;
      if (threadId) {
        // Reply to existing thread
        res = await fetch(`${API_BASE_URL}/api/v1/messaging/threads/${threadId}/reply`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bodyHtml,
            senderName,
            senderEmail,
          }),
        });
      } else {
        // Create new thread
        res = await fetch(`${API_BASE_URL}/api/v1/messaging/threads`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicantId,
            subject,
            bodyHtml,
            candidateEmail,
            candidateName,
            senderName,
            senderEmail,
          }),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.title || "Failed to deliver email");
      }

      const result = await res.json();
      toast.success("Email sent", "Delivered to " + candidateEmail);
      setStatusMessage({ type: "success", text: "Email sent successfully to " + candidateEmail + "!" });
      setTimeout(() => {
        if (onSent) onSent(result);
      }, 1200);
    } catch (err: any) {
      toast.error("Email failed", err.message || "Failed to deliver email.");
      setStatusMessage({ type: "error", text: err.message || "Failed to send email." });
    } finally {
      setIsSending(false);
    }
  };

  const filteredMacros = macros.filter(
    (m) =>
      m.title.toLowerCase().includes(macroSearch.toLowerCase()) ||
      m.shortcut.toLowerCase().includes(macroSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Alert Notice */}
      {statusMessage && (
        <div
          style={{
            margin: "0 0 16px 0",
            padding: "12px 18px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: statusMessage.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: statusMessage.type === "success" ? "#065F46" : "#991B1B",
            border: `1px solid ${statusMessage.type === "success" ? "#A7F3D0" : "#FECACA"}`,
          }}
        >
          {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Recipient & Subject Header */}
      <div style={{ borderBottom: "1px solid var(--card-border)", paddingBottom: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-4)", width: 68 }}>To:</span>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--page-bg, #F3F4F6)",
              padding: "4px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            <span>{candidateName}</span>
            <span style={{ color: "var(--text-4)", fontWeight: 400 }}>&lt;{candidateEmail}&gt;</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-4)", width: 68 }}>Subject:</span>
          <input
            type="text"
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line..."
            style={{ flex: 1, fontWeight: 600, fontSize: 14 }}
            required
          />
        </div>
      </div>

      {/* Quick Macro Toggle & Bar */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setShowMacros(!showMacros)}
          style={{
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: "1px solid var(--card-border, #E2E8F0)",
            background: showMacros ? "var(--primary-tint, #F3E8FF)" : "var(--page-bg, #F9FAFB)",
            color: showMacros ? "var(--primary)" : "var(--text-3, #64748B)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
            marginBottom: showMacros ? 10 : 0,
          }}
        >
          <Sparkles size={13} style={{ color: "var(--primary)" }} />
          <span>Templates & Macros ({macros.length})</span>
          <ChevronDown
            size={13}
            style={{
              transform: showMacros ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          />
        </button>

        {showMacros && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "var(--page-bg, #F9FAFB)",
              borderRadius: 12,
              border: "1px solid var(--card-border, #EAEAE4)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-3, #6B7280)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={13} style={{ color: "var(--primary)" }} /> Macros:
            </span>

        {/* Macro quick pills */}
        {macros.slice(0, 4).map((m) => (
          <div
            key={m.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 8,
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E2E8F0)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              overflow: "hidden",
              transition: "all 0.15s ease",
            }}
          >
            <button
              type="button"
              onClick={() => handleApplyMacro(m)}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 600,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--text-1)",
              }}
              title={`Apply /${m.shortcut}: ${m.title}`}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 10.5,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "var(--primary-tint, #F3E8FF)",
                  color: "var(--primary)",
                  fontFamily: "monospace",
                }}
              >
                /{m.shortcut}
              </span>
              <span>{m.title}</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMacro(m)}
              title="Preview macro"
              style={{
                padding: "5px 8px",
                fontSize: 11,
                background: "transparent",
                border: "none",
                borderLeft: "1px solid var(--card-border, #E2E8F0)",
                cursor: "pointer",
                color: "var(--text-4, #94A3B8)",
                display: "inline-flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4, #94A3B8)")}
            >
              <Eye size={12} />
            </button>
          </div>
        ))}

        {/* Open Macro Picker Button */}
        <div style={{ position: "relative" }} ref={pickerRef}>
          <button
            type="button"
            onClick={() => setShowMacroPicker(!showMacroPicker)}
            className="btn-neutral"
            style={{
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Browse all ({macros.length})
          </button>

          {/* Floating Macro Picker Dropdown */}
          {showMacroPicker && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                width: 360,
                maxWidth: "90vw",
                background: "#fff",
                border: "1px solid var(--card-border)",
                borderRadius: 12,
                boxShadow: "0 16px 36px rgba(0,0,0,0.14)",
                zIndex: 200,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  background: "var(--page-bg, #F9FAFB)",
                  borderRadius: 8,
                  border: "1px solid var(--card-border)",
                }}
              >
                <Search size={14} style={{ color: "var(--text-4)" }} />
                <input
                  type="text"
                  placeholder="Type to filter macros..."
                  value={macroSearch}
                  onChange={(e) => setMacroSearch(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 12.5,
                    width: "100%",
                  }}
                  autoFocus
                />
              </div>

              <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {filteredMacros.length === 0 ? (
                  <div style={{ padding: "16px 10px", textAlign: "center", fontSize: 12, color: "var(--text-4)" }}>
                    No matching macros found
                  </div>
                ) : (
                  filteredMacros.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleApplyMacro(m)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-tint)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "var(--primary)",
                              background: "var(--primary-tint)",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}
                          >
                            /{m.shortcut}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--text-1)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.title}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-4)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: 2,
                          }}
                        >
                          {m.subject}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          title="Preview macro"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewMacro(m);
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 6,
                            border: "1px solid var(--card-border)",
                            background: "white",
                            color: "var(--text-2)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          title="Apply macro"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyMacro(m);
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 6,
                            border: "none",
                            background: "var(--primary)",
                            color: "white",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>

      {/* WYSIWYG Editor */}
      <div style={{ flex: 1, minHeight: 380, display: "flex", flexDirection: "column" }}>
        <RichTextEditor
          value={bodyHtml}
          onChange={(val) => setBodyHtml(val)}
          placeholder="Compose your email here... Type / to quickly insert or preview macro templates"
          minHeight={360}
          resizable={true}
          macros={macros}
          onSelectMacro={handleApplyMacro}
          onViewMacro={(m) => setPreviewMacro(m as MacroItem)}
        />
      </div>

      {/* Action Footer (Sticky, Non-Scrollable Away) */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "#FFFFFF",
          zIndex: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 16,
          paddingBottom: 8,
          marginTop: 16,
          borderTop: "1.5px solid var(--card-border)",
          boxShadow: "0 -4px 14px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-4)" }}>
          Replies from the candidate will appear directly in this candidate&apos;s conversation thread.
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-neutral" disabled={isSending}>
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 120, justifyContent: "center" }}
          >
            {isSending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={15} />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>

      {/* Macro Preview Modal */}
      {previewMacro && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewMacro(null)}
          title={`Macro Preview: ${previewMacro.title}`}
          subtitle={`Shortcut: /${previewMacro.shortcut} • Category: ${previewMacro.category || "Hiring"}`}
          width={640}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setPreviewMacro(null)}
                className="btn-neutral"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplyMacro(previewMacro);
                  setPreviewMacro(null);
                }}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <CheckCircle2 size={14} /> Apply to Email
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Target candidate context pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "var(--page-bg, #F9FAFB)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--text-3)",
                border: "1px solid var(--card-border)",
              }}
            >
              <span>
                Previewing with values for <strong>{candidateName}</strong> ({candidateRole})
              </span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                {company?.name || "ProjectEasyHR"}
              </span>
            </div>

            {/* Subject Preview */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-4)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Subject Line Preview
              </label>
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fff",
                  border: "1.5px solid var(--card-border)",
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {applyMacroPlaceholders(previewMacro.subject || "")}
              </div>
            </div>

            {/* Body Preview */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-4)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Email Body Content
              </label>
              <div
                style={{
                  padding: "16px 18px",
                  background: "#fff",
                  border: "1.5px solid var(--card-border)",
                  borderRadius: 8,
                  minHeight: 180,
                  maxHeight: 320,
                  overflowY: "auto",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "var(--text-2)",
                }}
              >
                <RichTextRenderer html={applyMacroPlaceholders(previewMacro.bodyHtml)} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default EmailComposer;
