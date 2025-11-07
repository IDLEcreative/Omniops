"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Check, AlertCircle } from "lucide-react";

interface Subscription {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

export function ReportSettings() {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [existingSubscriptions, setExistingSubscriptions] = useState<Subscription[]>([]);

  // Load existing subscriptions
  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/analytics/reports/subscribe');
      if (response.ok) {
        const { subscriptions } = await response.json();
        setExistingSubscriptions(subscriptions || []);

        // Set default values from existing subscription
        const currentSub = subscriptions.find((s: Subscription) => s.frequency === frequency);
        if (currentSub) {
          setEnabled(currentSub.enabled);
        }
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/analytics/reports/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frequency, enabled }),
      });

      if (response.ok) {
        setSaveStatus('success');
        await loadSubscriptions();

        // Reset success message after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save subscription:', error);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (freq: 'daily' | 'weekly' | 'monthly') => {
    setLoading(true);

    try {
      const response = await fetch(`/api/analytics/reports/subscribe?frequency=${freq}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSubscriptions();
        if (freq === frequency) {
          setEnabled(false);
        }
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Scheduled Email Reports</h3>
        <p className="text-sm text-muted-foreground">
          Receive automated analytics reports via email at your preferred frequency.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Report Frequency</Label>
          <Select value={frequency} onValueChange={(val) => setFrequency(val as any)}>
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly (Monday)</SelectItem>
              <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="enabled" className="flex flex-col space-y-1">
            <span>Enable Reports</span>
            <span className="font-normal text-sm text-muted-foreground">
              Receive {frequency} analytics reports via email
            </span>
          </Label>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          <Mail className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>

        {saveStatus === 'success' && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Report preferences saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to save preferences. Please try again.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {existingSubscriptions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Active Subscriptions</h4>
          <div className="space-y-2">
            {existingSubscriptions
              .filter(sub => sub.enabled)
              .map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{sub.frequency} Reports</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(sub.frequency)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
