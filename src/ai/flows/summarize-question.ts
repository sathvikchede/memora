'use server';

/**
 * @fileOverview Summarizes a question into a single, concise sentence and removes markdown.
 *
 * - summarizeQuestion - A function that handles the question summarization.
 * - SummarizeQuestionInput - The input type for the summarizeQuestion function.
 * - SummarizeQuestionOutput - The return type for the summarizeQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeQuestionInputSchema = z.object({
  question: z.string().describe('The full text of the question, potentially with markdown.'),
});
export type SummarizeQuestionInput = z.infer<typeof SummarizeQuestionInputSchema>;

const SummarizeQuestionOutputSchema = z.object({
  summary: z.string().describe('A concise, one-sentence summary of the question with all markdown removed.'),
});
export type SummarizeQuestionOutput = z.infer<typeof SummarizeQuestionOutputSchema>;

export async function summarizeQuestion(input: SummarizeQuestionInput): Promise<SummarizeQuestionOutput> {
  return summarizeQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeQuestionPrompt',
  input: {schema: SummarizeQuestionInputSchema},
  output: {schema: SummarizeQuestionOutputSchema},
  prompt: `You are an expert at summarizing text. Your task is to take the following question and create a single, concise sentence that captures its main point.

  IMPORTANT: The final output must be plain text only. Remove all markdown syntax like hashtags, stars, underscores, etc.
  
  Original Question:
  "{{{question}}}"
  
  Generate a one-sentence summary.`,
});

const summarizeQuestionFlow = ai.defineFlow(
  {
    name: 'summarizeQuestionFlow',
    inputSchema: SummarizeQuestionInputSchema,
    outputSchema: SummarizeQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
