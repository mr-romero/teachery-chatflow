
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold text-primary">TeachFlow</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/teacher" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname.includes('/teacher') ? "text-primary" : "text-foreground/60"
                )}
              >
                Teacher Portal
              </Link>
              <Link 
                to="/student" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname.includes('/student') ? "text-primary" : "text-foreground/60"
                )}
              >
                Student Portal
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto animate-fade-in py-6">
        <div className="container mx-auto h-full">
          {children}
        </div>
      </main>
      <footer className="border-t py-4 bg-white/80 backdrop-blur-md">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2023 TeachFlow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
