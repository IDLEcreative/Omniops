"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function IntegrationsBottomCTA() {
  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="flex items-center justify-between p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Can't find what you're looking for?</h3>
          <p className="text-sm text-muted-foreground">
            Let us know which integration you need and we'll work on adding it
          </p>
        </div>
        <Button variant="outline" className="ml-4">
          <MessageSquare className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
      </CardContent>
    </Card>
  );
}
