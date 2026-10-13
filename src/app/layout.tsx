import './globals.css';
import { ClerkProvider } from "@clerk/nextjs";
import { CompanyProvider } from '@/context/CompanyContext';
import { RoleProvider } from '@/context/RoleContext';
import { WidgetProvider } from '@/context/WidgetContext';
import { HRProvider } from '@/context/HRContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { OperationsProvider } from '@/context/OperationsContext';

import type { Metadata } from 'next';

import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'EasyHR — Modern People Operations & HR Suite',
  description: 'Intelligent workforce management, applicant tracking, leave management, and payroll engine.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <ClerkProvider>
          <CompanyProvider>
            <RoleProvider>
              <HRProvider>
                <OperationsProvider>
                  <WidgetProvider>
                    <ToastProvider>
                      <AppLayout>
                        {children}
                      </AppLayout>
                    </ToastProvider>
                  </WidgetProvider>
                </OperationsProvider>
              </HRProvider>
            </RoleProvider>
          </CompanyProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
