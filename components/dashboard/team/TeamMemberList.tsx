"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Mail } from "lucide-react";
import {
  OrganizationMember,
  Invitation,
  roleConfigs,
  filterMembers,
  getMemberInitials,
  formatDate
} from "@/lib/dashboard/team-utils";

interface TeamMemberListProps {
  members: OrganizationMember[];
  invitations: Invitation[];
  onSelectMember: (member: OrganizationMember) => void;
  selectedMemberId?: string;
  onInviteClick: () => void;
}

export function TeamMemberList({
  members,
  invitations,
  onSelectMember,
  selectedMemberId,
  onInviteClick,
}: TeamMemberListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const filteredMembers = filterMembers(members, searchTerm, selectedRole);

  return (
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
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
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
              onAction={onInviteClick}
              variant="default"
            />
          ) : (
            filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelected={selectedMemberId === member.id}
                onClick={() => onSelectMember(member)}
              />
            ))
          )}
        </div>

        {invitations.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-4">Pending Invitations ({invitations.length})</h4>
            <div className="space-y-2">
              {invitations.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited {formatDate(invite.created_at)} • Expires {formatDate(invite.expires_at)}
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
  );
}

interface MemberCardProps {
  member: OrganizationMember;
  isSelected: boolean;
  onClick: () => void;
}

function MemberCard({ member, isSelected, onClick }: MemberCardProps) {
  const roleConfig = roleConfigs[member.role as keyof typeof roleConfigs] || roleConfigs.member;
  const RoleIcon = roleConfig.icon;

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        isSelected ? "border-primary bg-accent" : "hover:bg-accent/50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{getMemberInitials(member.full_name)}</AvatarFallback>
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
            <div>Joined {formatDate(member.joined_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
