"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Download, Eye, Receipt } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { formatMoney } from "@/components/payroll/payrollModel";

export interface EmployeePayslip {
  id: string;
  employeeId: string;
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

interface EmployeePayslipsTableProps {
  /** Employee whose payslips to load. Omit to load the signed-in user's own payslips. */
  employeeId?: string;
  actions?: React.ReactNode;
}

const fmtDate = (value: string, opts: Intl.DateTimeFormatOptions) => {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, opts);
};

const periodLabel = (slip: EmployeePayslip) => {
  const start = new Date(`${slip.periodStart}T00:00:00`);
  const end = new Date(`${slip.periodEnd}T00:00:00`);
  if (!Number.isNaN(start.getTime()) && start.getMonth() === end.getMonth() && start.getDate() === 1) {
    return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  return `${fmtDate(slip.periodStart, { month: "short", day: "numeric" })} – ${fmtDate(slip.periodEnd, { month: "short", day: "numeric", year: "numeric" })}`;
};

/** Approved payslips from finalized payroll runs (live backend data). */
export function EmployeePayslipsTable({ employeeId, actions }: EmployeePayslipsTableProps) {
  const { getToken } = useAuth();
  const [slips, setSlips] = useState<EmployeePayslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const qs = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : "";
        const res = await fetch(`${API_BASE_URL}/api/v1/payroll/payslips${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.detail || "Could not load payslips");
        if (!cancelled) setSlips(json.data || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load payslips");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, getToken]);

  const latest = slips[0];
  const ytdNet = slips
    .filter((s) => latest && s.periodStart.slice(0, 4) === latest.periodStart.slice(0, 4))
    .reduce((sum, s) => sum + s.netPay, 0);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F0F2", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>Pay statements</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#6E6E73" }}>Issued from approved payroll runs.</p>
        </div>
        {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
      </div>

      {latest && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid #F0F0F2" }}>
          {[
            { label: "Latest net pay", value: formatMoney(latest.netPay, latest.currency) },
            { label: "Last pay date", value: fmtDate(latest.payDate, { month: "short", day: "numeric", year: "numeric" }) },
            { label: `Net pay ${latest.periodStart.slice(0, 4)} YTD`, value: formatMoney(ytdNet, latest.currency) },
          ].map((m, i) => (
            <div key={m.label} style={{ padding: "12px 20px", borderLeft: i ? "1px solid #F0F0F2" : "none" }}>
              <div style={{ fontSize: 11, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", marginTop: 2 }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: "28px 20px", fontSize: 12.5, color: "#86868B", textAlign: "center" }}>Loading pay statements…</div>
      ) : error ? (
        <div style={{ padding: "28px 20px", fontSize: 12.5, color: "#86868B", textAlign: "center" }}>{error}</div>
      ) : slips.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <Receipt size={24} color="#AEAEB2" style={{ margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1D1D1F" }}>No pay statements yet</div>
          <div style={{ fontSize: 12, color: "#86868B", marginTop: 3 }}>Statements appear here once a payroll run is approved.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 640 }}>
            <thead>
              <tr style={{ background: "#FBFBFD", color: "#86868B", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "9px 20px" }}>Pay period</th>
                <th style={{ padding: "9px 12px" }}>Pay date</th>
                <th style={{ padding: "9px 12px", textAlign: "right" }}>Gross</th>
                <th style={{ padding: "9px 12px", textAlign: "right" }}>Deductions</th>
                <th style={{ padding: "9px 12px", textAlign: "right" }}>Net pay</th>
                <th style={{ padding: "9px 20px", textAlign: "right" }} />
              </tr>
            </thead>
            <tbody>
              {slips.map((slip) => (
                <tr key={slip.id} style={{ borderTop: "1px solid #F5F5F7" }}>
                  <td style={{ padding: "11px 20px", fontWeight: 600, color: "#1D1D1F" }}>{periodLabel(slip)}</td>
                  <td style={{ padding: "11px 12px", color: "#6E6E73" }}>{fmtDate(slip.payDate, { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td style={{ padding: "11px 12px", textAlign: "right", color: "#1D1D1F" }}>{formatMoney(slip.basePay + slip.earnings, slip.currency)}</td>
                  <td style={{ padding: "11px 12px", textAlign: "right", color: "#6E6E73" }}>−{formatMoney(slip.deductions, slip.currency)}</td>
                  <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: 700, color: "#1D1D1F" }}>{formatMoney(slip.netPay, slip.currency)}</td>
                  <td style={{ padding: "11px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link href={`/payroll/payslips/${slip.id}`} className="btn-neutral btn-sm" style={btnStyle}>
                      <Eye size={12} /> View
                    </Link>
                    <Link href={`/payroll/payslips/${slip.id}?print=1`} className="btn-neutral btn-sm" style={{ ...btnStyle, marginLeft: 6 }}>
                      <Download size={12} /> PDF
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11.5,
  padding: "4px 10px",
  borderRadius: 7,
  textDecoration: "none",
};
