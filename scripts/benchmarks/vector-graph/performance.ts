import { VectorGraphSimulator } from './simulator';

export async function simulateGraphPerformance() {
  console.log('=== VECTOR GRAPH PERFORMANCE SIMULATION ===\n');

  const scales = [
    { name: 'Small', embeddings: 100, dims: 1536 },
    { name: 'Medium', embeddings: 1000, dims: 1536 },
    { name: 'Large', embeddings: 10000, dims: 1536 },
    { name: 'Enterprise', embeddings: 100000, dims: 1536 }
  ];

  for (const scale of scales) {
    console.log(`\n${scale.name} Scale (${scale.embeddings} embeddings):`);
    console.log('----------------------------------------');

    const embeddings = Array.from({ length: scale.embeddings }, () =>
      Array.from({ length: scale.dims }, () => Math.random())
    );

    const graph = new VectorGraphSimulator();
    const buildTime = await graph.buildGraph(embeddings, 0.8);
    console.log(`  Graph build time: ${buildTime.toFixed(2)}ms`);

    const traversalTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      traversalTimes.push(await graph.traverseGraph('node_0', 2));
    }
    const avgTraversal = traversalTimes.reduce((a, b) => a + b, 0) / traversalTimes.length;
    console.log(`  Avg traversal time (2 hops): ${avgTraversal.toFixed(2)}ms`);

    const metrics = graph.getMetrics();
    console.log(`  Nodes: ${metrics.nodes}`);
    console.log(`  Edges: ${metrics.edges}`);
    console.log(`  Avg degree: ${metrics.avgDegree.toFixed(2)}`);
    console.log(`  Memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);

    const currentQueryTime = 15;
    const overhead = ((avgTraversal / currentQueryTime) - 1) * 100;
    console.log(`  Query overhead vs current: ${overhead > 0 ? '+' : ''}${overhead.toFixed(1)}%`);
  }
}
