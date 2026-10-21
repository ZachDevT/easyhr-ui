"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Sparkles, Loader2, Info, TrendingUp, ShieldCheck, HeartPulse, Percent, DollarSign, Layers } from "lucide-react";
import { TaxBand, toMinor, toMajor, formatMoney, Department, Position } from "./payrollModel";

interface TaxRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: string;
  currency: string;
  departments: Department[];
  positions: Position[];
  onSave: (payload: {
    country: string;
    currency: string;
    ruleName: string;
    ruleType: "progressive_tax" | "flat_deduction";
    ratePercent: number;
    amountMinor: number;
    appliesTo: "all_employees" | "department" | "position";
    appliesToId?: string;
    cadence: string;
    bands: TaxBand[];
  }) => Promise<void>;
}

export function TaxRuleModal({
  isOpen,
  onClose,
  country,
  currency,
  departments,
  positions,
  onSave,
}: TaxRuleModalProps) {
  const [ruleName, setRuleName] = useState("");
  const [deductionType, setDeductionType] = useState<"percentage" | "fixed" | "progressive">("percentage");
  const [ratePercent, setRatePercent] = useState("5");
  const [fixedAmount, setFixedAmount] = useState("");
  const [appliesTo, setAppliesTo] = useState<"all_employees" | "department" | "position">("all_employees");
  const [appliesToId, setAppliesToId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progressive tax bands
  const [bands, setBands] = useState<Array<{ upTo: string; rate: string }>>([
    { upTo: "235000", rate: "0" },
    { upTo: "335000", rate: "10" },
    { upTo: "410000", rate: "20" },
    { upTo: "10000000", rate: "30" },
    { upTo: "0", rate: "40" },
  ]);

  const loadUgandaPayePreset = () => {
    setRuleName("PAYE (Income Tax)");
    setDeductionType("progressive");
    setBands([
      { upTo: "235000", rate: "0" },
      { upTo: "335000", rate: "10" },
      { upTo: "410000", rate: "20" },
      { upTo: "10000000", rate: "30" },
      { upTo: "0", rate: "40" }, // 0 = unlimited top bracket
    ]);
  };

  const loadNssfPreset = () => {
    setRuleName("NSSF (Employee 5%)");
    setDeductionType("percentage");
    setRatePercent("5");
  };

  const loadHealthSchemePreset = () => {
    setRuleName("Staff Health Contribution");
    setDeductionType("fixed");
    setFixedAmount("50000");
  };

  const handleAddBand = () => {
    setBands((prev) => [...prev, { upTo: "", rate: "0" }]);
  };

  const handleRemoveBand = (idx: number) => {
    setBands((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = ruleName.trim();
    if (!trimmedName) {
      setError("Please provide a name for this deduction or tax rule.");
      return;
    }

    if (appliesTo !== "all_employees" && !appliesToId) {
      setError(`Please select a specific ${appliesTo} for this rule.`);
      return;
    }

    let ruleType: "progressive_tax" | "flat_deduction" = "flat_deduction";
    let finalRate = 0;
    let finalAmountMinor = 0;
    let finalBands: TaxBand[] = [];

    if (deductionType === "percentage") {
      const p = parseFloat(ratePercent);
      if (isNaN(p) || p <= 0 || p > 100) {
        setError("Percentage deduction must be between 0.1% and 100%.");
        return;
      }
      ruleType = "flat_deduction";
      finalRate = p;
    } else if (deductionType === "fixed") {
      const amt = parseFloat(fixedAmount);
      if (isNaN(amt) || amt <= 0) {
        setError("Fixed monthly amount must be greater than zero.");
        return;
      }
      ruleType = "flat_deduction";
      finalAmountMinor = toMinor(amt);
    } else {
      ruleType = "progressive_tax";
      if (bands.length === 0) {
        setError("Progressive tax requires at least one tax bracket.");
        return;
      }
      for (let i = 0; i < bands.length; i++) {
        const upTo = parseFloat(bands[i].upTo);
        const rate = parseFloat(bands[i].rate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          setError(`Bracket #${i + 1} has an invalid tax rate.`);
          return;
        }
        if (isNaN(upTo) || upTo < 0) {
          setError(`Bracket #${i + 1} has an invalid income ceiling.`);
          return;
        }
        finalBands.push({
          upTo: toMinor(upTo),
          ratePercent: rate,
        });
      }
    }

    try {
      setIsSubmitting(true);
      await onSave({
        country,
        currency,
        ruleName: trimmedName,
        ruleType,
        ratePercent: finalRate,
        amountMinor: finalAmountMinor,
        appliesTo,
        appliesToId: appliesTo === "all_employees" ? "" : appliesToId,
        cadence: "monthly",
        bands: finalBands,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save rule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Deduction or Tax Rule"
      subtitle="Configure statutory payroll withholdings and company deductions."
      width={560}
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

        {/* Quick Presets adhering to EasyHR colors */}
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>
            Quick Templates (1-Click)
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-neutral btn-sm"
              onClick={loadUgandaPayePreset}
              style={{ fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <TrendingUp size={12} style={{ color: "var(--primary)" }} />
              Uganda PAYE (URA Brackets)
            </button>
            <button
              type="button"
              className="btn-neutral btn-sm"
              onClick={loadNssfPreset}
              style={{ fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <ShieldCheck size={12} style={{ color: "var(--primary)" }} />
              NSSF (5% Employee)
            </button>
            <button
              type="button"
              className="btn-neutral btn-sm"
              onClick={loadHealthSchemePreset}
              style={{ fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <HeartPulse size={12} style={{ color: "var(--primary)" }} />
              Staff Health Fixed
            </button>
          </div>
        </div>

        {/* Rule Name */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Rule Name <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. PAYE Income Tax, NSSF Employee, Health Scheme"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            required
          />
        </div>

        {/* Deduction Method with EasyHR primary theme */}
        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Calculation Method
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <button
              type="button"
              onClick={() => setDeductionType("percentage")}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: deductionType === "percentage" ? "var(--primary)" : "var(--card-border)",
                background: deductionType === "percentage" ? "var(--primary-tint)" : "#FFFFFF",
                color: deductionType === "percentage" ? "var(--primary)" : "var(--text-2)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Percent size={13} /> Percentage
            </button>
            <button
              type="button"
              onClick={() => setDeductionType("fixed")}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: deductionType === "fixed" ? "var(--primary)" : "var(--card-border)",
                background: deductionType === "fixed" ? "var(--primary-tint)" : "#FFFFFF",
                color: deductionType === "fixed" ? "var(--primary)" : "var(--text-2)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <DollarSign size={13} /> Fixed Monthly
            </button>
            <button
              type="button"
              onClick={() => setDeductionType("progressive")}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: deductionType === "progressive" ? "var(--primary)" : "var(--card-border)",
                background: deductionType === "progressive" ? "var(--primary-tint)" : "#FFFFFF",
                color: deductionType === "progressive" ? "var(--primary)" : "var(--text-2)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Layers size={13} /> Progressive Brackets
            </button>
          </div>
        </div>

        {/* Dynamic fields based on method */}
        {deductionType === "percentage" && (
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
              Deduction Rate (%)
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                className="input"
                placeholder="e.g. 5"
                value={ratePercent}
                onChange={(e) => setRatePercent(e.target.value)}
                required
              />
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-4)",
                }}
              >
                %
              </span>
            </div>
            <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
              Example: 5% employee NSSF contribution.
            </small>
          </div>
        )}

        {deductionType === "fixed" && (
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
              Monthly Fixed Deduction ({currency})
            </label>
            <input
              type="number"
              step="any"
              min="1"
              className="input"
              placeholder="e.g. 50000"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              required
            />
            <small style={{ color: "var(--text-4)", fontSize: 11.5, marginTop: 4, display: "block" }}>
              Fixed sum subtracted from gross salary each month.
            </small>
          </div>
        )}

        {deductionType === "progressive" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Tax Brackets ({currency})
              </label>
              <button
                type="button"
                className="btn-neutral btn-sm"
                onClick={handleAddBand}
                style={{ fontSize: 11, padding: "3px 8px" }}
              >
                <Plus size={11} className="mr-2" /> Add Bracket
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bands.map((b, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-3)", width: 70 }}>
                    Tier {idx + 1}:
                  </span>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      step="any"
                      className="input"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      placeholder={idx === bands.length - 1 ? "0 (or ceiling)" : "Income ceiling"}
                      value={b.upTo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBands((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, upTo: val } : item))
                        );
                      }}
                    />
                  </div>
                  <div style={{ width: 90, position: "relative" }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      className="input"
                      style={{ padding: "6px 20px 6px 10px", fontSize: 12 }}
                      placeholder="Rate %"
                      value={b.rate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBands((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, rate: val } : item))
                        );
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 8,
                        top: 7,
                        fontSize: 11,
                        color: "var(--text-4)",
                        fontWeight: 700,
                      }}
                    >
                      %
                    </span>
                  </div>
                  {bands.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBand(idx)}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#DC2626",
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <small style={{ color: "var(--text-4)", fontSize: 11, marginTop: 6, display: "block" }}>
              Tip: Enter <strong>0</strong> in the highest tier ceiling to tax all income exceeding the previous tier.
            </small>
          </div>
        )}

        {/* Scope */}
        <div style={{ display: "grid", gridTemplateColumns: appliesTo === "all_employees" ? "1fr" : "1fr 1fr", gap: 12 }}>
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
              Applies To
            </label>
            <select
              className="select"
              value={appliesTo}
              onChange={(e) => {
                setAppliesTo(e.target.value as any);
                setAppliesToId("");
              }}
            >
              <option value="all_employees">All Employees in Company</option>
              <option value="department">Specific Department</option>
              <option value="position">Specific Position</option>
            </select>
          </div>

          {appliesTo === "department" && (
            <div>
              <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                Select Department <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <select
                className="select"
                value={appliesToId}
                onChange={(e) => setAppliesToId(e.target.value)}
                required
              >
                <option value="">Choose department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {appliesTo === "position" && (
            <div>
              <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                Select Position <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <select
                className="select"
                value={appliesToId}
                onChange={(e) => setAppliesToId(e.target.value)}
                required
              >
                <option value="">Choose position...</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.departmentName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={14} className="animate-spin mr-6" /> : null}
            Save Rule
          </button>
        </div>
      </form>
    </Modal>
  );
}
