"use client";

interface CuppaGuideProps {
  message: string;
}

export function CuppaGuide({ message }: CuppaGuideProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 mb-6 bg-[#f0ebfb] rounded-2xl">
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
        style={{ background: "#6227d7" }}
      >
        C
      </div>
      <p className="text-sm text-[#2b2d31] leading-snug pt-1">{message}</p>
    </div>
  );
}
