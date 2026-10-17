"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}

export function Skeleton({ className = "", style, width, height, radius }: SkeletonProps) {
  return (
    <div
      className={`shimmer-box ${className}`}
      style={{
        width: width ?? "100%",
        height: height ?? "16px",
        borderRadius: radius ?? 8,
        ...style,
      }}
    />
  );
}

/**
 * DashboardSkeleton mimics the exact 3-column layout of /dashboard
 * Left column: Compulsory My Time + Compulsory Time Off (fixed height, independent)
 * Middle & Right columns: Celebrations, Holidays, Welcome New Hires
 */
export function DashboardSkeleton() {
  return (
    <div style={{ padding: "0 4px", animation: "fadeIn 0.2s ease" }}>
      {/* Profile Header Shimmer */}
      <div className="row-between mb-24" style={{ alignItems: "center" }}>
        <div className="row gap-16" style={{ alignItems: "center" }}>
          <Skeleton width={84} height={84} radius="50%" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton width={210} height={32} radius={8} />
            <Skeleton width={155} height={15} radius={6} />
          </div>
        </div>
        <div className="row gap-10">
          <Skeleton width={104} height={36} radius={999} />
          <Skeleton width={120} height={36} radius={999} />
          <Skeleton width={145} height={36} radius={999} />
        </div>
      </div>

      {/* Main 3-Column Dashboard Grid */}
      <div
        className="dash-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Left Column: My Time + Time Off */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* My Time Widget Skeleton */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E4E4E7)",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div className="row-between">
              <div className="row gap-8">
                <Skeleton width={18} height={18} radius={5} />
                <Skeleton width={76} height={16} radius={5} />
              </div>
              <Skeleton width={82} height={22} radius={999} />
            </div>

            {/* Inner Chrono Console Shimmer */}
            <div
              style={{
                background: "#FAF9F7",
                border: "1px solid var(--card-border, #E4E4E7)",
                borderRadius: 14,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div className="row-between" style={{ alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton width={78} height={10} radius={4} />
                  <Skeleton width={108} height={28} radius={6} />
                </div>
                <Skeleton width={126} height={28} radius={9} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Skeleton height={38} radius={10} style={{ flex: 1 }} />
                <Skeleton width={78} height={38} radius={10} />
              </div>
            </div>

            {/* Bottom Metrics Strip Shimmer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: 8,
                paddingTop: 10,
                borderTop: "1px solid #F0F0F3",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Skeleton width={54} height={10} />
                <Skeleton width={68} height={15} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Skeleton width={58} height={10} />
                <Skeleton width={68} height={15} />
              </div>
              <Skeleton width={82} height={30} radius={8} />
            </div>
          </div>

          {/* Time Off Widget Skeleton */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E4E4E7)",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div className="row-between">
              <div className="row gap-8">
                <Skeleton width={18} height={18} radius={5} />
                <Skeleton width={74} height={16} radius={5} />
              </div>
              <Skeleton width={64} height={14} radius={5} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid var(--card-border, #E4E4E7)",
                    borderRadius: 12,
                    padding: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <Skeleton width={26} height={26} radius={7} />
                  <Skeleton width={40} height={16} radius={4} />
                  <Skeleton width={56} height={11} radius={4} />
                  <Skeleton width={44} height={9} radius={4} />
                </div>
              ))}
            </div>
            <Skeleton width="100%" height={38} radius={10} />
          </div>
        </div>

        {/* Middle Column: Celebrations + Company Holidays */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E4E4E7)",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div className="row-between">
              <Skeleton width={165} height={17} />
              <Skeleton width={68} height={24} radius={999} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton width={42} height={26} radius={999} />
              <Skeleton width={76} height={26} radius={999} />
              <Skeleton width={114} height={26} radius={999} />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                <Skeleton width={36} height={36} radius="50%" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton width="55%" height={13} />
                  <Skeleton width="38%" height={11} />
                </div>
                <Skeleton width={46} height={18} radius={6} />
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E4E4E7)",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div className="row-between">
              <Skeleton width={135} height={17} />
              <Skeleton width={54} height={22} radius={6} />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                <Skeleton width={32} height={32} radius={8} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <Skeleton width="60%" height={13} />
                  <Skeleton width="35%" height={11} />
                </div>
                <Skeleton width={54} height={20} radius={999} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Welcome New Hires */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E4E4E7)",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div className="row-between">
              <Skeleton width={145} height={17} />
              <Skeleton width={80} height={14} />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i === 3 ? "none" : "1px solid #F4F4F5",
                }}
              >
                <Skeleton width={38} height={38} radius="50%" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton width="58%" height={13} />
                  <Skeleton width="72%" height={11} />
                </div>
                <Skeleton width={52} height={20} radius={6} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProfileTabShimmer renders a tailored skeleton for each tab inside /people/me or /people/[id]
 */
export function ProfileTabShimmer({ tab = "Personal" }: { tab?: string }) {
  if (tab === "Job") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "fadeIn 0.18s ease" }}>
        <div className="row-between">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={210} height={20} />
            <Skeleton width={300} height={13} />
          </div>
          <Skeleton width={110} height={30} radius={8} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ padding: 14, borderRadius: 12, border: "1px solid #E4E4E7", display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width={28} height={28} radius={7} />
              <Skeleton width="60%" height={11} />
              <Skeleton width="80%" height={16} />
            </div>
          ))}
        </div>
        <div style={{ padding: 18, borderRadius: 14, border: "1px solid #E4E4E7", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Skeleton width={95} height={11} />
              <Skeleton width="75%" height={16} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === "Documents") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fadeIn 0.18s ease" }}>
        <div className="row-between">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={230} height={20} />
            <Skeleton width={310} height={13} />
          </div>
          <Skeleton width={135} height={34} radius={9} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={12} />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: 14, borderRadius: 12, border: "1px solid #E4E4E7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Skeleton width={38} height={38} radius={9} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton width={180} height={14} />
                <Skeleton width={120} height={11} />
              </div>
            </div>
            <Skeleton width={90} height={28} radius={8} />
          </div>
        ))}
      </div>
    );
  }

  if (tab === "Time Off" || tab === "Benefits" || tab === "Performance") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.18s ease" }}>
        <div className="row-between">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={200} height={20} />
            <Skeleton width={280} height={13} />
          </div>
          <Skeleton width={130} height={34} radius={9} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: 16, borderRadius: 12, border: "1px solid #E4E4E7", display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="row-between">
                <Skeleton width={32} height={32} radius={8} />
                <Skeleton width={56} height={20} radius={999} />
              </div>
              <Skeleton width="65%" height={22} />
              <Skeleton width="45%" height={12} />
              <Skeleton width="100%" height={6} radius={999} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton width={150} height={15} />
          {[1, 2].map((i) => (
            <Skeleton key={i} height={58} radius={12} />
          ))}
        </div>
      </div>
    );
  }

  // Default (Personal / Pay Info / Emergency / Timesheet)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "fadeIn 0.18s ease" }}>
      <div className="row-between">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton width={210} height={20} />
          <Skeleton width={320} height={13} />
        </div>
        <Skeleton width={105} height={34} radius={9} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ padding: 14, borderRadius: 12, border: "1px solid #E4E4E7", display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width={85} height={11} />
            <Skeleton width="80%" height={15} />
          </div>
        ))}
      </div>
      <div style={{ padding: 16, borderRadius: 12, border: "1px solid #E4E4E7", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={54} radius={10} />
        ))}
      </div>
    </div>
  );
}

/**
 * ProfileMeSkeleton mimics the exact redesigned Executive Employee Profile Header & Layout of /people/me & /people/[id]
 */
export function ProfileMeSkeleton() {
  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--bg-page)", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease" }}>
      {/* Executive Employee Profile Header Card Shimmer */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid var(--card-border, #E4E4E7)",
          overflow: "hidden",
          marginBottom: 20,
          flexShrink: 0,
        }}
      >
        <div style={{ height: 4, background: "var(--gradient)" }} />
        <div
          style={{
            padding: "20px 24px 18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Skeleton width={76} height={76} radius="50%" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Skeleton width={190} height={22} radius={6} />
                <Skeleton width={64} height={20} radius={999} />
                <Skeleton width={72} height={20} radius={6} />
              </div>
              <Skeleton width={220} height={15} radius={5} />
              <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                <Skeleton width={95} height={13} radius={4} />
                <Skeleton width={110} height={13} radius={4} />
                <Skeleton width={140} height={13} radius={4} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton width={112} height={34} radius={9} />
            <Skeleton width={104} height={34} radius={9} />
          </div>
        </div>

        {/* Bottom Integrated Navigation Tabs Shimmer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "#FAF9F7",
            borderTop: "1px solid var(--card-border, #E4E4E7)",
          }}
        >
          {[82, 64, 94, 82, 102, 80, 88, 78, 92].map((w, idx) => (
            <Skeleton key={idx} width={w} height={26} radius={7} />
          ))}
        </div>
      </div>

      {/* Main Grid: Left Vitals (270px) + Right Tab Content (1fr) */}
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 20, alignItems: "start" }}>
        {/* Left Vitals Column */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--card-border, #E4E4E7)",
            borderRadius: 14,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Skeleton width={95} height={13} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Skeleton width={28} height={28} radius={7} />
              <Skeleton width="72%" height={14} />
            </div>
          ))}
          <div style={{ height: 1, background: "#F0F0F3", margin: "4px 0" }} />
          <Skeleton width={115} height={13} />
          <Skeleton width="100%" height={56} radius={10} />
        </div>

        {/* Right Content Column */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--card-border, #E4E4E7)",
            borderRadius: 14,
            padding: 28,
          }}
        >
          <ProfileTabShimmer tab="Personal" />
        </div>
      </div>
    </div>
  );
}

/**
 * CompanySettingsSkeleton mimics /company-settings
 */
export function CompanySettingsSkeleton() {
  return (
    <div style={{ padding: "0 24px", animation: "fadeIn 0.2s ease" }}>
      <div className="row-between mb-24">
        <div>
          <Skeleton width={200} height={28} />
          <Skeleton width={320} height={16} style={{ marginTop: 8 }} />
        </div>
        <Skeleton width={120} height={40} radius={8} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[140, 110, 120, 100].map((w, idx) => (
          <Skeleton key={idx} width={w} height={36} radius={8} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr", gap: 20 }}>
        <div style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <Skeleton width={180} height={22} />
          <Skeleton width="80%" height={14} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton width={120} height={13} />
                <Skeleton height={38} radius={8} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <Skeleton width={88} height={88} radius={20} />
          <Skeleton width={140} height={20} />
          <Skeleton width={100} height={14} />
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton width={90} height={24} radius={12} />
            <Skeleton width={50} height={24} radius={12} />
          </div>
          <Skeleton width="100%" height={50} radius={10} style={{ marginTop: 12 }} />
        </div>
      </div>
    </div>
  );
}

/**
 * DepartmentsSkeleton mimics the layout of /departments
 */
export function DepartmentsSkeleton() {
  return (
    <div style={{ padding: "32px 40px", animation: "fadeIn 0.2s ease", display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton width={100} height={14} />
              <Skeleton width={32} height={32} radius={8} />
            </div>
            <Skeleton width={60} height={28} />
            <Skeleton width={120} height={12} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton width={200} height={24} />
          <Skeleton width={120} height={14} />
        </div>
        <Skeleton width={280} height={40} radius={12} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Skeleton width={48} height={48} radius={12} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <Skeleton width={140} height={20} />
                <Skeleton width={90} height={13} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, paddingTop: 16, borderTop: "1px dashed var(--border)" }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Skeleton width={50} height={11} />
                  <Skeleton width={30} height={20} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * HiringSkeleton mimics the Kanban pipeline layout of /hiring
 */
export function HiringSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "fadeIn 0.2s ease" }}>
      <div style={{ padding: 32, borderBottom: "1px solid var(--border)", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width={100} height={12} />
            <Skeleton width={260} height={44} radius={8} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width={120} height={12} />
            <Skeleton width={320} height={44} radius={8} />
          </div>
        </div>
        <Skeleton width={110} height={44} radius={8} />
      </div>

      <div style={{ padding: "32px 48px", display: "flex", gap: 24, overflowX: "auto" }}>
        {[1, 2, 3, 4, 5].map((col) => (
          <div key={col} style={{ minWidth: 300, width: 300, background: "#F3F4F6", padding: 16, borderRadius: 12, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Skeleton width={12} height={12} radius="50%" />
                <Skeleton width={90} height={16} />
              </div>
              <Skeleton width={30} height={20} radius={8} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2].map((card) => (
                <div key={card} style={{ background: "white", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 14, border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Skeleton width={60} height={18} radius={6} />
                    <Skeleton width={40} height={18} radius={6} />
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Skeleton width={44} height={44} radius="50%" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <Skeleton width={110} height={16} />
                      <Skeleton width={80} height={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PeopleDirectorySkeleton mimics /people
 */
export function PeopleDirectorySkeleton() {
  return (
    <div style={{ padding: "0 24px 32px", animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Skeleton width={140} height={20} />
          <div style={{ display: "flex", gap: 12 }}>
            <Skeleton width={260} height={38} radius={8} />
            <Skeleton width={160} height={38} radius={8} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <Skeleton width={52} height={52} radius="50%" />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <Skeleton width={120} height={18} />
                  <Skeleton width={90} height={13} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton width="85%" height={12} />
                <Skeleton width="65%" height={12} />
                <Skeleton width="75%" height={12} />
              </div>
              <Skeleton width={70} height={22} radius={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * OnboardingPortalSkeleton mimics the layout of /my-onboarding
 */
export function OnboardingPortalSkeleton() {
  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Skeleton width={72} height={72} radius="50%" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width={260} height={26} />
            <Skeleton width={340} height={14} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 180 }}>
          <Skeleton width={120} height={14} />
          <Skeleton width="100%" height={8} radius={4} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <Skeleton width={36} height={36} radius="50%" />
                <Skeleton width={70} height={12} />
              </div>
            ))}
          </div>

          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 40, display: "flex", flexDirection: "column", gap: 24 }}>
            <Skeleton width={220} height={24} />
            <Skeleton width={320} height={14} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
              <Skeleton width="100%" height={44} radius={8} />
              <Skeleton width="100%" height={44} radius={8} />
              <Skeleton width="100%" height={44} radius={8} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <Skeleton width={100} height={40} radius={8} />
              <Skeleton width={150} height={40} radius={8} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <Skeleton width={140} height={18} />
            <Skeleton width="100%" height={16} />
            <Skeleton width="90%" height={16} />
            <Skeleton width="80%" height={16} />
          </div>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <Skeleton width={140} height={18} />
            <Skeleton width="100%" height={56} radius={8} />
            <Skeleton width="100%" height={56} radius={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AttendanceSkeleton mimics /attendance
 */
export function AttendanceSkeleton() {
  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Skeleton width={48} height={48} radius="50%" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width={180} height={20} />
            <Skeleton width={120} height={14} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Skeleton width={120} height={40} radius={8} />
          <Skeleton width={120} height={40} radius={8} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", gap: 16, background: "white", border: "1px solid var(--border)", borderRadius: 100, padding: "8px 24px" }}>
          <Skeleton width={90} height={18} />
          <Skeleton width={90} height={18} />
          <Skeleton width={90} height={18} />
          <Skeleton width={90} height={18} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Skeleton width={130} height={36} radius={20} />
          <Skeleton width={200} height={36} radius={20} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Skeleton width={44} height={44} radius="50%" />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton width={130} height={16} />
                  <Skeleton width={90} height={12} />
                </div>
              </div>
              <Skeleton width={74} height={24} radius={12} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Skeleton width={70} height={12} />
                <Skeleton width={90} height={12} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Skeleton width={60} height={12} />
                <Skeleton width={80} height={12} />
              </div>
            </div>
            <Skeleton width="100%" height={32} radius={8} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ModulePageSkeleton: Universal executive shimmer skeleton for workspace pages
 * Supports 'bento', 'table', or 'split' variants
 */
export function ModulePageSkeleton({ variant = "bento" }: { variant?: "bento" | "table" | "split" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.2s ease" }}>
      {/* PageHeader Shimmer */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid var(--card-border, #E4E4E7)",
          borderRadius: 16,
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Skeleton width={42} height={42} radius={11} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={190} height={20} radius={6} />
            <Skeleton width={280} height={13} radius={5} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton width={110} height={34} radius={9} />
          <Skeleton width={130} height={34} radius={9} />
        </div>
      </div>

      {/* 4-Column KPI Ribbon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E4E4E7)",
              borderRadius: 14,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div className="row-between">
              <Skeleton width={95} height={12} />
              <Skeleton width={28} height={28} radius={8} />
            </div>
            <Skeleton width={70} height={26} />
            <Skeleton width={120} height={11} />
          </div>
        ))}
      </div>

      {variant === "split" ? (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E4E4E7)",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Skeleton width="100%" height={36} radius={9} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="100%" height={58} radius={11} />
            ))}
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--card-border, #E4E4E7)",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <Skeleton width={220} height={22} />
            <Skeleton width="100%" height={140} radius={12} />
            <Skeleton width="100%" height={180} radius={12} />
          </div>
        </div>
      ) : variant === "table" ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--card-border, #E4E4E7)",
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div className="row-between">
            <Skeleton width={240} height={34} radius={9} />
            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton width={90} height={32} radius={8} />
              <Skeleton width={90} height={32} radius={8} />
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: i === 6 ? "none" : "1px solid #F4F4F5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton width={36} height={36} radius={9} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton width={160} height={14} />
                  <Skeleton width={110} height={11} />
                </div>
              </div>
              <Skeleton width={90} height={22} radius={999} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--card-border, #E4E4E7)",
                borderRadius: 16,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div className="row-between">
                <Skeleton width={40} height={40} radius={10} />
                <Skeleton width={68} height={22} radius={999} />
              </div>
              <Skeleton width="75%" height={18} />
              <Skeleton width="90%" height={12} />
              <Skeleton width="60%" height={12} />
              <Skeleton width="100%" height={34} radius={9} style={{ marginTop: 4 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
