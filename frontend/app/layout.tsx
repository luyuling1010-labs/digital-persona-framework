import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice-First Persona Framework",
  description: "Generic digital persona RAG demo"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
