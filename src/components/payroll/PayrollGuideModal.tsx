"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  Clock,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Receipt,
  Wallet,
  Sparkles,
  Calculator,
  Gift,
  Building,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface PayrollGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmployeeView?: boolean;
}

export function PayrollGuideModal({ isOpen, onClose, isEmployeeView = true }: PayrollGuideModalProps) {
  const [activeTopic, setActiveTopic] = useState<'overview' | 'formula' | 'deductions' | 'faq'>('overview');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How Payroll Works in EasyHR — A Simple Guide"
      subtitle="Clear, jargon-free explanations designed for employees, founders, and managers."
      width={780}
    >
      <div style={{ padding: '4px 0' }}>
        {/* Navigation Topic Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid #E2E8F0',
            paddingBottom: 12,
            marginBottom: 20,
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'overview', label: '1. The 30-Second Big Picture', icon: <Sparkles size={14} /> },
            { id: 'formula', label: '2. The Formula Explained', icon: <Calculator size={14} /> },
            { id: 'deductions', label: '3. Taxes & Deductions', icon: <ShieldCheck size={14} /> },
            { id: 'faq', label: '4. Quick Questions & Answers', icon: <HelpCircle size={14} /> },
          ].map((topic) => {
            const isActive = activeTopic === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => setActiveTopic(topic.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--primary, #2563EB)' : '#F1F5F9',
                  color: isActive ? '#FFFFFF' : '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {topic.icon}
                {topic.label}
              </button>
            );
          })}
        </div>

        {/* TOPIC 1: THE 30-SECOND BIG PICTURE */}
        {activeTopic === 'overview' && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-1)' }}>
                How Your Money is Calculated from Clock-In to Payout
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                You don&apos;t need an accounting degree. EasyHR calculates your pay in 4 straightforward steps:
              </p>
            </div>

            {/* Visual Process Flow */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 24,
                position: 'relative',
              }}
            >
              {/* Step 1 */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#DBEAFE',
                    color: '#1D4ED8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  1
                </div>
                <strong style={{ fontSize: 13, color: 'var(--text-1)' }}>Hours Tracked</strong>
                <span style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>
                  Clock-in/out records measure your productive work (excluding unpaid lunch breaks).
                </span>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  2
                </div>
                <strong style={{ fontSize: 13, color: '#166534' }}>Base Earnings</strong>
                <span style={{ fontSize: 11.5, color: '#15803D', lineHeight: 1.4 }}>
                  Hours × Pay Rate (for Hourly) or your guaranteed monthly salary.
                </span>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  background: '#FEF9C3',
                  border: '1px solid #FDE047',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#FEF08A',
                    color: '#854D0E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  3
                </div>
                <strong style={{ fontSize: 13, color: '#854D0E' }}>+ Extras &amp; Bonuses</strong>
                <span style={{ fontSize: 11.5, color: '#713F12', lineHeight: 1.4 }}>
                  Overtime (1.5×), Holiday pay (2.0×), and one-time bonuses from your Job tab.
                </span>
              </div>

              {/* Step 4 */}
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#D1FAE5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  4
                </div>
                <strong style={{ fontSize: 13, color: '#065F46' }}>= Net Take-Home</strong>
                <span style={{ fontSize: 11.5, color: '#047857', lineHeight: 1.4 }}>
                  Taxes and pension are deducted; the rest is paid to your bank or mobile money!
                </span>
              </div>
            </div>

            {/* Quick visual equation */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px dashed #CBD5E1',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ padding: '4px 10px', background: '#F1F5F9', borderRadius: 6, fontWeight: 700 }}>Base Pay</span>
                <span style={{ color: '#16A34A', fontWeight: 800 }}>+</span>
                <span style={{ padding: '4px 10px', background: '#DCFCE7', color: '#166534', borderRadius: 6, fontWeight: 700 }}>Bonuses &amp; OT</span>
                <span style={{ color: '#64748B', fontWeight: 800 }}>=</span>
                <span style={{ padding: '4px 10px', background: '#DBEAFE', color: '#1E40AF', borderRadius: 6, fontWeight: 700 }}>Gross Pay</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#DC2626', fontWeight: 800 }}>−</span>
                <span style={{ padding: '4px 10px', background: '#FEE2E2', color: '#991B1B', borderRadius: 6, fontWeight: 700 }}>Taxes &amp; Pension</span>
                <span style={{ color: '#64748B', fontWeight: 800 }}>=</span>
                <span style={{ padding: '6px 14px', background: '#16A34A', color: '#FFFFFF', borderRadius: 8, fontWeight: 800, fontSize: 14 }}>
                  💰 Net Take-Home
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TOPIC 2: THE FORMULA EXPLAINED */}
        {activeTopic === 'formula' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-1)' }}>
                Breaking Down the Calculation Formula
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Here is what each term on your profile formula card actually means:
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge variant="primary">Total Monthly Compensation</Badge>
                  <strong style={{ fontSize: 13, color: 'var(--text-1)' }}>Your Base Earnings</strong>
                </div>
                <p style={{ fontSize: 12.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  If you are <strong>Hourly</strong>, this is <code>Pay Rate × Productive Hours worked</code>. If you are <strong>Monthly Salary</strong>, this is your agreed fixed monthly paycheck.
                </p>
              </div>

              <div style={{ padding: 14, background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge variant="success">Total Bonuses</Badge>
                  <strong style={{ fontSize: 13, color: '#166534' }}>Performance, Attendance, or Spiffs</strong>
                </div>
                <p style={{ fontSize: 12.5, color: '#15803D', margin: 0, lineHeight: 1.5 }}>
                  Any one-time bonuses approved in the <strong>Job</strong> tab under <em>One-time Bonuses &amp; Penalties</em>. For example: achieving support ticket targets, zero absences, or discretionary project rewards.
                </p>
              </div>

              <div style={{ padding: 14, background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge variant="primary">Total Higher Rates</Badge>
                  <strong style={{ fontSize: 13, color: '#1D4ED8' }}>Public Holidays &amp; Night Shifts</strong>
                </div>
                <p style={{ fontSize: 12.5, color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
                  When you work on recognized public holidays (paid at double time <strong>2.0×</strong>) or night shifts (an extra <strong>+25%</strong> premium), this additional money is added here.
                </p>
              </div>

              <div style={{ padding: 14, background: '#FEF2F2', borderRadius: 10, border: '1px solid #FEE2E2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge variant="danger">Total Penalties</Badge>
                  <strong style={{ fontSize: 13, color: '#991B1B' }}>Authorized Adjustments</strong>
                </div>
                <p style={{ fontSize: 12.5, color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>
                  Legally permitted deductions like repayments for salary advances, loans, or unexcused unpaid absences recorded in the Job section. Deductions cannot be made without policy and approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOPIC 3: TAXES & DEDUCTIONS */}
        {activeTopic === 'deductions' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-1)' }}>
                Where Does the Deducted Money Go?
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Every deduction complies with statutory laws so your taxes and retirement are fully covered.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <ShieldCheck size={18} style={{ color: '#2563EB' }} />
                  <strong style={{ fontSize: 13.5, color: 'var(--text-1)' }}>PAYE (Income Tax)</strong>
                </div>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  Pay-As-You-Earn is the standard progressive government income tax. Higher earners pay marginal percentages based on the country&apos;s legal tax brackets. EasyHR remits this directly to the revenue authority.
                </p>
              </div>

              <div style={{ padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Building size={18} style={{ color: '#16A34A' }} />
                  <strong style={{ fontSize: 13.5, color: 'var(--text-1)' }}>NSSF / Pension (5%)</strong>
                </div>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  This is <strong>your own retirement savings</strong>. 5% is saved from your gross pay into your national social security account where it earns annual interest until you retire.
                </p>
              </div>
            </div>

            <div style={{ padding: 16, borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Gift size={16} style={{ color: '#16A34A' }} />
                <strong style={{ fontSize: 13, color: '#166534' }}>
                  The 10% Employer Match is Paid on Top of Your Pay
                </strong>
              </div>
              <p style={{ fontSize: 12, color: '#15803D', lineHeight: 1.5, margin: 0 }}>
                The company contributes an additional <strong>10%</strong> into your retirement fund out of its own budget. This employer contribution <em>never</em> reduces your take-home pay; it is a company-paid benefit for you.
              </p>
            </div>
          </div>
        )}

        {/* TOPIC 4: FAQ */}
        {activeTopic === 'faq' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-1)' }}>
                Frequently Asked Questions
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Quick answers to common questions about your payslip.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
              <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: 4 }}>
                  Q: Why is my productive time different from total recorded time?
                </strong>
                <span style={{ color: '#475569', lineHeight: 1.5 }}>
                  A: EasyHR separates active work from meal and rest breaks. Productive hours represent active shift time that is eligible for compensation.
                </span>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: 4 }}>
                  Q: Where do one-time bonuses and penalties come from?
                </strong>
                <span style={{ color: '#475569', lineHeight: 1.5 }}>
                  A: They are recorded by your manager in your <strong>Job</strong> profile tab under &quot;One-time Bonuses &amp; Penalties&quot;. Once approved, they automatically appear on that month&apos;s payslip.
                </span>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: 4 }}>
                  Q: How do I save or print an official PDF payslip?
                </strong>
                <span style={{ color: '#475569', lineHeight: 1.5 }}>
                  A: In your Payslips table, click <strong>View Payslip</strong>, then click the blue <strong>Print / Save PDF</strong> button in the bottom right corner.
                </span>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: 4 }}>
                  Q: Why don&apos;t all employees see the Payslips tab?
                </strong>
                <span style={{ color: '#475569', lineHeight: 1.5 }}>
                  A: An HR Administrator can configure whether standard employees see their Payslips tab in profile settings. HR Admins and Line Managers can always view payslips.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
          <button type="button" className="btn-primary" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </Modal>
  );
}
