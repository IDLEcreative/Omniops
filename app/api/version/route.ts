import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    lastUpdated: '2024-01-23',
    features: {
      woocommerce: true,
      shopify: false,
      customApis: false,
      multiLanguage: false,
    },
    minimumEmbedVersion: '1.0.0',
  });
}