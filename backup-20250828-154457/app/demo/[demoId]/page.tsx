'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, Sparkles, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the ChatWidget component to avoid SSR issues
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { 
  ssr: false,
  loading: () => null 
});

export default function DemoPage() {
  const params = useParams();
  const router = useRouter();
  const demoId = params.demoId as string;
  const [loading, setLoading] = useState(true);
  const [demoConfig, setDemoConfig] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch demo config from localStorage (set by landing page)
    const storedConfig = localStorage.getItem(`demo_${demoId}_config`);
    if (storedConfig) {
      setDemoConfig(JSON.parse(storedConfig));
      setLoading(false);
    } else {
      // Redirect to home if no config found
      router.push('/');
    }
  }, [demoId, router]);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyEmbedCode = () => {
    const embedCode = `<!-- AI Chat Widget -->
<script>
window.ChatWidgetConfig = {
  brandColor: '${demoConfig?.brandColor || '#4F46E5'}',
  position: 'bottom-right',
  headerTitle: '${demoConfig?.brandName || 'Customer'} Support',
  welcomeMessage: '${demoConfig?.welcomeMessage || 'Hi! How can I help you today?'}'
};
</script>
<script src="${window.location.origin}/embed.js" async></script>
<!-- End AI Chat Widget -->`;
    
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your AI assistant demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">Omniops</span>
              </Link>
              <span className="text-sm text-muted-foreground">
                Demo Session
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                {formatTime(timeLeft)} remaining
              </Badge>
              <Button asChild>
                <Link href="/setup">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Info Cards */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                AI Assistant Demo
              </h1>
              <p className="text-muted-foreground">
                Experience how {demoConfig?.brandName || 'your'} customers will interact with your AI support
              </p>
            </div>
            
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Demo Configuration
                </CardTitle>
                <CardDescription className="text-sm">
                  Trained on: <a href={demoConfig?.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{demoConfig?.url}</a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Demo Features</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>AI trained on your homepage</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Brand colors and styling</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Custom welcome message</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Real-time chat</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Full Version Includes</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Complete website training</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>WooCommerce integration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Analytics & history</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>24/7 automated support</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link href="/setup">
                      Set Up Full Version →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Embed Code Card */}
            <Card className="border-dashed h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Install</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Add to your site:
                </p>
                <div className="relative">
                  <pre className="bg-muted p-2 rounded-lg overflow-x-auto text-xs font-mono">
                    <code>{`<script src="${window.location.origin}/embed.js"
  data-demo="${demoId}"></script>`}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-0.5 right-0.5 h-7 px-2 text-xs"
                    onClick={copyEmbedCode}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isExpired && (
              <Alert>
                <AlertDescription>
                  This demo has expired. <Link href="/" className="underline">Create a new demo</Link> or{' '}
                  <Link href="/setup" className="underline">set up the full version</Link>.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
      
      {/* Render the chat widget directly */}
      {mounted && demoConfig && (
        <ChatWidget 
          demoId={demoId}
          demoConfig={demoConfig}
          initialOpen={false}
        />
      )}
    </div>
  );
}