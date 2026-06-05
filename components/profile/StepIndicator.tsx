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
                <div
                  className="flex-1 h-0.5 rounded-full"
                  style={{ background: done || active ? "#6227d7" : "#e6e9e6" }}
                />
              )}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{
                  background: done ? "#6227d7" : active ? "#6227d7" : "#e6e9e6",
                  color: done || active ? "#fff" : "#787880",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 rounded-full"
                  style={{ background: done ? "#6227d7" : "#e6e9e6" }}
                />
              )}
            </div>
            <span
              className="text-[10px] font-medium"
              style={{ color: active ? "#6227d7" : done ? "#2b2d31" : "#787880" }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
