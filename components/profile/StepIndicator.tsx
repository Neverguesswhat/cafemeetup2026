"use client";

const STEPS = ["Photos", "Basics", "Interests", "Safety"];

interface StepIndicatorProps {
  current: number;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-col items-center gap-1 flex-1">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={`flex-1 h-0.5 rounded-full ${done || active ? "bg-primary" : "bg-border"}`} />
              )}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold shrink-0
                  ${done || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {done ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
            <span className={`text-xs font-medium ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
