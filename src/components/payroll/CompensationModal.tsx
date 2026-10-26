"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { DollarSign, Clock, Calendar, Info, Loader2 } from "lucide-react";
import { PayrollEmployee, toMinor, formatMoney } from "./payrollModel";

interface CompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: PayrollEmployee[];
  currency: string;
  country: string;
  defaultEmployeeId?: string;
  overtimeMultiplier?: number;
  holidayMultiplier?: number;
  onSave: (payload: {
    employeeId: string;
    baseAmountMinor: number;
    currency: string;
    country: string;
    effectiveDate: string;
    reason: string;
  }) => Promise<void>;
}

export function CompensationModal({
  isOpen,
  onClose,
  employees,
  currency,
  country,
  defaultEmployeeId,
  overtimeMultiplier = 1.5,
  holidayMultiplier = 2.0,
  onSave,
}: CompensationModalProps) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || (employees[0]?.id || ""));
  const [payModel, setPayModel] = useState<"hourly" | "monthly_salary">("monthly_salary");
  const [rateOrSalary, setRateOrSalary] = useState("");
  const [productiveHours, setProductiveHours] = useState("173.33");
  const [effectiveDate, setEffectiveDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [reason, setReason] = useState("Regular base compensation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live calculation of estimated monthly base
  const calculatedMonthlyTotalMinor = useMemo(() => {
    const val = parseFloat(rateOrSalary);
    if (isNaN(val) || val <= 0) return 0;
    if (payModel === "hourly") {
      const hrs = parseFloat(productiveHours) || 173.33;
      return toMinor(val * hrs);
    }
    return toMinor(val);
  }, [payModel, rateOrSalary, productiveHours]);

  const effectiveHourlyRateMinor = useMemo(() => {
    const val = parseFloat(rateOrSalary);
    if (isNaN(val) || val <= 0) return 0;
    if (payModel === "hourly") return toMinor(val);
    const hrs = parseFloat(productiveHours) || 173.33;
    return toMinor(val / hrs);
  }, [payModel, rateOrSalary, productiveHours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }

    const val = parseFloat(rateOrSalary);
    if (isNaN(val) || val <= 0) {
      setError(`Please enter a valid ${payModel === "hourly" ? "hourly pay rate" : "monthly base salary"} greater than zero.`);
      return;
    }

    if (!effectiveDate) {
      setError("Please pick an effective start date.");
      return;
    }

    const hrs = parseFloat(productiveHours) || 173.33;
    const finalReason =
      payModel === "hourly"
        ? `HOURLY: ${val} ${currency}/hr (${hrs} standard hrs) - ${reason.trim()}`
        : `SALARY: ${val} ${currency}/mo - ${reason.trim()}`;

    try {
      setIsSubmitting(true);
      await onSave({
        employeeId,
        baseAmountMinor: calculatedMonthlyTotalMinor,
        currency,
        country,
        effectiveDate,
        reason: finalReason,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save compensation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Employee Compensation"
      subtitle="Configure hourly pay rates or fixed monthly base salaries for payroll."
      width={520}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#FEF2F2",
              border: "1px solid #FEE2E2",
              borderRadius: 8,
              color: "#DC2626",
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Employee */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Employee <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <select
            className="select"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select employee...
            </option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} {emp.jobTitle ? `(${emp.jobTitle})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Pay Model Selection */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Compensation Model
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              type="button"
              onClick={() => setPayModel("monthly_salary")}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: payModel === "monthly_salary" ? "var(--primary)" : "var(--card-border)",
                background: payModel === "monthly_salary" ? "var(--primary-tint)" : "#FFFFFF",
                color: payModel === "monthly_salary" ? "var(--primary)" : "var(--text-2)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <DollarSign size={14} /> Monthly Salaried
            </button>
            <button
              type="button"
              onClick={() => setPayModel("hourly")}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: payModel === "hourly" ? "var(--primary)" : "var(--card-border)",
                background: payModel === "hourly" ? "var(--primary-tint)" : "#FFFFFF",
                color: payModel === "hourly" ? "var(--primary)" : "var(--text-2)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Clock size={14} /> Hourly Pay Rate
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            {payModel === "hourly" ? `Hourly Pay Rate (${currency})` : `Monthly Base Salary (${currency})`}{" "}
            <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: 10,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-4)",
              }}
            >
              {currency}
            </span>
            <input
              type="number"
              step="any"
              min="1"
              className="input"
              style={{ paddingLeft: currency.length > 3 ? 55 : 46 }}
              placeholder={payModel === "hourly" ? "e.g. 18500" : "e.g. 3500000"}
              value={rateOrSalary}
              onChange={(e) => setRateOrSalary(e.target.value)}
              required
            />
          </div>
          <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
            {payModel === "hourly"
              ? "Base pay rate per productive hour worked."
              : "Fixed monthly compensation before taxes or statutory withholdings."}
          </small>
        </div>

        {/* Standard Monthly Hours */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Standard Monthly Hours
          </label>
          <input
            type="number"
            step="any"
            min="1"
            className="input"
            placeholder="173.33"
            value={productiveHours}
            onChange={(e) => setProductiveHours(e.target.value)}
          />
          <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
            Standard monthly work hours benchmark (Uganda labor standard: 40 hrs/week × 4.33 weeks = 173.33 hrs).
          </small>
        </div>

        {/* Dynamic Calculation Formula Preview */}
        <div
          style={{
            padding: "12px 14px",
            background: "#FAF9F7",
            border: "1px solid var(--card-border)",
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
            Uganda Chargeable Formula Summary
          </div>
          <div style={{ color: "var(--text-2)", marginBottom: 4 }}>
            {payModel === "hourly" ? (
              <>
                <strong>Total Monthly Base</strong> = Pay Rate ({rateOrSalary || 0} {currency}) × Productive Hours ({productiveHours} hrs) ={" "}
                <strong>{formatMoney(calculatedMonthlyTotalMinor, currency)}</strong>
              </>
            ) : (
              <>
                <strong>Monthly Base</strong> = {formatMoney(calculatedMonthlyTotalMinor, currency)} (Equivalent hourly rate:{" "}
                {formatMoney(effectiveHourlyRateMinor, currency)}/hr)
              </>
            )}
          </div>
          <div style={{ color: "var(--text-3)", fontSize: 11 }}>
            • Overtime Hours: calculated dynamically at {overtimeMultiplier}× regular pay rate during payroll review.
            <br />
            • Public Holidays &amp; Sundays: calculated dynamically at {holidayMultiplier}× regular pay rate.
            <br />
            • Chargeable Gross = [Total monthly compensation] + [Bonuses] + [Higher rates] + [Insurance] - [Penalties].
          </div>
        </div>

        {/* Effective Date */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Effective Start Date <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="date"
            className="input"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            required
          />
        </div>

        {/* Reason / Note */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Compensation Memo / Reason
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Annual compensation review, Promotion, New hire offer"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin mr-6" /> Saving...
              </>
            ) : (
              "Save Compensation"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
