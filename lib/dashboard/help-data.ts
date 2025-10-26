// Help page static data - articles, FAQs, and quick links
import {
  Code2,
  BarChart3,
  Settings,
  Shield,
  Users,
  Bot,
} from "lucide-react";
import type { HelpArticle, FAQ, QuickLink } from "./help-utils";

export const helpArticles: HelpArticle[] = [
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

export const faqData: FAQ[] = [
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

export const quickLinks: QuickLink[] = [
  { title: "API Documentation", icon: Code2, href: "#api", description: "Complete API reference and examples" },
  { title: "Widget Customization", icon: Settings, href: "#customization", description: "Customize appearance and behavior" },
  { title: "Bot Training Guide", icon: Bot, href: "#training", description: "Train your AI for better responses" },
  { title: "Analytics Overview", icon: BarChart3, href: "#analytics", description: "Understanding your metrics" },
  { title: "Security & Privacy", icon: Shield, href: "#security", description: "Data protection and compliance" },
  { title: "Team Management", icon: Users, href: "#team", description: "Managing users and permissions" },
];
