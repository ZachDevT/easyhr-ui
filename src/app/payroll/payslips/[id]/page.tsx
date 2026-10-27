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
      <main style={{ maxWidth: 740, margin: '24px auto 0', padding: '0 16px' }}>
        {isLoading ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '60px 24px',
              textAlign: 'center',
              border: '1px solid #E5E5EA',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            <Loader2
              size={32}
              className="animate-spin"
              style={{ margin: '0 auto 14px', color: 'var(--primary, #2563EB)' }}
            />
            <h2 style={{ fontSize: 16, fontWeight: 650, color: '#1D1D1F', marginBottom: 4 }}>
              Loading Pay Statement...
            </h2>
            <p style={{ fontSize: 12.5, color: '#86868B', margin: 0 }}>
              Retrieving statement balances and breakdown details.
            </p>
          </div>
        ) : error ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid #E5E5EA',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#F5F5F7',
                color: '#86868B',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Lock size={20} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', marginBottom: 6 }}>
              Statement Unavailable
            </h2>
            <p style={{ fontSize: 13, color: '#636366', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.5 }}>
              {error}. You may not have permission to view this confidential payroll record, or the statement has not yet been approved.
            </p>
            <Link
              href="/payroll"
              className="btn-neutral"
              style={{ display: 'inline-flex', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 12.5 }}
            >
              Return to Payroll
            </Link>
          </div>
        ) : slip && (
          <div
            id="printable-payslip"
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #E5E5EA',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
              padding: '30px 34px',
            }}
          >
            {/* Header: Company & Statement Reference */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                paddingBottom: 18,
                borderBottom: '1px solid #F0F0F2',
                flexWrap: 'wrap',
              }}
            >
              {/* Left: Organization */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: company?.logoUrl ? '#FFFFFF' : 'var(--primary, #2563EB)',
                    border: company?.logoUrl ? '1px solid #E5E5EA' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 700,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {company?.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={companyDisplayName}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    companyDisplayName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: '#1D1D1F',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {companyDisplayName}
                  </h2>
                  <div style={{ fontSize: 12, color: '#86868B', marginTop: 1 }}>
                    Pay Statement
                  </div>
                </div>
              </div>

              {/* Right: Status, Pay Date & Ref */}
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: '#F5F5F7',
                    color: '#1D1D1F',
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--primary, #2563EB)',
                    }}
                  />
                  <span>Paid &amp; Finalized</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#1D1D1F', fontWeight: 600 }}>
                  Pay Date: {formatDate(slip.payDate)}
                </div>
                <div style={{ fontSize: 11, color: '#86868B', fontFamily: 'monospace', marginTop: 2 }}>
                  Ref: #{slip.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Key Particulars Grid (Typographic, Clean, No Card Boxes) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16,
                padding: '16px 0',
                borderBottom: '1px solid #F0F0F2',
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Employee
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>
                  {slip.employeeName}
                </div>
                <div style={{ fontSize: 11.5, color: '#86868B', marginTop: 1, wordBreak: 'break-all' }}>
                  {employeeMeta?.employeeNumber ? `${employeeMeta.employeeNumber} · ` : ''}{slip.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Role &amp; Unit
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>
                  {employeeMeta?.jobTitle || 'Executive / Staff'}
                </div>
                <div style={{ fontSize: 11.5, color: '#86868B', marginTop: 1 }}>
                  {employeeMeta?.department || 'Operations'} · {employeeMeta?.location || 'Remote'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Pay Period
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>
                  {periodDisplay}
                </div>
                <div style={{ fontSize: 11.5, color: '#86868B', marginTop: 1 }}>
                  Monthly · Currency: {slip.currency}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Disbursement
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>
                  {employeeMeta?.paymentMethod || (employeeMeta?.bankName ? 'Direct Deposit' : 'Electronic Transfer')}
                </div>
                <div style={{ fontSize: 11.5, color: '#86868B', marginTop: 1 }}>
                  {employeeMeta?.bankName || employeeMeta?.mobileMoneyProvider || 'Account on file'}
                  {employeeMeta?.bankAccountNumber && ` · ••••${employeeMeta.bankAccountNumber.slice(-4)}`}
                </div>
              </div>
            </div>

            {/* Apple-Style Financial Summary Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                margin: '18px 0',
                background: '#FBFBFD',
                borderRadius: 10,
                border: '1px solid #E5E5EA',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#86868B' }}>
                    Gross Earnings
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1D1D1F', marginTop: 2 }}>
                    {money(slip.basePay + slip.earnings)}
                  </div>
                </div>

                <div style={{ width: 1, height: 26, background: '#E5E5EA' }} />

                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#86868B' }}>
                    Total Deductions
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#636366', marginTop: 2 }}>
                    -{money(slip.deductions)}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--primary, #2563EB)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Net Disbursed Pay
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary, #2563EB)', letterSpacing: '-0.03em', marginTop: 1 }}>
                  {money(slip.netPay)}
                </div>
              </div>
            </div>

            {/* Financial Breakdown: Side-by-side minimalist ledger */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 24,
                marginBottom: 16,
              }}
            >
              {/* Earnings Column */}
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#1D1D1F',
                    paddingBottom: 7,
                    borderBottom: '1px solid #E5E5EA',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Earnings &amp; Allowances</span>
                  <span style={{ color: '#86868B', fontWeight: 500 }}>{slip.currency}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F5F5F7', fontSize: 12.5 }}>
                  <span style={{ color: '#1D1D1F' }}>Base Pay / Regular Salary</span>
                  <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{money(slip.basePay)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F5F5F7', fontSize: 12.5 }}>
                  <span style={{ color: '#1D1D1F' }}>Additional Earnings &amp; Overtime</span>
                  <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{money(slip.earnings)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 13, fontWeight: 700, color: '#1D1D1F' }}>
                  <span>Total Gross</span>
                  <span>{money(slip.basePay + slip.earnings)}</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#1D1D1F',
                    paddingBottom: 7,
                    borderBottom: '1px solid #E5E5EA',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Withholdings &amp; Taxes</span>
                  <span style={{ color: '#86868B', fontWeight: 500 }}>{slip.currency}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F5F5F7', fontSize: 12.5 }}>
                  <span style={{ color: '#1D1D1F' }}>Statutory PAYE Tax</span>
                  <span style={{ fontWeight: 600, color: '#636366' }}>-{money(slip.deductions)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F5F5F7', fontSize: 12.5 }}>
                  <span style={{ color: '#1D1D1F' }}>Social Security &amp; Pension</span>
                  <span style={{ fontWeight: 600, color: '#86868B' }}>{money(0)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 13, fontWeight: 700, color: '#1D1D1F' }}>
                  <span>Total Deductions</span>
                  <span style={{ color: '#636366' }}>-{money(slip.deductions)}</span>
                </div>
              </div>
            </div>

            {/* Apple-Style Minimal Footer */}
            <div
              style={{
                marginTop: 18,
                paddingTop: 12,
                borderTop: '1px solid #F0F0F2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11,
                color: '#86868B',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                {companyDisplayName} · Official Pay Statement
              </div>
              <div>
                Confidential · Statement #{slip.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
