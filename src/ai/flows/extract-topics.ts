'use server';

/**
 * @fileOverview Extracts topics from user entries for topic-level source tracking.
 *
 * - extractTopicsFromEntry - Analyzes an entry and extracts domain, subtopic, and topics.
 * - ExtractTopicsInput - Input type for the function.
 * - ExtractTopicsOutput - Output type with extracted topics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for individual extracted topics
const TopicSchema = z.object({
  topic_key: z.string().describe('Snake case identifier for the topic (e.g., "interview_rounds", "technical_tips")'),
  topic_label: z.string().describe('Human-readable label for the topic'),
  extracted_info: z.string().describe('Concise fact or insight from the entry for this topic'),
});

// Input schema
const ExtractTopicsInputSchema = z.object({
  entry_content: z.string().describe('The content of the entry to analyze'),
  existing_domains: z.array(z.string()).optional().describe('List of existing domains to prefer if applicable'),
});

// Input type for the server action (interface is erased at compile time)
export interface ExtractTopicsInput {
  entry_content: string;
  existing_domains?: string[];
}

// Output schema
const ExtractTopicsOutputSchema = z.object({
  domain: z.string().describe('Primary category (e.g., company name, academic_process, career)'),
  subtopic: z.string().describe('Specific area within domain (e.g., interviews, coursework, internships)'),
  topics: z.array(TopicSchema).describe('List of extracted topics with their information'),
  confidence: z.number().min(0).max(1).describe('Confidence score for the extraction (0.0-1.0)'),
});

// Output type for the server action (interface is erased at compile time)
export interface TopicInfo {
  topic_key: string;
  topic_label: string;
  extracted_info: string;
}

export interface ExtractTopicsOutput {
  domain: string;
  subtopic: string;
  topics: TopicInfo[];
  confidence: number;
}

// Define the prompt
const extractTopicsPrompt = ai.definePrompt({
  name: 'extractTopicsPrompt',
  input: { schema: ExtractTopicsInputSchema },
  output: { schema: ExtractTopicsOutputSchema },
  prompt: `You are analyzing a student experience entry for Memora AI, a knowledge management system for sharing academic and professional experiences.

ENTRY:
"""
{{{entry_content}}}
"""

{{#if existing_domains}}
EXISTING DOMAINS (use if applicable, or suggest new):
{{#each existing_domains}}
- {{{this}}}
{{/each}}
{{/if}}

Extract the following information in JSON format:
- domain: The primary category (e.g., company names like "google", "amazon"; or categories like "academic", "career", "research")
- subtopic: The specific area within the domain (e.g., "interviews", "internship", "coursework", "projects")
- topics: An array of specific topics found in the entry
- confidence: How confident you are in this extraction (0.0-1.0)

RULES:
1. topic_key should be reusable and generic (e.g., "interview_rounds" not "johns_interview_rounds")
2. extracted_info should be factual, not opinions unless clearly marked as such
3. Maximum 5 topics per entry
4. If the entry is too vague or doesn't contain useful information, return confidence < 0.3
5. Domain and subtopic should be lowercase with underscores instead of spaces
6. Focus on extracting actionable, shareable knowledge

EXAMPLES of good topic_keys:
- interview_structure
- technical_rounds
- behavioral_questions
- application_timeline
- compensation_details
- team_culture
- project_experience
- course_difficulty
- professor_teaching_style
- career_advice

Return your analysis as a JSON object.`,
});

// Define the flow
const extractTopicsFlow = ai.defineFlow(
  {
    name: 'extractTopicsFlow',
    inputSchema: ExtractTopicsInputSchema,
    outputSchema: ExtractTopicsOutputSchema,
  },
  async (input) => {
    // Don't process empty entries
    if (!input.entry_content || input.entry_content.trim().length < 10) {
      return {
        domain: 'general',
        subtopic: 'uncategorized',
        topics: [],
        confidence: 0.1,
      };
    }

    const { output } = await extractTopicsPrompt(input);

    if (!output) {
      return {
        domain: 'general',
        subtopic: 'uncategorized',
        topics: [],
        confidence: 0.1,
      };
    }

    // Normalize domain and subtopic to lowercase with underscores
    return {
      ...output,
      domain: output.domain.toLowerCase().replace(/\s+/g, '_'),
      subtopic: output.subtopic.toLowerCase().replace(/\s+/g, '_'),
    };
  }
);

/**
 * Extract topics from an entry for topic-level source tracking.
 */
export async function extractTopicsFromEntry(input: ExtractTopicsInput): Promise<ExtractTopicsOutput> {
  return extractTopicsFlow(input);
}
