"use client";

import React, { ReactNode } from "react";

interface ProfileSectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Set to true if children is a table or full-bleed list that shouldn't have padding. */
  noPadding?: boolean;
  style?: React.CSSProperties;
}

/**
 * Unified, Apple-inspired card container for all employee profile tabs.
 * Provides consistent typography, hairline borders, and header layout.
 */
export function ProfileSectionCard({
  title,
  subtitle,
  action,
  children,
  noPadding = false,
  style,
}: ProfileSectionCardProps) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E5EA",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
        ...style,
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #F0F0F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: "#1D1D1F",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 12.5,
                color: "#6E6E73",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{action}</div>}
      </div>
      <div style={{ padding: noPadding ? 0 : "20px" }}>{children}</div>
    </div>
  );
}
