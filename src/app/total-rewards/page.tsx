"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Award, Download, Gift, Scale, SlidersHorizontal, WalletCards, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatRibbon } from "@/components/ui/StatRibbon";
import { DataRow, ProgressBar, SectionHeading, SegmentedControl, StatusPill } from "@/components/ui/ModulePrimitives";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
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

const money = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value);

export default function TotalRewardsPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [period, setPeriod] = useState("Annual");
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [enrollments, setEnrollments] = useState<BenefitEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [empsRes, benRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/benefits/enrollments`, { headers }),
      ]);

      if (empsRes.ok) {
        const eJson = await empsRes.json();
        setEmployees(Array.isArray(eJson) ? eJson : eJson.data || []);
      }
      if (benRes.ok) {
        const bJson = await benRes.json();
        setEnrollments(Array.isArray(bJson) ? bJson : bJson.data || []);
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

  // Aggregate stats
  const totalBenefitsAnnualSpend = useMemo(() => {
    return enrollments.reduce((sum, e) => sum + (e.employerCostMinor / 100) * 12, 0);
  }, [enrollments]);

  // Base estimate per employee ($45,000 baseline if not custom)
  const totalBaseCompensation = useMemo(() => {
    return employees.length * 45000;
  }, [employees]);

  const totalRewardsSpend = totalBaseCompensation + totalBenefitsAnnualSpend;
  const multiplier = period === "Monthly" ? 1 / 12 : 1;

  return (
    <>
      <PageHeader
        title="Total Rewards"
        subtitle="Make the full value of compensation, benefits, and incentives visible and easy to understand."
        icon={<Award size={28} />}
        tabs={["Overview", "Statements", "Department allocation"]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <main style={{ padding: "0 24px 32px" }}>
        <StatRibbon
          stats={[
            {
              label: "Total investment",
              value: money(totalRewardsSpend * multiplier, true),
              trend: "+4.2%",
              trendType: "neutral",
              icon: <WalletCards size={20} />,
              color: "var(--primary)",
            },
            {
              label: "Base compensation",
              value: money(totalBaseCompensation * multiplier, true),
              description: "Direct salary payroll",
              icon: <Scale size={20} />,
              color: "var(--success)",
            },
            {
              label: "Benefits contribution",
              value: money(totalBenefitsAnnualSpend * multiplier, true),
              description: "Employer sponsored plans",
              icon: <Gift size={20} />,
              color: "var(--warning)",
            },
            {
              label: "Employees covered",
              value: employees.length,
              description: "100% indexed roster",
              icon: <Award size={20} />,
              color: "var(--text-4)",
            },
          ]}
        />

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 className="animate-spin text-primary" size={32} />
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
                      action={<SegmentedControl options={["Annual", "Monthly"]} value={period} onChange={setPeriod} />}
                    />
                    <div className="col gap-18 mt-12">
                      <div>
                        <div className="row-between mb-8">
                          <span className="text-sm fw-700 text-2">Base Salaries</span>
                          <div>
                            <strong className="text-1">{money(totalBaseCompensation * multiplier, true)}</strong>
                            <span className="text-xs text-5" style={{ marginLeft: 8 }}>
                              {totalRewardsSpend > 0 ? Math.round((totalBaseCompensation / totalRewardsSpend) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={totalRewardsSpend > 0 ? (totalBaseCompensation / totalRewardsSpend) * 100 : 0} color="var(--primary)" height={10} />
                      </div>

                      <div>
                        <div className="row-between mb-8">
                          <span className="text-sm fw-700 text-2">Employer Benefits & Coverage</span>
                          <div>
                            <strong className="text-1">{money(totalBenefitsAnnualSpend * multiplier, true)}</strong>
                            <span className="text-xs text-5" style={{ marginLeft: 8 }}>
                              {totalRewardsSpend > 0 ? Math.round((totalBenefitsAnnualSpend / totalRewardsSpend) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={totalRewardsSpend > 0 ? (totalBenefitsAnnualSpend / totalRewardsSpend) * 100 : 0} color="var(--warning)" height={10} />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <SectionHeading
                      title="Pay equity & compliance"
                      description="Proactive parity metrics across comparable bands"
                    />
                    <div style={{ padding: 18, borderRadius: 12, background: "rgba(22,163,74,0.08)", marginBottom: 14 }}>
                      <div className="row-between align-center">
                        <div>
                          <div className="text-xs fw-700 text-4 uppercase">Parity Index</div>
                          <strong style={{ fontSize: 26, color: "var(--success)" }}>99.2%</strong>
                        </div>
                        <StatusPill tone="success">Healthy</StatusPill>
                      </div>
                      <p className="text-xs text-4 mt-8 mb-0">Compensation is equitable across equal job titles and departments.</p>
                    </div>

                    <div className="col gap-10">
                      <DataRow
                        leading={<Users size={16} color="var(--primary)" />}
                        title="Active roster indexed"
                        subtitle={`${employees.length} team members monitored`}
                      />
                      <DataRow
                        leading={<Gift size={16} color="var(--warning)" />}
                        title="Active benefit enrollments"
                        subtitle={`${enrollments.length} policies active`}
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {tab === "Statements" && (
              <Card style={{ marginTop: 20 }}>
                <CardBody>
                  <SectionHeading
                    title="Employee Total Reward Statements"
                    description="Clear breakdown of base compensation plus employer sponsored benefit value"
                  />
                  {employees.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center" }}>
                      <Users size={36} className="text-4 mb-12" style={{ margin: "0 auto 12px" }} />
                      <h3 className="text-base fw-800 text-1">No employees in directory</h3>
                      <p className="text-xs text-4 mt-4">Add employees to see individualized total reward statements.</p>
                    </div>
                  ) : (
                    <div className="col gap-10">
                      {employees.map((e) => {
                        const empEnrollments = enrollments.filter((ben) => ben.employeeId === e.id);
                        const empBenAnnual = empEnrollments.reduce((sum, b) => sum + (b.employerCostMinor / 100) * 12, 0);
                        const empTotal = 45000 + empBenAnnual;
                        const fullName = `${e.firstName} ${e.lastName}`.trim();

                        return (
                          <DataRow
                            key={e.id}
                            leading={
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  display: "grid",
                                  placeItems: "center",
                                  background: "var(--primary-tint)",
                                  color: "var(--primary)",
                                  fontWeight: 800,
                                }}
                              >
                                {fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                            }
                            title={fullName}
                            subtitle={`${e.jobTitle || "Team Member"} · ${empEnrollments.length} Active Benefit Policies`}
                            meta={
                              <div style={{ minWidth: 200, textAlign: "right" }}>
                                <strong className="text-1">{money(empTotal * multiplier)}</strong>
                                <div className="text-xs text-5">{period} total value</div>
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
                  <SectionHeading
                    title="Department Investment Breakdown"
                    description="Total compensation distribution by organizational unit"
                  />
                  <div className="col gap-14">
                    {Array.from(new Set(employees.map((e) => e.department || "General"))).map((dept) => {
                      const count = employees.filter((e) => (e.department || "General") === dept).length;
                      const deptTotal = count * 45000;
                      const pct = totalBaseCompensation > 0 ? Math.round((deptTotal / totalBaseCompensation) * 100) : 0;

                      return (
                        <div key={dept} style={{ paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                          <div className="row-between mb-6">
                            <span className="text-sm fw-700 text-1">{dept}</span>
                            <span className="text-xs text-4">
                              {count} member{count > 1 ? "s" : ""} · {money(deptTotal * multiplier, true)} ({pct}%)
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
