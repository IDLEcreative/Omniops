/**
 * AI Metadata Generator - Prompt Templates
 *
 * Contains all AI prompt generation and system messages for metadata generation.
 * Extracted from ai-metadata-generator.ts for modularity.
 */

import OpenAI from 'openai';
import { Question } from './ai-metadata-generator-types';

/**
 * Generate brief summary using OpenAI (10-15 words)
 */
export async function generateBriefSummaryWithAI(
  openai: OpenAI,
  content: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Create a 10-15 word summary of this content:\n\n${content.slice(0, 2000)}`
      }],
      max_tokens: 50,
      temperature: 0.3
    });

    return response.choices[0]?.message?.content?.trim() || 'Content summary unavailable';
  } catch (error) {
    console.error('Error generating brief summary:', error);
    throw error;
  }
}

/**
 * Generate implicit questions using OpenAI
 */
export async function generateImplicitQuestionsWithAI(
  openai: OpenAI,
  content: string,
  maxQuestions: number
): Promise<Question[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Generate ${maxQuestions} relevant questions that can be answered from this content. For each question, provide the answer and indicate if it's factual, procedural, or conceptual:\n\n${content.slice(0, 3000)}`
      }],
      max_tokens: 1000,
      temperature: 0.3
    });

    const result = response.choices[0]?.message?.content || '';
    return parseGeneratedQuestions(result, content);
  } catch (error) {
    console.error('Error generating implicit questions:', error);
    return [];
  }
}

/**
 * Parse generated questions from AI response
 */
function parseGeneratedQuestions(generatedText: string, sourceContent: string): Question[] {
  const questions: Question[] = [];
  const lines = generatedText.split('\n').filter(line => line.trim());

  let currentQuestion = '';
  let currentAnswer = '';
  let currentType: Question['type'] = 'factual';

  for (const line of lines) {
    if (line.match(/^\d+\./)) {
      if (currentQuestion && currentAnswer) {
        questions.push({
          question: currentQuestion,
          answer: currentAnswer,
          confidence: 0.7,
          source: 'Generated from content analysis',
          type: currentType
        });
      }

      currentQuestion = line.replace(/^\d+\.\s*/, '').trim();
      currentAnswer = '';
      currentType = 'factual';
    } else if (line.toLowerCase().startsWith('answer:')) {
      currentAnswer = line.replace(/^answer:\s*/i, '').trim();
    } else if (line.toLowerCase().includes('procedural')) {
      currentType = 'procedural';
    } else if (line.toLowerCase().includes('conceptual')) {
      currentType = 'conceptual';
    }
  }

  // Add last question
  if (currentQuestion && currentAnswer) {
    questions.push({
      question: currentQuestion,
      answer: currentAnswer,
      confidence: 0.7,
      source: 'Generated from content analysis',
      type: currentType
    });
  }

  return questions;
}

/**
 * Generate embeddings for summary and keywords
 */
export async function generateEmbeddingsWithAI(
  openai: OpenAI,
  summary: string,
  keywords: string[],
  model: string
): Promise<{
  summary: number[];
  keywords: number[][];
  cached: boolean;
  model: string;
}> {
  try {
    // Generate summary embedding
    const summaryResponse = await openai.embeddings.create({
      model,
      input: summary,
    });

    // Generate keyword embeddings
    const keywordResponses = await Promise.all(
      keywords.slice(0, 10).map(keyword =>
        openai.embeddings.create({
          model,
          input: keyword,
        })
      )
    );

    return {
      summary: summaryResponse.data[0]?.embedding || [],
      keywords: keywordResponses.map(response => response.data[0]?.embedding || []),
      cached: false,
      model
    };
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return {
      summary: [],
      keywords: [],
      cached: false,
      model
    };
  }
}
