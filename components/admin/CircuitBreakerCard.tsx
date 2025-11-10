'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface CircuitBreaker {
  openEvents: number;
  halfOpenEvents: number;
  avgFailuresBeforeOpen: number;
}

interface CircuitBreakerCardProps {
  circuitBreaker: CircuitBreaker;
}

const formatNumber = (value: number) => value.toFixed(2);

export function CircuitBreakerCard({ circuitBreaker }: CircuitBreakerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Circuit Breaker Status</CardTitle>
        <CardDescription>Failure protection and circuit state transitions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Open Events</div>
            <div className="text-2xl font-bold">{circuitBreaker.openEvents}</div>
            {circuitBreaker.openEvents === 0 ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            ) : (
              <Badge className="bg-yellow-500">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Has Issues
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Half-Open Events</div>
            <div className="text-2xl font-bold">{circuitBreaker.halfOpenEvents}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Avg Failures Before Open</div>
            <div className="text-2xl font-bold">
              {formatNumber(circuitBreaker.avgFailuresBeforeOpen)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
