'use client';

import { CheckCircle2, X } from 'lucide-react';

const features = [
  { category: 'Core Features', items: [
    { name: 'Completed Conversations', values: ['2,500', '5,000', '25,000', '100,000'] },
    { name: 'Team Seats', values: ['∞', '∞', '∞', '∞'] },
    { name: 'Website Scraping', values: ['∞', '∞', '∞', '∞'] },
  ]},
  { category: 'Integrations', items: [
    { name: 'WooCommerce Integration', values: [true, true, true, true] },
    { name: 'Shopify Integration', values: [true, true, true, true] },
  ]},
  { category: 'Customization', items: [
    { name: 'Custom Branding', values: [false, true, true, true] },
    { name: 'API Access', values: [false, true, true, true] },
    { name: 'White-Label', values: [false, false, false, true] },
    { name: 'On-Premise Deployment', values: [false, false, false, true] },
    { name: 'Custom AI Training', values: [false, false, false, true] },
  ]},
  { category: 'Support', items: [
    { name: 'Priority Support', values: [false, true, true, true] },
    { name: 'Support Response Time', values: ['24hrs', '2hrs', '1hr', '15min'] },
    { name: 'Dedicated Account Manager', values: [false, false, true, true] },
    { name: '24/7 Dedicated Support', values: [false, false, false, true] },
  ]},
  { category: 'SLA & Guarantees', items: [
    { name: 'SLA Guarantee', values: ['-', '-', '99.9%', '99.99%'] },
    { name: 'Quarterly Strategy Reviews', values: [false, false, true, true] },
  ]},
  { category: 'Billing', items: [
    { name: 'Overage Rate', values: ['£0.12', '£0.10', '£0.08', '£0.05'] },
    { name: 'Monthly Price', values: ['£500', '£1,000', '£5,000', '£10,000'] },
  ]},
];

const tiers = ['Small Business', 'SME', 'Mid-Market', 'Enterprise'];

export function FeatureComparisonTable() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Feature Comparison
          </h2>
          <p className="text-lg text-slate-600">
            See what's included in each tier
          </p>
        </div>

        {/* Responsive table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-4 font-semibold text-slate-900 w-48">
                  Feature
                </th>
                {tiers.map((tier) => (
                  <th
                    key={tier}
                    className="text-center px-4 py-4 font-semibold text-slate-900 min-w-32"
                  >
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((section, sectionIdx) => (
                <tbody key={sectionIdx}>
                  {/* Category header */}
                  <tr className="border-b border-slate-200 bg-slate-100">
                    <td
                      colSpan={5}
                      className="px-4 py-3 font-semibold text-slate-900"
                    >
                      {section.category}
                    </td>
                  </tr>

                  {/* Feature rows */}
                  {section.items.map((item, itemIdx) => (
                    <tr
                      key={`${sectionIdx}-${itemIdx}`}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-slate-900 font-medium">
                        {item.name}
                      </td>
                      {item.values.map((value, valueIdx) => (
                        <td
                          key={valueIdx}
                          className="text-center px-4 py-4"
                        >
                          {typeof value === 'boolean' ? (
                            value ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-slate-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-slate-900 font-medium">
                              {value}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile note */}
        <p className="mt-8 text-center text-sm text-slate-500">
          💡 Tip: Scroll horizontally on mobile to see all tiers
        </p>
      </div>
    </section>
  );
}
