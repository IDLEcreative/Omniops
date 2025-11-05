"use client";

import LookupFailuresDashboard from "@/components/admin/LookupFailuresDashboard";

export default function TelemetryPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Lookup Failures & Telemetry</h1>
        <p className="text-muted-foreground">
          Track failed product and order lookups to identify catalog gaps and improve search accuracy.
        </p>
      </div>

      <LookupFailuresDashboard />
    </div>
  );
}
