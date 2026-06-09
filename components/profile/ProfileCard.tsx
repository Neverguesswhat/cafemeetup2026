"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ProfileCardProps {
  name: string;
  age: number;
  job: string;
  distance: string;
  interests: string[];
  onChoose: () => void;
  onViewProfile: () => void;
}

export function ProfileCard({ name, age, job, distance, interests, onChoose, onViewProfile }: ProfileCardProps) {
  return (
    <Card className="mx-4 overflow-hidden rounded-3xl border-border">
      <div className="relative w-full flex items-center justify-center bg-muted" style={{ height: 320 }}>
        <span className="text-7xl">👤</span>
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 bg-black/40 text-white border-0 backdrop-blur-sm"
        >
          📍 {distance}
        </Badge>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-2xl font-bold">{name}</span>
          <span className="text-2xl font-normal text-muted-foreground">{age}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{job}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {interests.map((interest) => (
            <Badge key={interest} variant="secondary" className="rounded-full">
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-3 px-4 pb-4">
        <Button variant="outline" className="flex-1 rounded-full" onClick={onViewProfile}>
          View profile
        </Button>
        <Button className="flex-1 rounded-full" onClick={onChoose}>
          Choose {name}
        </Button>
      </div>
    </Card>
  );
}
