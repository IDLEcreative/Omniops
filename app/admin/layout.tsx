'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Globe, 
  Shield, 
  Settings,
  LogOut,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Website Scraping',
    href: '/admin/scraping',
    icon: Globe,
  },
  {
    title: 'Privacy & Security',
    href: '/admin/privacy',
    icon: Shield,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    badge: 'Coming Soon',
  },
  {
    title: 'Conversations',
    href: '/admin/conversations',
    icon: MessageSquare,
    badge: 'Coming Soon',
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <Link href="/" className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="font-semibold">AI Chat Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4 space-y-2">
            <Link href="/configure">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Widget Settings
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              size="sm"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}