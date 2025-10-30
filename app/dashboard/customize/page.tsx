"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, RotateCcw, Palette, Brain, Plug2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Import section components
import { EssentialsSection } from "./sections/EssentialsSection";
import { IntelligenceSection } from "./sections/IntelligenceSection";
import { ConnectSection } from "./sections/ConnectSection";
import { LivePreview } from "./components/LivePreview";

// Import hook and types
import { useWidgetConfig } from "./hooks/useWidgetConfig";

export default function CustomizeV2Page() {
  const [activeTab, setActiveTab] = useState("essentials");
  const { toast } = useToast();

  // Use custom hook for all config management
  const {
    config,
    customerConfigId,
    setCustomerConfigId,
    availableConfigs,
    isLoadingConfigs,
    isSaving,
    isDirty,
    updateConfig,
    resetConfig,
    saveConfiguration,
  } = useWidgetConfig({ toast });

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customize Your Chatbot</h1>
          <p className="text-muted-foreground mt-2">
            Simple, clean, and easy to use
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={resetConfig} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveConfiguration} disabled={isSaving || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Customer Config Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Select Website to Customize
              </label>
              <Select
                value={customerConfigId || ''}
                onValueChange={(value) => {
                  setCustomerConfigId(value);
                }}
                disabled={isLoadingConfigs || availableConfigs.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a website..." />
                </SelectTrigger>
                <SelectContent>
                  {availableConfigs.map(config => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.domain} {config.business_name && `(${config.business_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {availableConfigs.length === 0 && !isLoadingConfigs && (
              <div className="flex-1 text-sm text-muted-foreground">
                No websites configured yet.
                <a href="/dashboard/installation" className="text-primary underline ml-1">
                  Set up your first website
                </a>
              </div>
            )}
            {isLoadingConfigs && (
              <div className="flex-1 text-sm text-muted-foreground">
                Loading configurations...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="essentials">
                <Palette />
                Essentials
              </TabsTrigger>
              <TabsTrigger value="intelligence">
                <Brain />
                Intelligence
              </TabsTrigger>
              <TabsTrigger value="connect">
                <Plug2 />
                Connect
              </TabsTrigger>
            </TabsList>

            <TabsContent value="essentials">
              <EssentialsSection
                settings={config.essentials}
                onChange={(updates) => updateConfig('essentials', updates)}
              />
            </TabsContent>

            <TabsContent value="intelligence">
              <IntelligenceSection
                settings={config.intelligence}
                onChange={(updates) => updateConfig('intelligence', updates)}
              />
            </TabsContent>

            <TabsContent value="connect">
              <ConnectSection
                settings={config.connect}
                onChange={(updates) => updateConfig('connect', updates)}
              />
            </TabsContent>
          </Tabs>

        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <LivePreview config={config} />
        </div>
      </div>
    </div>
  );
}
