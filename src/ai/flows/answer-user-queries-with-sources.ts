
'use server';

/**
 * @fileOverview Answers user queries based on relevant summaries, providing sources, contributors, and dates.
 *
 * - answerUserQuery - A function that answers user queries with sources.
 * - AnswerUserQueryInput - The input type for the answerUserQuery function.
 * - AnswerUserQueryOutput - The return type for the answerUserQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SourceSchema = z.object({
  contributor: z.string().describe('The contributor of the information.'),
  rawInformation: z.string().describe('The raw information contributed.'),
  date: z.string().describe('The date of the information input.'),
  type: z.string().describe('The type of information entry (add, help, message).'),
});

const AnswerUserQueryInputSchema = z.object({
  query: z.string().describe('The user query.'),
  summaries: z.array(z.string()).describe('The relevant summaries.'),
  sources: z.array(SourceSchema).describe('The sources of the summaries.'),
});
export type AnswerUserQueryInput = z.infer<typeof AnswerUserQueryInputSchema>;

const AnswerUserQueryOutputSchema = z.object({
  answer: z.string().describe("The answer to the user query. If no relevant information is found, this should be an empty string."),
  sources: z.array(SourceSchema).describe('The sources used to generate the answer. If no answer is generated, this should be an empty array.'),
});
export type AnswerUserQueryOutput = z.infer<typeof AnswerUserQueryOutputSchema>;

export async function answerUserQuery(input: AnswerUserQueryInput): Promise<AnswerUserQueryOutput> {
  return answerUserQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerUserQueryPrompt',
  input: {schema: AnswerUserQueryInputSchema},
  output: {schema: AnswerUserQueryOutputSchema},
  prompt: `You are an AI assistant. Your task is to answer the user's query based ONLY on the provided summaries.

- Synthesize the information from the summaries to create a comprehensive answer.
- After creating the answer, identify which of the "Available Sources" were used.
- If the summaries do not contain information to answer the query, return an empty string for the "answer" field and an empty array for the "sources" field.

Query: {{{query}}}

Summaries:
{{#each summaries}}
- {{{this}}}
{{/each}}

Available Sources:
{{#each sources}}
- Contributor: {{{contributor}}}, Raw Information: {{{rawInformation}}}, Date: {{{date}}}, Type: {{{type}}}
{{/each}}`,
});

const answerUserQueryFlow = ai.defineFlow(
  {
    name: 'answerUserQueryFlow',
    inputSchema: AnswerUserQueryInputSchema,
    outputSchema: AnswerUserQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || { answer: '', sources: [] };
  }
);
