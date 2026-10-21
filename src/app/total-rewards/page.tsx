"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Award, Gift, Scale, WalletCards, Users, Loader2, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { DataRow, ProgressBar, SectionHeading, SegmentedControl, StatusPill } from "@/components/ui/ModulePrimitives";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";
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

export default function TotalRewardsPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [period, setPeriod] = useState<"Annual" | "Monthly">("Annual");
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [enrollments, setEnrollments] = useState<BenefitEnrollment[]>([]);
  const [compensationList, setCompensationList] = useState<CompensationRecord[]>([]);
  const [payrollConfigs, setPayrollConfigs] = useState<PayrollConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [empsRes, benRes, compRes, configsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/employees?limit=250`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/benefits/enrollments`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/compensation`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/payroll/configurations`, { headers }),
      ]);

      if (empsRes.ok) {
        const eJson = await empsRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
      if (benRes.ok) {
        const bJson = await benRes.json();
        setEnrollments(Array.isArray(bJson) ? bJson : bJson.data || []);
      }
      if (compRes.ok) {
        const cJson = await compRes.json();
        setCompensationList(Array.isArray(cJson) ? cJson : []);
      }
      if (configsRes.ok) {
        const cfgJson = await configsRes.json();
        setPayrollConfigs(Array.isArray(cfgJson) ? cfgJson : []);
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

  // Determine active currency
  const activeCurrency = useMemo(() => {
    if (payrollConfigs.length > 0 && payrollConfigs[0].currency) {
      return payrollConfigs[0].currency;
    }
    if (compensationList.length > 0 && compensationList[0].currency) {
      return compensationList[0].currency;
    }
    return "UGX";
  }, [payrollConfigs, compensationList]);

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

  const totalBenefitsAnnualMinor = useMemo(() => {
    return enrollments.reduce((sum, e) => sum + (e.employerCostMinor || 0) * 12, 0);
  }, [enrollments]);

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

  return (
    <>
      <PageHeader
        title="Total Rewards"
        subtitle="Full transparency into company-wide compensation, benefits contributions, and employee value."
        icon={<Award size={24} />}
        tabs={["Overview", "Statements", "Department allocation"]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: `${period} Total Rewards`,
              value: formatMoney(totalRewardsSpendMinor, activeCurrency),
              description: "Direct salaries + employer benefits",
              icon: <WalletCards size={18} />,
              color: "var(--primary)",
            },
            {
              label: `${period} Base Salaries`,
              value: formatMoney(displayBaseMinor, activeCurrency),
              description: `${employeesWithSalary} of ${employees.length} employees with recorded pay`,
              icon: <Scale size={18} />,
              color: "var(--text-1)",
            },
            {
              label: `${period} Benefits Spend`,
              value: formatMoney(displayBenefitsMinor, activeCurrency),
              description: `${enrollments.length} active benefit policies`,
              icon: <Gift size={18} />,
              color: "var(--primary)",
            },
            {
              label: "Team Members",
              value: employees.length,
              description: "Total active indexed headcount",
              icon: <Users size={18} />,
              color: "var(--text-4)",
            },
          ]}
        />

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 className="animate-spin" size={32} style={{ color: "var(--primary)" }} />
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
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Direct Base Pay</span>
                          <div>
                            <strong style={{ color: "var(--text-1)" }}>{formatMoney(displayBaseMinor, activeCurrency)}</strong>
                            <span style={{ fontSize: 11.5, color: "var(--text-4)", marginLeft: 8 }}>
                              {basePercent}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={basePercent} color="var(--primary)" height={10} />
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Employer Benefits &amp; Health</span>
                          <div>
                            <strong style={{ color: "var(--text-1)" }}>{formatMoney(displayBenefitsMinor, activeCurrency)}</strong>
                            <span style={{ fontSize: 11.5, color: "var(--text-4)", marginLeft: 8 }}>
                              {benefitsPercent}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={benefitsPercent} color="var(--primary)" height={10} />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <SectionHeading
                      title="Pay parity & compliance"
                      description="Proactive compensation visibility across the organization"
                    />
                    <div style={{ padding: 18, borderRadius: 12, background: "var(--primary-tint, #EFF6FF)", marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>Coverage Index</div>
                          <strong style={{ fontSize: 24, color: "var(--text-1)" }}>
                            {employees.length > 0 ? Math.round((employeesWithSalary / employees.length) * 100) : 0}%
                          </strong>
                        </div>
                        <StatusPill tone={employeesWithSalary === employees.length ? "success" : "neutral"}>
                          {employeesWithSalary === employees.length ? "Fully Covered" : "In Progress"}
                        </StatusPill>
                      </div>
                      <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: "8px 0 0 0" }}>
                        {employeesWithSalary === employees.length
                          ? "All active team members have effective compensation records saved."
                          : `${employees.length - employeesWithSalary} employee(s) require base compensation to complete payroll setup.`}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <DataRow
                        leading={<Users size={16} color="var(--primary)" />}
                        title="Active roster indexed"
                        subtitle={`${employees.length} team members monitored`}
                      />
                      <DataRow
                        leading={<Gift size={16} color="var(--primary)" />}
                        title="Active benefit enrollments"
                        subtitle={`${enrollments.length} employer policy enrollments`}
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
                      <Users size={36} style={{ margin: "0 auto 12px", color: "var(--text-4)" }} />
                      <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>No employees in directory</h3>
                      <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 4 }}>Add employees to see individualized total reward statements.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {employees.map((e) => {
                        const comp = employeeSalaryMap.get(e.id);
                        const empMonthlyBaseMinor = comp ? comp.baseAmountMinor : 0;
                        const empEnrollments = enrollments.filter((ben) => ben.employeeId === e.id);
                        const empBenAnnualMinor = empEnrollments.reduce((sum, b) => sum + (b.employerCostMinor || 0) * 12, 0);
                        const empBenMonthlyMinor = Math.round(empBenAnnualMinor / 12);

                        const empBaseMinor = isAnnual ? empMonthlyBaseMinor * 12 : empMonthlyBaseMinor;
                        const empBenMinor = isAnnual ? empBenAnnualMinor : empBenMonthlyMinor;
                        const empTotalMinor = empBaseMinor + empBenMinor;

                        const fullName = `${e.firstName} ${e.lastName}`.trim();

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
                            subtitle={`${e.jobTitle || "Staff"} · ${comp ? (comp.payType === "hourly" ? "Hourly Rate" : "Salaried") : "No Salary Set"} · ${empEnrollments.length} Active Benefit(s)`}
                            meta={
                              <div style={{ minWidth: 200, textAlign: "right" }}>
                                <strong style={{ color: "var(--text-1)", fontSize: 13.5 }}>
                                  {empTotalMinor > 0 ? formatMoney(empTotalMinor, activeCurrency) : "—"}
                                </strong>
                                <div style={{ fontSize: 11, color: "var(--text-4)" }}>
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
                    {Array.from(new Set(employees.map((e) => e.department || "General"))).map((dept) => {
                      const deptEmployees = employees.filter((e) => (e.department || "General") === dept);
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
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{dept}</span>
                            <span style={{ fontSize: 12, color: "var(--text-4)" }}>
                              {count} member{count > 1 ? "s" : ""} · {formatMoney(deptDisplayMinor, activeCurrency)} ({pct}%)
                            </span>
                          </div>
                          <ProgressBar value={pct} color="var(--primary)" />
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
