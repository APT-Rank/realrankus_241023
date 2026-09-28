import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON, COLLECTION_PLAYER } from '../common/db';
import * as admin from 'firebase-admin';

export const controlSimulation = onCall(async (request) => {
  const { season_id, action, speed } = request.data;

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'HERO must be signed in to control the test simulation');
  }
  if (season_id !== 'test_hero_season') {
    throw new HttpsError('permission-denied', 'TIME-SLIP controls are limited to the HERO test season');
  }
  const heroDoc = await db.collection(COLLECTION_PLAYER).doc('HERO').get();
  if (!heroDoc.exists || heroDoc.data()?.season_id !== season_id || heroDoc.data()?.user_id !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Only the HERO participant can control this test season');
  }
  
  if (!season_id || !action) {
    throw new HttpsError('invalid-argument', 'Missing season_id or action');
  }
  if (speed !== undefined && ![1, 5, 20, 100].includes(speed)) {
    throw new HttpsError('invalid-argument', 'Unsupported simulation speed');
  }
  if (process.env.FUNCTIONS_EMULATOR === 'true' && ['RUN', 'STEP'].includes(action)) {
    throw new HttpsError('failed-precondition', 'RUN and STEP are disabled locally until the task handoff is verified as emulator-only');
  }

  const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);
  
  const result = await db.runTransaction(async (t) => {
    const seasonDoc = await t.get(seasonRef);
    if (!seasonDoc.exists) {
      throw new HttpsError('not-found', 'Season not found');
    }
    
    const validActions = ['RUN', 'PAUSE', 'STEP', 'STOP'];
    if (!validActions.includes(action)) {
      throw new HttpsError('invalid-argument', 'Invalid action');
    }

    let clock_status = seasonDoc.data()?.clock_status || 'INITIAL';
    let needsTrigger = false;
    
    if (action === 'RUN') {
      // Re-enqueue on every RUN request. A previous RUN may have been marked
      // RUNNING before its task failed; batch IDs and dispatch task names keep
      // this recovery trigger idempotent.
      needsTrigger = true;
      clock_status = 'RUNNING';
    } else if (action === 'PAUSE' || action === 'STOP') {
      clock_status = 'PAUSED';
    } else if (action === 'STEP') {
      clock_status = 'PAUSED';
      needsTrigger = true;
    }
    
    // We update the clock status so the simulation backend knows whether to loop or not
    t.update(seasonRef, {
      clock_status: clock_status,
      test_mode_speed: speed || 1,
      active_region_scope: seasonDoc.data()?.active_region_scope || {
        province: '경기도', city: '용인시', district: '수지구', region_scope: '경기도 용인시 수지구'
      },
      updated_at: admin.firestore.Timestamp.now()
    });

    return { status: 'SUCCESS', action, clock_status, needsTrigger };
  });

  if (result.needsTrigger) {
      console.log(`[controlSimulation] Triggering batch for action ${result.action}`);
      const { CloudTasksClient } = require('@google-cloud/tasks');
      const tasksClient = new CloudTasksClient();
      const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
      const location = process.env.PLAY_REGION || 'asia-northeast3';
      
      const nextBatchUrl = `https://${location}-${project}.cloudfunctions.net/createEconomicBatchTask`;
      const taskPayload = {
        data: {
          season_id: request.data.season_id,
          batch_type: 'ECONOMIC',
          allow_paused_clock: result.action === 'STEP',
        }
      };
      
      const task = {
        httpRequest: {
          httpMethod: 'POST' as const,
          url: nextBatchUrl,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify(taskPayload)).toString('base64'),
          oidcToken: {
            serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
            audience: nextBatchUrl,
          }
        }
      };
      
      await tasksClient.createTask({ parent: tasksClient.queuePath(project, location, 'reconciliation-queue'), task });
  }

  return result;
});
