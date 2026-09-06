"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  MessageSquareText,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { PublicFooter, PublicNav } from "@/components/marketing/PublicNav";
import s from "../marketing-pages.module.css";
import p from "./pricing.module.css";
import PricingCard from "@/components/ui/PricingCard";
const plans = [
  {
    name: "Free",
    note: "For small teams getting organized",
    ugx: 0,
    min: "Up to 9 employees",
    features: [
      "People directory & profiles",
      "Org chart",
      "Basic time off",
      "Employee self-service",
      "Company announcements",
    ],
    cta: "Start free",
    tone: "plain",
  },
  {
    name: "Starter",
    note: "Core HR for growing companies",
    ugx: 10000,
    min: "Per employee / month",
    features: [
      "Everything in Free",
      "Attendance & time tracking",
      "Manager approval inbox",
      "Documents & e-signatures",
      "Onboarding checklists",
      "Basic reports",
    ],
    cta: "Try first month free",
    tone: "plain",
  },
  {
    name: "Growth",
    note: "Automation for established teams",
    ugx: 18000,
    min: "Per employee / month",
    features: [
      "Everything in Starter",
      "Payroll & payslips",
      "Shift scheduling",
      "Performance & goals",
      "Hiring & applicant tracking",
      "Custom workflows",
      "Advanced reports",
    ],
    cta: "Try first month free",
    tone: "featured",
  },
  {
    name: "Complete",
    note: "Full people operating system",
    ugx: 28000,
    min: "Per employee / month",
    features: [
      "Everything in Growth",
      "Engagement surveys",
      "Total rewards",
      "Benefits administration",
      "Offboarding controls",
      "Custom roles & permissions",
      "Priority support",
    ],
    cta: "Try first month free",
    tone: "plain",
  },
  {
    name: "Enterprise",
    note: "Complex, regulated, or large teams",
    ugx: null,
    min: "Custom agreement",
    features: [
      "All EasyHR modules",
      "Multiple legal entities",
      "Custom integrations & SSO",
      "Migration assistance",
      "Dedicated success manager",
      "Custom SLA & security review",
    ],
    cta: "Talk to us",
    tone: "dark",
  },
];
const moduleRows = [
  ["People records, directory & org chart", true, true, true, true],
  ["Time off & manager approvals", "Basic", true, true, true],
  ["Attendance & time tracking", false, true, true, true],
  ["Documents, signatures & onboarding", false, true, true, true],
  ["Payroll, payslips & shifts", false, false, true, true],
  ["Hiring, performance & goals", false, false, true, true],
  ["Engagement, benefits & rewards", false, false, false, true],
  ["Custom workflows & advanced permissions", false, false, false, true],
];
export default function Pricing() {
  const [currency, setCurrency] = useState("UGX");
  const [annual, setAnnual] = useState(false);
  const convert = (ugx: number | null) => {
    if (ugx === null) return "Custom";
    const value = annual ? ugx * 0.85 : ugx;
    if (currency === "UGX") return `UGX ${Math.round(value).toLocaleString()}`;
    if (currency === "USD") return `$${Math.max(0, Math.round(value / 3700))}`;
    return `KES ${Math.round(value / 28).toLocaleString()}`;
  };
  return (
    <div className={s.page}>
      <PublicNav />
      <main>
        <section className={s.hero}>
          <div className={s.eyebrow}>Simple, local-friendly pricing</div>
          <h1>Start free. Pay fairly as your team grows.</h1>
          <p>
            Teams below 10 employees use EasyHR free. Paid plans include the
            first month free, transparent per-employee pricing, and no surprise
            setup fee.
          </p>
          <div className={p.controls}>
            <div>
              {["UGX", "KES", "USD"].map((c) => (
                <button
                  key={c}
                  className={currency === c ? p.active : ""}
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <label>
              <input
                type="checkbox"
                checked={annual}
                onChange={(e) => setAnnual(e.target.checked)}
              />
              <span>Annual billing · save 15%</span>
            </label>
          </div>
        </section>
        <section className={p.planWrap}>
          <div className={p.plans}>
            {plans.map((plan: any) => (
              <PricingCard
                key={plan.name}
                name={plan.name}
                note={plan.note}
                price={plan.ugx === 0 ? "Free" : convert(plan.ugx)}
                min={`${plan.min}${plan.ugx && annual ? " · billed annually" : ""}`}
                features={plan.features}
                tone={plan.tone as any}
                cta={plan.cta}
                href={plan.name === "Enterprise" ? "/auth/sign-up" : "/company/register"}
              />
            ))}
          </div>
          <div className={p.trial}>
            <Sparkles />
            <div>
              <b>Your first paid month is on us.</b>
              <p>
                Configure the workspace, invite employees, run approvals, and
                test included modules before the first charge.
              </p>
            </div>
          </div>
        </section>
        <section className={s.section}>
          <div style={{ textAlign: "center", marginBottom: 35 }}>
            <div className={s.eyebrow}>Module access</div>
            <h2 style={{ fontSize: 42, marginTop: 10 }}>
              Know exactly what each plan unlocks.
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className={s.comparison}>
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Free</th>
                  <th>Starter</th>
                  <th>Growth</th>
                  <th>Complete</th>
                </tr>
              </thead>
              <tbody>
                {moduleRows.map((row) => (
                  <tr key={row[0] as string}>
                    <td>
                      <b>{row[0]}</b>
                    </td>
                    {row.slice(1).map((v, i) => (
                      <td key={i}>
                        {v === true ? (
                          <Check size={16} color="#16a34a" />
                        ) : v === false ? (
                          "—"
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className={p.payments}>
          <div>
            <div className={s.eyebrow}>Flexible billing</div>
            <h2>Pay the way your company works.</h2>
            <p>
              Available methods depend on the company country and billing
              currency. EasyHR shows supported providers during workspace setup.
            </p>
          </div>
          <div className={p.methods}>
            <Method
              icon={<CreditCard />}
              title="Debit or credit card"
              text="Visa, Mastercard and supported international cards"
            />
            <Method
              icon={<Smartphone />}
              title="Mobile money"
              text="MTN MoMo and Airtel Money for Uganda"
            />
            <Method
              icon={<Banknote />}
              title="Bank transfer"
              text="Local or international transfer with invoice reference"
            />
            <Method
              icon={<MessageSquareText />}
              title="Custom invoicing"
              text="Quarterly or annual invoicing for eligible organizations"
            />
          </div>
        </section>
        <section className={s.ctaBlock}>
          <h2>Under 10 employees? Your core EasyHR workspace stays free.</h2>
          <Link href="/company/register">
            Create free company <ArrowRight size={15} />
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
function Method({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article>
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
