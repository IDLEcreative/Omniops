import { UNWANTED_SELECTORS } from './selectors';

export function removeUnwantedElementsOptimized(document: Document): number {
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
  const allLinks = document.querySelectorAll('a');

  const linkCountMap = new Map<Element, number>();
  allLinks.forEach(link => {
    let parent = link.parentElement;
    while (parent) {
      linkCountMap.set(parent, (linkCountMap.get(parent) || 0) + 1);
      parent = parent.parentElement;
    }
  });

  allElements.forEach(element => {
    const text = element.textContent?.trim() || '';
    const childCount = element.children.length;

    if (text.length < 50 && childCount > 5) {
      const linkCount = linkCountMap.get(element) || 0;
      if (linkCount / childCount > 0.8) {
        element.remove();
        removedCount++;
      }
    }
  });

  return removedCount;
}
