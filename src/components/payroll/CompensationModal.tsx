"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DollarSign, User, Calendar, FileText, Loader2 } from "lucide-react";
import { PayrollEmployee, toMinor } from "./payrollModel";

interface CompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: PayrollEmployee[];
  currency: string;
  country: string;
  defaultEmployeeId?: string;
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
  onSave,
}: CompensationModalProps) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || (employees[0]?.id || ""));
  const [amount, setAmount] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [reason, setReason] = useState("Regular monthly salary");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = parseFloat(amount);
    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid monthly salary amount greater than zero.");
      return;
    }
    if (!effectiveDate) {
      setError("Please pick an effective date.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        employeeId,
        baseAmountMinor: toMinor(num),
        currency,
        country,
        effectiveDate,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save salary.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Employee Salary"
      subtitle="Record the monthly base salary used for payroll calculations."
      width={500}
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

        {/* Monthly Base Salary */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Monthly Base Salary ({currency}) <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: 10,
                fontSize: 12.5,
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
              placeholder="e.g. 3500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
            Gross base pay before taxes or deductions.
          </small>
        </div>

        {/* Effective Date */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Effective Date <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="date"
            className="input"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            required
          />
          <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
            The salary will be applied to any pay cycle whose end date is on or after this date.
          </small>
        </div>

        {/* Reason / Note */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Reason or Adjustment Note
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Annual compensation review, Promotion adjustment"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={14} className="animate-spin mr-6" /> : null}
            Save Compensation
          </button>
        </div>
      </form>
    </Modal>
  );
}
