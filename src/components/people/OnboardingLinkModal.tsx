"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import {
  Link2,
  Copy,
  Check,
  Mail,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Clock,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface OnboardingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  initialPortalUrl?: string;
}

export function OnboardingLinkModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  employeeEmail = "",
  initialPortalUrl = "",
}: OnboardingLinkModalProps) {
  const { getToken } = useAuth();
  const [portalUrl, setPortalUrl] = useState(initialPortalUrl);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState(employeeEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch or generate link when modal opens
  const fetchOrGenerateLink = useCallback(
    async (forceNew = false) => {
      if (!employeeId) return;
      if (forceNew) setIsGenerating(true);
      else setIsLoading(true);

      try {
        const token = await getToken();
        const headers = getAuthHeaders(token);

        if (forceNew || !portalUrl) {
          // Generate fresh token
          const res = await fetch(`${API_BASE_URL}/api/v1/employees/${employeeId}/onboarding-link`, {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sendEmail: false }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Could not generate onboarding link");
          }

          const data = await res.json();
          setPortalUrl(data.portalUrl || "");
          setExpiresAt(data.expiresAt || null);
          if (data.email) setRecipientEmail(data.email);

          if (forceNew) {
            toast.success("Fresh link generated", "A new 7-day onboarding link was created.");
          }
        }
      } catch (err: any) {
        toast.error("Error", err.message || "Failed to load onboarding link");
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    },
    [employeeId, getToken, portalUrl]
  );

  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
      if (!portalUrl) {
        fetchOrGenerateLink(false);
      }
    }
  }, [isOpen, fetchOrGenerateLink, portalUrl]);

  const handleCopyLink = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setIsCopied(true);
      toast.success("Link copied!", "Onboarding link copied to clipboard.");
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error("Copy failed", "Please select and copy the text manually.");
    }
  };

  const handleSendEmail = async () => {
    if (!employeeId) return;
    setIsSendingEmail(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/employees/${employeeId}/onboarding-link`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sendEmail: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not send invitation email");
      }

      const data = await res.json();
      setPortalUrl(data.portalUrl || portalUrl);
      setExpiresAt(data.expiresAt || expiresAt);
      toast.success(
        "Invitation sent",
        `Onboarding instructions sent to ${data.email || recipientEmail || "employee"}.`
      );
    } catch (err: any) {
      toast.error("Failed to send", err.message || "Could not deliver email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Onboarding Link"
      subtitle={`Manual access and invitation management for ${employeeName}`}
      width={560}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <button
            type="button"
            className="btn-neutral"
            onClick={() => fetchOrGenerateLink(true)}
            disabled={isGenerating || isLoading}
            style={{ borderRadius: 9999, fontSize: 12.5 }}
            title="Generate a new active token if previous one expired"
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin mr-6" /> : <RefreshCw size={13} className="mr-6" />}
            Generate New Link
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{ borderRadius: 9999, fontSize: 13, padding: "8px 24px" }}
          >
            Done
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Recipient summary banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "#FAF9F7",
            borderRadius: 10,
            border: "1px solid var(--card-border, #E8ECE8)",
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: "var(--text-4)", display: "block" }}>Employee Name</span>
            <strong style={{ fontSize: 14, color: "var(--text-1)" }}>{employeeName}</strong>
            {recipientEmail && (
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{recipientEmail}</div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 9999,
                background: "#DCFCE7",
                color: "#16A34A",
              }}
            >
              <ShieldCheck size={12} />
              Active Token
            </span>
            {expiresAt && (
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>
                Expires in 7 days
              </div>
            )}
          </div>
        </div>

        {/* Link Input & Copy Field */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Direct Onboarding Portal URL
          </label>
          {isLoading ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-4)" }}>
              <Loader2 size={20} className="animate-spin mx-auto mb-6" style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: 12 }}>Retrieving active onboarding link...</span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  readOnly
                  className="input"
                  value={portalUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  style={{
                    paddingRight: 36,
                    fontSize: 12.5,
                    fontFamily: "monospace",
                    background: "#FFFFFF",
                  }}
                />
                {portalUrl && (
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      position: "absolute",
                      right: 10,
                      color: "var(--text-4)",
                    }}
                    title="Open onboarding portal in new tab"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleCopyLink}
                style={{
                  borderRadius: 9999,
                  padding: "0 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                {isCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          )}
        </div>

        {/* Manual sending guidance note */}
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(37, 99, 235, 0.05)",
            borderRadius: 8,
            border: "1px solid rgba(37, 99, 235, 0.15)",
            fontSize: 12,
            color: "var(--text-2)",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "var(--primary, #2563EB)", display: "block", marginBottom: 2 }}>
            💡 Safe Manual Onboarding Sharing
          </strong>
          You can share this unique link directly with the new hire via WhatsApp, Slack, SMS, or private email.
          Even if an automated email expired, opening this link allows them to complete their profile setup seamlessly.
        </div>

        {/* Resend Automated Email Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid var(--card-border, #E8ECE8)",
          }}
        >
          <div>
            <strong style={{ fontSize: 13, color: "var(--text-1)", display: "block" }}>
              Send Branded Email Invitation
            </strong>
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              Delivers onboarding instructions directly to {recipientEmail || "employee inbox"}
            </span>
          </div>

          <button
            type="button"
            className="btn-neutral"
            onClick={handleSendEmail}
            disabled={isSendingEmail || !employeeId}
            style={{ borderRadius: 9999, fontSize: 12, padding: "6px 14px" }}
          >
            {isSendingEmail ? (
              <Loader2 size={13} className="animate-spin mr-6" />
            ) : (
              <Mail size={13} className="mr-6" style={{ color: "var(--primary)" }} />
            )}
            Resend Email
          </button>
        </div>
      </div>
    </Modal>
  );
}
