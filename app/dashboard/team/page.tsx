"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, UserPlus, Search, Mail, Phone, Shield, Crown, UserCheck, MoreVertical,
  X, Settings, MessageSquare, Star, Activity,
} from "lucide-react";

const mockMembers = [
  {
    id: "1", name: "Sarah Chen", email: "sarah.chen@company.com", phone: "+1 (555) 123-4567",
    avatar: "/avatars/sarah.jpg", role: "Admin", department: "Customer Success", status: "online",
    permissions: ["full_access", "user_management", "analytics"], stats: { conversations: 234, satisfaction: 98, tickets: 12 },
  },
  {
    id: "2", name: "Mike Johnson", email: "mike.johnson@company.com", phone: "+1 (555) 987-6543",
    avatar: "/avatars/mike.jpg", role: "Agent", department: "Technical Support", status: "online",
    permissions: ["customer_support", "ticket_management"], stats: { conversations: 189, satisfaction: 94, tickets: 8 },
  },
  {
    id: "3", name: "Emma Davis", email: "emma.davis@company.com", phone: "+1 (555) 456-7890",
    avatar: "/avatars/emma.jpg", role: "Viewer", department: "Analytics", status: "away",
    permissions: ["read_only", "reporting"], stats: { conversations: 0, satisfaction: 0, tickets: 0 },
  },
];

const roleConfigs = {
  Admin: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", icon: Crown },
  Agent: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", icon: UserCheck },
  Viewer: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400", icon: Shield },
};

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<typeof mockMembers[0] | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "Agent", department: "" });

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: string) => ({
    online: "bg-green-500", away: "bg-yellow-500", offline: "bg-gray-400"
  }[status] || "bg-gray-400");

  const handleInviteMember = () => {
    console.log("Inviting member:", inviteForm);
    setShowInviteModal(false);
    setInviteForm({ name: "", email: "", role: "Agent", department: "" });
  };

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

  const MemberCard = ({ member }: { member: typeof mockMembers[0] }) => {
    const roleConfig = roleConfigs[member.role as keyof typeof roleConfigs];
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
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center">
                  {member.name}
                  <RoleIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                </h4>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={roleConfig.color}>{member.role}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{member.status}</Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div>{member.department}</div>
              {member.stats.conversations > 0 && (
                <>
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />{member.stats.conversations}
                  </div>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />{member.stats.satisfaction}%
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage your customer service team members and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline"><Settings className="h-4 w-4 mr-2" />Settings</Button>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />Invite Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={mockMembers.length} description="Active team members" icon={Users} />
        <StatCard title="Online Now" value={mockMembers.filter(m => m.status === "online").length} description="Currently active" icon={Activity} />
        <StatCard title="Avg Satisfaction" value="96%" description="Team average" icon={Star} />
        <StatCard title="Active Tickets" value={mockMembers.reduce((sum, m) => sum + m.stats.tickets, 0)} description="Being handled" icon={MessageSquare} />
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
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
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
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Agent">Agent</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
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
                        : "Invite team members to collaborate on customer support"
                    }
                    actionLabel="Invite Team Member"
                    onAction={() => setShowInviteModal(true)}
                    variant="default"
                  />
                ) : (
                  filteredMembers.map((member) => <MemberCard key={member.id} member={member} />)
                )}
              </div>
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
                  <div className="relative inline-block">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedMember.avatar} />
                      <AvatarFallback>{selectedMember.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(selectedMember.status)}`} />
                  </div>
                  <h3 className="font-semibold mt-2">{selectedMember.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.department}</p>
                  <Badge className={roleConfigs[selectedMember.role as keyof typeof roleConfigs].color}>{selectedMember.role}</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedMember.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedMember.phone}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="font-medium">Permissions</h4>
                  {selectedMember.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="mr-1 mb-1">
                      {permission.replace('_', ' ')}
                    </Badge>
                  ))}
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
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={inviteForm.name} onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})} placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} placeholder="Enter email address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Agent">Agent</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={inviteForm.department} onChange={(e) => setInviteForm({...inviteForm, department: e.target.value})} placeholder="e.g., Customer Support" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleInviteMember}>Send Invite</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}