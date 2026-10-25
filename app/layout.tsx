import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsIdentity } from "@/components/analytics/analytics-identity";
import { getCurrentProfile } from "@/lib/profile";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Hive · Skills for AI agents",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getCurrentProfile();

  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <html lang="en" className={cn(display.variable, sans.variable, mono.variable)}>
        <body className="bg-background text-foreground font-sans antialiased">
          <SiteHeader />
          <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</main>
          <SiteFooter />
          <AnalyticsIdentity stack={profile?.stack ?? null} />
          <Toaster position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
