'use client';

import React, { useEffect, useState } from 'react';
import { OrganizationMember } from '@/types/organizations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserMinus, Mail, UserPlus } from 'lucide-react';
import { SeatUsageIndicator, SeatUsageBadge } from './seat-usage-indicator';
import { UpgradeSeatsModal } from './upgrade-seats-modal';
import { InviteMemberForm } from './invite-member-form';

interface TeamMembersListProps {
  organizationId: string;
  userRole: 'owner' | 'admin' | 'member' | 'viewer';
}

export function TeamMembersList({ organizationId, userRole }: TeamMembersListProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [seatInfo, setSeatInfo] = useState<{
    currentPlan: string;
    currentSeats: number;
    currentUsage: number;
  } | null>(null);

  const canManageMembers = ['owner', 'admin'].includes(userRole);

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  async function fetchMembers() {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch members
      const membersResponse = await fetch(`/api/organizations/${organizationId}/members`);
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch members');
      }
      const membersData = await membersResponse.json();
      setMembers(membersData.members || []);

      // Fetch seat usage info
      const invitationsResponse = await fetch(`/api/organizations/${organizationId}/invitations`);
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        if (invitationsData.seat_usage) {
          setSeatInfo({
            currentPlan: invitationsData.seat_usage.plan_type || 'free',
            currentSeats: invitationsData.seat_usage.limit || 5,
            currentUsage: invitationsData.seat_usage.used || 0,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      // Refresh members list
      fetchMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Loading members...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription className="text-red-500">Error: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      {/* Seat Usage Indicator */}
      <div className="mb-6">
        <SeatUsageIndicator
          organizationId={organizationId}
          onUpgrade={() => setShowUpgradeModal(true)}
          showDetails={true}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                  <SeatUsageBadge organizationId={organizationId} />
                </div>
              </CardDescription>
            </div>
            {canManageMembers && (
              <Button onClick={() => setShowInviteForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{member.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
                {canManageMembers && member.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Invite Member Form Modal */}
    {showInviteForm && (
      <InviteMemberForm
        organizationId={organizationId}
        onClose={() => setShowInviteForm(false)}
        onSuccess={() => {
          setShowInviteForm(false);
          fetchMembers();
        }}
      />
    )}

    {/* Upgrade Seats Modal */}
    {showUpgradeModal && seatInfo && (
      <UpgradeSeatsModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={seatInfo.currentPlan}
        currentSeats={seatInfo.currentSeats}
        currentUsage={seatInfo.currentUsage}
        organizationId={organizationId}
      />
    )}
    </>
  );
}
