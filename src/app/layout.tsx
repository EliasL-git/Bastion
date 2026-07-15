import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bastion - DNS Sinkhole Dashboard",
  description: "Network-wide ad blocking and DNS query monitoring dashboard. Block trackers, malware, and unwanted content at the DNS level.",
  keywords: ["DNS", "sinkhole", "ad blocking", "network", "privacy", "Pi-Hole alternative"],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Bastion - DNS Sinkhole Dashboard",
    description: "Network-wide ad blocking and DNS query monitoring",
    siteName: "Bastion",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bastion - DNS Sinkhole Dashboard",
    description: "Network-wide ad blocking and DNS query monitoring",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
