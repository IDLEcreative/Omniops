"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { EmbedCodeGenerator } from "@/components/configure/EmbedCodeGenerator";
import { WidgetConfig } from "@/lib/configure/wizard-utils";
import { setLocalStorage, getLocalStorage } from "@/lib/utils/storage";

interface QuickStartProps {
  serverUrl: string;
  domain: string;
  isLoading: boolean;
}

export function QuickStart({ serverUrl, domain, isLoading }: QuickStartProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Progress tracking with localStorage persistence
  const storageKey = `installation_progress_${domain}`;
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    const saved = getLocalStorage<number[]>(storageKey, []);
    return new Set(saved);
  });

  const handleStepToggle = (step: number, checked: boolean) => {
    const newSteps = new Set(completedSteps);
    if (checked) {
      newSteps.add(step);
    } else {
      newSteps.delete(step);
    }
    setCompletedSteps(newSteps);
    setLocalStorage(storageKey, Array.from(newSteps));
  };

  const progressPercentage = (completedSteps.size / 4) * 100;

  // Create default config for embed code generation
  const defaultConfig: WidgetConfig = {
    serverUrl: serverUrl || "https://your-domain.com",
    appearance: {
      theme: "light",
      primaryColor: "#4F46E5",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      position: "bottom-right",
      width: 400,
      height: 600,
      headerTitle: "Customer Support",
      headerSubtitle: "We're here to help!",
      welcomeMessage: "Hi! How can I help you today?",
      customCSS: "",
    },
    features: {
      websiteScraping: {
        enabled: true,
        urls: domain ? [domain] : [],
      },
      woocommerce: {
        enabled: false,
      },
      customKnowledge: {
        enabled: true,
        faqs: [],
      },
    },
    behavior: {
      autoOpen: false,
      autoOpenDelay: 3000,
      persistConversation: true,
    },
  };

  const getTestUrl = () => {
    return domain
      ? `/embed?domain=${encodeURIComponent(domain)}`
      : "/embed";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-center">
              <p className="text-sm font-medium">Loading your configuration...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fetching domain from your organization settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {domain ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Configuration Detected</AlertTitle>
          <AlertDescription>
            Installing for domain: <Badge variant="secondary">{domain}</Badge>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Domain Configured</AlertTitle>
          <AlertDescription className="mt-2">
            Please configure your domain in settings before installing the widget.
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <a href="/dashboard/settings">
                  Go to Settings →
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Embed Code Generator */}
      <EmbedCodeGenerator
        config={defaultConfig}
        customCSS=""
        isOnboarding={false}
      />

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            After copying the code, follow these steps to go live
          </CardDescription>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Installation Progress</span>
              <span className="font-medium">{completedSteps.size} of 4 completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="step-1"
                checked={completedSteps.has(1)}
                onCheckedChange={(checked) => handleStepToggle(1, checked as boolean)}
                className="mt-1"
              />
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <label htmlFor="step-1" className="font-medium cursor-pointer">
                  Add the code to your website
                </label>
                <p className="text-sm text-muted-foreground">
                  Paste the embed code before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag in your website's footer or layout template.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="step-2"
                checked={completedSteps.has(2)}
                onCheckedChange={(checked) => handleStepToggle(2, checked as boolean)}
                className="mt-1"
              />
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <label htmlFor="step-2" className="font-medium cursor-pointer">
                  Test on your staging site
                </label>
                <p className="text-sm text-muted-foreground">
                  Deploy to a test environment first to verify the widget appears and functions correctly before going live.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="step-3"
                checked={completedSteps.has(3)}
                onCheckedChange={(checked) => handleStepToggle(3, checked as boolean)}
                className="mt-1"
              />
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <label htmlFor="step-3" className="font-medium cursor-pointer">
                  Verify widget appearance
                </label>
                <p className="text-sm text-muted-foreground">
                  The widget should appear in the bottom-right corner. Click it to open the chat and test with a sample question.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="step-4"
                checked={completedSteps.has(4)}
                onCheckedChange={(checked) => handleStepToggle(4, checked as boolean)}
                className="mt-1"
              />
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <label htmlFor="step-4" className="font-medium cursor-pointer">
                  Deploy to production
                </label>
                <p className="text-sm text-muted-foreground">
                  Once verified, deploy the changes to your live website. Monitor the first few conversations in the dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Widget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Widget Preview</DialogTitle>
                  <DialogDescription>
                    Preview how the chat widget will appear on your website
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 h-full">
                  <iframe
                    src={getTestUrl()}
                    className="w-full h-[calc(90vh-120px)] border rounded-lg"
                    title="Widget Preview"
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              onClick={() => window.open(getTestUrl(), "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
