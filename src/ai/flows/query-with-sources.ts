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

// Output type for the server action
export interface QueryWithSourcesOutput {
  answer: string;
  summaries_used: string[];
  topics_referenced: Record<string, string[]>;
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

const QueryWithSourcesOutputSchema = z.object({
  answer: z.string().describe('The answer to the query. Empty string if no relevant info found.'),
  summaries_used: z.array(z.string()).describe('Summary IDs that were used'),
  topics_referenced: z
    .record(z.string(), z.array(z.string()))
    .describe('Map of summary_id to array of topic_keys used'),
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
- topics_referenced: Object mapping summary_id to array of topic_keys you used
- confidence: Your confidence in the answer (0.0-1.0)
- insufficient_info: true if you couldn't find relevant information`,
});

// Define the flow
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
        topics_referenced: {},
        confidence: 0,
        insufficient_info: true,
      };
    }

    const { output } = await queryWithSourcesPrompt(input);

    if (!output) {
      return {
        answer: '',
        summaries_used: [],
        topics_referenced: {},
        confidence: 0,
        insufficient_info: true,
      };
    }

    return output;
  }
);

/**
 * Server action to query the AI with summaries.
 * Called from the client-side query handler.
 */
export async function queryWithSources(input: QueryWithSourcesInput): Promise<QueryWithSourcesOutput> {
  return queryWithSourcesFlow(input);
}
