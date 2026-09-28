import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';


const authClient = new OAuth2Client();
const ALLOWED_SERVICE_ACCOUNTS = [
  'aptrank-cc61b@appspot.gserviceaccount.com', // Cloud Tasks
  'firebase-adminsdk-nvy98@aptrank-cc61b.iam.gserviceaccount.com' // Local Test Script
];

export async function verifyInternalTask(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send({ error: { message: 'Missing or invalid Authorization header', status: 'UNAUTHENTICATED' } });
    throw new Error('Unauthenticated');
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const ticket = await authClient.verifyIdToken({
      idToken: token,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('No payload in token');
    }
    
    // Cloud Tasks sets audience to the full URL by default
    const expectedAudience = `https://${process.env.PLAY_REGION || 'asia-northeast3'}-aptrank-cc61b.cloudfunctions.net${req.url}`;
    
    // Optional: log for debug if audience fails
    if (payload.aud !== expectedAudience && !payload.aud.includes(req.url.split('?')[0])) {
       console.log(`Audience mismatch. Expected to contain: ${req.url}, Actual: ${payload.aud}`);
       res.status(401).send({ error: { message: 'Invalid audience', status: 'UNAUTHENTICATED' } });
       throw new Error('Invalid audience');
    }

    if (!ALLOWED_SERVICE_ACCOUNTS.includes(payload.email || '')) {
      console.log(`Email mismatch. Expected one of: ${ALLOWED_SERVICE_ACCOUNTS.join(',')}, Actual: ${payload.email}`);
      res.status(403).send({ error: { message: `Unauthorized service account: ${payload.email}`, status: 'PERMISSION_DENIED' } });
      throw new Error('Unauthorized');
    }
    
    // Check issuer
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
      res.status(401).send({ error: { message: 'Invalid issuer', status: 'UNAUTHENTICATED' } });
      throw new Error('Invalid issuer');
    }

    return payload;
  } catch (error: any) {
    console.error('Internal auth verification failed:', error.message);
    res.status(401).send({ error: { message: 'Invalid token: ' + error.message, status: 'UNAUTHENTICATED' } });
    throw error;
  }
}

export async function verifyInternalTaskRequest(req: Request, expectedAudience: string): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthenticated internal task');
  }

  const ticket = await authClient.verifyIdToken({ idToken: authHeader.slice('Bearer '.length) });
  const payload = ticket.getPayload();
  if (!payload || payload.aud !== expectedAudience) {
    throw new Error('Invalid internal task audience');
  }
  if (!ALLOWED_SERVICE_ACCOUNTS.includes(payload.email || '')) {
    throw new Error(`Unauthorized internal task service account: ${payload.email || 'unknown'}`);
  }
  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
    throw new Error('Invalid internal task issuer');
  }
}
