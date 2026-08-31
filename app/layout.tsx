import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { NavBar } from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Interview Coach",
  description:
    "Practice interview questions on webcam and get instant AI-driven feedback, powered by your own OpenAI API key.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <ApiKeyGate>
          <NavBar />
          <main className="flex flex-1 flex-col">{children}</main>
        </ApiKeyGate>
      </body>
    </html>
  );
}
