"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { InviteFormData } from "@/lib/dashboard/team-utils";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteForm: InviteFormData;
  onInviteFormChange: (form: InviteFormData) => void;
  onSubmit: () => void;
  isInviting: boolean;
  error: string | null;
}

export function InviteModal({
  isOpen,
  onClose,
  inviteForm,
  onInviteFormChange,
  onSubmit,
  isInviting,
  error,
}: InviteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invite Team Member</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Add a new member to your team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={inviteForm.email}
              onChange={(e) => onInviteFormChange({...inviteForm, email: e.target.value})}
              placeholder="colleague@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={inviteForm.role}
              onValueChange={(value) => onInviteFormChange({...inviteForm, role: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isInviting}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={onSubmit} disabled={isInviting || !inviteForm.email}>
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
