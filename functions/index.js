/**
 * Cloud Functions for Memora AI
 *
 * HYBRID APPROACH:
 * Currently, Gemini API calls are handled by Next.js Server Actions (Genkit).
 * This is secure as the API key stays server-side.
 *
 * These Cloud Functions are prepared for future use if needed:
 * - For background processing
 * - For scheduled tasks
 * - For webhook handling
 * - If we need to scale AI calls separately
 *
 * For now, the main AI flows remain in src/ai/flows/ using Genkit.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Placeholder function - can be used for testing deployment
 */
exports.healthCheck = functions.https.onCall(async (data, context) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    projectId: process.env.GCLOUD_PROJECT
  };
});

/**
 * Future: Process entry in background
 * This can be triggered after an entry is saved to Firestore
 */
exports.onEntryCreated = functions.firestore
  .document('spaces/{spaceId}/entries/{entryId}')
  .onCreate(async (snapshot, context) => {
    const { spaceId, entryId } = context.params;
    const entry = snapshot.data();

    console.log(`New entry created in space ${spaceId}: ${entryId}`);

    // Future: Trigger topic extraction and summary updates
    // For now, this is handled client-side via Genkit server actions

    return null;
  });

/**
 * Future: Update summary when entry is processed
 */
exports.onSummaryUpdated = functions.firestore
  .document('spaces/{spaceId}/summaries/{summaryId}')
  .onWrite(async (change, context) => {
    const { spaceId, summaryId } = context.params;

    if (!change.after.exists) {
      console.log(`Summary ${summaryId} deleted from space ${spaceId}`);
      return null;
    }

    const summary = change.after.data();
    console.log(`Summary ${summaryId} updated in space ${spaceId}, version: ${summary.version}`);

    return null;
  });
