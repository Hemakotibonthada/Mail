import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('Loading Firebase config...');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('Private Key loaded:', !!process.env.FIREBASE_PRIVATE_KEY);

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.asia-southeast1.firebasedatabase.app`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
});

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const bucket = storage.bucket();

export default admin;
