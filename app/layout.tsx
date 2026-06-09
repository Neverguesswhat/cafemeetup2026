import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStateProvider } from "@/lib/state";
import { DevConsole } from "@/components/DevConsole";

export const metadata: Metadata = {
  title: "Cafe Meetup 2026",
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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="h-full bg-slate-900 text-[#2b2d31] antialiased flex items-center justify-center overflow-hidden"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif' }}
      >
        <AppStateProvider>
          {/* Simulated iOS Phone Mockup Container */}
          <div className="relative w-full h-full sm:w-[390px] sm:h-[844px] bg-white sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden sm:ring-1 sm:ring-slate-700/50">
            {/* Notch & Status Bar Simulation on Desktop */}
            <div className="hidden sm:flex shrink-0 h-10 bg-white items-center justify-between px-6 z-40 select-none">
              <span className="text-sm font-semibold text-slate-800">9:41</span>
              {/* Notch */}
              <div className="w-32 h-6 bg-slate-800 rounded-b-2xl absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800 shrink-0" />
                <div className="w-12 h-1 bg-slate-950 rounded-full shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span>📶</span>
                <span>🛜</span>
                <span>🔋</span>
              </div>
            </div>

            {/* Simulated App Viewport */}
            <div className="flex-1 flex flex-col min-h-0 relative bg-background">
              <div className="flex-1 relative z-10 min-h-0 w-full h-full flex flex-col">
                {children}
              </div>
            </div>

            {/* Simulator Controls in Mockup Stacking Context */}
            <DevConsole />

            {/* iOS Home Indicator on Desktop */}
            <div className="hidden sm:flex shrink-0 h-6 bg-white items-center justify-center pb-2 z-40 select-none">
              <div className="w-32 h-1 bg-slate-300 rounded-full" />
            </div>
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}
