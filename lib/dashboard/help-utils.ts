// Help utilities for search, filtering, and data management
export interface HelpArticle {
  id: number;
  title: string;
  category: string;
  readTime: string;
  popular: boolean;
  excerpt: string;
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export interface QuickLink {
  title: string;
  icon: any;
  href: string;
  description: string;
}

// Filter articles based on search query
export function filterArticles(articles: HelpArticle[], query: string): HelpArticle[] {
  if (!query) return articles;

  const lowerQuery = query.toLowerCase();
  return articles.filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.category.toLowerCase().includes(lowerQuery) ||
    article.excerpt.toLowerCase().includes(lowerQuery)
  );
}

// Filter FAQs based on search and category
export function filterFAQs(faqs: FAQ[], query: string, category: string): FAQ[] {
  return faqs.filter(faq => {
    const matchesCategory = category === "all" || faq.category.toLowerCase() === category.toLowerCase();
    const matchesQuery = !query ||
      faq.question.toLowerCase().includes(query.toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.toLowerCase());

    return matchesCategory && matchesQuery;
  });
}

// Extract unique categories from FAQ data
export function extractCategories(faqs: FAQ[]): string[] {
  return ["all", ...Array.from(new Set(faqs.map(faq => faq.category)))];
}

// Get popular articles
export function getPopularArticles(articles: HelpArticle[]): HelpArticle[] {
  return articles.filter(article => article.popular);
}
