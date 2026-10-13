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
 * DashboardSkeleton mimics the exact layout of /dashboard
 */
export function DashboardSkeleton() {
  return (
    <div style={{ padding: "0 4px", animation: "fadeIn 0.2s ease" }}>
      {/* Profile Header Shimmer */}
      <div className="row-between mb-24" style={{ alignItems: "center" }}>
        <div className="row gap-16" style={{ alignItems: "center" }}>
          <Skeleton width={84} height={84} radius="50%" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton width={220} height={32} radius={8} />
            <Skeleton width={160} height={16} radius={6} />
          </div>
        </div>
        <div className="row gap-10">
          <Skeleton width={110} height={38} radius={8} />
          <Skeleton width={140} height={38} radius={8} />
        </div>
      </div>

      {/* Main Grid: Left Compulsory (360px) + Right Optional */}
      <div className="dash-grid" style={{ gridTemplateColumns: "360px 1fr", gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* My Time Widget Skeleton */}
          <div style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: 16, padding: 24 }}>
            <div className="row-between mb-20">
              <Skeleton width={120} height={18} />
              <Skeleton width={70} height={22} radius={12} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
              <Skeleton width={150} height={150} radius="50%" />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Skeleton height={42} radius={10} />
              <Skeleton height={42} radius={10} />
            </div>
          </div>

          {/* Time Off Widget Skeleton */}
          <div style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: 16, padding: 24 }}>
            <div className="row-between mb-16">
              <Skeleton width={130} height={18} />
              <Skeleton width={80} height={16} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Skeleton height={70} radius={12} />
              <Skeleton height={70} radius={12} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Quick Action Ribbon */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton width={36} height={36} radius={10} />
                <Skeleton width={90} height={14} />
                <Skeleton width={50} height={22} />
              </div>
            ))}
          </div>

          {/* Large Card Shimmer */}
          <div style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="row-between mb-12">
              <Skeleton width={180} height={20} />
              <Skeleton width={80} height={16} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i === 3 ? "none" : "1px solid #F3F4F6" }}>
                  <Skeleton width={44} height={44} radius="50%" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <Skeleton width="40%" height={15} />
                    <Skeleton width="70%" height={12} />
                  </div>
                  <Skeleton width={80} height={24} radius={12} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProfileMeSkeleton mimics /people/me
 */
export function ProfileMeSkeleton() {
  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--bg-page)", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease" }}>
      {/* Banner Shimmer */}
      <div style={{ margin: "24px 24px 0 24px" }}>
        <div style={{ background: "linear-gradient(135deg, #A238FF15 0%, #2D144B15 100%)", border: "1px solid #E5E7EB", borderRadius: 16, padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            <Skeleton width={100} height={100} radius="50%" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton width={240} height={28} />
              <Skeleton width={160} height={16} />
            </div>
          </div>
          {/* Tab bar shimmer */}
          <div style={{ display: "flex", gap: 12, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 16 }}>
            {[80, 60, 90, 80, 100, 75, 90].map((w, idx) => (
              <Skeleton key={idx} width={w} height={32} radius={20} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 48, padding: "24px" }}>
        {/* Left Vitals Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <Skeleton width={80} height={16} />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton width={20} height={20} radius={6} />
                <Skeleton width="75%" height={14} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Content Column */}
        <div style={{ background: "white", border: "1px solid var(--card-border)", borderRadius: 16, padding: 32 }}>
          <div className="row-between mb-24">
            <Skeleton width={180} height={24} />
            <Skeleton width={90} height={32} radius={8} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton width={100} height={13} />
                <Skeleton height={38} radius={8} />
              </div>
            ))}
          </div>
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
      {/* Stat Ribbon Skeleton */}
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

      {/* Header filter row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton width={200} height={24} />
          <Skeleton width={120} height={14} />
        </div>
        <Skeleton width={280} height={40} radius={12} />
      </div>

      {/* Grid of Department Cards */}
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
      {/* Toolbar Skeleton */}
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

      {/* Kanban Columns Skeleton */}
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
      {/* Top filter row skeleton */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Skeleton width={140} height={20} />
          <div style={{ display: "flex", gap: 12 }}>
            <Skeleton width={260} height={38} radius={8} />
            <Skeleton width={160} height={38} radius={8} />
          </div>
        </div>

        {/* Employee Cards Grid */}
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
      {/* Banner Skeleton */}
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

      {/* Grid with main form and sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Stepper bar */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <Skeleton width={36} height={36} radius="50%" />
                <Skeleton width={70} height={12} />
              </div>
            ))}
          </div>

          {/* Form card */}
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

        {/* Sidebar widgets */}
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
      {/* Top action / punch bar skeleton */}
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

      {/* Stats Ribbon skeleton */}
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

      {/* Grid of employee attendance cards */}
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
