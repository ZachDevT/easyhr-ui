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
} from "lucide-react";
import { RichTextEditor, RichTextRenderer, SlashCommandMacro } from "@/components/ui/RichTextEditor";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useCompany } from "@/context/CompanyContext";
import { EmailComposer, MacroItem } from "./EmailComposer";
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
  const [isComposingNew, setIsComposingNew] = useState(false);

  // Chat-style reply state (Zendesk style with WYSIWYG)
  const [replyMode, setReplyMode] = useState<"recruiter" | "candidate">("recruiter");
  const [replyHtml, setReplyHtml] = useState("<p></p>");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyStatus, setReplyStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

    // Poll every 4 seconds for new incoming candidate replies
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
    setIsComposingNew(false);
    setReplyHtml("<p></p>");
    setReplyStatus(null);
  };

  const handleNewThreadSent = () => {
    setIsComposingNew(false);
    loadThreads();
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

    setReplyHtml((prev) => {
      const cleanPrev = prev.replace(/<[^>]*>/g, "").trim();
      if (!cleanPrev) {
        return macroHtml;
      }
      return `${prev}<p></p>${macroHtml}`;
    });
    setShowMacroPicker(false);
    setMacroSearch("");
    setPreviewMacro(null);

    setReplyStatus({
      type: "success",
      text: `Applied macro "${m.title}" into reply.`,
    });
    setTimeout(() => setReplyStatus(null), 3500);
  };

  // Send Zendesk chat reply
  const handleSendChatReply = async () => {
    if (!selectedThread) return;
    const cleanContent = replyHtml.replace(/<[^>]*>/g, "").trim();
    if (!cleanContent) {
      setReplyStatus({ type: "error", text: "Please enter a message to send." });
      return;
    }

    try {
      setIsSendingReply(true);
      setReplyStatus(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const senderName = company?.name ? `${company.name} Talent Team` : "Hiring Team";
      const senderEmail = "notifications@recruter.easyhr.pro";
      const bodyHtml = replyHtml;

      let res: Response;
      if (replyMode === "candidate") {
        // Log candidate reply
        res = await fetch(
          `${API_BASE_URL}/api/v1/messaging/threads/${selectedThread.id}/candidate-reply`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bodyHtml,
              senderName: candidateName,
            }),
          }
        );
      } else {
        // Send email as recruiter
        res = await fetch(
          `${API_BASE_URL}/api/v1/messaging/threads/${selectedThread.id}/reply`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bodyHtml,
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

      setReplyHtml("<p></p>");
      toast.success(
        replyMode === "candidate" ? "Candidate reply recorded" : "Reply sent",
        replyMode === "candidate" ? "Response logged in thread." : "Email sent to " + selectedThread.candidateEmail
      );
      setReplyStatus({
        type: "success",
        text: replyMode === "candidate" ? "Candidate reply recorded!" : "Email reply sent to " + selectedThread.candidateEmail,
      });
      setTimeout(() => setReplyStatus(null), 3000);

      // Refresh messages
      loadMessages(selectedThread.id);
      loadThreads();
    } catch (err: any) {
      toast.error("Reply failed", err.message || "Failed to deliver message.");
      setReplyStatus({ type: "error", text: err.message || "Failed to deliver message." });
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredMacros = macros.filter(
    (m) =>
      m.title.toLowerCase().includes(macroSearch.toLowerCase()) ||
      m.shortcut.toLowerCase().includes(macroSearch.toLowerCase())
  );

  if (isLoadingThreads) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-4)" }}>
        <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto 8px auto" }} />
        <p style={{ margin: 0, fontSize: 13 }}>Loading candidate conversations…</p>
      </div>
    );
  }

  // If user clicked "New Email Thread" or there are no threads yet
  if (isComposingNew || threads.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid var(--card-border)",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>
              Send Email to {candidateName}
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--text-4)" }}>
              Start an email conversation thread. All outbound messages and candidate replies will appear here like a chat.
            </p>
          </div>
          {threads.length > 0 && (
            <button
              onClick={() => setIsComposingNew(false)}
              className="btn-neutral btn-sm"
            >
              Back to Conversation
            </button>
          )}
        </div>

        <EmailComposer
          applicantId={applicantId}
          candidateEmail={candidateEmail}
          candidateName={candidateName}
          candidateRole={candidateRole}
          onSent={handleNewThreadSent}
          onCancel={threads.length > 0 ? () => setIsComposingNew(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "310px 1fr",
        gap: 0,
        height: 720,
        maxHeight: "85vh",
        background: "#fff",
        borderRadius: 16,
        border: "1px solid var(--card-border)",
        overflow: "hidden",
        boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
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
            onClick={() => setIsComposingNew(true)}
            className="btn-primary"
            style={{ padding: "4px 10px", fontSize: 11, borderRadius: 6, display: "inline-flex", gap: 4 }}
          >
            <Plus size={12} /> New Thread
          </button>
        </div>

        {/* Thread List */}
        <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {threads.map((t) => {
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
                      maxWidth: 190,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.subject}
                  </span>
                  <Badge variant={t.status === "open" ? "success" : "neutral"} style={{ fontSize: 10 }}>
                    {t.messageCount} msg
                  </Badge>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} />
                  <span>{t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleDateString() : ""}</span>
                  <span style={{ margin: "0 2px" }}>&bull;</span>
                  <span>{t.candidateName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Right Column: Zendesk-Style Conversation & Docked Reply ───────────── */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFFFF", overflow: "hidden" }}>
        {selectedThread && (
          <>
            {/* Thread Header */}
            <div
              style={{
                padding: "14px 22px",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>
                    {selectedThread.subject}
                  </h4>
                  <Badge variant="success" style={{ fontSize: 10 }}>
                    Active Thread
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3 }}>
                  Candidate: <strong style={{ color: "var(--text-2)" }}>{candidateName}</strong> &bull;{" "}
                  <span>{selectedThread.candidateEmail}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => loadMessages(selectedThread.id)}
                  className="btn-neutral btn-sm"
                  title="Refresh messages"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px" }}
                >
                  <RefreshCw size={12} className={isLoadingMessages ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Scrollable Conversation Stream */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
                background: "#FBFBFA",
              }}
            >
              {isLoadingMessages ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-4)" }}>
                  <Loader2 className="animate-spin" size={20} style={{ margin: "0 auto 8px auto" }} />
                  <p style={{ margin: 0, fontSize: 12 }}>Loading conversation history…</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-4)" }}>
                  <Mail size={32} style={{ margin: "0 auto 8px auto", opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>No messages in this thread yet.</p>
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
                        maxWidth: "82%",
                        background: isRecruiter ? "#FFFFFF" : "#F8FAFC",
                        border: isRecruiter ? "1.5px solid #EDE9FE" : "1.5px solid #E2E8F0",
                        borderRadius: 14,
                        padding: "16px 18px",
                        boxShadow: isRecruiter ? "0 2px 8px rgba(162, 56, 255, 0.05)" : "0 2px 6px rgba(0,0,0,0.03)",
                      }}
                    >
                      {/* Message meta */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          marginBottom: 10,
                          paddingBottom: 8,
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: isRecruiter ? "var(--primary-tint, #F3E8FF)" : "#E0E7FF",
                              color: isRecruiter ? "var(--primary)" : "#3730A3",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {isRecruiter ? "Recruiter" : "Candidate"}
                          </span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
                            {m.senderName}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-4)" }}>
                            &lt;{m.senderEmail}&gt;
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-4)" }}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : ""}
                        </span>
                      </div>

                      {/* Rendered HTML Message Body */}
                      <div
                        style={{
                          fontSize: 13.5,
                          lineHeight: 1.6,
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

            {/* ─── Zendesk-Style Docked Chat Reply Box ─────────────────────────── */}
            <div
              style={{
                borderTop: "1.5px solid var(--card-border)",
                background: "#FFFFFF",
                padding: "14px 20px 16px 20px",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Status Notice */}
              {replyStatus && (
                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: replyStatus.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    color: replyStatus.type === "success" ? "#065F46" : "#991B1B",
                    border: `1px solid ${replyStatus.type === "success" ? "#A7F3D0" : "#FECACA"}`,
                  }}
                >
                  {replyStatus.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{replyStatus.text}</span>
                </div>
              )}

              {/* Mode Bar & Macro Quick Pills (Clean, Spaced, NO Flash Icon) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* Mode Bar: Email Reply is default; candidate replies appear automatically */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: replyMode === "recruiter" ? "var(--primary)" : "#4338CA",
                      background: replyMode === "recruiter" ? "var(--primary-tint, #F3E8FF)" : "#EEF2FF",
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {replyMode === "recruiter" ? (
                      <>
                        <Mail size={13} />
                        <span>Email Reply</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={13} />
                        <span>Log Offline Note</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setReplyMode(replyMode === "recruiter" ? "candidate" : "recruiter")}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: "transparent",
                      border: "none",
                      color: "var(--text-4)",
                      cursor: "pointer",
                      padding: "2px 4px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4)")}
                  >
                    {replyMode === "recruiter" ? "Switch to offline note" : "Switch back to email reply"}
                  </button>
                </div>

                {/* Macro Toggle & Pills */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setShowMacros(!showMacros)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 11.5,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: "1px solid var(--card-border, #E2E8F0)",
                      background: showMacros ? "var(--primary-tint, #F3E8FF)" : "#FFFFFF",
                      color: showMacros ? "var(--primary)" : "var(--text-3, #64748B)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Sparkles size={12} style={{ color: "var(--primary)" }} />
                    <span>Macros ({macros.length})</span>
                    <ChevronDown
                      size={12}
                      style={{
                        transform: showMacros ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.15s ease",
                      }}
                    />
                  </button>

                  {/* Macro Quick Pills Row (Shown only when toggled open) */}
                  {showMacros && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

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
                        <span
                          style={{
                            fontWeight: 800,
                            fontFamily: "monospace",
                            color: "var(--primary)",
                            fontSize: 10,
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

                  {/* Browse all button */}
                  <div style={{ position: "relative" }} ref={pickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowMacroPicker(!showMacroPicker)}
                      className="btn-neutral"
                      style={{
                        padding: "3px 8px",
                        fontSize: 11,
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      All ({macros.length})
                    </button>

                    {/* Popover macro selector */}
                    {showMacroPicker && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 8px)",
                          right: 0,
                          width: 320,
                          background: "#fff",
                          border: "1px solid var(--card-border)",
                          borderRadius: 10,
                          boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
                          zIndex: 300,
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
                                onClick={() => handleApplyMacro(m)}
                                style={{
                                  padding: "6px 8px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 6,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-tint)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      color: "var(--primary)",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    /{m.shortcut}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: "var(--text-1)",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {m.title}
                                  </span>
                                </div>
                                <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700 }}>Apply</span>
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
          </div>

              {/* WYSIWYG Mail Composer (Zendesk-Style, Full formatting, Resizable, Large Height) */}
              <div
                style={{
                  position: "relative",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <RichTextEditor
                  value={replyHtml}
                  onChange={(val) => setReplyHtml(val)}
                  placeholder={
                    replyMode === "candidate"
                      ? `Log response received from candidate ${candidateName} (rich formatting and macros supported)...`
                      : `Type a response to ${candidateName}... (Type / for templates or use formatting toolbar, ⌘+Enter to send)`
                  }
                  minHeight={220}
                  resizable={true}
                  showFooter={true}
                  onSubmit={handleSendChatReply}
                  macros={macros}
                  onSelectMacro={handleApplyMacro}
                  onViewMacro={(m) => setPreviewMacro(m as MacroItem)}
                />

                {/* Bottom Action Ribbon */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#FFFFFF",
                    borderRadius: 10,
                    border: "1px solid var(--card-border, #E2E8F0)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-4)" }}>
                    <span>
                      {replyMode === "recruiter" ? (
                        <>Delivers from: <strong style={{ color: "var(--primary)" }}>notifications@recruter.easyhr.pro</strong> to <strong>{selectedThread.candidateEmail}</strong></>
                      ) : (
                        <>Logs as candidate response from: <strong>{candidateName}</strong></>
                      )}
                    </span>
                    <span style={{ opacity: 0.6 }}>&bull; Press ⌘+Enter to send</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {replyHtml.replace(/<[^>]*>/g, "").trim() && (
                      <button
                        type="button"
                        onClick={() => setReplyHtml("<p></p>")}
                        className="btn-neutral btn-sm"
                        style={{ padding: "5px 12px", fontSize: 12 }}
                      >
                        Clear
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSendChatReply}
                      disabled={isSendingReply || !replyHtml.replace(/<[^>]*>/g, "").trim()}
                      className="btn-primary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "7px 20px",
                        fontWeight: 700,
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      {isSendingReply ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>{replyMode === "candidate" ? "Log Candidate Response" : "Send Reply"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Macro Preview Modal */}
      {previewMacro && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewMacro(null)}
          title={`Macro: ${previewMacro.title}`}
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
                <CheckCircle2 size={14} /> Insert into Reply
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
