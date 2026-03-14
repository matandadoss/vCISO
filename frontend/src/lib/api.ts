import { auth, isConfigured } from "./firebase";

/**
 * A wrapper around the native fetch API that automatically injects
 * the Firebase authentication token into the Authorization header.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = "mock-token";

  if (isConfigured && auth && auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (error) {
      console.error("Failed to get Firebase token:", error);
    }
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
}
