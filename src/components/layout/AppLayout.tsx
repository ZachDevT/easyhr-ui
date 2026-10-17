"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useCompany } from '@/context/CompanyContext';
import { useRole } from '@/context/RoleContext';

const KNOWN_APP_PREFIXES = [
  '/dashboard', '/people', '/time-off', '/attendance', '/hiring', '/payroll',
  '/performance', '/benefits', '/promotions', '/scheduling', '/shift-scheduling',
  '/documents', '/workflows', '/roles-permissions', '/policies', '/holidays',
  '/offboarding', '/onboarding', '/employee-relations',
  '/signatures', '/my-signatures', '/departments', '/org-chart', '/reports',
  '/team-requests', '/my-team', '/inbox', '/messaging', '/company-settings',
  '/support', '/total-rewards', '/engagement', '/time', '/announcements', '/chat'
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { userProfile, isLoading: companyLoading } = useCompany();
  const { isHRAdmin } = useRole();

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/company/register') ||
    pathname.startsWith('/careers') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/how-it-works') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/contact');

  const isStandalone = pathname === '/my-onboarding' || pathname.startsWith('/my-onboarding/');

  const isPendingOnboarding =
    authLoaded &&
    isSignedIn &&
    !companyLoading &&
    userProfile &&
    !isHRAdmin &&
    userProfile.employeeStatus === 'onboarding';

  // Strict onboarding lockout guard:
  // Employees pending onboarding cannot navigate to other workspace routes until completed
  useEffect(() => {
    if (isPendingOnboarding && !isStandalone && !isPublic) {
      router.replace('/my-onboarding');
    }
  }, [isPendingOnboarding, isStandalone, isPublic, router]);

  // Prevent flash of private dashboard while redirecting pending onboarding employee
  if (isPendingOnboarding && !isStandalone && !isPublic) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfafc' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>Loading your onboarding portal...</p>
        </div>
      </div>
    );
  }

  const isKnownAppRoute = KNOWN_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // If public route, standalone route (e.g. /my-onboarding), or unrecognized route (404), render cleanly without sidebar/topbar
  if (isPublic || isStandalone || !isKnownAppRoute) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
