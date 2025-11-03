import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  Server,
  Code2,
  Shield,
  Bot,
  Palette,
  UserPlus,
  Download,
  ShoppingBag,
  type LucideIcon
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | null;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigation: NavigationSection[] = [
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
        name: "Shop",
        href: "/dashboard/shop",
        icon: ShoppingBag,
        badge: null,
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
        name: "Installation",
        href: "/dashboard/installation",
        icon: Download,
        badge: null,
      },
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
