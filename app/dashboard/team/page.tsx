"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SeatUsageIndicator } from "@/components/organizations/seat-usage-indicator";
import { UpgradeSeatsModal } from "@/components/organizations/upgrade-seats-modal";
import { TeamMemberList } from "@/components/dashboard/team/TeamMemberList";
import { InviteModal } from "@/components/dashboard/team/InviteModal";
import { RoleManager } from "@/components/dashboard/team/RoleManager";
import {
  Users, UserPlus, Settings, Mail, Shield, AlertTriangle, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import {
  OrganizationMember,
  Invitation,
  InviteFormData
} from "@/lib/dashboard/team-utils";

export default function TeamPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({ email: "", role: "member" });

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [seatLimit, setSeatLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const loadOrganizationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to view team members");
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(id, plan_type, seat_limit)')
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membership) {
        setError("No organization found. Please create an organization first.");
        return;
      }

      const orgId = membership.organization_id;
      const org = (membership as any).organizations;

      setOrganizationId(orgId);
      setCurrentPlan(org.plan_type || 'free');
      setSeatLimit(org.seat_limit || 5);

      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          users:user_id (
            email,
            raw_user_meta_data
          )
        `)
        .eq('organization_id', orgId);

      if (membersError) throw membersError;

      const transformedMembers = (membersData || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        email: member.users?.email,
        full_name: member.users?.raw_user_meta_data?.full_name || member.users?.email?.split('@')[0],
      }));

      setMembers(transformedMembers);

      const { data: invitationsData, error: invitationsError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', orgId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) throw invitationsError;
      setInvitations(invitationsData || []);

    } catch (err) {
      console.error('Error loading organization data:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizationData();
  }, [loadOrganizationData]);

  const handleInviteMember = async () => {
    if (!organizationId) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.details?.upgrade_required) {
          setShowInviteModal(false);
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || 'Failed to send invitation');
      }

      setShowInviteModal(false);
      setInviteForm({ email: "", role: "member" });
      loadOrganizationData();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const availableSeats = seatLimit === -1 ? "∞" : Math.max(0, seatLimit - members.length - invitations.length);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage your team members and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {organizationId && (
        <SeatUsageIndicator
          organizationId={organizationId}
          onUpgrade={() => setShowUpgradeModal(true)}
          showDetails={true}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={members.length}
          description="Active team members"
          icon={Users}
        />
        <StatCard
          title="Pending Invites"
          value={invitations.length}
          description="Awaiting acceptance"
          icon={Mail}
        />
        <StatCard
          title="Seat Limit"
          value={seatLimit === -1 ? "Unlimited" : seatLimit}
          description={currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) + " plan"}
          icon={Shield}
        />
        <StatCard
          title="Available Seats"
          value={availableSeats}
          description="Can invite more"
          icon={UserPlus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TeamMemberList
            members={members}
            invitations={invitations}
            onSelectMember={setSelectedMember}
            selectedMemberId={selectedMember?.id}
            onInviteClick={() => setShowInviteModal(true)}
          />
        </div>

        <div>
          <RoleManager selectedMember={selectedMember} />
        </div>
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteForm={inviteForm}
        onInviteFormChange={setInviteForm}
        onSubmit={handleInviteMember}
        isInviting={isInviting}
        error={inviteError}
      />

      {organizationId && (
        <UpgradeSeatsModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={currentPlan}
          currentSeats={seatLimit}
          currentUsage={members.length + invitations.length}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
