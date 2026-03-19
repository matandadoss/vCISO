"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogIn, AlertCircle, Mail, Key } from "lucide-react";
import { isConfigured } from "@/lib/firebase";
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, loading, isMock } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    // If the user becomes authenticated, determine where to route them
    if (!loading && user) {
      const hasCompletedSetup = localStorage.getItem(`vCISO_Setup_${user.uid}`);
      if (hasCompletedSetup === "true") {
        router.push("/"); // Standard dashboard
      } else {
        router.push("/setup"); // First-time onboarding flow
      }
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
      // On success, useEffect above will handle the redirect
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (mode !== "reset" && !password) {
      setError("Please enter your password.");
      return;
    }
    if ((mode === "signup" || mode === "reset") && !turnstileToken && process.env.NODE_ENV === "production") {
      setError("Please complete the security challenge.");
      return;
    }
    try {
      setError(null);
      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else if (mode === "signin") {
        await signInWithEmail(email, password);
      } else if (mode === "reset") {
        await resetPassword(email);
        setMessage("Password reset email sent (if account exists).");
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex-1 min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
           <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p className="mt-4 text-muted-foreground animate-pulse">Initializing Authentication Sequence...</p>
        </div>
      </div>
    );
  }

  // Prevent flash of login screen right before redirect
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center flex-col items-center">
          <div className="p-3 bg-primary/10 rounded-2xl mb-4 border border-primary/20 shadow-sm backdrop-blur-md">
             <ShieldAlert className="w-12 h-12 text-primary" />
          </div>
          <h2 className="mt-2 text-center text-4xl font-extrabold text-foreground tracking-tight">
            Virtual CISO
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground max-w-[280px]">
            Enterprise Security Posture Management & AI-Driven Threat Correlation
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-card py-10 px-6 sm:px-10 border border-border rounded-xl shadow-2xl backdrop-blur-sm">
          
          <div className="mb-6 flex flex-col items-center text-center">
             <h3 className="text-xl font-bold text-foreground mb-1">
               {mode === "signin" ? "Authenticate" : mode === "signup" ? "Create Account" : "Reset Password"}
             </h3>
             <p className="text-sm text-muted-foreground">
               {mode === "reset" ? "Enter your email to receive a reset link." : "Sign in to access your organization's security dashboard."}
             </p>
          </div>

          {!isConfigured && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3 text-amber-600 dark:text-amber-400">
               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <div className="text-sm">
                 <strong>Firebase Not Configured</strong>
                 <p className="mt-1 opacity-90">Environment variables are missing. Using mock simulator authentication for local development.</p>
               </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-600 dark:text-green-400 text-sm text-center">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                    placeholder="Email address"
                    required
                  />
                </div>
              </div>
              {mode !== "reset" && (
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Key className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                      placeholder="Password"
                      required
                    />
                  </div>
                </div>
              )}
              
              {(mode === "signup" || mode === "reset") && (
                <div className="flex justify-center my-4">
                   <Turnstile 
                     siteKey="1x00000000000000000000AA" 
                     onSuccess={(token) => setTurnstileToken(token)}
                   />
                </div>
              )}
              
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
              >
                 <LogIn className="w-5 h-5" />
                 {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </button>
            </form>

            <div className="relative pt-2 pb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or</span>
              </div>
            </div>

             <button
                type="button"
                onClick={handleSignIn}
                className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-border rounded-lg shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted/50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
             >
                 {isConfigured ? (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {process.env.NODE_ENV !== "production" ? "Bypass Login" : "Demo Login"}
                  </>
                )}
             </button>
             
             <div className="text-center mt-4 pt-2 flex flex-col gap-2">
               {mode === "signin" && (
                 <button 
                   type="button"
                   onClick={() => setMode("reset")}
                   className="text-sm text-primary hover:underline bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                 >
                   Forgot your password?
                 </button>
               )}
               <button 
                 type="button"
                 onClick={() => {
                   setMode(mode === "signin" ? "signup" : "signin");
                   setTurnstileToken(null);
                   setError(null);
                 }}
                 className="text-sm text-primary hover:underline bg-transparent border-none p-0 cursor-pointer focus:outline-none"
               >
                 {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
               </button>
             </div>
          </div>
          
          <div className="mt-8 text-center text-xs text-muted-foreground flex flex-col gap-1">
             <p>By signing in, you agree to our Terms of Service.</p>
             <p>Protected by reCAPTCHA Enterprise.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
