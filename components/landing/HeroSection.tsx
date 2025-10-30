"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  ArrowRight,
  Sparkles,
  Play,
  ChevronRight,
  Brain,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DemoUrlInput } from "@/components/demo/DemoUrlInput";
import { ScrapingProgress } from "@/components/demo/ScrapingProgress";
import { DemoChatInterface } from "@/components/demo/DemoChatInterface";

type ScrapeStep = 'homepage' | 'sitemap' | 'pages' | 'embeddings' | 'done';

interface DemoSession {
  id: string;
  domain: string;
  pages_scraped: number;
  expires_at: number;
  message_count: number;
  max_messages: number;
}

interface HeroSectionProps {
  demoUrl: string;
  setDemoUrl: (url: string) => void;
  isScraping: boolean;
  scrapeProgress: number;
  currentStep: ScrapeStep;
  demoSession: DemoSession | null;
  error: string;
  onStartDemo: () => void;
  onSendMessage: (message: string) => Promise<string>;
}

export function HeroSection({
  demoUrl,
  setDemoUrl,
  isScraping,
  scrapeProgress,
  currentStep,
  demoSession,
  error,
  onStartDemo,
  onSendMessage,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

      {/* Minimal Navigation */}
      <nav className="relative container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Omniops</span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/dashboard" className="hidden sm:block">
              <Button size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container relative mx-auto px-4 pt-12 pb-32">
        <div className="mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-1">
            <Sparkles className="mr-1 h-3 w-3" />
            Powered by OpenAI GPT-5
          </Badge>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Answer Customer Questions{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
              While You Sleep
            </span>
            <span className="inline-block ml-2 text-4xl sm:text-5xl md:text-6xl animate-pulse">
              💤
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            AI chat that knows your products, speaks 40+ languages, and handles
            support 24/7. No training required.
          </p>

          {/* Instant Demo Section */}
          <div className="mx-auto mb-8 max-w-4xl">
            <DemoUrlInput
              url={demoUrl}
              onChange={setDemoUrl}
              onSubmit={onStartDemo}
              isLoading={isScraping}
            />

            {error && (
              <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
            )}

            {isScraping && (
              <ScrapingProgress
                progress={scrapeProgress}
                currentStep={currentStep}
              />
            )}

            {demoSession && (
              <DemoChatInterface
                session={demoSession}
                onSendMessage={onSendMessage}
              />
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="#demo">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero Chat Preview */}
        <div className="mt-16 mx-auto max-w-4xl">
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-background via-muted/30 to-background shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-foreground">Customer Support</h3>
                  <p className="text-xs text-primary-foreground/80">Always online</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-primary-foreground/80">AI Online</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="bg-background p-6 space-y-4 min-h-[400px]">
              {/* AI Message */}
              <div className="flex gap-3 animate-in slide-in-from-left duration-500">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">Hi! 👋 I'm your AI assistant. I can help you with product questions, pricing, and support 24/7 in over 40 languages!</p>
                </div>
              </div>

              {/* User Message */}
              <div className="flex gap-3 justify-end animate-in slide-in-from-right duration-500 delay-300">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">What are your shipping options?</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">👤</span>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex gap-3 animate-in slide-in-from-left duration-500 delay-700">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">We offer free standard shipping (3-5 days), express shipping (1-2 days) for £9.99, and same-day delivery in select areas. All orders over £50 get free express upgrade! 📦</p>
                </div>
              </div>

              {/* Typing Indicator */}
              <div className="flex gap-3 animate-in slide-in-from-left duration-500 delay-1000">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="border-t bg-muted/30 px-6 py-4">
              <div className="flex gap-3 items-center">
                <div className="flex-1 bg-background rounded-full border px-4 py-2 text-sm text-muted-foreground">
                  Type your message...
                </div>
                <Button size="icon" className="rounded-full h-10 w-10">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by AI
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
