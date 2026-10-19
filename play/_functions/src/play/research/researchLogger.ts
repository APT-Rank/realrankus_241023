import { db } from '../common/db';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const COLLECTION_RESEARCH_EVENTS = 'RESEARCH_EVENTS';

export type ResearchEvent = {
  correlation_id: string;
  trace_id: string;
  request_id: string;
  season_id: string;
  participant_id: string;
  simulation_period: number;
  event_type: 'EXPOSURE' | 'DECISION' | 'ACTION' | 'VALIDATION' | 'TRANSACTION';
  payload: any;
  created_at?: admin.firestore.Timestamp;
  schema_version: string;
};

export async function logResearchEventAsync(event: ResearchEvent) {
  // Deterministic Idempotency Key
  const docId = `${event.season_id}_${event.simulation_period}_${event.participant_id}_${event.event_type}_${event.request_id}`;
  
  try {
    const docRef = db.collection(COLLECTION_RESEARCH_EVENTS).doc(docId);
    const data = {
      ...event,
      created_at: FieldValue.serverTimestamp(),
      status: 'PERSISTED'
    };
    
    // INJECT FAULT
    if (event.correlation_id.includes('FAIL_ME')) {
      throw new Error('Injected Research Writer Failure');
    }
    
    await docRef.set(data);
  } catch (err) {
    console.error(`Failed to log research event (correlation: ${event.correlation_id}), writing to DLQ:`, err);
    // Synchronous structured log acts as a durable Failure Record in GCP Cloud Logging
    const failureRecord = {
      _type: 'RESEARCH_EVENT_DLQ',
      event: event,
      error_message: err instanceof Error ? err.message : String(err),
      failed_at: new Date().toISOString()
    };
    console.error(JSON.stringify(failureRecord));

    // Also attempt to write to Firestore DLQ (might fail if CPU is frozen, but we have the log above)
    try {
      await db.collection('RESEARCH_EVENTS_DLQ').doc(docId).set({
        original_event: event,
        error_message: err instanceof Error ? err.message : String(err),
        failed_at: FieldValue.serverTimestamp()
      });
    } catch (dlqErr) {
       console.error('CRITICAL: DLQ write also failed!', dlqErr);
    }
  }
}
