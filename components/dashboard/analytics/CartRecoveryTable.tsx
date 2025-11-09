"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpRight, Clock, Mail, ShoppingCart } from 'lucide-react';
import type { ConversationFunnel, CartPriority } from '@/types/purchase-attribution';

interface CartRecoveryTableProps {
  abandonedCarts: ConversationFunnel[];
  isLoading?: boolean;
  onContactCustomer?: (email: string) => void;
}

const priorityConfig: Record<CartPriority, { color: string; label: string; badge: 'default' | 'secondary' | 'destructive' }> = {
  high: { color: 'text-red-600', label: 'High Priority', badge: 'destructive' },
  medium: { color: 'text-orange-600', label: 'Medium Priority', badge: 'default' },
  low: { color: 'text-gray-600', label: 'Low Priority', badge: 'secondary' },
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function CartRecoveryTable({ abandonedCarts, isLoading, onContactCustomer }: CartRecoveryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cart Recovery Opportunities</CardTitle>
          <CardDescription>High-value abandoned carts to recover</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-16 w-full rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by priority (high → medium → low) and then by cart value descending
  const sortedCarts = [...abandonedCarts].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.cart_priority || 'low'];
    const bPriority = priorityOrder[b.cart_priority || 'low'];

    if (aPriority !== bPriority) return aPriority - bPriority;
    return (b.cart_value || 0) - (a.cart_value || 0);
  });

  // Calculate recovery potential
  const totalValue = abandonedCarts.reduce((sum, cart) => sum + (cart.cart_value || 0), 0);
  const highPriorityCount = abandonedCarts.filter(c => c.cart_priority === 'high').length;
  const highPriorityValue = abandonedCarts
    .filter(c => c.cart_priority === 'high')
    .reduce((sum, cart) => sum + (cart.cart_value || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cart Recovery Opportunities</CardTitle>
            <CardDescription>
              Abandoned carts ordered by priority and value
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Potential</p>
            <p className="text-2xl font-bold">£{totalValue.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Carts</p>
              <p className="text-xl font-bold">{abandonedCarts.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-xl font-bold text-red-600">{highPriorityCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Priority Value</p>
              <p className="text-xl font-bold">£{highPriorityValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Carts Table */}
          {abandonedCarts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Abandoned Carts</p>
              <p className="text-sm">Great news! All carts have been converted or there are no active carts.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Cart Value</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Time Since Cart</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCarts.map((cart) => {
                    const priority = cart.cart_priority || 'low';
                    const config = priorityConfig[priority];

                    return (
                      <TableRow key={cart.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant={config.badge} className="font-semibold">
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{cart.customer_email}</p>
                            <p className="text-xs text-muted-foreground">
                              Conversation: {cart.conversation_id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className={`text-lg font-bold ${config.color}`}>
                            £{(cart.cart_value || 0).toFixed(2)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            <span>{cart.cart_item_count || 0} items</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatTimeAgo(cart.cart_created_at || cart.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onContactCustomer?.(cart.customer_email)}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Contact
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/dashboard/conversations/${cart.conversation_id}`, '_blank')}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
