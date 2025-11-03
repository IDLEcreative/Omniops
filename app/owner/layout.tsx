"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";
import { OwnerSidebar } from "@/components/dashboard/layout/OwnerSidebar";
import { Header } from "@/components/dashboard/layout/Header";
import { MobileNav } from "@/components/dashboard/layout/MobileNav";

// Owner-specific page titles
function getOwnerPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const page = segments[1] || 'overview';

  const titles: Record<string, string> = {
    'overview': 'Platform Overview',
    'telemetry': 'Telemetry & Costs',
    'system': 'System Health',
    'organizations': 'Organizations',
    'revenue': 'Revenue',
    'database': 'Database',
    'settings': 'Platform Settings',
  };

  return titles[page] || 'Owner Dashboard';
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  const pageTitle = getOwnerPageTitle(pathname);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile sidebar backdrop */}
        <MobileNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Owner Sidebar */}
        <OwnerSidebar
          collapsed={collapsed}
          sidebarOpen={sidebarOpen}
          onCollapsedChange={setCollapsed}
          onSidebarOpenChange={setSidebarOpen}
        />

        {/* Main content */}
        <div
          className={cn(
            "flex flex-col transition-all duration-300",
            collapsed ? "lg:pl-16" : "lg:pl-64"
          )}
        >
          {/* Top navigation bar */}
          <Header
            pageTitle={pageTitle}
            user={user}
            loading={loading}
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={signOut}
          />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
