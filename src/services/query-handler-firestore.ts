/**
 * @fileOverview Firestore-based query handler service with topic-level source attribution.
 * Handles queries from the Ask tab and returns answers with detailed source tracking.
 *
 * NOTE: This runs on the client side and requires firestore and spaceId to be passed in.
 * The AI call is made via a server action.
 */

import { Firestore } from 'firebase/firestore';
import { queryWithSources } from '@/ai/flows/query-with-sources';
import {
  getAllSummaries,
  getEntries,
  generateUUID,
  FirestoreSummary,
  FirestoreEntry,
} from '@/services/firestore';

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
    contributor: string;
  }>;
  confidence: number;
  insufficient_info: boolean;
  timestamp: string;
}

// Helper to find relevant summaries based on query keywords
function findRelevantSummaries(
  query: string,
  summaries: Array<FirestoreSummary & { summaryId: string }>
): Array<FirestoreSummary & { summaryId: string }> {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  // Score each summary based on relevance
  const scoredSummaries = summaries.map(summary => {
    let score = 0;

    // Check domain match
    if (queryLower.includes(summary.domain.toLowerCase())) {
      score += 3;
    }

    // Check subtopic match
    if (queryLower.includes(summary.subtopic.toLowerCase())) {
      score += 2;
    }

    // Check content match
    const contentLower = summary.content.toLowerCase();
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 1;
      }
    }

    // Check topic sources match
    const topicKeys = Object.keys(summary.topicSources);
    for (const topicKey of topicKeys) {
      if (queryLower.includes(topicKey.toLowerCase())) {
        score += 2;
      }
    }

    return { summary, score };
  });

  // Sort by score and return top results
  return scoredSummaries
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.summary);
}

/**
 * Handle a query from the Ask tab with full source attribution using Firestore.
 */
export async function handleQueryFirestore(
  firestore: Firestore,
  spaceId: string,
  queryText: string
): Promise<HandleQueryResult> {
  const queryId = `query_${generateUUID()}`;
  const timestamp = new Date().toISOString();

  // Get all summaries for this space
  const allSummaries = await getAllSummaries(firestore, spaceId);

  // Find relevant summaries
  const relevantSummaries = findRelevantSummaries(queryText, allSummaries);

  // If no relevant summaries found, use all summaries (for small datasets)
  const summariesToSearch = relevantSummaries.length > 0 ? relevantSummaries : allSummaries;

  // If still no summaries, return insufficient info
  if (summariesToSearch.length === 0) {
    return {
      query_id: queryId,
      original_query: queryText,
      answer: '',
      sources_used: {
        summaries: [],
        topics_referenced: {},
        original_entries: [],
      },
      original_entry_details: [],
      confidence: 0,
      insufficient_info: true,
      timestamp,
    };
  }

  // Prepare summaries for the AI
  const summariesForAI = summariesToSearch.map((s) => ({
    summary_id: s.summaryId,
    domain: s.domain,
    subtopic: s.subtopic,
    content: s.content,
    topics: Object.keys(s.topicSources),
  }));

  // Call the AI via server action
  const aiResult = await queryWithSources({
    query: queryText,
    summaries: summariesForAI,
  });

  // Resolve original entry sources from the topics referenced
  const originalEntryIds = new Set<string>();

  for (const [summaryId, topicKeys] of Object.entries(aiResult.topics_referenced)) {
    const summary = summariesToSearch.find((s) => s.summaryId === summaryId);
    if (summary) {
      for (const topicKey of topicKeys) {
        const entryIds = summary.topicSources[topicKey] || [];
        entryIds.forEach((id) => originalEntryIds.add(id));
      }
    }
  }

  // Get the original entry details
  const entries = await getEntries(firestore, spaceId);
  const originalEntryDetails = Array.from(originalEntryIds).map(entryId => {
    const entry = entries.find(e => e.entryId === entryId);
    if (entry) {
      return {
        entry_id: entry.entryId,
        content: entry.content,
        source_type: entry.sourceType,
        timestamp: entry.createdAt?.toDate?.()?.toISOString() || timestamp,
        contributor: entry.contributor || 'Anonymous',
      };
    }
    return {
      entry_id: entryId,
      content: 'Entry not found',
      source_type: 'unknown',
      timestamp,
      contributor: 'Unknown',
    };
  });

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

  return result;
}

/**
 * Get source details for displaying to users.
 * Returns human-readable information about the sources.
 */
export async function getSourceDetails(
  firestore: Firestore,
  spaceId: string,
  summaryIds: string[],
  topicsReferenced: Record<string, string[]>
): Promise<Array<{
  summary_id: string;
  domain: string;
  subtopic: string;
  topics_used: string[];
  entry_count: number;
}>> {
  const summaries = await getAllSummaries(firestore, spaceId);
  const details: Array<{
    summary_id: string;
    domain: string;
    subtopic: string;
    topics_used: string[];
    entry_count: number;
  }> = [];

  for (const summaryId of summaryIds) {
    const summary = summaries.find((s) => s.summaryId === summaryId);
    if (summary) {
      const topicsUsed = topicsReferenced[summaryId] || [];
      let entryCount = 0;
      for (const topic of topicsUsed) {
        entryCount += (summary.topicSources[topic] || []).length;
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
