'use client';

import { Star, Users, MessageSquare, Zap } from 'lucide-react';

const testimonials = [
  {
    quote:
      'Reduced support costs by £140k annually while improving response times by 80%. The AI handles 3,000+ conversations monthly with incredible accuracy.',
    author: 'David Jenkins',
    role: 'COO',
    company: 'Regional Retailer (50-250 employees)',
    plan: 'Mid-Market Plan',
    image: '🏢',
  },
  {
    quote:
      'Setup took 2 minutes. Within a week, 70% of our customer inquiries were handled automatically. Our team now focuses only on complex issues.',
    author: 'Sarah Thompson',
    role: 'Founder',
    company: 'Growing Online Business (5-15 employees)',
    plan: 'Small Business Plan',
    image: '🚀',
  },
  {
    quote:
      'We manage 5 client sites on Omniops. The multi-domain discount saves us £2,000/month. Our clients are thrilled with the 24/7 support.',
    author: 'Mike Johnson',
    role: 'Director',
    company: 'Digital Agency',
    plan: 'SME Plan (5 domains)',
    image: '💼',
  },
];

const stats = [
  { label: 'Businesses Trust Us', value: '500+', icon: Users },
  { label: 'Conversations Handled', value: '2.5M+', icon: MessageSquare },
  { label: 'AI Accuracy Verified', value: '86%', icon: Star },
  { label: 'Savings for Clients', value: '£15M+', icon: Zap },
];

export function SocialProof() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Testimonials */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
            Trusted by 500+ Businesses
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="p-8 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow"
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-700 italic mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold text-slate-900 mb-1">
                    {testimonial.author}, {testimonial.role}
                  </p>
                  <p className="text-xs text-slate-600 mb-2">
                    {testimonial.company}
                  </p>
                  <p className="text-xs font-semibold text-blue-600">
                    {testimonial.plan}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center text-white">
                  <Icon className="h-8 w-8 mx-auto mb-3 opacity-90" />
                  <p className="text-3xl md:text-4xl font-bold mb-2">
                    {stat.value}
                  </p>
                  <p className="text-blue-100 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🚀', label: '2-Minute Setup', description: 'Get started in under 2 minutes' },
            { icon: '💬', label: '86% AI Accuracy', description: 'Verified through extensive testing' },
            { icon: '🔒', label: 'GDPR Compliant', description: 'Your data is secure & private' },
            { icon: '📊', label: 'Real-Time Analytics', description: 'Monitor every conversation' },
          ].map((badge, idx) => (
            <div
              key={idx}
              className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center"
            >
              <span className="text-4xl mb-3 block">{badge.icon}</span>
              <h3 className="font-semibold text-slate-900 mb-2">{badge.label}</h3>
              <p className="text-sm text-slate-600">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
