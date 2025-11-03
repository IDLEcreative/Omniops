'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What is a "completed conversation"?',
    answer:
      'A completed conversation is when a customer engages meaningfully with the AI - asking questions, getting helpful answers, and staying engaged for at least 30 seconds. We don\'t count spam, test messages, or single "hello" messages. This ensures you only pay for actual value delivered.',
  },
  {
    question: 'What happens if I go over my included conversations?',
    answer:
      'No problem! We never block conversations. Overage is charged at the end of the month: Small Business: £0.12 per conversation, SME: £0.10 per conversation, Mid-Market: £0.08 per conversation, Enterprise: £0.05 per conversation. We\'ll send warnings at 90%, 100%, and 150% of your limit so you can upgrade if needed.',
  },
  {
    question: 'Why do you charge per domain, not per organization?',
    answer:
      'Each domain has unique data (products, content, customers) and uses separate resources (storage, AI processing, scraping). Per-domain pricing is fair because: Different domains = different traffic = different costs. You can test on staging domains for free. Multi-domain discounts make it affordable for agencies. Clear pricing - no hidden "per user" or "per message" fees.',
  },
  {
    question: 'Do I really get unlimited seats?',
    answer:
      'Yes! Add as many team members as you need at no extra cost. We believe in empowering teams, not charging per person. Whether you have 2 team members or 200, the price stays the same.',
  },
  {
    question: 'Can I mix tiers for different domains?',
    answer:
      'Absolutely! If you have 3 domains, they can each be on different tiers: Main site: Mid-Market (£5,000), Subdomain: Small Business (£500), Test site: Small Business (£500). You\'ll still get the 15% multi-domain discount on all three.',
  },
  {
    question: 'What\'s included in the 14-day free trial?',
    answer:
      'Full access to the Small Business tier: 2,500 conversations, Unlimited team seats, Full website scraping, All integrations (WooCommerce, Shopify), Email support. No credit card required. No automatic billing after trial.',
  },
  {
    question: 'How accurate is the AI?',
    answer:
      'Our AI maintains 86% conversation accuracy (verified through extensive testing). We use: GPT-4o for natural conversation, Hybrid search (embeddings + real-time data), Anti-hallucination safeguards, WooCommerce/Shopify real-time inventory.',
  },
  {
    question: 'Can the AI handle multiple languages?',
    answer:
      'Yes! The AI automatically detects and responds in the customer\'s language. Currently supported: English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian. More languages added regularly.',
  },
  {
    question: 'How long does setup take?',
    answer:
      'Just 2 minutes. Our AI setup process: 1) Enter your domain (10 seconds), 2) AI scrapes your site (60 seconds), 3) Creates embeddings (30 seconds), 4) Configure widget appearance (20 seconds). Then paste one line of code on your site. That\'s it.',
  },
  {
    question: 'What if I want to cancel?',
    answer:
      'Cancel anytime from your dashboard. No questions asked, no fees. You\'ll keep access until the end of your billing period. Export all your data before canceling.',
  },
  {
    question: 'Do you offer annual discounts?',
    answer:
      'Yes! Pay annually and save 15%: Small Business: £5,100/year (£425/month effective), SME: £10,200/year (£850/month effective), Mid-Market: £51,000/year (£4,250/month effective), Enterprise: Custom annual terms available.',
  },
  {
    question: 'Can I get a custom quote for enterprise needs?',
    answer:
      'Yes! For Enterprise tier or custom requirements: White-label solutions, On-premise deployment, Custom AI model training, Revenue share agreements, Multi-year contracts. Contact our sales team: sales@omniops.co.uk',
  },
  {
    question: 'How does the AI stay up-to-date with my products?',
    answer:
      'Real-time updates: WooCommerce: Direct API integration, instant product updates. Shopify: Webhook-based synchronization. Manual content: Re-scrape anytime (unlimited). Automated: Daily scraping for changes. Your AI always has current pricing, inventory, and product info.',
  },
  {
    question: 'What support do I get?',
    answer:
      'Small Business: Email support (24-hour response). SME: Priority support (2-hour response). Mid-Market: Dedicated account manager + 1-hour response. Enterprise: 24/7 dedicated support + 15-minute response. All tiers get: Comprehensive documentation, Video tutorials, Community forum access.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. We\'re GDPR and CCPA compliant: Data encrypted at rest and in transit (AES-256), Credentials stored encrypted, Regular security audits, No data sold to third parties, Right to deletion and export, UK/EU data residency available.',
  },
];

export function PricingFAQ() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-4xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-lg text-slate-600">
            Have a question? We're here to help.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full bg-white rounded-lg border border-slate-200">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-b-0">
              <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 text-left">
                <span className="text-lg font-semibold text-slate-900">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-slate-600 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Still have questions? */}
        <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 text-center">
          <p className="text-slate-900 font-semibold mb-2">
            Still have questions?
          </p>
          <p className="text-slate-600 mb-4">
            Get in touch with our sales team. We're happy to help!
          </p>
          <a
            href="mailto:sales@omniops.co.uk"
            className="inline-block text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            sales@omniops.co.uk
          </a>
        </div>
      </div>
    </section>
  );
}
