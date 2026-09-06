import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  FileSignature,
  GitBranch,
  HeartPulse,
  Network,
  ShieldCheck,
  Sparkles,
  Star,
  Users2,
  WalletCards,
} from "lucide-react";
import { PublicFooter, PublicNav } from "@/components/marketing/PublicNav";
import s from "../marketing-pages.module.css";
/* eslint-disable react/jsx-key -- icons are static tuple values; rendered cards use stable titles */
const modules = [
  [
    "Core HR & people",
    "A secure employee system of record with profiles, org structure, departments, roles, history, and custom fields.",
    <Users2 />,
    ["People directory", "Employee profiles", "Org chart", "Departments"],
  ],
  [
    "Hiring & careers",
    "Create jobs, manage candidates, schedule interviews, score applicants, and convert hires into employees.",
    <BriefcaseBusiness />,
    [
      "Applicant tracking",
      "Careers site",
      "Interview scorecards",
      "Offer workflow",
    ],
  ],
  [
    "Onboarding & offboarding",
    "Reusable lifecycle checklists, document collection, tasks, progress, access removal, and exit controls.",
    <GitBranch />,
    ["Preboarding", "Task automation", "Exit checklists", "Asset return"],
  ],
  [
    "Time, attendance & shifts",
    "Clocking, timesheets, manager corrections, scheduling, overtime signals, and payroll-ready hours.",
    <CalendarClock />,
    ["Clock in/out", "Timesheets", "Shift planning", "Attendance"],
  ],
  [
    "Leave & approvals",
    "Employee requests, manager decisions, HR verification, live balances, policies, and team calendars.",
    <HeartPulse />,
    ["PTO & sick leave", "Two-stage approval", "Accruals", "Holiday calendars"],
  ],
  [
    "Payroll & rewards",
    "Uganda-ready payroll workflows, payslips, compensation history, benefits, and total reward statements.",
    <WalletCards />,
    ["Payroll runs", "Payslips", "Benefits", "Total rewards"],
  ],
  [
    "Performance & engagement",
    "Goals, reviews, 1:1s, feedback, surveys, eNPS, and team engagement insights.",
    <Star />,
    ["Review cycles", "Goals", "360 feedback", "Pulse surveys"],
  ],
  [
    "Documents & signatures",
    "Templates, secure files, expiry alerts, e-signatures, audit history, and policy acknowledgement.",
    <FileSignature />,
    ["Document vault", "E-signatures", "Expiry alerts", "Policies"],
  ],
  [
    "Reports & insights",
    "Employee, manager, and HR dashboards with deliberately scoped analytics and exports.",
    <BarChart3 />,
    ["Team reports", "HR analytics", "Exports", "Saved views"],
  ],
  [
    "Roles, security & workflows",
    "Tenant isolation, permission roles, configurable approvals, activity records, and conditional workflows.",
    <ShieldCheck />,
    ["Roles", "Permissions", "Approval inbox", "Audit trail"],
  ],
  [
    "Organization design",
    "Departments, reporting lines, compensation bands, promotions, and workforce structure.",
    <Network />,
    ["Org chart", "Job architecture", "Promotions", "Pay bands"],
  ],
  [
    "Employee experience",
    "Self-service profiles, notifications, onboarding, requests, signatures, and a useful home workspace.",
    <Sparkles />,
    ["Self service", "Notifications", "Mobile-ready", "Role-aware UI"],
  ],
];
export default function Features() {
  return (
    <div className={s.page}>
      <PublicNav />
      <main>
        <section className={s.hero}>
          <div className={s.eyebrow}>The complete platform</div>
          <h1>Every employee moment, thoughtfully connected.</h1>
          <p>
            EasyHR replaces scattered files and disconnected tools with one
            role-aware system spanning the complete employee lifecycle.
          </p>
        </section>
        <section className={s.section}>
          <div className={s.grid}>
            {modules.map(([title, text, icon, tags]) => (
              <article className={s.card} key={title as string}>
                <div>{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className={s.tags}>
                  {(tags as string[]).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className={s.band}>
          <div>
            <div className={s.eyebrow}>Designed as one system</div>
            <h2>Data moves. Busywork disappears.</h2>
            <p>
              A hired candidate becomes an employee record. Onboarding documents
              file themselves. Approved time feeds payroll. Role changes update
              reporting lines and permissions.
            </p>
          </div>
          <div className={s.steps}>
            {[
              "Hire and create the employee record",
              "Onboard with tasks, documents, and signatures",
              "Manage time, leave, pay, performance, and growth",
              "Offboard securely with a complete audit trail",
            ].map((x, i) => (
              <div className={s.step} key={x}>
                <b>{i + 1}</b>
                <div>
                  <h3>{x}</h3>
                  <p>No duplicate entry or disconnected handoff.</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className={s.ctaBlock}>
          <h2>
            Choose the modules your company needs today—and add more as you
            grow.
          </h2>
          <Link href="/pricing">
            Compare plans <ArrowRight size={15} />
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
