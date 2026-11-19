import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollectWise",
  description: "Waste collection check-in and alerts for Desa Mentari, Block 2",
};

export const viewport: Viewport = {
  themeColor: "#1f5a3d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
