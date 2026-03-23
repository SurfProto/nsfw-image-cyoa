import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "NSFW Image-to-CYOA Story",
  description: "Uncensored image-to-story CYOA generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="bg-zinc-950 text-zinc-100 min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
