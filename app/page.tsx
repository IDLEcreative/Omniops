"use client";

import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

type ScrapeStep = 'homepage' | 'sitemap' | 'pages' | 'embeddings' | 'done';

interface DemoSession {
  id: string;
  domain: string;
  pages_scraped: number;
  expires_at: number;
  message_count: number;
  max_messages: number;
}

export default function Home() {
  const [demoUrl, setDemoUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<ScrapeStep>('homepage');
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);
  const [error, setError] = useState("");

  const handleStartDemo = async () => {
    if (!demoUrl.trim()) {
      setError("Please enter a website URL");
      return;
    }

    // Add https:// if no protocol specified
    let urlToScrape = demoUrl.trim();
    if (!urlToScrape.startsWith('http://') && !urlToScrape.startsWith('https://')) {
      urlToScrape = 'https://' + urlToScrape;
    }

    setError("");
    setIsScraping(true);
    setScrapeProgress(0);
    setCurrentStep('homepage');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScrapeProgress(prev => Math.min(prev + 10, 90));
      }, 800);

      // Start scraping
      setCurrentStep('homepage');
      const response = await fetch("/api/demo/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToScrape }),
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze website");
      }

      // Update to final steps
      setCurrentStep('sitemap');
      setScrapeProgress(70);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('pages');
      setScrapeProgress(85);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('embeddings');
      setScrapeProgress(95);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('done');
      setScrapeProgress(100);

      // Create demo session
      setDemoSession({
        id: data.session_id,
        domain: data.domain,
        pages_scraped: data.pages_scraped,
        expires_at: Date.now() + (10 * 60 * 1000),
        message_count: 0,
        max_messages: 20
      });

      setIsScraping(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze website");
      setIsScraping(false);
      setScrapeProgress(0);
    }
  };

  const handleSendMessage = async (message: string): Promise<string> => {
    if (!demoSession) {
      throw new Error('No active demo session');
    }

    const response = await fetch("/api/demo/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: demoSession.id,
        message
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get response");
    }

    // Update session message count
    setDemoSession(prev => prev ? {
      ...prev,
      message_count: data.message_count
    } : null);

    return data.response;
  };

  return (
    <>
      <HeroSection
        demoUrl={demoUrl}
        setDemoUrl={setDemoUrl}
        isScraping={isScraping}
        scrapeProgress={scrapeProgress}
        currentStep={currentStep}
        demoSession={demoSession}
        error={error}
        onStartDemo={handleStartDemo}
        onSendMessage={handleSendMessage}
      />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </>
  );
}
