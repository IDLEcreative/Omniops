"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, BookOpen, HelpCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Import components (will create next)
import { QuickStart } from "./components/QuickStart";
import { PlatformGuides } from "./components/PlatformGuides";
import { Troubleshooting } from "./components/Troubleshooting";

export default function InstallationPage() {
  const [activeTab, setActiveTab] = useState("quickstart");
  const [serverUrl, setServerUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadConfiguration = async () => {
      try {
        setIsLoading(true);

        // Set server URL from environment variable (production domain)
        // Falls back to current origin if not set
        const url = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        setServerUrl(url);

        // Automatically fetch customer config for current user's organization
        const response = await fetch('/api/customer/config/current', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Check if component is still mounted before updating state
        if (!isMounted) return;

        if (data.success && data.data) {
          // Successfully fetched customer config
          setDomain(data.data.domain || "");

          toast({
            title: "Configuration Loaded",
            description: `Installing for: ${data.data.domain}`,
            duration: 3000,
          });
        } else {
          // No customer config found - show helpful message
          setDomain("");
          toast({
            title: "No Domain Configured",
            description: data.message || "Please configure your domain in settings first.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } catch (error) {
        // Only show error if component is still mounted and it's not an abort
        if (isMounted && error instanceof Error && error.name !== 'AbortError') {
          toast({
            title: "Error",
            description: error.message || "Failed to load configuration. Please try again.",
            variant: "destructive",
            duration: 5000,
          });
          setServerUrl(window.location.origin);
          setDomain("");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConfiguration();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [toast]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Install Your Chat Widget
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Get your embed code and add the widget to your website
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quickstart">
            <Code2 className="h-4 w-4 mr-2" />
            Quick Start
          </TabsTrigger>
          <TabsTrigger value="guides">
            <BookOpen className="h-4 w-4 mr-2" />
            Platform Guides
          </TabsTrigger>
          <TabsTrigger value="troubleshooting">
            <HelpCircle className="h-4 w-4 mr-2" />
            Troubleshooting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quickstart">
          <QuickStart
            serverUrl={serverUrl}
            domain={domain}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="guides">
          <PlatformGuides serverUrl={serverUrl} />
        </TabsContent>

        <TabsContent value="troubleshooting">
          <Troubleshooting domain={domain} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
