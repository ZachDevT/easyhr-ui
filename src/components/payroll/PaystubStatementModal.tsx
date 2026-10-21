"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Printer, X, Building, CheckCircle2, DollarSign } from "lucide-react";
import { formatMoney, shortDate, monthLabel, PayrollPayslip, PayrollRunItem } from "./payrollModel";

interface PaystubStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: PayrollPayslip | (PayrollRunItem & { periodStart?: string; periodEnd?: string; payDate?: string; currency?: string; email?: string }) | null;
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

  const cur = (payslip as any).currency || currency;
  const pStart = (payslip as any).periodStart || "";
  const pEnd = (payslip as any).periodEnd || "";
  const pPayDate = (payslip as any).payDate || "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Pay Statement"
      subtitle={`Payment record for ${payslip.employeeName}`}
      width={680}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }} id="printable-payslip">
        {/* Top Header Card */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: 16,
            borderBottom: "1px solid var(--card-border, #E4E4E7)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--gradient)",
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
            border: "1px solid var(--card-border)",
            fontSize: 12.5,
          }}
        >
          <div>
            <span style={{ color: "var(--text-4)", display: "block", fontSize: 11 }}>Employee Name</span>
            <strong style={{ color: "var(--text-1)", fontSize: 13.5 }}>{payslip.employeeName}</strong>
            {(payslip as any).email && (
              <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{(payslip as any).email}</div>
            )}
          </div>
          <div>
            <span style={{ color: "var(--text-4)", display: "block", fontSize: 11 }}>Currency &amp; Pay Method</span>
            <strong style={{ color: "var(--text-1)", fontSize: 13.5 }}>{cur} (Direct Electronic Transfer)</strong>
            {(payslip as any).deliveryStatus && (
              <div style={{ color: "#16A34A", fontSize: 11.5, textTransform: "capitalize" }}>
                Status: {(payslip as any).deliveryStatus}
              </div>
            )}
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Earnings */}
          <div
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 10,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#166534", marginBottom: 10 }}>
              Gross Earnings (+)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Base Salary</span>
                <span style={{ fontWeight: 600 }}>{formatMoney(payslip.basePay, cur)}</span>
              </div>
              {payslip.earnings > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-2)" }}>Additional Earnings / Bonuses</span>
                  <span style={{ fontWeight: 600, color: "#16A34A" }}>
                    +{formatMoney(payslip.earnings, cur)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  marginTop: 4,
                  borderTop: "1px solid var(--card-border)",
                  fontWeight: 700,
                }}
              >
                <span>Total Gross Pay</span>
                <span>{formatMoney(payslip.basePay + (payslip.earnings || 0), cur)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 10,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#991B1B", marginBottom: 10 }}>
              Statutory &amp; Company Deductions (-)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Taxes &amp; Statutory Withholdings</span>
                <span style={{ fontWeight: 600, color: "#DC2626" }}>
                  -{formatMoney(payslip.deductions, cur)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  marginTop: 4,
                  borderTop: "1px solid var(--card-border)",
                  fontWeight: 700,
                  color: "#991B1B",
                }}
              >
                <span>Total Deductions</span>
                <span>-{formatMoney(payslip.deductions, cur)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Take-Home Pay Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
            border: "1px solid #A7F3D0",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
              Net Take-Home Pay
            </div>
            <div style={{ fontSize: 11.5, color: "#047857" }}>
              Amount deposited or authorized for disbursement
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#065F46" }}>
            {formatMoney(payslip.netPay, cur)}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button type="button" className="btn-neutral" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              window.print();
            }}
          >
            <Printer size={14} className="mr-6" /> Print / Save PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}
