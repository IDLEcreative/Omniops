/**
 * AI Metadata Generator - Usage Examples
 *
 * Contains example usage patterns for the AI metadata generator.
 * Extracted from ai-metadata-generator.ts for modularity.
 */

import { AIMetadataGenerator } from './ai-metadata-generator';
import { calculateCosineSimilarity } from './ai-metadata-generator-validators';

/**
 * Usage Examples
 */
export class MetadataExamples {
  static async basicUsage() {
    const generator = new AIMetadataGenerator('your-openai-api-key');

    const content = `
    Our customer service platform provides 24/7 support through multiple channels.
    Customers can reach us via email, phone, or live chat. We guarantee response
    times of under 2 hours for all inquiries. Our team is trained to handle
    technical issues, billing questions, and general product information.

    FAQ:
    Q: What are your support hours?
    A: We provide 24/7 support through all channels.

    Q: How quickly do you respond?
    A: We guarantee responses within 2 hours.
    `;

    const metadata = await generator.generateMetadata(content, {
      maxKeywords: 15,
      maxQuestions: 5,
      includeEmbeddings: true
    });

    console.log('Generated Metadata:', {
      summary: metadata.summary,
      briefSummary: metadata.briefSummary,
      contentType: metadata.contentType,
      topics: metadata.topics,
      sentiment: metadata.sentiment,
      questionsCount: metadata.answerableQuestions.length,
      qualityScore: metadata.quality.overall
    });

    return metadata;
  }

  static async batchProcessing() {
    const generator = new AIMetadataGenerator('your-openai-api-key');

    const documents = [
      'Product documentation content...',
      'FAQ content...',
      'Support article content...'
    ];

    const results = await Promise.all(
      documents.map(content => generator.generateMetadata(content))
    );

    console.log(`Processed ${results.length} documents`);
    return results;
  }

  static async searchOptimization() {
    const generator = new AIMetadataGenerator('your-openai-api-key');

    const content = 'Your content here...';
    const metadata = await generator.generateMetadata(content);

    // Use embeddings for similarity search
    const similarity = calculateCosineSimilarity(
      metadata.embeddings.summary,
      []
    );

    console.log('Content similarity to query:', similarity);
    return { metadata, similarity };
  }
}
