"use client";

export function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1d21] p-8">
      <div
        className="relative overflow-hidden bg-white"
        style={{
          width: 393,
          height: 852,
          borderRadius: 52,
          boxShadow: "0 0 0 10px #373e44, 0 40px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-8 pt-4 pb-2 text-[15px] font-semibold">
          <span>9:41</span>
          <div
            className="absolute left-1/2 -translate-x-1/2 top-2 bg-black rounded-full"
            style={{ width: 120, height: 34 }}
          />
          <div className="flex items-center gap-1 text-xs">
            <span>●●●</span>
            <span>WiFi</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Screen content */}
        <div className="h-full overflow-y-auto pb-24">{children}</div>
      </div>
    </div>
  );
}
