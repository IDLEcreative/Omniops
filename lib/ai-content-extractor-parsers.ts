import * as cheerio from 'cheerio';

/**
 * Content parsing, cleaning, and formatting utilities
 * Handles compression, summarization, and content optimization
 */
export class ContentParsers {
  /**
   * Compress content using various techniques
   */
  static compressContent(content: string): { compressedContent: string; deduplicatedCount: number } {
    let compressed = content;
    let deduplicatedCount = 0;

    // Remove redundant whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();

    // Remove redundant adjectives and filler words
    const fillerWords = [
      'very', 'really', 'quite', 'rather', 'extremely', 'incredibly', 'absolutely',
      'definitely', 'certainly', 'obviously', 'clearly', 'basically', 'essentially',
      'actually', 'literally', 'simply', 'just', 'only', 'even', 'still', 'yet'
    ];

    const fillerPattern = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
    compressed = compressed.replace(fillerPattern, '');

    // Consolidate similar sentences
    const sentences = compressed.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const uniqueSentences = new Set<string>();
    const consolidatedSentences: string[] = [];

    sentences.forEach(sentence => {
      const normalized = this.normalizeSentence(sentence);
      let isDuplicate = false;

      for (const existing of uniqueSentences) {
        if (this.calculateSimilarity(normalized, existing) > 0.85) {
          isDuplicate = true;
          deduplicatedCount++;
          break;
        }
      }

      if (!isDuplicate) {
        uniqueSentences.add(normalized);
        consolidatedSentences.push(sentence.trim());
      }
    });

    compressed = consolidatedSentences.join('. ') + '.';

    // Convert lists to more concise formats
    compressed = this.compressLists(compressed);

    // Final cleanup
    compressed = compressed.replace(/\s+/g, ' ').trim();

    return { compressedContent: compressed, deduplicatedCount };
  }

  /**
   * Compress list formats
   */
  static compressLists(content: string): string {
    let compressed = content;

    // Convert "- Item one\n- Item two\n- Item three" to "Items: one, two, three"
    compressed = compressed.replace(
      /(?:^|\n)(?:-|\*|\d+\.) (.+?)(?=(?:\n(?:-|\*|\d+\.))|$)/gm,
      (match, item) => item.trim() + ', '
    );

    // Clean up trailing commas
    compressed = compressed.replace(/, $/, '');

    return compressed;
  }

  /**
   * Generate a concise summary of the content
   */
  static generateSummary(textContent: string): string {
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20);

    if (sentences.length <= 3) {
      return sentences.join('. ').trim() + '.';
    }

    // Score sentences by length and position (earlier sentences get higher scores)
    const scoredSentences = sentences.map((sentence, index) => ({
      text: sentence.trim(),
      score: (sentence.length / 100) + (1 / (index + 1)) * 2
    }));

    // Sort by score and take top 3
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.text);

    return topSentences.join('. ') + '.';
  }

  /**
   * Extract key facts and figures from content
   */
  static extractKeyFacts(textContent: string): string[] {
    const facts: string[] = [];

    // Extract sentences with numbers, percentages, dates
    const factPatterns = [
      /\b\d+(?:\.\d+)?%\b/g, // Percentages
      /\b\d{4}\b/g, // Years
      /\$[\d,]+(?:\.\d{2})?\b/g, // Money
      /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand|k|m|b)\b/gi, // Large numbers
      /\b\d+(?:\.\d+)?\s*(?:seconds|minutes|hours|days|weeks|months|years)\b/gi // Time
    ];

    const sentences = textContent.split(/[.!?]+/);
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 20) {
        factPatterns.forEach(pattern => {
          if (pattern.test(trimmed)) {
            facts.push(trimmed);
          }
        });
      }
    });

    // Remove duplicates and limit to 10 facts
    return Array.from(new Set(facts)).slice(0, 10);
  }

  /**
   * Extract Q&A pairs from FAQ sections
   */
  static extractQAPairs($: cheerio.CheerioAPI): Array<{ question: string; answer: string }> {
    const qaPairs: Array<{ question: string; answer: string }> = [];

    // Look for common Q&A patterns
    const qaSelectors = [
      '.faq-item', '.qa-item', '.question-answer',
      '.accordion-item', '.collapsible-item'
    ];

    qaSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $element = $(element);

        // Try different patterns for questions and answers
        let question = $element.find('.question, .q, h3, h4, h5').first().text().trim();
        let answer = $element.find('.answer, .a, p').first().text().trim();

        if (!question || !answer) {
          // Try alternative pattern: look for strong/bold text followed by regular text
          const strongText = $element.find('strong, b').first().text().trim();
          if (strongText && strongText.length > 10) {
            question = strongText;
            answer = $element.text().replace(strongText, '').trim();
          }
        }

        if (question && answer && question.length > 10 && answer.length > 20) {
          qaPairs.push({
            question: question.replace(/[?]*$/, '?'),
            answer: this.cleanAndCompress(answer)
          });
        }
      });
    });

    return qaPairs.slice(0, 20); // Limit to 20 Q&A pairs
  }

  /**
   * Generate topic tags automatically
   */
  static generateTopicTags(textContent: string, metadata: Record<string, any>): string[] {
    const tags = new Set<string>();

    // Extract from metadata keywords
    if (metadata.keywords) {
      const keywordString = typeof metadata.keywords === 'string' ? metadata.keywords : String(metadata.keywords);
      keywordString.split(/[,;]/).forEach(keyword => {
        const cleaned = keyword.trim().toLowerCase();
        if (cleaned.length > 2 && cleaned.length < 30) {
          tags.add(cleaned);
        }
      });
    }

    // Extract common technical terms and industry keywords
    const commonTerms = [
      'api', 'software', 'service', 'product', 'support', 'customer', 'business',
      'integration', 'solution', 'platform', 'system', 'application', 'data',
      'security', 'payment', 'ecommerce', 'retail', 'analytics', 'dashboard',
      'mobile', 'web', 'cloud', 'saas', 'automation', 'workflow', 'enterprise'
    ];

    const lowerContent = textContent.toLowerCase();
    commonTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        tags.add(term);
      }
    });

    // Extract capitalized words (likely proper nouns/brands)
    const capitalizedWords = textContent.match(/\b[A-Z][a-z]+\b/g) || [];
    capitalizedWords.forEach(word => {
      if (word.length > 3 && word.length < 20) {
        tags.add(word.toLowerCase());
      }
    });

    return Array.from(tags).slice(0, 15); // Limit to 15 tags
  }

  /**
   * Estimate token count using word-based approximation
   * This is a simplified version - for production, consider using tiktoken
   */
  static estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 0.75 words for English text
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 0.75);
  }

  /**
   * Strip markdown formatting
   */
  static stripMarkdown(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/^#+\s*/gm, '') // Headers
      .replace(/^[-*+]\s*/gm, '') // Lists
      .trim();
  }

  /**
   * Normalize sentence for comparison
   */
  static normalizeSentence(sentence: string): string {
    return sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate similarity between two texts
   */
  static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Clean and compress content
   */
  private static cleanAndCompress(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }
}
