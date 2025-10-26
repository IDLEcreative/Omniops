"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle } from "lucide-react";

// Components
import { SearchBar } from "@/components/dashboard/help/SearchBar";
import { QuickLinks } from "@/components/dashboard/help/QuickLinks";
import { PopularArticles, AllArticles } from "@/components/dashboard/help/ArticleView";
import { FAQSection } from "@/components/dashboard/help/FAQSection";
import { CategoryList } from "@/components/dashboard/help/CategoryList";
import { APIDocumentation } from "@/components/dashboard/help/APIDocumentation";
import { ContactSupport } from "@/components/dashboard/help/ContactSupport";

// Data and utilities
import { helpArticles, faqData, quickLinks } from "@/lib/dashboard/help-data";
import {
  filterArticles,
  filterFAQs,
  extractCategories,
  getPopularArticles,
} from "@/lib/dashboard/help-utils";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Apply filters
  const filteredArticles = filterArticles(helpArticles, searchQuery);
  const filteredFAQs = filterFAQs(faqData, searchQuery, selectedCategory);
  const popularArticles = getPopularArticles(filteredArticles);
  const categories = extractCategories(faqData);

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Help & Documentation</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Everything you need to know about using Omniops
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Quick Links */}
      <QuickLinks links={quickLinks} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="api-docs">API Docs</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-6">
          <div className="grid gap-6">
            <PopularArticles articles={popularArticles} />
            <AllArticles articles={filteredArticles} />
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <FAQSection
            faqs={filteredFAQs}
            expandedFAQ={expandedFAQ}
            onToggleFAQ={setExpandedFAQ}
          />
          <CategoryList
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </TabsContent>

        {/* API Documentation Tab */}
        <TabsContent value="api-docs" className="space-y-6">
          <APIDocumentation />
        </TabsContent>

        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-6">
          <ContactSupport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
