import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "FleetCast NYC",
  description: "Taxi demand forecasting and reposition simulation for NYC taxi zones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
