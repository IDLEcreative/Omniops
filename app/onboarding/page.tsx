"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");

  const handleCreateOrganization = async () => {
    if (!organizationName.trim()) {
      setError("Please enter an organization name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: organizationName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization');
      }

      // Success - move to completion step
      setStep(2);

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to Your AI Customer Service Platform!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Let's get your organization set up in just a few seconds
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-lg">What's your organization name?</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g., Acme Corporation"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="text-lg h-12"
                    disabled={loading}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateOrganization();
                      }
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be your workspace name. You can change it later.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What you'll get:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <span><strong>Free Plan</strong> with 5 team member seats</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <span><strong>AI-Powered Chat Widget</strong> for your website</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <span><strong>Website Scraping</strong> to train your AI assistant</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <span><strong>WooCommerce Integration</strong> for e-commerce support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                    <span><strong>Team Management</strong> with role-based permissions</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleCreateOrganization}
                className="w-full h-12 text-lg"
                disabled={loading || !organizationName.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating Your Organization...
                  </>
                ) : (
                  <>
                    <Building2 className="h-5 w-5 mr-2" />
                    Create My Organization
                  </>
                )}
              </Button>
            </>
          )}

          {step === 2 && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-600">Organization Created!</h2>
                <p className="text-muted-foreground mt-2">
                  Redirecting you to your dashboard...
                </p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
