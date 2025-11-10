import type { JSDOM } from 'jsdom';
import type { QueryStats } from './types';

export function instrumentQuerySelectorAll(dom: JSDOM): QueryStats {
  const stats: QueryStats = {
    totalCalls: 0,
    queries: []
  };

  const originalQuerySelectorAll = dom.window.document.querySelectorAll.bind(dom.window.document);

  dom.window.document.querySelectorAll = function(selector: string) {
    stats.totalCalls++;
    const result = originalQuerySelectorAll(selector);
    stats.queries.push({
      selector,
      resultCount: result.length
    });
    return result;
  } as typeof dom.window.document.querySelectorAll;

  return stats;
}
