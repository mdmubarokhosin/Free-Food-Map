import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ফ্রি ফুড ম্যাপ - সারাবছর ফ্রি খাবারের স্পট খুঁজুন",
  description: "আপনার শহরে কোথায় ফ্রি খাবার পাওয়া যায় তা সহজে খুঁজুন। ফ্রি মিল, স্যুপ কিচেন, গ্রোসারি সহায়তা এবং সাপ্তাহিক খাবার বিতরণের স্থান খুঁজে বের করুন।",
  keywords: ["ফ্রি খাবার", "ফ্রি মিল", "স্যুপ কিচেন", "গ্রোসারি সহায়তা", "বাংলাদেশ", "খাবার বিতরণ"],
  authors: [{ name: "Mubarak Hosin" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ফ্রি ফুড ম্যাপ",
    description: "আপনার শহরে কোথায় ফ্রি খাবার পাওয়া যায় তা সহজে খুঁজুন",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
          crossOrigin=""
        />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
