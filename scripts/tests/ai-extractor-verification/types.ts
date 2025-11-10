export interface QueryStats {
  totalCalls: number;
  queries: Array<{ selector: string; resultCount: number }>;
}
