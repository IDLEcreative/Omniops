import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function PricingSection() {
  return (
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
            Flexible monthly billing • Cancel anytime
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
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
