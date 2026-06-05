"use client";

import { useState } from "react";
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

  const profile = PROFILES[index];

  return (
    <div className="min-h-dvh bg-white overflow-y-auto">
      <div className="pt-14 pb-8">
        {chosen ? (
          <div className="px-4 pt-8 flex flex-col items-center gap-4 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
              style={{ background: "#0c8871" }}
            >
              ✓
            </div>
            <h2 className="text-[22px] font-bold text-[#2b2d31]">
              You chose {chosen}
            </h2>
            <p className="text-sm text-[#787880] leading-relaxed px-4">
              Now propose 3 meetup options — a date, time and location for each.
              {chosen} has 15 minutes to respond once you send them.
            </p>
            <div className="w-full px-4">
              <CuppaGuide message={`Great choice. Now let's set up your meetup options for ${chosen}. Remember — once you send these, you're committed.`} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 mb-4">
              <h1 className="text-[22px] font-bold text-[#2b2d31]">Choose someone</h1>
              <span className="text-sm text-[#787880]">
                {index + 1} of {PROFILES.length}
              </span>
            </div>

            <div className="flex justify-center gap-1.5 mb-4">
              {PROFILES.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === index ? 20 : 6,
                    height: 6,
                    background: i === index ? "#6227d7" : "#e6e9e6",
                  }}
                />
              ))}
            </div>

            <ProfileCard
              {...profile}
              onChoose={() => setChosen(profile.name)}
              onViewProfile={() => {}}
            />

            <div className="flex justify-between px-6 mt-4">
              <button
                className="text-sm text-[#787880] font-medium disabled:opacity-30"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
              >
                ← Previous
              </button>
              <button
                className="text-sm text-[#6227d7] font-medium disabled:opacity-30"
                onClick={() => setIndex((i) => Math.min(PROFILES.length - 1, i + 1))}
                disabled={index === PROFILES.length - 1}
              >
                Next →
              </button>
            </div>

            <div className="px-4 mt-4">
              <CuppaGuide message="These 3 people are your best matches today. Take a look at each one before you decide." />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
