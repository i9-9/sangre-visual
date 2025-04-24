import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVG Visual",
  description: "Interactive SVG visualization",
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
