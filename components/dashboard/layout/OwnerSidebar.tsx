"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, X, HelpCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ownerNavigation } from "@/lib/dashboard/owner-navigation-config";

interface OwnerSidebarProps {
  collapsed: boolean;
  sidebarOpen: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onSidebarOpenChange: (open: boolean) => void;
}

export function OwnerSidebar({
  collapsed,
  sidebarOpen,
  onCollapsedChange,
  onSidebarOpenChange,
}: OwnerSidebarProps) {
  const pathname = usePathname();

  return (
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
          href="/owner"
          className={cn(
            "flex items-center space-x-2 font-semibold",
            collapsed && "justify-center"
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
            <Crown className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg">Omniops</span>
              <span className="text-xs text-muted-foreground">Platform Owner</span>
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn("lg:hidden", collapsed && "hidden")}
          onClick={() => onSidebarOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {ownerNavigation.map((section) => (
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
                      <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
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
            <TooltipContent side="right">Platform Documentation</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/owner/docs">
              <HelpCircle className="mr-2 h-4 w-4" />
              Platform Docs
            </Link>
          </Button>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn("hidden lg:flex w-full", collapsed && "justify-center")}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>
    </aside>
  );
}
