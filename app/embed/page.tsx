'use client';

import { useState, useEffect } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function EmbedPage() {
  const [demoId, setDemoId] = useState<string>('');
  const [demoConfig, setDemoConfig] = useState<any>(null);
  const [initialOpen, setInitialOpen] = useState(false);
  const [forceClose, setForceClose] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    allowOptOut: true,
    showPrivacyNotice: true,
    requireConsent: false,
    consentGiven: false,
    retentionDays: 30,
  });

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check if this is a demo
    const demo = params.get('demo');
    if (demo) {
      setDemoId(demo);
      // Try to load demo config from localStorage
      const storedConfig = localStorage.getItem(`demo_${demo}_config`);
      if (storedConfig) {
        setDemoConfig(JSON.parse(storedConfig));
      }
    }
    
    // Parse privacy settings
    setPrivacySettings({
      allowOptOut: params.get('optOut') === 'true',
      showPrivacyNotice: params.get('privacyNotice') === 'true',
      requireConsent: params.get('requireConsent') === 'true',
      consentGiven: params.get('consentGiven') === 'true',
      retentionDays: parseInt(params.get('retentionDays') || '30'),
    });

    // Check for force close parameter
    if (params.get('forceClose') === 'true') {
      setForceClose(true);
    } else if (params.get('open') === 'true') {
      setInitialOpen(true);
    }
  }, []);

  return (
    <ChatWidget
      demoId={demoId}
      demoConfig={demoConfig}
      initialOpen={initialOpen}
      forceClose={forceClose}
      privacySettings={privacySettings}
    />
  );
}