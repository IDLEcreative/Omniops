"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  HelpCircle,
  Search,
  BookOpen,
  Code2,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Zap,
  Shield,
  Globe,
  Bot,
  BarChart3,
  Settings,
  Users,
  Lightbulb,
  FileText,
  Video,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Star,
  Clock,
  Headphones,
} from "lucide-react";

// Mock data for help articles and FAQs
const helpArticles = [
  {
    id: 1,
    title: "Setting up your first chat widget",
    category: "Getting Started",
    readTime: "5 min",
    popular: true,
    excerpt: "Learn how to embed and customize your AI chat widget on your website.",
  },
  {
    id: 2,
    title: "Training your AI assistant",
    category: "AI Training",
    readTime: "8 min",
    popular: true,
    excerpt: "Best practices for training your bot with custom data and responses.",
  },
  {
    id: 3,
    title: "Understanding analytics and metrics",
    category: "Analytics",
    readTime: "6 min",
    popular: false,
    excerpt: "Interpret your dashboard metrics to improve customer service performance.",
  },
  {
    id: 4,
    title: "WooCommerce integration guide",
    category: "Integrations",
    readTime: "12 min",
    popular: true,
    excerpt: "Connect your WooCommerce store for enhanced customer support capabilities.",
  },
  {
    id: 5,
    title: "Managing team members and permissions",
    category: "Team Management",
    readTime: "7 min",
    popular: false,
    excerpt: "Add team members and configure their access levels and permissions.",
  },
  {
    id: 6,
    title: "GDPR compliance and data privacy",
    category: "Privacy & Security",
    readTime: "10 min",
    popular: false,
    excerpt: "Ensure your chat widget complies with privacy regulations and best practices.",
  },
];

const faqData = [
  {
    question: "How do I embed the chat widget on my website?",
    answer: "To embed the chat widget, copy the provided JavaScript snippet from your dashboard and paste it before the closing </body> tag of your website. The widget will automatically appear and be ready to use.",
    category: "Setup",
  },
  {
    question: "Can I customize the appearance of the chat widget?",
    answer: "Yes! You can customize colors, position, size, and messaging through the Customization section in your dashboard. Changes are applied in real-time to your widget.",
    category: "Customization",
  },
  {
    question: "How does the AI training work?",
    answer: "The AI learns from your website content, uploaded documents, and conversation history. You can also manually add Q&A pairs and train it on specific scenarios through the Bot Training section.",
    category: "AI Training",
  },
  {
    question: "What happens when the AI can't answer a question?",
    answer: "When the AI confidence is low, it can automatically escalate to human support if you have team members available, or provide fallback responses like directing users to contact forms.",
    category: "Escalation",
  },
  {
    question: "Is my customer data secure?",
    answer: "Yes, all data is encrypted in transit and at rest. We're GDPR and CCPA compliant, and you have full control over data retention and deletion policies.",
    category: "Security",
  },
  {
    question: "Can I integrate with my existing help desk or CRM?",
    answer: "Yes, we support webhooks and API integrations with popular platforms like Zendesk, Intercom, Salesforce, and more. Check our integrations page for the full list.",
    category: "Integrations",
  },
];

const quickLinks = [
  { title: "API Documentation", icon: Code2, href: "#api", description: "Complete API reference and examples" },
  { title: "Widget Customization", icon: Settings, href: "#customization", description: "Customize appearance and behavior" },
  { title: "Bot Training Guide", icon: Bot, href: "#training", description: "Train your AI for better responses" },
  { title: "Analytics Overview", icon: BarChart3, href: "#analytics", description: "Understanding your metrics" },
  { title: "Security & Privacy", icon: Shield, href: "#security", description: "Data protection and compliance" },
  { title: "Team Management", icon: Users, href: "#team", description: "Managing users and permissions" },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter articles and FAQs based on search
  const filteredArticles = helpArticles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFAQs = faqData.filter(faq => 
    (selectedCategory === "all" || faq.category.toLowerCase() === selectedCategory.toLowerCase()) &&
    (searchQuery === "" || 
     faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
     faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = ["all", ...Array.from(new Set(faqData.map(faq => faq.category)))];

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Help & Documentation</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Everything you need to know about using Omniops
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search help articles, FAQs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Quick Links
          </CardTitle>
          <CardDescription>Jump straight to what you're looking for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{link.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="api-docs">API Docs</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-6">
          <div className="grid gap-6">
            {/* Popular Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Popular Articles
                </CardTitle>
                <CardDescription>Most viewed help articles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredArticles.filter(article => article.popular).map((article) => (
                    <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{article.title}</h3>
                          <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{article.excerpt}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {article.readTime}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  All Articles
                </CardTitle>
                <CardDescription>Browse all help documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredArticles.map((article) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{article.category}</Badge>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {article.readTime}
                            </div>
                          </div>
                          <h3 className="font-medium leading-tight">{article.title}</h3>
                          <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-1">
                              {article.popular && <Star className="h-3 w-3 text-yellow-500" />}
                            </div>
                            <Button variant="ghost" size="sm">
                              Read More <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>

              {/* FAQ List */}
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <Collapsible 
                    key={index}
                    open={expandedFAQ === index}
                    onOpenChange={(open) => setExpandedFAQ(open ? index : null)}
                  >
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                              {expandedFAQ === index ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent>
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No FAQs found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Documentation Tab */}
        <TabsContent value="api-docs" className="space-y-6">
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
                        <div className="text-green-600">// Add this script tag to your website</div>
                        <div>&lt;script src="https://widget.omniops.ai/embed.js"&gt;&lt;/script&gt;</div>
                        <div>&lt;script&gt;</div>
                        <div className="ml-4">OmniopsWidget.init(&#123;</div>
                        <div className="ml-8">apiKey: 'your-api-key',</div>
                        <div className="ml-8">domain: 'your-domain.com'</div>
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
                        <div className="ml-4">"message": "How can I reset my password?",</div>
                        <div className="ml-4">"sessionId": "user-session-id",</div>
                        <div className="ml-4">"domain": "your-domain.com"</div>
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
        </TabsContent>

        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}