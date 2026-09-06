"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublic = pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/company/register') || pathname.startsWith('/careers') || pathname.startsWith('/features') || pathname.startsWith('/how-it-works') || pathname.startsWith('/pricing');

  if (isPublic) {
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
