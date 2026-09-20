import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sql-agent.coral-sun-0742.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SQL Agent — Ask your data. Get the signal.",
  description:
    "A Supabase database, an AI agent with vectorized schema context, and a Power BI view for turning questions into SQL answers.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "SQL Agent — Ask your data. Get the signal.",
    description:
      "Turn plain-English questions into grounded SQL answers from your Supabase data.",
    type: "website",
    url: siteUrl,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "SQL Agent data workspace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL Agent — Ask your data. Get the signal.",
    description:
      "Turn plain-English questions into grounded SQL answers from your Supabase data.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
