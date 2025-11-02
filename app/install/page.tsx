import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function InstallPage() {
  // Always use production URL, never localhost
  const serverUrl = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')
    ? 'https://omniops.co.uk'
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://omniops.co.uk');

  const embedCode = `<!-- Chat Widget -->
<script>
window.ChatWidgetConfig = {
  // Optional: Customize appearance and behavior
  appearance: {
    position: 'bottom-right',
    primaryColor: '#0070f3',
    headerTitle: 'Customer Support'
  }
};
</script>
<script src="${serverUrl}/embed.js" async></script>
<!-- End Chat Widget -->`;

  const wordpressPlugin = `<?php
/**
 * Plugin Name: Customer Service Chat Widget
 * Description: Adds an AI-powered customer service chat to your website
 * Version: 1.0
 */

function add_chat_widget() {
    ?>
    <script>
    window.ChatWidgetConfig = {
        features: {
            woocommerce: { enabled: true }
        }
    };
    </script>
    <script src="${serverUrl}/embed.js" async></script>
    <?php
}
add_action('wp_footer', 'add_chat_widget');`;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Installation Guide</h1>
        <p className="text-muted-foreground">
          Add the chat widget to any website in minutes
        </p>
      </div>

      <Tabs defaultValue="universal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="universal">Universal</TabsTrigger>
          <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          <TabsTrigger value="shopify">Shopify</TabsTrigger>
          <TabsTrigger value="react">React/Next.js</TabsTrigger>
        </TabsList>

        <TabsContent value="universal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Universal Installation</CardTitle>
              <CardDescription>
                Works on any website - just add this code before the closing &lt;/body&gt; tag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">E-commerce</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">WooCommerce</Badge>
                      <span className="text-sm text-muted-foreground">Full integration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Shopify</Badge>
                      <span className="text-sm text-muted-foreground">Coming soon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">BigCommerce</Badge>
                      <span className="text-sm text-muted-foreground">Coming soon</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">CMS & Builders</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">WordPress</Badge>
                      <span className="text-sm text-muted-foreground">Plugin available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Webflow</Badge>
                      <span className="text-sm text-muted-foreground">Embed code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Squarespace</Badge>
                      <span className="text-sm text-muted-foreground">Code injection</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wordpress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WordPress Installation</CardTitle>
              <CardDescription>
                Choose between plugin installation or manual code insertion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Option 1: Create a Simple Plugin</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{wordpressPlugin}</code>
                </pre>
                <p className="text-sm text-muted-foreground mt-2">
                  Save this as chat-widget.php in wp-content/plugins/ and activate
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Option 2: Add to Theme</h4>
                <p className="text-sm text-muted-foreground">
                  Add the embed code to your theme&apos;s footer.php file before &lt;/body&gt;
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Option 3: Use a Plugin</h4>
                <p className="text-sm text-muted-foreground">
                  Use plugins like "Insert Headers and Footers" or "WPCode" to add the script
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shopify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shopify Installation</CardTitle>
              <CardDescription>
                Add the chat widget to your Shopify store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3">
                <li>
                  <span className="font-medium">1. Go to Online Store → Themes</span>
                  <p className="text-sm text-muted-foreground">In your Shopify admin panel</p>
                </li>
                <li>
                  <span className="font-medium">2. Click "Actions" → "Edit code"</span>
                  <p className="text-sm text-muted-foreground">On your current theme</p>
                </li>
                <li>
                  <span className="font-medium">3. Find theme.liquid</span>
                  <p className="text-sm text-muted-foreground">In the Layout folder</p>
                </li>
                <li>
                  <span className="font-medium">4. Add the embed code</span>
                  <p className="text-sm text-muted-foreground">Paste before the closing &lt;/body&gt; tag</p>
                </li>
                <li>
                  <span className="font-medium">5. Save and test</span>
                  <p className="text-sm text-muted-foreground">The widget should appear on your store</p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="react" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>React/Next.js Installation</CardTitle>
              <CardDescription>
                Install as a React component or use the embed script
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Option 1: NPM Package (Coming Soon)</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`npm install @your-company/chat-widget

import ChatWidget from '@your-company/chat-widget';

function App() {
  return (
    <>
      <YourApp />
      <ChatWidget 
        config={{
          appearance: { position: 'bottom-right' },
          features: { websiteScraping: { enabled: true } }
        }}
      />
    </>
  );
}`}</code>
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Option 2: Script Tag</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Add to your index.html or use Next.js Script component:
                </p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`import Script from 'next/script';

export default function Layout() {
  return (
    <>
      <Script id="chat-config" strategy="beforeInteractive">
        {\`window.ChatWidgetConfig = { /* config */ };\`}
      </Script>
      <Script
        src="${serverUrl}/embed.js"
        strategy="afterInteractive"
      />
    </>
  );
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}