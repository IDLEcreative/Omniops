/**
 * Domain Validation API Endpoint
 * 
 * GET /api/customer/config/validate?domain=example.com
 * 
 * Validates domain accessibility and checks if it's already configured
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { domainValidator } from '@/lib/utils/domain-validator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' }, 
        { status: 400 }
      )
    }

    logger.info('Domain validation request', { domain })

    // Validate domain format
    const validation = domainValidator.validateUrl(domain)
    
    if (!validation.isValid) {
      return NextResponse.json({
        valid: false,
        error: validation.error,
        warnings: validation.warnings
      }, { status: 200 })
    }

    // Check domain status and accessibility
    const [domainStatus, accessibility] = await Promise.all([
      domainValidator.checkDomainStatus(validation.domain!),
      domainValidator.checkDomainAccessibility(validation.domain!, 10000)
    ])

    const result = {
      valid: true,
      domain: validation.domain,
      normalizedUrl: validation.normalizedUrl,
      warnings: validation.warnings,
      exists: domainStatus.exists,
      isBeingScrapped: domainStatus.isBeingScrapped,
      accessible: accessibility.accessible,
      statusCode: accessibility.statusCode,
      responseTime: accessibility.responseTime,
      existingConfigId: domainStatus.customerConfigId,
      lastScrapeJob: domainStatus.lastScrapeJob
    }

    logger.info('Domain validation completed', { 
      domain: validation.domain, 
      valid: true,
      accessible: accessibility.accessible,
      exists: domainStatus.exists 
    })

    return NextResponse.json(result)

  } catch (error) {
    logger.error('Domain validation error', { error: error instanceof Error ? error.message : error })
    return NextResponse.json(
      { error: 'Validation failed' }, 
      { status: 500 }
    )
  }
}