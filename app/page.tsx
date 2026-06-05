import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1d21] flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Cafe Meetup 2026</h1>
        <p className="text-[#787880] text-sm">Prototype screens</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/profile"
          className="flex items-center justify-between h-14 px-5 rounded-2xl bg-[#6227d7] text-white font-semibold text-sm"
        >
          <span>Profile Setup</span>
          <span>→</span>
        </Link>
        <Link
          href="/browse"
          className="flex items-center justify-between h-14 px-5 rounded-2xl bg-[#0c8871] text-white font-semibold text-sm"
        >
          <span>Browse Profiles (Chooser)</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
