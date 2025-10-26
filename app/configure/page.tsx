'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfigurationWizard } from '@/components/configure/ConfigurationWizard';

function ConfigurePageContent() {
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';

  useEffect(() => {
    if (isOnboarding) {
      // Could show a welcome modal or tour here
    }
  }, [isOnboarding]);

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isOnboarding ? 'Customize Your AI Assistant' : 'Configure Your Chat Widget'}
        </h1>
        <p className="text-muted-foreground">
          {isOnboarding
            ? "Great! Your AI is ready. Now let's make it match your brand."
            : 'Customize the chat widget to match your website and business needs.'}
        </p>
      </div>

      <ConfigurationWizard isOnboarding={isOnboarding} />
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfigurePageContent />
    </Suspense>
  );
}
