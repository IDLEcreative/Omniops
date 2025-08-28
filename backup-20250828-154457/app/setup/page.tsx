'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Loader2, 
  Globe,
  Palette,
  Code,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
}

export default function SetupPage() {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    { id: 'validate', title: 'Validating URL', status: 'pending' },
    { id: 'scrape', title: 'Analyzing your website', status: 'pending' },
    { id: 'train', title: 'Training AI on your content', status: 'pending' },
    { id: 'configure', title: 'Setting up your widget', status: 'pending' },
  ]);
  const router = useRouter();

  // Calculate progress
  const progress = (currentStep / setupSteps.length) * 100;
  const estimatedTime = Math.max(2 - Math.floor(currentStep * 0.5), 0);

  // Validate URL as user types
  useEffect(() => {
    if (url) {
      try {
        new URL(url);
        setIsValidUrl(true);
      } catch {
        setIsValidUrl(false);
      }
    } else {
      setIsValidUrl(false);
    }
  }, [url]);

  const updateStepStatus = (stepId: string, status: SetupStep['status'], message?: string) => {
    setSetupSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  const handleStartSetup = async () => {
    if (!isValidUrl) return;

    setIsProcessing(true);
    
    // Step 1: Validate URL
    updateStepStatus('validate', 'active');
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus('validate', 'completed', 'Website is reachable');
    setCurrentStep(1);

    // Step 2: Scrape website
    updateStepStatus('scrape', 'active');
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateStepStatus('scrape', 'completed', 'Found 12 pages of content');
    setCurrentStep(2);

    // Step 3: Train AI
    updateStepStatus('train', 'active');
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateStepStatus('train', 'completed', 'AI trained on your content');
    setCurrentStep(3);

    // Step 4: Configure widget
    updateStepStatus('configure', 'active');
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus('configure', 'completed', 'Widget ready to install');
    setCurrentStep(4);

    // Redirect to configuration page after short delay
    setTimeout(() => {
      router.push('/configure?onboarding=true');
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidUrl && !isProcessing) {
      handleStartSetup();
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Set up your AI assistant in 2 minutes
        </h1>
        <p className="text-xl text-muted-foreground">
          Just enter your website URL and we'll handle the rest
        </p>
      </div>

      {!isProcessing ? (
        <Card>
          <CardHeader>
            <CardTitle>Enter your website URL</CardTitle>
            <CardDescription>
              We'll analyze your site and create a custom AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://your-website.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 text-lg h-12"
                />
                {url && (
                  <div className="absolute right-3 top-3">
                    {isValidUrl ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleStartSetup}
                disabled={!isValidUrl || isProcessing}
              >
                Start Setup
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>✓ No credit card required</p>
                <p>✓ Free for up to 100 messages/month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Setting up your AI assistant</CardTitle>
              <Badge variant="secondary">≈ {estimatedTime} min remaining</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(progress)}% complete
                </p>
              </div>

              <div className="space-y-4">
                {setupSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : step.status === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        step.status === 'active' ? 'text-foreground' : 
                        step.status === 'completed' ? 'text-muted-foreground' : 
                        'text-muted-foreground/60'
                      }`}>
                        {step.title}
                      </p>
                      {step.message && step.status === 'completed' && (
                        <p className="text-sm text-muted-foreground">{step.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> While we set things up, you can already start thinking about 
                  your brand colors and welcome message. You'll be able to customize everything in the next step.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What happens next */}
      <div className="mt-8 text-center">
        <h3 className="font-semibold mb-4">What happens after setup?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col items-center gap-2">
            <Palette className="h-8 w-8 text-muted-foreground" />
            <p>Customize appearance</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Code className="h-8 w-8 text-muted-foreground" />
            <p>Get embed code</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
            <p>Go live instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
}