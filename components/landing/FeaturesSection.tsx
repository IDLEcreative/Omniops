import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  Globe,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Lock,
  Timer,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Code, Palette, ChevronRight } from "lucide-react";

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

const stats = [
  { value: "24/7", label: "Available Every Day", icon: Timer, description: "Never miss a customer question" },
  { value: "40+", label: "Languages Supported", icon: Globe, description: "Speak to customers worldwide" },
  { value: "5 Min", label: "Setup Time", icon: Zap, description: "Add one line of code and go live" },
  { value: "100%", label: "Cloud-Based", icon: Sparkles, description: "No installation or maintenance" },
];

export function FeaturesSection() {
  return (
    <>
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
                GPT-5 powers intelligent responses
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
    </>
  );
}
