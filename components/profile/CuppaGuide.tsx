"use client";

interface CuppaGuideProps {
  message: string;
}

export function CuppaGuide({ message }: CuppaGuideProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 mb-6 bg-muted rounded-2xl">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
        C
      </div>
      <p className="text-sm text-foreground leading-snug pt-1">{message}</p>
    </div>
  );
}
