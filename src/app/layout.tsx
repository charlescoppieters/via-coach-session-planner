import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { theme } from "@/styles/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Via Session Planner",
  description: "AI-powered coaching session planner for football coaches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: theme.colors.background.primary,
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fontFamily.primary,
          minHeight: '100vh',
        }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
