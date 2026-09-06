import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import { WidgetProvider } from '@/context/WidgetContext';
import { HRProvider } from '@/context/HRContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { OperationsProvider } from '@/context/OperationsContext';

export const metadata = {
  title: 'EasyHR',
  description: 'Modern HR Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RoleProvider>
          <HRProvider>
            <OperationsProvider><WidgetProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </WidgetProvider></OperationsProvider>
          </HRProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
