import { config } from 'dotenv';
config();

import '@/ai/flows/process-multimedia-input.ts';
import '@/ai/flows/answer-user-queries-with-sources.ts';
import '@/ai/flows/summarize-user-information.ts';
import '@/ai/flows/tone-adjustment-for-appropriateness.ts';
