'use server';

/**
 * @fileOverview Summarizes user-provided information, categorizes it, and stores it for easy access. This file exports:
 *
 * - `summarizeUserInformation`: Asynchronously summarizes, categorizes, and stores user-provided information. Accepts information and optional existing summary ID as input.
 * - `SummarizeUserInformationInput`: Interface for the input to `summarizeUserInformation`, including information and optional existing summary ID.
 * - `SummarizeUserInformationOutput`: Interface for the output of `summarizeUserInformation`, including the summary ID and the summary itself.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const SummarizeUserInformationInputSchema = z.object({
  information: z.string().describe('The information provided by the user.'),
  existingSummaryId: z.string().optional().describe('The ID of an existing summary to update, if applicable.'),
});

export type SummarizeUserInformationInput = z.infer<typeof SummarizeUserInformationInputSchema>;

// Define the output schema
const SummarizeUserInformationOutputSchema = z.object({
  summaryId: z.string().describe('The ID of the summary.'),
  summary: z.string().describe('The summary of the information.'),
});

export type SummarizeUserInformationOutput = z.infer<typeof SummarizeUserInformationOutputSchema>;

// Exported function to summarize user information
export async function summarizeUserInformation(
  input: SummarizeUserInformationInput
): Promise<SummarizeUserInformationOutput> {
  return summarizeUserInformationFlow(input);
}

// Define the prompt for summarizing information
const summarizeInformationPrompt = ai.definePrompt({
  name: 'summarizeInformationPrompt',
  input: {schema: SummarizeUserInformationInputSchema},
  output: {schema: SummarizeUserInformationOutputSchema},
  prompt: `Summarize the following information provided by the user. If an existing summary is provided, update it with the new information. Ensure the summary is concise and captures the key points.

Information: {{{information}}}

Existing Summary ID: {{{existingSummaryId}}}
`,
});

// Define the flow for summarizing user information
const summarizeUserInformationFlow = ai.defineFlow(
  {
    name: 'summarizeUserInformationFlow',
    inputSchema: SummarizeUserInformationInputSchema,
    outputSchema: SummarizeUserInformationOutputSchema,
  },
  async input => {
    const {output} = await summarizeInformationPrompt(input);
    // TODO: Add logic here to store the summary in the database
    // If an existingSummaryId is provided, update the existing summary
    // Otherwise, create a new summary
    // For now, just return the summary
    return {
      summaryId: 'sample-summary-id', // Replace with actual summary ID from database
      summary: output!.summary,
    };
  }
);
