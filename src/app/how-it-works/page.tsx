import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Settings2,
  UserPlus,
  Users2,
  Zap,
} from "lucide-react";
import { PublicFooter, PublicNav } from "@/components/marketing/PublicNav";
import s from "../marketing-pages.module.css";
const phases = [
  {
    title: "Create your company workspace",
    text: "Register the legal company, country, currency, timezone, workforce size, workspace URL, and owner account.",
    icon: <Building2 />,
  },
  {
    title: "Configure how your company works",
    text: "Set roles, departments, locations, leave policies, work schedules, payroll rules, templates, and approval chains.",
    icon: <Settings2 />,
  },
  {
    title: "Bring in your people",
    text: "Invite employees or import records, assign managers, collect information, and launch guided onboarding journeys.",
    icon: <UserPlus />,
  },
  {
    title: "Automate everyday operations",
    text: "Employees request and update; managers review their teams; HR verifies, governs, and reports across the company.",
    icon: <Zap />,
  },
  {
    title: "Grow with trustworthy insight",
    text: "Track headcount, attendance, leave, payroll, goals, engagement, documents, and workforce changes from one dataset.",
    icon: <Users2 />,
  },
];
export default function HowItWorks() {
  return (
    <div className={s.page}>
      <PublicNav />
      <main>
        <section className={s.hero}>
          <div className={s.eyebrow}>How EasyHR works</div>
          <h1>From a new workspace to a fully connected company.</h1>
          <p>
            EasyHR guides setup in a deliberate order, so every workflow starts
            with clean company data, clear reporting lines, and the right
            access.
          </p>
        </section>
        <section className={s.section}>
          <div style={{ maxWidth: 850, margin: "auto" }}>
            {phases.map((p, i) => (
              <article
                key={p.title}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr",
                  gap: 22,
                  padding: "28px 0",
                  borderBottom: "1px solid #e6e1da",
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background:
                      i === 0 ? "var(--gradient)" : "var(--primary-tint)",
                    color: i === 0 ? "white" : "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {p.icon}
                </div>
                <div>
                  <div className={s.eyebrow}>Phase {i + 1}</div>
                  <h2 style={{ fontSize: 28, margin: "7px 0" }}>{p.title}</h2>
                  <p style={{ color: "#716c64", lineHeight: 1.6 }}>{p.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className={s.band}>
          <div>
            <CheckCircle2 size={35} color="#ce8fff" />
            <h2>Different roles. One operating rhythm.</h2>
            <p>
              Employees handle self-service. Managers make team decisions. HR
              controls policy, sensitive data, and final approvals. Company
              owners control billing and workspace governance.
            </p>
          </div>
          <div className={s.steps}>
            {[
              "Employee: profile, time, leave, documents, notifications",
              "Manager: direct reports, attendance, requests, team reports",
              "HR: company people data, payroll, compliance, analytics",
              "Owner: subscription, security, integrations, administration",
            ].map((x, i) => (
              <div className={s.step} key={x}>
                <b>{i + 1}</b>
                <div>
                  <h3>{x}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className={s.ctaBlock}>
          <h2>
            Your company can be ready to invite employees in one guided setup.
          </h2>
          <Link href="/company/register">
            Create your company <ArrowRight size={15} />
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
