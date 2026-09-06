"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./hero.module.css";

/* ── 4 rotating hero states ─────────────────────────────────── */
const SLIDES = [
  {
    static: "Your people deserve\nbetter than",
    phrase: "HR admin.",
    desc: "EasyHR is the people operating system that connects hiring, time, payroll, performance and every employee moment — without the spreadsheet chaos.",
  },
  {
    static: "Stop running your company\nacross",
    phrase: "disconnected tools.",
    desc: "One calm workspace replaces your fragmented stack — approvals, attendance, payroll and performance all talk to each other automatically.",
  },
  {
    static: "Pay your team confidently,",
    phrase: "every single month.",
    desc: "Attendance, leave and compensation flow together into a clean payroll process — no manual reconciliation, no surprises on payday.",
  },
  {
    static: "Give every manager the context",
    phrase: "to lead well.",
    desc: "Goals, reviews, engagement signals and team data give managers a clear rhythm for developing and retaining the people they lead.",
  },
];

const TYPE_SPEED = 48;   // ms per char typed
const ERASE_SPEED = 28;  // ms per char erased
const HOLD_MS = 2200;    // pause after fully typed
const GAP_MS = 380;      // pause after fully erased

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "hold" | "erasing" | "gap">("typing");
  const [descVisible, setDescVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phrase = SLIDES[index].phrase;
  const desc = SLIDES[index].desc;

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (phase === "typing") {
      if (displayed.length < phrase.length) {
        timer.current = setTimeout(() => {
          setDisplayed(phrase.slice(0, displayed.length + 1));
        }, TYPE_SPEED);
      } else {
        timer.current = setTimeout(() => setPhase("hold"), HOLD_MS);
      }
    } else if (phase === "hold") {
      setDescVisible(false);
      timer.current = setTimeout(() => setPhase("erasing"), 300);
    } else if (phase === "erasing") {
      if (displayed.length > 0) {
        timer.current = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, ERASE_SPEED);
      } else {
        timer.current = setTimeout(() => setPhase("gap"), GAP_MS);
      }
    } else if (phase === "gap") {
      setIndex((i) => (i + 1) % SLIDES.length);
      setDisplayed("");
      setDescVisible(true);
      setPhase("typing");
    }

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [phase, displayed, phrase]);

  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />

      <div className={styles.heroInner}>
        {/* Headline with typewriter em */}
        <h1 className={styles.headline}>
          {SLIDES[index].static.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
          {" "}
          <em className={styles.typed}>
            {displayed}
            <span className={styles.cursor} />
          </em>
        </h1>

        {/* Slide indicators */}
        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => {
                if (timer.current) clearTimeout(timer.current);
                setIndex(i);
                setDisplayed("");
                setDescVisible(true);
                setPhase("typing");
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Description */}
        <p
          className={`${styles.desc} ${descVisible ? styles.descVisible : styles.descHidden}`}
        >
          {desc}
        </p>

        {/* CTAs */}
        <div className={styles.heroActions}>
          <Link href="/company/register" className={styles.darkCta}>
            Create your company <ArrowRight size={15} />
          </Link>
          <Link href="/how-it-works" className={styles.lightCta}>
            See how it works
          </Link>
        </div>

        {/* Trust row */}
        <div className={styles.heroTrust}>
          <div className={styles.avatars}>
            <i>AM</i><i>DK</i><i>GO</i><i>+12</i>
          </div>
          <span>
            <b>Built for every person at work</b>
            <small>Employee · Manager · HR · Leadership</small>
          </span>
        </div>
      </div>
    </section>
  );
}
