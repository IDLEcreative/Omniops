"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";
import { getPageTitle } from "@/lib/dashboard/layout-utils";
import { Sidebar } from "@/components/dashboard/layout/Sidebar";
import { Header } from "@/components/dashboard/layout/Header";
import { MobileNav } from "@/components/dashboard/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  const pageTitle = getPageTitle(pathname);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile sidebar backdrop */}
        <MobileNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <Sidebar
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
