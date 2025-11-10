/**
 * Local Storage Operations
 *
 * Safe wrappers for localStorage and sessionStorage operations.
 */

export class LocalStorageOperations {
  /**
   * Get item from localStorage
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[LocalStorageOperations] localStorage.getItem failed:', error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   */
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[LocalStorageOperations] localStorage.setItem failed:', error);
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[LocalStorageOperations] localStorage.removeItem failed:', error);
    }
  }
}

export class FallbackStorageOperations {
  /**
   * Get item from sessionStorage (fallback)
   */
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('[FallbackStorageOperations] sessionStorage.getItem failed:', error);
      return null;
    }
  }

  /**
   * Set item in sessionStorage (fallback)
   */
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('[FallbackStorageOperations] sessionStorage.setItem failed:', error);
    }
  }

  /**
   * Remove item from sessionStorage (fallback)
   */
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('[FallbackStorageOperations] sessionStorage.removeItem failed:', error);
    }
  }
}
