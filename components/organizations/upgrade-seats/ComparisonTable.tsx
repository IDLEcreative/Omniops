"use client";

import { Check, X } from "lucide-react";
import { pricingPlans } from "./pricing-plans";

const comparisonRows = [
  { feature: "Team Seats", values: pricingPlans.map(p => p.seatsDisplay) },
  { feature: "Support", values: ["Email", "Priority", "24/7 Dedicated"] },
  { feature: "Data Retention", values: ["30 days", "90 days", "Unlimited"] },
  { feature: "SSO", values: [false, true, true] },
  { feature: "Custom Integrations", values: [false, true, true] },
  { feature: "SLA", values: [false, false, true] },
];

export function ComparisonTable() {
  return (
    <details className="cursor-pointer">
      <summary className="text-sm text-muted-foreground hover:text-foreground">
        View detailed feature comparison
      </summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Feature</th>
              {pricingPlans.map(plan => (
                <th key={plan.id} className="text-center p-2">{plan.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2 font-medium">{row.feature}</td>
                {row.values.map((value, i) => (
                  <td key={i} className="text-center p-2">
                    {typeof value === 'boolean' ? (
                      value ? <Check className="h-4 w-4 text-green-500 mx-auto" />
                            : <X className="h-4 w-4 text-gray-400 mx-auto" />
                    ) : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
