"use client";

interface InterestChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function InterestChip({ label, selected, onToggle }: InterestChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
      style={{
        background: selected ? "#6227d7" : "transparent",
        color: selected ? "#fff" : "#2b2d31",
        borderColor: selected ? "#6227d7" : "#e6e9e6",
      }}
    >
      {label}
    </button>
  );
}
