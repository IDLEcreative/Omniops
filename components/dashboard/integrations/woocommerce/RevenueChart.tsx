import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currencySymbol?: string;
}

const formatCurrency = (value: string, symbol: string = '£') => {
  return `${symbol}${parseFloat(value).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

function SimpleLineChart({ data, currencySymbol = '£' }: { data: RevenueDataPoint[]; currencySymbol?: string }) {
  if (!data || data.length === 0) return null;

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const chartHeight = 120;
  const chartWidth = 100;

  return (
    <div className="w-full h-32 mt-4">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          points={data.map((point, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            const y = chartHeight - ((point.revenue / maxRevenue) * chartHeight * 0.8) - 10;
            return `${x},${y}`;
          }).join(' ')}
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * chartWidth;
          const y = chartHeight - ((point.revenue / maxRevenue) * chartHeight * 0.8) - 10;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="hsl(var(--primary))"
              className="hover:r-3"
            >
              <title>{`${point.date}: ${formatCurrency(point.revenue.toString(), currencySymbol)}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{data[0]?.date.split('-').slice(1).join('/')}</span>
        <span>Last 30 days</span>
        <span>{data[data.length - 1]?.date.split('-').slice(1).join('/')}</span>
      </div>
    </div>
  );
}

export function RevenueChart({ data, currencySymbol }: RevenueChartProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Daily revenue over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <SimpleLineChart data={data} currencySymbol={currencySymbol} />
      </CardContent>
    </Card>
  );
}
