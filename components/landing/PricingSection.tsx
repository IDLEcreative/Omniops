import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const pricingPlans = [
  {
    name: "Small Business",
    price: "£500",
    description: "Perfect for growing businesses",
    features: [
      "Unlimited conversations",
      "Unlimited team seats",
      "14-day free trial",
      "AI-powered responses",
      "Basic analytics",
      "Email support",
      "40+ languages",
    ],
    popular: false,
  },
  {
    name: "SME",
    price: "£1,000",
    description: "For established companies",
    features: [
      "Everything in Small Business",
      "Priority support",
      "Custom branding",
      "Advanced analytics & insights",
      "API access",
      "Multi-domain discounts available",
      "Dedicated onboarding",
    ],
    popular: true,
  },
  {
    name: "Mid-Market",
    price: "£5,000",
    description: "For scaling organizations",
    features: [
      "Everything in SME",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "Advanced security features",
      "Up to 50% off with multi-domain",
      "Custom AI training",
    ],
    popular: false,
  },
  {
    name: "Enterprise",
    price: "£10,000",
    description: "For large organizations",
    features: [
      "Everything in Mid-Market",
      "White-label solution",
      "24/7 premium support",
      "Custom development",
      "On-premise deployment",
      "Maximum multi-domain savings",
      "Strategic partnership",
    ],
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-20 bg-muted/50" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Unlimited Conversations, Simple Pricing
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            All plans include unlimited conversations • Start with a 14-day free trial
          </p>
          <Badge variant="secondary" className="text-base px-4 py-2">
            <Sparkles className="mr-1 h-4 w-4" />
            Multi-domain discounts up to 50% • Cancel anytime
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={cn(
                "relative hover:shadow-lg transition-shadow",
                plan.popular && "border-primary shadow-lg ring-2 ring-primary/20"
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
                  <span className="text-muted-foreground">/month</span>
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
                  asChild
                >
                  <a href="/signup">Start Free Trial</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Quote CTA */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-primary/20">
            <CardContent className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-3">Not sure which plan is right?</h3>
              <p className="text-muted-foreground mb-6">
                Get an AI-powered pricing recommendation based on your website and expected traffic
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                asChild
              >
                <a href="/pricing/quote">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Your AI Quote Now
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
