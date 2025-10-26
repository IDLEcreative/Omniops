import { TrendingUp, Crown, Sparkles } from "lucide-react";
import { PricingPlan } from "./types";

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    priceDisplay: "$49/month",
    seats: 10,
    seatsDisplay: "Up to 10 team members",
    features: [
      "10 team seats",
      "Role-based permissions",
      "Email support",
      "API access",
      "30-day data retention",
      "Basic analytics"
    ],
    icon: TrendingUp,
    color: "bg-blue-500"
  },
  {
    id: "professional",
    name: "Professional",
    price: 149,
    priceDisplay: "$149/month",
    seats: 25,
    seatsDisplay: "Up to 25 team members",
    features: [
      "25 team seats",
      "Advanced permissions",
      "Priority email & chat support",
      "Advanced API access",
      "90-day data retention",
      "Advanced analytics & reports",
      "Custom integrations",
      "SSO authentication"
    ],
    popular: true,
    icon: Crown,
    color: "bg-purple-500"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: -1,
    priceDisplay: "Custom",
    seats: -1,
    seatsDisplay: "Unlimited seats",
    features: [
      "Unlimited team seats",
      "Custom permissions",
      "24/7 dedicated support",
      "Full API access",
      "Unlimited data retention",
      "Custom analytics & BI",
      "White-label options",
      "SLA guarantee",
      "Dedicated account manager",
      "On-premise deployment option"
    ],
    icon: Sparkles,
    color: "bg-gradient-to-r from-purple-500 to-pink-500"
  }
];
