/**
 * Session Persistence Layer
 *
 * Uses IndexedDB as persistent storage for auth tokens.
 * iOS and Android PWAs can aggressively clear localStorage,
 * so we use IndexedDB as a more persistent backup.
 */

const DB_NAME = "lava-wallet-session";
const DB_VERSION = 1;
const STORE_NAME = "session";
const TOKEN_KEY = "dynamic_auth_token";

// Dynamic Labs SDK localStorage keys
const DYNAMIC_AUTH_TOKEN_KEY = "dynamic_authentication_token";
const DYNAMIC_REFRESH_TOKEN_KEY = "dynamic_refresh_token";
const DYNAMIC_USER_KEY = "dynamic_user";

interface SessionData {
  authToken: string;
  refreshToken: string | null;
  userData: string | null;
  savedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

async function saveToIndexedDB(data: SessionData): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put({ key: TOKEN_KEY, ...data });
    request.onerror = () => reject(new Error("Failed to save to IndexedDB"));
    request.onsuccess = () => resolve();
    transaction.oncomplete = () => db.close();
  });
}

async function loadFromIndexedDB(): Promise<SessionData | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(TOKEN_KEY);
      request.onerror = () => reject(new Error("Failed to load from IndexedDB"));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { authToken, refreshToken, userData, savedAt } = result;
          resolve({ authToken, refreshToken, userData, savedAt });
        } else {
          resolve(null);
        }
      };
      transaction.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

async function clearFromIndexedDB(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(TOKEN_KEY);
    request.onerror = () => reject(new Error("Failed to clear IndexedDB"));
    request.onsuccess = () => resolve();
    transaction.oncomplete = () => db.close();
  });
}

/** Backup current Dynamic session to IndexedDB. Call after login. */
export async function backupSession(): Promise<void> {
  try {
    const authToken = localStorage.getItem(DYNAMIC_AUTH_TOKEN_KEY);
    if (!authToken) return;

    await saveToIndexedDB({
      authToken,
      refreshToken: localStorage.getItem(DYNAMIC_REFRESH_TOKEN_KEY),
      userData: localStorage.getItem(DYNAMIC_USER_KEY),
      savedAt: Date.now(),
    });
    console.log("[Session] Backed up to IndexedDB");
  } catch (error) {
    console.error("[Session] Backup failed:", error);
  }
}

/** Restore Dynamic session from IndexedDB. Call BEFORE Dynamic SDK loads. */
export async function restoreSession(): Promise<boolean> {
  try {
    // Skip if localStorage already has token
    if (localStorage.getItem(DYNAMIC_AUTH_TOKEN_KEY)) return false;

    const sessionData = await loadFromIndexedDB();
    if (!sessionData?.authToken) return false;

    // Check if backup is too old (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionData.savedAt > maxAge) {
      await clearFromIndexedDB();
      return false;
    }

    // Restore to localStorage
    localStorage.setItem(DYNAMIC_AUTH_TOKEN_KEY, sessionData.authToken);
    if (sessionData.refreshToken) {
      localStorage.setItem(DYNAMIC_REFRESH_TOKEN_KEY, sessionData.refreshToken);
    }
    if (sessionData.userData) {
      localStorage.setItem(DYNAMIC_USER_KEY, sessionData.userData);
    }

    console.log("[Session] Restored from IndexedDB");
    return true;
  } catch {
    return false;
  }
}

/** Clear session backup. Call on logout. */
export async function clearSessionBackup(): Promise<void> {
  try {
    await clearFromIndexedDB();
  } catch (error) {
    console.error("[Session] Clear failed:", error);
  }
}


