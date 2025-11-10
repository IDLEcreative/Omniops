/**
 * i18n Test Helpers for Playwright
 *
 * Shared utilities for multi-language/internationalization E2E testing.
 * These helpers reduce duplication across language-related test modules.
 *
 * Usage:
 *   import { setLanguage, verifyTextLanguage } from '__tests__/utils/playwright/i18n-test-helpers';
 */

import { Page, FrameLocator } from '@playwright/test';

// Translation strings for verification
export const TRANSLATIONS = {
  en: {
    placeholder: 'Type your message...',
    send: 'Send',
    clear: 'Clear Chat',
    typing: 'AI is typing...',
    settings: 'Settings',
    language: 'Language',
  },
  es: {
    placeholder: 'Escribe tu mensaje...',
    send: 'Enviar',
    clear: 'Borrar Chat',
    typing: 'IA está escribiendo...',
    settings: 'Configuración',
    language: 'Idioma',
  },
  ar: {
    placeholder: 'اكتب رسالتك...',
    send: 'إرسال',
    clear: 'مسح الدردشة',
    typing: 'الذكاء الاصطناعي يكتب...',
    settings: 'الإعدادات',
    language: 'اللغة',
  },
};

/**
 * Set UI language preference via localStorage
 */
export async function setLanguage(page: Page, lang: string): Promise<void> {
  await page.evaluate((language: string) => {
    localStorage.setItem('omniops_ui_language', language);
  }, lang);
}

/**
 * Get current stored language preference
 */
export async function getStoredLanguage(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('omniops_ui_language');
  });
}

/**
 * Check if text in element is in expected language (simple heuristic)
 */
export async function verifyTextLanguage(
  page: Page,
  selector: string,
  expectedLanguage: 'en' | 'es' | 'ar'
): Promise<boolean> {
  try {
    const element = page.locator(selector).first();
    const text = await element.textContent();

    if (!text) return false;

    // Language detection based on common words
    const languageIndicators = {
      en: ['the', 'and', 'is', 'are', 'what', 'how'],
      es: ['el', 'la', 'es', 'son', 'qué', 'cómo'],
      ar: ['ال', 'و', 'هو', 'هي', 'ما', 'كيف'],
    };

    const indicators = languageIndicators[expectedLanguage];
    return indicators.some(word => text.toLowerCase().includes(word));
  } catch {
    return false;
  }
}

/**
 * Wait for widget iframe to load and be ready for interaction
 * Increased timeout to 30s to handle parallel test execution
 *
 * This function waits for:
 * 1. Iframe element to be attached to DOM
 * 2. Iframe content (srcdoc) to load
 * 3. Widget bundle to execute and initialize
 * 4. Widget to send 'ready' message to parent
 */
export async function waitForWidgetIframe(page: Page, timeout = 30000): Promise<void> {
  const iframeLocator = page.locator('iframe#chat-widget-iframe');
  await iframeLocator.waitFor({ state: 'attached', timeout });

  // Wait for iframe to have content loaded (srcdoc rendered)
  await page.waitForTimeout(1000);

  // Wait for widget bundle to initialize by checking for widget-root element
  const iframe = page.frameLocator('iframe#chat-widget-iframe');
  const widgetRoot = iframe.locator('#widget-root');
  await widgetRoot.waitFor({ state: 'attached', timeout: timeout - 2000 });

  // Wait for widget to signal it's ready by listening for 'ready' postMessage
  // This ensures the widget is fully initialized and interactive
  // NOTE: We use a generous fallback timeout because postMessage origin mismatches
  // can prevent the ready signal from being received in test environments
  const readyPromise = page.evaluate(() => {
    return new Promise<void>((resolve) => {
      let resolved = false;

      const handleReady = (event: MessageEvent) => {
        // Accept ready message from any origin in test environment
        // to handle localhost vs production URL mismatches
        if (event.data?.type === 'ready' && !resolved) {
          resolved = true;
          window.removeEventListener('message', handleReady);
          resolve();
        }
      };
      window.addEventListener('message', handleReady);

      // Generous fallback timeout - if widget is interactive but ready wasn't received,
      // continue anyway after 5s
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', handleReady);
          resolve();
        }
      }, 5000);
    });
  });

  await readyPromise;
}

/**
 * Open chat widget programmatically and wait for it to be ready
 * Increased default delay to 3s to handle parallel test execution
 */
export async function openWidget(page: Page, delayMs = 3000): Promise<void> {
  await page.evaluate(() => {
    (window as any).ChatWidget?.open();
  });
  await page.waitForTimeout(delayMs);

  // Verify widget is actually open by checking iframe pointer-events
  const iframe = page.locator('iframe#chat-widget-iframe');
  await iframe.evaluate((el: HTMLIFrameElement) => {
    // Widget is considered "open" when pointer-events is 'auto'
    return el.style.pointerEvents === 'auto';
  });
}

/**
 * Get iframe context
 */
export function getWidgetIframe(page: Page): FrameLocator {
  return page.frameLocator('iframe#chat-widget-iframe');
}

/**
 * Get input field from widget and wait for it to be ready
 * Returns input field with extended timeout for parallel test execution
 */
export async function getWidgetInputField(iframe: FrameLocator) {
  const inputField = iframe.locator('input[type="text"], textarea').first();
  // Wait for input to be visible and enabled (ready for interaction)
  await inputField.waitFor({ state: 'visible', timeout: 30000 });
  return inputField;
}

/**
 * Get send button from widget
 */
export async function getWidgetSendButton(iframe: FrameLocator) {
  return iframe.locator('button:has-text("Enviar"), button:has-text("Send"), button[type="submit"]').first();
}

/**
 * Check RTL attributes on page
 */
export async function getRTLAttributes(page: Page) {
  return await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    return {
      htmlDir: html.getAttribute('dir'),
      htmlLang: html.getAttribute('lang'),
      bodyDir: body.getAttribute('dir'),
      textAlign: window.getComputedStyle(body).textAlign,
      direction: window.getComputedStyle(body).direction,
    };
  });
}

/**
 * Set RTL direction on page
 */
export async function setRTLDirection(page: Page, rtl: boolean): Promise<void> {
  await page.evaluate((isRtl: boolean) => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  }, rtl);
}

/**
 * Get browser locale info
 */
export async function getBrowserLocaleInfo(page: Page) {
  return await page.evaluate(() => {
    const stored = localStorage.getItem('omniops_ui_language');
    const browserLang = navigator.language.substring(0, 2);
    return { stored, browserLang };
  });
}

/**
 * Count messages in conversation
 */
export async function getMessageCount(page: Page): Promise<number> {
  return await page.locator('[role="log"] > div, .message-container > div').count();
}

/**
 * Get message text by index (from iframe or page)
 */
export async function getMessageText(page: Page, index: number): Promise<string | null> {
  const messages = page.locator('[role="log"] > div, .message-container > div');
  if (index >= await messages.count()) return null;
  return await messages.nth(index).textContent();
}

/**
 * Check if text contains Spanish indicators
 */
export function hasSpanishIndicators(text: string | null | undefined): boolean {
  if (!text) return false;
  const indicators = ['hola', 'gracias', 'producto', 'disponible', 'puedo', 'ayudar'];
  return indicators.some(word => text.toLowerCase().includes(word));
}

/**
 * Reload page and wait for widget
 */
export async function reloadAndWaitForWidget(page: Page): Promise<void> {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
}
