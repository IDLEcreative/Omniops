#!/usr/bin/env npx tsx

/**
 * Docker Performance Profiling Script
 * Measures build time, image sizes, startup performance, and runtime metrics
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

interface PerformanceMetrics {
  buildPerformance: {
    noCacheBuild: number;
    cachedBuild: number;
    buildKitBuild: number;
    contextSize: string;
  };
  imageAnalysis: {
    appSize: string;
    redisSize: string;
    totalSize: string;
    layers: Array<{ size: string; command: string }>;
  };
  startupPerformance: {
    composeUpTime: number;
    healthyTime: number;
    firstResponseTime: number;
    memoryAtStartup: string;
    cpuAtStartup: string;
  };
  runtimePerformance: {
    healthCheckResponseTime: number;
    memoryAfter1Min: string;
    cpuIdle: string;
    redisLatency: number;
    containerRestartTime: number;
  };
  resourceUtilization: {
    cpuLimit: string;
    memoryLimit: string;
    diskIO: string;
    networkStats: string;
  };
}

class DockerProfiler {
  private metrics: Partial<PerformanceMetrics> = {};

  async profile(): Promise<void> {
    console.log(`${colors.bright}${colors.cyan}🚀 Docker Performance Profiler${colors.reset}\n`);
    
    // Ensure Docker is running
    await this.checkDocker();
    
    // Clean up any existing containers
    await this.cleanup();
    
    // Profile each aspect
    await this.profileBuildPerformance();
    await this.profileImageSizes();
    await this.profileStartupPerformance();
    await this.profileRuntimePerformance();
    await this.profileResourceUtilization();
    
    // Generate report
    await this.generateReport();
  }

  private async checkDocker(): Promise<void> {
    try {
      await execAsync('docker info > /dev/null 2>&1');
      console.log(`${colors.green}✓${colors.reset} Docker is running\n`);
    } catch (error) {
      console.error(`${colors.red}✗ Docker is not running. Please start Docker first.${colors.reset}`);
      process.exit(1);
    }
  }

  private async cleanup(): Promise<void> {
    console.log(`${colors.yellow}🧹 Cleaning up existing containers...${colors.reset}`);
    try {
      await execAsync('docker-compose down -v 2>/dev/null');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch {
      // Ignore errors if containers don't exist
    }
  }

  private async profileBuildPerformance(): Promise<void> {
    console.log(`\n${colors.bright}${colors.blue}📦 Build Performance${colors.reset}`);
    
    this.metrics.buildPerformance = {
      noCacheBuild: 0,
      cachedBuild: 0,
      buildKitBuild: 0,
      contextSize: '0'
    };

    // Measure build context size
    try {
      const { stdout: contextSize } = await execAsync(
        "du -sh . --exclude='.git' --exclude='node_modules' --exclude='.next' 2>/dev/null | cut -f1"
      );
      this.metrics.buildPerformance.contextSize = contextSize.trim();
      console.log(`Build context size: ${colors.green}${contextSize.trim()}${colors.reset}`);
    } catch (error) {
      console.log(`Could not measure context size`);
    }

    // 1. No-cache build
    console.log('\nMeasuring no-cache build time...');
    const noCacheStart = Date.now();
    try {
      await execAsync('docker-compose build --no-cache --progress=plain 2>&1', { 
        maxBuffer: 10 * 1024 * 1024 
      });
      this.metrics.buildPerformance.noCacheBuild = (Date.now() - noCacheStart) / 1000;
      console.log(`No-cache build: ${colors.green}${this.metrics.buildPerformance.noCacheBuild.toFixed(2)}s${colors.reset}`);
    } catch (error) {
      console.error(`Build failed: ${error}`);
    }

    // 2. Cached build
    console.log('\nMeasuring cached build time...');
    const cachedStart = Date.now();
    try {
      await execAsync('docker-compose build --progress=plain 2>&1', { 
        maxBuffer: 10 * 1024 * 1024 
      });
      this.metrics.buildPerformance.cachedBuild = (Date.now() - cachedStart) / 1000;
      console.log(`Cached build: ${colors.green}${this.metrics.buildPerformance.cachedBuild.toFixed(2)}s${colors.reset}`);
    } catch (error) {
      console.error(`Build failed: ${error}`);
    }

    // 3. BuildKit build
    console.log('\nMeasuring BuildKit optimized build...');
    const buildKitStart = Date.now();
    try {
      await execAsync('DOCKER_BUILDKIT=1 docker-compose build --progress=plain 2>&1', { 
        maxBuffer: 10 * 1024 * 1024 
      });
      this.metrics.buildPerformance.buildKitBuild = (Date.now() - buildKitStart) / 1000;
      console.log(`BuildKit build: ${colors.green}${this.metrics.buildPerformance.buildKitBuild.toFixed(2)}s${colors.reset}`);
    } catch (error) {
      console.error(`Build failed: ${error}`);
    }

    // Calculate improvements
    if (this.metrics.buildPerformance.noCacheBuild > 0) {
      const cacheImprovement = ((this.metrics.buildPerformance.noCacheBuild - this.metrics.buildPerformance.cachedBuild) / this.metrics.buildPerformance.noCacheBuild * 100).toFixed(1);
      const buildKitImprovement = ((this.metrics.buildPerformance.cachedBuild - this.metrics.buildPerformance.buildKitBuild) / this.metrics.buildPerformance.cachedBuild * 100).toFixed(1);
      
      console.log(`\nCache improvement: ${colors.cyan}${cacheImprovement}%${colors.reset}`);
      console.log(`BuildKit improvement: ${colors.cyan}${buildKitImprovement}%${colors.reset}`);
    }
  }

  private async profileImageSizes(): Promise<void> {
    console.log(`\n${colors.bright}${colors.blue}📏 Image Size Analysis${colors.reset}`);
    
    this.metrics.imageAnalysis = {
      appSize: '0',
      redisSize: '0',
      totalSize: '0',
      layers: []
    };

    try {
      // Get image sizes
      const { stdout: images } = await execAsync('docker images --format "table {{.Repository}}:{{.Tag}}\\t{{.Size}}" | grep -E "(omniops|redis)"');
      console.log('\nImage sizes:');
      console.log(images);

      // Get detailed size for app image
      const { stdout: appSize } = await execAsync('docker images omniops-app --format "{{.Size}}" 2>/dev/null || echo "N/A"');
      this.metrics.imageAnalysis.appSize = appSize.trim();

      // Analyze layers of the app image
      console.log('\nAnalyzing app image layers...');
      try {
        const { stdout: history } = await execAsync('docker history omniops-app --format "table {{.Size}}\\t{{.CreatedBy}}" --no-trunc | head -20');
        const lines = history.split('\n').slice(1); // Skip header
        
        this.metrics.imageAnalysis.layers = lines
          .filter(line => line && !line.includes('<missing>'))
          .map(line => {
            const [size, ...commandParts] = line.split('\t');
            return {
              size: size!.trim(),
              command: commandParts.join(' ').substring(0, 60) + '...'
            };
          })
          .filter(layer => layer.size !== '0B');

        console.log('\nLargest layers:');
        this.metrics.imageAnalysis.layers.slice(0, 5).forEach(layer => {
          console.log(`  ${colors.yellow}${layer.size.padEnd(10)}${colors.reset} ${layer.command}`);
        });
      } catch (error) {
        console.log('Could not analyze image layers');
      }
    } catch (error) {
      console.error(`Failed to analyze images: ${error}`);
    }
  }

  private async profileStartupPerformance(): Promise<void> {
    console.log(`\n${colors.bright}${colors.blue}⚡ Startup Performance${colors.reset}`);
    
    this.metrics.startupPerformance = {
      composeUpTime: 0,
      healthyTime: 0,
      firstResponseTime: 0,
      memoryAtStartup: '0',
      cpuAtStartup: '0'
    };

    // Clean up before starting
    await this.cleanup();

    console.log('\nStarting containers...');
    const startTime = Date.now();

    try {
      // Start containers
      await execAsync('docker-compose up -d');
      this.metrics.startupPerformance.composeUpTime = (Date.now() - startTime) / 1000;
      console.log(`Compose up time: ${colors.green}${this.metrics.startupPerformance.composeUpTime.toFixed(2)}s${colors.reset}`);

      // Wait for healthy status
      console.log('Waiting for healthy status...');
      const healthyStart = Date.now();
      let healthy = false;
      let attempts = 0;
      
      while (!healthy && attempts < 60) {
        try {
          const { stdout } = await execAsync('docker-compose ps --format json 2>/dev/null || docker-compose ps');
          if (stdout.includes('healthy') || stdout.includes('running')) {
            healthy = true;
          }
        } catch {
          // Continue waiting
        }
        
        if (!healthy) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      this.metrics.startupPerformance.healthyTime = (Date.now() - healthyStart) / 1000;
      console.log(`Time to healthy: ${colors.green}${this.metrics.startupPerformance.healthyTime.toFixed(2)}s${colors.reset}`);

      // Test first API response
      console.log('Testing API response time...');
      const apiStart = Date.now();
      let apiResponded = false;
      attempts = 0;
      
      while (!apiResponded && attempts < 30) {
        try {
          await execAsync('curl -f http://localhost:3000/api/health 2>/dev/null');
          apiResponded = true;
        } catch {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      if (apiResponded) {
        this.metrics.startupPerformance.firstResponseTime = (Date.now() - apiStart) / 1000;
        console.log(`First API response: ${colors.green}${this.metrics.startupPerformance.firstResponseTime.toFixed(2)}s${colors.reset}`);
      }

      // Get resource usage at startup
      try {
        const { stdout: stats } = await execAsync('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"');
        console.log('\nResource usage at startup:');
        console.log(stats);
        
        // Parse app container stats
        const appStats = stats.split('\n').find(line => line.includes('omniops-app'));
        if (appStats) {
          const parts = appStats.split(/\s+/);
          this.metrics.startupPerformance.cpuAtStartup = parts[1] || '0%';
          this.metrics.startupPerformance.memoryAtStartup = parts[2] || '0MiB';
        }
      } catch (error) {
        console.log('Could not get startup stats');
      }
    } catch (error) {
      console.error(`Startup failed: ${error}`);
    }
  }

  private async profileRuntimePerformance(): Promise<void> {
    console.log(`\n${colors.bright}${colors.blue}🏃 Runtime Performance${colors.reset}`);
    
    this.metrics.runtimePerformance = {
      healthCheckResponseTime: 0,
      memoryAfter1Min: '0',
      cpuIdle: '0',
      redisLatency: 0,
      containerRestartTime: 0
    };

    // Ensure containers are running
    try {
      await execAsync('docker-compose up -d');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for stable state
    } catch (error) {
      console.error('Could not start containers for runtime profiling');
      return;
    }

    // 1. Health check response time
    console.log('\nMeasuring health check response time...');
    const healthTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      try {
        await execAsync('curl -f http://localhost:3000/api/health 2>/dev/null');
        healthTimes.push(Date.now() - start);
      } catch {
        // Ignore failures
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (healthTimes.length > 0) {
      this.metrics.runtimePerformance.healthCheckResponseTime = 
        healthTimes.reduce((a, b) => a + b, 0) / healthTimes.length;
      console.log(`Avg health check response: ${colors.green}${this.metrics.runtimePerformance.healthCheckResponseTime.toFixed(0)}ms${colors.reset}`);
    }

    // 2. Redis latency
    console.log('\nMeasuring Redis latency...');
    try {
      const { stdout: redisPing } = await execAsync(
        'docker exec omniops-redis redis-cli --latency-history 2>/dev/null || docker exec omniops-redis redis-cli ping'
      );
      console.log(`Redis response: ${colors.green}${redisPing.trim()}${colors.reset}`);
    } catch (error) {
      console.log('Could not measure Redis latency');
    }

    // 3. Wait 1 minute and measure resources
    console.log('\nWaiting 60 seconds to measure stable resource usage...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    try {
      const { stdout: stats } = await execAsync('docker stats --no-stream --format "json"');
      const containers = stats.split('\n').filter(line => line.trim()).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      const appContainer = containers.find(c => c.Name === 'omniops-app' || c.Container === 'omniops-app');
      if (appContainer) {
        this.metrics.runtimePerformance.memoryAfter1Min = appContainer.MemUsage || '0';
        this.metrics.runtimePerformance.cpuIdle = appContainer.CPUPerc || '0%';
        console.log(`Memory after 1 min: ${colors.green}${this.metrics.runtimePerformance.memoryAfter1Min}${colors.reset}`);
        console.log(`CPU usage (idle): ${colors.green}${this.metrics.runtimePerformance.cpuIdle}${colors.reset}`);
      }
    } catch (error) {
      console.log('Could not get runtime stats');
    }

    // 4. Container restart time
    console.log('\nMeasuring container restart time...');
    const restartStart = Date.now();
    try {
      await execAsync('docker-compose restart app');
      
      // Wait for healthy
      let healthy = false;
      let attempts = 0;
      while (!healthy && attempts < 30) {
        try {
          await execAsync('curl -f http://localhost:3000/api/health 2>/dev/null');
          healthy = true;
        } catch {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      if (healthy) {
        this.metrics.runtimePerformance.containerRestartTime = (Date.now() - restartStart) / 1000;
        console.log(`Container restart time: ${colors.green}${this.metrics.runtimePerformance.containerRestartTime.toFixed(2)}s${colors.reset}`);
      }
    } catch (error) {
      console.log('Could not measure restart time');
    }
  }

  private async profileResourceUtilization(): Promise<void> {
    console.log(`\n${colors.bright}${colors.blue}💻 Resource Utilization${colors.reset}`);
    
    this.metrics.resourceUtilization = {
      cpuLimit: 'No limit',
      memoryLimit: 'No limit',
      diskIO: '0',
      networkStats: '0'
    };

    try {
      // Check container limits
      const { stdout: inspect } = await execAsync(
        'docker inspect omniops-app --format "{{json .HostConfig.Memory}} {{json .HostConfig.CpuShares}}"'
      );
      console.log(`\nContainer limits: ${inspect.trim()}`);

      // Get disk I/O stats
      const { stdout: diskIO } = await execAsync(
        'docker exec omniops-app df -h / | tail -1'
      );
      console.log(`\nDisk usage in container:\n${diskIO}`);

      // Network statistics
      const { stdout: netStats } = await execAsync(
        'docker network inspect omniops-network --format "{{json .Containers}}" | jq length 2>/dev/null || echo "2 containers"'
      );
      console.log(`Network connections: ${netStats.trim()}`);

    } catch (error) {
      console.log('Could not get all resource stats');
    }
  }

  private async generateReport(): Promise<void> {
    console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}       DOCKER PERFORMANCE REPORT${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);

    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'docker-performance-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Detailed report saved to: ${colors.green}${reportPath}${colors.reset}`);

    // Print summary
    this.printSummary();
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.buildPerformance) {
      if (this.metrics.buildPerformance.noCacheBuild > 180) {
        recommendations.push('Consider using lighter base images or reducing build steps');
      }
      if (this.metrics.buildPerformance.cachedBuild > 30) {
        recommendations.push('Optimize Dockerfile layer ordering to maximize cache hits');
      }
    }

    if (this.metrics.imageAnalysis) {
      // Parse size string to MB for comparison
      const sizeStr = this.metrics.imageAnalysis.appSize;
      const sizeMatch = sizeStr?.match(/(\d+(?:\.\d+)?)\s*(MB|GB)/i);
      if (sizeMatch && sizeMatch[1] && sizeMatch[2]) {
        const size = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        const sizeMB = unit === 'GB' ? size * 1024 : size;
        
        if (sizeMB > 500) {
          recommendations.push('Image size exceeds 500MB - consider multi-stage build optimization');
        }
      }
    }

    if (this.metrics.startupPerformance) {
      if (this.metrics.startupPerformance.healthyTime > 60) {
        recommendations.push('Startup time exceeds 1 minute - optimize initialization');
      }
      if (this.metrics.startupPerformance.firstResponseTime > 30) {
        recommendations.push('API response time is slow - check Next.js build optimization');
      }
    }

    if (this.metrics.runtimePerformance) {
      if (this.metrics.runtimePerformance.healthCheckResponseTime > 1000) {
        recommendations.push('Health check response exceeds 1s - optimize endpoint');
      }
      if (this.metrics.runtimePerformance.containerRestartTime > 30) {
        recommendations.push('Container restart is slow - consider graceful shutdown optimization');
      }
    }

    // Add general optimizations
    recommendations.push('Enable BuildKit by default with DOCKER_BUILDKIT=1');
    recommendations.push('Consider using Docker layer caching in CI/CD');
    recommendations.push('Implement resource limits to prevent container sprawl');
    recommendations.push('Use .dockerignore to reduce build context size');

    return recommendations;
  }

  private printSummary(): void {
    console.log(`\n${colors.bright}📈 Performance Summary${colors.reset}`);
    console.log(`${colors.yellow}${'─'.repeat(45)}${colors.reset}`);
    
    if (this.metrics.buildPerformance) {
      console.log(`\n${colors.bright}Build Performance:${colors.reset}`);
      console.log(`  No-cache build:   ${this.metrics.buildPerformance.noCacheBuild.toFixed(2)}s`);
      console.log(`  Cached build:     ${this.metrics.buildPerformance.cachedBuild.toFixed(2)}s`);
      console.log(`  BuildKit build:   ${this.metrics.buildPerformance.buildKitBuild.toFixed(2)}s`);
      console.log(`  Context size:     ${this.metrics.buildPerformance.contextSize}`);
    }

    if (this.metrics.imageAnalysis) {
      console.log(`\n${colors.bright}Image Sizes:${colors.reset}`);
      console.log(`  App image:        ${this.metrics.imageAnalysis.appSize}`);
      console.log(`  Layer count:      ${this.metrics.imageAnalysis.layers.length}`);
    }

    if (this.metrics.startupPerformance) {
      console.log(`\n${colors.bright}Startup Performance:${colors.reset}`);
      console.log(`  Compose up:       ${this.metrics.startupPerformance.composeUpTime.toFixed(2)}s`);
      console.log(`  Time to healthy:  ${this.metrics.startupPerformance.healthyTime.toFixed(2)}s`);
      console.log(`  First response:   ${this.metrics.startupPerformance.firstResponseTime.toFixed(2)}s`);
      console.log(`  Memory at start:  ${this.metrics.startupPerformance.memoryAtStartup}`);
      console.log(`  CPU at start:     ${this.metrics.startupPerformance.cpuAtStartup}`);
    }

    if (this.metrics.runtimePerformance) {
      console.log(`\n${colors.bright}Runtime Performance:${colors.reset}`);
      console.log(`  Health check avg: ${this.metrics.runtimePerformance.healthCheckResponseTime.toFixed(0)}ms`);
      console.log(`  Memory (1 min):   ${this.metrics.runtimePerformance.memoryAfter1Min}`);
      console.log(`  CPU (idle):       ${this.metrics.runtimePerformance.cpuIdle}`);
      console.log(`  Restart time:     ${this.metrics.runtimePerformance.containerRestartTime.toFixed(2)}s`);
    }

    console.log(`\n${colors.bright}🎯 Optimization Recommendations:${colors.reset}`);
    const recommendations = this.generateRecommendations();
    recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    console.log(`\n${colors.yellow}${'─'.repeat(45)}${colors.reset}`);
  }
}

// Run the profiler
const profiler = new DockerProfiler();
profiler.profile().catch(console.error);