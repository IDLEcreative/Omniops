import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface MessagesCardProps {
  botName: string;
  welcomeMessage: string;
  placeholderText: string;
  onChange: (updates: {
    botName?: string;
    welcomeMessage?: string;
    placeholderText?: string;
  }) => void;
}

export function MessagesCard({
  botName,
  welcomeMessage,
  placeholderText,
  onChange
}: MessagesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Messages
        </CardTitle>
        <CardDescription>
          Customize the chat messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="botName">Bot Name</Label>
          <Input
            id="botName"
            value={botName}
            onChange={(e) => onChange({ botName: e.target.value })}
            placeholder="Assistant"
            maxLength={30}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Textarea
            id="welcomeMessage"
            value={welcomeMessage}
            onChange={(e) => onChange({ welcomeMessage: e.target.value })}
            placeholder="Hi! How can I help you today?"
            rows={2}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {welcomeMessage.length}/200 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeholderText">Input Placeholder</Label>
          <Input
            id="placeholderText"
            value={placeholderText}
            onChange={(e) => onChange({ placeholderText: e.target.value })}
            placeholder="Type your message..."
            maxLength={50}
          />
        </div>
      </CardContent>
    </Card>
  );
}
