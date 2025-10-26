import os from 'os';
import type { HealthCheckResult, SystemMetrics } from './types';

/**
 * Check System Resources
 */
export function checkSystemResources(): HealthCheckResult {
  const cpus = os.cpus();
  const cpuCount = cpus?.length || 1;
  const loadAvg = os.loadavg();
  const cpuUsage = loadAvg?.[0] ? (loadAvg[0] / cpuCount * 100) : 0;

  const metrics: SystemMetrics = {
    cpu: {
      usage: cpuUsage,
      cores: cpuCount,
    },
    memory: {
      used: (os.totalmem() - os.freemem()),
      total: os.totalmem(),
      percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
    },
    uptime: os.uptime(),
    loadAverage: os.loadavg(),
  };

  // Determine health based on resource usage
  const cpuHealthy = metrics.cpu.usage < 80;
  const memoryHealthy = metrics.memory.percentage < 85;

  const status = cpuHealthy && memoryHealthy ? 'healthy' :
                 cpuHealthy || memoryHealthy ? 'degraded' : 'unhealthy';

  return {
    service: 'system',
    status,
    details: {
      cpu: {
        usage: `${metrics.cpu.usage.toFixed(2)}%`,
        cores: metrics.cpu.cores,
        loadAverage: metrics.loadAverage,
      },
      memory: {
        used: `${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB`,
        total: `${(metrics.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB`,
        percentage: `${metrics.memory.percentage.toFixed(2)}%`,
      },
      uptime: `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`,
    },
  };
}

/**
 * Check OpenAI Service
 */
export async function checkOpenAI(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Simple check - verify API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        service: 'openai',
        status: 'unhealthy',
        error: 'OpenAI API key not configured',
      };
    }

    // Could add actual API call here if needed
    // For now, just check configuration

    return {
      service: 'openai',
      status: 'healthy',
      latency: Date.now() - startTime,
      details: {
        configured: true,
      },
    };
  } catch (error) {
    return {
      service: 'openai',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
