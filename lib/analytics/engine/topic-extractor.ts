/**
 * Topic Extractor
 *
 * Extracts topics, keywords, and categories from conversations:
 * - Primary topic identification via keyword matching
 * - Product and order mention extraction from metadata
 * - Support category classification
 * - Topic distribution calculation
 */

import { Message } from '@/types/database';
import { TopicMetrics } from '@/types/analytics';

export class TopicExtractor {
  /**
   * Extract topics and entities from conversation
   */
  public static extract(messages: Message[]): TopicMetrics {
    const allContent = messages.map(m => m.content.toLowerCase()).join(' ');

    // Extract product mentions from metadata
    const productMentions: string[] = [];
    const orderMentions: string[] = [];

    messages.forEach(message => {
      if (message.metadata?.products) {
        message.metadata.products.forEach(product => {
          if (!productMentions.includes(product.toString())) {
            productMentions.push(product.toString());
          }
        });
      }

      if (message.metadata?.orders) {
        message.metadata.orders.forEach(order => {
          if (!orderMentions.includes(order.toString())) {
            orderMentions.push(order.toString());
          }
        });
      }
    });

    // Categorize support topics
    const supportCategories = this.categorizeSupportTopics(allContent);

    // Extract primary topics (simplified keyword extraction)
    const primaryTopics = this.extractPrimaryTopics(allContent);

    return {
      primary_topics: primaryTopics,
      topic_distribution: this.calculateTopicDistribution(primaryTopics),
      product_mentions: productMentions,
      order_mentions: orderMentions,
      support_categories: supportCategories,
    };
  }

  private static extractPrimaryTopics(content: string): string[] {
    const keywords = [
      'order', 'shipping', 'delivery', 'return', 'refund', 'payment',
      'product', 'price', 'discount', 'coupon', 'account', 'login',
      'password', 'support', 'help', 'question', 'problem', 'issue'
    ];

    const found: string[] = [];
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        found.push(keyword);
      }
    });

    return found.slice(0, 5); // Top 5 topics
  }

  private static calculateTopicDistribution(topics: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    topics.forEach(topic => {
      distribution[topic] = (distribution[topic] || 0) + 1;
    });
    return distribution;
  }

  private static categorizeSupportTopics(content: string): string[] {
    const categories: string[] = [];

    if (content.includes('order') || content.includes('shipping')) {
      categories.push('Orders & Shipping');
    }
    if (content.includes('return') || content.includes('refund')) {
      categories.push('Returns & Refunds');
    }
    if (content.includes('payment') || content.includes('billing')) {
      categories.push('Payment & Billing');
    }
    if (content.includes('product') || content.includes('item')) {
      categories.push('Product Information');
    }
    if (content.includes('account') || content.includes('login')) {
      categories.push('Account Management');
    }

    return categories.length > 0 ? categories : ['General Support'];
  }
}
