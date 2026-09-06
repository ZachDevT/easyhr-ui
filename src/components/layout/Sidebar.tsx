"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  Users,
  Clock,
  CalendarDays,
  Briefcase,
  PieChart,
  ClipboardList,
  FileSignature,
  DollarSign,
  Network,
  Scale,
  Book,
  ChevronDown,
  ChevronUp,
  CalendarRange,
  TrendingUp,
  Star,
  Gift,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  GitBranch,
  Award,
  Settings2,
  ShieldCheck,
  FolderOpen,
  Inbox,
  UserMinus,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { Avatar } from '../ui/Avatar';
import { EasyHRLogo, EasyHRMark } from '../marketing/EasyHRLogo';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  collapsed: boolean;
}

function NavItem({ href, icon, label, isActive, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 9,
        padding: collapsed ? '8px 0' : '8px 10px',
        borderRadius: 8,
        margin: '1px 8px',
        background: isActive ? 'var(--primary-tint)' : 'transparent',
        color: isActive ? 'var(--primary)' : 'var(--text-3)',
        fontWeight: isActive ? 700 : 500,
        fontSize: 13.5,
        textDecoration: 'none',
        transition: 'background 0.15s ease, color 0.15s ease',
        justifyContent: collapsed ? 'center' : 'flex-start',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        minHeight: 36,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-page)';
          e.currentTarget.style.color = 'var(--text-1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-3)';
        }
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
      {!collapsed && (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{label}</span>
      )}
    </Link>
  );
}

interface NavGroupProps {
  label: string;
  children: React.ReactNode;
  collapsed: boolean;
  defaultOpen?: boolean;
}

function NavGroup({ label, children, collapsed, defaultOpen = true }: NavGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return (
      <div style={{ borderTop: '1px solid var(--card-border)', marginTop: 6, paddingTop: 6 }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '5px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-5)',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        <span>{label}</span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && <div style={{ paddingTop: 2 }}>{children}</div>}
    </div>
  );
}

export function Sidebar() {
  const { role, currentUser } = useRole();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isHRAdmin = role === 'HR Admin';
  const isManager = role === 'Manager';
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`;

  const isActive = (path: string, exact = false) => {
    return exact ? pathname === path : pathname.startsWith(path);
  };

  return (
    <aside
      style={{
        width: collapsed ? 56 : 224,
        flexShrink: 0,
        background: 'white',
        borderRight: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
      }}
    >
      {/* Logo + Collapse Button Row */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '0 10px' : '0 12px 0 16px',
          borderBottom: '1px solid var(--card-border)',
          flexShrink: 0,
          gap: 8,
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', overflow: 'hidden', flex: 1, paddingLeft: collapsed ? 0 : 4 }}>
          {collapsed ? (
            <EasyHRMark size={28} />
          ) : (
            <EasyHRLogo size={28} />
          )}
        </Link>

        {/* Collapse toggle - always visible inside the header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 7,
            background: 'var(--bg-page)',
            border: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-3)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary-tint)';
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-page)';
            e.currentTarget.style.color = 'var(--text-3)';
            e.currentTarget.style.borderColor = 'var(--card-border)';
          }}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>

        <NavItem href="/dashboard" icon={<Home size={16} strokeWidth={2} />} label="Home" isActive={isActive('/dashboard', true)} collapsed={collapsed} />

        {/* MY INFO */}
        <NavGroup label="My Info" collapsed={collapsed} defaultOpen={true}>
          <NavItem href="/people/me" icon={<User size={16} strokeWidth={2} />} label="My Profile" isActive={isActive('/people/me')} collapsed={collapsed} />
          <NavItem href="/time" icon={<Clock size={16} strokeWidth={2} />} label="Time Tracking" isActive={isActive('/time', true)} collapsed={collapsed} />
          <NavItem href="/time-off" icon={<CalendarDays size={16} strokeWidth={2} />} label="Time Off" isActive={isActive('/time-off')} collapsed={collapsed} />
          <NavItem href="/my-signatures" icon={<FileSignature size={16} strokeWidth={2} />} label="My Signatures" isActive={isActive('/my-signatures')} collapsed={collapsed} />
          <NavItem href="/my-onboarding" icon={<ClipboardList size={16} strokeWidth={2} />} label="My Onboarding" isActive={isActive('/my-onboarding')} collapsed={collapsed} />
          <NavItem href="/org-chart" icon={<Network size={16} strokeWidth={2} />} label="Org Chart" isActive={isActive('/org-chart')} collapsed={collapsed} />
          {!isManager && !isHRAdmin && <NavItem href="/people" icon={<Users size={16} strokeWidth={2} />} label="People Directory" isActive={isActive('/people', true)} collapsed={collapsed} />}
          {!isManager && <NavItem href="/inbox" icon={<Inbox size={16} strokeWidth={2} />} label={isHRAdmin ? 'HR Approval Inbox' : 'Notifications'} isActive={isActive('/inbox')} collapsed={collapsed} />}
        </NavGroup>

        {/* COMPANY (Manager + HR Admin) */}
        {(isHRAdmin || isManager) && (
          <NavGroup label="Company" collapsed={collapsed} defaultOpen={true}>
            {isManager && <NavItem href="/my-team" icon={<Users size={16} strokeWidth={2} />} label="My Team" isActive={isActive('/my-team')} collapsed={collapsed} />}
            {isManager && <NavItem href="/team-requests" icon={<ClipboardList size={16} strokeWidth={2} />} label="Team Requests" isActive={isActive('/team-requests')} collapsed={collapsed} />}
            <NavItem href="/people" icon={<Users size={16} strokeWidth={2} />} label="People Directory" isActive={isActive('/people', true)} collapsed={collapsed} />
            <NavItem href="/attendance" icon={<Clock size={16} strokeWidth={2} />} label="Team Attendance" isActive={isActive('/attendance')} collapsed={collapsed} />
            <NavItem href="/shift-scheduling" icon={<CalendarRange size={16} strokeWidth={2} />} label="Shift Scheduling" isActive={isActive('/shift-scheduling')} collapsed={collapsed} />
            <NavItem href="/reports" icon={<PieChart size={16} strokeWidth={2} />} label="Reports" isActive={isActive('/reports')} collapsed={collapsed} />
          </NavGroup>
        )}

        {/* HR ADMIN */}
        {isHRAdmin && (
          <NavGroup label="HR Admin" collapsed={collapsed} defaultOpen={true}>
            <NavItem href="/onboarding" icon={<ClipboardList size={16} strokeWidth={2} />} label="Onboarding" isActive={isActive('/onboarding', true)} collapsed={collapsed} />
            <NavItem href="/hiring" icon={<Briefcase size={16} strokeWidth={2} />} label="Hiring" isActive={isActive('/hiring')} collapsed={collapsed} />
            <NavItem href="/promotions" icon={<TrendingUp size={16} strokeWidth={2} />} label="Promotions" isActive={isActive('/promotions')} collapsed={collapsed} />
            <NavItem href="/performance" icon={<Star size={16} strokeWidth={2} />} label="Performance" isActive={isActive('/performance')} collapsed={collapsed} />
            <NavItem href="/engagement" icon={<Sparkles size={16} strokeWidth={2} />} label="Engagement" isActive={isActive('/engagement')} collapsed={collapsed} />
            <NavItem href="/workflows" icon={<GitBranch size={16} strokeWidth={2} />} label="Workflows" isActive={isActive('/workflows')} collapsed={collapsed} />
            <NavItem href="/signatures" icon={<FileSignature size={16} strokeWidth={2} />} label="Signatures" isActive={isActive('/signatures', true)} collapsed={collapsed} />
            <NavItem href="/departments" icon={<Network size={16} strokeWidth={2} />} label="Departments" isActive={isActive('/departments')} collapsed={collapsed} />
            <NavItem href="/employee-relations" icon={<Scale size={16} strokeWidth={2} />} label="Employee Relations" isActive={isActive('/employee-relations')} collapsed={collapsed} />
            <NavItem href="/offboarding" icon={<UserMinus size={16} strokeWidth={2} />} label="Offboarding" isActive={isActive('/offboarding')} collapsed={collapsed} />
            <NavItem href="/documents" icon={<FolderOpen size={16} strokeWidth={2} />} label="Employee Documents" isActive={isActive('/documents')} collapsed={collapsed} />
            <NavItem href="/policies" icon={<Book size={16} strokeWidth={2} />} label="Policies & Rules" isActive={isActive('/policies')} collapsed={collapsed} />
            <NavItem href="/payroll" icon={<DollarSign size={16} strokeWidth={2} />} label="Payroll" isActive={isActive('/payroll')} collapsed={collapsed} />
          </NavGroup>
        )}

        {/* SETTINGS */}
        {isHRAdmin && (
          <NavGroup label="Settings" collapsed={collapsed} defaultOpen={false}>
            <NavItem href="/holidays" icon={<CalendarRange size={16} strokeWidth={2} />} label="Company Holidays" isActive={isActive('/holidays')} collapsed={collapsed} />
            <NavItem href="/benefits" icon={<Gift size={16} strokeWidth={2} />} label="Benefits" isActive={isActive('/benefits')} collapsed={collapsed} />
            <NavItem href="/total-rewards" icon={<Award size={16} strokeWidth={2} />} label="Total Rewards" isActive={isActive('/total-rewards')} collapsed={collapsed} />
            <NavItem href="/company-settings" icon={<Settings2 size={16} strokeWidth={2} />} label="Company Settings" isActive={isActive('/company-settings')} collapsed={collapsed} />
            <NavItem href="/roles-permissions" icon={<ShieldCheck size={16} strokeWidth={2} />} label="Roles & Permissions" isActive={isActive('/roles-permissions')} collapsed={collapsed} />
          </NavGroup>
        )}

      </nav>

      {/* Footer / User */}
      <div
        style={{
          borderTop: '1px solid var(--card-border)',
          padding: collapsed ? '12px 10px' : '12px 14px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          overflow: 'hidden',
        }}
      >
        <Avatar src={currentUser.avatar} name={fullName} size="sm" />
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fullName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.title}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
