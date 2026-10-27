"use client";

import React from "react";
import { X, Calculator, HelpCircle, ShieldCheck, Clock, TrendingUp, AlertCircle } from "lucide-react";

interface CalculationFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  compensationModel?: string;
  payRateDisplay?: string;
}

export function CalculationFormulaModal({
  isOpen,
  onClose,
  compensationModel = "hourly",
  payRateDisplay = "UGX 10,000 / hr",
}: CalculationFormulaModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        transition: "all 0.2s ease-in-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 480,
          maxWidth: "92vw",
          height: "100%",
          background: "#FFFFFF",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          cursor: "default",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E5E5EA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FAFAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(0, 113, 227, 0.08)",
                color: "var(--primary, #0071E3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calculator size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#1D1D1F" }}>
                Compensation Formula
              </h3>
              <p style={{ fontSize: 12, color: "#86868B", margin: "2px 0 0" }}>
                Uganda PAYE &amp; NSSF statutory payroll engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#F5F5F7",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#636366",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Drawer Content */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            fontSize: 13,
            lineHeight: 1.6,
            color: "#1D1D1F",
          }}
        >
          {/* Section 1: Base Compensation */}
          <div
            style={{
              background: "#FAFAFC",
              border: "1px solid #E5E5EA",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Clock size={16} color="var(--primary, #0071E3)" />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B" }}>
                1. Monthly Base Compensation
              </span>
            </div>
            <div style={{ fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>
              {compensationModel.toUpperCase()} Model:
            </div>
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                background: "#FFFFFF",
                border: "1px solid #E5E5EA",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12.5,
                color: "var(--primary, #0071E3)",
                fontWeight: 600,
              }}
            >
              Total Monthly Compensation = Pay Rate × Productive Hours
            </div>
            <p style={{ fontSize: 12, color: "#86868B", margin: "8px 0 0" }}>
              Standard hourly rate applied to approved timesheet hours worked during the pay period.
            </p>
          </div>

          {/* Section 2: Chargeable Gross Total */}
          <div
            style={{
              background: "#FAFAFC",
              border: "1px solid #E5E5EA",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <TrendingUp size={16} color="#34C759" />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B" }}>
                2. Chargeable Gross Total
              </span>
            </div>
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                background: "#FFFFFF",
                border: "1px solid #E5E5EA",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                color: "#1D1D1F",
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              Chargeable Gross Total = [Base Compensation] + [Total Bonuses] + [Higher Rates] + [Insurance] - [Total Penalties]
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#636366" }}>
              <div>• <strong>Total Higher Rates</strong> = (Overtime hours × Pay Rate × 1.5) + (Sunday &amp; Public Holiday hours × Pay Rate × 2.0).</div>
              <div>• <strong>Total Bonuses &amp; Penalties</strong> = Configured under Job section &gt; One-time Adjustments table.</div>
            </div>
          </div>

          {/* Section 3: Statutory Deductions */}
          <div
            style={{
              background: "#FAFAFC",
              border: "1px solid #E5E5EA",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={16} color="#FF9500" />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#86868B" }}>
                3. Statutory Deductions
              </span>
            </div>
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                background: "#FFFFFF",
                border: "1px solid #E5E5EA",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12.5,
                color: "#D70015",
                fontWeight: 600,
              }}
            >
              Statutory Deductions = PAYE + NSSF (5% Employee Pension)
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#636366" }}>
              <div>• <strong>PAYE (Uganda Progressive Tax)</strong>: Tiered monthly tax brackets according to Uganda Revenue Authority regulations.</div>
              <div>• <strong>NSSF Employee Pension</strong>: Exactly 5% of gross earnings deducted from employee pay.</div>
              <div>• <strong>NSSF Employer Contribution</strong>: Organization adds an additional 10% (not deducted from employee pay).</div>
            </div>
          </div>

          {/* Section 4: Net Pay Disbursed */}
          <div
            style={{
              background: "#F5F9FF",
              border: "1px solid rgba(0, 113, 227, 0.2)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--primary, #0071E3)", display: "block", marginBottom: 6 }}>
              4. Net Take-Home Pay
            </span>
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                background: "#FFFFFF",
                border: "1px solid rgba(0, 113, 227, 0.2)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                color: "#1D1D1F",
                fontWeight: 700,
              }}
            >
              Net Pay = Gross Total - Statutory Deductions
            </div>
            <p style={{ fontSize: 12, color: "#636366", margin: "8px 0 0" }}>
              Final verified amount transferred via your configured payout channel (Mobile Money or Direct Bank Deposit).
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E5E5EA",
            background: "#FAFAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11.5, color: "#86868B" }}>
            EasyHR Certified Payroll Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#1D1D1F",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
