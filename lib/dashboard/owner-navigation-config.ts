import {
  LayoutDashboard,
  Building2,
  Server,
  Activity,
  DollarSign,
  Database,
  Settings,
  type LucideIcon
} from "lucide-react";

export interface OwnerNavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | null;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

export interface OwnerNavigationSection {
  title: string;
  items: OwnerNavigationItem[];
}

export const ownerNavigation: OwnerNavigationSection[] = [
  {
    title: "Platform",
    items: [
      {
        name: "Overview",
        href: "/owner",
        icon: LayoutDashboard,
        badge: null,
      },
      {
        name: "Telemetry & Costs",
        href: "/owner/telemetry",
        icon: Server,
        badge: null,
      },
      {
        name: "System Health",
        href: "/owner/system",
        icon: Activity,
        badge: null,
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        name: "Organizations",
        href: "/owner/organizations",
        icon: Building2,
        badge: null,
      },
      {
        name: "Revenue",
        href: "/owner/revenue",
        icon: DollarSign,
        badge: null,
      },
      {
        name: "Database",
        href: "/owner/database",
        icon: Database,
        badge: null,
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        name: "Platform Settings",
        href: "/owner/settings",
        icon: Settings,
        badge: null,
      },
    ],
  },
];
