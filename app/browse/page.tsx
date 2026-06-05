"use client";

import { useRef, useState, useCallback } from "react";
import { CuppaGuide } from "@/components/profile/CuppaGuide";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PROFILES = [
  {
    name: "Laura",
    age: 32,
    job: "NGO Executive Assistant",
    distance: "1.3mi",
    interests: ["Restaurants", "Rooftop bars", "Reading", "Movies", "Painting"],
  },
  {
    name: "Charlotte",
    age: 29,
    job: "Veterinarian at AHS",
    distance: "1.7mi",
    interests: ["Live music", "Hiking", "Board games", "Dogs", "Reading"],
  },
  {
    name: "Sarah",
    age: 27,
    job: "Graphic Designer",
    distance: "2.1mi",
    interests: ["Art galleries", "Coffee", "Cycling", "Travel", "Photography"],
  },
];

export default function BrowsePage() {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.offsetWidth);
    setIndex(i);
  }, []);

  const profile = PROFILES[index];

  if (chosen) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl">
          ✓
        </div>
        <h2 className="text-2xl font-bold">You chose {chosen}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Now propose 3 meetup options — a date, time and location for each.
          {chosen} has 15 minutes to respond once you send them.
        </p>
        <CuppaGuide message={`Great choice. Now let's set up your meetup options for ${chosen}. Remember — once you send these, you're committed.`} />
      </div>
    );
  }

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3 shrink-0">
        <h1 className="text-2xl font-bold">Choose someone</h1>
        <div className="flex gap-1.5">
          {PROFILES.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${i === index ? "bg-primary" : "bg-border"}`}
              style={{ width: i === index ? 20 : 6, height: 6 }}
            />
          ))}
        </div>
      </div>

      {/* Carousel — fills remaining height */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="snap-carousel flex flex-1 overflow-x-scroll overflow-y-hidden"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {PROFILES.map((p, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-screen h-full px-4 pb-6 flex flex-col"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Photo fills most of the card */}
            <div className="relative flex-1 rounded-3xl overflow-hidden bg-muted flex items-center justify-center mb-3 min-h-0">
              <span className="text-8xl">👤</span>

              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />

              {/* Name + job overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 text-white">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-2xl font-bold">{p.name}</span>
                  <span className="text-xl font-normal opacity-90">{p.age}</span>
                </div>
                <p className="text-sm opacity-80">{p.job}</p>
              </div>

              {/* Distance badge */}
              <Badge
                variant="secondary"
                className="absolute top-3 right-3 bg-black/40 text-white border-0 backdrop-blur-sm"
              >
                📍 {p.distance}
              </Badge>
            </div>

            {/* Interests */}
            <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
              {p.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="rounded-full">
                  {interest}
                </Badge>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 shrink-0">
              <Button variant="outline" className="flex-1 h-12 rounded-full">
                View profile
              </Button>
              <Button
                className="flex-1 h-12 rounded-full"
                onClick={() => setChosen(p.name)}
              >
                Choose {p.name}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
