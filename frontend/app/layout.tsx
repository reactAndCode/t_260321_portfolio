import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funding Fee Dashboard",
  description: "Real-time funding fee heatmap across major exchanges.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
