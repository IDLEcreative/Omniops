"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
  Globe,
  Calendar,
  Download,
  RefreshCw,
  MoreHorizontal,
  Bot,
  Sparkles,
  TrendingDown,
  DollarSign,
  UserCheck,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

// Mock data for charts
const chartData = {
  daily: [
    { day: "Mon", conversations: 145, satisfaction: 92 },
    { day: "Tue", conversations: 238, satisfaction: 94 },
    { day: "Wed", conversations: 195, satisfaction: 91 },
    { day: "Thu", conversations: 298, satisfaction: 96 },
    { day: "Fri", conversations: 342, satisfaction: 93 },
    { day: "Sat", conversations: 201, satisfaction: 95 },
    { day: "Sun", conversations: 156, satisfaction: 94 },
  ],
};

const stats = [
  {
    name: "Total Conversations",
    value: "12,351",
    change: "+12.5%",
    trend: "up",
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    name: "Active Users",
    value: "3,234",
    change: "+8.2%",
    trend: "up",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    name: "Avg Response Time",
    value: "1.3s",
    change: "-18%",
    trend: "down",
    icon: Clock,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    name: "Resolution Rate",
    value: "94.8%",
    change: "+2.1%",
    trend: "up",
    icon: CheckCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
];

const quickActions = [
  { label: "Train Bot", icon: Bot, href: "/dashboard/training" },
  { label: "View Reports", icon: BarChart3, href: "/dashboard/analytics" },
  { label: "Manage Team", icon: Users, href: "/dashboard/team" },
  { label: "Settings", icon: MoreHorizontal, href: "/dashboard/settings" },
];

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header Section */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's your AI agent performance overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto flex flex-col items-center justify-center p-4 hover:bg-accent"
            asChild
          >
            <a href={action.href}>
              <action.icon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </a>
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center pt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-green-500" />
                )}
                <span
                  className={`text-xs ${
                    stat.trend === "up" ? "text-green-500" : "text-green-500"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  vs last period
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Left Column - 5 cols */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          {/* Performance Overview Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>
                    Daily conversations and satisfaction trends
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Activity className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Interactive chart would be displayed here
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 mt-4">
                {chartData.daily.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-muted-foreground">{day.day}</div>
                    <div className="mt-1 h-20 bg-muted/20 rounded relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 w-full bg-primary/20 border-t-2 border-primary"
                        style={{ height: `${(day.conversations / 342) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium mt-1">{day.conversations}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Insights */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Conversations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Conversations</span>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      user: "Sarah Chen", 
                      message: "How do I reset my password?", 
                      time: "2m ago",
                      status: "resolved",
                      avatar: "SC"
                    },
                    { 
                      user: "Mike Johnson", 
                      message: "Order tracking information needed", 
                      time: "5m ago",
                      status: "active",
                      avatar: "MJ"
                    },
                    { 
                      user: "Emma Davis", 
                      message: "Billing inquiry about subscription", 
                      time: "12m ago",
                      status: "waiting",
                      avatar: "ED"
                    },
                    { 
                      user: "Alex Kumar", 
                      message: "Technical support for API integration", 
                      time: "1h ago",
                      status: "resolved",
                      avatar: "AK"
                    },
                  ].map((conversation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {conversation.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{conversation.user}</p>
                          <span className="text-xs text-muted-foreground">
                            {conversation.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {conversation.message}
                        </p>
                        <Badge 
                          variant={
                            conversation.status === "resolved" ? "default" : 
                            conversation.status === "active" ? "secondary" : 
                            "outline"
                          } 
                          className="text-xs"
                        >
                          {conversation.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View All Conversations
                </Button>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Insights</span>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Peak Hours Detected
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          Most conversations occur between 2-4 PM EST. Consider adding more bot capacity.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          High Performance Topic
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          "Password reset" queries have 98% resolution rate.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Training Opportunity
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Add more examples for "refund process" - currently at 72% accuracy.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View All Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - 2 cols */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          {/* Bot Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Bot Status</span>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="default" className="bg-green-600">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="text-sm font-medium">v2.4.1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last trained</span>
                  <span className="text-sm font-medium">2 days ago</span>
                </div>
              </div>
              <Button className="w-full mt-4" size="sm">
                <Bot className="mr-2 h-4 w-4" />
                Train Bot
              </Button>
            </CardContent>
          </Card>

          {/* Language Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Language Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { lang: "English", percentage: 65, color: "bg-blue-500" },
                  { lang: "Spanish", percentage: 20, color: "bg-green-500" },
                  { lang: "French", percentage: 10, color: "bg-purple-500" },
                  { lang: "German", percentage: 3, color: "bg-orange-500" },
                  { lang: "Other", percentage: 2, color: "bg-gray-500" },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.lang}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today's Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-xs text-muted-foreground">Satisfaction</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Zap className="h-8 w-8 text-purple-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold">1.2s</div>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold">342</div>
                  <p className="text-xs text-muted-foreground">Conversations</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold">$892</div>
                  <p className="text-xs text-muted-foreground">Cost Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}