"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Mail,
  MessageSquare,
  Send,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Sparkles,
  Search,
  Eye,
  Info,
  ChevronDown,
  CornerDownLeft,
  X,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { RichTextEditor, RichTextRenderer, SlashCommandMacro } from "@/components/ui/RichTextEditor";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useCompany } from "@/context/CompanyContext";
import { MacroItem } from "./EmailComposer";
import { toast } from "@/components/ui/Toast";

export interface EmailThreadItem {
  id: string;
  organizationId: string;
  applicantId: string;
  subject: string;
  candidateEmail: string;
  candidateName: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  messageCount: number;
}

export interface EmailMessageItem {
  id: string;
  threadId: string;
  senderType: "recruiter" | "candidate";
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  createdAt: string;
}

interface ThreadViewProps {
  applicantId: string;
  candidateEmail: string;
  candidateName: string;
  candidateRole?: string;
}

export function ThreadView({
  applicantId,
  candidateEmail,
  candidateName,
  candidateRole = "Candidate",
}: ThreadViewProps) {
  const { getToken } = useAuth();
  const { company } = useCompany();

  const [threads, setThreads] = useState<EmailThreadItem[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThreadItem | null>(null);
  const [messages, setMessages] = useState<EmailMessageItem[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Right-sided dialog (Drawer) state for replying / composing
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"reply" | "new" | "note">("reply");
  const [replyMode, setReplyMode] = useState<"recruiter" | "candidate">("recruiter");
  const [drawerSubject, setDrawerSubject] = useState("");
  const [drawerHtml, setDrawerHtml] = useState("<p></p>");
  const [isSending, setIsSending] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Macros state
  const [macros, setMacros] = useState<MacroItem[]>([]);
  const [showMacros, setShowMacros] = useState(false);
  const [showMacroPicker, setShowMacroPicker] = useState(false);
  const [macroSearch, setMacroSearch] = useState("");
  const [previewMacro, setPreviewMacro] = useState<MacroItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Fetch macros on mount
  useEffect(() => {
    async function fetchMacros() {
      try {
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
      }
    }
    fetchMacros();
  }, [getToken]);

  // Fetch threads for this applicant
  const loadThreads = useCallback(async () => {
    try {
      setIsLoadingThreads(true);
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${API_BASE_URL}/api/v1/messaging/threads?applicantId=${applicantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const json = await res.json();
        const list: EmailThreadItem[] = json.data || [];
        setThreads(list);
        if (list.length > 0 && !selectedThread) {
          setSelectedThread(list[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load threads", err);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [applicantId, getToken, selectedThread]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Fetch messages when selected thread changes or on poll
  const loadMessages = useCallback(
    async (threadId: string, isSilent = false) => {
      try {
        if (!isSilent) setIsLoadingMessages(true);
        const token = await getToken();
        if (!token) return;
        const res = await fetch(
          `${API_BASE_URL}/api/v1/messaging/threads/${threadId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const json = await res.json();
          const newMsgs: EmailMessageItem[] = json.data || [];
          setMessages((prev) => {
            if (prev.length !== newMsgs.length) {
              setTimeout(() => scrollToBottom(false), 50);
              return newMsgs;
            }
            return prev;
          });
        }
      } catch (err) {
        if (!isSilent) console.error("Failed to load thread messages", err);
      } finally {
        if (!isSilent) setIsLoadingMessages(false);
      }
    },
    [getToken]
  );

  // Initial load and periodic live polling for incoming candidate messages
  useEffect(() => {
    if (!selectedThread?.id) return;
    loadMessages(selectedThread.id, false);

    const interval = setInterval(() => {
      loadMessages(selectedThread.id, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedThread?.id, loadMessages]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Close macro picker on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMacroPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleThreadSelect = (thread: EmailThreadItem) => {
    setSelectedThread(thread);
    setIsDrawerOpen(false);
  };

  // Open right-sided dialog for replying
  const openReplyDrawer = (mode: "recruiter" | "candidate" = "recruiter") => {
    setDrawerMode(mode === "candidate" ? "note" : "reply");
    setReplyMode(mode);
    setDrawerSubject(selectedThread ? `Re: ${selectedThread.subject}` : `Regarding application for ${candidateRole}`);
    setDrawerHtml("<p></p>");
    setDrawerStatus(null);
    setIsDrawerOpen(true);
  };

  // Open right-sided dialog for a brand new thread
  const openNewThreadDrawer = () => {
    setDrawerMode("new");
    setReplyMode("recruiter");
    setDrawerSubject(`Regarding your application for ${candidateRole} - ${company?.name || "EasyHR"}`);
    setDrawerHtml(`<p>Hi ${candidateName},</p><p></p>`);
    setDrawerStatus(null);
    setIsDrawerOpen(true);
  };

  // Replace placeholders in macro text
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

  const handleApplyMacro = (m: MacroItem | SlashCommandMacro) => {
    const macroHtml = applyMacroPlaceholders(m.bodyHtml);

    if (drawerMode === "new" && m.subject) {
      setDrawerSubject(applyMacroPlaceholders(m.subject));
    }

    setDrawerHtml((prev) => {
      const cleanPrev = prev.replace(/<[^>]*>/g, "").trim();
      if (!cleanPrev || cleanPrev === `Hi ${candidateName},`) {
        return macroHtml;
      }
      return `${prev}<p></p>${macroHtml}`;
    });
    setShowMacroPicker(false);
    setMacroSearch("");
    setPreviewMacro(null);

    toast.info("Macro applied", `Inserted "${m.title}"`);
    setDrawerStatus({
      type: "success",
      text: `Applied macro "${m.title}".`,
    });
    setTimeout(() => setDrawerStatus(null), 3000);
  };

  // Send message from the right-sided drawer (Pinned Send Button)
  const handleSendFromDrawer = async () => {
    const cleanContent = drawerHtml.replace(/<[^>]*>/g, "").trim();
    if (!cleanContent) {
      setDrawerStatus({ type: "error", text: "Please enter a message before sending." });
      return;
    }
    if (drawerMode === "new" && !drawerSubject.trim()) {
      setDrawerStatus({ type: "error", text: "Subject line is required." });
      return;
    }

    try {
      setIsSending(true);
      setDrawerStatus(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const senderName = company?.name ? `${company.name} Talent Team` : "Hiring Team";
      const senderEmail = "notifications@recruter.easyhr.pro";

      let res: Response;

      if (drawerMode === "new") {
        // Create brand new email thread
        res = await fetch(`${API_BASE_URL}/api/v1/messaging/threads`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicantId,
            subject: drawerSubject.trim(),
            bodyHtml: drawerHtml,
            candidateEmail,
            candidateName,
            senderName,
            senderEmail,
          }),
        });
      } else if (replyMode === "candidate") {
        // Log candidate response note
        if (!selectedThread) throw new Error("No thread selected");
        res = await fetch(
          `${API_BASE_URL}/api/v1/messaging/threads/${selectedThread.id}/candidate-reply`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bodyHtml: drawerHtml,
              senderName: candidateName,
            }),
          }
        );
      } else {
        // Send email reply to existing thread
        if (!selectedThread) throw new Error("No thread selected");
        res = await fetch(
          `${API_BASE_URL}/api/v1/messaging/threads/${selectedThread.id}/reply`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bodyHtml: drawerHtml,
              senderName,
              senderEmail,
              senderType: "recruiter",
            }),
          }
        );
      }

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || errJson.title || "Failed to post message");
      }

      const resJson = await res.json();

      if (drawerMode === "new") {
        toast.success("Email thread started", `Delivered to ${candidateEmail}`);
        setIsDrawerOpen(false);
        await loadThreads();
        if (resJson.data?.id) {
          setSelectedThread(resJson.data);
          loadMessages(resJson.data.id);
        }
      } else {
        const targetEmail = selectedThread?.candidateEmail || candidateEmail;
        toast.success(
          replyMode === "candidate" ? "Candidate note logged" : "Reply sent successfully",
          replyMode === "candidate" ? "Saved to thread history." : `Delivered to ${targetEmail}`
        );
        setIsDrawerOpen(false);
        if (selectedThread) {
          loadMessages(selectedThread.id);
          loadThreads();
        }
      }
    } catch (err: any) {
      toast.error("Send failed", err.message || "Failed to deliver message.");
      setDrawerStatus({ type: "error", text: err.message || "Failed to deliver message." });
    } finally {
      setIsSending(false);
    }
  };

  const filteredMacros = macros.filter(
    (m) =>
      m.title.toLowerCase().includes(macroSearch.toLowerCase()) ||
      m.shortcut.toLowerCase().includes(macroSearch.toLowerCase())
  );

  const cleanDrawerContent = drawerHtml.replace(/<[^>]*>/g, "").trim();

  if (isLoadingThreads) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-4)" }}>
        <Loader2 className="animate-spin" size={28} style={{ margin: "0 auto 12px auto", color: "var(--primary)" }} />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Loading conversation threads…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "310px 1fr",
        gap: 0,
        height: 740,
        maxHeight: "calc(100vh - 180px)",
        minHeight: 560,
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid var(--card-border)",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      }}
    >
      {/* ─── Left Sidebar: Threads List ────────────────────────────────────────── */}
      <div
        style={{
          borderRight: "1px solid var(--card-border)",
          display: "flex",
          flexDirection: "column",
          background: "var(--page-bg, #FAFAFA)",
          height: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={16} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>
              Threads ({threads.length})
            </span>
          </div>
          <button
            type="button"
            onClick={openNewThreadDrawer}
            className="btn-primary"
            style={{ padding: "5px 12px", fontSize: 11.5, borderRadius: 7, display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}
          >
            <Plus size={13} /> New Thread
          </button>
        </div>

        {/* Thread List */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {threads.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-4)" }}>
              <Mail size={28} style={{ margin: "0 auto 10px auto", opacity: 0.4 }} />
              <p style={{ margin: "0 0 12px 0", fontSize: 12.5, fontWeight: 600 }}>No conversations yet</p>
              <button
                type="button"
                onClick={openNewThreadDrawer}
                className="btn-primary"
                style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8 }}
              >
                Send First Email
              </button>
            </div>
          ) : (
            threads.map((t) => {
              const isSelected = selectedThread?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleThreadSelect(t)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: isSelected ? "#FFFFFF" : "transparent",
                    border: isSelected ? "1.5px solid var(--primary)" : "1px solid rgba(0,0,0,0.06)",
                    boxShadow: isSelected ? "0 4px 12px rgba(162, 56, 255, 0.08)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isSelected ? "var(--primary)" : "var(--text-1)",
                        maxWidth: 185,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.subject}
                    </span>
                    <Badge variant={t.status === "open" ? "success" : "neutral"} style={{ fontSize: 10, padding: "2px 6px" }}>
                      {t.messageCount} msg
                    </Badge>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} />
                    <span>{t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleDateString() : ""}</span>
                    <span style={{ margin: "0 2px" }}>&bull;</span>
                    <span style={{ maxWidth: 110, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.candidateName}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Right Column: Full-Height Thread Feed & Docked Quick Action Bar ────── */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFFFF", overflow: "hidden" }}>
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>
                    {selectedThread.subject}
                  </h3>
                  <Badge variant="success" style={{ fontSize: 10.5, fontWeight: 700 }}>
                    Active Thread
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Candidate:</span>
                  <strong style={{ color: "var(--text-2)" }}>{candidateName}</strong>
                  <span>&bull;</span>
                  <span>{selectedThread.candidateEmail}</span>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => loadMessages(selectedThread.id)}
                  className="btn-neutral btn-sm"
                  title="Refresh conversation"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 12 }}
                >
                  <RefreshCw size={13} className={isLoadingMessages ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => openReplyDrawer("recruiter")}
                  className="btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", fontSize: 12.5, fontWeight: 700 }}
                >
                  <Send size={13} />
                  <span>Reply via Email</span>
                </button>
              </div>
            </div>

            {/* ─── Spacious, Full-Height Message Feed ─────────────────────────── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                background: "#F8FAFC",
              }}
            >
              {isLoadingMessages ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-4)" }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto 10px auto", color: "var(--primary)" }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Loading conversation history…</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-4)" }}>
                  <Mail size={36} style={{ margin: "0 auto 10px auto", opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>No messages in this thread yet.</p>
                  <button
                    type="button"
                    onClick={() => openReplyDrawer("recruiter")}
                    className="btn-primary"
                    style={{ marginTop: 14, fontSize: 12.5 }}
                  >
                    Send First Message
                  </button>
                </div>
              ) : (
                messages.map((m) => {
                  const isRecruiter = m.senderType === "recruiter";
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignSelf: isRecruiter ? "flex-end" : "flex-start",
                        width: "100%",
                        maxWidth: "88%",
                        background: isRecruiter ? "#FFFFFF" : "#FFFFFF",
                        border: isRecruiter ? "1.5px solid #EDE9FE" : "1.5px solid #E2E8F0",
                        borderRadius: 14,
                        padding: "18px 22px",
                        boxShadow: isRecruiter ? "0 4px 14px rgba(162, 56, 255, 0.05)" : "0 2px 10px rgba(0,0,0,0.03)",
                      }}
                    >
                      {/* Message Meta Ribbon */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          marginBottom: 12,
                          paddingBottom: 10,
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "3px 8px",
                              borderRadius: 5,
                              background: isRecruiter ? "var(--primary-tint, #F3E8FF)" : "#EEF2FF",
                              color: isRecruiter ? "var(--primary)" : "#3730A3",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {isRecruiter ? "Recruiter" : "Candidate"}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                            {m.senderName}
                          </span>
                          <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>
                            &lt;{m.senderEmail}&gt;
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-4)" }}>
                          <Clock size={12} />
                          <span>
                            {m.createdAt ? new Date(m.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : ""}
                          </span>
                        </div>
                      </div>

                      {/* Rendered HTML Message Body */}
                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                          color: "var(--text-2)",
                          overflowWrap: "break-word",
                        }}
                      >
                        <RichTextRenderer html={m.bodyHtml} />
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ─── Compact Docked Action Bar (Non-Cramped, Height ~60px) ───────── */}
            <div
              style={{
                borderTop: "1.5px solid var(--card-border)",
                background: "#FFFFFF",
                padding: "12px 24px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                boxShadow: "0 -2px 10px rgba(0,0,0,0.02)",
              }}
            >
              {/* Clickable prompt input that triggers the right-sided drawer */}
              <div
                onClick={() => openReplyDrawer("recruiter")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  background: "#F9FAFB",
                  border: "1px solid var(--card-border)",
                  borderRadius: 9,
                  cursor: "pointer",
                  color: "var(--text-4)",
                  fontSize: 13,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.background = "#F9FAFB";
                }}
              >
                <CornerDownLeft size={14} style={{ color: "var(--primary)" }} />
                <span>Click here to reply to {candidateName} (opens full composer drawer)…</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => openReplyDrawer("candidate")}
                  className="btn-neutral btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "7px 12px" }}
                  title="Log a response received outside of email"
                >
                  <MessageSquare size={13} />
                  <span>Log Offline Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => openReplyDrawer("recruiter")}
                  className="btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, padding: "7px 18px" }}
                >
                  <Send size={13} />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--text-4)", margin: "auto" }}>
            <Mail size={44} style={{ margin: "0 auto 16px auto", opacity: 0.3 }} />
            <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, color: "var(--text-2)" }}>
              Select a conversation
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: 13 }}>
              Choose a thread from the sidebar or send a new email to {candidateName}.
            </p>
            <button
              type="button"
              onClick={openNewThreadDrawer}
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px" }}
            >
              <Plus size={14} /> Start New Conversation
            </button>
          </div>
        )}
      </div>

      {/* ─── Reusable Right-Sided Dialog (Drawer Sheet) for Mailing & Replying ── */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          drawerMode === "new"
            ? `New Email Thread`
            : replyMode === "candidate"
            ? `Log Candidate Response`
            : `Reply to: ${selectedThread?.subject || "Email Conversation"}`
        }
        subtitle={
          drawerMode === "new"
            ? `Recipient: ${candidateName} • ${candidateEmail}`
            : `Candidate: ${candidateName} • ${selectedThread?.candidateEmail || candidateEmail}`
        }
        width={740}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-4)" }}>
              {replyMode === "recruiter" ? (
                <span>
                  Delivers from: <strong style={{ color: "var(--primary)" }}>notifications@recruter.easyhr.pro</strong> to <strong>{selectedThread?.candidateEmail || candidateEmail}</strong>
                </span>
              ) : (
                <span>
                  Logs message received from: <strong>{candidateName}</strong>
                </span>
              )}
              <span style={{ opacity: 0.6 }}>&bull; ⌘+Enter to send</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="btn-neutral"
                disabled={isSending}
              >
                Cancel
              </button>

              {/* Pinpoint Send Button: Never scrollable away, always docked in modal footer */}
              <button
                type="button"
                onClick={handleSendFromDrawer}
                disabled={isSending || !cleanDrawerContent}
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 24px",
                  fontWeight: 700,
                  fontSize: 13.5,
                  borderRadius: 8,
                }}
              >
                {isSending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>
                      {drawerMode === "new"
                        ? "Send Email"
                        : replyMode === "candidate"
                        ? "Log Candidate Response"
                        : "Send Email Reply"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Status Alert */}
          {drawerStatus && (
            <div
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: drawerStatus.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: drawerStatus.type === "success" ? "#065F46" : "#991B1B",
                border: `1px solid ${drawerStatus.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              }}
            >
              {drawerStatus.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{drawerStatus.text}</span>
            </div>
          )}

          {/* Mode Switcher (Email Reply vs Offline Note) */}
          {drawerMode !== "new" && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#F3F4F6",
                padding: 4,
                borderRadius: 10,
                width: "fit-content",
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setReplyMode("recruiter")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  background: replyMode === "recruiter" ? "#FFFFFF" : "transparent",
                  color: replyMode === "recruiter" ? "var(--primary)" : "var(--text-3)",
                  boxShadow: replyMode === "recruiter" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Mail size={14} />
                <span>Email Reply (Outbound)</span>
              </button>
              <button
                type="button"
                onClick={() => setReplyMode("candidate")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  background: replyMode === "candidate" ? "#FFFFFF" : "transparent",
                  color: replyMode === "candidate" ? "#4338CA" : "var(--text-3)",
                  boxShadow: replyMode === "candidate" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <MessageSquare size={14} />
                <span>Log Offline Note (Received)</span>
              </button>
            </div>
          )}

          {/* From / To Meta Strip */}
          <div
            style={{
              padding: "10px 14px",
              background: "#F9FAFB",
              borderRadius: 8,
              border: "1px solid var(--card-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12.5,
              color: "var(--text-3)",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: "var(--text-4)", marginRight: 6 }}>To:</span>
              <strong style={{ color: "var(--text-1)" }}>{candidateName}</strong> &lt;{selectedThread?.candidateEmail || candidateEmail}&gt;
            </div>
            <div>
              <span style={{ fontWeight: 600, color: "var(--text-4)", marginRight: 6 }}>From:</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>notifications@recruter.easyhr.pro</span>
            </div>
          </div>

          {/* Subject Field */}
          {drawerMode === "new" ? (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                Subject
              </label>
              <input
                type="text"
                className="input"
                value={drawerSubject}
                onChange={(e) => setDrawerSubject(e.target.value)}
                placeholder="e.g. Next steps regarding your interview..."
                style={{ width: "100%", fontWeight: 600, fontSize: 13.5 }}
                required
              />
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "var(--text-4)", fontWeight: 500 }}>Thread:</span>
              <span>{selectedThread?.subject}</span>
            </div>
          )}

          {/* Macros & Templates Ribbon */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowMacros(!showMacros)}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 7,
                border: "1px solid var(--card-border, #E2E8F0)",
                background: showMacros ? "var(--primary-tint, #F3E8FF)" : "#FFFFFF",
                color: showMacros ? "var(--primary)" : "var(--text-3)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease",
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

            {/* Quick Macro Pills */}
            {macros.slice(0, 3).map((m) => (
              <div
                key={m.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 6,
                  background: "#F9FAFB",
                  border: "1px solid var(--card-border, #E2E8F0)",
                  overflow: "hidden",
                  fontSize: 11.5,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleApplyMacro(m)}
                  style={{
                    padding: "3px 8px",
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-1)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  title={`Insert /${m.shortcut}: ${m.title}`}
                >
                  <span style={{ fontWeight: 800, fontFamily: "monospace", color: "var(--primary)", fontSize: 10 }}>
                    /{m.shortcut}
                  </span>
                  <span>{m.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMacro(m)}
                  title="Preview macro"
                  style={{
                    padding: "3px 6px",
                    background: "transparent",
                    border: "none",
                    borderLeft: "1px solid var(--card-border, #E2E8F0)",
                    cursor: "pointer",
                    color: "var(--text-4)",
                  }}
                >
                  <Eye size={11} />
                </button>
              </div>
            ))}

            {/* Browse All Macros Popover Button */}
            <div style={{ position: "relative" }} ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowMacroPicker(!showMacroPicker)}
                className="btn-neutral"
                style={{
                  padding: "4px 9px",
                  fontSize: 11.5,
                  borderRadius: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                All ({macros.length})
              </button>

              {showMacroPicker && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    width: 320,
                    background: "#fff",
                    border: "1px solid var(--card-border)",
                    borderRadius: 10,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
                    zIndex: 400,
                    padding: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      background: "var(--page-bg, #F9FAFB)",
                      borderRadius: 6,
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <Search size={13} style={{ color: "var(--text-4)" }} />
                    <input
                      type="text"
                      placeholder="Search macros..."
                      value={macroSearch}
                      onChange={(e) => setMacroSearch(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: 12,
                        width: "100%",
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                    {filteredMacros.length === 0 ? (
                      <div style={{ padding: "12px 8px", textAlign: "center", fontSize: 11.5, color: "var(--text-4)" }}>
                        No macros found
                      </div>
                    ) : (
                      filteredMacros.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div
                            onClick={() => handleApplyMacro(m)}
                            style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}
                          >
                            <span style={{ fontWeight: 800, fontFamily: "monospace", color: "var(--primary)", fontSize: 10.5 }}>
                              /{m.shortcut}
                            </span>
                            <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{m.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewMacro(m)}
                            title="Preview"
                            style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: 2 }}
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full WYSIWYG Rich Text Editor */}
          <div>
            <RichTextEditor
              value={drawerHtml}
              onChange={(val) => setDrawerHtml(val)}
              placeholder={
                replyMode === "candidate"
                  ? `Type or paste the response received from ${candidateName}...`
                  : `Draft your message to ${candidateName}... (Type / for templates or format with toolbar, ⌘+Enter to send)`
              }
              minHeight={260}
              resizable={true}
              showFooter={true}
              onSubmit={handleSendFromDrawer}
              macros={macros}
              onSelectMacro={handleApplyMacro}
              onViewMacro={(m) => setPreviewMacro(m as MacroItem)}
            />
          </div>
        </div>
      </Modal>

      {/* Macro Preview Modal */}
      {previewMacro && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewMacro(null)}
          title={`Macro Preview: ${previewMacro.title}`}
          subtitle={`Shortcut: /${previewMacro.shortcut} • Category: ${previewMacro.category || "Hiring"}`}
          width={580}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setPreviewMacro(null)}
                className="btn-neutral"
              >
                Close
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
                <CheckCircle2 size={14} /> Insert into Editor
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                padding: "8px 12px",
                background: "var(--page-bg, #F9FAFB)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--text-3)",
                border: "1px solid var(--card-border)",
              }}
            >
              Preview with values for: <strong>{candidateName}</strong> ({candidateRole})
            </div>

            {previewMacro.subject && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 4 }}>
                  Subject
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>
                  {applyMacroPlaceholders(previewMacro.subject)}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 6 }}>
                Content
              </div>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  padding: "14px 16px",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--text-2)",
                  maxHeight: 280,
                  overflowY: "auto",
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

export default ThreadView;
