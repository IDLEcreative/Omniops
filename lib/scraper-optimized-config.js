// Optimized scraper configuration to prevent database overload

module.exports = {
  // Reduce concurrent connections to prevent overwhelming the database
  maxConcurrency: 2, // Down from 5
  
  // Add delays between requests
  requestDelay: 1000, // 1 second between requests
  
  // Batch database operations
  batchSize: 10, // Insert/update in batches of 10
  batchDelay: 2000, // 2 seconds between batches
  
  // Connection pool settings
  database: {
    max: 5, // Maximum pool size
    min: 1, // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000, // 30 seconds
  },
  
  // Retry configuration with exponential backoff
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2, // Exponential backoff factor
  },
  
  // Memory management
  maxMemoryUsage: 0.8, // Pause if memory usage exceeds 80%
  gcInterval: 100, // Run garbage collection every 100 pages
  
  // Error handling
  skipOnError: true, // Skip failed pages instead of stopping
  saveProgress: true, // Save progress frequently to resume on failure
  
  // Performance monitoring
  logInterval: 60000, // Log stats every minute
  metricsEnabled: true,
};

// Helper function to batch database operations
async function batchInsert(supabase, table, records, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .upsert(batch, { 
          onConflict: 'url',
          ignoreDuplicates: true 
        })
        .select();
      
      if (error) {
        console.error(`Batch ${i / batchSize} failed:`, error);
        // Continue with next batch instead of failing entirely
      } else {
        results.push(...(data || []));
      }
      
      // Delay between batches to prevent overwhelming the database
      if (i + batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error(`Batch ${i / batchSize} error:`, err);
    }
  }
  
  return results;
}

// Connection pool with circuit breaker pattern
class DatabaseConnectionPool {
  constructor(config) {
    this.config = config;
    this.failures = 0;
    this.maxFailures = 5;
    this.cooldownPeriod = 60000; // 1 minute
    this.isOpen = true;
    this.lastFailure = null;
  }
  
  async execute(operation) {
    // Check if circuit breaker is open
    if (!this.isOpen) {
      const timeSinceLastFailure = Date.now() - this.lastFailure;
      if (timeSinceLastFailure < this.cooldownPeriod) {
        throw new Error('Circuit breaker is open - database unavailable');
      }
      // Try to close the circuit breaker
      this.isOpen = true;
      this.failures = 0;
    }
    
    try {
      const result = await operation();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      
      if (this.failures >= this.maxFailures) {
        this.isOpen = false;
        console.error('Circuit breaker opened - too many database failures');
      }
      
      throw error;
    }
  }
}

module.exports.batchInsert = batchInsert;
module.exports.DatabaseConnectionPool = DatabaseConnectionPool;