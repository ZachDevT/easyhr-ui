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
            gap: 16,
            fontSize: 13,
            lineHeight: 1.5,
            color: "#1D1D1F",
          }}
        >
          {/* Card 1: Calculation Formula */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E5EA",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6E6E73", display: "block", marginBottom: 12 }}>
              Standard Calculation Engine
            </span>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F", marginBottom: 4 }}>
                1. Monthly Base Compensation
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  background: "#F5F5F7",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#1D1D1F",
                  fontWeight: 600,
                }}
              >
                Total Monthly Compensation = Pay Rate × Productive Hours
              </div>
              <p style={{ fontSize: 11.5, color: "#6E6E73", margin: "6px 0 0" }}>
                Effective hourly pay rate applied to actual productive hours worked or contracted standard hours.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F", marginBottom: 4 }}>
                2. Chargeable Income Gross Total
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  background: "#F5F5F7",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#1D1D1F",
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                Chargeable Gross = [Base Compensation] + [Total Bonuses] + [Higher Rates] + [Insurance] - [Penalties]
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#6E6E73" }}>
                <div>• <strong>Higher Rates</strong>: Overtime (1.5× pay rate) + Sunday &amp; Public Holiday (2.0× pay rate).</div>
                <div>• <strong>Bonuses &amp; Penalties</strong>: One-time adjustments configured in employee record.</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F", marginBottom: 4 }}>
                3. Statutory Deductions
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  background: "#F5F5F7",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#1D1D1F",
                  fontWeight: 600,
                }}
              >
                Statutory Deductions = PAYE (Progressive Tax) + NSSF (5% Employee)
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#6E6E73" }}>
                <div>• <strong>PAYE (Uganda Progressive Tax)</strong>: Tiered monthly tax brackets per URA guidelines.</div>
                <div>• <strong>NSSF Employee Pension</strong>: 5% employee pension contribution deducted from gross pay.</div>
                <div>• <strong>NSSF Employer Contribution</strong>: Additional 10% organization contribution.</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F", marginBottom: 4 }}>
                4. Net Take-Home Pay
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  background: "#F5F5F7",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#1D1D1F",
                  fontWeight: 700,
                }}
              >
                Net Pay = Chargeable Gross Total - Statutory Deductions
              </div>
              <p style={{ fontSize: 11.5, color: "#6E6E73", margin: "6px 0 0" }}>
                Disbursed to verified employee payout method (Mobile Money or Bank Account).
              </p>
            </div>
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
