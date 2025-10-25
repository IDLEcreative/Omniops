"use client";

import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Calendar, Clock, Filter, Globe, MessageCircle, RefreshCw, Search } from "lucide-react";
import { useDashboardConversations } from "@/hooks/use-dashboard-conversations";
import { ConversationTranscript } from "@/components/dashboard/conversation-transcript";

type DateRangeValue = "24h" | "7d" | "30d" | "90d";

const RANGE_TO_DAYS: Record<DateRangeValue, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const STATUS_LABELS: Record<"active" | "waiting" | "resolved", string> = {
  active: "Active",
  waiting: "Waiting",
  resolved: "Resolved",
};

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const levelVariant: Record<string, BadgeVariant> = {
  high: "secondary",
  medium: "outline",
  low: "outline",
};

export default function ConversationsPage() {
  const [selectedRange, setSelectedRange] = useState<DateRangeValue>("7d");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const days = RANGE_TO_DAYS[selectedRange] ?? 7;
  const { data, loading, error, refresh } = useDashboardConversations({ days });

  useEffect(() => {
    if (loading) return;
    const first = data?.recent?.[0];
    if (first) {
      setSelectedConversationId((current) => current ?? first.id);
    }
  }, [data, loading]);

  const selectedConversation = useMemo(() => {
    if (!data) return null;
    return data.recent.find((item) => item.id === selectedConversationId) ?? null;
  }, [data, selectedConversationId]);

  const totalStatus = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.statusCounts).reduce((acc, value) => acc + value, 0);
  }, [data]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data.recent;
    const term = searchTerm.toLowerCase();
    return data.recent.filter((conversation) => {
      const messageMatch = conversation.message.toLowerCase().includes(term);
      const customerMatch = (conversation.customerName?.toLowerCase() ?? "").includes(term);
      return messageMatch || customerMatch;
    });
  }, [data, searchTerm]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            Monitor live conversations, recent sentiment, and language coverage.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as DateRangeValue)}>
            <SelectTrigger className="w-34">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            We couldn’t load conversation stats. Try refreshing or adjust the date range.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Conversations</CardTitle>
            <CardDescription>Count and change vs previous period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {loading && !data ? <SkeletonBar /> : data?.total.toLocaleString() ?? "—"}
            </div>
            <div className="text-sm text-muted-foreground">
              Change: {loading && !data ? "—" : `${(data?.change ?? 0).toFixed(1)}%`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Active vs waiting vs resolved conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["active", "waiting", "resolved"] as const).map((status) => {
              const count = data?.statusCounts[status] ?? 0;
              const percentage = totalStatus > 0 ? Math.round((count / totalStatus) * 100) : 0;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={statusBadgeVariant(status)}>{STATUS_LABELS[status]}</Badge>
                  </div>
                  <div className="text-sm font-medium">
                    {loading && !data ? "—" : `${count.toLocaleString()} · ${percentage}%`}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>Highest-volume times in this range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !data ? (
              <SkeletonList count={3} />
            ) : data && data.peakHours.length > 0 ? (
              data.peakHours.map((entry) => (
                <div key={entry.hour} className="flex items-center justify-between text-sm">
                  <span>{entry.label}</span>
                  <Badge variant={levelVariant[entry.level] ?? "outline"}>{entry.count}</Badge>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Clock}
                title="No peak hours data"
                description="Peak hour patterns will emerge as more conversations are recorded"
                variant="compact"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Share of conversations by language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && !data ? (
              <SkeletonList count={4} />
            ) : data && data.languages.length > 0 ? (
              data.languages.map((entry) => (
                <div key={entry.language} className="flex items-center justify-between text-sm">
                  <span>{entry.language}</span>
                  <span className="font-medium">{entry.percentage}%</span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Globe}
                title="No language data"
                description="Language diversity metrics will appear as international customers engage"
                variant="compact"
              />
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-8 flex flex-col border rounded-lg">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search conversations…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex h-[600px]">
            <div className="w-80 border-r">
              <Tabs defaultValue="all" className="flex h-full flex-col">
                <TabsList className="grid grid-cols-4 px-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="waiting">Waiting</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="flex-1 mt-0">
                  <ScrollArea className="h-full">
                    {loading && !data ? (
                      <SkeletonList count={6} />
                    ) : filteredConversations.length === 0 ? (
                      <EmptyState
                        icon={MessageCircle}
                        title={searchTerm ? "No matches found" : "No conversations yet"}
                        description={searchTerm ? "Try adjusting your search terms" : "Conversations will appear here once customers start chatting"}
                        variant="default"
                      />
                    ) : (
                      filteredConversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          type="button"
                          className={`w-full border-b px-4 py-3 text-left transition hover:bg-muted ${
                            selectedConversationId === conversation.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedConversationId(conversation.id)}
                        >
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatRelativeTime(conversation.timestamp)}</span>
                            <Badge variant={statusBadgeVariant(conversation.status)}>
                              {STATUS_LABELS[conversation.status]}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm font-medium">
                            {conversation.customerName ?? "Customer"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {conversation.message}
                          </p>
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="border-b p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {(selectedConversation.customerName?.charAt(0) ?? "C").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">
                              {selectedConversation.customerName ?? "Customer"}
                            </h3>
                            <Badge variant={statusBadgeVariant(selectedConversation.status)}>
                              {STATUS_LABELS[selectedConversation.status]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Last message {formatRelativeTime(selectedConversation.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Assign Human
                        </Button>
                        <Button variant="outline" size="sm">
                          Close
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Bot className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <ConversationTranscript
                    conversationId={selectedConversationId}
                    className="flex-1"
                  />

                  <div className="border-t p-4">
                    <div className="flex items-center space-x-3">
                      <Input
                        placeholder="Type a reply..."
                        value=""
                        readOnly
                        className="text-sm"
                      />
                      <Button variant="secondary" size="icon" disabled>
                        <Bot className="h-4 w-4" />
                      </Button>
                      <Button size="icon" disabled>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Responding available in the conversation workspace.
                    </p>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={MessageCircle}
                  title="Select a conversation"
                  description="Choose a conversation from the list to view details"
                  variant="default"
                  className="flex-1"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const delta = Date.now() - date.getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function statusBadgeVariant(status: "active" | "waiting" | "resolved"): BadgeVariant {
  switch (status) {
    case "resolved":
      return "outline";
    case "waiting":
      return "secondary";
    default:
      return "default";
  }
}

function SkeletonBar() {
  return <span className="inline-block h-6 w-24 rounded bg-muted animate-pulse" />;
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-8 w-full rounded bg-muted animate-pulse" />
      ))}
    </div>
  );
}
