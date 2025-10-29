import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import BillingDashboard from '@/components/billing/BillingDashboard';

interface Organization {
  id: string;
  name: string;
  plan_type?: string;
}

interface Membership {
  organization_id: string;
  role: string;
  organizations: Organization;
}

export default async function BillingPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Service Unavailable</h1>
        <p className="text-gray-600 mt-2">Database service is currently unavailable.</p>
      </div>
    );
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Get user's organizations
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, plan_type)')
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">No Organizations</h1>
        <p className="text-gray-600 mt-2">You don't belong to any organizations yet.</p>
      </div>
    );
  }

  const typedMemberships = memberships as Membership[];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="relative container mx-auto px-4 py-6 max-w-5xl">
        <Suspense fallback={
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground animate-pulse">Loading billing information...</div>
          </div>
        }>
          <BillingDashboard
            organizations={typedMemberships.map(m => ({
              id: m.organizations.id,
              name: m.organizations.name,
              planType: m.organizations.plan_type,
              role: m.role,
            }))}
          />
        </Suspense>
      </div>
    </div>
  );
}
