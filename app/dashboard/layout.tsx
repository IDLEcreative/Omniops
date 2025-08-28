"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  BarChart3, 
  Code2, 
  Shield, 
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Bot,
  Globe,
  Palette,
  Bell,
  LogOut,
  User,
  ChevronLeft,
  Home,
  FileText,
  Layers,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/error-boundary";

const navigation = [
  {
    title: "Main",
    items: [
      {
        name: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        badge: null,
      },
      {
        name: "Conversations",
        href: "/dashboard/conversations",
        icon: MessageSquare,
        badge: "12",
        badgeVariant: "default",
      },
      {
        name: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        badge: null,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        name: "Customers",
        href: "/dashboard/customers",
        icon: Users,
        badge: null,
      },
      {
        name: "Bot Training",
        href: "/dashboard/training",
        icon: Bot,
        badge: "New",
        badgeVariant: "secondary",
      },
      {
        name: "Team",
        href: "/dashboard/team",
        icon: UserPlus,
        badge: null,
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        name: "Integrations",
        href: "/dashboard/integrations",
        icon: Code2,
        badge: null,
      },
      {
        name: "Customization",
        href: "/dashboard/customize",
        icon: Palette,
        badge: null,
      },
      {
        name: "Privacy & Security",
        href: "/dashboard/privacy",
        icon: Shield,
        badge: null,
      },
      {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        badge: null,
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300",
            collapsed ? "w-16" : "w-64",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link 
              href="/dashboard" 
              className={cn(
                "flex items-center space-x-2 font-semibold",
                collapsed && "justify-center"
              )}
            >
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              {!collapsed && (
                <span className="text-lg">Omniops</span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className={cn("lg:hidden", collapsed && "hidden")}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-6">
              {navigation.map((section) => (
                <div key={section.title}>
                  {!collapsed && (
                    <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      const NavLink = (
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            collapsed && "justify-center px-2"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 flex-shrink-0")} />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.name}</span>
                              {item.badge && (
                                <Badge 
                                  variant={item.badgeVariant as any || "default"} 
                                  className="ml-auto"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </Link>
                      );

                      return collapsed ? (
                        <Tooltip key={item.name} delayDuration={0}>
                          <TooltipTrigger asChild>
                            {NavLink}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-4">
                            {item.name}
                            {item.badge && (
                              <Badge variant={item.badgeVariant as any || "default"}>
                                {item.badge}
                              </Badge>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div key={item.name}>{NavLink}</div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Help Section */}
          <div className="border-t p-4">
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-full">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Help & Documentation
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Docs
                </Link>
              </Button>
            )}
          </div>

          {/* Collapse Toggle */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={cn("hidden lg:flex w-full", collapsed && "justify-center")}
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className={cn(
          "flex flex-col transition-all duration-300",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}>
          {/* Top navigation bar */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>

            {/* Breadcrumb or Page Title can go here */}
            <div className="flex-1">
              <h1 className="text-lg font-semibold">
                {navigation.flatMap(s => s.items).find(item => item.href === pathname)?.name || "Dashboard"}
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden md:flex">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search..."
                    className="h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="@johndoe" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">John Doe</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        john.doe@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}