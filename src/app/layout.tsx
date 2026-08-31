import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import { WidgetProvider } from '@/context/WidgetContext';
import { HRProvider } from '@/context/HRContext';
import { AppLayout } from '@/components/layout/AppLayout';

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
            <WidgetProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </WidgetProvider>
          </HRProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
