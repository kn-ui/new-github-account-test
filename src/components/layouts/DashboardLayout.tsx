import { ReactNode } from 'react';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: ReactNode; userRole?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}