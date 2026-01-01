'use server';

/**
 * @fileOverview Adjusts the tone of user input to ensure it is appropriate.
 *
 * - adjustToneForAppropriateness - A function that adjusts the tone of the input text.
 * - ToneAdjustmentInput - The input type for the adjustToneForAppropriateness function.
 * - ToneAdjustmentOutput - The return type for the adjustToneForAppropriateness function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ToneAdjustmentInputSchema = z.object({
  text: z.string().describe('The text to adjust for appropriateness.'),
});
export type ToneAdjustmentInput = z.infer<typeof ToneAdjustmentInputSchema>;

const ToneAdjustmentOutputSchema = z.object({
  adjustedText: z
    .string()
    .describe('The adjusted text, ensuring it is appropriate.'),
});
export type ToneAdjustmentOutput = z.infer<typeof ToneAdjustmentOutputSchema>;

export async function adjustToneForAppropriateness(
  input: ToneAdjustmentInput
): Promise<ToneAdjustmentOutput> {
  return adjustToneForAppropriatenessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'toneAdjustmentPrompt',
  input: {schema: ToneAdjustmentInputSchema},
  output: {schema: ToneAdjustmentOutputSchema},
  prompt: `You are a helpful AI assistant that adjusts the tone of the given text to ensure it is appropriate for a general audience.

  Original Text: {{{text}}}

  Adjusted Text:`,
});

const adjustToneForAppropriatenessFlow = ai.defineFlow(
  {
    name: 'adjustToneForAppropriatenessFlow',
    inputSchema: ToneAdjustmentInputSchema,
    outputSchema: ToneAdjustmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
