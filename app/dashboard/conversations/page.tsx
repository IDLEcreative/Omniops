"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  User,
  Bot,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
} from "lucide-react";

const conversations = [
  {
    id: "1",
    customer: {
      name: "Alice Johnson",
      email: "alice@example.com",
      avatar: "/avatars/alice.jpg",
    },
    status: "active",
    priority: "high",
    language: "EN",
    lastMessage: "I need help with my recent order #12345",
    lastMessageTime: "2 min ago",
    unreadCount: 3,
    assignedTo: "AI Bot",
    tags: ["order-inquiry", "urgent"],
    satisfaction: null,
  },
  {
    id: "2",
    customer: {
      name: "Bob Smith",
      email: "bob@example.com",
      avatar: "/avatars/bob.jpg",
    },
    status: "waiting",
    priority: "medium",
    language: "EN",
    lastMessage: "The payment process is not working properly",
    lastMessageTime: "5 min ago",
    unreadCount: 1,
    assignedTo: "AI Bot",
    tags: ["payment", "technical"],
    satisfaction: null,
  },
  {
    id: "3",
    customer: {
      name: "Carlos Rodriguez",
      email: "carlos@example.com",
      avatar: "/avatars/carlos.jpg",
    },
    status: "resolved",
    priority: "low",
    language: "ES",
    lastMessage: "Gracias por la ayuda!",
    lastMessageTime: "1 hour ago",
    unreadCount: 0,
    assignedTo: "AI Bot",
    tags: ["resolved"],
    satisfaction: "positive",
  },
];

const messages = [
  {
    id: "1",
    sender: "customer",
    content: "Hi, I need help with my recent order #12345",
    timestamp: "10:23 AM",
  },
  {
    id: "2",
    sender: "bot",
    content: "Hello Alice! I'd be happy to help you with order #12345. Let me look that up for you.",
    timestamp: "10:23 AM",
  },
  {
    id: "3",
    sender: "bot",
    content: "I found your order. It was placed on January 20th and is currently in transit. Your tracking number is TRK123456789.",
    timestamp: "10:24 AM",
  },
  {
    id: "4",
    sender: "customer",
    content: "When will it arrive? I need it by Friday.",
    timestamp: "10:25 AM",
  },
  {
    id: "5",
    sender: "bot",
    content: "Based on the tracking information, your order is scheduled to arrive on Thursday, January 25th. It should arrive before your Friday deadline.",
    timestamp: "10:25 AM",
  },
];

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messageInput, setMessageInput] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />;
      case "waiting":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "secondary";
      case "waiting":
        return "outline";
      case "resolved":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation List */}
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Conversations</h2>
          
          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
              />
            </div>
            
            <div className="flex space-x-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 px-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            <TabsTrigger value="mine">Mine</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedConversation?.id === conversation.id
                      ? "bg-gray-50 dark:bg-gray-800"
                      : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarImage src={conversation.customer.avatar} />
                      <AvatarFallback>
                        {conversation.customer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conversation.customer.name}
                        </p>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessageTime}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(conversation.status)}
                          <Badge variant={getStatusColor(conversation.status) as any} className="text-xs">
                            {conversation.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {conversation.language}
                          </Badge>
                          {conversation.priority === "high" && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Conversation Detail */}
      <div className="flex-1 flex flex-col">
        {/* Conversation Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={selectedConversation?.customer?.avatar} />
                <AvatarFallback>
                  {selectedConversation?.customer?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{selectedConversation?.customer?.name}</h3>
                  {selectedConversation && getStatusIcon(selectedConversation.status)}
                </div>
                <p className="text-sm text-gray-500">{selectedConversation?.customer?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Assign to Human
              </Button>
              <Button variant="outline" size="sm">
                Mark Resolved
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex items-center space-x-2 mt-3">
            {selectedConversation?.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              + Add tag
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "customer" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-lg px-4 py-2 rounded-lg ${
                    message.sender === "customer"
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === "bot" && <Bot className="h-4 w-4" />}
                    <span className="text-xs opacity-75">{message.timestamp}</span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="icon">
              <Smile className="h-4 w-4" />
            </Button>
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Customer Info Sidebar */}
      <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-4">Customer Information</h3>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm">{selectedConversation?.customer?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Language</p>
                <p className="text-sm">English (US)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Time Zone</p>
                <p className="text-sm">PST (UTC-8)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Previous Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="font-medium">Order inquiry</p>
                  <p className="text-xs text-gray-500">Resolved - 3 days ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Technical support</p>
                  <p className="text-xs text-gray-500">Resolved - 1 week ago</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Customer Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total conversations</span>
                  <span>12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg. response time</span>
                  <span>2.3 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Satisfaction</span>
                  <span className="text-green-600">95%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}