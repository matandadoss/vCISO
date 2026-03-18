import { initializeFirebase } from "./firebase";

/**
 * A wrapper around the native fetch API that automatically injects
 * the Firebase authentication token into the Authorization header.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = "mock-token";

  const isConfigured = await initializeFirebase();

  if (isConfigured) {
    const { auth } = await import("./firebase");
    if (auth && auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch (error) {
        console.error("Failed to get Firebase token:", error);
      }
    }
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Intercept failed API calls (e.g. 400s and 500s) and log them to the backend tracking DB
  if (!response.ok) {
    let errorContext = "";
    try {
      errorContext = await response.clone().text();
    } catch(e) {}

    try {
      const payload = {
        error_code: response.status.toString(),
        error_message: `API Request Failed: ${response.statusText}`,
        url: url,
        route: typeof window !== 'undefined' ? window.location.pathname : 'server',
        frontend_version: '0.1.0',
        additional_context: {
          method: options.method || 'GET',
          response_text: errorContext.substring(0, 1000) // truncate massive payloads
        }
      };
      
      // Fire-and-forget the log so it doesn't block the actual error flow
      fetch(`${"https://vciso-backend-7gkk7pkdya-uc.a.run.app"}/api/v1/bugs/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(e => console.error("Could not send bug report", e));
    } catch(e) {
      console.error("Bug logging interceptor failed", e);
    }
  }

  return response;
}
