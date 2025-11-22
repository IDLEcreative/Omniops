'use client';

import { useState, useEffect } from 'react';
import { Cookie, Shield, ChartBar, Target, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CookiePreference {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreference = {
  essential: true, // Always true, cannot be changed
  analytics: false,
  marketing: false,
};

export function CookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreference>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('cookiePreferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({
          ...parsed,
          essential: true // Ensure essential is always true
        });
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }
  }, []);

  const handleToggle = (key: 'analytics' | 'marketing', value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Save to localStorage
      localStorage.setItem('cookiePreferences', JSON.stringify(preferences));

      // Set cookies for the preferences
      document.cookie = `cookie_analytics=${preferences.analytics}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `cookie_marketing=${preferences.marketing}; path=/; max-age=31536000; SameSite=Lax`;

      // If analytics was disabled, clear any analytics cookies
      if (!preferences.analytics) {
        // Clear Google Analytics cookies if present
        document.cookie = '_ga=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = '_gid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

        // Disable Google Analytics if it's loaded
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('consent', 'update', {
            'analytics_storage': 'denied'
          });
        }
      } else {
        // Re-enable Google Analytics if it's loaded
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('consent', 'update', {
            'analytics_storage': 'granted'
          });
        }
      }

      // If marketing was disabled, clear marketing cookies
      if (!preferences.marketing) {
        // Clear common marketing cookies
        document.cookie = '_fbp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = '_ttp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }

      setHasChanges(false);
      toast({
        title: 'Preferences saved',
        description: 'Your cookie preferences have been updated.',
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasChanges(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Cookie className="h-5 w-5 mr-2" />
          Cookie Preferences
        </CardTitle>
        <CardDescription>
          Manage how we use cookies to improve your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            We respect your privacy. You can change your cookie preferences at any time.
            Essential cookies cannot be disabled as they are required for the site to function.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Essential Cookies - Always On */}
          <div className="flex items-start justify-between space-x-2 p-4 rounded-lg border bg-muted/50">
            <div className="flex-1 space-y-1">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                <Label className="font-medium">Essential Cookies</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Required for the website to function properly. These cookies enable core functionality
                such as security, network management, and accessibility.
              </p>
            </div>
            <Switch
              checked={true}
              disabled
              aria-label="Essential cookies (always enabled)"
            />
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-start justify-between space-x-2 p-4 rounded-lg border">
            <div className="flex-1 space-y-1">
              <div className="flex items-center">
                <ChartBar className="h-4 w-4 mr-2 text-blue-600" />
                <Label className="font-medium">Analytics Cookies</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Help us understand how visitors interact with our website by collecting and reporting
                information anonymously. This helps us improve our service.
              </p>
            </div>
            <Switch
              checked={preferences.analytics}
              onCheckedChange={(checked) => handleToggle('analytics', checked)}
              aria-label="Toggle analytics cookies"
            />
          </div>

          {/* Marketing Cookies */}
          <div className="flex items-start justify-between space-x-2 p-4 rounded-lg border">
            <div className="flex-1 space-y-1">
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2 text-green-600" />
                <Label className="font-medium">Marketing Cookies</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Used to track visitors across websites to display ads that are relevant and engaging.
                These cookies help us measure the effectiveness of our marketing campaigns.
              </p>
            </div>
            <Switch
              checked={preferences.marketing}
              onCheckedChange={(checked) => handleToggle('marketing', checked)}
              aria-label="Toggle marketing cookies"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleResetToDefault}
            disabled={loading}
          >
            Reset to Default
          </Button>
          <div className="flex gap-2">
            {hasChanges && (
              <span className="text-sm text-muted-foreground self-center">
                You have unsaved changes
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}