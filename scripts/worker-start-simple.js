#!/usr/bin/env node
console.log("Worker starting...");
console.log("Worker type:", process.env.WORKER_TYPE || "scraping");

// Keep the process alive
setInterval(() => {
  console.log("Worker heartbeat:", new Date().toISOString());
}, 30000);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Worker shutting down...");
  process.exit(0);
});
