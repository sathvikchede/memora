/**
 * @fileOverview Query handler service with topic-level source attribution.
 * Handles queries from the Ask tab and returns answers with detailed source tracking.
 *
 * NOTE: This runs on the client side to access localStorage.
 * The AI call is made via a server action.
 */

import {
  QueryResponse,
  generateUUID,
  findRelevantSummaries,
  getAllSummaries,
  saveQueryResponse,
  getRawEntriesByIds,
} from '@/services/storage';
import { queryWithSources } from '@/ai/flows/query-with-sources';

export interface HandleQueryResult {
  query_id: string;
  original_query: string;
  answer: string;
  sources_used: {
    summaries: string[];
    topics_referenced: Record<string, string[]>;
    original_entries: string[];
  };
  original_entry_details: Array<{
    entry_id: string;
    content: string;
    source_type: string;
    timestamp: string;
  }>;
  confidence: number;
  insufficient_info: boolean;
  timestamp: string;
}

/**
 * Handle a query from the Ask tab with full source attribution.
 * This runs on the client to access localStorage, but calls a server action for AI.
 */
export async function handleQuery(queryText: string): Promise<HandleQueryResult> {
  const queryId = `query_${generateUUID()}`;
  const timestamp = new Date().toISOString();

  // Find relevant summaries (runs on client, accesses localStorage)
  const relevantSummaries = findRelevantSummaries(queryText);

  // If no summaries found, try getting all summaries (for very new systems)
  const summariesToSearch = relevantSummaries.length > 0 ? relevantSummaries : getAllSummaries();

  // Prepare summaries for the AI
  const summariesForAI = summariesToSearch.map((s) => ({
    summary_id: s.summary_id,
    domain: s.domain,
    subtopic: s.subtopic,
    content: s.content,
    topics: Object.keys(s.topic_sources),
  }));

  // Call the AI via server action
  const aiResult = await queryWithSources({
    query: queryText,
    summaries: summariesForAI,
  });

  // Resolve original entry sources from the topics referenced
  const originalEntryIds = new Set<string>();

  for (const [summaryId, topicKeys] of Object.entries(aiResult.topics_referenced)) {
    const summary = summariesToSearch.find((s) => s.summary_id === summaryId);
    if (summary) {
      for (const topicKey of topicKeys) {
        const entryIds = summary.topic_sources[topicKey] || [];
        entryIds.forEach((id) => originalEntryIds.add(id));
      }
    }
  }

  // Get the original entry details
  const originalEntries = getRawEntriesByIds(Array.from(originalEntryIds));
  const originalEntryDetails = originalEntries.map((e) => ({
    entry_id: e.entry_id,
    content: e.content,
    source_type: e.source_type,
    timestamp: e.timestamp,
  }));

  // Build the result
  const result: HandleQueryResult = {
    query_id: queryId,
    original_query: queryText,
    answer: aiResult.answer,
    sources_used: {
      summaries: aiResult.summaries_used,
      topics_referenced: aiResult.topics_referenced,
      original_entries: Array.from(originalEntryIds),
    },
    original_entry_details: originalEntryDetails,
    confidence: aiResult.confidence,
    insufficient_info: aiResult.insufficient_info,
    timestamp,
  };

  // Save query to history (runs on client, accesses localStorage)
  const queryResponse: QueryResponse = {
    query_id: queryId,
    original_query: queryText,
    answer: aiResult.answer,
    sources_used: result.sources_used,
    confidence: aiResult.confidence,
    timestamp,
  };
  saveQueryResponse(queryResponse);

  return result;
}

/**
 * Get source details for displaying to users.
 * Returns human-readable information about the sources.
 */
export function getSourceDetails(
  summaryIds: string[],
  topicsReferenced: Record<string, string[]>
): Array<{
  summary_id: string;
  domain: string;
  subtopic: string;
  topics_used: string[];
  entry_count: number;
}> {
  const summaries = getAllSummaries();
  const details: Array<{
    summary_id: string;
    domain: string;
    subtopic: string;
    topics_used: string[];
    entry_count: number;
  }> = [];

  for (const summaryId of summaryIds) {
    const summary = summaries.find((s) => s.summary_id === summaryId);
    if (summary) {
      const topicsUsed = topicsReferenced[summaryId] || [];
      let entryCount = 0;
      for (const topic of topicsUsed) {
        entryCount += (summary.topic_sources[topic] || []).length;
      }

      details.push({
        summary_id: summaryId,
        domain: summary.domain,
        subtopic: summary.subtopic,
        topics_used: topicsUsed,
        entry_count: entryCount,
      });
    }
  }

  return details;
}
