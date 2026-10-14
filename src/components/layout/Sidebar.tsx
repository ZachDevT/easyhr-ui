"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Users,
  Palmtree,
  DollarSign,
  FolderOpen,
  Settings,
  UserCheck,
  LogOut,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
import { useRole } from "../../context/RoleContext";
import { useCompany } from "../../context/CompanyContext";
import { useClerk } from "@clerk/nextjs";
import { Avatar } from "../ui/Avatar";
import { EasyHRMark } from "../marketing/EasyHRLogo";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface NavChild {
  label: string;
  href: string;
}

interface NavParent {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavChild[];
  badge?: string | number;
}

interface FlyoutState {
  id: string;
  label: string;
  top: number;
  left: number;
  children: NavChild[];
}

export function Sidebar() {
  const { role, currentUser } = useRole();
  const { company } = useCompany();
  const { signOut } = useClerk();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    dashboard: true,
    hiring: true,
  });

  // Fixed floating flyout state (never clipped by overflow:hidden!)
  const [flyoutState, setFlyoutState] = useState<FlyoutState | null>(null);
  const flyoutCloseTimer = useRef<NodeJS.Timeout | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // User menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isHRAdmin = role === "HR Admin";
  const isManager = role === "Manager";
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || "User";

  // ─── Keyboard shortcut (⌘K or ⌘S) to focus search ────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "s")) {
        e.preventDefault();
        if (collapsed) setCollapsed(false);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        setIsSearchFocused(false);
        setFlyoutState(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Navigation Structure ─────────────────────────────────────────────────
  const navSections: { sectionTitle: string; items: NavParent[] }[] = useMemo(() => {
    // 1. Employee: Exactly two sidebar groups
    if (role === "Employee") {
      const employeeItems: NavParent[] = [
        {
          id: "workspace",
          label: "Workspace",
          icon: <LayoutGrid size={17} strokeWidth={2.2} />,
          children: [
            { label: "Overview", href: "/dashboard" },
            { label: "Organization Chart", href: "/org-chart" },
            { label: "People Directory", href: "/people" },
            { label: "My Signatures & Docs", href: "/my-signatures" },
            { label: "Company Handbook", href: "/policies" },
          ],
        },
        {
          id: "timeoff",
          label: "Time & Attendance",
          icon: <Palmtree size={17} strokeWidth={2.2} />,
          children: [
            { label: "Leave Requests", href: "/time-off" },
            { label: "Punch Clock & Attendance", href: "/attendance" },
            { label: "My Timesheet", href: "/time" },
          ],
        },
      ];
      return [{ sectionTitle: "MAIN", items: employeeItems }];
    }

    // 2. Manager: Team lead and approval workflows
    if (isManager) {
      const managerItems: NavParent[] = [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutGrid size={17} strokeWidth={2.2} />,
          children: [
            { label: "Overview", href: "/dashboard" },
            { label: "Approvals Inbox", href: "/inbox" },
          ],
        },
        {
          id: "timeoff",
          label: "Time & Attendance",
          icon: <Palmtree size={17} strokeWidth={2.2} />,
          children: [
            { label: "Leave Management", href: "/time-off" },
            { label: "Live Attendance", href: "/attendance" },
            { label: "Shift Scheduling", href: "/shift-scheduling" },
            { label: "Time Tracking", href: "/time" },
          ],
        },
        {
          id: "organization",
          label: "People & Team",
          icon: <Users size={17} strokeWidth={2.2} />,
          children: [
            { label: "My Team", href: "/my-team" },
            { label: "Team Requests", href: "/team-requests" },
            { label: "People Directory", href: "/people" },
            { label: "Organization Chart", href: "/org-chart" },
          ],
        },
        {
          id: "records",
          label: "Documents & Policies",
          icon: <FolderOpen size={17} strokeWidth={2.2} />,
          children: [
            { label: "Company Documents", href: "/documents" },
            { label: "Policies & Handbook", href: "/policies" },
          ],
        },
      ];
      return [{ sectionTitle: "MAIN", items: managerItems }];
    }

    // 3. HR Admin / Company Owner: Full suite
    const adminItems: NavParent[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutGrid size={17} strokeWidth={2.2} />,
        children: [
          { label: "Overview", href: "/dashboard" },
          { label: "Approvals Inbox", href: "/inbox" },
          { label: "Company Reports", href: "/reports" },
        ],
      },
      {
        id: "hiring",
        label: "Talent & Jobs",
        icon: <Briefcase size={17} strokeWidth={2.2} />,
        children: [
          { label: "Recruiting Pipeline", href: "/hiring" },
          { label: "Email Macros", href: "/messaging/macros" },
          { label: "New Hire Onboarding", href: "/onboarding" },
          { label: "Offboarding", href: "/offboarding" },
        ],
      },
      {
        id: "timeoff",
        label: "Time & Leave",
        icon: <Palmtree size={17} strokeWidth={2.2} />,
        children: [
          { label: "Leave Management", href: "/time-off" },
          { label: "Live Attendance", href: "/attendance" },
          { label: "Shift Scheduling", href: "/shift-scheduling" },
          { label: "Time Tracking", href: "/time" },
        ],
      },
      {
        id: "organization",
        label: "People & Org",
        icon: <Users size={17} strokeWidth={2.2} />,
        children: [
          { label: "People Directory", href: "/people" },
          { label: "Organization Chart", href: "/org-chart" },
          { label: "Departments", href: "/departments" },
          { label: "My Team", href: "/my-team" },
          { label: "Promotions", href: "/promotions" },
        ],
      },
      {
        id: "finance",
        label: "Finance & Payroll",
        icon: <DollarSign size={17} strokeWidth={2.2} />,
        children: [
          { label: "Payroll Management", href: "/payroll" },
          { label: "Benefits Plans", href: "/benefits" },
          { label: "Total Rewards", href: "/total-rewards" },
        ],
      },
      {
        id: "records",
        label: "Documents & Legal",
        icon: <FolderOpen size={17} strokeWidth={2.2} />,
        children: [
          { label: "Company Documents", href: "/documents" },
          { label: "E-Signatures", href: "/signatures" },
          { label: "Policies & Handbook", href: "/policies" },
        ],
      },
      {
        id: "admin",
        label: "Administration",
        icon: <Settings size={17} strokeWidth={2.2} />,
        children: [
          { label: "Automations & Workflows", href: "/workflows" },
          { label: "Company Holidays", href: "/holidays" },
          { label: "Company Settings", href: "/company-settings" },
          { label: "Roles & Permissions", href: "/roles-permissions" },
          { label: "Support Tickets", href: "/support" },
        ],
      },
    ];

    return [{ sectionTitle: "MAIN", items: adminItems }];
  }, [role, isManager]);

  // Auto-expand parent if current route is within it
  useEffect(() => {
    navSections.forEach((sec) => {
      sec.items.forEach((item) => {
        if (item.children?.some((c) => pathname.startsWith(c.href))) {
          setExpandedParents((prev) => ({ ...prev, [item.id]: true }));
        }
      });
    });
  }, [pathname, navSections]);

  const toggleParent = (id: string) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Flyout trigger handlers with smooth hover delay
  const handleItemMouseEnter = (item: NavParent, e: React.MouseEvent<HTMLDivElement>) => {
    if (!item.children || item.children.length === 0) return;
    // Show flyout when: (1) sidebar is collapsed OR (2) parent is not expanded!
    if (collapsed || !expandedParents[item.id]) {
      if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
      const rect = e.currentTarget.getBoundingClientRect();
      setFlyoutState({
        id: item.id,
        label: item.label,
        top: Math.max(16, rect.top - 4),
        left: rect.right + 12,
        children: item.children,
      });
    }
  };

  const handleItemMouseLeave = () => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    flyoutCloseTimer.current = setTimeout(() => {
      setFlyoutState(null);
    }, 140);
  };

  const keepFlyoutOpen = () => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
  };

  // Flattened searchable list with icon & category info
  const allNavChildren = useMemo(() => {
    const list: { parentLabel: string; label: string; href: string; icon: React.ReactNode }[] = [];
    navSections.forEach((s) => {
      s.items.forEach((p) => {
        if (p.children) {
          p.children.forEach((c) =>
            list.push({ parentLabel: p.label, label: c.label, href: c.href, icon: p.icon })
          );
        } else if (p.href) {
          list.push({ parentLabel: s.sectionTitle, label: p.label, href: p.href, icon: p.icon });
        }
      });
    });
    return list;
  }, [navSections]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allNavChildren.filter(
      (c) =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.parentLabel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allNavChildren]);

  return (
    <>
      <aside
        style={{
          width: collapsed ? 68 : 236,
          margin: "12px 0 12px 14px",
          height: "calc(100vh - 24px)",
          background: "#ffffff",
          borderRadius: 26,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "relative",
          transition: "width 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 50,
        }}
      >
        {/* ─── Circular Edge Toggle Button (< / >) ────────────────────────── */}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setFlyoutState(null);
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            top: 26,
            right: -10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#ffffff",
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#6B7280",
            zIndex: 60,
            transition: "transform 0.15s, color 0.15s",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#111827";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6B7280";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {collapsed ? <ChevronRight size={12} strokeWidth={2.5} /> : <ChevronLeft size={12} strokeWidth={2.5} />}
        </button>

        {/* ─── Brand Logo Glyphs ────────────────────────────────────────────── */}
        <div
          style={{
            padding: collapsed ? "20px 0 12px 0" : "20px 18px 12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
          }}
        >
          <Link href="/dashboard" suppressHydrationWarning style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name || "Company"}
                suppressHydrationWarning
                style={{ width: 28, height: 28, borderRadius: 8, objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "#18181B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                }}
              >
                <EasyHRMark size={20} />
              </div>
            )}

            {!collapsed && (
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 800,
                  color: "#18181B",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 150,
                }}
              >
                {company?.name || "EasyHR"}
              </span>
            )}
          </Link>
        </div>

        {/* ─── Modern Search Input Bar (⌘ S / ⌘ K) ─────────────────────────── */}
        <div ref={searchContainerRef} style={{ padding: collapsed ? "6px 10px" : "6px 14px", position: "relative" }}>
          {collapsed ? (
            <button
              onClick={() => {
                setCollapsed(false);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              title="Search (⌘K)"
              style={{
                width: "100%",
                height: 36,
                borderRadius: 12,
                background: "#F4F4F5",
                border: "1px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#71717A",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#E4E4E7";
                e.currentTarget.style.color = "#18181B";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F4F4F5";
                e.currentTarget.style.color = "#71717A";
              }}
            >
              <Search size={15} strokeWidth={2.2} />
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: isSearchFocused ? "#FFFFFF" : "#FAFAFA",
                border: isSearchFocused ? "1px solid #18181B" : "1px solid #EEEEEE",
                boxShadow: isSearchFocused ? "0 0 0 2px rgba(24,24,27,0.06)" : "none",
                borderRadius: 12,
                padding: "7px 10px",
                transition: "all 0.15s ease",
              }}
            >
              <Search size={14} style={{ color: isSearchFocused ? "#18181B" : "#A1A1AA", flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 12.5,
                  color: "#18181B",
                  width: "100%",
                }}
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 11,
                    color: "#A1A1AA",
                  }}
                >
                  ✕
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "#A1A1AA",
                      border: "1px solid #E4E4E7",
                      borderRadius: 4,
                      padding: "1.5px 4px",
                      lineHeight: 1,
                      background: "#FFFFFF",
                    }}
                  >
                    ⌘
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "#A1A1AA",
                      border: "1px solid #E4E4E7",
                      borderRadius: 4,
                      padding: "1.5px 4px",
                      lineHeight: 1,
                      background: "#FFFFFF",
                    }}
                  >
                    S
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ─── Sleek Search Results Palette (Spotlight / Raycast Style) ─── */}
          {!collapsed && isSearchFocused && searchQuery.trim() && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 14,
                right: 14,
                background: "#FFFFFF",
                borderRadius: 16,
                border: "1px solid #E4E4E7",
                boxShadow: "0 16px 36px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)",
                padding: "8px",
                zIndex: 999,
                maxHeight: 340,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                animation: "fadeIn 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px 4px 8px",
                  borderBottom: "1px solid #F4F4F5",
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#A1A1AA",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  Matching Pages
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#F4F4F5",
                    color: "#71717A",
                    padding: "1px 6px",
                    borderRadius: 10,
                  }}
                >
                  {searchResults.length}
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div style={{ padding: "20px 12px", textAlign: "center", color: "#A1A1AA", fontSize: 12 }}>
                  No pages match &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                searchResults.map((res) => {
                  const isCurrent = pathname === res.href;
                  return (
                    <Link
                      key={res.href}
                      href={res.href}
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchFocused(false);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        textDecoration: "none",
                        background: isCurrent ? "#F4F4F5" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F4F5")}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            background: "#F4F4F5",
                            color: "#71717A",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {res.icon}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#18181B",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {res.label}
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              color: "#A1A1AA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {res.parentLabel}
                          </span>
                        </div>
                      </div>

                      <ArrowRight size={12} style={{ color: "#A1A1AA", flexShrink: 0 }} />
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ─── Navigation Scroll Body ───────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: collapsed ? "6px 6px" : "6px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {navSections.map((section) => (
            <div key={section.sectionTitle} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Section Header (e.g. "MAIN") */}
              {!collapsed && (
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "#A1A1AA",
                    textTransform: "uppercase",
                    padding: "6px 10px 2px 10px",
                  }}
                >
                  {section.sectionTitle}
                </div>
              )}

              {/* Parent Navigation Items */}
              {section.items.map((item) => {
                const isExpanded = !!expandedParents[item.id];
                const hasChildren = item.children && item.children.length > 0;
                const isParentActive = hasChildren
                  ? item.children!.some((c) => pathname.startsWith(c.href))
                  : item.href
                  ? pathname.startsWith(item.href)
                  : false;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={(e) => handleItemMouseEnter(item, e)}
                    onMouseLeave={handleItemMouseLeave}
                  >
                    {/* Collapsed Item button */}
                    {collapsed ? (
                      <div
                        onClick={() => {
                          if (hasChildren) {
                            // In collapsed mode, click toggles flyout
                            setFlyoutState((prev) => (prev?.id === item.id ? null : prev));
                          }
                        }}
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: isParentActive ? "#18181B" : "#71717A",
                          background: isParentActive ? "#F4F4F5" : "transparent",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isParentActive) e.currentTarget.style.background = "#FAFAFA";
                        }}
                        onMouseLeave={(e) => {
                          if (!isParentActive) e.currentTarget.style.background = "transparent";
                        }}
                        title={item.label}
                      >
                        {item.icon}
                      </div>
                    ) : (
                      /* Expanded Parent Card with chevron */
                      <div
                        onClick={() => hasChildren && toggleParent(item.id)}
                        style={{
                          padding: "9px 12px",
                          borderRadius: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: hasChildren ? "pointer" : "default",
                          color: isParentActive ? "#18181B" : "#52525B",
                          background: isExpanded ? "#FAFAFA" : isParentActive ? "#F4F4F5" : "transparent",
                          fontWeight: isParentActive ? 700 : 500,
                          fontSize: 13,
                          userSelect: "none",
                          transition: "background 0.15s ease, color 0.15s ease",
                          marginBottom: isExpanded ? 4 : 2,
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded && !isParentActive) e.currentTarget.style.background = "#FAFAFA";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded && !isParentActive) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: isParentActive ? "#18181B" : "#71717A" }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>

                        {hasChildren && (
                          <span style={{ color: "#A1A1AA", display: "flex", alignItems: "center" }}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                        )}
                      </div>
                    )}

                    {/* ─── Nested Children Tree Branches (Visible when Expanded) ─── */}
                    {!collapsed && hasChildren && isExpanded && (
                      <div
                        style={{
                          marginLeft: 23,
                          borderLeft: "1.5px solid #E5E7EB",
                          paddingLeft: 14,
                          marginTop: 4,
                          marginBottom: 10,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          position: "relative",
                        }}
                      >
                        {item.children!.map((child) => {
                          const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
                          return (
                            <div
                              key={child.href}
                              style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {/* Horizontal connector branch tick */}
                              <div
                                style={{
                                  position: "absolute",
                                  left: -14,
                                  top: "50%",
                                  width: 10,
                                  height: 1.5,
                                  background: "#E5E7EB",
                                }}
                              />

                              <Link
                                href={child.href}
                                style={{
                                  flex: 1,
                                  padding: "8px 14px",
                                  borderRadius: 10,
                                  fontSize: 13,
                                  fontWeight: isChildActive ? 600 : 500,
                                  color: isChildActive ? "#18181B" : "#71717A",
                                  background: isChildActive ? "#F4F4F5" : "transparent",
                                  boxShadow: isChildActive ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                                  textDecoration: "none",
                                  transition: "all 0.15s ease",
                                  display: "block",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChildActive) {
                                    e.currentTarget.style.color = "#18181B";
                                    e.currentTarget.style.background = "#FAFAFA";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChildActive) {
                                    e.currentTarget.style.color = "#71717A";
                                    e.currentTarget.style.background = "transparent";
                                  }
                                }}
                              >
                                {child.label}
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ─── Bottom User Profile Card (from reference screenshot) ───────── */}
        <div style={{ padding: collapsed ? "10px 8px" : "10px 12px", borderTop: "1px solid #F4F4F5" }}>
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              background: "#FAFAFA",
              border: "1px solid #F0F0F0",
              borderRadius: 16,
              padding: collapsed ? "8px 0" : "8px 10px",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F4F4F5";
              e.currentTarget.style.borderColor = "#E4E4E7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FAFAFA";
              e.currentTarget.style.borderColor = "#F0F0F0";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar src={currentUser.avatar} name={fullName} size="sm" />
              {!collapsed && (
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#18181B",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 110,
                    }}
                  >
                    {fullName}
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#A1A1AA",
                    }}
                  >
                    {isHRAdmin ? "ADMIN" : isManager ? "MANAGER" : "EMPLOYEE"}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && <ChevronDown size={13} style={{ color: "#A1A1AA" }} />}

            {/* User Profile Popover */}
            {userMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: 0,
                  width: 200,
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 14,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                  padding: 6,
                  zIndex: 100,
                }}
              >
                <Link
                  href="/people/me?tab=Personal"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#374151",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <UserCheck size={14} color="#4F46E5" /> View Profile
                </Link>
                <Link
                  href="/company-settings"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#374151",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Settings size={14} color="#4F46E5" /> Company Settings
                </Link>
                <div style={{ height: 1, background: "#E5E7EB", margin: "4px 0" }} />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut({ redirectUrl: "/auth/sign-in" });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 10px",
                    border: "none",
                    background: "transparent",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#DC2626",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Top-Level Floating Flyout Popover (Position: Fixed, Z-Index 99999) ─── */}
      {/* Escapes ALL parent overflow boundaries so it's guaranteed visible on top! */}
      {flyoutState && (
        <div
          onMouseEnter={keepFlyoutOpen}
          onMouseLeave={handleItemMouseLeave}
          style={{
            position: "fixed",
            top: flyoutState.top,
            left: flyoutState.left,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 18,
            boxShadow: "0 14px 42px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.04)",
            padding: "12px 14px",
            minWidth: 185,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: 5,
            animation: "fadeIn 0.12s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#A1A1AA",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "2px 6px 6px 6px",
              borderBottom: "1px solid #F4F4F5",
              marginBottom: 4,
            }}
          >
            {flyoutState.label}
          </div>

          {/* Tree-connected links inside the flyout, matching the screenshot! */}
          <div
            style={{
              marginLeft: 8,
              borderLeft: "1.5px solid #E5E7EB",
              paddingLeft: 10,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {flyoutState.children.map((child) => {
              const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
              return (
                <div key={child.href} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: -10,
                      top: "50%",
                      width: 8,
                      height: 1.5,
                      background: "#E5E7EB",
                    }}
                  />
                  <Link
                    href={child.href}
                    onClick={() => setFlyoutState(null)}
                    style={{
                      flex: 1,
                      padding: "7px 12px",
                      borderRadius: 9,
                      fontSize: 12.5,
                      fontWeight: isChildActive ? 600 : 500,
                      color: isChildActive ? "#18181B" : "#52525B",
                      background: isChildActive ? "#F4F4F5" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.12s ease",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!isChildActive) e.currentTarget.style.background = "#FAFAFA";
                    }}
                    onMouseLeave={(e) => {
                      if (!isChildActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {child.label}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
