/**
 * @fileOverview Firestore-based entry processor service for topic-level source tracking.
 * Processes new entries, extracts topics, and updates summaries in Firestore.
 *
 * NOTE: This runs on the client side and requires firestore and spaceId to be passed in.
 * AI calls are made via server actions.
 */

import { Firestore } from 'firebase/firestore';
import { extractTopicsFromEntry, ExtractTopicsOutput } from '@/ai/flows/extract-topics';
import { updateSummaryWithEntry, createNewSummary } from '@/ai/flows/update-summary';
import {
  FirestoreEntry,
  FirestoreSummary,
  saveEntry,
  getSummary,
  saveSummary,
  getAllSummaries,
  generateUUID,
} from '@/services/firestore';

export interface ProcessEntryResult {
  success: boolean;
  entry_id: string;
  summary_id: string | null;
  topics_extracted: string[];
  error?: string;
}

// Helper to convert Firestore summary to match AI flow expectations
interface LocalSummary {
  summary_id: string;
  domain: string;
  subtopic: string;
  content: string;
  topic_sources: Record<string, string[]>;
  all_contributing_entries: string[];
  entry_count: number;
  version: number;
  created_at: string;
  last_updated: string;
}

function firestoreToLocalSummary(fs: FirestoreSummary & { summaryId: string }): LocalSummary {
  return {
    summary_id: fs.summaryId,
    domain: fs.domain,
    subtopic: fs.subtopic,
    content: fs.content,
    topic_sources: fs.topicSources,
    all_contributing_entries: fs.allContributingEntries,
    entry_count: fs.entryCount,
    version: fs.version,
    created_at: fs.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    last_updated: fs.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

function localToFirestoreSummary(local: LocalSummary): Omit<FirestoreSummary, 'summaryId' | 'lastUpdated'> {
  return {
    domain: local.domain,
    subtopic: local.subtopic,
    content: local.content,
    topicSources: local.topic_sources,
    allContributingEntries: local.all_contributing_entries,
    entryCount: local.entry_count,
    version: local.version,
  };
}

/**
 * Process a new entry from any input source using Firestore.
 * 1. Extracts topics using AI
 * 2. Creates or updates the relevant summary in Firestore
 * 3. Tracks sources at the topic level
 *
 * Note: The raw entry should already be saved via addEntry from SpaceDataContext.
 * This function focuses on topic extraction and summary management.
 *
 * @param existingEntryId - The ID of the already-saved entry (from saveEntry).
 *                          This ensures the summary's topicSources reference the correct entry.
 */
export async function processNewEntryFirestore(
  firestore: Firestore,
  spaceId: string,
  content: string,
  sourceType: 'manual' | 'help' | 'chat',
  metadata: {
    userTags?: string[];
    questionId?: string;
    conversationId?: string;
    existingEntryId?: string; // Pass the actual entry ID from Firestore
  } = {}
): Promise<ProcessEntryResult> {
  // Use the existing entry ID if provided, otherwise generate a new one
  const entryId = metadata.existingEntryId || `entry_${generateUUID()}`;

  try {
    // Get existing domains from summaries for context
    const existingSummaries = await getAllSummaries(firestore, spaceId);
    const existingDomains = [...new Set(existingSummaries.map((s) => s.domain))];

    // Extract topics from the entry (server action call)
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
    const existingSummary = await getSummary(firestore, spaceId, summaryId);

    let updatedSummary: LocalSummary;

    if (existingSummary) {
      // Update existing summary (server action call)
      const localSummary = firestoreToLocalSummary(existingSummary);
      updatedSummary = await updateExistingSummary(localSummary, entryId, content, extractedTopics);
    } else {
      // Create new summary (server action call)
      updatedSummary = await createSummaryFromEntry(entryId, content, extractedTopics);
    }

    // Save the updated/new summary to Firestore
    await saveSummary(firestore, spaceId, summaryId, localToFirestoreSummary(updatedSummary));

    // Check if summary needs splitting (just logs warning for now)
    checkAndSplitSummaryIfNeeded(updatedSummary);

    return {
      success: true,
      entry_id: entryId,
      summary_id: updatedSummary.summary_id,
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
  existingSummary: LocalSummary,
  newEntryId: string,
  newEntryContent: string,
  extractedTopics: ExtractTopicsOutput
): Promise<LocalSummary> {
  const updateResult = await updateSummaryWithEntry({
    existing_summary_content: existingSummary.content,
    existing_topics: Object.keys(existingSummary.topic_sources),
    new_entry_content: newEntryContent,
    new_topics: extractedTopics.topics,
  });

  // Update topic sources
  const updatedTopicSources = { ...existingSummary.topic_sources };

  // Add entry to updated topics
  for (const topicKey of updateResult.topics_updated) {
    if (!updatedTopicSources[topicKey]) {
      updatedTopicSources[topicKey] = [];
    }
    if (!updatedTopicSources[topicKey].includes(newEntryId)) {
      updatedTopicSources[topicKey].push(newEntryId);
    }
  }

  // Add entry to new topics
  for (const topicKey of updateResult.new_topics_added) {
    if (!updatedTopicSources[topicKey]) {
      updatedTopicSources[topicKey] = [];
    }
    if (!updatedTopicSources[topicKey].includes(newEntryId)) {
      updatedTopicSources[topicKey].push(newEntryId);
    }
  }

  // Update all_contributing_entries
  const allEntries = [...existingSummary.all_contributing_entries];
  if (!allEntries.includes(newEntryId)) {
    allEntries.push(newEntryId);
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
  entryId: string,
  entryContent: string,
  extractedTopics: ExtractTopicsOutput
): Promise<LocalSummary> {
  const summaryResult = await createNewSummary({
    domain: extractedTopics.domain,
    subtopic: extractedTopics.subtopic,
    entry_content: entryContent,
    topics: extractedTopics.topics,
  });

  // Initialize topic sources
  const topicSources: Record<string, string[]> = {};
  for (const topic of extractedTopics.topics) {
    topicSources[topic.topic_key] = [entryId];
  }

  const summaryId = `summary_${extractedTopics.domain}_${extractedTopics.subtopic}`;

  return {
    summary_id: summaryId,
    domain: extractedTopics.domain,
    subtopic: extractedTopics.subtopic,
    content: summaryResult.summary_content,
    topic_sources: topicSources,
    all_contributing_entries: [entryId],
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
function checkAndSplitSummaryIfNeeded(summary: LocalSummary): void {
  const wordCount = summary.content.split(/\s+/).length;
  const topicCount = Object.keys(summary.topic_sources).length;

  if (wordCount > 1000 || topicCount > 10) {
    console.warn(
      `Summary ${summary.summary_id} may need splitting: ${wordCount} words, ${topicCount} topics`
    );
  }
}

/**
 * Batch process multiple entries (useful for data migration).
 */
export async function batchProcessEntriesFirestore(
  firestore: Firestore,
  spaceId: string,
  entries: Array<{
    content: string;
    sourceType: 'manual' | 'help' | 'chat';
    metadata?: { userTags?: string[]; questionId?: string; conversationId?: string };
  }>
): Promise<ProcessEntryResult[]> {
  const results: ProcessEntryResult[] = [];

  for (const entry of entries) {
    const result = await processNewEntryFirestore(
      firestore,
      spaceId,
      entry.content,
      entry.sourceType,
      entry.metadata
    );
    results.push(result);

    // Add a small delay between processing to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
