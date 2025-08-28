"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const metricsData = {
  conversations: {
    total: 45832,
    change: 12.5,
    trend: "up",
  },
  responseTime: {
    average: "1.2s",
    change: -15.3,
    trend: "down",
  },
  satisfaction: {
    score: 4.7,
    change: 3.2,
    trend: "up",
  },
  resolution: {
    rate: "89%",
    change: 5.1,
    trend: "up",
  },
};

const topQueries = [
  { query: "How to reset password", count: 1234, percentage: 15 },
  { query: "Order status check", count: 987, percentage: 12 },
  { query: "Refund policy", count: 876, percentage: 11 },
  { query: "Shipping information", count: 765, percentage: 9 },
  { query: "Account verification", count: 654, percentage: 8 },
];

const languageDistribution = [
  { language: "English", percentage: 65, color: "bg-blue-500" },
  { language: "Spanish", percentage: 20, color: "bg-green-500" },
  { language: "French", percentage: 10, color: "bg-yellow-500" },
  { language: "German", percentage: 3, color: "bg-purple-500" },
  { language: "Other", percentage: 2, color: "bg-gray-500" },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive insights into your customer service performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{metricsData.conversations.total.toLocaleString()}</span>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">
                  {metricsData.conversations.change}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{metricsData.responseTime.average}</span>
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">
                  {Math.abs(metricsData.responseTime.change)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Satisfaction Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{metricsData.satisfaction.score}/5</span>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">
                  {metricsData.satisfaction.change}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{metricsData.resolution.rate}</span>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">
                  {metricsData.resolution.change}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Conversation Trends</span>
                  <LineChart className="h-5 w-5 text-gray-400" />
                </CardTitle>
                <CardDescription>
                  Daily conversation volume over selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-gray-500">Line chart visualization</p>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Response Time Distribution</span>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </CardTitle>
                <CardDescription>
                  Distribution of bot response times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-gray-500">Bar chart visualization</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customer Queries</CardTitle>
              <CardDescription>
                Most common questions asked by customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topQueries.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.query}</span>
                      <span className="text-sm text-gray-500">{item.count} queries</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation Status */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="text-sm font-medium">234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full" />
                      <span className="text-sm">Waiting</span>
                    </div>
                    <span className="text-sm font-medium">87</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-gray-500 rounded-full" />
                      <span className="text-sm">Resolved</span>
                    </div>
                    <span className="text-sm font-medium">1,892</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Language Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Language Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {languageDistribution.map((lang) => (
                    <div key={lang.language} className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${lang.color}`} />
                      <span className="text-sm flex-1">{lang.language}</span>
                      <span className="text-sm font-medium">{lang.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Conversation Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">9:00 AM - 11:00 AM</span>
                    <Badge variant="secondary">High</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">2:00 PM - 4:00 PM</span>
                    <Badge variant="secondary">High</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">7:00 PM - 9:00 PM</span>
                    <Badge variant="outline">Medium</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bot Accuracy</CardTitle>
                <CardDescription>Intent recognition accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">94.7%</div>
                  <Progress value={94.7} />
                  <p className="text-sm text-gray-500">
                    Based on 10,234 interactions
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Escalation Rate</CardTitle>
                <CardDescription>Conversations escalated to humans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">12.3%</div>
                  <Progress value={12.3} className="bg-red-100" />
                  <p className="text-sm text-gray-500">
                    Lower is better
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>First Contact Resolution</CardTitle>
                <CardDescription>Issues resolved in first interaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">78.5%</div>
                  <Progress value={78.5} />
                  <p className="text-sm text-gray-500">
                    Industry average: 71%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
              <CardDescription>
                Understanding your customer base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Customer Segments</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">New Customers</span>
                      <span className="text-sm font-medium">34%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Returning Customers</span>
                      <span className="text-sm font-medium">52%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">VIP Customers</span>
                      <span className="text-sm font-medium">14%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Satisfaction by Segment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Customers</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={85} className="w-20" />
                        <span className="text-sm">4.2/5</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Returning</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={92} className="w-20" />
                        <span className="text-sm">4.6/5</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">VIP</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={96} className="w-20" />
                        <span className="text-sm">4.8/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Actionable recommendations based on your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    📈 Optimize Response Times
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Response times spike 23% during 2-4 PM. Consider adding more intents for common afternoon queries or implementing smart routing.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    🎯 High Performing Topics
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your bot excels at handling order status queries (98% success rate). Consider expanding similar structured responses to other topics.
                  </p>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                    ⚡ Training Opportunity
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    15% of escalations involve refund requests. Adding more training data for refund scenarios could reduce escalations by ~40%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}