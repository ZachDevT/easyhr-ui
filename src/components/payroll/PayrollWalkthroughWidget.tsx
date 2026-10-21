"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  Sliders,
  DollarSign,
  Receipt,
  FileText,
  Send,
  X,
  HelpCircle,
  ChevronRight,
  Info,
  Building,
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
        background: "#FFFFFF",
        border: "1px solid var(--card-border, #E8ECE8)",
        borderRadius: 16,
        padding: "16px 20px",
        marginBottom: 20,
        position: "relative",
        boxShadow: "0 4px 18px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
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
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--primary, #2563EB)",
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

      {/* 4 Steps visual row adhering to EasyHR colors */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginTop: 10,
        }}
      >
        {/* Step 1: Settings */}
        <div
          onClick={() => onNavigateTab("Settings")}
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: "12px 14px",
            border: "1px solid var(--card-border, #E8ECE8)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--primary, #2563EB)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Sliders size={13} /> 1. Settings &amp; Hours
            </span>
            {hasConfig ? (
              <CheckCircle2 size={14} style={{ color: "#16A34A" }} />
            ) : (
              <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, background: "#F4F4F5", padding: "1px 6px", borderRadius: 4 }}>
                Setup
              </span>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0, lineHeight: 1.4 }}>
            Currency, country tax standards, and monthly hours benchmark.
          </p>
        </div>

        {/* Step 2: Base Salaries */}
        <div
          onClick={() => onNavigateTab("Salaries")}
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: "12px 14px",
            border: "1px solid var(--card-border, #E8ECE8)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--primary, #2563EB)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <DollarSign size={13} /> 2. Pay Rates &amp; Salaries
            </span>
            {employeesWithComp > 0 ? (
              <span style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 700 }}>
                {employeesWithComp}/{totalEmployees || "—"} set
              </span>
            ) : (
              <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, background: "#F4F4F5", padding: "1px 6px", borderRadius: 4 }}>
                Required
              </span>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0, lineHeight: 1.4 }}>
            Hourly rates (Pay rate × hours) or monthly salaried compensation.
          </p>
        </div>

        {/* Step 3: Deductions & Taxes */}
        <div
          onClick={() => onNavigateTab("Deductions & Rules")}
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: "12px 14px",
            border: "1px solid var(--card-border, #E8ECE8)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--primary, #2563EB)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Receipt size={13} /> 3. Deductions &amp; Taxes
            </span>
            {hasRules ? (
              <CheckCircle2 size={14} style={{ color: "#16A34A" }} />
            ) : (
              <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, background: "#F4F4F5", padding: "1px 6px", borderRadius: 4 }}>
                Add rules
              </span>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0, lineHeight: 1.4 }}>
            Progressive income tax (PAYE), pension (NSSF), and company deductions.
          </p>
        </div>

        {/* Step 4: Run & Disburse */}
        <div
          onClick={() => onNavigateTab("Run Payroll")}
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: "12px 14px",
            border: "1px solid var(--card-border, #E8ECE8)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--primary, #2563EB)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Send size={13} /> 4. Run &amp; Disburse
            </span>
            <ChevronRight size={14} style={{ color: "var(--text-4)" }} />
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0, lineHeight: 1.4 }}>
            Review overtime, holiday rates, bonuses, and lock payroll statements.
          </p>
        </div>
      </div>

      {/* Dismiss tip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--card-border, #E8ECE8)",
          fontSize: 11.5,
          color: "var(--text-4, #6E7571)",
        }}
      >
        <span>
          💡 <strong>Tip:</strong> You can review and discard draft runs anytime before final approval without affecting your books.
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
          Dismiss guide
        </button>
      </div>
    </div>
  );
}
