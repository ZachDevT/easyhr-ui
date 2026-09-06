import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { EasyHRLogo } from "../marketing/EasyHRLogo";
import styles from "./auth.module.css";
export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
  asideTitle = "People operations, in one calm workspace.",
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  asideTitle?: string;
}) {
  return (
    <div className={styles.shell}>
      <aside>
        <Link href="/" className={styles.brand} style={{ textDecoration: 'none', marginBottom: 'auto' }}>
          <EasyHRLogo variant="light" />
        </Link>
        <div className={styles.asideCopy}>
          <h2>{asideTitle}</h2>
          <p>
            Manage your team, time, payroll, documents, and growth without the
            operational noise.
          </p>
          <div className={styles.points}>
            <div>
              <Check />
              One secure source of truth
            </div>
            <div>
              <Check />
              The right access for every role
            </div>
          </div>
        </div>
        <div className={styles.asideFoot}>
          EasyHR · Modern people operations
        </div>
      </aside>
      <main>
        <div className={styles.mobileBrand}>
          <Link href="/" className={styles.brand} style={{ textDecoration: 'none' }}>
            <EasyHRLogo />
          </Link>
        </div>
        <div className={styles.formWrap}>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <h1>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
          <div className={styles.secure}>
            <ShieldCheck size={14} /> Secure, encrypted access
          </div>
        </div>
      </main>
    </div>
  );
}
export function AuthField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {hint}
      </span>
      {children}
    </label>
  );
}
export { styles as authStyles };
