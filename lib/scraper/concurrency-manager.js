/**
 * ConcurrencyManager - Manages progressive concurrency scaling for web scraping
 *
 * Dynamically adjusts the number of concurrent workers (2-15) based on:
 * - Memory usage (stays under 1500MB threshold)
 * - Success rate (maintains >90% for increases, >70% minimum)
 * - Time-based throttling (30s between increases)
 *
 * Usage:
 *   const manager = new ConcurrencyManager(5, 15);
 *   manager.recordSuccess(); // After successful operation
 *   manager.recordError();   // After failed operation
 *   const workers = manager.getCurrent(); // Get current concurrency level
 */
export class ConcurrencyManager {
  /**
   * Creates a new ConcurrencyManager instance
   * @param {number} initialConcurrency - Starting number of concurrent workers (default: 5)
   * @param {number} maxConcurrency - Maximum allowed concurrent workers (default: 15)
   */
  constructor(initialConcurrency = 5, maxConcurrency = 15) {
    this.current = initialConcurrency;
    this.max = maxConcurrency;
    this.min = 2;
    this.successCount = 0;
    this.errorCount = 0;
    this.lastAdjustment = Date.now();
    this.memoryThreshold = 1500; // MB
  }

  /**
   * Checks if concurrency should be increased
   * @returns {boolean} True if conditions allow for increase
   */
  shouldIncrease() {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const timeSinceLastAdjustment = Date.now() - this.lastAdjustment;

    // Increase if: memory is OK, good success rate, and enough time has passed
    return memoryMB < this.memoryThreshold &&
           this.current < this.max &&
           this.getSuccessRate() > 0.9 &&
           timeSinceLastAdjustment > 30000; // 30 seconds
  }

  /**
   * Checks if concurrency should be decreased
   * @returns {boolean} True if conditions require decrease
   */
  shouldDecrease() {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    // Decrease if: memory is high or error rate is high
    return (memoryMB > this.memoryThreshold || this.getSuccessRate() < 0.7) &&
           this.current > this.min;
  }

  /**
   * Calculates current success rate
   * @returns {number} Success rate between 0 and 1
   */
  getSuccessRate() {
    const total = this.successCount + this.errorCount;
    return total > 0 ? this.successCount / total : 1;
  }

  /**
   * Adjusts concurrency level based on current conditions
   * @returns {number} New concurrency level
   */
  adjust() {
    if (this.shouldIncrease()) {
      this.current = Math.min(this.current + 1, this.max);
      this.lastAdjustment = Date.now();
      console.log(`[ConcurrencyManager] Increased concurrency to ${this.current}`);
      return this.current;
    } else if (this.shouldDecrease()) {
      this.current = Math.max(this.current - 1, this.min);
      this.lastAdjustment = Date.now();
      console.log(`[ConcurrencyManager] Decreased concurrency to ${this.current}`);
      return this.current;
    }
    return this.current;
  }

  /**
   * Records a successful operation and checks for adjustment
   */
  recordSuccess() {
    this.successCount++;
    // Periodically check for adjustment
    if ((this.successCount + this.errorCount) % 10 === 0) {
      this.adjust();
    }
  }

  /**
   * Records a failed operation and immediately checks for adjustment
   */
  recordError() {
    this.errorCount++;
    // Check for adjustment on errors
    this.adjust();
  }

  /**
   * Gets the current concurrency level
   * @returns {number} Current number of concurrent workers
   */
  getCurrent() {
    return this.current;
  }
}
