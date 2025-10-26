"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";

interface CredentialsFormProps {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  onStoreUrlChange: (url: string) => void;
  onConsumerKeyChange: (key: string) => void;
  onConsumerSecretChange: (secret: string) => void;
}

export function CredentialsForm({
  storeUrl,
  consumerKey,
  consumerSecret,
  onStoreUrlChange,
  onConsumerKeyChange,
  onConsumerSecretChange,
}: CredentialsFormProps) {
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const formatStoreUrl = (value: string) => {
    let formatted = value.trim();

    // Add https:// if no protocol
    if (formatted && !formatted.match(/^https?:\/\//i)) {
      formatted = `https://${formatted}`;
    }

    // Remove trailing slash
    formatted = formatted.replace(/\/$/, "");

    return formatted;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Configuration</CardTitle>
        <CardDescription>Enter your WooCommerce store details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Store URL */}
        <div className="space-y-2">
          <Label htmlFor="storeUrl">Store URL *</Label>
          <Input
            id="storeUrl"
            type="url"
            value={storeUrl}
            onChange={(e) => onStoreUrlChange(formatStoreUrl(e.target.value))}
            placeholder="https://your-store.com"
            className="font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">
            The full URL of your WooCommerce store (e.g., https://example.com)
          </p>
        </div>

        {/* Consumer Key */}
        <div className="space-y-2">
          <Label htmlFor="consumerKey">Consumer Key *</Label>
          <div className="relative">
            <Input
              id="consumerKey"
              type={showKey ? "text" : "password"}
              value={consumerKey}
              onChange={(e) => onConsumerKeyChange(e.target.value)}
              placeholder="ck_..."
              className="font-mono text-sm pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Encrypted with AES-256-GCM before storage</span>
          </div>
        </div>

        {/* Consumer Secret */}
        <div className="space-y-2">
          <Label htmlFor="consumerSecret">Consumer Secret *</Label>
          <div className="relative">
            <Input
              id="consumerSecret"
              type={showSecret ? "text" : "password"}
              value={consumerSecret}
              onChange={(e) => onConsumerSecretChange(e.target.value)}
              placeholder="cs_..."
              className="font-mono text-sm pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Encrypted with AES-256-GCM before storage</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
