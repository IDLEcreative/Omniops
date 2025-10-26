// API documentation tab content
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, FileText, Download, ExternalLink, CheckCircle } from "lucide-react";

export function APIDocumentation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Code2 className="h-5 w-5 mr-2" />
          API Documentation
        </CardTitle>
        <CardDescription>Complete API reference and integration guides</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 border-blue-100 dark:border-blue-900">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">REST API Reference</h3>
                  <p className="text-sm text-muted-foreground">Complete endpoint documentation</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Documentation <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 dark:border-green-900">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Download className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">SDK Downloads</h3>
                  <p className="text-sm text-muted-foreground">Client libraries and SDKs</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Download SDKs <Download className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Code Examples */}
        <div className="space-y-4">
          <h3 className="font-semibold">Code Examples</h3>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">JavaScript Widget Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <div className="text-green-600">{`// Add this script tag to your website`}</div>
                  <div>&lt;script src="https://widget.omniops.ai/embed.js"&gt;&lt;/script&gt;</div>
                  <div>&lt;script&gt;</div>
                  <div className="ml-4">OmniopsWidget.init(&#123;</div>
                  <div className="ml-8">apiKey: &apos;your-api-key&apos;,</div>
                  <div className="ml-8">domain: &apos;your-domain.com&apos;</div>
                  <div className="ml-4">&#125;);</div>
                  <div>&lt;/script&gt;</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Chat Request</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <div className="text-blue-600">POST /api/chat</div>
                  <div className="mt-2">&#123;</div>
                  <div className="ml-4">&quot;message&quot;: &quot;How can I reset my password?&quot;,</div>
                  <div className="ml-4">&quot;sessionId&quot;: &quot;user-session-id&quot;,</div>
                  <div className="ml-4">&quot;domain&quot;: &quot;your-domain.com&quot;</div>
                  <div>&#125;</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">API Status</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Response Time</span>
                <span className="text-sm text-muted-foreground">~120ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Uptime</span>
                <span className="text-sm text-muted-foreground">99.9%</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View Status Page <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
