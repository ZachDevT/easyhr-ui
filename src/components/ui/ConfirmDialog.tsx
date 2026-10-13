"use client";

import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, Trash2, X } from "lucide-react";

export type ConfirmDialogVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<
  ConfirmDialogVariant,
  { icon: React.ReactNode; confirmBg: string; iconBg: string; iconColor: string }
> = {
  danger: {
    icon: <Trash2 size={22} />,
    confirmBg: "#EF4444",
    iconBg: "rgba(239,68,68,0.1)",
    iconColor: "#EF4444",
  },
  warning: {
    icon: <AlertTriangle size={22} />,
    confirmBg: "#F59E0B",
    iconBg: "rgba(245,158,11,0.12)",
    iconColor: "#D97706",
  },
  info: {
    icon: <Info size={22} />,
    confirmBg: "var(--primary)",
    iconBg: "var(--primary-tint)",
    iconColor: "var(--primary)",
  },
  success: {
    icon: <CheckCircle2 size={22} />,
    confirmBg: "#059669",
    iconBg: "rgba(5,150,105,0.1)",
    iconColor: "#059669",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const cfg = variantConfig[variant];

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "relative",
          background: "var(--card-bg, #fff)",
          borderRadius: 20,
          border: "1px solid var(--card-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          padding: 32,
          width: "100%",
          maxWidth: 420,
          animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            borderRadius: 8,
          }}
        >
          <X size={18} />
        </button>

        {/* Icon + Title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div
            style={{
              flexShrink: 0,
              width: 48,
              height: 48,
              borderRadius: 14,
              background: cfg.iconBg,
              color: cfg.iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cfg.icon}
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text-1)",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
            {message && (
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: 14,
                  color: "var(--text-3)",
                  lineHeight: 1.55,
                }}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--card-border)" }} />

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-neutral"
            style={{ minWidth: 90 }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            style={{
              minWidth: 110,
              padding: "9px 20px",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              background: cfg.confirmBg,
              border: "none",
              borderRadius: 10,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.15s",
            }}
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
                Processing…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
