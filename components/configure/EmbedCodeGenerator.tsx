/**
 * Embed code generation and framework selector
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, CheckCircle, Sparkles } from 'lucide-react';
import { generateEmbedCode, WidgetConfig } from '@/lib/configure/wizard-utils';

interface EmbedCodeGeneratorProps {
  config: WidgetConfig;
  customCSS?: string;
  isOnboarding?: boolean;
}

const FRAMEWORKS = [
  { value: 'html', label: 'HTML' },
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'shopify', label: 'Shopify' },
] as const;

export function EmbedCodeGenerator({ config, customCSS, isOnboarding }: EmbedCodeGeneratorProps) {
  const [selectedFramework, setSelectedFramework] = useState('html');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateEmbedCode(config, selectedFramework, customCSS));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed Code</CardTitle>
        <CardDescription>
          Choose your framework and copy the installation code
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Framework Selection */}
        <div className="mb-4">
          <Label className="mb-2 block">Select your framework:</Label>
          <RadioGroup value={selectedFramework} onValueChange={setSelectedFramework}>
            <div className="grid grid-cols-2 gap-2">
              {FRAMEWORKS.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={value} />
                  <Label htmlFor={value} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="relative">
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{generateEmbedCode(config, selectedFramework, customCSS)}</code>
          </pre>
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>

        {isOnboarding && (
          <Alert className="mt-4">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Almost done!</AlertTitle>
            <AlertDescription>
              Copy this code and add it to your website to go live.
              Need help? Check our <a href="/install" className="underline">installation guides</a>.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
