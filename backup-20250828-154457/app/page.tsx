"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Headphones, 
  Code, 
  Palette, 
  Puzzle, 
  Shield, 
  Zap, 
  Clock, 
  MessageSquare, 
  Globe, 
  ArrowRight, 
  CheckCircle, 
  Loader2,
  Users,
  Star,
  TrendingUp,
  BarChart3,
  HeartHandshake,
  Sparkles,
  Play,
  ChevronRight,
  ArrowUpRight,
  Building2,
  UserCheck,
  DollarSign,
  Languages,
  Lock,
  Smartphone,
  Cloud,
  FileText,
  Settings2,
  Brain,
  Timer,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Advanced natural language processing understands customer intent and provides accurate responses",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    icon: Globe,
    title: "40+ Languages",
    description: "Communicate with customers globally in their preferred language automatically",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    icon: Zap,
    title: "Instant Responses",
    description: "Average response time under 2 seconds, available 24/7 without any downtime",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "GDPR compliant with end-to-end encryption and full data control",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    icon: Puzzle,
    title: "Easy Integration",
    description: "One-line code snippet works with any website or platform",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance, customer satisfaction, and identify improvement areas",
    color: "text-pink-600",
    bgColor: "bg-pink-100 dark:bg-pink-900/20",
  },
];

const testimonials = [
  {
    quote: "Omniops reduced our support tickets by 60% in just 2 weeks. The AI understands our customers better than we expected.",
    author: "Sarah Chen",
    role: "Head of Support, TechFlow",
    rating: 5,
    avatar: "SC",
  },
  {
    quote: "Setup took literally 5 minutes. Now we handle customer queries in 12 languages without hiring additional staff.",
    author: "Marcus Weber",
    role: "CEO, GlobalStore",
    rating: 5,
    avatar: "MW",
  },
  {
    quote: "The privacy features sold us. Our customers trust us more knowing their data is protected and we're GDPR compliant.",
    author: "Elena Rodriguez",
    role: "CTO, HealthTech Pro",
    rating: 5,
    avatar: "ER",
  },
];

const stats = [
  { value: "50M+", label: "Conversations Handled", icon: MessageSquare },
  { value: "98%", label: "Customer Satisfaction", icon: UserCheck },
  { value: "10K+", label: "Active Companies", icon: Building2 },
  { value: "1.2s", label: "Avg Response Time", icon: Timer },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
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
    price: "$99",
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

export default function Home() {
  const [demoUrl, setDemoUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGenerateDemo = async () => {
    if (!demoUrl) {
      setError("Please enter a website URL");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: demoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate demo");
      }

      localStorage.setItem(`demo_${data.demoId}_config`, JSON.stringify(data.config));
      router.push(data.widgetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
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
              Trusted by 10,000+ companies worldwide
            </Badge>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Cut support costs by{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                60% instantly
              </span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
              Add an intelligent AI chat agent to your website in under 5 minutes. 
              Handle customer queries 24/7 in 40+ languages while maintaining 
              human-level conversation quality.
            </p>

            {/* Demo Generator */}
            <div className="mx-auto mb-8 max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="url"
                  placeholder="Enter your website URL (e.g., https://example.com)"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="flex-1 h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateDemo()}
                />
                <Button 
                  size="lg" 
                  onClick={handleGenerateDemo}
                  disabled={isGenerating}
                  className="h-12 px-8"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Try Free Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                No credit card required • Setup in 5 minutes • Free 14-day trial
              </p>
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

          {/* Hero Image/Animation */}
          <div className="mt-16 mx-auto max-w-5xl">
            <div className="relative rounded-xl border bg-muted/50 p-8 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent rounded-xl" />
              <div className="relative flex items-center justify-center h-96">
                <MessageSquare className="h-32 w-32 text-muted-foreground/20" />
                <p className="absolute text-sm text-muted-foreground">
                  Live chat interface preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
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

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Loved by support teams worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers have to say
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <CardDescription className="text-base">
                    "{testimonial.quote}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your needs
            </p>
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