"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sliders,
  DollarSign,
  FileText,
  Mail,
  ShieldCheck,
  Building2,
  Building,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Receipt,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface PayrollHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenAssignSalary?: () => void;
  onOpenAddDeduction?: () => void;
  hasConfig: boolean;
  configuredCountry?: string;
  configuredCurrency?: string;
  employeesWithComp: number;
  totalEmployees: number;
  ruleCount: number;
  periodCount: number;
}

export function PayrollHelpModal({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenAssignSalary,
  onOpenAddDeduction,
  hasConfig,
  configuredCountry,
  configuredCurrency,
  employeesWithComp,
  totalEmployees,
  ruleCount,
  periodCount,
}: PayrollHelpModalProps) {
  const [activeSection, setActiveSection] = useState<"checklist" | "steps" | "faqs">("checklist");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const missingCompCount = Math.max(0, totalEmployees - employeesWithComp);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How to Set Up & Run Payroll in EasyHR"
      subtitle="A straightforward guide to getting your company payroll configured, compliant, and running smoothly."
      width={720}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Navigation chips */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 3,
            background: "#F4F4F5",
            borderRadius: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSection("checklist")}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: 8,
              border: "none",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              background: activeSection === "checklist" ? "#FFFFFF" : "transparent",
              color: activeSection === "checklist" ? "var(--primary)" : "var(--text-3)",
              boxShadow: activeSection === "checklist" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Setup Readiness Checklist
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("steps")}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: 8,
              border: "none",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              background: activeSection === "steps" ? "#FFFFFF" : "transparent",
              color: activeSection === "steps" ? "var(--primary)" : "var(--text-3)",
              boxShadow: activeSection === "steps" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Step-by-Step Setup
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("faqs")}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: 8,
              border: "none",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              background: activeSection === "faqs" ? "#FFFFFF" : "transparent",
              color: activeSection === "faqs" ? "var(--primary)" : "var(--text-3)",
              boxShadow: activeSection === "faqs" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Common Questions
          </button>
        </div>

        {/* SECTION 1: CHECKLIST */}
        {activeSection === "checklist" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 4px 0" }}>
              Here is your live payroll readiness status. Once all three steps are active, you can calculate and run payroll anytime.
            </p>

            {/* Check 1: Settings */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1px solid var(--card-border, #E8ECE8)",
                background: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: hasConfig ? "#DCFCE7" : "var(--primary-tint, #EFF6FF)",
                    color: hasConfig ? "#15803D" : "var(--primary, #2563EB)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {hasConfig ? <CheckCircle2 size={18} /> : <Building2 size={18} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>
                      1. Company Payroll Settings
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "1px 8px",
                        borderRadius: 999,
                        background: hasConfig ? "#DCFCE7" : "#F4F4F5",
                        color: hasConfig ? "#15803D" : "var(--text-3)",
                      }}
                    >
                      {hasConfig ? "Configured" : "Setup needed"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {hasConfig
                      ? `Active country: ${configuredCountry} · Currency: ${configuredCurrency}`
                      : "Country, monthly hours, and disbursement currency not saved yet."}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-neutral btn-sm"
                onClick={() => {
                  onClose();
                  onNavigateTab("Settings");
                }}
              >
                {hasConfig ? "Edit Settings" : "Configure Now"}
              </button>
            </div>

            {/* Check 2: Base Salaries */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1px solid var(--card-border, #E8ECE8)",
                background: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: employeesWithComp > 0 && missingCompCount === 0 ? "#DCFCE7" : "var(--primary-tint, #EFF6FF)",
                    color: employeesWithComp > 0 && missingCompCount === 0 ? "#15803D" : "var(--primary, #2563EB)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {employeesWithComp > 0 && missingCompCount === 0 ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <DollarSign size={18} />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>
                      2. Employee Compensation (Hourly / Salaried)
                    </span>
                    {missingCompCount > 0 ? (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "1px 8px",
                          borderRadius: 999,
                          background: "#FEF3C7",
                          color: "#B45309",
                        }}
                      >
                        {missingCompCount} missing
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "1px 8px",
                          borderRadius: 999,
                          background: "#DCFCE7",
                          color: "#15803D",
                        }}
                      >
                        All Assigned
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {employeesWithComp > 0
                      ? `${employeesWithComp} of ${totalEmployees} active employee(s) have pay rates recorded.`
                      : "No employee compensation recorded yet. Supports hourly pay rates and monthly salaries."}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onNavigateTab("Salaries");
                  onOpenAssignSalary?.();
                }}
              >
                <DollarSign size={13} className="mr-4" />
                Assign Salaries
              </button>
            </div>

            {/* Check 3: Statutory Taxes & Deductions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1px solid var(--card-border, #E8ECE8)",
                background: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: ruleCount > 0 ? "#DCFCE7" : "var(--primary-tint, #EFF6FF)",
                    color: ruleCount > 0 ? "#15803D" : "var(--primary, #2563EB)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {ruleCount > 0 ? <CheckCircle2 size={18} /> : <Receipt size={18} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>
                      3. Statutory Taxes &amp; Company Deductions
                    </span>
                    {ruleCount > 0 ? (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "1px 8px",
                          borderRadius: 999,
                          background: "#DCFCE7",
                          color: "#15803D",
                        }}
                      >
                        {ruleCount} Active
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "1px 8px",
                          borderRadius: 999,
                          background: "#F4F4F5",
                          color: "var(--text-3)",
                        }}
                      >
                        Needs rules
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {ruleCount > 0
                      ? `${ruleCount} active statutory rule${ruleCount === 1 ? "" : "s"} configured (PAYE, NSSF, or custom).`
                      : "Add progressive tax (PAYE), pension (NSSF), or company deductions to calculate net pay."}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={ruleCount > 0 ? "btn-neutral btn-sm" : "btn-primary btn-sm"}
                onClick={() => {
                  onClose();
                  onNavigateTab("Deductions & Rules");
                  onOpenAddDeduction?.();
                }}
              >
                <Plus size={13} className="mr-4" />
                {ruleCount > 0 ? "View Rules" : "Add Deduction"}
              </button>
            </div>

            {/* Ready summary */}
            <div
              style={{
                marginTop: 6,
                padding: "12px 16px",
                borderRadius: 10,
                background: "var(--primary-tint, #EFF6FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 12.5, color: "var(--primary)" }}>
                <strong>Ready to run?</strong> Launch the wizard to calculate your team's earnings for this cycle.
              </div>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onNavigateTab("Run Payroll");
                }}
              >
                Start Payroll Wizard <ArrowRight size={13} className="ml-4" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: STEP-BY-STEP */}
        {activeSection === "steps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "12px 14px", background: "#FAF9F7", borderRadius: 10, border: "1px solid var(--card-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  1
                </span>
                <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>Company Settings</strong>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: "4px 0 0 30px", lineHeight: 1.45 }}>
                Under the <strong>Settings</strong> tab, choose your primary country (e.g. Uganda, Kenya, Rwanda) and disbursement currency (e.g. UGX, KES, USD). This ensures tax formulas and paystubs use the correct legal standards.
              </p>
            </div>

            <div style={{ padding: "12px 14px", background: "#FAF9F7", borderRadius: 10, border: "1px solid var(--card-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  2
                </span>
                <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>Set Base Compensation</strong>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: "4px 0 0 30px", lineHeight: 1.45 }}>
                In <strong>Salaries &amp; Compensation</strong>, make sure every active staff member has an entered monthly salary. EasyHR uses the most recent effective salary record to calculate their pay for each cycle.
              </p>
            </div>

            <div style={{ padding: "12px 14px", background: "#FAF9F7", borderRadius: 10, border: "1px solid var(--card-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  3
                </span>
                <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>Configure Taxes &amp; Deductions</strong>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: "4px 0 0 30px", lineHeight: 1.45 }}>
                Under <strong>Deductions &amp; Rules</strong>, activate statutory income taxes (e.g. PAYE bracket formula) and social security (e.g. 5% employee NSSF). You can also add custom flat percentage or fixed monthly company deductions.
              </p>
            </div>

            <div style={{ padding: "12px 14px", background: "#FAF9F7", borderRadius: 10, border: "1px solid var(--card-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  4
                </span>
                <strong style={{ fontSize: 13.5, color: "var(--text-1)" }}>Run Payroll, Approve, and Disburse</strong>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: "4px 0 0 30px", lineHeight: 1.45 }}>
                Open <strong>Run Payroll</strong>. EasyHR calculates gross, deductions, and net pay for the period. Review the draft, discard if you need adjustments, or click <strong>Approve &amp; Lock</strong> to generate paystubs and optionally email them directly to your team.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: FAQS */}
        {activeSection === "faqs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                q: "What happens if an employee has no salary recorded?",
                a: "The backend payroll engine requires every active employee in the organization to have an effective compensation record before running payroll. If anyone is missing a salary, EasyHR will highlight them so you can assign their salary in seconds.",
              },
              {
                q: "Can I discard a payroll run if I spot an error?",
                a: "Yes! Any run in 'Calculated' or 'Draft' status can be discarded with one click. Its period returns to draft so you can update compensation or rules and rerun immediately.",
              },
              {
                q: "How does EasyHR calculate progressive tax (like PAYE)?",
                a: "EasyHR applies standard marginal tax brackets. Each slice of income is taxed only at that bracket's percentage, matching official national revenue guidelines (e.g. URA for Uganda).",
              },
              {
                q: "Can employees see their own payslips?",
                a: "Yes. Once a payroll run is approved, payslips are generated. Employees can view their official payslips under their profile (/people/me). Administrators can also toggle employee visibility in the Settings tab anytime.",
              },
              {
                q: "Can I print or download payslips?",
                a: "Yes. You can click 'View Statement' on any employee's payslip to see their full earnings and deduction breakdown and click 'Print / Save PDF'.",
              },
            ].map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: isExpanded ? "#FAF9F7" : "#FFFFFF",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--text-1)",
                      cursor: "pointer",
                    }}
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {isExpanded && (
                    <div
                      style={{
                        padding: "10px 14px",
                        fontSize: 12,
                        color: "var(--text-3)",
                        lineHeight: 1.45,
                        background: "#FFFFFF",
                        borderTop: "1px solid var(--card-border)",
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close Guide
          </button>
        </div>
      </div>
    </Modal>
  );
}
