'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function AdminPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  
  const [config, setConfig] = useState({
    domain: '',
    owned_domains: [] as string[],
    woocommerce: {
      enabled: false,
      url: '',
      consumer_key: '',
      consumer_secret: '',
    },
    shopify: {
      enabled: false,
      domain: '',
      access_token: '',
    },
  });
  
  const [newDomain, setNewDomain] = useState('');

  // Load existing configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError('Failed to save configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const testWooCommerceConnection = async () => {
    if (!config.woocommerce.url || !config.woocommerce.consumer_key || !config.woocommerce.consumer_secret) {
      setError('Please fill in all WooCommerce fields first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'woocommerce',
          config: config.woocommerce,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSaved(true);
        setError('');
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Connection test failed');
      }
    } catch (error) {
      setError('Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Configure your chat widget integrations and API keys
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Configuration saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Website Domain</CardTitle>
          <CardDescription>
            The domain where your chat widget will be installed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="domain">Your Website Domain</Label>
            <Input
              id="domain"
              placeholder="example.com"
              value={config.domain}
              onChange={(e) => setConfig({ ...config, domain: e.target.value })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter without https:// or trailing slash
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="owned-domains" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="owned-domains">Owned Domains</TabsTrigger>
          <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
          <TabsTrigger value="shopify">Shopify</TabsTrigger>
          <TabsTrigger value="custom">Custom APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="owned-domains">
          <Card>
            <CardHeader>
              <CardTitle>Owned Domains</CardTitle>
              <CardDescription>
                Add your company's domains for optimized high-speed scraping when training your bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-domain">Add Domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-domain"
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newDomain.trim()) {
                        e.preventDefault();
                        if (!config.owned_domains.includes(newDomain.trim())) {
                          setConfig({
                            ...config,
                            owned_domains: [...config.owned_domains, newDomain.trim()],
                          });
                          setNewDomain('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newDomain.trim() && !config.owned_domains.includes(newDomain.trim())) {
                        setConfig({
                          ...config,
                          owned_domains: [...config.owned_domains, newDomain.trim()],
                        });
                        setNewDomain('');
                      }
                    }}
                    disabled={!newDomain.trim()}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Press Enter or click Add to add a domain
                </p>
              </div>

              <div className="space-y-2">
                <Label>Your Domains</Label>
                {config.owned_domains.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No domains added yet</p>
                ) : (
                  <div className="space-y-2">
                    {config.owned_domains.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{domain}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConfig({
                              ...config,
                              owned_domains: config.owned_domains.filter((_, i) => i !== index),
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Optimized Scraping</AlertTitle>
                <AlertDescription>
                  When scraping these domains, the system will automatically use high-performance settings:
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Up to 20 concurrent scraping jobs</li>
                    <li>20+ concurrent browser pages per job</li>
                    <li>No rate limiting or delays</li>
                    <li>Optimized for maximum speed (50-100+ pages/second)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="woocommerce">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                WooCommerce Integration
                <Switch
                  checked={config.woocommerce.enabled}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      woocommerce: { ...config.woocommerce, enabled: checked },
                    })
                  }
                />
              </CardTitle>
              <CardDescription>
                Connect your WooCommerce store to enable product search and order lookup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wc-url">WooCommerce Store URL</Label>
                <Input
                  id="wc-url"
                  placeholder="https://your-store.com"
                  value={config.woocommerce.url}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      woocommerce: { ...config.woocommerce, url: e.target.value },
                    })
                  }
                  disabled={!config.woocommerce.enabled}
                />
              </div>

              <div>
                <Label htmlFor="wc-key">Consumer Key</Label>
                <Input
                  id="wc-key"
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={config.woocommerce.consumer_key}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      woocommerce: { ...config.woocommerce, consumer_key: e.target.value },
                    })
                  }
                  disabled={!config.woocommerce.enabled}
                />
              </div>

              <div>
                <Label htmlFor="wc-secret">Consumer Secret</Label>
                <div className="relative">
                  <Input
                    id="wc-secret"
                    type={showSecrets ? 'text' : 'password'}
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.woocommerce.consumer_secret}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        woocommerce: { ...config.woocommerce, consumer_secret: e.target.value },
                      })
                    }
                    disabled={!config.woocommerce.enabled}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testWooCommerceConnection}
                  disabled={!config.woocommerce.enabled || loading}
                  variant="outline"
                >
                  Test Connection
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>How to get WooCommerce API Keys</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to WooCommerce → Settings → Advanced → REST API</li>
                    <li>Click "Add key"</li>
                    <li>Set description and user</li>
                    <li>Set permissions to "Read" (for customer-facing features)</li>
                    <li>Click "Generate API key"</li>
                    <li>Copy the Consumer key and Consumer secret</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shopify">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Shopify Integration
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Connect your Shopify store (available in next release)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Shopify integration will be available soon. Contact support for early access.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom API Integration</CardTitle>
              <CardDescription>
                Add your own APIs for the chat bot to use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Custom API configuration coming soon. You'll be able to add any REST API endpoint
                for the bot to query.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          onClick={saveConfiguration}
          disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}