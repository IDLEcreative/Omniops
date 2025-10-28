"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Package, ShoppingBag, Blocks, Layers, FileCode } from "lucide-react";
import { CodeBlock } from "./CodeBlock";

interface PlatformGuidesProps {
  serverUrl: string;
}

export function PlatformGuides({ serverUrl }: PlatformGuidesProps) {
  const embedUrl = serverUrl || "https://your-domain.com";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform-Specific Installation Guides</CardTitle>
        <CardDescription>
          Detailed instructions for installing the chat widget on different platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* WordPress */}
          <AccordionItem value="wordpress">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span>WordPress</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Add the widget to your WordPress site by editing your theme's footer template.
                </p>

                <div>
                  <h4 className="font-medium mb-2">Method 1: Theme Functions (Recommended)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add this code to your theme's <code className="bg-muted px-1 rounded">functions.php</code> file:
                  </p>
                  <CodeBlock
                    language="php"
                    code={`function add_chat_widget() {
    ?>
    <script src="${embedUrl}/embed.js" async></script>
    <?php
}
add_action('wp_footer', 'add_chat_widget');`}
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Method 2: Footer Template</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Or add directly to <code className="bg-muted px-1 rounded">footer.php</code> before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code>:
                  </p>
                  <CodeBlock
                    language="html"
                    code={`<script src="${embedUrl}/embed.js" async></script>`}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Shopify */}
          <AccordionItem value="shopify">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-green-600" />
                <span>Shopify</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Add the widget to your Shopify store by editing your theme template.
                </p>

                <div>
                  <h4 className="font-medium mb-2">Installation Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <strong>Online Store → Themes</strong></li>
                    <li>Click <strong>Actions → Edit code</strong></li>
                    <li>Find and open <code className="bg-muted px-1 rounded">theme.liquid</code></li>
                    <li>Scroll to the bottom, find <code className="bg-muted px-1 rounded">&lt;/body&gt;</code></li>
                    <li>Add this code right before it:</li>
                  </ol>
                </div>

                <CodeBlock
                  language="html"
                  code={`<!-- Chat Widget -->
<script src="${embedUrl}/embed.js" async></script>`}
                />

                <p className="text-sm text-muted-foreground">
                  Click <strong>Save</strong> and the widget will appear on all pages.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* WooCommerce */}
          <AccordionItem value="woocommerce">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-purple-600" />
                <span>WooCommerce</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  For WooCommerce stores, you can enable enhanced features like order tracking.
                </p>

                <div>
                  <h4 className="font-medium mb-2">Enable WooCommerce Integration:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add this enhanced version to <code className="bg-muted px-1 rounded">functions.php</code>:
                  </p>
                  <CodeBlock
                    language="php"
                    code={`function add_chat_widget_with_woo() {
    ?>
    <script>
    window.ChatWidgetConfig = {
        serverUrl: '${embedUrl}',
        features: {
            woocommerce: { enabled: true }
        }
    };
    </script>
    <script src="${embedUrl}/embed.js" async></script>
    <?php
}
add_action('wp_footer', 'add_chat_widget_with_woo');`}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  This enables order tracking, stock queries, and product lookups through the chat.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Next.js */}
          <AccordionItem value="nextjs">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-black dark:text-white" />
                <span>Next.js</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  For Next.js applications, add the widget to your root layout.
                </p>

                <div>
                  <h4 className="font-medium mb-2">App Router (Next.js 13+):</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Edit <code className="bg-muted px-1 rounded">app/layout.tsx</code>:
                  </p>
                  <CodeBlock
                    language="tsx"
                    code={`import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${embedUrl}/embed.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* React */}
          <AccordionItem value="react">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Blocks className="h-4 w-4 text-cyan-500" />
                <span>React</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  For React applications, load the script in a useEffect hook.
                </p>

                <div>
                  <h4 className="font-medium mb-2">Add to your main App component:</h4>
                  <CodeBlock
                    language="tsx"
                    code={`import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${embedUrl}/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div>{/* Your app */}</div>;
}`}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* HTML */}
          <AccordionItem value="html">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-orange-600" />
                <span>Plain HTML</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  For static HTML websites, add the script tag to your template.
                </p>

                <div>
                  <h4 className="font-medium mb-2">Add before closing &lt;/body&gt; tag:</h4>
                  <CodeBlock
                    language="html"
                    code={`<!DOCTYPE html>
<html>
  <head>
    <title>Your Website</title>
  </head>
  <body>
    <!-- Your content -->

    <!-- Chat Widget -->
    <script src="${embedUrl}/embed.js" async></script>
  </body>
</html>`}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
