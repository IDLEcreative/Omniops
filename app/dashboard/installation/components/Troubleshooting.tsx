"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface TroubleshootingProps {
  domain: string;
}

export function Troubleshooting({ domain }: TroubleshootingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Troubleshooting</CardTitle>
        <CardDescription>
          Common issues and solutions for widget installation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Widget not appearing */}
          <AccordionItem value="not-appearing">
            <AccordionTrigger>Widget is not appearing on my website</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Quick Fix:</strong> Check your browser's developer console (F12) for JavaScript errors.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm">
                  <p className="font-medium">Common causes:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Script tag placed in wrong location (should be before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code>)</li>
                    <li>JavaScript errors from other scripts blocking execution</li>
                    <li>Content Security Policy (CSP) blocking external scripts</li>
                    <li>Ad blockers or privacy extensions blocking the widget</li>
                  </ul>

                  <p className="font-medium mt-4">Solutions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Verify script is loading: Check Network tab in dev tools for <code className="bg-muted px-1 rounded">embed.js</code></li>
                    <li>Check for JavaScript errors in Console tab</li>
                    <li>Try disabling browser extensions temporarily</li>
                    <li>Ensure script has <code className="bg-muted px-1 rounded">async</code> attribute</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Domain mismatch */}
          <AccordionItem value="domain-mismatch">
            <AccordionTrigger>Chat not working or showing wrong data</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {domain ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Your configured domain is: <code className="bg-muted px-1 rounded font-mono">{domain}</code>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No domain configured. Please configure your domain in settings.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 text-sm">
                  <p className="font-medium">Domain Detection:</p>
                  <p className="text-muted-foreground">
                    The widget automatically detects your domain from <code className="bg-muted px-1 rounded">window.location.hostname</code>.
                    Make sure the domain in your browser matches your configured domain.
                  </p>

                  <p className="font-medium mt-4">Common issues:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Testing on localhost (use demo mode instead)</li>
                    <li>Domain with/without www prefix not matching</li>
                    <li>Testing on staging subdomain not configured</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Mobile issues */}
          <AccordionItem value="mobile">
            <AccordionTrigger>Widget not working properly on mobile</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    The widget is fully responsive and should work on all mobile devices.
                  </p>

                  <p className="font-medium mt-4">Mobile behavior:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Widget opens fullscreen on mobile (not floating)</li>
                    <li>Button appears as floating action button</li>
                    <li>Automatically adjusts for touch interactions</li>
                  </ul>

                  <p className="font-medium mt-4">If issues persist:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Clear mobile browser cache</li>
                    <li>Test in incognito/private mode</li>
                    <li>Check viewport meta tag is present</li>
                    <li>Verify no CSS conflicts with z-index</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Performance */}
          <AccordionItem value="performance">
            <AccordionTrigger>Widget is slowing down my website</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    The widget uses <code className="bg-muted px-1 rounded">async</code> loading and shouldn't impact page speed.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm">
                  <p className="font-medium">Performance optimizations:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Widget loads asynchronously (non-blocking)</li>
                    <li>Iframe isolation prevents CSS/JS conflicts</li>
                    <li>Lazy loading of chat interface</li>
                    <li>Minimal initial bundle size (~8KB)</li>
                  </ul>

                  <p className="font-medium mt-4">Best practices:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Always use <code className="bg-muted px-1 rounded">async</code> attribute on script tag</li>
                    <li>Place script at end of <code className="bg-muted px-1 rounded">&lt;body&gt;</code></li>
                    <li>Don't use <code className="bg-muted px-1 rounded">document.write()</code></li>
                    <li>Consider using <code className="bg-muted px-1 rounded">defer</code> if async causes issues</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Styling issues */}
          <AccordionItem value="styling">
            <AccordionTrigger>Widget appearance doesn't match my site</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    You can customize the widget appearance in the Customize section of the dashboard.
                  </p>

                  <p className="font-medium mt-4">Customization options:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Primary color (matches your brand)</li>
                    <li>Widget position (all 4 corners)</li>
                    <li>Header title and subtitle</li>
                    <li>Welcome message</li>
                    <li>Custom CSS (advanced)</li>
                  </ul>

                  <p className="font-medium mt-4">Navigation:</p>
                  <p className="text-muted-foreground">
                    Go to <strong>Dashboard → Customize</strong> to modify appearance settings.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* WooCommerce not working */}
          <AccordionItem value="woocommerce">
            <AccordionTrigger>WooCommerce integration not working</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Required setup:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>WooCommerce REST API must be enabled</li>
                    <li>API credentials configured in Dashboard → Integrations</li>
                    <li>Widget config has <code className="bg-muted px-1 rounded">woocommerce.enabled: true</code></li>
                    <li>Store URL matches your configured domain</li>
                  </ol>

                  <p className="font-medium mt-4">Common issues:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>API credentials incorrect or expired</li>
                    <li>WooCommerce API permissions too restrictive</li>
                    <li>Store URL has www prefix mismatch</li>
                    <li>SSL certificate issues</li>
                  </ul>

                  <p className="font-medium mt-4">Test your integration:</p>
                  <p className="text-muted-foreground">
                    Go to <strong>Dashboard → Integrations → WooCommerce</strong> to verify credentials and test connection.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Need more help */}
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Still need help?</strong> Contact support or check the documentation for more detailed troubleshooting steps.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
