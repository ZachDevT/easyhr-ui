"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  Sliders,
  DollarSign,
  FileText,
  Send,
  X,
  HelpCircle,
  ChevronRight,
  Info,
} from "lucide-react";

interface PayrollWalkthroughWidgetProps {
  onOpenHelp: () => void;
  onNavigateTab: (tab: string) => void;
  hasConfig: boolean;
  employeesWithComp: number;
  totalEmployees: number;
  hasRules: boolean;
}

export function PayrollWalkthroughWidget({
  onOpenHelp,
  onNavigateTab,
  hasConfig,
  employeesWithComp,
  totalEmployees,
  hasRules,
}: PayrollWalkthroughWidgetProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("easyhr_payroll_workaround_dismissed");
      setIsDismissed(dismissed === "true");
    } catch {
      setIsDismissed(false);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem("easyhr_payroll_workaround_dismissed", "true");
    } catch {}
    setIsDismissed(true);
  };

  const handleRestore = () => {
    try {
      localStorage.removeItem("easyhr_payroll_workaround_dismissed");
    } catch {}
    setIsDismissed(false);
  };

  if (!isLoaded) return null;

  if (isDismissed) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          marginBottom: 16,
          background: "#FFFFFF",
          border: "1px dashed var(--card-border, #E4E4E7)",
          borderRadius: 12,
          fontSize: 12.5,
          color: "var(--text-3, #585F5B)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} style={{ color: "var(--primary)" }} />
          <span>Need a refresher on how EasyHR payroll works?</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={handleRestore}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 12,
              padding: 0,
            }}
          >
            Show Quick Guide
          </button>
          <span style={{ color: "var(--card-border)" }}>•</span>
          <button
            type="button"
            onClick={onOpenHelp}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 12,
              padding: 0,
            }}
          >
            <HelpCircle size={13} />
            Setup Help
          </button>
        </div>
      </div>
    );
  }

  const allReady = hasConfig && employeesWithComp > 0 && hasRules;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FAF5FF 0%, #F5F7FF 100%)",
        border: "1px solid #E9D5FF",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 20,
        position: "relative",
        boxShadow: "0 2px 10px rgba(162, 56, 255, 0.04)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <h3
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: "var(--text-1, #18181B)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              How Payroll Works Here
              {allReady && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: "#DCFCE7",
                    color: "#15803D",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  Ready to run
                </span>
              )}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-3, #585F5B)",
                margin: "2px 0 0 0",
              }}
            >
              EasyHR automates your monthly cycle in four clear steps without complex spreadsheets.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={onOpenHelp}
            className="btn-neutral btn-sm"
            style={{ fontSize: 11.5, padding: "4px 10px", height: 28 }}
          >
            <HelpCircle size={13} className="mr-4" /> Full Guide
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            title="Dismiss this walkthrough widget"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: "none",
              background: "rgba(0,0,0,0.04)",
              color: "var(--text-4, #6E7571)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 4 Steps visual row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          marginTop: 10,
        }}
      >
        {/* Step 1 */}
        <div
          onClick={() => onNavigateTab("Settings")}
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            padding: "10px 12px",
            border: hasConfig ? "1px solid #BBF7D0" : "1px solid #E9D5FF",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>1. Country & Currency</span>
            {hasConfig ? (
              <CheckCircle2 size={13} style={{ color: "#16A34A" }} />
            ) : (
              <span style={{ fontSize: 10, color: "#D97706", fontWeight: 600 }}>Needs setup</span>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0, lineHeight: 1.35 }}>
            Pick your country, currency, and standard work hours in Settings.
          </p>
        </div>

        {/* Step 2 */}
        <div
          onClick={() => onNavigateTab("Compensation")}
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            padding: "10px 12px",
            border: employeesWithComp > 0 ? "1px solid #BBF7D0" : "1px solid #E9D5FF",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>2. Base Salaries</span>
            {employeesWithComp > 0 ? (
              <span style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 700 }}>
                {employeesWithComp}/{totalEmployees || "—"} set
              </span>
            ) : (
              <span style={{ fontSize: 10, color: "#D97706", fontWeight: 600 }}>Required</span>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0, lineHeight: 1.35 }}>
            Every active employee needs an effective monthly salary record.
          </p>
        </div>

        {/* Step 3 */}
        <div
          onClick={() => onNavigateTab("Rules")}
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            padding: "10px 12px",
            border: hasRules ? "1px solid #BBF7D0" : "1px solid #E9D5FF",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>3. Deductions & Taxes</span>
            {hasRules ? (
              <CheckCircle2 size={13} style={{ color: "#16A34A" }} />
            ) : (
              <span style={{ fontSize: 10, color: "#D97706", fontWeight: 600 }}>Add rules</span>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0, lineHeight: 1.35 }}>
            Progressive income tax brackets (PAYE) and social funds (NSSF).
          </p>
        </div>

        {/* Step 4 */}
        <div
          onClick={() => onNavigateTab("Run Payroll")}
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            padding: "10px 12px",
            border: "1px solid #E9D5FF",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>4. Run & Disburse</span>
            <ChevronRight size={13} style={{ color: "var(--text-4)" }} />
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0, lineHeight: 1.35 }}>
            Calculate net pay, approve the run, and email official paystubs.
          </p>
        </div>
      </div>

      {/* Dismiss tip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px solid rgba(233, 213, 255, 0.6)",
          fontSize: 11.5,
          color: "var(--text-4, #6E7571)",
        }}
      >
        <span>
          💡 Tip: You can review and discard draft runs anytime before final approval without affecting your books.
        </span>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-3)",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: 11,
          }}
        >
          Got it, don't show this banner again
        </button>
      </div>
    </div>
  );
}
