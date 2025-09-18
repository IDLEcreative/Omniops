#!/usr/bin/env npx tsx

/**
 * Quick Docker Performance Profiling Script
 * Faster version with reduced wait times
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function profileDocker() {
  console.log(`${colors.bright}${colors.cyan}🚀 Docker Performance Quick Profile${colors.reset}\n`);
  
  const results: any = {};
  
  // 1. Get current image sizes
  console.log(`${colors.bright}${colors.blue}📏 Current Image Sizes${colors.reset}`);
  try {
    const { stdout: images } = await execAsync('docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}" | head -10');
    console.log(images);
    
    // Get specific sizes
    const { stdout: appSize } = await execAsync('docker images --format "{{.Size}}" omniops-app 2>/dev/null || echo "Not built"');
    results.appImageSize = appSize.trim();
    
    // Count layers
    try {
      const { stdout: layers } = await execAsync('docker history omniops-app --format "{{.Size}}" 2>/dev/null | wc -l');
      results.layerCount = parseInt(layers.trim());
    } catch {
      results.layerCount = 0;
    }
  } catch (error) {
    console.log('Images not built yet');
  }
  
  // 2. Check if containers are running and get stats
  console.log(`\n${colors.bright}${colors.blue}📊 Container Runtime Stats${colors.reset}`);
  try {
    const { stdout: psOutput } = await execAsync('docker-compose ps');
    console.log('Container status:');
    console.log(psOutput);
    
    // Get detailed stats
    const { stdout: stats } = await execAsync('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}\\t{{.BlockIO}}"');
    console.log('\nResource usage:');
    console.log(stats);
    
    // Parse memory usage
    const lines = stats.split('\n');
    const appLine = lines.find(l => l.includes('omniops-app'));
    if (appLine) {
      const parts = appLine.split(/\s+/);
      results.currentMemory = parts[2];
      results.currentCPU = parts[1];
    }
  } catch {
    console.log('Containers not running');
  }
  
  // 3. Test health endpoint response time (if running)
  console.log(`\n${colors.bright}${colors.blue}⚡ Performance Tests${colors.reset}`);
  try {
    const times: number[] = [];
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      try {
        await execAsync('curl -sf http://localhost:3000/api/health');
        times.push(Date.now() - start);
      } catch {
        // Not running
      }
    }
    
    if (times.length > 0) {
      results.healthCheckAvg = times.reduce((a, b) => a + b) / times.length;
      console.log(`Health check avg response: ${colors.green}${results.healthCheckAvg.toFixed(0)}ms${colors.reset}`);
    } else {
      console.log('App not responding (may need to start containers)');
    }
  } catch {
    console.log('Could not test endpoint');
  }
  
  // 4. Check Docker build cache
  console.log(`\n${colors.bright}${colors.blue}🗄️ Build Cache Analysis${colors.reset}`);
  try {
    const { stdout: cacheInfo } = await execAsync('docker system df --verbose | head -20');
    console.log(cacheInfo);
  } catch {
    console.log('Could not analyze cache');
  }
  
  // 5. Analyze Dockerfile for optimization opportunities
  console.log(`\n${colors.bright}${colors.blue}🔍 Dockerfile Analysis${colors.reset}`);
  try {
    const dockerfile = await fs.readFile('Dockerfile', 'utf-8');
    const lines = dockerfile.split('\n');
    
    const analysis = {
      totalLines: lines.length,
      fromStatements: lines.filter(l => l.trim().startsWith('FROM')).length,
      runStatements: lines.filter(l => l.trim().startsWith('RUN')).length,
      copyStatements: lines.filter(l => l.trim().startsWith('COPY')).length,
      hasBuildKit: dockerfile.includes('--mount=type=cache'),
      hasMultiStage: lines.filter(l => l.includes('AS ')).length > 1,
      hasHealthcheck: dockerfile.includes('HEALTHCHECK'),
      usesAlpine: dockerfile.includes('alpine'),
      hasNonRootUser: dockerfile.includes('USER ')
    };
    
    console.log('Dockerfile optimization features:');
    console.log(`  ✓ Multi-stage build: ${analysis.hasMultiStage ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}`);
    console.log(`  ✓ BuildKit cache mounts: ${analysis.hasBuildKit ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}`);
    console.log(`  ✓ Alpine base image: ${analysis.usesAlpine ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}`);
    console.log(`  ✓ Non-root user: ${analysis.hasNonRootUser ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}`);
    console.log(`  ✓ Health check: ${analysis.hasHealthcheck ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}`);
    console.log(`\n  Stages: ${analysis.fromStatements}`);
    console.log(`  RUN commands: ${analysis.runStatements} (fewer is better for caching)`);
    console.log(`  COPY commands: ${analysis.copyStatements}`);
    
    results.dockerfileOptimizations = analysis;
  } catch (error) {
    console.log('Could not analyze Dockerfile');
  }
  
  // 6. Quick build test with timing
  console.log(`\n${colors.bright}${colors.blue}⏱️ Build Performance Test${colors.reset}`);
  console.log('Testing cached build performance...');
  const buildStart = Date.now();
  try {
    await execAsync('DOCKER_BUILDKIT=1 docker-compose build --progress=plain 2>&1', { 
      maxBuffer: 10 * 1024 * 1024 
    });
    results.cachedBuildTime = (Date.now() - buildStart) / 1000;
    console.log(`Cached build completed in: ${colors.green}${results.cachedBuildTime.toFixed(2)}s${colors.reset}`);
  } catch (error) {
    console.log('Build failed - this is expected if dependencies changed');
    results.cachedBuildTime = (Date.now() - buildStart) / 1000;
  }
  
  // 7. Summary and Recommendations
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}           PERFORMANCE SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.bright}Key Metrics:${colors.reset}`);
  console.log(`  App Image Size: ${results.appImageSize || 'Not built'}`);
  console.log(`  Layer Count: ${results.layerCount || 0}`);
  console.log(`  Current Memory: ${results.currentMemory || 'N/A'}`);
  console.log(`  Current CPU: ${results.currentCPU || 'N/A'}`);
  console.log(`  Health Check Response: ${results.healthCheckAvg ? results.healthCheckAvg.toFixed(0) + 'ms' : 'N/A'}`);
  console.log(`  Cached Build Time: ${results.cachedBuildTime ? results.cachedBuildTime.toFixed(2) + 's' : 'N/A'}`);
  
  console.log(`\n${colors.bright}🎯 Optimization Recommendations:${colors.reset}`);
  
  const recommendations: string[] = [];
  
  // Check image size
  if (results.appImageSize && results.appImageSize.includes('GB')) {
    const size = parseFloat(results.appImageSize);
    if (size > 1) {
      recommendations.push(`Image size is ${results.appImageSize} - consider optimization`);
    }
  }
  
  // Check layer count
  if (results.layerCount > 30) {
    recommendations.push(`High layer count (${results.layerCount}) - consolidate RUN commands`);
  }
  
  // Check build time
  if (results.cachedBuildTime > 60) {
    recommendations.push(`Build time exceeds 1 minute - optimize Dockerfile`);
  }
  
  // Check health response
  if (results.healthCheckAvg > 500) {
    recommendations.push(`Health check slow (${results.healthCheckAvg}ms) - optimize endpoint`);
  }
  
  // Add Dockerfile recommendations
  if (results.dockerfileOptimizations) {
    const opts = results.dockerfileOptimizations;
    if (!opts.hasMultiStage) {
      recommendations.push('Use multi-stage builds to reduce final image size');
    }
    if (!opts.hasBuildKit) {
      recommendations.push('Add BuildKit cache mounts for faster dependency installation');
    }
    if (opts.runStatements > 10) {
      recommendations.push(`Consolidate RUN commands (currently ${opts.runStatements})`);
    }
  }
  
  // General recommendations
  recommendations.push('Always use DOCKER_BUILDKIT=1 for builds');
  recommendations.push('Consider using docker-slim to optimize image size');
  recommendations.push('Implement layer caching in CI/CD pipeline');
  recommendations.push('Use .dockerignore to exclude unnecessary files');
  
  recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    results,
    recommendations
  };
  
  await fs.writeFile('docker-performance-quick-report.json', JSON.stringify(report, null, 2));
  console.log(`\n📊 Detailed report saved to: ${colors.green}docker-performance-quick-report.json${colors.reset}`);
}

// Run profiler
profileDocker().catch(console.error);