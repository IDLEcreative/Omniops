import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface BehaviorSettings {
  welcomeMessage: string;
  placeholderText: string;
  botName: string;
  avatarUrl: string;
  [key: string]: any;
}

interface ContentSectionProps {
  settings: BehaviorSettings;
  onChange: (updates: Partial<BehaviorSettings>) => void;
}

export function ContentSection({ settings, onChange }: ContentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Content & Messages
        </CardTitle>
        <CardDescription>
          Customize the text and messaging in your chat widget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Welcome Message</Label>
          <Textarea
            value={settings.welcomeMessage}
            onChange={(e) => onChange({ welcomeMessage: e.target.value })}
            placeholder="Hi! How can I help you today?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Input Placeholder</Label>
          <Input
            value={settings.placeholderText}
            onChange={(e) => onChange({ placeholderText: e.target.value })}
            placeholder="Type your message..."
          />
        </div>

        <div className="space-y-2">
          <Label>Bot Name</Label>
          <Input
            value={settings.botName}
            onChange={(e) => onChange({ botName: e.target.value })}
            placeholder="Assistant"
          />
        </div>

        <div className="space-y-2">
          <Label>Avatar URL (optional)</Label>
          <Input
            value={settings.avatarUrl}
            onChange={(e) => onChange({ avatarUrl: e.target.value })}
            placeholder="https://example.com/avatar.png"
            type="url"
          />
        </div>
      </CardContent>
    </Card>
  );
}