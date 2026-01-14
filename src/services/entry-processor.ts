/**
 * @fileOverview Entry processor service for topic-level source tracking.
 * Processes new entries, extracts topics, and updates summaries.
 *
 * NOTE: This runs on the client side to access localStorage.
 * AI calls are made via server actions.
 */

import { extractTopicsFromEntry, ExtractTopicsOutput } from '@/ai/flows/extract-topics';
import { updateSummaryWithEntry, createNewSummary } from '@/ai/flows/update-summary';
import {
  RawEntry,
  Summary,
  generateUUID,
  saveRawEntry,
  saveSummary,
  getSummary,
  getAllDomains,
} from '@/services/storage';

export interface ProcessEntryResult {
  success: boolean;
  entry_id: string;
  summary_id: string | null;
  topics_extracted: string[];
  error?: string;
}

/**
 * Process a new entry from any input source.
 * 1. Saves the raw entry
 * 2. Extracts topics using AI
 * 3. Creates or updates the relevant summary
 * 4. Tracks sources at the topic level
 *
 * This runs on the client to access localStorage, but calls server actions for AI.
 */
export async function processNewEntry(
  content: string,
  sourceType: 'manual' | 'help' | 'chat',
  metadata: RawEntry['metadata'] = {}
): Promise<ProcessEntryResult> {
  const entryId = `entry_${generateUUID()}`;
  const timestamp = new Date().toISOString();

  // Create and save the raw entry
  const rawEntry: RawEntry = {
    entry_id: entryId,
    source_type: sourceType,
    content,
    timestamp,
    metadata,
  };

  try {
    // Save raw entry first (always persisted even if AI fails)
    saveRawEntry(rawEntry);

    // Extract topics from the entry (server action call)
    const existingDomains = getAllDomains();
    const extractedTopics = await extractTopicsFromEntry({
      entry_content: content,
      existing_domains: existingDomains.length > 0 ? existingDomains : undefined,
    });

    // If confidence is too low, don't create a summary
    if (extractedTopics.confidence < 0.3) {
      return {
        success: true,
        entry_id: entryId,
        summary_id: null,
        topics_extracted: [],
      };
    }

    // Create or update the summary
    const summaryId = `summary_${extractedTopics.domain}_${extractedTopics.subtopic}`;
    let summary = getSummary(summaryId);

    if (summary) {
      // Update existing summary (server action call)
      summary = await updateExistingSummary(summary, rawEntry, extractedTopics);
    } else {
      // Create new summary (server action call)
      summary = await createSummaryFromEntry(rawEntry, extractedTopics);
    }

    // Save the updated/new summary (localStorage)
    saveSummary(summary);

    // Check if summary needs splitting
    checkAndSplitSummaryIfNeeded(summary);

    return {
      success: true,
      entry_id: entryId,
      summary_id: summary.summary_id,
      topics_extracted: extractedTopics.topics.map((t) => t.topic_key),
    };
  } catch (error) {
    console.error('Error processing entry:', error);
    return {
      success: false,
      entry_id: entryId,
      summary_id: null,
      topics_extracted: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an existing summary with a new entry.
 */
async function updateExistingSummary(
  existingSummary: Summary,
  newEntry: RawEntry,
  extractedTopics: ExtractTopicsOutput
): Promise<Summary> {
  const updateResult = await updateSummaryWithEntry({
    existing_summary_content: existingSummary.content,
    existing_topics: Object.keys(existingSummary.topic_sources),
    new_entry_content: newEntry.content,
    new_topics: extractedTopics.topics,
  });

  // Update topic sources
  const updatedTopicSources = { ...existingSummary.topic_sources };

  // Add entry to updated topics
  for (const topicKey of updateResult.topics_updated) {
    if (!updatedTopicSources[topicKey]) {
      updatedTopicSources[topicKey] = [];
    }
    if (!updatedTopicSources[topicKey].includes(newEntry.entry_id)) {
      updatedTopicSources[topicKey].push(newEntry.entry_id);
    }
  }

  // Add entry to new topics
  for (const topicKey of updateResult.new_topics_added) {
    if (!updatedTopicSources[topicKey]) {
      updatedTopicSources[topicKey] = [];
    }
    if (!updatedTopicSources[topicKey].includes(newEntry.entry_id)) {
      updatedTopicSources[topicKey].push(newEntry.entry_id);
    }
  }

  // Update all_contributing_entries
  const allEntries = [...existingSummary.all_contributing_entries];
  if (!allEntries.includes(newEntry.entry_id)) {
    allEntries.push(newEntry.entry_id);
  }

  return {
    ...existingSummary,
    content: updateResult.updated_content,
    topic_sources: updatedTopicSources,
    all_contributing_entries: allEntries,
    entry_count: allEntries.length,
    version: existingSummary.version + 1,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Create a new summary from an entry.
 */
async function createSummaryFromEntry(
  entry: RawEntry,
  extractedTopics: ExtractTopicsOutput
): Promise<Summary> {
  const summaryResult = await createNewSummary({
    domain: extractedTopics.domain,
    subtopic: extractedTopics.subtopic,
    entry_content: entry.content,
    topics: extractedTopics.topics,
  });

  // Initialize topic sources
  const topicSources: Record<string, string[]> = {};
  for (const topic of extractedTopics.topics) {
    topicSources[topic.topic_key] = [entry.entry_id];
  }

  const summaryId = `summary_${extractedTopics.domain}_${extractedTopics.subtopic}`;

  return {
    summary_id: summaryId,
    domain: extractedTopics.domain,
    subtopic: extractedTopics.subtopic,
    content: summaryResult.summary_content,
    topic_sources: topicSources,
    all_contributing_entries: [entry.entry_id],
    entry_count: 1,
    version: 1,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Check if a summary has grown too large and needs to be split.
 * Currently just logs a warning - full splitting logic can be added later.
 */
function checkAndSplitSummaryIfNeeded(summary: Summary): void {
  const wordCount = summary.content.split(/\s+/).length;
  const topicCount = Object.keys(summary.topic_sources).length;

  if (wordCount > 1000 || topicCount > 10) {
    console.warn(
      `Summary ${summary.summary_id} may need splitting: ${wordCount} words, ${topicCount} topics`
    );
    // TODO: Implement automatic splitting in future iteration
    // This would involve:
    // 1. Using AI to suggest how to split the summary
    // 2. Creating new summaries for each split
    // 3. Migrating topic_sources to appropriate new summaries
    // 4. Deleting the original summary
  }
}

/**
 * Batch process multiple entries (useful for initial data migration).
 * This runs on the client.
 */
export async function batchProcessEntries(
  entries: Array<{ content: string; sourceType: 'manual' | 'help' | 'chat'; metadata?: RawEntry['metadata'] }>
): Promise<ProcessEntryResult[]> {
  const results: ProcessEntryResult[] = [];

  for (const entry of entries) {
    const result = await processNewEntry(entry.content, entry.sourceType, entry.metadata);
    results.push(result);

    // Add a small delay between processing to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
