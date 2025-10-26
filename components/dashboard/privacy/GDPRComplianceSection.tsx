"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";

export function GDPRComplianceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>GDPR Compliance Status</CardTitle>
        <CardDescription>
          Current compliance status and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Consent Management</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Retention Policies</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Right to Access</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Protection Officer</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Review
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Privacy Impact Assessment</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Review
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cross-border Transfers</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Consider appointing a Data Protection Officer for full compliance.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
