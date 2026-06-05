"use client";

import { useRef, useState, useCallback } from "react";
import { TabBar } from "@/components/layout/TabBar";

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
    setIndex(Math.round(el.scrollLeft / el.offsetWidth));
  }, []);

  if (chosen) {
    return (
      <div className="h-dvh bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold">You chose {chosen}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Now propose 3 meetup options. {chosen} has 15 minutes to respond.
          </p>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="h-dvh bg-background flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3 shrink-0">
        <h1 className="text-xl font-bold">Choose someone</h1>
        {/* Dots */}
        <div className="flex gap-1.5 items-center">
          {PROFILES.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${i === index ? "bg-primary" : "bg-border"}`}
              style={{ width: i === index ? 18 : 6, height: 6 }}
            />
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="snap-carousel flex flex-1 overflow-x-scroll overflow-y-hidden min-h-0"
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
            className="flex-shrink-0 w-screen h-full flex flex-col px-4 pb-3"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Photo with overlaid info — fills all remaining space */}
            <div className="relative flex-1 rounded-3xl overflow-hidden bg-muted min-h-0">
              {/* Photo placeholder */}
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-400 to-zinc-600 flex items-center justify-center">
                <span className="text-8xl opacity-40">👤</span>
              </div>

              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Distance badge top-right */}
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                <span className="text-white text-xs font-medium">📍 {p.distance}</span>
              </div>

              {/* Name, job, interests — bottom of photo */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-2xl font-bold text-white">{p.name}</span>
                  <span className="text-xl text-white/80">{p.age}</span>
                </div>
                <p className="text-sm text-white/70 mb-3">{p.job}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 rounded-full text-xs font-medium text-white border border-white/40 bg-white/10 backdrop-blur-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons — white area below photo */}
            <div className="flex gap-3 pt-3 shrink-0">
              <button
                type="button"
                className="flex-1 h-12 rounded-full border border-border bg-background text-sm font-semibold"
              >
                View Profile
              </button>
              <button
                type="button"
                className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                onClick={() => setChosen(p.name)}
              >
                Choose {p.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      <TabBar />
    </div>
  );
}
