import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
export const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

import { 
  Product, 
  Order, 
  Ingredient, 
  Volunteer, 
  VolunteerAvailability 
} from './types.ts';

// Initialize Firebase Admin
let adminApp: admin.app.App;
if (!admin.apps.length) {
  console.log('Initializing Firebase Admin with projectId:', firebaseConfig.projectId);
  try {
    // Try to initialize with explicit projectId from config first
    adminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
    console.log('Firebase Admin initialized successfully with projectId. App name:', adminApp.name);
  } catch (err) {
    console.warn('Failed to initialize Firebase Admin with explicit projectId, trying default:', err);
    try {
      adminApp = admin.initializeApp();
      console.log('Firebase Admin initialized successfully with default config. App name:', adminApp.name);
    } catch (defaultErr) {
      console.error('Failed to initialize Firebase Admin completely:', defaultErr);
      throw defaultErr;
    }
  }
} else {
  console.log('Firebase Admin already initialized.');
  adminApp = admin.app();
}

// Get Firestore instance for the specific database ID
let firestore: admin.firestore.Firestore;
try {
  const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;
    
  console.log('Attempting to initialize Firestore with databaseId:', dbId || '(default)');
  firestore = dbId ? getFirestore(adminApp, dbId) : getFirestore(adminApp);
} catch (err) {
  console.error('Failed to initialize Firestore with databaseId:', firebaseConfig.firestoreDatabaseId, err);
  firestore = getFirestore(adminApp);
}

console.log('Firestore initialized. Database ID:', firestore.databaseId);
console.log('Actual Firestore Project ID:', (firestore as any)._projectId || (firestore as any).projectId);
console.log('Config Project ID:', firebaseConfig.projectId);
console.log('GOOGLE_CLOUD_PROJECT env:', process.env.GOOGLE_CLOUD_PROJECT);
console.log('Service account email:', (adminApp as any).options?.credential?.getAccessToken?.toString());

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationType = typeof OperationType[keyof typeof OperationType];

interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    debug?: any;
  }
}

function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'SERVER_ADMIN',
      email: 'SERVER_ADMIN',
      debug: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
        firebaseConfigProjectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId,
        actualFirestoreProjectId: (firestore as any)._projectId || (firestore as any).projectId,
        actualFirestoreDatabaseId: firestore.databaseId
      }
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface IDatabase {
  init(): Promise<void>;
  hasOrderForIdentifier(identifier: string): Promise<boolean>;
  getSystemValue(key: string): Promise<any | null>;
  setSystemValue(key: string, value: any): Promise<void>;
  getAll<T>(table: string): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | null>;
  insert(table: string, id: string, data: any): Promise<void>;
  update(table: string, id: string, data: any): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  saveVerificationCode(identifier: string, code: string, expiresAt: number): Promise<void>;
  getVerificationCode(identifier: string): Promise<{ code: string; expires_at: number } | null>;
  deleteVerificationCode(identifier: string): Promise<void>;
  verifyIdToken(idToken: string): Promise<any>;
  saveSession(token: string, expiresAt: number): Promise<void>;
  getSession(token: string): Promise<{ expires_at: number } | null>;
  deleteSession(token: string): Promise<void>;
  bulkInsert(table: string, items: any[], idField: string): Promise<void>;
}

class FirestoreDB implements IDatabase {
  async init(): Promise<void> {
    // Test connection
    const path = 'system/connection_test';
    try {
      console.log('Testing Firestore connection to:', path);
      console.log('Firestore Database ID:', firestore.databaseId);
      
      // Use a promise with timeout for the connection test
      const connectionTest = firestore.collection('system').doc('connection_test').get();
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore connection timeout')), 10000)
      );
      
      const snap = await Promise.race([connectionTest, timeout]) as admin.firestore.DocumentSnapshot;
      console.log('Firestore connection successful. Snap exists:', snap.exists);
    } catch (error) {
      console.error('Firestore connection failed during init:', error);
      
      // If we failed with PERMISSION_DENIED or NOT_FOUND and we are using a named database, try falling back to (default)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNotFoundError = errorMessage.includes('NOT_FOUND') || errorMessage.includes('5');
      const isPermissionError = errorMessage.includes('PERMISSION_DENIED');
      
      if ((isPermissionError || isNotFoundError) && firestore.databaseId !== '(default)') {
        console.log(`Falling back to (default) database due to ${isPermissionError ? 'PERMISSION_DENIED' : 'NOT_FOUND'}.`);
        try {
          firestore = getFirestore(adminApp);
          console.log('New Firestore Database ID:', firestore.databaseId);
          const snap = await firestore.collection('system').doc('connection_test').get();
          console.log('Firestore connection to (default) successful. Snap exists:', snap.exists);
        } catch (fallbackError) {
          console.error('Firestore connection to (default) also failed:', fallbackError);
        }
      }
    }
  }

  async hasOrderForIdentifier(identifier: string): Promise<boolean> {
    try {
      const snap1 = await firestore.collection('orders').where('customerEmail', '==', identifier).get();
      const snap2 = await firestore.collection('orders').where('customerContact', '==', identifier).get();
      
      return !snap1.empty || !snap2.empty;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      return false;
    }
  }

  async getSystemValue(key: string): Promise<any | null> {
    const path = `system/${key}`;
    try {
      console.log('Getting system value for:', key);
      const snap = await firestore.collection('system').doc(key).get();
      console.log(`System value for ${key} exists:`, snap.exists);
      return snap.exists ? (snap.data() as any).value : null;
    } catch (error) {
      console.error(`Failed to get system value for ${key}:`, error);
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  async setSystemValue(key: string, value: any): Promise<void> {
    try {
      await firestore.collection('system').doc(key).set({ value });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `system/${key}`);
    }
  }

  async getAll<T>(table: string): Promise<T[]> {
    try {
      const snap = await firestore.collection(table).get();
      return snap.docs.map(doc => doc.data() as T);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, table);
      return [];
    }
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    try {
      const snap = await firestore.collection(table).doc(id).get();
      return snap.exists ? snap.data() as T : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${table}/${id}`);
      return null;
    }
  }

  async insert(table: string, id: string, data: any): Promise<void> {
    try {
      await firestore.collection(table).doc(id).set(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${table}/${id}`);
    }
  }

  async update(table: string, id: string, data: any): Promise<void> {
    try {
      await firestore.collection(table).doc(id).update(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${table}/${id}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      await firestore.collection(table).doc(id).delete();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${table}/${id}`);
    }
  }

  async saveVerificationCode(identifier: string, code: string, expiresAt: number): Promise<void> {
    try {
      await firestore.collection('verification_codes').doc(identifier).set({ code, expires_at: expiresAt });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `verification_codes/${identifier}`);
    }
  }

  async getVerificationCode(identifier: string): Promise<{ code: string; expires_at: number } | null> {
    try {
      const snap = await firestore.collection('verification_codes').doc(identifier).get();
      return snap.exists ? snap.data() as any : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `verification_codes/${identifier}`);
      return null;
    }
  }

  async deleteVerificationCode(identifier: string): Promise<void> {
    try {
      await firestore.collection('verification_codes').doc(identifier).delete();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `verification_codes/${identifier}`);
    }
  }

  async verifyIdToken(idToken: string): Promise<any> {
    return admin.auth().verifyIdToken(idToken);
  }

  async saveSession(token: string, expiresAt: number): Promise<void> {
    try {
      await firestore.collection('sessions').doc(token).set({ expires_at: expiresAt });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sessions/${token}`);
    }
  }

  async getSession(token: string): Promise<{ expires_at: number } | null> {
    try {
      const snap = await firestore.collection('sessions').doc(token).get();
      return snap.exists ? snap.data() as any : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `sessions/${token}`);
      return null;
    }
  }

  async deleteSession(token: string): Promise<void> {
    try {
      await firestore.collection('sessions').doc(token).delete();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sessions/${token}`);
    }
  }

  async bulkInsert(table: string, items: any[], idField: string): Promise<void> {
    try {
      for (let i = 0; i < items.length; i += 500) {
        const batch = firestore.batch();
        const chunk = items.slice(i, i + 500);
        for (const item of chunk) {
          const id = item[idField];
          batch.set(firestore.collection(table).doc(id), item);
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, table);
    }
  }
}

export const db: IDatabase = new FirestoreDB();
