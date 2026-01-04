
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
  const result = await answerUserQueryFlow(input);
  return result || { answer: '', sources: [] };
}

const prompt = ai.definePrompt({
  name: 'answerUserQueryPrompt',
  input: {schema: AnswerUserQueryInputSchema},
  output: {schema: AnswerUserQueryOutputSchema},
  prompt: `You are an expert AI assistant. Your task is to provide a comprehensive and well-structured answer to the user's query based *only* on the information provided in the "Summaries".

Follow these steps:
1.  Thoroughly analyze the user's "Query" to understand what they are asking.
2.  Review all the "Summaries" to find relevant information.
3.  Synthesize the information into a clear and coherent answer.
4.  **Format your answer using Markdown.** Use headings, subheadings, bullet points (using hyphens or asterisks), and bold text to structure the information logically and make it easy to read.
5.  Based on the information you used, identify the corresponding "Available Sources" and include them in your output.
6.  **If the summaries do not contain relevant information to answer the query, you MUST return an empty string for the "answer" field and an empty array for the "sources" field.**

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
    // If there are no entries to search, don't call the AI.
    if (input.summaries.length === 0) {
      return { answer: '', sources: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
