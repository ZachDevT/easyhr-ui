"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

type ToastFunction = (title: string, description?: string, duration?: number) => void;

interface ToastContextValue {
  toast: {
    success: ToastFunction;
    error: ToastFunction;
    info: ToastFunction;
    warning: ToastFunction;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global event bus for singleton usage outside React tree
type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  success: (title: string, description?: string, duration = 4000) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), type: "success", title, description, duration };
    listeners.forEach((fn) => fn(item));
  },
  error: (title: string, description?: string, duration = 5000) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), type: "error", title, description, duration };
    listeners.forEach((fn) => fn(item));
  },
  info: (title: string, description?: string, duration = 4000) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), type: "info", title, description, duration };
    listeners.forEach((fn) => fn(item));
  },
  warning: (title: string, description?: string, duration = 4500) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), type: "warning", title, description, duration };
    listeners.forEach((fn) => fn(item));
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((item: ToastItem) => {
    setToasts((prev) => [...prev.slice(-4), item]); // keep maximum 5 active
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast Viewport */}
      <aside
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
          maxWidth: 420,
          width: "calc(100vw - 48px)",
        }}
      >
        <style>{`
          @keyframes toastSlideIn {
            0% {
              opacity: 0;
              transform: translateY(16px) scale(0.96);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes toastProgress {
            0% { width: 100%; }
            100% { width: 0%; }
          }
        `}</style>

        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    if (!item.duration) return;
    const timer = setTimeout(onDismiss, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, onDismiss]);

  const typeConfig = {
    success: {
      border: "rgba(16, 185, 129, 0.25)",
      badgeBg: "rgba(16, 185, 129, 0.1)",
      badgeColor: "#059669",
      accent: "#10B981",
      icon: <CheckCircle2 size={16} color="#059669" />,
    },
    error: {
      border: "rgba(239, 68, 68, 0.25)",
      badgeBg: "rgba(239, 68, 68, 0.1)",
      badgeColor: "#DC2626",
      accent: "#EF4444",
      icon: <AlertCircle size={16} color="#DC2626" />,
    },
    warning: {
      border: "rgba(245, 158, 11, 0.25)",
      badgeBg: "rgba(245, 158, 11, 0.1)",
      badgeColor: "#D97706",
      accent: "#F59E0B",
      icon: <AlertTriangle size={16} color="#D97706" />,
    },
    info: {
      border: "rgba(162, 56, 255, 0.25)",
      badgeBg: "rgba(162, 56, 255, 0.1)",
      badgeColor: "#9333EA",
      accent: "#9B2DFF",
      icon: <Info size={16} color="#9333EA" />,
    },
  }[item.type];

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px 12px 14px",
        background: "#FFFFFF",
        borderRadius: 10,
        border: `1px solid ${typeConfig.border}`,
        boxShadow: "0 10px 30px -5px rgba(20, 20, 20, 0.14), 0 2px 6px rgba(0,0,0,0.04)",
        animation: "toastSlideIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent left pill */}
      <div
        style={{
          width: 3,
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          background: typeConfig.accent,
        }}
      />

      {/* Icon pill */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: typeConfig.badgeBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {typeConfig.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 650,
            color: "var(--text-1, #1E1D19)",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
          }}
        >
          {item.title}
        </div>
        {item.description && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-3, #6B6B63)",
              marginTop: 3,
              lineHeight: 1.4,
            }}
          >
            {item.description}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          padding: 4,
          cursor: "pointer",
          color: "var(--text-4, #9E9E95)",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text-1, #1E1D19)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-4, #9E9E95)";
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { toast, dismiss: () => {} };
  }
  return context;
}
