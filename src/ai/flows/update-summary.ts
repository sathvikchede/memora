'use server';

/**
 * @fileOverview Updates existing summaries with new entry information using AI.
 *
 * - updateSummaryWithEntry - Merges new entry information into an existing summary.
 * - createNewSummary - Creates a new summary from an entry.
 * - UpdateSummaryInput - Input type for updating summaries.
 * - UpdateSummaryOutput - Output type with updated content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for topic info
const TopicInfoSchema = z.object({
  topic_key: z.string(),
  topic_label: z.string(),
  extracted_info: z.string(),
});

// Input schema for updating summary
const UpdateSummaryInputSchema = z.object({
  existing_summary_content: z.string().describe('The current summary content'),
  existing_topics: z.array(z.string()).describe('Current topic keys in the summary'),
  new_entry_content: z.string().describe('The new entry content to incorporate'),
  new_topics: z.array(TopicInfoSchema).describe('Topics extracted from the new entry'),
});

// Input type for the server action (interface is erased at compile time)
export interface TopicInfoInput {
  topic_key: string;
  topic_label: string;
  extracted_info: string;
}

export interface UpdateSummaryInput {
  existing_summary_content: string;
  existing_topics: string[];
  new_entry_content: string;
  new_topics: TopicInfoInput[];
}

// Output schema
const UpdateSummaryOutputSchema = z.object({
  updated_content: z.string().describe('The updated summary content'),
  topics_updated: z.array(z.string()).describe('Topic keys that were updated'),
  new_topics_added: z.array(z.string()).describe('New topic keys that were added'),
  merge_notes: z.string().describe('Brief note on what changed'),
});

// Output type for the server action (interface is erased at compile time)
export interface UpdateSummaryOutput {
  updated_content: string;
  topics_updated: string[];
  new_topics_added: string[];
  merge_notes: string;
}

// Define the prompt for updating summaries
const updateSummaryPrompt = ai.definePrompt({
  name: 'updateSummaryPrompt',
  input: { schema: UpdateSummaryInputSchema },
  output: { schema: UpdateSummaryOutputSchema },
  prompt: `You are updating a knowledge summary for Memora AI, a knowledge management system.

CURRENT SUMMARY:
"""
{{{existing_summary_content}}}
"""

CURRENT TOPICS:
{{#each existing_topics}}
- {{{this}}}
{{/each}}

NEW ENTRY TO INCORPORATE:
"""
{{{new_entry_content}}}
"""

NEW TOPICS EXTRACTED FROM ENTRY:
{{#each new_topics}}
- {{{topic_key}}}: {{{extracted_info}}}
{{/each}}

TASK:
1. Update the summary content to incorporate the new information
2. DO NOT duplicate existing information - refine/strengthen it instead
3. If the new entry contradicts existing info, note the variation (e.g., "Some students report X, while others experienced Y")
4. Keep the summary concise (max 500 words)
5. Maintain a neutral, informative tone
6. Structure the summary with clear sections if multiple topics are covered

Return a JSON object with:
- updated_content: The new summary text incorporating the new information
- topics_updated: Array of topic_keys that were updated with new info
- new_topics_added: Array of new topic_keys that didn't exist before
- merge_notes: Brief description of what was changed`,
});

// Define the flow
const updateSummaryFlow = ai.defineFlow(
  {
    name: 'updateSummaryFlow',
    inputSchema: UpdateSummaryInputSchema,
    outputSchema: UpdateSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await updateSummaryPrompt(input);

    if (!output) {
      // If AI fails, just append the new info
      return {
        updated_content: `${input.existing_summary_content}\n\nAdditional information: ${input.new_entry_content}`,
        topics_updated: [],
        new_topics_added: input.new_topics.map((t) => t.topic_key),
        merge_notes: 'Appended new information due to processing error',
      };
    }

    return output;
  }
);

/**
 * Update an existing summary with new entry information.
 */
export async function updateSummaryWithEntry(input: UpdateSummaryInput): Promise<UpdateSummaryOutput> {
  return updateSummaryFlow(input);
}

// ============ CREATE NEW SUMMARY ============

// Input schema for creating new summary
const CreateSummaryInputSchema = z.object({
  domain: z.string().describe('The domain for this summary'),
  subtopic: z.string().describe('The subtopic for this summary'),
  entry_content: z.string().describe('The entry content to create summary from'),
  topics: z.array(TopicInfoSchema).describe('Topics extracted from the entry'),
});

// Input type for the server action (interface is erased at compile time)
export interface CreateSummaryInput {
  domain: string;
  subtopic: string;
  entry_content: string;
  topics: TopicInfoInput[];
}

// Output schema for new summary
const CreateSummaryOutputSchema = z.object({
  summary_content: z.string().describe('The generated summary content'),
});

// Output type for the server action (interface is erased at compile time)
export interface CreateSummaryOutput {
  summary_content: string;
}

// Prompt for creating new summary
const createSummaryPrompt = ai.definePrompt({
  name: 'createSummaryPrompt',
  input: { schema: CreateSummaryInputSchema },
  output: { schema: CreateSummaryOutputSchema },
  prompt: `You are creating a new knowledge summary for Memora AI, a knowledge management system.

DOMAIN: {{{domain}}}
SUBTOPIC: {{{subtopic}}}

INITIAL ENTRY:
"""
{{{entry_content}}}
"""

TOPICS EXTRACTED:
{{#each topics}}
- {{{topic_key}}}: {{{extracted_info}}}
{{/each}}

TASK:
Create a concise, informative summary based on this entry. The summary should:
1. Be well-structured and easy to read
2. Focus on actionable, shareable knowledge
3. Be written in a neutral, informative tone
4. Use clear sections if multiple topics are covered
5. Be under 300 words for the initial version

This summary will grow as more entries are added, so focus on capturing the key points clearly.

Return a JSON object with:
- summary_content: The generated summary text`,
});

// Flow for creating new summary
const createSummaryFlow = ai.defineFlow(
  {
    name: 'createSummaryFlow',
    inputSchema: CreateSummaryInputSchema,
    outputSchema: CreateSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await createSummaryPrompt(input);

    if (!output) {
      // Fallback: just use the entry content
      return {
        summary_content: input.entry_content,
      };
    }

    return output;
  }
);

/**
 * Create a new summary from an entry.
 */
export async function createNewSummary(input: CreateSummaryInput): Promise<CreateSummaryOutput> {
  return createSummaryFlow(input);
}
