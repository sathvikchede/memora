'use server';

/**
 * @fileOverview Processes multimedia input (images, files, voice) to extract
 * information, summarize it, and make it available for answering queries.
 *
 * - processMultimediaInput - A function that handles the multimedia input processing.
 * - ProcessMultimediaInputInput - The input type for the processMultimediaInput function.
 * - ProcessMultimediaInputOutput - The return type for the processMultimediaInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessMultimediaInputInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A media file (image, file, voice) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  additionalText: z.string().optional().describe('Additional text accompanying the media.'),
});
export type ProcessMultimediaInputInput = z.infer<typeof ProcessMultimediaInputInputSchema>;

const ProcessMultimediaInputOutputSchema = z.object({
  summary: z.string().describe('A summary of the content extracted from the media.'),
  source: z.string().optional().describe('Source of the information. '),
});
export type ProcessMultimediaInputOutput = z.infer<typeof ProcessMultimediaInputOutputSchema>;

export async function processMultimediaInput(
  input: ProcessMultimediaInputInput
): Promise<ProcessMultimediaInputOutput> {
  return processMultimediaInputFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processMultimediaInputPrompt',
  input: {schema: ProcessMultimediaInputInputSchema},
  output: {schema: ProcessMultimediaInputOutputSchema},
  prompt: `You are an AI assistant designed to process multimedia input and extract key information.

  Your goal is to create a concise summary of the content of the media, and the accompanying information if provided.

  Create a summary of the media content. Include any relevant information from the additional text.

  Media: {{media url=mediaDataUri}}
  Additional Text: {{{additionalText}}}
  `,
});

const processMultimediaInputFlow = ai.defineFlow(
  {
    name: 'processMultimediaInputFlow',
    inputSchema: ProcessMultimediaInputInputSchema,
    outputSchema: ProcessMultimediaInputOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
