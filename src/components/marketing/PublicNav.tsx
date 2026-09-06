"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import styles from "./public.module.css";
import { EasyHRLogo } from "./EasyHRLogo";

const navLinks = [
  { label: "Platform",     href: "/features"     },
  { label: "How it works", href: "/how-it-works"  },
  { label: "Pricing",      href: "/pricing"       },
];

export function PublicNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header className={`${styles.nav} ${scrolled ? styles.navScrolled : styles.navTransparent}`}>
        <div className={styles.navInner}>
          <Link href="/" aria-label="EasyHR home">
            <EasyHRLogo />
          </Link>

          <nav className={styles.navLinks}>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.navLink} ${pathname === l.href ? styles.navLinkActive : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className={styles.navActions}>
            <Link href="/auth/sign-in" className={styles.navSignIn}>
              Sign in
            </Link>
            <Link href="/company/register" className={styles.navCta}>
              Start free <ArrowRight size={13} />
            </Link>
          </div>

          <button
            className={styles.mobileMenu}
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className={styles.drawer}>
          <div className={styles.drawerInner}>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={styles.drawerLink}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className={styles.drawerActions}>
              <Link href="/auth/sign-in" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/company/register" className={styles.navCta} onClick={() => setOpen(false)}>
                Start free <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Link href="/" aria-label="EasyHR home">
            <EasyHRLogo variant="light" />
          </Link>
          <p className={styles.footerTagline}>
            Modern people operations for<br />growing African and global teams.
          </p>
          <div className={styles.socials}>
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="X / Twitter">𝕏</a>
            <a href="#" aria-label="Instagram">ig</a>
          </div>
        </div>

        <div className={styles.footerColumns}>
          <div className={styles.footerCol}>
            <b>Platform</b>
            <Link href="/features">Core HR</Link>
            <Link href="/features">Time &amp; attendance</Link>
            <Link href="/features">Payroll &amp; rewards</Link>
            <Link href="/features">Performance</Link>
            <Link href="/features">Hiring &amp; onboarding</Link>
          </div>
          <div className={styles.footerCol}>
            <b>Explore</b>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <a href="#security">Security</a>
            <Link href="/careers">Careers</Link>
          </div>
          <div className={styles.footerCol}>
            <b>Company</b>
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Help centre</a>
            <a href="#">Partner with us</a>
          </div>
          <div className={styles.footerCol}>
            <b>Get started</b>
            <Link href="/auth/sign-in">Sign in</Link>
            <Link href="/auth/sign-up">Create account</Link>
            <Link href="/company/register">Create company</Link>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>© 2026 EasyHR Technologies. All rights reserved.</span>
        <div className={styles.footerLegal}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
        </div>
        <b className={styles.footerBuilt}>Built thoughtfully in Africa.</b>
      </div>
    </footer>
  );
}
