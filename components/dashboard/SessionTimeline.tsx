/**
 * Session Timeline Component
 *
 * Displays session-level information including:
 * - Session metadata (duration, pages visited)
 * - Page view timeline
 * - Linked conversations
 * - Browser and device info
 */

"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SessionMetadata } from '@/types/analytics';
import {
  Clock,
  Globe,
  MessageSquare,
  Monitor,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface SessionTimelineProps {
  session: SessionMetadata;
  className?: string;
}

export function SessionTimeline({ session, className }: SessionTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  const durationMinutes = session.duration_seconds
    ? Math.floor(session.duration_seconds / 60)
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Session Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Session ID: <code className="text-xs">{session.session_id}</code>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">
                {durationMinutes > 0 ? `${durationMinutes} min` : 'Active'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Pages Visited</p>
              <p className="text-sm font-medium">{session.total_pages}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Conversations</p>
              <p className="text-sm font-medium">{session.conversation_ids.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Device</p>
              <p className="text-sm font-medium capitalize">
                {session.browser_info?.device_type || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Browser Info */}
        {session.browser_info && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Browser & System</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {session.browser_info.name} {session.browser_info.version}
              </Badge>
              <Badge variant="outline">{session.browser_info.os}</Badge>
              <Badge variant="outline">
                {session.browser_info.viewport_width}x{session.browser_info.viewport_height}
              </Badge>
            </div>
          </div>
        )}

        {/* Page Views Timeline (Expanded) */}
        {expanded && session.page_views.length > 0 && (
          <div className="pt-2 border-t space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Page Visit History</p>
            <div className="space-y-2">
              {session.page_views.map((pageView, index) => {
                const timestamp = new Date(pageView.timestamp);
                const duration = pageView.duration_seconds
                  ? `${Math.floor(pageView.duration_seconds / 60)}m ${pageView.duration_seconds % 60}s`
                  : 'Active';

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0 mt-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {index < session.page_views.length - 1 && (
                        <div className="absolute top-2 left-1 w-0.5 h-full bg-border" />
                      )}
                    </div>

                    {/* Page info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium truncate">
                          {pageView.title || 'Untitled Page'}
                        </h4>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {duration}
                        </Badge>
                      </div>

                      <a
                        href={pageView.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 truncate"
                      >
                        <span className="truncate">{pageView.url}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{timestamp.toLocaleTimeString()}</span>
                        {pageView.scroll_depth && (
                          <span>Scroll: {pageView.scroll_depth}%</span>
                        )}
                        {pageView.interactions && (
                          <span>{pageView.interactions} interactions</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Session Start/End Times */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Started:</span>
            <span>{new Date(session.start_time).toLocaleString()}</span>
          </div>
          {session.end_time && (
            <div className="flex justify-between mt-1">
              <span>Ended:</span>
              <span>{new Date(session.end_time).toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Session Card
 * Used in conversation list to show session info inline
 */
interface SessionCardCompactProps {
  session: SessionMetadata;
  onClick?: () => void;
}

export function SessionCardCompact({ session, onClick }: SessionCardCompactProps) {
  const durationMinutes = session.duration_seconds
    ? Math.floor(session.duration_seconds / 60)
    : 0;

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">
            {durationMinutes > 0 ? `${durationMinutes} min` : 'Active'}
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {session.total_pages} pages
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>{session.conversation_ids.length}</span>
        </div>
        {session.browser_info && (
          <div className="flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            <span className="capitalize">{session.browser_info.device_type}</span>
          </div>
        )}
      </div>
    </button>
  );
}
