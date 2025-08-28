#!/usr/bin/env node
console.log("Worker starting...");
console.log("Worker type:", process.env.WORKER_TYPE || "scraping");
console.log("Redis URL:", process.env.REDIS_URL || "redis://localhost:6379");

// Keep the process alive
setInterval(() => {
  console.log(`[${new Date().toISOString()}] Worker heartbeat - Type: ${process.env.WORKER_TYPE || "scraping"}`);
}, 30000);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Worker shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Worker interrupted, shutting down...");
  process.exit(0);
});

console.log("Worker initialized and running");
