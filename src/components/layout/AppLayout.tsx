"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const KNOWN_APP_PREFIXES = [
  '/dashboard', '/people', '/time-off', '/attendance', '/hiring', '/payroll',
  '/performance', '/benefits', '/promotions', '/scheduling', '/shift-scheduling',
  '/documents', '/workflows', '/roles-permissions', '/policies', '/holidays',
  '/offboarding', '/onboarding', '/my-onboarding', '/employee-relations',
  '/signatures', '/my-signatures', '/departments', '/org-chart', '/reports',
  '/team-requests', '/my-team', '/inbox', '/messaging', '/company-settings',
  '/support', '/total-rewards', '/engagement', '/time'
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/company/register') ||
    pathname.startsWith('/careers') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/how-it-works') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/contact');

  const isKnownAppRoute = KNOWN_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // If public route or unrecognized route (404), render cleanly without sidebar/topbar
  if (isPublic || !isKnownAppRoute) {
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
