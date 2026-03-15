import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { 
  Product, 
  Order, 
  Ingredient, 
  Volunteer, 
  VolunteerAvailability 
} from './types.ts';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const firestore = getFirestore(firebaseConfig.firestoreDatabaseId);

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
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'SERVER_ADMIN',
      email: 'SERVER_ADMIN',
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
  getSystemValue(key: string): Promise<string | null>;
  setSystemValue(key: string, value: string): Promise<void>;
  getAll<T>(table: string): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | null>;
  insert(table: string, id: string, data: any): Promise<void>;
  update(table: string, id: string, data: any): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  saveVerificationCode(identifier: string, code: string, expiresAt: number): Promise<void>;
  getVerificationCode(identifier: string): Promise<{ code: string; expires_at: number } | null>;
  deleteVerificationCode(identifier: string): Promise<void>;
  saveSession(token: string, expiresAt: number): Promise<void>;
  getSession(token: string): Promise<{ expires_at: number } | null>;
  deleteSession(token: string): Promise<void>;
  bulkInsert(table: string, items: any[], idField: string): Promise<void>;
}

class FirestoreDB implements IDatabase {
  async init(): Promise<void> {
    // Test connection
    try {
      await firestore.collection('system').doc('connection_test').get();
    } catch (error) {
      if (error instanceof Error && error.message.includes('offline')) {
        console.error("Please check your Firebase configuration.");
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

  async getSystemValue(key: string): Promise<string | null> {
    try {
      const snap = await firestore.collection('system').doc(key).get();
      return snap.exists ? (snap.data() as any).value : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `system/${key}`);
      return null;
    }
  }

  async setSystemValue(key: string, value: string): Promise<void> {
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
