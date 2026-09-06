import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  Clock3,
  FileCheck2,
  Fingerprint,
  GitBranch,
  HeartPulse,
  Network,
  ShieldCheck,
  Star,
  Users2,
  WalletCards,
  Zap,
} from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/marketing/PublicNav";
import { HeroSection } from "@/components/marketing/HeroSection";
import styles from "./landing.module.css";

/* eslint-disable react/jsx-key -- static icon tuples are rendered inside elements with stable title keys */
const capabilities = [
  {
    icon: <Users2 />,
    tag: "Core HR",
    title: "One trusted home for every employee.",
    text: "Profiles, documents, roles, departments, org structure and employment history—accurate, secure and always in context.",
    list: [
      "Employee system of record",
      "People directory & org chart",
      "Role-based access",
    ],
    className: styles.violet,
  },
  {
    icon: <Clock3 />,
    tag: "Time & leave",
    title: "Requests move. Balances stay right.",
    text: "Employees request leave, managers decide, HR verifies, and balances update through one transparent workflow.",
    list: [
      "Manager → HR approvals",
      "Attendance & shift planning",
      "Live leave balances",
    ],
    className: styles.peach,
  },
  {
    icon: <WalletCards />,
    tag: "Payroll & rewards",
    title: "Turn approved work into confident payroll.",
    text: "Bring attendance, leave, benefits and compensation together for a cleaner payroll process and clearer employee rewards.",
    list: [
      "Payroll-ready time",
      "Payslips & compensation history",
      "Benefits & total rewards",
    ],
    className: styles.mint,
  },
  {
    icon: <Star />,
    tag: "Performance",
    title: "Help people know where they stand.",
    text: "Goals, feedback, reviews and engagement signals give managers a useful rhythm for developing their teams.",
    list: [
      "Goals & review cycles",
      "1:1s and feedback",
      "Pulse surveys & eNPS",
    ],
    className: styles.blue,
  },
];
const modules = [
  [<BriefcaseBusiness />, "Hiring", "Jobs, candidates, interviews and offers"],
  [
    <GitBranch />,
    "Onboarding",
    "Reusable journeys from signed offer to day one",
  ],
  [
    <CalendarCheck2 />,
    "Time off",
    "Policies, approvals, calendars and balances",
  ],
  [<Clock3 />, "Attendance", "Clocking, timesheets, corrections and shifts"],
  [
    <FileCheck2 />,
    "Documents",
    "Templates, e-signatures, expiry and audit history",
  ],
  [<WalletCards />, "Payroll", "Runs, payslips, benefits and total rewards"],
  [<Star />, "Performance", "Goals, reviews, feedback and development"],
  [<HeartPulse />, "Engagement", "Surveys, eNPS and employee relations"],
  [<BarChart3 />, "Insights", "Scoped reports for managers and HR"],
  [<ShieldCheck />, "Permissions", "Purpose-built access for every role"],
  [<Zap />, "Workflows", "Configurable actions and approval chains"],
  [<Network />, "Organization", "Departments, job architecture and org design"],
];

export default function LandingPage() {
  return (
    <div className={styles.site}>
      <PublicNav />
      <main>
        {/* ── HERO ─────────────────────────────────────── */}
        <HeroSection />

        <section className={styles.proof}>
          <p>One calm workspace for ambitious people teams</p>
          <div>
            <b>ACACIA</b>
            <b>NILEWORKS</b>
            <b>KAMPALA LABS</b>
            <b>SUMMIT</b>
            <b>ORBITAL</b>
          </div>
        </section>

        <section className={styles.problem}>
          <div>
            <span className={styles.kicker}>Your work, connected</span>
            <h2>
              Stop running your company across fifteen disconnected tools.
            </h2>
          </div>
          <p>
            EasyHR turns fragmented people tasks into one clear operating
            rhythm—from the moment someone applies to their last day and every
            milestone between.
          </p>
        </section>

        <section id="solutions" className={styles.capabilities}>
          {capabilities.map((c, i) => (
            <article key={c.title} className={c.className}>
              <div className={styles.capCopy}>
                <div className={styles.capIcon}>{c.icon}</div>
                <span>{c.tag}</span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <ul>
                  {c.list.map((x) => (
                    <li key={x}>
                      <Check />
                      {x}
                    </li>
                  ))}
                </ul>
                <Link href="/features">
                  Explore {c.tag.toLowerCase()} <ArrowRight />
                </Link>
              </div>
              <div className={styles.capVisual}>
                {i === 0 ? (
                  <PeopleVisual />
                ) : i === 1 ? (
                  <ApprovalVisual />
                ) : i === 2 ? (
                  <PayrollVisual />
                ) : (
                  <PerformanceVisual />
                )}
              </div>
            </article>
          ))}
        </section>

        <section className={styles.moduleSection}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>The complete platform</span>
            <h2>
              Everything your people team needs.
              <br />
              <em>Nothing they don&apos;t.</em>
            </h2>
            <p>
              Start with the essentials. Add advanced modules as your company
              grows.
            </p>
          </div>
          <div className={styles.moduleGrid}>
            {modules.map(([icon, title, text]) => (
              <Link href="/features" key={String(title)}>
                <span>{icon}</span>
                <div>
                  <b>{title}</b>
                  <p>{text}</p>
                </div>
                <ArrowRight />
              </Link>
            ))}
          </div>
          <Link href="/features" className={styles.allFeatures}>
            Explore every EasyHR module <ArrowRight />
          </Link>
        </section>

        <section className={styles.humanSection}>
          <div className={styles.humanCopy}>
            <span className={styles.kicker}>Made for real teams</span>
            <h2>HR software people actually want to use.</h2>
            <p>
              Employees get simple self-service. Managers get the context to
              lead. HR gets company-wide control without exposing confidential
              information.
            </p>
            <div className={styles.roleTabs}>
              <article>
                <b>Employee</b>
                <span>Profile, time, requests, documents, directory</span>
              </article>
              <article>
                <b>Manager</b>
                <span>My team, approvals, attendance, team insights</span>
              </article>
              <article>
                <b>HR & Admin</b>
                <span>Company data, policies, payroll, workflows, reports</span>
              </article>
            </div>
            <Link href="/how-it-works">
              See the experience for every role <ArrowRight />
            </Link>
          </div>
        </section>

        <section className={styles.security} id="security">
          <div className={styles.securityIntro}>
            <Fingerprint />
            <span className={styles.kicker}>Designed around trust</span>
            <h2>
              People data is personal.
              <br />
              We treat it that way.
            </h2>
            <p>
              Company isolation, deliberate permissions, auditable workflows and
              role-aware experiences are built into the product foundation.
            </p>
            <Link href="/features">
              Explore security & permissions <ArrowRight />
            </Link>
          </div>
          <div className={styles.securityCards}>
            <article>
              <ShieldCheck />
              <b>Tenant-isolated workspaces</b>
              <p>
                Every company&apos;s people and configuration stay within its own
                secure workspace.
              </p>
            </article>
            <article>
              <Users2 />
              <b>Least-privilege access</b>
              <p>
                Employees, managers and HR see deliberately different levels of
                information.
              </p>
            </article>
            <article>
              <FileCheck2 />
              <b>Complete activity history</b>
              <p>
                Approvals, signatures and sensitive changes remain traceable and
                accountable.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.pricingCta}>
          <div>
            <span>Free for teams under 10</span>
            <h2>A better way to run your people operations starts here.</h2>
            <p>
              Build your workspace, invite your team and try every feature
              included in your plan. Your first paid month is free.
            </p>
          </div>
          <div>
            <Link href="/company/register">
              Start free today <ArrowRight />
            </Link>
            <Link href="/pricing">See simple pricing</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function PeopleVisual() {
  return (
    <div className={styles.peopleVisual}>
      <div className={styles.pvHeader}>
        <b>People</b>
        <button>+ Add employee</button>
      </div>
      {[
        ["AM", "Amina Hassan", "Marketing Manager", "Kampala"],
        ["DK", "David Kimani", "Sales Representative", "Kisumu"],
        ["GO", "Grace Otieno", "Finance Analyst", "Nairobi"],
      ].map((p, i) => (
        <div className={styles.employeeRow} key={p[1]}>
          <i>{p[0]}</i>
          <span>
            <b>{p[1]}</b>
            <small>{p[2]}</small>
          </span>
          <em>{p[3]}</em>
          <strong className={i === 1 ? styles.away : ""}>
            {i === 1 ? "Away" : "Active"}
          </strong>
        </div>
      ))}
    </div>
  );
}
function ApprovalVisual() {
  return (
    <div className={styles.approvalVisual}>
      <header>
        <span>
          <i>DK</i>
          <b>
            David Kimani<small>Sales Representative</small>
          </b>
        </span>
        <em>Manager review</em>
      </header>
      <div className={styles.leaveDates}>
        <span>
          <small>FROM</small>
          <b>14 Sep</b>
        </span>
        <ArrowRight />
        <span>
          <small>TO</small>
          <b>18 Sep</b>
        </span>
        <strong>5 days</strong>
      </div>
      <div className={styles.balance}>
        <span>Vacation balance after approval</span>
        <b>7 days remaining</b>
        <i>
          <em />
        </i>
      </div>
      <footer>
        <button>Decline</button>
        <button>Approve request</button>
      </footer>
    </div>
  );
}
function PayrollVisual() {
  return (
    <div className={styles.payrollVisual}>
      <header>
        <span>September payroll</span>
        <em>Ready for review</em>
      </header>
      <strong>UGX 84,620,000</strong>
      <small>Net pay for 42 employees</small>
      <div>
        {[
          ["Gross pay", "UGX 112.4M", "100%"],
          ["Deductions", "UGX 27.8M", "24%"],
          ["Net pay", "UGX 84.6M", "76%"],
        ].map((x) => (
          <span key={x[0]}>
            <b>{x[0]}</b>
            <i>
              <em style={{ width: x[2] }} />
            </i>
            <small>{x[1]}</small>
          </span>
        ))}
      </div>
      <button>
        Review payroll <ArrowRight />
      </button>
    </div>
  );
}
function PerformanceVisual() {
  return (
    <div className={styles.performanceVisual}>
      <header>
        <div>
          <small>TEAM GOALS</small>
          <b>Q3 progress</b>
        </div>
        <strong>82%</strong>
      </header>
      <div className={styles.goalRing}>
        <span>
          <b>18</b>
          <small>goals on track</small>
        </span>
      </div>
      <div className={styles.goalLegend}>
        <span>
          <i /> On track <b>18</b>
        </span>
        <span>
          <i /> At risk <b>4</b>
        </span>
        <span>
          <i /> Completed <b>9</b>
        </span>
      </div>
    </div>
  );
}
