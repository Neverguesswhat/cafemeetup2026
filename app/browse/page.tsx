"use client";

import { useState, useRef } from "react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { CuppaGuide } from "@/components/profile/CuppaGuide";

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
  const touchStartX = useRef<number | null>(null);
  const profile = PROFILES[index];

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) < 50) return; // ignore small movements
    if (delta > 0) {
      // swiped left → next
      setIndex((i) => Math.min(PROFILES.length - 1, i + 1));
    } else {
      // swiped right → previous
      setIndex((i) => Math.max(0, i - 1));
    }
    touchStartX.current = null;
  }

  return (
    <div className="min-h-dvh bg-background overflow-y-auto">
      <div className="pt-14 pb-8">
        {chosen ? (
          <div className="px-4 pt-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl">
              ✓
            </div>
            <h2 className="text-2xl font-bold">You chose {chosen}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed px-4">
              Now propose 3 meetup options — a date, time and location for each.
              {chosen} has 15 minutes to respond once you send them.
            </p>
            <div className="w-full">
              <CuppaGuide message={`Great choice. Now let's set up your meetup options for ${chosen}. Remember — once you send these, you're committed.`} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 mb-4">
              <h1 className="text-2xl font-bold">Choose someone</h1>
              <span className="text-sm text-muted-foreground">{index + 1} of {PROFILES.length}</span>
            </div>

            {/* Swipe dots */}
            <div className="flex justify-center gap-1.5 mb-4">
              {PROFILES.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${i === index ? "bg-primary" : "bg-border"}`}
                  style={{ width: i === index ? 20 : 6, height: 6 }}
                />
              ))}
            </div>

            {/* Swipeable card area */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: "pan-y" }}
            >
              <ProfileCard
                {...profile}
                onChoose={() => setChosen(profile.name)}
                onViewProfile={() => {}}
              />
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Swipe to browse
            </p>

            <div className="px-4 mt-4">
              <CuppaGuide message="These 3 people are your best matches today. Take a look at each one before you decide." />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
