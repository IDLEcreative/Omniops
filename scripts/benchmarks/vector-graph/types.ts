export interface GraphNode {
  id: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  edges: Map<string, number>;
}

export interface GraphMetrics {
  nodes: number;
  edges: number;
  avgDegree: number;
  memoryUsage: number;
  queryTime: number;
  buildTime: number;
}
