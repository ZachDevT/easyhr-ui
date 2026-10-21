"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Award, Gift, Scale, WalletCards, Users, Loader2, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { DataRow, ProgressBar, SectionHeading, SegmentedControl, StatusPill } from "@/components/ui/ModulePrimitives";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import { formatMoney, toMajor, CompensationRecord, PayrollConfig } from "@/components/payroll/payrollModel";

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  departmentId?: string;
  avatar?: string;
}

interface BenefitEnrollment {
  id: string;
  employeeId: string;
  employeeName?: string;
  planName: string;
  category: string;
  employerCostMinor: number;
  employeeCostMinor: number;
  currency: string;
}

interface OrgDepartment {
  id: string;
  name: string;
}

export default function TotalRewardsPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [period, setPeriod] = useState<"Annual" | "Monthly">("Annual");
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [enrollments, setEnrollments] = useState<BenefitEnrollment[]>([]);
  const [compensationList, setCompensationList] = useState<CompensationRecord[]>([]);
  const [payrollConfigs, setPayrollConfigs] = useState<PayrollConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = getAuthHeaders(token);

      const [empsRes, benRes, compRes, configsRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/employees?limit=250`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/benefits/enrollments`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/compensation`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/departments`, { headers }).catch(() => null),
      ]);

      if (empsRes && empsRes.ok) {
        const eJson = await empsRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
      if (benRes && benRes.ok) {
        const bJson = await benRes.json();
        setEnrollments(Array.isArray(bJson) ? bJson : bJson.data || []);
      }
      if (compRes && compRes.ok) {
        const cJson = await compRes.json();
        setCompensationList(Array.isArray(cJson) ? cJson : []);
      }
      if (configsRes && configsRes.ok) {
        const cfgJson = await configsRes.json();
        setPayrollConfigs(Array.isArray(cfgJson) ? cfgJson : []);
      }
      if (deptsRes && deptsRes.ok) {
        const dJson = await deptsRes.json();
        setDepartments(Array.isArray(dJson) ? dJson : dJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load total rewards data", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine active currency dynamically from company configuration, saved compensations, or default UGX
  const activeCurrency = useMemo(() => {
    if (payrollConfigs.length > 0 && payrollConfigs[0].currency) {
      return payrollConfigs[0].currency.toUpperCase().trim();
    }
    if (compensationList.length > 0 && compensationList[0].currency) {
      return compensationList[0].currency.toUpperCase().trim();
    }
    return "UGX";
  }, [payrollConfigs, compensationList]);

  // Department name resolver
  const departmentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments) {
      map.set(d.id, d.name);
    }
    return map;
  }, [departments]);

  const resolveDept = useCallback((emp: OrgEmployee) => {
    if (emp.department && emp.department.trim()) return emp.department;
    if (emp.departmentId && departmentNameMap.has(emp.departmentId)) {
      return departmentNameMap.get(emp.departmentId)!;
    }
    return "General & Admin";
  }, [departmentNameMap]);

  // Map employee ID -> latest compensation
  const employeeSalaryMap = useMemo(() => {
    const map = new Map<string, CompensationRecord>();
    for (const c of compensationList) {
      if (!map.has(c.employeeId)) {
        map.set(c.employeeId, c);
      }
    }
    return map;
  }, [compensationList]);

  // Aggregate stats using live data
  const totalBaseMonthlyMinor = useMemo(() => {
    let sum = 0;
    for (const emp of employees) {
      const comp = employeeSalaryMap.get(emp.id);
      if (comp) {
        sum += comp.baseAmountMinor;
      }
    }
    return sum;
  }, [employees, employeeSalaryMap]);

  const totalBaseAnnualMinor = totalBaseMonthlyMinor * 12;

  // Direct employer benefit cost from active enrollments
  const totalEnrollmentsAnnualMinor = useMemo(() => {
    return enrollments.reduce((sum, e) => sum + (e.employerCostMinor || 0) * 12, 0);
  }, [enrollments]);

  // Employer statutory contribution (e.g. 10% Employer NSSF in Uganda if applicable)
  const isUganda = (payrollConfigs[0]?.country || "").toUpperCase() === "UGANDA" || activeCurrency === "UGX";
  const employerStatutoryAnnualMinor = useMemo(() => {
    if (isUganda && totalBaseAnnualMinor > 0) {
      return Math.round(totalBaseAnnualMinor * 0.10); // 10% employer NSSF contribution
    }
    return 0;
  }, [isUganda, totalBaseAnnualMinor]);

  const totalBenefitsAnnualMinor = totalEnrollmentsAnnualMinor + employerStatutoryAnnualMinor;
  const totalBenefitsMonthlyMinor = Math.round(totalBenefitsAnnualMinor / 12);

  const isAnnual = period === "Annual";
  const displayBaseMinor = isAnnual ? totalBaseAnnualMinor : totalBaseMonthlyMinor;
  const displayBenefitsMinor = isAnnual ? totalBenefitsAnnualMinor : totalBenefitsMonthlyMinor;
  const totalRewardsSpendMinor = displayBaseMinor + displayBenefitsMinor;

  const basePercent = totalRewardsSpendMinor > 0 ? Math.round((displayBaseMinor / totalRewardsSpendMinor) * 100) : 0;
  const benefitsPercent = totalRewardsSpendMinor > 0 ? 100 - basePercent : 0;

  const employeesWithSalary = useMemo(() => {
    return employees.filter((e) => employeeSalaryMap.has(e.id)).length;
  }, [employees, employeeSalaryMap]);

  const coveragePercent = employees.length > 0 ? Math.round((employeesWithSalary / employees.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Total Rewards"
        subtitle="Make the full value of compensation, benefits, and incentives visible and easy to understand."
        icon={<Award size={24} />}
        tabs={["Overview", "Statements", "Department allocation"]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "TOTAL INVESTMENT",
              value: formatMoney(totalRewardsSpendMinor, activeCurrency),
              description: `${period} payroll + employer contributions`,
              icon: <WalletCards size={18} />,
              color: "var(--primary, #2563EB)",
            },
            {
              label: "BASE COMPENSATION",
              value: formatMoney(displayBaseMinor, activeCurrency),
              description: `Direct salary payroll (${employeesWithSalary} assigned)`,
              icon: <Scale size={18} />,
              color: "var(--text-1, #111827)",
            },
            {
              label: "BENEFITS CONTRIBUTION",
              value: formatMoney(displayBenefitsMinor, activeCurrency),
              description: isUganda
                ? `${enrollments.length} plan(s) + 10% employer NSSF`
                : `${enrollments.length} employer sponsored policy plans`,
              icon: <Gift size={18} />,
              color: "var(--primary, #2563EB)",
            },
            {
              label: "EMPLOYEES COVERED",
              value: employees.length,
              description: `${coveragePercent}% compensation configured`,
              icon: <Users size={18} />,
              color: "var(--text-4, #9CA3AF)",
            },
          ]}
        />

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 className="animate-spin" size={32} style={{ color: "var(--primary, #2563EB)" }} />
          </div>
        ) : (
          <>
            {tab === "Overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 0.8fr)", gap: 20, marginTop: 20 }}>
                <Card>
                  <CardBody>
                    <SectionHeading
                      title="Reward composition"
                      description="Company-wide investment breakdown"
                      action={<SegmentedControl options={["Annual", "Monthly"]} value={period} onChange={(v) => setPeriod(v as any)} />}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 12 }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2, #374151)" }}>Base Salaries</span>
                          <div>
                            <strong style={{ color: "var(--text-1, #111827)" }}>{formatMoney(displayBaseMinor, activeCurrency)}</strong>
                            <span style={{ fontSize: 11.5, color: "var(--text-4, #9CA3AF)", marginLeft: 8 }}>
                              {basePercent}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={basePercent} color="var(--primary, #2563EB)" height={10} />
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2, #374151)" }}>
                            Employer Benefits &amp; Coverage {isUganda ? "(inc. 10% NSSF)" : ""}
                          </span>
                          <div>
                            <strong style={{ color: "var(--text-1, #111827)" }}>{formatMoney(displayBenefitsMinor, activeCurrency)}</strong>
                            <span style={{ fontSize: 11.5, color: "var(--text-4, #9CA3AF)", marginLeft: 8 }}>
                              {benefitsPercent}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={benefitsPercent} color="var(--primary, #2563EB)" height={10} />
                      </div>

                      {employeesWithSalary < employees.length && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: "#F8FAFC",
                            border: "1px dashed var(--card-border, #E8ECE8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: 12.5,
                          }}
                        >
                          <span style={{ color: "var(--text-2, #4B5563)" }}>
                            {employees.length - employeesWithSalary} team member(s) have unassigned compensation.
                          </span>
                          <Link
                            href="/payroll"
                            style={{
                              color: "var(--primary, #2563EB)",
                              fontWeight: 700,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            Assign in Payroll <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <SectionHeading
                      title="Pay equity & compliance"
                      description="Proactive parity metrics across comparable bands"
                    />
                    <div style={{ padding: 18, borderRadius: 12, background: "var(--primary-tint, #EFF6FF)", marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary, #2563EB)", textTransform: "uppercase" }}>Coverage Index</div>
                          <strong style={{ fontSize: 24, color: "var(--text-1, #111827)" }}>
                            {coveragePercent}%
                          </strong>
                        </div>
                        <StatusPill tone={coveragePercent === 100 ? "success" : "neutral"}>
                          {coveragePercent === 100 ? "Fully Configured" : "In Progress"}
                        </StatusPill>
                      </div>
                      <p style={{ fontSize: 11.5, color: "var(--text-3, #4B5563)", margin: "8px 0 0 0" }}>
                        {coveragePercent === 100
                          ? "All active team members have live compensation records registered in the system."
                          : `${employees.length - employeesWithSalary} team member(s) require base salaries to complete full payroll coverage.`}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <DataRow
                        leading={<Users size={16} color="var(--primary, #2563EB)" />}
                        title="Active roster indexed"
                        subtitle={`${employees.length} team members monitored`}
                      />
                      <DataRow
                        leading={<Gift size={16} color="var(--primary, #2563EB)" />}
                        title="Active benefit enrollments"
                        subtitle={`${enrollments.length} policies active across company`}
                      />
                      <DataRow
                        leading={<ShieldCheck size={16} color="var(--primary, #2563EB)" />}
                        title="Statutory compliance"
                        subtitle={isUganda ? "Uganda URA PAYE & 10% Employer NSSF mapped" : "Statutory withholdings & benefits connected"}
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {tab === "Statements" && (
              <Card style={{ marginTop: 20 }}>
                <CardBody>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <SectionHeading
                      title="Employee Total Reward Statements"
                      description="Itemized breakdown of base salary plus employer-sponsored benefit contributions"
                    />
                    <SegmentedControl options={["Annual", "Monthly"]} value={period} onChange={(v) => setPeriod(v as any)} />
                  </div>
                  {employees.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center" }}>
                      <Users size={36} style={{ margin: "0 auto 12px", color: "var(--text-4, #9CA3AF)" }} />
                      <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1, #111827)" }}>No employees in directory</h3>
                      <p style={{ fontSize: 12, color: "var(--text-4, #9CA3AF)", marginTop: 4 }}>Add employees to see individualized total reward statements.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {employees.map((e) => {
                        const comp = employeeSalaryMap.get(e.id);
                        const empMonthlyBaseMinor = comp ? comp.baseAmountMinor : 0;
                        const empEnrollments = enrollments.filter((ben) => ben.employeeId === e.id);
                        const empBenAnnualMinor = empEnrollments.reduce((sum, b) => sum + (b.employerCostMinor || 0) * 12, 0);
                        const empNssfAnnualMinor = isUganda ? Math.round(empMonthlyBaseMinor * 12 * 0.10) : 0;
                        const totalEmpBenAnnualMinor = empBenAnnualMinor + empNssfAnnualMinor;
                        const totalEmpBenMonthlyMinor = Math.round(totalEmpBenAnnualMinor / 12);

                        const empBaseMinor = isAnnual ? empMonthlyBaseMinor * 12 : empMonthlyBaseMinor;
                        const empBenMinor = isAnnual ? totalEmpBenAnnualMinor : totalEmpBenMonthlyMinor;
                        const empTotalMinor = empBaseMinor + empBenMinor;

                        const fullName = `${e.firstName} ${e.lastName}`.trim();
                        const dept = resolveDept(e);

                        return (
                          <DataRow
                            key={e.id}
                            leading={
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: "50%",
                                  display: "grid",
                                  placeItems: "center",
                                  background: "var(--primary-tint, #EFF6FF)",
                                  color: "var(--primary, #2563EB)",
                                  fontWeight: 700,
                                  fontSize: 12.5,
                                }}
                              >
                                {fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                            }
                            title={fullName}
                            subtitle={`${e.jobTitle || "Staff"} · ${dept} · ${comp ? (comp.payType === "hourly" ? "Hourly Rate" : "Salaried") : "No Salary Set"}`}
                            meta={
                              <div style={{ minWidth: 200, textAlign: "right" }}>
                                <strong style={{ color: "var(--text-1, #111827)", fontSize: 13.5 }}>
                                  {empTotalMinor > 0 ? formatMoney(empTotalMinor, activeCurrency) : "—"}
                                </strong>
                                <div style={{ fontSize: 11, color: "var(--text-4, #9CA3AF)" }}>
                                  {period} total value
                                </div>
                              </div>
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {tab === "Department allocation" && (
              <Card style={{ marginTop: 20 }}>
                <CardBody>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <SectionHeading
                      title="Department Investment Breakdown"
                      description="Total compensation distribution by organizational unit"
                    />
                    <SegmentedControl options={["Annual", "Monthly"]} value={period} onChange={(v) => setPeriod(v as any)} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {Array.from(new Set(employees.map(resolveDept))).map((dept) => {
                      const deptEmployees = employees.filter((e) => resolveDept(e) === dept);
                      const count = deptEmployees.length;

                      let deptMonthlyMinor = 0;
                      for (const emp of deptEmployees) {
                        const comp = employeeSalaryMap.get(emp.id);
                        if (comp) deptMonthlyMinor += comp.baseAmountMinor;
                      }

                      const deptDisplayMinor = isAnnual ? deptMonthlyMinor * 12 : deptMonthlyMinor;
                      const pct = displayBaseMinor > 0 ? Math.round((deptDisplayMinor / displayBaseMinor) * 100) : 0;

                      return (
                        <div key={dept} style={{ paddingBottom: 14, borderBottom: "1px solid var(--card-border, #E8ECE8)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1, #111827)" }}>{dept}</span>
                            <span style={{ fontSize: 12, color: "var(--text-4, #9CA3AF)" }}>
                              {count} member{count > 1 ? "s" : ""} · {formatMoney(deptDisplayMinor, activeCurrency)} ({pct}%)
                            </span>
                          </div>
                          <ProgressBar value={pct} color="var(--primary, #2563EB)" />
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  );
}
