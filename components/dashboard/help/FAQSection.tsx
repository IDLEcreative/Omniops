// FAQ accordion component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HelpCircle, ChevronDown, ChevronRight, Search } from "lucide-react";
import type { FAQ } from "@/lib/dashboard/help-utils";

interface FAQItemProps {
  faq: FAQ;
  index: number;
  isExpanded: boolean;
  onToggle: (index: number | null) => void;
}

function FAQItem({ faq, index, isExpanded, onToggle }: FAQItemProps) {
  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={(open) => onToggle(open ? index : null)}
    >
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                {isExpanded ?
                  <ChevronDown className="h-4 w-4" /> :
                  <ChevronRight className="h-4 w-4" />
                }
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <p className="text-muted-foreground">{faq.answer}</p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface FAQSectionProps {
  faqs: FAQ[];
  expandedFAQ: number | null;
  onToggleFAQ: (index: number | null) => void;
}

export function FAQSection({ faqs, expandedFAQ, onToggleFAQ }: FAQSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HelpCircle className="h-5 w-5 mr-2" />
          Frequently Asked Questions
        </CardTitle>
        <CardDescription>Quick answers to common questions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isExpanded={expandedFAQ === index}
              onToggle={onToggleFAQ}
            />
          ))}
        </div>

        {faqs.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No FAQs found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
