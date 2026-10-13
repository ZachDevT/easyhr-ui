"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, ArrowRight, Home, ShieldAlert, Sparkles } from "lucide-react";
import { EasyHRLogo } from "@/components/marketing/EasyHRLogo";

function WorkspaceNotFoundContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams.get("subdomain") || "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top, #FAF5FF 0%, #F9FAFB 60%, #F3F4F6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <div style={{ marginBottom: "32px" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <EasyHRLogo />
        </Link>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.05)",
          border: "1px solid #E5E7EB",
          padding: "44px 36px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "#FEF2F2",
            color: "#EF4444",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
            border: "1px solid #FEE2E2",
          }}
        >
          <Building2 size={32} />
        </div>

        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#111827",
            margin: "0 0 10px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Workspace Not Found
        </h1>

        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.6,
            color: "#4B5563",
            margin: "0 0 24px 0",
          }}
        >
          The workspace{" "}
          <strong
            style={{
              color: "#111827",
              background: "#F3F4F6",
              padding: "2px 8px",
              borderRadius: "6px",
              fontFamily: "monospace",
            }}
          >
            {subdomain ? `${subdomain}.easyhr.pro` : "you requested"}
          </strong>{" "}
          does not exist, has been deleted, or may have a typo in the URL.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          {subdomain && (
            <a
              href={`https://easyhr.pro/company/register?claim=${encodeURIComponent(subdomain)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px 20px",
                background: "var(--primary, #A238FF)",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(162, 56, 255, 0.3)",
                transition: "opacity 0.2s",
              }}
            >
              <Sparkles size={16} />
              Claim & Register this Workspace
              <ArrowRight size={16} />
            </a>
          )}

          <a
            href="https://easyhr.pro/company/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 20px",
              background: "#F9FAFB",
              color: "#1F2937",
              border: "1px solid #D1D5DB",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            <Building2 size={16} />
            Create a New Workspace
          </a>

          <a
            href="https://easyhr.pro"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 20px",
              color: "#6B7280",
              fontSize: "13px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            <Home size={14} />
            Return to EasyHR Homepage
          </a>
        </div>
      </div>

      <div
        style={{
          marginTop: "24px",
          fontSize: "12px",
          color: "#9CA3AF",
          textAlign: "center",
        }}
      >
        Looking for support? Contact{" "}
        <a href="mailto:support@easyhr.pro" style={{ color: "#6B7280", textDecoration: "underline" }}>
          support@easyhr.pro
        </a>
      </div>
    </div>
  );
}

export default function WorkspaceNotFoundPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Loading...</div>}>
      <WorkspaceNotFoundContent />
    </Suspense>
  );
}
