import type { User } from "@/types/supabase";
import { navigation } from "./navigation-config";

/**
 * Get user initials from user object for avatar display
 */
export function getUserInitials(user: User | null): string {
  if (!user?.email) return '?';

  const email = user.email;

  // Try to get initials from full name if available
  if (user.user_metadata?.full_name) {
    const names = user.user_metadata.full_name.split(' ');
    return names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // Otherwise use first two characters of email
  return email.slice(0, 2).toUpperCase();
}

/**
 * Get display name from user object
 */
export function getDisplayName(user: User | null): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
}

/**
 * Find navigation item name by pathname
 */
export function getPageTitle(pathname: string): string {
  const allItems = navigation.flatMap(s => s.items);
  const item = allItems.find(item => item.href === pathname);
  return item?.name || "Dashboard";
}
