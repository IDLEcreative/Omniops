import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionTrackerProvider } from "@/components/SessionTrackerProvider";
import { SentryProvider } from "@/lib/monitoring/sentry-client-provider";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { Toaster } from "sonner";
import "./globals.css";

// Using system fonts only (no external font loading due to network restrictions)
// This provides excellent performance and works offline
const fontVariables = "--font-sans --font-mono";

export const metadata: Metadata = {
  title: "Omniops - AI Customer Service Platform",
  description: "Intelligent customer support that scales with your business. Handle queries in 40+ languages with AI-powered assistance.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="antialiased h-full min-h-screen bg-background font-sans"
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <SentryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionTrackerProvider />
            <AuthProvider>
              {children}
            </AuthProvider>
            <CookieConsentBanner />
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </SentryProvider>
      </body>
    </html>
  );
}
