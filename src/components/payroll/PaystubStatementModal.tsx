"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Printer, Building, FileText } from "lucide-react";
import { formatMoney, shortDate, monthLabel, PayrollPayslip, PayrollRunItem } from "./payrollModel";

interface PaystubStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: (PayrollPayslip | PayrollRunItem) & {
    periodStart?: string;
    periodEnd?: string;
    payDate?: string;
    currency?: string;
    email?: string;
    productiveHours?: number;
    overtimeHours?: number;
    holidayHours?: number;
    higherRatesMinor?: number;
    bonusesMinor?: number;
    penaltiesMinor?: number;
    insuranceMinor?: number;
    payModel?: "hourly" | "monthly_salary";
    hourlyRateMinor?: number;
    overtimeMultiplier?: number;
    holidayMultiplier?: number;
  } | null;
  currency: string;
  companyName?: string;
  overtimeMultiplier?: number;
  holidayMultiplier?: number;
}

export function PaystubStatementModal({
  isOpen,
  onClose,
  payslip,
  currency,
  companyName = "EasyHR",
  overtimeMultiplier = 1.5,
  holidayMultiplier = 2.0,
}: PaystubStatementModalProps) {
  if (!payslip) return null;

  const cur = payslip.currency || currency;
  const pStart = payslip.periodStart || "";
  const pEnd = payslip.periodEnd || "";
  const pPayDate = payslip.payDate || "";
  const activeOtMult = payslip.overtimeMultiplier || overtimeMultiplier || 1.5;
  const activeHolMult = payslip.holidayMultiplier || holidayMultiplier || 2.0;

  const isHourly = payslip.payModel === "hourly";
  const productiveHours = payslip.productiveHours || 173.33;
  const overtimeHours = payslip.overtimeHours || 0;
  const holidayHours = payslip.holidayHours || 0;
  const higherRatesMinor = payslip.higherRatesMinor || 0;
  const bonusesMinor = payslip.bonusesMinor || 0;
  const penaltiesMinor = payslip.penaltiesMinor || 0;
  const insuranceMinor = payslip.insuranceMinor || 0;

  const totalGrossPay = payslip.basePay + (payslip.earnings || 0) + higherRatesMinor + bonusesMinor + insuranceMinor - penaltiesMinor;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Pay Statement"
      subtitle={`Payment record for ${payslip.employeeName}`}
      width={700}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }} id="printable-payslip">
        {/* Top Header Card */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: 16,
            borderBottom: "1px solid #F0F0F2",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--primary, #2563EB)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Building size={16} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1D1D1F" }}>
                {companyName}
              </h3>
            </div>
            <p style={{ fontSize: 12, color: "#86868B", margin: "4px 0 0 0" }}>
              Pay Statement
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#F5F5F7",
                color: "#1D1D1F",
                padding: "3px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary, #2563EB)" }} />
              <span>Paid &amp; Finalized</span>
            </div>
            {pStart && pEnd && (
              <div style={{ fontSize: 11.5, color: "#1D1D1F", fontWeight: 600 }}>
                Period: {shortDate(pStart)} – {shortDate(pEnd)}
              </div>
            )}
            {pPayDate && (
              <div style={{ fontSize: 11, color: "#86868B" }}>
                Pay Date: {shortDate(pPayDate)}
              </div>
            )}
          </div>
        </div>

        {/* Employee Summary Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            padding: "12px 14px",
            background: "#FBFBFD",
            borderRadius: 9,
            border: "1px solid #E5E5EA",
            fontSize: 12.5,
          }}
        >
          <div>
            <span style={{ color: "#86868B", display: "block", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 2 }}>
              Employee
            </span>
            <strong style={{ color: "#1D1D1F", fontSize: 13.5 }}>{payslip.employeeName}</strong>
            {payslip.email && (
              <div style={{ color: "#86868B", fontSize: 11.5 }}>{payslip.email}</div>
            )}
          </div>
          <div>
            <span style={{ color: "#86868B", display: "block", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 2 }}>
              Structure
            </span>
            <strong style={{ color: "#1D1D1F", fontSize: 13.5 }}>
              {isHourly ? `Hourly (${productiveHours} Productive Hours)` : "Monthly Salaried"}
            </strong>
            <div style={{ color: "#86868B", fontSize: 11.5 }}>
              Currency: <strong style={{ color: "#1D1D1F" }}>{cur}</strong>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Earnings */}
          <div
            style={{
              border: "1px solid #E5E5EA",
              borderRadius: 9,
              padding: 12,
              background: "#FFFFFF",
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#1D1D1F", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between" }}>
              <span>Gross Earnings</span>
              <span style={{ color: "#86868B", fontWeight: 500 }}>{cur}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#1D1D1F" }}>
                  Base Pay {isHourly && `(${productiveHours} hrs)`}
                </span>
                <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{formatMoney(payslip.basePay, cur)}</span>
              </div>

              {higherRatesMinor > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#1D1D1F" }}>
                    Higher Rates (OT/Holidays)
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--primary, #2563EB)" }}>
                    +{formatMoney(higherRatesMinor, cur)}
                  </span>
                </div>
              )}

              {bonusesMinor > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#1D1D1F" }}>Bonuses &amp; Incentives</span>
                  <span style={{ fontWeight: 600, color: "var(--primary, #2563EB)" }}>
                    +{formatMoney(bonusesMinor, cur)}
                  </span>
                </div>
              )}

              {insuranceMinor > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#1D1D1F" }}>Insurance &amp; Allowances</span>
                  <span style={{ fontWeight: 600, color: "#1D1D1F" }}>
                    +{formatMoney(insuranceMinor, cur)}
                  </span>
                </div>
              )}

              {penaltiesMinor > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#1D1D1F" }}>Adjustments / Penalties</span>
                  <span style={{ fontWeight: 600, color: "#636366" }}>
                    -{formatMoney(penaltiesMinor, cur)}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  marginTop: 2,
                  borderTop: "1px solid #F0F0F2",
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: "#1D1D1F",
                }}
              >
                <span>Total Gross</span>
                <span>{formatMoney(totalGrossPay, cur)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div
            style={{
              border: "1px solid #E5E5EA",
              borderRadius: 9,
              padding: 12,
              background: "#FFFFFF",
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#1D1D1F", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between" }}>
              <span>Deductions</span>
              <span style={{ color: "#86868B", fontWeight: 500 }}>{cur}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#1D1D1F" }}>PAYE Tax Withholding</span>
                <span style={{ fontWeight: 600, color: "#636366" }}>
                  -{formatMoney(Math.round(payslip.deductions * 0.8), cur)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#1D1D1F" }}>NSSF / Pension</span>
                <span style={{ fontWeight: 600, color: "#636366" }}>
                  -{formatMoney(Math.round(payslip.deductions * 0.2), cur)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  marginTop: 2,
                  borderTop: "1px solid #F0F0F2",
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: "#1D1D1F",
                }}
              >
                <span>Total Deductions</span>
                <span style={{ color: "#636366" }}>-{formatMoney(payslip.deductions, cur)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Take-Home Pay Banner */}
        <div
          style={{
            background: "#FBFBFD",
            border: "1px solid #E5E5EA",
            borderRadius: 10,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--primary, #2563EB)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Net Take-Home Pay
            </div>
            <div style={{ fontSize: 11.5, color: "#86868B", marginTop: 1 }}>
              Disbursed via electronic payroll transfer
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary, #2563EB)", letterSpacing: "-0.03em" }}>
            {formatMoney(payslip.netPay, cur)}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <button
            type="button"
            className="btn-neutral"
            onClick={handlePrint}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Printer size={14} /> Print / Save PDF
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
