import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

interface BehaviorSettings {
  showAvatar: boolean;
  showTypingIndicator: boolean;
  autoOpen: boolean;
  minimizable: boolean;
  soundNotifications: boolean;
  persistConversation: boolean;
  [key: string]: any;
}

interface BehaviorSectionProps {
  settings: BehaviorSettings;
  onChange: (updates: Partial<BehaviorSettings>) => void;
}

export function BehaviorSection({ settings, onChange }: BehaviorSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Widget Behavior
        </CardTitle>
        <CardDescription>
          Configure how your chat widget behaves
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Avatar</Label>
            <p className="text-sm text-muted-foreground">
              Display bot avatar in messages
            </p>
          </div>
          <Switch
            checked={settings.showAvatar}
            onCheckedChange={(checked) => onChange({ showAvatar: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Typing Indicator</Label>
            <p className="text-sm text-muted-foreground">
              Show typing animation when bot is responding
            </p>
          </div>
          <Switch
            checked={settings.showTypingIndicator}
            onCheckedChange={(checked) => onChange({ showTypingIndicator: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto Open</Label>
            <p className="text-sm text-muted-foreground">
              Automatically open chat widget on page load
            </p>
          </div>
          <Switch
            checked={settings.autoOpen}
            onCheckedChange={(checked) => onChange({ autoOpen: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Minimizable</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to minimize the chat widget
            </p>
          </div>
          <Switch
            checked={settings.minimizable}
            onCheckedChange={(checked) => onChange({ minimizable: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Sound Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Play sound for new messages
            </p>
          </div>
          <Switch
            checked={settings.soundNotifications}
            onCheckedChange={(checked) => onChange({ soundNotifications: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Persist Conversation</Label>
            <p className="text-sm text-muted-foreground">
              Remember conversation across page reloads
            </p>
          </div>
          <Switch
            checked={settings.persistConversation}
            onCheckedChange={(checked) => onChange({ persistConversation: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}