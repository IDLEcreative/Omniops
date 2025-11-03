'use client';

import { useState } from 'react';
import { Gift } from 'lucide-react';

const DISCOUNT_TIERS = [
  { domains: 1, discount: 0, label: '1 domain' },
  { domains: 2, discount: 10, label: '2 domains' },
  { domains: 3, discount: 15, label: '3 domains' },
  { domains: 4, discount: 20, label: '4 domains' },
  { domains: 5, discount: 25, label: '5 domains' },
  { domains: 10, discount: 30, label: '6-10 domains' },
  { domains: 11, discount: 35, label: '11+ domains' },
];

const BASE_PRICES = {
  small: 500,
  sme: 1000,
  mid: 5000,
  enterprise: 10000,
};

export function MultiDomainCalculator() {
  const [selectedDomains, setSelectedDomains] = useState(2);

  const discountTier = DISCOUNT_TIERS.reduce((prev, current) => {
    if (selectedDomains >= current.domains) {
      return current;
    }
    return prev;
  });

  const discount = discountTier.discount;

  const calculatePrice = (basePrice: number) => {
    return Math.round(basePrice * (1 - discount / 100));
  };

  const calculateTotal = (basePrice: number) => {
    const discountedPrice = calculatePrice(basePrice);
    return discountedPrice * selectedDomains;
  };

  const calculateSavings = (basePrice: number) => {
    const originalTotal = basePrice * selectedDomains;
    const discountedTotal = calculateTotal(basePrice);
    return originalTotal - discountedTotal;
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="h-6 w-6 text-purple-600" />
            <h2 className="text-4xl font-bold text-slate-900">
              Automatic Discounts for Multiple Domains
            </h2>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Save up to 35% when managing multiple sites. Perfect for agencies, multi-brand
            businesses, and franchises. Single invoice, multiple sites.
          </p>
        </div>

        {/* Domain selector */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <label className="block text-lg font-semibold text-slate-900 mb-6">
            How many domains do you manage?
          </label>

          <div className="flex flex-wrap gap-3 mb-8">
            {[1, 2, 3, 4, 5, 10, 15, 20].map((num) => (
              <button
                key={num}
                onClick={() => setSelectedDomains(num)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDomains === num
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {num}
              </button>
            ))}
            <input
              type="number"
              min="1"
              value={selectedDomains}
              onChange={(e) => setSelectedDomains(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="Custom"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium flex-1 min-w-24"
            />
          </div>

          {/* Current discount display */}
          <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-700">Your Current Discount:</span>
              <span className="text-4xl font-bold text-purple-600">{discount}%</span>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Price per domain: <span className="font-semibold">from £325 to £9,000</span>
            </p>
          </div>
        </div>

        {/* Pricing table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-slate-900">Plan</th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-900">
                    Original Price
                  </th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-900">
                    Your Price
                  </th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-900">
                    Total ({selectedDomains} domains)
                  </th>
                  <th className="text-center px-6 py-4 font-semibold text-green-600">
                    You Save
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Small Business', basePrice: BASE_PRICES.small },
                  { name: 'SME', basePrice: BASE_PRICES.sme },
                  { name: 'Mid-Market', basePrice: BASE_PRICES.mid },
                  { name: 'Enterprise', basePrice: BASE_PRICES.enterprise },
                ].map((plan, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {plan.name}
                    </td>
                    <td className="text-center px-6 py-4 text-slate-600">
                      £{plan.basePrice}/month
                    </td>
                    <td className="text-center px-6 py-4 text-slate-900 font-semibold">
                      £{calculatePrice(plan.basePrice)}/month
                    </td>
                    <td className="text-center px-6 py-4 text-slate-900 font-bold">
                      £{calculateTotal(plan.basePrice)}/month
                    </td>
                    <td className="text-center px-6 py-4 text-green-600 font-bold">
                      £{calculateSavings(plan.basePrice)}/month
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Example scenario */}
        <div className="mt-8 p-6 bg-white rounded-lg border-2 border-green-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            💰 Example: Your Potential Savings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Without Multi-Domain Discount:</p>
              <p className="text-2xl font-bold text-slate-900">
                £{(selectedDomains * BASE_PRICES.sme).toLocaleString()}/month
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">With {discount}% Discount:</p>
              <p className="text-2xl font-bold text-green-600">
                £{calculateTotal(BASE_PRICES.sme).toLocaleString()}/month
              </p>
            </div>
          </div>
          <p className="text-lg font-bold text-green-600 mt-4">
            💵 Save £{calculateSavings(BASE_PRICES.sme).toLocaleString()}/month (£{(calculateSavings(BASE_PRICES.sme) * 12).toLocaleString()}/year!)
          </p>
        </div>
      </div>
    </section>
  );
}
