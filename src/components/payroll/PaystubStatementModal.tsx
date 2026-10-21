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
  } | null;
  currency: string;
  companyName?: string;
}

export function PaystubStatementModal({
  isOpen,
  onClose,
  payslip,
  currency,
  companyName = "EasyHR",
}: PaystubStatementModalProps) {
  if (!payslip) return null;

  const cur = payslip.currency || currency;
  const pStart = payslip.periodStart || "";
  const pEnd = payslip.periodEnd || "";
  const pPayDate = payslip.payDate || "";

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
            borderBottom: "1px solid var(--card-border, #E8ECE8)",
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
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--text-1)" }}>
                {companyName}
              </h3>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: "4px 0 0 0" }}>
              Corporate Payroll Disbursement Statement
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <Badge variant="success">PAYSLIP FINALIZED</Badge>
            {pStart && pEnd && (
              <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 4 }}>
                Period: {shortDate(pStart)} – {shortDate(pEnd)}
              </div>
            )}
            {pPayDate && (
              <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>
                Pay Date: {shortDate(pPayDate)}
              </div>
            )}
          </div>
        </div>

        {/* Employee Summary Card */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            padding: "12px 16px",
            background: "#FAF9F7",
            borderRadius: 10,
            border: "1px solid var(--card-border, #E8ECE8)",
            fontSize: 12.5,
          }}
        >
          <div>
            <span style={{ color: "var(--text-4)", display: "block", fontSize: 11 }}>Employee Name</span>
            <strong style={{ color: "var(--text-1)", fontSize: 13.5 }}>{payslip.employeeName}</strong>
            {payslip.email && (
              <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{payslip.email}</div>
            )}
          </div>
          <div>
            <span style={{ color: "var(--text-4)", display: "block", fontSize: 11 }}>Compensation Structure</span>
            <strong style={{ color: "var(--text-1)", fontSize: 13.5 }}>
              {isHourly ? `Hourly (${productiveHours} Productive Hours)` : "Monthly Salaried"}
            </strong>
            <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>
              Disbursement Currency: <strong>{cur}</strong>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Earnings */}
          <div
            style={{
              border: "1px solid var(--card-border, #E8ECE8)",
              borderRadius: 10,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>
              Gross Earnings (+)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>
                  Base Compensation {isHourly && `(${productiveHours} hrs)`}
                </span>
                <span style={{ fontWeight: 600 }}>{formatMoney(payslip.basePay, cur)}</span>
              </div>

              {higherRatesMinor > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-2)" }}>
                    Higher Rates (OT 1.5×, Holidays 2.0×)
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                    +{formatMoney(higherRatesMinor, cur)}
                  </span>
                </div>
              )}

              {bonusesMinor > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-2)" }}>Bonuses &amp; Incentives</span>
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                    +{formatMoney(bonusesMinor, cur)}
                  </span>
                </div>
              )}

              {insuranceMinor > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-2)" }}>Insurance &amp; Allowances</span>
                  <span style={{ fontWeight: 600 }}>
                    +{formatMoney(insuranceMinor, cur)}
                  </span>
                </div>
              )}

              {penaltiesMinor > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-2)" }}>Penalties / Attendance Adjustments</span>
                  <span style={{ fontWeight: 600, color: "#DC2626" }}>
                    -{formatMoney(penaltiesMinor, cur)}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  marginTop: 4,
                  borderTop: "1px solid var(--card-border, #E8ECE8)",
                  fontWeight: 700,
                }}
              >
                <span>Chargeable Gross Total</span>
                <span>{formatMoney(totalGrossPay, cur)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div
            style={{
              border: "1px solid var(--card-border, #E8ECE8)",
              borderRadius: 10,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>
              Statutory Withholdings (-)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>PAYE &amp; National Taxes</span>
                <span style={{ fontWeight: 600, color: "var(--text-1)" }}>
                  -{formatMoney(Math.round(payslip.deductions * 0.8), cur)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>NSSF (5% Employee Pension)</span>
                <span style={{ fontWeight: 600, color: "var(--text-1)" }}>
                  -{formatMoney(Math.round(payslip.deductions * 0.2), cur)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  marginTop: 4,
                  borderTop: "1px solid var(--card-border, #E8ECE8)",
                  fontWeight: 700,
                }}
              >
                <span>Total Statutory Deductions</span>
                <span style={{ color: "#DC2626" }}>-{formatMoney(payslip.deductions, cur)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Take-Home Pay Banner */}
        <div
          style={{
            background: "var(--primary-tint, #EFF6FF)",
            border: "1px solid #BFDBFE",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
              Net Take-Home Pay
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              Amount disbursed via electronic payroll transfer
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>
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
