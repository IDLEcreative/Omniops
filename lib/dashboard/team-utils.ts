import { Crown, Shield, UserCheck, Users } from "lucide-react";

export interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email?: string;
  full_name?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
}

export interface InviteFormData {
  email: string;
  role: string;
}

export const roleConfigs = {
  owner: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    icon: Crown,
    label: "Owner"
  },
  admin: {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    icon: Shield,
    label: "Admin"
  },
  member: {
    color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    icon: UserCheck,
    label: "Member"
  },
  viewer: {
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    icon: Users,
    label: "Viewer"
  },
};

export function filterMembers(
  members: OrganizationMember[],
  searchTerm: string,
  selectedRole: string
): OrganizationMember[] {
  return members.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });
}

export function getMemberInitials(fullName?: string): string {
  return fullName?.split(' ').map(n => n[0]).join('') || 'U';
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}
