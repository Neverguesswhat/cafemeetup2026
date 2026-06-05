"use client";

import { Button } from "@/components/ui/button";

interface InterestChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function InterestChip({ label, selected, onToggle }: InterestChipProps) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className="rounded-full"
    >
      {label}
    </Button>
  );
}
