import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SecureNote',
  description: 'A secure note-taking application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Basic dark mode preference check. For a full theme switcher, this would be more complex.
  // This is a simplified approach for initial accessibility.
  // A proper theme switcher would use client-side state and localStorage.
  // For this example, we'll assume a preference can be set via OS settings.
  // This script is not ideal for SSR/Next.js and should be replaced with a proper theme provider in a real app.
  const darkModeScript = `
    (function() {
      try {
        const preference = window.localStorage.getItem('theme') || 'system';
        if (preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // Failsafe
        console.warn('Could not set dark mode preference:', e);
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
