/**
 * Test script to verify summary generation is working
 * Run with: npx tsx scripts/test-summary-generation.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { extractTopicsFromEntry } from '../src/ai/flows/extract-topics';
import { createNewSummary } from '../src/ai/flows/update-summary';

async function testSummaryGeneration() {
  console.log('🧪 Testing Summary Generation...\n');

  const testEntry = "Gokaraju Rangaraju College is known for its vibrant campus atmosphere.";

  try {
    // Step 1: Extract topics
    console.log('📝 Input:', testEntry);
    console.log('\n1️⃣ Extracting topics...');

    const extractedTopics = await extractTopicsFromEntry({
      entry_content: testEntry,
      existing_domains: []
    });

    console.log('✅ Topics extracted:');
    console.log('   Domain:', extractedTopics.domain);
    console.log('   Subtopic:', extractedTopics.subtopic);
    console.log('   Confidence:', extractedTopics.confidence);
    console.log('   Topics:', JSON.stringify(extractedTopics.topics, null, 2));

    // Step 2: Check if confidence is too low
    if (extractedTopics.confidence < 0.3) {
      console.log('\n⚠️  Confidence too low - summary would NOT be created');
      return;
    }

    // Step 3: Create summary
    console.log('\n2️⃣ Creating summary...');

    const summary = await createNewSummary({
      domain: extractedTopics.domain,
      subtopic: extractedTopics.subtopic,
      entry_content: testEntry,
      topics: extractedTopics.topics
    });

    console.log('✅ Summary created:');
    console.log('   Content:', summary.summary_content);

    console.log('\n✅ Summary generation is working correctly!');

  } catch (error) {
    console.error('\n❌ Error during summary generation:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

testSummaryGeneration();
