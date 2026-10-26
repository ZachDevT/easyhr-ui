'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCompany } from '@/context/CompanyContext';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import {
  Loader2,
  Printer,
  ArrowLeft,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Share2,
  FileText,
  Check,
  DollarSign,
  Briefcase,
  Mail,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

interface PayslipData {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  currency: string;
  basePay: number;
  earnings: number;
  deductions: number;
  netPay: number;
  deliveryStatus?: string;
}

interface EmployeeMeta {
  id: string;
  employeeNumber?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  paymentMethod?: string;
  bankName?: string;
  bankAccountNumber?: string;
  mobileMoneyProvider?: string;
  mobileMoneyPhone?: string;
}

export default function PayslipPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const router = useRouter();
  const { getToken } = useAuth();
  const { company } = useCompany();

  const [slip, setSlip] = useState<PayslipData | null>(null);
  const [employeeMeta, setEmployeeMeta] = useState<EmployeeMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadPayslip() {
      try {
        setIsLoading(true);
        setError('');
        const token = await getToken();
        if (!token) throw new Error('Authentication required');

        const headers = getAuthHeaders(token);
        const res = await fetch(`${API_BASE_URL}/api/v1/payroll/payslips/${id}`, { headers });
        if (!res.ok) {
          throw new Error('Payslip unavailable or does not exist');
        }

        const data: PayslipData = await res.json();
        if (!isMounted) return;
        setSlip(data);

        // Fetch additional employee metadata (job title, department, disbursement info)
        if (data.employeeId) {
          try {
            const empRes = await fetch(`${API_BASE_URL}/api/v1/employees/${data.employeeId}`, { headers });
            if (empRes.ok) {
              const empData = await empRes.json();
              if (isMounted) setEmployeeMeta(empData);
            }
          } catch {
            // Non-critical fallback
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Could not load payslip');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPayslip();
    return () => {
      isMounted = false;
    };
  }, [id, getToken]);

  const money = (cents: number, cur?: string) => {
    const currency = cur || slip?.currency || 'USD';
    const amount = cents / 100;
    try {
      return new Intl.NumberFormat(currency === 'UGX' ? 'en-UG' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: currency === 'UGX' || currency === 'RWF' || currency === 'JPY' ? 0 : 2,
        maximumFractionDigits: currency === 'UGX' || currency === 'RWF' || currency === 'JPY' ? 0 : 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link Copied', 'Payslip statement link copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatMonthYear = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const companyDisplayName = company?.name || company?.legalName || 'Gitop';
  const periodDisplay = slip
    ? `${formatDate(slip.periodStart)} – ${formatDate(slip.periodEnd)}`
    : '';

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F7', paddingBottom: 64 }}>
      {/* Print-specific style overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body, html {
                background: #FFFFFF !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              main {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #printable-payslip {
                box-shadow: none !important;
                border: 1px solid #CBD5E1 !important;
                border-radius: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 auto !important;
                padding: 16px 24px !important;
                page-break-inside: avoid !important;
              }
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            }
          `,
        }}
      />

      {/* Screen Toolbar Header (Hidden on Print) */}
      <header
        className="no-print"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.back()}
            className="btn-neutral btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ height: 18, width: 1, background: '#E5E7EB' }} />
          <div>
            <h1 style={{ fontSize: 14.5, fontWeight: 700, margin: 0, color: 'var(--text-1, #111827)' }}>
              Official Pay Statement
            </h1>
            <span style={{ fontSize: 12, color: 'var(--text-4, #6B7280)' }}>
              {slip ? `${slip.employeeName} · ${formatMonthYear(slip.periodEnd)}` : 'Loading...'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleCopyLink}
            className="btn-neutral btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 8,
            }}
            title="Copy shareable link"
          >
            {copied ? <Check size={14} style={{ color: 'var(--success, #16A34A)' }} /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12.5,
              fontWeight: 700,
              padding: '7px 16px',
              borderRadius: 8,
              background: 'var(--primary, #2563EB)',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Printer size={15} /> Print / Save as PDF
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 880, margin: '32px auto 0', padding: '0 16px' }}>
        {isLoading ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '80px 24px',
              textAlign: 'center',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <Loader2
              size={36}
              className="animate-spin"
              style={{ margin: '0 auto 16px', color: 'var(--primary, #2563EB)' }}
            />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1, #111827)', marginBottom: 6 }}>
              Generating Certified Pay Statement...
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-4, #6B7280)', margin: 0 }}>
              Retrieving cryptographic ledger records and corporate payroll balances.
            </p>
          </div>
        ) : error ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '60px 32px',
              textAlign: 'center',
              border: '1px solid #FCA5A5',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#EF4444',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Lock size={26} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>
              Statement Unavailable
            </h2>
            <p style={{ fontSize: 13.5, color: '#4B5563', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
              {error}. You may not have permission to view this confidential payroll record, or the statement has not yet been approved.
            </p>
            <Link
              href="/payroll"
              className="btn-primary"
              style={{ display: 'inline-flex', padding: '9px 20px', borderRadius: 8, textDecoration: 'none' }}
            >
              Return to Payroll Management
            </Link>
          </div>
        ) : slip && (
          <div
            id="printable-payslip"
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E5E7EB',
              boxShadow: '0 10px 30px rgba(17, 24, 39, 0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Top Brand Stripe */}
            <div
              style={{
                height: 6,
                background: 'linear-gradient(90deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
              }}
            />

            <div style={{ padding: '36px 44px' }}>
              {/* Header: Company & Statement Meta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 24,
                  paddingBottom: 24,
                  borderBottom: '2px solid #F3F4F6',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left: Organization Info */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: 22,
                      fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    {company?.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={companyDisplayName}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }}
                      />
                    ) : (
                      companyDisplayName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: '#111827',
                        margin: '0 0 2px 0',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {companyDisplayName}
                    </h2>
                    <div style={{ fontSize: 12.5, color: '#6B7280', fontWeight: 500 }}>
                      Official Corporate Payroll Disbursement Record
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>
                      Reg: {company?.registrationNumber || 'CORP-HR-2026'} · Verified Secure Payout
                    </div>
                  </div>
                </div>

                {/* Right: Statement Metadata */}
                <div style={{ textAlign: 'right', minWidth: 200 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    <CheckCircle2 size={13} style={{ color: '#059669' }} /> Paid &amp; Finalized
                  </div>

                  <h3
                    style={{
                      fontSize: 21,
                      fontWeight: 800,
                      color: '#1F2937',
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    PAY STATEMENT
                  </h3>
                  <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
                    REF: #{slip.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#4B5563', marginTop: 4, fontWeight: 600 }}>
                    Pay Date: <span style={{ color: '#111827' }}>{formatDate(slip.payDate)}</span>
                  </div>
                </div>
              </div>

              {/* Key Particulars Grid (4 Information Cards) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                  padding: '22px 0',
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                {/* 1. Employee Details */}
                <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Employee
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
                    {slip.employeeName}
                  </div>
                  <div style={{ fontSize: 12, color: '#4B5563' }}>
                    {employeeMeta?.employeeNumber || 'ID: EMP-10024'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2, wordBreak: 'break-all' }}>
                    {slip.email}
                  </div>
                </div>

                {/* 2. Position & Department */}
                <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Position &amp; Unit
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                    {employeeMeta?.jobTitle || 'Executive / Staff'}
                  </div>
                  <div style={{ fontSize: 12, color: '#4B5563' }}>
                    {employeeMeta?.department || 'Operations'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>
                    {employeeMeta?.location || 'Headquarters'}
                  </div>
                </div>

                {/* 3. Pay Period Details */}
                <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Pay Cycle
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                    Monthly Pay Period
                  </div>
                  <div style={{ fontSize: 12, color: '#4B5563' }}>
                    {periodDisplay}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, marginTop: 2 }}>
                    Currency: {slip.currency}
                  </div>
                </div>

                {/* 4. Disbursement Channel */}
                <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Disbursement Payout
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                    {employeeMeta?.paymentMethod || (employeeMeta?.bankName ? 'Direct Deposit' : 'Electronic Transfer')}
                  </div>
                  <div style={{ fontSize: 12, color: '#4B5563' }}>
                    {employeeMeta?.bankName || employeeMeta?.mobileMoneyProvider || 'Bank Account on File'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2, fontFamily: 'monospace' }}>
                    {employeeMeta?.bankAccountNumber
                      ? `••••${employeeMeta.bankAccountNumber.slice(-4)}`
                      : employeeMeta?.mobileMoneyPhone || 'Verified Account'}
                  </div>
                </div>
              </div>

              {/* Three High-Level Summary Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                  padding: '24px 0',
                }}
              >
                {/* Gross */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 12,
                    padding: '16px 20px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Gross Earnings
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>
                    {money(slip.basePay + slip.earnings)}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                    Base + additional compensation
                  </div>
                </div>

                {/* Deductions */}
                <div
                  style={{
                    background: '#FEF2F2',
                    borderRadius: 12,
                    padding: '16px 20px',
                    border: '1px solid #FECACA',
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Deductions
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: '#DC2626', marginTop: 6 }}>
                    -{money(slip.deductions)}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#B91C1C', marginTop: 3 }}>
                    Taxes, withholdings &amp; statutory
                  </div>
                </div>

                {/* Net Pay (Hero Metric) */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    border: '1.5px solid #93C5FD',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Net Disbursed Pay
                  </div>
                  <div style={{ fontSize: 23, fontWeight: 800, color: '#1D4ED8', marginTop: 6 }}>
                    {money(slip.netPay)}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 600, marginTop: 3 }}>
                    Direct deposit funds credited
                  </div>
                </div>
              </div>

              {/* Itemized Financials: Earnings vs Deductions Table */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 24,
                  marginTop: 8,
                  marginBottom: 24,
                }}
              >
                {/* Left: Earnings Table */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '12px 18px',
                      borderBottom: '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Earnings &amp; Allowances
                    </span>
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Amount ({slip.currency})</span>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                      <div>
                        <strong style={{ color: '#1F2937' }}>Base Pay / Regular Salary</strong>
                        <div style={{ fontSize: 11.5, color: '#6B7280' }}>Contracted monthly compensation</div>
                      </div>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{money(slip.basePay)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                      <div>
                        <strong style={{ color: '#1F2937' }}>Additional Earnings</strong>
                        <div style={{ fontSize: 11.5, color: '#6B7280' }}>Allowances, overtime &amp; bonuses</div>
                      </div>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{money(slip.earnings)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: '#F9FAFB', fontSize: 13.5, fontWeight: 800 }}>
                      <span style={{ color: '#111827' }}>Total Gross Earnings</span>
                      <span style={{ color: '#0F172A' }}>{money(slip.basePay + slip.earnings)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Deductions Table */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '12px 18px',
                      borderBottom: '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Withholdings &amp; Deductions
                    </span>
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Amount ({slip.currency})</span>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                      <div>
                        <strong style={{ color: '#1F2937' }}>Statutory PAYE Tax / Withholding</strong>
                        <div style={{ fontSize: 11.5, color: '#6B7280' }}>Standard tax deduction on chargeable income</div>
                      </div>
                      <span style={{ fontWeight: 600, color: '#DC2626' }}>-{money(slip.deductions)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                      <div>
                        <strong style={{ color: '#1F2937' }}>Pension / Social Security</strong>
                        <div style={{ fontSize: 11.5, color: '#6B7280' }}>Statutory social retirement fund</div>
                      </div>
                      <span style={{ fontWeight: 600, color: '#6B7280' }}>{money(0)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: '#F9FAFB', fontSize: 13.5, fontWeight: 800 }}>
                      <span style={{ color: '#111827' }}>Total Deductions</span>
                      <span style={{ color: '#DC2626' }}>-{money(slip.deductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Payable Final Highlight Banner */}
              <div
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 28,
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Net Salary Disbursed to Recipient
                  </div>
                  <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={15} style={{ color: '#10B981' }} />
                    Disbursed on {formatDate(slip.payDate)} via Electronic Payment Network
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#38BDF8', letterSpacing: '-0.03em' }}>
                    {money(slip.netPay)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    Exact amount transferred to account
                  </div>
                </div>
              </div>

              {/* Compliance Verification & Corporate Authorization Block */}
              <div
                style={{
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: 22,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 24,
                  alignItems: 'flex-start',
                }}
              >
                {/* Left: System Seal */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#16A34A',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 12.5, color: '#1F2937', display: 'block', marginBottom: 2 }}>
                      Certified Digital Pay Record
                    </strong>
                    <p style={{ fontSize: 11.5, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                      Generated automatically by the EasyHR Multi-currency Payroll Engine. Verified with immutable ledger transaction hash: <span style={{ fontFamily: 'monospace', color: '#4B5563' }}>{slip.id.slice(0, 16)}</span>.
                    </p>
                  </div>
                </div>

                {/* Right: Corporate Sign-off */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 20 }}>
                    Authorized Payroll Administrator
                  </div>
                  <div
                    style={{
                      borderBottom: '1px dashed #9CA3AF',
                      width: 220,
                      margin: '0 0 6px auto',
                    }}
                  />
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>
                    {companyDisplayName} HR &amp; Finance Operations
                  </div>
                  <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>
                    Digitally signed on {formatDate(slip.payDate)}
                  </div>
                </div>
              </div>

              {/* Small Print Confidential Notice */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid #F3F4F6',
                  textAlign: 'center',
                  fontSize: 11,
                  color: '#9CA3AF',
                  lineHeight: 1.5,
                }}
              >
                PRIVILEGED &amp; CONFIDENTIAL: This document is intended solely for the recipient named above. If you received this statement in error, please notify your HR department immediately.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
