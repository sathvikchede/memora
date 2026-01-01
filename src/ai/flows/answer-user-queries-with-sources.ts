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

const AnswerUserQueryInputSchema = z.object({
  query: z.string().describe('The user query.'),
  summaries: z.array(z.string()).describe('The relevant summaries.'),
  sources: z.array(z.object({
    contributor: z.string().describe('The contributor of the information.'),
    rawInformation: z.string().describe('The raw information contributed.'),
    date: z.string().describe('The date of the information input.'),
    type: z.string().describe('The type of information entry (add, help, message).'),
  })).describe('The sources of the summaries.'),
});
export type AnswerUserQueryInput = z.infer<typeof AnswerUserQueryInputSchema>;

const AnswerUserQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query.'),
  sources: z.array(z.object({
    contributor: z.string().describe('The contributor of the information.'),
    rawInformation: z.string().describe('The raw information contributed.'),
    date: z.string().describe('The date of the information input.'),
    type: z.string().describe('The type of information entry (add, help, message).'),
  })).describe('The sources used to generate the answer.'),
});
export type AnswerUserQueryOutput = z.infer<typeof AnswerUserQueryOutputSchema>;

export async function answerUserQuery(input: AnswerUserQueryInput): Promise<AnswerUserQueryOutput> {
  return answerUserQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerUserQueryPrompt',
  input: {schema: AnswerUserQueryInputSchema},
  output: {schema: AnswerUserQueryOutputSchema},
  prompt: `You are an AI assistant that answers user queries based on provided summaries and sources.

  Summaries:
  {{#each summaries}}
  - {{{this}}}
  {{/each}}

  Sources:
  {{#each sources}}
  - Contributor: {{{contributor}}}, Raw Information: {{{rawInformation}}}, Date: {{{date}}}, Type: {{{type}}}
  {{/each}}

  Query: {{{query}}}

  Answer:`, // Handlebars templating
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
      answer: output?.answer || 'No answer could be generated based on the provided information.',
      sources: input.sources,
    };
  }
);
