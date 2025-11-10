import { performance } from 'perf_hooks';
import type { GraphNode, GraphMetrics } from './types';

export class VectorGraphSimulator {
  private nodes: Map<string, GraphNode> = new Map();

  async buildGraph(embeddings: number[][], threshold = 0.7): Promise<number> {
    const startTime = performance.now();

    embeddings.forEach((embedding, index) => {
      this.nodes.set(`node_${index}`, {
        id: `node_${index}`,
        embedding,
        metadata: {},
        edges: new Map()
      });
    });

    const nodeArray = Array.from(this.nodes.values());
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const similarity = this.cosineSimilarity(nodeArray[i].embedding, nodeArray[j].embedding);
        if (similarity > threshold) {
          nodeArray[i].edges.set(nodeArray[j].id, similarity);
          nodeArray[j].edges.set(nodeArray[i].id, similarity);
        }
      }
    }

    return performance.now() - startTime;
  }

  async traverseGraph(startNode: string, hops = 2): Promise<number> {
    const startTime = performance.now();
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: startNode, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id) || current.depth > hops) continue;
      visited.add(current.id);

      const node = this.nodes.get(current.id);
      if (!node) continue;

      for (const neighborId of node.edges.keys()) {
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, depth: current.depth + 1 });
        }
      }
    }

    return performance.now() - startTime;
  }

  getMetrics(): GraphMetrics {
    let totalEdges = 0;
    this.nodes.forEach(node => {
      totalEdges += node.edges.size;
    });

    const nodeSize = 1536 * 4 + 100;
    const edgeSize = 16;
    const memoryUsage = this.nodes.size * nodeSize + totalEdges * edgeSize;

    return {
      nodes: this.nodes.size,
      edges: totalEdges / 2,
      avgDegree: totalEdges / this.nodes.size,
      memoryUsage,
      queryTime: 0,
      buildTime: 0
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
