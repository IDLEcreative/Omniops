import { UNWANTED_SELECTORS } from './selectors';

export function removeUnwantedElementsUnoptimized(document: Document): number {
  let removedCount = 0;

  UNWANTED_SELECTORS.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.remove();
        removedCount++;
      });
    } catch {
      // Ignore invalid selectors in test context
    }
  });

  const allElements = document.querySelectorAll('div, section, article, span');

  allElements.forEach(element => {
    const text = element.textContent?.trim() || '';
    const childCount = element.children.length;

    if (text.length < 50 && childCount > 5) {
      const linkCount = element.querySelectorAll('a').length;
      if (linkCount / childCount > 0.8) {
        element.remove();
        removedCount++;
      }
    }
  });

  return removedCount;
}
