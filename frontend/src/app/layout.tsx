import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { OnboardingGuard } from "@/components/layout/OnboardingGuard";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ControlTowerProvider } from "@/contexts/ControlTowerContext";
import { ControlTowerDrawer } from "@/components/layout/ControlTowerDrawer";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Virtual CISO Platform",
  description: "AI-powered security posture management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex antialiased bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RoleProvider>
              <ControlTowerProvider>
                <AuthGuard>
                  <OnboardingGuard>
                    {children}
                    <ControlTowerDrawer />
                  </OnboardingGuard>
                </AuthGuard>
              </ControlTowerProvider>
            </RoleProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
