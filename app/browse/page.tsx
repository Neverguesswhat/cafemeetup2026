"use client";

import { useRef, useState, useEffect } from "react";
import { TabBar } from "@/components/layout/TabBar";

const PROFILES = [
  {
    name: "Laura",
    age: 32,
    job: "NGO Executive Assistant",
    distance: "1.3mi",
    photo: "/profiles/laura.svg",
    interests: ["Restaurants", "Rooftop bars", "Reading", "Movies", "Painting"],
  },
  {
    name: "Charlotte",
    age: 29,
    job: "Veterinarian at AHS",
    distance: "1.7mi",
    photo: "/profiles/charlotte.svg",
    interests: ["Live music", "Hiking", "Board games", "Dogs", "Reading"],
  },
  {
    name: "Sarah",
    age: 27,
    job: "Graphic Designer",
    distance: "2.1mi",
    photo: "/profiles/sarah.svg",
    interests: ["Art galleries", "Coffee", "Cycling", "Travel", "Photography"],
  },
];

export default function BrowsePage() {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const lastX = useRef(0);

  // Scroll listener as a reliable fallback — fires on mobile even when touch events don't
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIndex(Math.round(el.scrollLeft / el.offsetWidth));
      }, 300);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    lastX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    lastX.current = e.touches[0].clientX;
  };

  // iOS fires touchcancel (not touchend) when it takes over the scroll gesture
  const commit = (e: React.TouchEvent) => {
    const endX = e.changedTouches?.[0]?.clientX ?? lastX.current;
    const dx = startX.current - endX;
    if (dx > 40) setIndex((i) => Math.min(i + 1, PROFILES.length - 1));
    else if (dx < -40) setIndex((i) => Math.max(i - 1, 0));
  };

  const current = PROFILES[index];

  if (chosen) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl">✓</div>
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
    <div
      className="fixed inset-0 bg-background flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={commit}
      onTouchCancel={commit}
    >

      {/* CSS scroll-snap carousel — native swipe, proven on mobile */}
      <div
        ref={scrollRef}
        className="snap-carousel flex-1 flex overflow-x-scroll overflow-y-hidden min-h-0"
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
            className="flex-shrink-0 w-screen h-full relative"
            style={{ scrollSnapAlign: "start" }}
          >
            <img
              src={p.photo}
              alt={p.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 5%" }}
            />

            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
              <span className="text-white text-xs font-medium">📍 {p.distance}</span>
            </div>

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
        ))}
      </div>

      {/* Dots update from touch direction — no scroll event dependency */}
      <div className="shrink-0 px-4 pt-6 pb-6 bg-background">
        <div className="flex justify-center gap-1.5 mb-6">
          {PROFILES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                background: i === index ? "#000" : "#d1d5db",
              }}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 h-12 rounded-full border border-border bg-background text-sm font-semibold"
          >
            View Profile
          </button>
          <button
            type="button"
            className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            onClick={() => setChosen(current.name)}
          >
            Choose {current.name}
          </button>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
