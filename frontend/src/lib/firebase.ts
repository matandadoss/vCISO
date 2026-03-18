import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

let app: any = null;
let auth: any = null;
let isConfigured = false;
let configPromise: Promise<boolean> | null = null;

export const initializeFirebase = async () => {
  if (configPromise) return configPromise;

  configPromise = (async () => {
    try {
      if (getApps().length > 0) {
        app = getApps()[0];
        auth = getAuth(app);
        isConfigured = true;
        return true;
      }

      const res = await fetch("/api/config/firebase");
      if (!res.ok) {
        console.warn("Firebase configuration not available from server.");
        return false;
      }

      const config = await res.json();
      if (!config.apiKey) {
         return false;
      }

      app = initializeApp(config);
      auth = getAuth(app);
      isConfigured = true;
      return true;
    } catch (e) {
      console.error("Failed to initialize Firebase dynamically.", e);
      return false;
    }
  })();

  return configPromise;
};

export { app, auth, isConfigured };
