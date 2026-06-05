import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cafe Meetup",
  description: "Meet someone. For real.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Cafe Meetup" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body
        className="h-full bg-white text-[#2b2d31] antialiased"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
