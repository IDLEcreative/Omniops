"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Code,
  Palette,
  MessageSquare,
  Globe,
  ArrowRight,
  Loader2,
  Sparkles,
  Play,
  ChevronRight,
  Lock,
  Brain,
  Timer,
  CheckCircle2,
  ShieldCheck,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { DemoUrlInput } from "@/components/demo/DemoUrlInput";
import { ScrapingProgress } from "@/components/demo/ScrapingProgress";
import { DemoChatInterface } from "@/components/demo/DemoChatInterface";

const features = [
  {
    icon: Brain,
    title: "Accurate Answers",
    description: "AI trained on YOUR website content. Knows your products, prices, and policies without you lifting a finger.",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    icon: Globe,
    title: "Speaks 40+ Languages",
    description: "Automatically detects customer language and responds natively. Expand globally without hiring translators.",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    icon: ShoppingCart,
    title: "WooCommerce Integration",
    description: "Shows real-time stock, tracks orders, answers \"where's my order?\" instantly. Works with your existing store.",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    icon: Zap,
    title: "5-Minute Setup",
    description: "Copy one line of code into your website. No technical skills, no complex integrations, no developer needed.",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    icon: ShieldCheck,
    title: "Never Lies to Customers",
    description: "If AI doesn't know the answer, it says so and offers human support. No making things up.",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/20",
  },
  {
    icon: Lock,
    title: "GDPR Compliant",
    description: "Your data stays private. Full control over customer information. Enterprise-grade security built-in.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
  },
];

// Testimonials removed - using authentic technical features instead

const stats = [
  { value: "24/7", label: "Available Every Day", icon: Timer, description: "Never miss a customer question" },
  { value: "40+", label: "Languages Supported", icon: Globe, description: "Speak to customers worldwide" },
  { value: "5 Min", label: "Setup Time", icon: Zap, description: "Add one line of code and go live" },
  { value: "100%", label: "Cloud-Based", icon: Sparkles, description: "No installation or maintenance" },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "£29",
    description: "Perfect for small businesses",
    features: [
      "Up to 1,000 conversations/month",
      "1 website integration",
      "Basic analytics",
      "Email support",
      "10 languages",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "£99",
    description: "For growing companies",
    features: [
      "Up to 10,000 conversations/month",
      "5 website integrations",
      "Advanced analytics & insights",
      "Priority support",
      "40+ languages",
      "Custom branding",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored for large organizations",
    features: [
      "Unlimited conversations",
      "Unlimited integrations",
      "Custom AI training",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise deployment",
      "Advanced security features",
    ],
    popular: false,
  },
];

type ScrapeStep = 'homepage' | 'sitemap' | 'pages' | 'embeddings' | 'done';

interface DemoSession {
  id: string;
  domain: string;
  pages_scraped: number;
  expires_at: number;
  message_count: number;
  max_messages: number;
}

export default function Home() {
  const [demoUrl, setDemoUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<ScrapeStep>('homepage');
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);
  const [error, setError] = useState("");

  const handleStartDemo = async () => {
    if (!demoUrl) {
      setError("Please enter a website URL");
      return;
    }

    setError("");
    setIsScraping(true);
    setScrapeProgress(0);
    setCurrentStep('homepage');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScrapeProgress(prev => Math.min(prev + 10, 90));
      }, 800);

      // Start scraping
      setCurrentStep('homepage');
      const response = await fetch("/api/demo/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: demoUrl }),
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze website");
      }

      // Update to final steps
      setCurrentStep('sitemap');
      setScrapeProgress(70);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('pages');
      setScrapeProgress(85);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('embeddings');
      setScrapeProgress(95);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('done');
      setScrapeProgress(100);

      // Create demo session
      setDemoSession({
        id: data.session_id,
        domain: data.domain,
        pages_scraped: data.pages_scraped,
        expires_at: Date.now() + (10 * 60 * 1000),
        message_count: 0,
        max_messages: 20
      });

      setIsScraping(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze website");
      setIsScraping(false);
      setScrapeProgress(0);
    }
  };

  const handleSendMessage = async (message: string): Promise<string> => {
    if (!demoSession) {
      throw new Error('No active demo session');
    }

    const response = await fetch("/api/demo/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: demoSession.id,
        message
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get response");
    }

    // Update session message count
    setDemoSession(prev => prev ? {
      ...prev,
      message_count: data.message_count
    } : null);

    return data.response;
  };

  return (
    <>
      
      {/* Hero Section with Integrated Navigation */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        
        {/* Minimal Navigation */}
        <nav className="relative container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Omniops</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/dashboard" className="hidden sm:block">
                <Button size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </nav>
        
        <div className="container relative mx-auto px-4 pt-12 pb-32">
          <div className="mx-auto max-w-5xl text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1">
              <Sparkles className="mr-1 h-3 w-3" />
              Powered by OpenAI GPT-4
            </Badge>

            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Answer Customer Questions{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                While You Sleep
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
              AI chat that knows your products, speaks 40+ languages, and handles
              support 24/7. No training required.
            </p>

            {/* Instant Demo Section */}
            <div className="mx-auto mb-8 max-w-4xl">
              <DemoUrlInput
                url={demoUrl}
                onChange={setDemoUrl}
                onSubmit={handleStartDemo}
                isLoading={isScraping}
              />

              {error && (
                <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
              )}

              {isScraping && (
                <ScrapingProgress
                  progress={scrapeProgress}
                  currentStep={currentStep}
                />
              )}

              {demoSession && (
                <DemoChatInterface
                  session={demoSession}
                  onSendMessage={handleSendMessage}
                />
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="#demo">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero Chat Preview */}
          <div className="mt-16 mx-auto max-w-4xl">
            <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-background via-muted/30 to-background shadow-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="bg-primary px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-foreground">Customer Support</h3>
                    <p className="text-xs text-primary-foreground/80">Always online</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-primary-foreground/80">AI Online</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="bg-background p-6 space-y-4 min-h-[400px]">
                {/* AI Message */}
                <div className="flex gap-3 animate-in slide-in-from-left duration-500">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm">Hi! 👋 I'm your AI assistant. I can help you with product questions, pricing, and support 24/7 in over 40 languages!</p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex gap-3 justify-end animate-in slide-in-from-right duration-500 delay-300">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm">What are your shipping options?</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">👤</span>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-3 animate-in slide-in-from-left duration-500 delay-700">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm">We offer free standard shipping (3-5 days), express shipping (1-2 days) for £9.99, and same-day delivery in select areas. All orders over £50 get free express upgrade! 📦</p>
                  </div>
                </div>

                {/* Typing Indicator */}
                <div className="flex gap-3 animate-in slide-in-from-left duration-500 delay-1000">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t bg-muted/30 px-6 py-4">
                <div className="flex gap-3 items-center">
                  <div className="flex-1 bg-background rounded-full border px-4 py-2 text-sm text-muted-foreground">
                    Type your message...
                  </div>
                  <Button size="icon" className="rounded-full h-10 w-10">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="shadow-lg">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Powered by AI
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Why Businesses Choose Omniops</h2>
            <p className="text-muted-foreground">Everything you need for world-class customer support</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-sm font-semibold mt-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to delight customers
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features that work together to create exceptional customer experiences
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", feature.bgColor)}>
                    <feature.icon className={cn("h-6 w-6", feature.color)} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Get started in 3 simple steps
            </h2>
            <p className="text-xl text-muted-foreground">
              No technical expertise required
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Add one line of code",
                  description: "Copy and paste our snippet into your website's HTML",
                  icon: Code,
                },
                {
                  step: "2",
                  title: "Customize appearance",
                  description: "Match your brand with colors, position, and messaging",
                  icon: Palette,
                },
                {
                  step: "3",
                  title: "Go live instantly",
                  description: "Your AI agent starts helping customers immediately",
                  icon: Zap,
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <ChevronRight className="hidden md:block absolute top-8 -right-4 h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Built on Trusted Technology
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade infrastructure you can rely on
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Powered by OpenAI</h3>
              <p className="text-sm text-muted-foreground">
                GPT-4 powers intelligent responses
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Lock className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">GDPR Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Full data privacy and control
              </p>
            </Card>

            <Card className="p-6 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">WooCommerce Ready</h3>
              <p className="text-sm text-muted-foreground">
                Native integration built-in
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Timer className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">24/7 Availability</h3>
              <p className="text-sm text-muted-foreground">
                Never miss a customer query
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-muted/50" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              Choose the plan that fits your needs
            </p>
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Sparkles className="mr-1 h-4 w-4" />
              All plans include 14-day free trial • No credit card required
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={cn(
                  "relative hover:shadow-lg transition-shadow",
                  plan.popular && "border-primary shadow-lg"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to transform your customer support?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of companies delivering exceptional customer experiences with AI
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link href="/contact">
                    Talk to Sales
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API Reference</Link></li>
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/status" className="hover:text-foreground">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
                <li><Link href="/gdpr" className="hover:text-foreground">GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Omniops. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}