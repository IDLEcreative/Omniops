// Help article display components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Star, BookOpen } from "lucide-react";
import type { HelpArticle } from "@/lib/dashboard/help-utils";

interface ArticleCardProps {
  article: HelpArticle;
  onArticleClick?: (article: HelpArticle) => void;
}

export function ArticleCard({ article, onArticleClick }: ArticleCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onArticleClick?.(article)}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">{article.category}</Badge>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {article.readTime}
            </div>
          </div>
          <h3 className="font-medium leading-tight">{article.title}</h3>
          <p className="text-sm text-muted-foreground">{article.excerpt}</p>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-1">
              {article.popular && <Star className="h-3 w-3 text-yellow-500" />}
            </div>
            <Button variant="ghost" size="sm">
              Read More <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PopularArticlesProps {
  articles: HelpArticle[];
  onArticleClick?: (article: HelpArticle) => void;
}

export function PopularArticles({ articles, onArticleClick }: PopularArticlesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          Popular Articles
        </CardTitle>
        <CardDescription>Most viewed help articles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => onArticleClick?.(article)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium">{article.title}</h3>
                  <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{article.excerpt}</p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {article.readTime}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface AllArticlesProps {
  articles: HelpArticle[];
  onArticleClick?: (article: HelpArticle) => void;
}

export function AllArticles({ articles, onArticleClick }: AllArticlesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          All Articles
        </CardTitle>
        <CardDescription>Browse all help documentation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} onArticleClick={onArticleClick} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
