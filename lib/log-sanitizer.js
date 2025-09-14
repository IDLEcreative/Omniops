/**
 * Log Sanitizer - Prevents XSS in log outputs
 * Sanitizes potentially malicious content before logging
 */

/**
 * Sanitize a string value for safe logging
 * Removes/escapes potentially dangerous characters
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  
  // Remove null bytes
  let sanitized = value.replace(/\0/g, '');
  
  // Escape HTML entities to prevent XSS if logs are displayed in web UI
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Truncate extremely long strings
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '...[truncated]';
  }
  
  return sanitized;
}

/**
 * Recursively sanitize an object for logging
 */
function sanitizeObject(obj, depth = 0) {
  if (depth > 5) return '[Max depth exceeded]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key as well
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
    }
    return sanitized;
  }
  
  return String(obj);
}

/**
 * Main sanitization function for log data
 */
function sanitizeForLogging(data) {
  try {
    return sanitizeObject(data);
  } catch (error) {
    // If sanitization fails, return a safe error message
    return { error: 'Failed to sanitize data for logging' };
  }
}

module.exports = {
  sanitizeForLogging,
  sanitizeString,
  sanitizeObject
};