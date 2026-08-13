import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Route 53 - AWS Management Console",
  description: "Amazon Route 53 scalable DNS and Domain Name Registration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
