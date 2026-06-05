"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfileCardProps {
  name: string;
  age: number;
  job: string;
  distance: string;
  interests: string[];
  onChoose: () => void;
  onViewProfile: () => void;
}

export function ProfileCard({
  name,
  age,
  job,
  distance,
  interests,
  onChoose,
  onViewProfile,
}: ProfileCardProps) {
  return (
    <div className="mx-4 rounded-3xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      {/* Photo */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ height: 320, background: "linear-gradient(160deg, #e6e9e6 0%, #c8ccc8 100%)" }}
      >
        <span className="text-7xl">👤</span>
        {/* Distance badge */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        >
          📍 {distance}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[22px] font-bold text-[#2b2d31]">{name}</span>
          <span className="text-[22px] font-normal text-[#787880]">{age}</span>
        </div>
        <p className="text-sm text-[#787880] mb-3">{job}</p>

        {/* Interests */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {interests.map((interest) => (
            <Badge
              key={interest}
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "#f0ebfb", color: "#6227d7", border: "none" }}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-4 pb-4">
        <Button
          variant="outline"
          className="flex-1 h-11 rounded-full text-sm font-semibold border-[#e6e9e6] text-[#2b2d31]"
          onClick={onViewProfile}
        >
          View profile
        </Button>
        <Button
          className="flex-1 h-11 rounded-full text-sm font-semibold text-white"
          style={{ background: "#6227d7" }}
          onClick={onChoose}
        >
          Choose {name}
        </Button>
      </div>
    </div>
  );
}
