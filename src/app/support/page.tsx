"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Eye,
  Plus,
  Paperclip,
  UploadCloud,
  Loader2,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ShieldAlert,
  Image as ImageIcon,
  Download,
  Trash2,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRole } from "@/context/RoleContext";
import Link from "next/link";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";

interface Ticket {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeAvatar: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  latestMessage?: string;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderEmployeeId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  createdAt: string;
}

export default function SupportDashboard() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"All" | "open" | "in_progress" | "resolved">("open");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View / Reply Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // New Ticket Modal
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [newMessage, setNewMessage] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Attachment state for tickets and replies
  const [ticketAttachments, setTicketAttachments] = useState<{ name: string; size: string; type: string; url: string }[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<{ name: string; size: string; type: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { isHRAdmin } = useRole();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      Array.from(files).forEach((file) => {
        const sizeFormatted = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
        const reader = new FileReader();
        reader.onload = (event) => {
          const item = {
            name: file.name,
            size: sizeFormatted,
            type: file.type.startsWith("image/") ? "image" : "document",
            url: event.target?.result as string || "",
          };
          if (isReply) {
            setReplyAttachments((prev) => [...prev, item]);
          } else {
            setTicketAttachments((prev) => [...prev, item]);
          }
        };
        reader.readAsDataURL(file);
      });
      toast.success("Attachment added", "File attached to your support message.");
    } catch {
      toast.error("Upload error", "Unable to read selected file.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);
      const res = await fetch(`${API_BASE_URL}/api/v1/support/tickets`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load support tickets", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const loadTicketMessages = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsLoadingMessages(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);
      const res = await fetch(`${API_BASE_URL}/api/v1/support/tickets/${ticket.id}/messages`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load ticket messages", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);
      const res = await fetch(`${API_BASE_URL}/api/v1/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (res.ok) {
        setReplyText("");
        toast.success("Reply sent", "Your message was posted to this ticket.");
        await loadTicketMessages(selectedTicket);
        fetchTickets();
      } else {
        toast.error("Reply failed", "Could not send message.");
      }
    } catch (err) {
      toast.error("Error", "Could not post message.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);
      const res = await fetch(`${API_BASE_URL}/api/v1/support/tickets/${selectedTicket.id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success("Status updated", `Ticket marked as ${status}.`);
        setSelectedTicket({ ...selectedTicket, status });
        fetchTickets();
      }
    } catch (err) {
      toast.error("Error", "Could not update status.");
    }
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setIsCreatingTicket(true);
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);
      const res = await fetch(`${API_BASE_URL}/api/v1/support/tickets`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          subject: newSubject.trim(),
          priority: newPriority,
          message: newMessage.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Ticket opened", "Support inquiry submitted successfully.");
        setIsNewTicketModalOpen(false);
        setNewSubject("");
        setNewPriority("normal");
        setNewMessage("");
        fetchTickets();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Failed", err.detail || "Could not submit ticket.");
      }
    } catch (err) {
      toast.error("Error", "An unexpected error occurred.");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === "All") return true;
    return t.status.toLowerCase() === activeTab.toLowerCase();
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "warning";
      case "in_progress":
        return "primary";
      case "resolved":
        return "success";
      case "closed":
        return "neutral";
      default:
        return "neutral";
    }
  };

  if (!isHRAdmin) {
    return (
      <main style={{ padding: "64px 24px", maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#FEF2F2",
            color: "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl fw-800 text-1 mb-12">Platform Support Restricted</h1>
        <p className="text-sm text-4 mb-24" style={{ lineHeight: 1.6 }}>
          Direct platform engineering support and ticketing is reserved for Company HR Administrators. For internal workplace queries, please check Company Policies or reach out to your HR Team directly.
        </p>
        <div className="row gap-12 justify-center">
          <Link
            href="/policies"
            className="btn-primary"
            style={{ textDecoration: "none", padding: "10px 20px", borderRadius: 20 }}
          >
            View Company Policies
          </Link>
          <Link
            href="/dashboard"
            className="btn-secondary"
            style={{ textDecoration: "none", padding: "10px 20px", borderRadius: 20 }}
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <PageHeader
        title="EasyHR Platform Support"
        subtitle="Direct technical and operations line with the EasyHR Engineering & Compliance team."
        actions={
          <Button variant="primary" onClick={() => setIsNewTicketModalOpen(true)}>
            <Plus size={16} /> Open Engineering Ticket
          </Button>
        }
      />

      <div style={{ padding: "0 32px 32px" }}>
        <Card>
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              padding: "16px 24px",
              gap: 24,
            }}
          >
            {[
              { label: "Open", key: "open" },
              { label: "In Progress", key: "in_progress" },
              { label: "Resolved", key: "resolved" },
              { label: "All Tickets", key: "All" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  background: "none",
                  border: "none",
                  color: activeTab === tab.key ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  padding: "8px 0",
                  borderBottom:
                    activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                  marginBottom: -17,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "0" }}>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
                <Loader2 size={32} className="spin text-primary" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
                <MessageSquare size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                <p>No support tickets in this view.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {filteredTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "16px 24px",
                      borderBottom:
                        index < filteredTickets.length - 1 ? "1px solid var(--border)" : "none",
                      gap: 16,
                    }}
                  >
                    <Avatar
                      src={ticket.employeeAvatar}
                      name={ticket.employeeName}
                      size="md"
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <strong style={{ color: "var(--text-primary)", fontSize: 14 }}>
                          {ticket.subject}
                        </strong>
                        <Badge variant={getStatusColor(ticket.status) as any}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <span
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color:
                              ticket.priority === "urgent" || ticket.priority === "high"
                                ? "var(--error)"
                                : "var(--text-4)",
                          }}
                        >
                          {ticket.priority} priority
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <span>{ticket.employeeName}</span>
                        <span>·</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {ticket.latestMessage && (
                          <>
                            <span>·</span>
                            <span
                              style={{
                                maxWidth: 300,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              "{ticket.latestMessage}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button variant="secondary" onClick={() => loadTicketMessages(ticket)}>
                      <Eye size={16} /> View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* View & Reply Ticket Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Ticket: ${selectedTicket?.subject}`}
      >
        {selectedTicket && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                paddingBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar
                  src={selectedTicket.employeeAvatar}
                  name={selectedTicket.employeeName}
                  size="md"
                />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                    {selectedTicket.employeeName}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                    {selectedTicket.employeeEmail}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge variant={getStatusColor(selectedTicket.status) as any}>
                  {selectedTicket.status.replace("_", " ")}
                </Badge>
                {selectedTicket.status !== "resolved" ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateStatus("resolved")}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    Mark Resolved
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateStatus("in_progress")}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </div>

            {/* Message Thread */}
            <div
              style={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "8px 0",
              }}
            >
              {isLoadingMessages ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                  <Loader2 size={24} className="spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: 16, color: "var(--text-4)", textAlign: "center" }}>
                  No messages recorded in this ticket yet.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "var(--bg-page)",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        marginBottom: 6,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {m.senderName}
                      </span>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {m.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Area */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <Textarea
                placeholder="Type your response to the employee..."
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--primary)",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "var(--primary-tint)",
                  }}
                >
                  <Paperclip size={13} />
                  <span>Attach File / Screenshot</span>
                  <input
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => handleFileUpload(e, true)}
                    accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
                  />
                </label>
              </div>

              {replyAttachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {replyAttachments.map((att, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "5px 10px",
                        borderRadius: 8,
                        background: "var(--bg-page)",
                        border: "1px solid var(--border)",
                        fontSize: 12,
                      }}
                    >
                      {att.type === "image" ? <ImageIcon size={13} color="var(--primary)" /> : <FileText size={13} color="var(--text-4)" />}
                      <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                        {att.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                  gap: 12,
                }}
              >
                <Button variant="secondary" onClick={() => setSelectedTicket(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSendingReply}
                >
                  {isSendingReply ? <Loader2 size={14} className="spin mr-4" /> : <Send size={14} />}
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New Ticket Modal */}
      <Modal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title="Create New Support Ticket"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Subject
            </label>
            <Input
              placeholder="e.g. Assistance with compensation adjustment or leave balance"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Priority
            </label>
            <Select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="normal">Normal Priority</option>
              <option value="low">Low Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent Priority</option>
            </Select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Message
            </label>
            <Textarea
              placeholder="Provide details about your request or inquiry..."
              rows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>

          <div>
            <div className="row-between align-center mb-6">
              <label
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Attachments (Screenshots, Logs, Files)
              </label>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--primary)",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "var(--primary-tint)",
                }}
              >
                <Paperclip size={13} />
                <span>Upload File</span>
                <input
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleFileUpload(e, false)}
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
                />
              </label>
            </div>

            {ticketAttachments.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {ticketAttachments.map((att, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "var(--bg-page)",
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  >
                    {att.type === "image" ? <ImageIcon size={14} color="var(--primary)" /> : <FileText size={14} color="var(--text-4)" />}
                    <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                      {att.name}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-5)" }}>({att.size})</span>
                    <button
                      type="button"
                      onClick={() => setTicketAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
              gap: 12,
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setIsNewTicketModalOpen(false)}
              disabled={isCreatingTicket}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTicket}
              disabled={!newSubject.trim() || !newMessage.trim() || isCreatingTicket}
            >
              {isCreatingTicket && <Loader2 size={14} className="spin mr-4" />}
              Create Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
