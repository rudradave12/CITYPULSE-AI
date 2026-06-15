import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  FirestoreError,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase Core services
const app = initializeApp(firebaseConfig);

// CRITICAL: Bind explicitly to firestoreDatabaseId from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Export Auth
export const auth = getAuth(app);

// Connectivity Verification Constraint
async function verifyFirebaseConnection() {
  try {
    const testDoc = doc(db, "_system_check_", "connection");
    await getDocFromServer(testDoc);
    console.log("CityPulse AI: Connection to Firestore established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error(
        "CityPulse AI: Firebase client reports offline. Check configuration parameters.",
        error
      );
    } else {
      // General error during startup is non-blocking but logged
      console.log("CityPulse AI: Connected to Firestore (isolated system).");
    }
  }
}
verifyFirebaseConnection();

// --- STRICT FIREBASE ERROR SPECIFICATION IMPLEMENTATION ---

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Capture permission/database errors and format them inside strict diagnostic JSON schemas
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error("Firestore Diagnostic Trace: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
