'use client'

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex items-center justify-center bg-background antialiased`}>
        <div className="text-center space-y-4 max-w-lg p-6 bg-card rounded-lg shadow-lg border border-border">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Critical System Error</h2>
          <p className="text-muted-foreground">
            A catastrophic issue has occurred at the application root level. Our AI and engineering team have been notified.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors cursor-pointer font-medium"
              onClick={() => reset()}
            >
              Try again
            </button>
            <button
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors cursor-pointer font-medium"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
