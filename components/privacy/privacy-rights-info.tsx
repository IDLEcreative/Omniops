'use client';

import {
  Shield,
  Eye,
  Edit,
  UserX,
  Download,
  Ban,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface GDPRArticle {
  article: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText?: string;
  implemented: boolean;
}

const GDPR_ARTICLES: GDPRArticle[] = [
  {
    article: 'Article 15',
    title: 'Right of Access',
    description: 'You have the right to obtain confirmation as to whether or not personal data concerning you is being processed, and access to that personal data.',
    icon: <Eye className="h-5 w-5 text-blue-600" />,
    actionText: 'Request a copy of your data',
    implemented: true
  },
  {
    article: 'Article 16',
    title: 'Right to Rectification',
    description: 'You have the right to obtain rectification of inaccurate personal data concerning you and to have incomplete personal data completed.',
    icon: <Edit className="h-5 w-5 text-green-600" />,
    actionText: 'Update your information',
    implemented: true
  },
  {
    article: 'Article 17',
    title: 'Right to Erasure ("Right to be Forgotten")',
    description: 'You have the right to obtain the erasure of personal data concerning you when it is no longer necessary or if processing is unlawful.',
    icon: <UserX className="h-5 w-5 text-red-600" />,
    actionText: 'Delete your account',
    implemented: true
  },
  {
    article: 'Article 18',
    title: 'Right to Restriction of Processing',
    description: 'You have the right to obtain restriction of processing when you contest the accuracy of data or when processing is unlawful.',
    icon: <Ban className="h-5 w-5 text-orange-600" />,
    actionText: 'Restrict processing',
    implemented: true
  },
  {
    article: 'Article 19',
    title: 'Notification Obligation',
    description: 'We will communicate any rectification, erasure, or restriction of processing to each recipient to whom your data has been disclosed.',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    actionText: null,
    implemented: true
  },
  {
    article: 'Article 20',
    title: 'Right to Data Portability',
    description: 'You have the right to receive your personal data in a structured, commonly used and machine-readable format.',
    icon: <Download className="h-5 w-5 text-purple-600" />,
    actionText: 'Export your data',
    implemented: true
  },
  {
    article: 'Article 21',
    title: 'Right to Object',
    description: 'You have the right to object to processing of personal data for direct marketing or based on legitimate interests.',
    icon: <Shield className="h-5 w-5 text-indigo-600" />,
    actionText: 'Manage preferences',
    implemented: true
  },
  {
    article: 'Article 22',
    title: 'Automated Decision-Making',
    description: 'You have the right not to be subject to decisions based solely on automated processing, including profiling.',
    icon: <CheckCircle className="h-5 w-5 text-teal-600" />,
    actionText: 'Review automated decisions',
    implemented: true
  }
];

interface PrivacyRightsInfoProps {
  showActions?: boolean;
  onActionClick?: (article: string) => void;
}

export function PrivacyRightsInfo({
  showActions = false,
  onActionClick
}: PrivacyRightsInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Privacy Rights Under GDPR</h2>
        <p className="text-muted-foreground">
          The General Data Protection Regulation (GDPR) grants you specific rights regarding your personal data.
          We are committed to respecting and facilitating these rights.
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          All GDPR rights (Articles 15-22) are fully implemented and available through our privacy dashboard.
          You can exercise any of these rights at any time.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {GDPR_ARTICLES.map((article) => (
          <Card key={article.article} className="relative overflow-hidden">
            {article.implemented && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 text-xs"
              >
                Implemented
              </Badge>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <div className="mt-1">{article.icon}</div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{article.article}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {article.description}
              </CardDescription>
              {showActions && article.actionText && (
                <button
                  onClick={() => onActionClick?.(article.article)}
                  className="mt-3 text-sm text-primary hover:underline font-medium"
                >
                  {article.actionText} →
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How to Exercise Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            To exercise any of your privacy rights, you can:
          </p>
          <ul className="space-y-2 text-sm list-disc list-inside">
            <li>Use the privacy dashboard to manage your data directly</li>
            <li>Contact our Data Protection Officer at privacy@example.com</li>
            <li>Submit a formal request through our privacy portal</li>
            <li>Call our privacy hotline at 1-800-PRIVACY</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            We will respond to your request within 30 days as required by GDPR.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}