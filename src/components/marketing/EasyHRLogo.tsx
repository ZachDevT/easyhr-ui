"use client";
import { useId } from "react";
import styles from "./logo.module.css";

interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
  className?: string;
}

/** Full logo: mark + wordmark + dot */
export function EasyHRLogo({ variant = "dark", size = 38, className }: LogoProps) {
  return (
    <span className={`${styles.logo} ${variant === "light" ? styles.light : ""} ${className ?? ""}`}>
      <EasyHRMark size={size} />
      <span className={styles.wordmark}>
        EasyHR<span className={styles.dot} />
      </span>
    </span>
  );
}

/** Standalone icon mark */
export function EasyHRMark({ size = 38 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const bg   = `bg-${uid}`;
  const shine = `sh-${uid}`;
  const clip  = `cl-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id={bg} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#9B2DFF" />
          <stop offset="100%" stopColor="#FF3EA5" />
        </linearGradient>

        {/* Top-left shine overlay */}
        <radialGradient id={shine} cx="25%" cy="18%" r="55%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"    />
        </radialGradient>

        {/*
          Clip path that cuts the LEFT rounded ends of each bar flat,
          creating an invisible-but-felt vertical spine at x=10
        */}
        <clipPath id={clip}>
          <rect x="10" y="0" width="30" height="40" />
        </clipPath>
      </defs>

      {/* ── Background ──────────────────────────────────── */}
      <rect width="40" height="40" rx="11" fill={`url(#${bg})`} />
      <rect width="40" height="40" rx="11" fill={`url(#${shine})`} />

      {/* ── Decorative dots (top-right corner) ──────────── */}
      <circle cx="31" cy="8"  r="1"   fill="white" opacity="0.25" />
      <circle cx="35" cy="8"  r="1"   fill="white" opacity="0.18" />
      <circle cx="31" cy="12" r="1"   fill="white" opacity="0.18" />
      <circle cx="35" cy="12" r="1"   fill="white" opacity="0.12" />

      {/* ── Decorative dots (bottom-right corner) ───────── */}
      <circle cx="31" cy="28" r="1"   fill="white" opacity="0.18" />
      <circle cx="35" cy="28" r="1"   fill="white" opacity="0.12" />
      <circle cx="31" cy="32" r="1"   fill="white" opacity="0.25" />
      <circle cx="35" cy="32" r="1"   fill="white" opacity="0.18" />

      {/*
        ── E lettermark ──────────────────────────────────
        Three fully pill-shaped bars. Their left rounded ends
        are clipped at x=10, creating a flat shared left edge
        (the spine) — a modern, refined approach to the E form.

        Top bar    : full width → right edge x=30
        Middle bar : 70% width → right edge x=24  (classic E proportion)
        Bottom bar : full width → right edge x=30
      */}
      <g clipPath={`url(#${clip})`}>
        {/* Top bar */}
        <rect x="8"  y="11"   width="24" height="5"   rx="2.5" fill="white" />
        {/* Middle bar — shorter & slightly thinner */}
        <rect x="8"  y="19.5" width="18" height="4.5" rx="2.25" fill="white" />
        {/* Bottom bar */}
        <rect x="8"  y="27"   width="24" height="5"   rx="2.5" fill="white" />
      </g>

      {/*
        Thin shared left spine — a 2px white vertical strip connecting
        the three bars, anchored at x=10 so it aligns with the clip edge.
        Gives a hairline visual spine without a heavy bar.
      */}
      <rect x="10" y="11" width="2" height="21" fill="white" opacity="0.35" />
    </svg>
  );
}
