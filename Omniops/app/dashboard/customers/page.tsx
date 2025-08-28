"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Search, UserPlus, Download, Star, MessageSquare, 
  Clock, Edit, Trash2, Eye, TrendingUp, MoreVertical
} from "lucide-react";

// Mock customer data
const customers = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    status: "active",
    lastSeen: "2 hours ago",
    totalConversations: 24,
    satisfaction: 96,
    joinDate: "2024-01-15"
  },
  {
    id: "2",
    name: "Bob Smith", 
    email: "bob.smith@example.com",
    status: "active",
    lastSeen: "1 day ago",
    totalConversations: 8,
    satisfaction: 87,
    joinDate: "2024-02-20"
  },
  {
    id: "3",
    name: "Carlos Rodriguez",
    email: "carlos@example.com",
    status: "inactive", 
    lastSeen: "1 week ago",
    totalConversations: 45,
    satisfaction: 92,
    joinDate: "2023-11-10"
  },
  {
    id: "4",
    name: "Diana Chen",
    email: "diana.chen@example.com",
    status: "active",
    lastSeen: "30 min ago", 
    totalConversations: 15,
    satisfaction: 94,
    joinDate: "2024-03-05"
  },
  {
    id: "5",
    name: "Edward Wilson",
    email: "edward@example.com",
    status: "inactive",
    lastSeen: "3 days ago",
    totalConversations: 32,
    satisfaction: 89,
    joinDate: "2023-12-08"
  }
];

const stats = [
  {
    name: "Total Customers",
    value: "2,847",
    change: "+12.3%",
    icon: Users,
  },
  {
    name: "Active This Month", 
    value: "1,924",
    change: "+8.1%",
    icon: TrendingUp,
  },
  {
    name: "Avg Satisfaction",
    value: "91.7%", 
    change: "+2.4%",
    icon: Star,
  },
  {
    name: "Total Conversations",
    value: "12,483",
    change: "+15.2%",
    icon: MessageSquare,
  },
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const getSatisfactionColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and analyze your customer interactions and relationships
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>
                Manage your customer database and interactions
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{customer.name}</h4>
                        <Badge variant={getStatusColor(customer.status) as any}>
                          {customer.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {customer.lastSeen}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {customer.totalConversations} conversations
                        </div>
                        <div className={`flex items-center font-medium ${getSatisfactionColor(customer.satisfaction)}`}>
                          <Star className="h-3 w-3 mr-1" />
                          {customer.satisfaction}% satisfaction
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Edit Customer">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Delete Customer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}