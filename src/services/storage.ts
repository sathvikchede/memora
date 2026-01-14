/**
 * @fileOverview Local storage service for entries, summaries, and query history.
 * Handles persistence of topic-level source tracking data.
 */

// Types for the topic-level source tracking system
export interface RawEntry {
  entry_id: string;
  source_type: 'manual' | 'help' | 'chat';
  content: string;
  timestamp: string;
  metadata: {
    original_question_id?: string;
    conversation_id?: string;
    message_index?: number;
    user_tags?: string[];
  };
}

export interface TopicInfo {
  topic_key: string;
  topic_label: string;
  extracted_info: string;
}

export interface Summary {
  summary_id: string;
  domain: string;
  subtopic: string;
  content: string;
  topic_sources: Record<string, string[]>; // topic_key -> entry_ids[]
  all_contributing_entries: string[];
  entry_count: number;
  version: number;
  created_at: string;
  last_updated: string;
}

export interface QueryResponse {
  query_id: string;
  original_query: string;
  answer: string;
  sources_used: {
    summaries: string[];
    topics_referenced: Record<string, string[]>; // summary_id -> topic_keys[]
    original_entries: string[];
  };
  confidence: number;
  timestamp: string;
}

// Storage keys
const STORAGE_KEYS = {
  RAW_ENTRIES: 'memora_raw_entries',
  SUMMARIES: 'memora_summaries',
  QUERY_HISTORY: 'memora_query_history',
  DOMAINS: 'memora_domains',
};

// Utility to generate UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============ RAW ENTRY STORAGE ============

export function saveRawEntry(entry: RawEntry): void {
  const entries = getAllRawEntries();
  entries[entry.entry_id] = entry;
  localStorage.setItem(STORAGE_KEYS.RAW_ENTRIES, JSON.stringify(entries));
}

export function getRawEntry(entryId: string): RawEntry | null {
  const entries = getAllRawEntries();
  return entries[entryId] || null;
}

export function getAllRawEntries(): Record<string, RawEntry> {
  const stored = localStorage.getItem(STORAGE_KEYS.RAW_ENTRIES);
  return stored ? JSON.parse(stored) : {};
}

export function getRawEntriesByIds(entryIds: string[]): RawEntry[] {
  const entries = getAllRawEntries();
  return entryIds.map((id) => entries[id]).filter(Boolean);
}

// ============ SUMMARY STORAGE ============

export function saveSummary(summary: Summary): void {
  const summaries = getAllSummariesAsObject();
  summaries[summary.summary_id] = summary;
  localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));

  // Update domains list
  updateDomainsList(summary.domain);
}

export function getSummary(summaryId: string): Summary | null {
  const summaries = getAllSummariesAsObject();
  return summaries[summaryId] || null;
}

export function getAllSummariesAsObject(): Record<string, Summary> {
  const stored = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
  return stored ? JSON.parse(stored) : {};
}

export function getAllSummaries(): Summary[] {
  return Object.values(getAllSummariesAsObject());
}

export function deleteSummary(summaryId: string): void {
  const summaries = getAllSummariesAsObject();
  delete summaries[summaryId];
  localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
}

// ============ DOMAIN MANAGEMENT ============

export function getAllDomains(): string[] {
  const stored = localStorage.getItem(STORAGE_KEYS.DOMAINS);
  return stored ? JSON.parse(stored) : [];
}

export function updateDomainsList(domain: string): void {
  const domains = getAllDomains();
  if (!domains.includes(domain)) {
    domains.push(domain);
    localStorage.setItem(STORAGE_KEYS.DOMAINS, JSON.stringify(domains));
  }
}

// ============ QUERY HISTORY STORAGE ============

export function saveQueryResponse(response: QueryResponse): void {
  const history = getQueryHistory();
  history.unshift(response); // Add to beginning
  // Keep last 100 queries
  if (history.length > 100) {
    history.pop();
  }
  localStorage.setItem(STORAGE_KEYS.QUERY_HISTORY, JSON.stringify(history));
}

export function getQueryHistory(): QueryResponse[] {
  const stored = localStorage.getItem(STORAGE_KEYS.QUERY_HISTORY);
  return stored ? JSON.parse(stored) : [];
}

export function getQueryById(queryId: string): QueryResponse | null {
  const history = getQueryHistory();
  return history.find((q) => q.query_id === queryId) || null;
}

// ============ SEARCH UTILITIES ============

/**
 * Find summaries relevant to a query using keyword matching.
 * Can be enhanced with embeddings later.
 */
export function findRelevantSummaries(queryText: string): Summary[] {
  const allSummaries = getAllSummaries();
  const queryWords = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (queryWords.length === 0) {
    return allSummaries;
  }

  // Score each summary based on keyword matches
  const scored = allSummaries.map((summary) => {
    const searchText = `${summary.domain} ${summary.subtopic} ${summary.content} ${Object.keys(summary.topic_sources).join(' ')}`.toLowerCase();

    let score = 0;
    for (const word of queryWords) {
      if (searchText.includes(word)) {
        score += 1;
        // Boost if word is in domain or subtopic
        if (summary.domain.toLowerCase().includes(word) || summary.subtopic.toLowerCase().includes(word)) {
          score += 2;
        }
      }
    }

    return { summary, score };
  });

  // Return summaries with at least one match, sorted by score
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.summary);
}

/**
 * Get summaries by domain
 */
export function getSummariesByDomain(domain: string): Summary[] {
  return getAllSummaries().filter((s) => s.domain.toLowerCase() === domain.toLowerCase());
}

/**
 * Get summaries by domain and subtopic
 */
export function getSummaryByDomainAndSubtopic(domain: string, subtopic: string): Summary | null {
  const summaryId = `summary_${domain.toLowerCase().replace(/\s+/g, '_')}_${subtopic.toLowerCase().replace(/\s+/g, '_')}`;
  return getSummary(summaryId);
}

// ============ CLEAR STORAGE ============

export function clearAllMemoraData(): void {
  localStorage.removeItem(STORAGE_KEYS.RAW_ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.SUMMARIES);
  localStorage.removeItem(STORAGE_KEYS.QUERY_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.DOMAINS);
}
