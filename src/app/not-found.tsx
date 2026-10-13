"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { EasyHRLogo } from "@/components/marketing/EasyHRLogo";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "32px 24px",
        background: "radial-gradient(ellipse at 50% 30%, rgba(162, 56, 255, 0.08) 0%, rgba(255, 62, 165, 0.03) 40%, #FAFAF8 75%)",
        color: "var(--text-1, #1E1D19)",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes float404 {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.7;
          }
        }
        @keyframes subtleShine {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      {/* Top Header: Simple EasyHR Brand */}
      <div style={{ width: "100%", maxWidth: 1100, display: "flex", justifyContent: "flex-start" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <EasyHRLogo size={32} />
        </Link>
      </div>

      {/* Centered Compact Animated Hero */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 440,
          width: "100%",
          padding: "20px 0",
        }}
      >
        {/* Animated Floating 404 Glyph / Orb */}
        <div
          style={{
            position: "relative",
            width: 140,
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            animation: "float404 4.5s ease-in-out infinite",
          }}
        >
          {/* Pulsing ambient glow ring */}
          <div
            style={{
              position: "absolute",
              inset: -12,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(162, 56, 255, 0.4) 0%, rgba(255, 62, 165, 0.2) 50%, transparent 70%)",
              animation: "pulseGlow 3.5s ease-in-out infinite",
              filter: "blur(14px)",
              pointerEvents: "none",
            }}
          />

          {/* Central frosted icon card */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 30,
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.65) 100%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid rgba(255, 255, 255, 0.9)",
              boxShadow: "0 18px 36px rgba(162, 56, 255, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 900,
                letterSpacing: "-0.05em",
                background: "linear-gradient(135deg, #9B2DFF 0%, #FF3EA5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              404
            </span>
          </div>
        </div>

        {/* Crisp Headline */}
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text-1, #1E1D19)",
          }}
        >
          Page not found
        </h1>

        {/* Minimal subtitle */}
        <p
          style={{
            margin: "0 0 26px 0",
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--text-3, #6B6B63)",
            maxWidth: 340,
          }}
        >
          The page you are looking for doesn&apos;t exist, has been moved, or is unavailable.
        </p>

        {/* Compact Two-Button Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--card-border, #E2E8F0)",
              background: "#FFFFFF",
              color: "var(--text-2, #3C3B36)",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary, #A238FF)";
              e.currentTarget.style.color = "var(--primary, #A238FF)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--card-border, #E2E8F0)";
              e.currentTarget.style.color = "var(--text-2, #3C3B36)";
            }}
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>

          <Link
            href="/dashboard"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              background: "linear-gradient(135deg, #9B2DFF 0%, #FF3EA5 100%)",
              color: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(162, 56, 255, 0.3)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(162, 56, 255, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(162, 56, 255, 0.3)";
            }}
          >
            <span>Back to Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Discreet bottom footer */}
      <div style={{ fontSize: 11.5, color: "var(--text-4, #9E9E95)" }}>
        EasyHR &bull; <strong>easyhr.pro</strong>
      </div>
    </div>
  );
}
