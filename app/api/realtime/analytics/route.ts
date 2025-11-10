import { NextRequest } from 'next/server';
import { createAnalyticsStream } from '@/lib/realtime/analytics-stream';
import { getAggregatedMetrics } from '@/lib/realtime/event-aggregator';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Generate unique client ID
  const clientId = uuidv4();

  // Create response headers for SSE
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  // Create the stream
  const stream = createAnalyticsStream(clientId);

  // Start periodic metrics updates
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;
  let lastMetrics: any = null;

  const transformStream = new TransformStream({
    async start(controller) {
      // Send initial metrics immediately
      try {
        const metrics = await getAggregatedMetrics();
        const message = `data: ${JSON.stringify({
          type: 'metrics',
          data: metrics,
          timestamp: Date.now()
        })}\n\n`;
        controller.enqueue(encoder.encode(message));
        lastMetrics = metrics;
      } catch (error) {
        console.error('Error fetching initial metrics:', error);
      }

      // Set up periodic updates every 2 seconds
      intervalId = setInterval(async () => {
        try {
          const metrics = await getAggregatedMetrics();

          // Calculate deltas if we have previous metrics
          let deltas = null;
          if (lastMetrics) {
            deltas = {
              activeSessions: metrics.activeSessions - lastMetrics.activeSessions,
              messagesPerMinute: metrics.messagesPerMinute - lastMetrics.messagesPerMinute,
            };
          }

          const message = `data: ${JSON.stringify({
            type: 'metrics',
            data: metrics,
            deltas,
            timestamp: Date.now()
          })}\n\n`;

          controller.enqueue(encoder.encode(message));
          lastMetrics = metrics;
        } catch (error) {
          console.error('Error fetching metrics:', error);
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            error: 'Failed to fetch metrics',
            timestamp: Date.now()
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMessage));
        }
      }, 2000);
    },

    transform(chunk, controller) {
      // Pass through chunks from the analytics stream
      controller.enqueue(chunk);
    },

    flush() {
      // Clean up interval on stream close
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  });

  // Pipe the analytics stream through the transform stream
  const responseStream = stream.pipeThrough(transformStream);

  return new Response(responseStream, {
    headers,
    status: 200
  });
}

// OPTIONS endpoint for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}