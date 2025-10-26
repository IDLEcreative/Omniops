// Contact support tab content
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Headphones,
  Lightbulb,
  Video,
  Globe,
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  Info,
} from "lucide-react";

export function ContactSupport() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Contact Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Get Support
          </CardTitle>
          <CardDescription>Multiple ways to reach our support team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-semibold">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Get instant help from our support team</p>
              </div>
              <div className="text-right">
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
            </div>

            <div className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-semibold">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@omniops.ai</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">~2 hour response</span>
              </div>
            </div>

            <div className="flex items-center p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-semibold">Phone Support</h3>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Business hours</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-center space-y-2">
            <h4 className="font-semibold">Premium Support</h4>
            <p className="text-sm text-muted-foreground">
              Need faster response times or dedicated support?
            </p>
            <Button variant="outline" size="sm">
              <Headphones className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support Hours & Resources */}
      <div className="space-y-6">
        {/* Support Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Support Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Live Chat</span>
                <span className="text-muted-foreground">24/7</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email Support</span>
                <span className="text-muted-foreground">24/7</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phone Support</span>
                <span className="text-muted-foreground">9 AM - 6 PM EST</span>
              </div>
              <Separator />
              <div className="text-center text-sm text-muted-foreground">
                Current time: {new Date().toLocaleTimeString()} EST
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              Additional Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Video className="h-4 w-4 mr-2" />
              Video Tutorials
              <ExternalLink className="h-3 w-3 ml-auto" />
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Globe className="h-4 w-4 mr-2" />
              Community Forum
              <ExternalLink className="h-3 w-3 ml-auto" />
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Knowledge Base
              <ExternalLink className="h-3 w-3 ml-auto" />
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Download className="h-4 w-4 mr-2" />
              User Manual PDF
              <Download className="h-3 w-3 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Status Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">All systems operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Scheduled maintenance: Dec 15, 2AM EST</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Status Page <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
