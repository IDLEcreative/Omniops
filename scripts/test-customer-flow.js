#!/usr/bin/env node

/**
 * Customer Onboarding Flow Test Script
 * 
 * Simulates a complete customer adding their website and demonstrates
 * the automatic scraping integration working seamlessly.
 */

import https from 'node:https';
import http from 'node:http';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const TEST_DOMAINS = [
  'example.com',
  'google.com',
  'github.com',
  'invalid-domain-test.xyz'
]

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'blue')
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green')
}

function logError(message) {
  log(`✗ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow')
}

// HTTP client helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https')
    const client = isHttps ? https : http

    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Customer-Flow-Test/1.0',
        ...options.headers
      }
    }

    const req = client.request(url, requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          }
          resolve(result)
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          })
        }
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

// Test functions
async function testDomainValidation(domain) {
  logStep('VALIDATION', `Testing domain validation for: ${domain}`)
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/customer/config/validate?domain=${domain}`)
    
    if (response.statusCode === 200) {
      const data = response.data
      if (data.valid) {
        logSuccess(`Domain ${domain} is valid`)
        log(`  Normalized: ${data.domain}`, 'dim')
        log(`  Accessible: ${data.accessible ? 'Yes' : 'No'}`, 'dim')
        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach(warning => logWarning(`  ${warning}`))
        }
      } else {
        logError(`Domain ${domain} is invalid: ${data.error}`)
      }
      return data
    } else {
      logError(`Validation failed with status ${response.statusCode}`)
      return null
    }
  } catch (error) {
    logError(`Validation request failed: ${error.message}`)
    return null
  }
}

async function createCustomerConfig(domain, customerId = null) {
  logStep('CONFIG', `Creating customer configuration for: ${domain}`)
  
  try {
    const configData = {
      domain: domain,
      customerId: customerId,
      settings: {
        autoScrape: true,
        scrapingFrequency: 'weekly',
        priority: 'high',
        maxPages: 25,
        includeSubdomains: false
      },
      metadata: {
        testRun: true,
        testTimestamp: new Date().toISOString()
      }
    }

    const response = await makeRequest(`${API_BASE_URL}/api/customer/config`, {
      method: 'POST',
      body: configData
    })

    if (response.statusCode === 201) {
      const data = response.data
      logSuccess(`Configuration created with ID: ${data.config.id}`)
      
      if (data.scraping && data.scraping.success) {
        logSuccess(`Automatic scraping triggered - Job ID: ${data.scraping.jobId}`)
        if (data.scraping.queueJobId) {
          log(`  Queue Job ID: ${data.scraping.queueJobId}`, 'dim')
        }
        if (data.scraping.warnings && data.scraping.warnings.length > 0) {
          data.scraping.warnings.forEach(warning => logWarning(`  ${warning}`))
        }
      } else if (data.scraping && !data.scraping.success) {
        logError(`Scraping failed to start: ${data.scraping.error}`)
      }

      return data.config
    } else if (response.statusCode === 409) {
      logWarning(`Domain already configured: ${response.data.existingConfigId}`)
      return response.data
    } else {
      logError(`Configuration creation failed with status ${response.statusCode}`)
      log(`  Error: ${response.data?.error || 'Unknown error'}`, 'dim')
      return null
    }
  } catch (error) {
    logError(`Configuration request failed: ${error.message}`)
    return null
  }
}

async function checkScrapeJobStatus(configId) {
  logStep('STATUS', `Checking scrape job status for config: ${configId}`)
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/scrape-jobs?customer_config_id=${configId}`)
    
    if (response.statusCode === 200) {
      const jobs = response.data.data || []
      
      if (jobs.length === 0) {
        logWarning('No scrape jobs found')
        return []
      }

      logSuccess(`Found ${jobs.length} scrape job(s)`)
      
      jobs.forEach((job, index) => {
        log(`  Job ${index + 1}:`, 'dim')
        log(`    ID: ${job.id}`, 'dim')
        log(`    Status: ${job.status}`, job.status === 'completed' ? 'green' : job.status === 'running' ? 'yellow' : 'dim')
        log(`    Domain: ${job.domain}`, 'dim')
        log(`    Type: ${job.job_type}`, 'dim')
        log(`    Created: ${new Date(job.created_at).toLocaleString()}`, 'dim')
        if (job.completed_at) {
          log(`    Completed: ${new Date(job.completed_at).toLocaleString()}`, 'dim')
        }
        if (job.error_message) {
          logError(`    Error: ${job.error_message}`)
        }
      })

      return jobs
    } else {
      logError(`Failed to fetch jobs with status ${response.statusCode}`)
      return []
    }
  } catch (error) {
    logError(`Job status request failed: ${error.message}`)
    return []
  }
}

async function monitorScrapeProgress(configId, maxWaitTime = 60000) {
  logStep('MONITOR', `Monitoring scrape progress (max ${maxWaitTime/1000}s)`)
  
  const startTime = Date.now()
  let lastStatus = null
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const jobs = await checkScrapeJobStatus(configId)
      const activeJob = jobs.find(job => ['pending', 'running'].includes(job.status))
      
      if (!activeJob) {
        const completedJob = jobs.find(job => job.status === 'completed')
        if (completedJob) {
          logSuccess('Scraping completed successfully!')
          return completedJob
        }
        
        const failedJob = jobs.find(job => job.status === 'failed')
        if (failedJob) {
          logError('Scraping failed')
          return failedJob
        }
        
        logWarning('No active or completed jobs found')
        return null
      }

      if (activeJob.status !== lastStatus) {
        log(`  Status: ${activeJob.status}`, activeJob.status === 'running' ? 'yellow' : 'dim')
        lastStatus = activeJob.status
      } else {
        process.stdout.write('.')
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      logError(`Monitoring error: ${error.message}`)
      break
    }
  }
  
  console.log() // New line after dots
  logWarning('Monitoring timeout reached')
  return null
}

async function getConfigurationStatus(configId) {
  logStep('INTEGRATION', `Getting integration status for config: ${configId}`)
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/customer/config?id=${configId}`)
    
    if (response.statusCode === 200) {
      const configs = response.data.data || []
      const config = configs[0]
      
      if (!config) {
        logError('Configuration not found')
        return null
      }

      logSuccess('Integration status retrieved')
      log(`  Config ID: ${config.id}`, 'dim')
      log(`  Domain: ${config.domain}`, 'dim')
      log(`  Auto Scrape: ${config.settings.autoScrape ? 'Enabled' : 'Disabled'}`, 'dim')
      
      const status = config.scrapingStatus
      if (status) {
        log(`  Total Jobs: ${status.totalJobs}`, 'dim')
        log(`  Successful: ${status.successfulJobs}`, 'dim')
        log(`  Failed: ${status.failedJobs}`, 'dim')
        log(`  Has Active Jobs: ${status.hasActiveJobs ? 'Yes' : 'No'}`, 'dim')
        if (status.lastJobDate) {
          log(`  Last Job: ${new Date(status.lastJobDate).toLocaleString()}`, 'dim')
        }
      }

      return config
    } else {
      logError(`Failed to get configuration status with status ${response.statusCode}`)
      return null
    }
  } catch (error) {
    logError(`Status request failed: ${error.message}`)
    return null
  }
}

// Main test flow
async function runCustomerFlow(domain) {
  logSection(`CUSTOMER ONBOARDING FLOW TEST: ${domain}`)
  
  try {
    // Step 1: Validate domain
    const validation = await testDomainValidation(domain)
    if (!validation || !validation.valid) {
      logError('Skipping domain due to validation failure')
      return false
    }

    // Step 2: Create customer configuration (simulates customer adding their website)
    const customerId = `test-customer-${Date.now()}`
    const config = await createCustomerConfig(domain, customerId)
    if (!config || !config.id) {
      logError('Skipping domain due to configuration failure')
      return false
    }

    // Step 3: Monitor scraping progress
    const result = await monitorScrapeProgress(config.id, 30000) // 30 second timeout
    
    // Step 4: Check final integration status
    await getConfigurationStatus(config.id)

    if (result && result.status === 'completed') {
      logSuccess(`Customer flow completed successfully for ${domain}`)
      return true
    } else {
      logWarning(`Customer flow completed with issues for ${domain}`)
      return false
    }

  } catch (error) {
    logError(`Customer flow failed for ${domain}: ${error.message}`)
    return false
  }
}

// Test queue system health
async function testQueueHealth() {
  logSection('QUEUE SYSTEM HEALTH CHECK')
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/queue`)
    
    if (response.statusCode === 200) {
      const health = response.data
      logSuccess('Queue system is accessible')
      
      if (health.queue && health.queue.isHealthy) {
        logSuccess('Queue is healthy')
      } else {
        logWarning('Queue may have issues')
      }
      
      if (health.stats) {
        log(`  Active jobs: ${health.stats.active || 0}`, 'dim')
        log(`  Waiting jobs: ${health.stats.waiting || 0}`, 'dim')
        log(`  Completed jobs: ${health.stats.completed || 0}`, 'dim')
      }
      
      return true
    } else {
      logError(`Queue health check failed with status ${response.statusCode}`)
      return false
    }
  } catch (error) {
    logError(`Queue health check failed: ${error.message}`)
    return false
  }
}

// Main execution
async function main() {
  console.clear()
  log('Customer Service Agent - Customer Onboarding Flow Test', 'bright')
  log('Testing automatic scraping integration', 'dim')
  console.log()

  // Check if server is running
  logSection('SYSTEM HEALTH CHECK')
  
  let retryCount = 0
  const maxRetries = 3
  
  while (retryCount < maxRetries) {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/customer/config`)
      if (response.statusCode < 400) {
        logSuccess('API server is accessible')
        break
      } else if (retryCount === maxRetries - 1) {
        logError(`API server returned status ${response.statusCode}`)
        logError('Please ensure the development server is running with: npm run dev')
        process.exit(1)
      }
    } catch (error) {
      if (retryCount === maxRetries - 1) {
        logError(`Cannot connect to API server at ${API_BASE_URL}`)
        logError('Please ensure the development server is running with: npm run dev')
        logError(`Error: ${error.message}`)
        process.exit(1)
      }
    }
    
    retryCount++
    if (retryCount < maxRetries) {
      logWarning(`Connection attempt ${retryCount} failed, retrying in 2 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Test queue system (skip for now since queue system is not fully set up)
  logWarning('Skipping queue health check - queue system not fully configured')

  // Run customer flow tests
  const results = []
  
  for (const domain of TEST_DOMAINS) {
    const success = await runCustomerFlow(domain)
    results.push({ domain, success })
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  logSection('TEST SUMMARY')
  
  const successful = results.filter(r => r.success).length
  const total = results.length
  
  log(`Total domains tested: ${total}`)
  log(`Successful flows: ${successful}`, successful === total ? 'green' : 'yellow')
  log(`Failed flows: ${total - successful}`, total - successful === 0 ? 'green' : 'red')
  
  results.forEach(result => {
    const status = result.success ? '✓' : '✗'
    const color = result.success ? 'green' : 'red'
    log(`  ${status} ${result.domain}`, color)
  })

  if (successful === total) {
    console.log()
    logSuccess('🎉 All customer onboarding flows completed successfully!')
    logSuccess('The integration between customer configuration and automatic scraping is working perfectly.')
  } else {
    console.log()
    logWarning('⚠ Some flows had issues. Check the logs above for details.')
  }

  console.log()
  log('Test completed. Check your database and queue system for the created jobs.', 'dim')
}

// Handle process termination
process.on('SIGINT', () => {
  console.log()
  logWarning('Test interrupted by user')
  process.exit(0)
})

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`)
  process.exit(1)
})

// Run the test
if (require.main === module) {
  main().catch(error => {
    logError(`Test execution failed: ${error.message}`)
    process.exit(1)
  })
}

export { runCustomerFlow, testDomainValidation, createCustomerConfig, checkScrapeJobStatus, monitorScrapeProgress };