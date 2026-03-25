"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { initializeFirebase } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithMicrosoft: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPassword: async () => {},
  signOut: async () => {},
  getToken: async () => null,
  isMock: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let unsubscribe: any = null;

    // Failsafe: if the entire initAuth async chain hangs (e.g. unresolving fetch or import), aggressively unlock.
    const failsafeTimer = setTimeout(() => {
      console.warn("AuthContext initialization failsafe triggered! The async chain hung.");
      setLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        const isSuccess = await initializeFirebase();
        setConfigured(isSuccess);

        if (!isSuccess) {
          clearTimeout(failsafeTimer);
          setLoading(false);
          return;
        }

        const { auth } = await import("@/lib/firebase");
        
        try {
          const redirectResult = await getRedirectResult(auth);
          if (redirectResult && redirectResult.user) {
            console.log("Automatically resumed session via redirect:", redirectResult.user.email);
          }
        } catch (redirectError: any) {
          console.error("Firebase Redirect Login Failed:", redirectError.code, redirectError.message);
        }

        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          clearTimeout(failsafeTimer);
          setLoading(false);
        });
        
      } catch (error) {
        console.error("Auth initialization failed fundamentally:", error);
        setConfigured(false);
        clearTimeout(failsafeTimer);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      clearTimeout(failsafeTimer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (!configured) {
        // In local developer mode ONLY!
        if (process.env.NODE_ENV !== "production") {
          setUser({ uid: "mock-123", email: "demo@vciso.local", displayName: "Demo User", getIdToken: async () => "mock-token" } as any);
        } else {
           throw new Error("Firebase Authentication is strictly required in production domains.");
        }
        return;
      }
      const { auth } = await import("@/lib/firebase");
      const provider = new GoogleAuthProvider();
      // Try popup first since it avoids cross-origin redirect state loss in many scenarios
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        console.warn("Popup blocked or unsupported, falling back to redirect:", popupError.code);
        // Fallback to redirect if popup is blocked or environment doesn't support it (e.g. some incognito modes)
        await signInWithRedirect(auth, provider);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      if (!configured) {
        if (process.env.NODE_ENV !== "production") {
          setUser({ uid: "mock-ms-123", email: "demo@vciso.local", displayName: "Demo User", getIdToken: async () => "mock-token" } as any);
        } else {
           throw new Error("Firebase Authentication is strictly required in production domains.");
        }
        return;
      }
      const { auth } = await import("@/lib/firebase");
      const provider = new OAuthProvider('microsoft.com');
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        console.warn("Popup blocked or unsupported for Microsoft, falling back to redirect:", popupError.code);
        await signInWithRedirect(auth, provider);
      }
    } catch (error) {
      console.error("Error signing in with Microsoft", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      if (!configured) {
        if (process.env.NODE_ENV !== "production") {
          setUser({ uid: "mock-123", email, displayName: "Demo User", getIdToken: async () => "mock-token" } as any);
        } else {
           throw new Error("Firebase Authentication is strictly required in production domains.");
        }
        return;
      }
      const { auth } = await import("@/lib/firebase");
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      if (!configured) {
        if (process.env.NODE_ENV !== "production") {
          setUser({ uid: "mock-123", email, displayName: "Demo User", getIdToken: async () => "mock-token" } as any);
        } else {
           throw new Error("Firebase Authentication is strictly required in production domains.");
        }
        return;
      }
      const { auth } = await import("@/lib/firebase");
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!configured) {
        return; // Mock success
      }
      const { auth } = await import("@/lib/firebase");
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error resetting password", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (!configured) {
        setUser(null);
        return;
      }
      const { auth } = await import("@/lib/firebase");
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const getToken = async () => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error("Error getting token", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithMicrosoft, signInWithEmail, signUpWithEmail, resetPassword, signOut, getToken, isMock: !configured }}>
      {children}
    </AuthContext.Provider>
  );
};
