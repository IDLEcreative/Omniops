"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeatUsageIndicator } from "@/components/organizations/seat-usage-indicator";
import { UpgradeSeatsModal } from "@/components/organizations/upgrade-seats-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users, UserPlus, Search, Mail, Phone, Shield, Crown, UserCheck, MoreVertical,
  X, Settings, MessageSquare, Star, Activity, AlertTriangle, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase-client";

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email?: string;
  full_name?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
}

const roleConfigs = {
  owner: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", icon: Crown, label: "Owner" },
  admin: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400", icon: Shield, label: "Admin" },
  member: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", icon: UserCheck, label: "Member" },
  viewer: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400", icon: Users, label: "Viewer" },
};

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [seatLimit, setSeatLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to view team members");
        return;
      }

      // Get user's organization
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

      // Load members
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

      // Transform members data
      const transformedMembers = (membersData || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        email: member.users?.email,
        full_name: member.users?.raw_user_meta_data?.full_name || member.users?.email?.split('@')[0],
      }));

      setMembers(transformedMembers);

      // Load pending invitations
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
  };

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
      loadOrganizationData(); // Refresh data
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const StatCard = ({ title, value, description, icon: Icon }: any) => (
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

  const MemberCard = ({ member }: { member: OrganizationMember }) => {
    const roleConfig = roleConfigs[member.role as keyof typeof roleConfigs] || roleConfigs.member;
    const RoleIcon = roleConfig.icon;
    return (
      <div
        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
          selectedMember?.id === member.id ? "border-primary bg-accent" : "hover:bg-accent/50"
        }`}
        onClick={() => setSelectedMember(member)}
      >
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{member.full_name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center">
                  {member.full_name}
                  <RoleIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                </h4>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
            </div>

            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div>Joined {new Date(member.joined_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage your team members and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline"><Settings className="h-4 w-4 mr-2" />Settings</Button>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />Invite Member
          </Button>
        </div>
      </div>

      {/* Seat Usage Indicator */}
      {organizationId && (
        <SeatUsageIndicator
          organizationId={organizationId}
          onUpgrade={() => setShowUpgradeModal(true)}
          showDetails={true}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={members.length} description="Active team members" icon={Users} />
        <StatCard title="Pending Invites" value={invitations.length} description="Awaiting acceptance" icon={Mail} />
        <StatCard title="Seat Limit" value={seatLimit === -1 ? "Unlimited" : seatLimit} description={currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) + " plan"} icon={Shield} />
        <StatCard title="Available Seats" value={seatLimit === -1 ? "∞" : Math.max(0, seatLimit - members.length - invitations.length)} description="Can invite more" icon={UserPlus} />
      </div>

      {/* Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage roles and permissions</CardDescription>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMembers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title={searchTerm || selectedRole !== "all" ? "No matching team members" : "No team members yet"}
                    description={
                      searchTerm || selectedRole !== "all"
                        ? "Try adjusting your search or filter settings"
                        : "Invite team members to collaborate"
                    }
                    actionLabel="Invite Team Member"
                    onAction={() => setShowInviteModal(true)}
                    variant="default"
                  />
                ) : (
                  filteredMembers.map((member) => <MemberCard key={member.id} member={member} />)
                )}
              </div>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4">Pending Invitations ({invitations.length})</h4>
                  <div className="space-y-2">
                    {invitations.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited {new Date(invite.created_at).toLocaleDateString()} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{invite.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Member Details */}
        <div>
          {selectedMember ? (
            <Card>
              <CardHeader><CardTitle>Member Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarFallback>{selectedMember.full_name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold mt-2">{selectedMember.full_name}</h3>
                  <Badge className={roleConfigs[selectedMember.role as keyof typeof roleConfigs].color}>
                    {roleConfigs[selectedMember.role as keyof typeof roleConfigs].label}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedMember.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined {new Date(selectedMember.joined_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button className="w-full" variant="outline">Edit Permissions</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a team member to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invite Team Member</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowInviteModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Add a new member to your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inviteError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{inviteError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  placeholder="colleague@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)} disabled={isInviting}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleInviteMember} disabled={isInviting || !inviteForm.email}>
                  {isInviting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : 'Send Invite'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Modal */}
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
