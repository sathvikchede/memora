'use server';

/**
 * @fileOverview AI flow for answering queries with source attribution.
 * Server action that can be called from client-side code.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input/Output types (not exported as objects, just used internally)
interface SummaryForQuery {
  summary_id: string;
  domain: string;
  subtopic: string;
  content: string;
  topics: string[];
}

// Input type for the server action
export interface QueryWithSourcesInput {
  query: string;
  summaries: SummaryForQuery[];
}

// Topic reference structure (used instead of Record for Gemini compatibility)
export interface TopicReference {
  summary_id: string;
  topic_keys: string[];
}

// Output type for the server action
export interface QueryWithSourcesOutput {
  answer: string;
  summaries_used: string[];
  topics_referenced: Record<string, string[]>; // Converted from array after AI call
  confidence: number;
  insufficient_info: boolean;
}

// Internal output from AI (uses array instead of Record for Gemini compatibility)
interface QueryWithSourcesAIOutput {
  answer: string;
  summaries_used: string[];
  topics_referenced: TopicReference[];
  confidence: number;
  insufficient_info: boolean;
}

// Internal schemas for Genkit (not exported)
const QueryWithSourcesInputSchema = z.object({
  query: z.string().describe('The user query'),
  summaries: z
    .array(
      z.object({
        summary_id: z.string(),
        domain: z.string(),
        subtopic: z.string(),
        content: z.string(),
        topics: z.array(z.string()),
      })
    )
    .describe('Available summaries to search'),
});

// Schema for topic references (array format for Gemini compatibility)
const TopicReferenceSchema = z.object({
  summary_id: z.string().describe('The summary ID'),
  topic_keys: z.array(z.string()).describe('Topic keys used from this summary'),
});

const QueryWithSourcesOutputSchema = z.object({
  answer: z.string().describe('The answer to the query. Empty string if no relevant info found.'),
  summaries_used: z.array(z.string()).describe('Summary IDs that were used'),
  topics_referenced: z
    .array(TopicReferenceSchema)
    .describe('Array of summary IDs with their topic keys used'),
  confidence: z.number().min(0).max(1).describe('Confidence in the answer'),
  insufficient_info: z.boolean().describe('True if information was insufficient to answer'),
});

// Define the prompt
const queryWithSourcesPrompt = ai.definePrompt({
  name: 'queryWithSourcesPrompt',
  input: { schema: QueryWithSourcesInputSchema },
  output: { schema: QueryWithSourcesOutputSchema },
  prompt: `You are answering a student query using accumulated knowledge from Memora AI, a knowledge management system for sharing academic and professional experiences.

QUERY: "{{{query}}}"

AVAILABLE KNOWLEDGE:
{{#each summaries}}
---
[Summary ID: {{{summary_id}}}]
Domain: {{{domain}}} | Subtopic: {{{subtopic}}}
Topics: {{#each topics}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Content:
{{{content}}}
{{/each}}

INSTRUCTIONS:
1. Answer the query using ONLY the provided knowledge
2. Track which specific summaries and topics you reference
3. If information is insufficient to answer the query, set insufficient_info to true and return an empty answer
4. Be concise, helpful, and format your answer well using markdown
5. Do not make up information - only use what's in the summaries
6. If you can partially answer the question, do so and note what information is missing

Return a JSON object with:
- answer: Your answer text (use markdown formatting). Empty string if no relevant info.
- summaries_used: Array of summary_ids you referenced
- topics_referenced: Array of objects with {summary_id, topic_keys} for each summary you used
- confidence: Your confidence in the answer (0.0-1.0)
- insufficient_info: true if you couldn't find relevant information`,
});

// Define the flow (uses array format for topics_referenced for Gemini compatibility)
const queryWithSourcesFlow = ai.defineFlow(
  {
    name: 'queryWithSourcesFlow',
    inputSchema: QueryWithSourcesInputSchema,
    outputSchema: QueryWithSourcesOutputSchema,
  },
  async (input) => {
    // If no summaries, return insufficient info
    if (input.summaries.length === 0) {
      return {
        answer: '',
        summaries_used: [],
        topics_referenced: [], // Array format for flow
        confidence: 0,
        insufficient_info: true,
      };
    }

    const { output } = await queryWithSourcesPrompt(input);

    if (!output) {
      return {
        answer: '',
        summaries_used: [],
        topics_referenced: [], // Array format for flow
        confidence: 0,
        insufficient_info: true,
      };
    }

    return output;
  }
);

/**
 * Convert array format topics_referenced to Record format.
 */
function convertTopicsToRecord(topics: TopicReference[]): Record<string, string[]> {
  const record: Record<string, string[]> = {};
  for (const topic of topics) {
    record[topic.summary_id] = topic.topic_keys;
  }
  return record;
}

/**
 * Server action to query the AI with summaries.
 * Called from the client-side query handler.
 */
export async function queryWithSources(input: QueryWithSourcesInput): Promise<QueryWithSourcesOutput> {
  const flowResult = await queryWithSourcesFlow(input);

  // Convert topics_referenced from array to Record format for the rest of the code
  return {
    ...flowResult,
    topics_referenced: convertTopicsToRecord(flowResult.topics_referenced as unknown as TopicReference[]),
  };
}
