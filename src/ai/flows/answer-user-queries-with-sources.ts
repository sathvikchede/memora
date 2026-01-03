
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
  answer: z.string().describe('The answer to the user query.'),
  sources: z.array(SourceSchema).describe('The sources used to generate the answer.'),
});
export type AnswerUserQueryOutput = z.infer<typeof AnswerUserQueryOutputSchema>;

export async function answerUserQuery(input: AnswerUserQueryInput): Promise<AnswerUserQueryOutput> {
  return answerUserQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerUserQueryPrompt',
  input: {schema: AnswerUserQueryInputSchema},
  output: {schema: AnswerUserQueryOutputSchema},
  prompt: `You are an AI assistant that answers user queries based on provided summaries and sources. Your primary goal is to synthesize the information from the given summaries to formulate a comprehensive answer.

  When generating your answer, you MUST determine which of the provided sources were used to create the answer. You will then return only those specific sources in the output.
  
  If you cannot find a relevant answer from the provided summaries, you MUST return an empty string for the "answer" field and an empty array for the "sources" field. DO NOT make up an answer or explain that you don't have enough information.
  
  Please format the text with a clear structure. Use headings, subheadings, and lists (bulleted or numbered) where it makes sense to improve readability.

  Summaries:
  {{#each summaries}}
  - {{{this}}}
  {{/each}}

  Available Sources:
  {{#each sources}}
  - Contributor: {{{contributor}}}, Raw Information: {{{rawInformation}}}, Date: {{{date}}}, Type: {{{type}}}
  {{/each}}

  Query: {{{query}}}

  Based on the summaries, provide a detailed answer and identify the exact sources you used from the "Available Sources" list.`,
});

const answerUserQueryFlow = ai.defineFlow(
  {
    name: 'answerUserQueryFlow',
    inputSchema: AnswerUserQueryInputSchema,
    outputSchema: AnswerUserQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      answer: output?.answer || '',
      sources: output?.sources || [],
    };
  }
);
