"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Users } from "lucide-react";
import { OrganizationMember, roleConfigs, getMemberInitials, formatDate } from "@/lib/dashboard/team-utils";

interface RoleManagerProps {
  selectedMember: OrganizationMember | null;
}

export function RoleManager({ selectedMember }: RoleManagerProps) {
  if (!selectedMember) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select a team member to view details</p>
        </CardContent>
      </Card>
    );
  }

  const roleConfig = roleConfigs[selectedMember.role as keyof typeof roleConfigs];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Avatar className="h-16 w-16 mx-auto">
            <AvatarFallback>{getMemberInitials(selectedMember.full_name)}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold mt-2">{selectedMember.full_name}</h3>
          <Badge className={roleConfig.color}>
            {roleConfig.label}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{selectedMember.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Joined {formatDate(selectedMember.joined_at)}</span>
          </div>
        </div>

        <Button className="w-full" variant="outline">Edit Permissions</Button>
      </CardContent>
    </Card>
  );
}
