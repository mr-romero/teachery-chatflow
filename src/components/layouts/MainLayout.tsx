import React from 'react';
import { Toaster } from 'sonner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/20">
      <main className="container mx-auto h-screen max-w-7xl">
        {children}
      </main>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default MainLayout;
