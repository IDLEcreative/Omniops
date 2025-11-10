export function vectorResults(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    productId: `vec-${i}`,
    score: 0.9 - i * 0.05,
    algorithm: 'vector_similarity',
  }));
}

export function collabResults(count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    productId: `collab-${i}`,
    score: 0.85 - i * 0.05,
    algorithm: 'collaborative',
  }));
}

export function contentResults(count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    productId: `content-${i}`,
    score: 0.8 - i * 0.05,
    algorithm: 'content_based',
  }));
}
