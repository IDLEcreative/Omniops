"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, LogOut, User, Settings } from "lucide-react";
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
import type { User as SupabaseUser } from "@/types/supabase";
import { getUserInitials, getDisplayName } from "@/lib/dashboard/layout-utils";

interface HeaderProps {
  pageTitle: string;
  user: SupabaseUser | null;
  loading: boolean;
  onMenuClick: () => void;
  onLogout: () => Promise<void>;
}

export function Header({
  pageTitle,
  user,
  loading,
  onMenuClick,
  onLogout,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await onLogout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const displayName = getDisplayName(user);
  const initials = getUserInitials(user);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
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
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-2">
            {/* Show email/name next to avatar on larger screens */}
            <div className="hidden md:flex flex-col items-end mr-2">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">Logged in</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
