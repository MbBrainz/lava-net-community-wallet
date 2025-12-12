/**
 * Firebase Module Exports
 *
 * Client-side exports only. For server-side (admin) functions,
 * import directly from './admin' in API routes.
 */

export {
  firebaseConfig,
  vapidKey,
  getFirebaseApp,
  getFirebaseMessaging,
  isFirebaseConfigured,
} from "./config";
