import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Spot AI Content — Can You Trust What You See?",
  description:
    "Detect AI-generated images, videos, and text with cutting-edge machine learning. Find out if content was created by a human or an AI.",
  keywords: [
    "AI detection",
    "deepfake detection",
    "AI image detection",
    "AI text detection",
    "GPT detection",
    "DALL-E detection",
    "Midjourney detection",
  ],
  openGraph: {
    title: "Spot AI Content — Can You Trust What You See?",
    description:
      "Detect AI-generated images, videos, and text with cutting-edge machine learning.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-paper text-navy antialiased">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
        </SessionProvider>
      </body>
    </html>
  );
}
