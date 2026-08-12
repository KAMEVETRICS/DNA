import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return {
    title: "DNA — Your data has a shape",
    description: "Turn the data you own into a private, portable identity—and discover how you align with the people you choose.",
    metadataBase: new URL(origin),
    icons: { icon: "/og.png", apple: "/og.png" },
    openGraph: {
      title: "DNA — Your data has a shape",
      description: "Connect your context. Reveal your pattern. Find your people.",
      url: origin,
      siteName: "DNA",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024, alt: "DNA — Your data has a shape" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "DNA — Your data has a shape",
      description: "Connect your context. Reveal your pattern. Find your people.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
