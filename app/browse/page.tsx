"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Button } from "@/components/ui/button";
import { Timer, MapPin } from "lucide-react";

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
  const router = useRouter();
  const { state, lockProfile, releaseProfile, chooseProfile, resetApp } = useAppState();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const lastX = useRef(0);
  const [timeLeft, setTimeLeft] = useState("");

  // Lock logic: Lock Charlotte when James is looking at her card (index 1)
  useEffect(() => {
    const currentProfile = PROFILES[index];
    lockProfile(currentProfile.name);
    return () => {
      releaseProfile();
    };
  }, [index]);

  // 15-min countdown timer
  useEffect(() => {
    if (!state?.timerStart) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.timerStart!) / 1000);
      const remaining = (state?.timerDuration || 900) - elapsed;
      if (remaining <= 0) {
        setTimeLeft("0:00");
      } else {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.timerStart, state?.timerDuration]);

  // Handle redirect if phase changes out of browsing
  useEffect(() => {
    if (state.phase !== "browsing") {
      router.push("/");
    }
  }, [state.phase]);

  // Scroll snap listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const newIndex = Math.round(el.scrollLeft / el.offsetWidth);
        if (newIndex >= 0 && newIndex < PROFILES.length) {
          setIndex(newIndex);
        }
      }, 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    lastX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    lastX.current = e.touches[0].clientX;
  };

  const commit = (e: React.TouchEvent) => {
    const endX = e.changedTouches?.[0]?.clientX ?? lastX.current;
    const dx = startX.current - endX;
    if (dx > 40) {
      setIndex((i) => Math.min(i + 1, PROFILES.length - 1));
    } else if (dx < -40) {
      setIndex((i) => Math.max(i - 1, 0));
    }
  };

  const current = PROFILES[index];

  const handleChoose = () => {
    chooseProfile(current.name);
    router.push("/meetup-propose");
  };

  const handleCancel = () => {
    releaseProfile();
    resetApp();
    router.push("/");
  };

  return (
    <div
      className="absolute inset-0 bg-background flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={commit}
      onTouchCancel={commit}
    >
      {/* Header with timer and back button */}
      <div className="absolute top-6 left-4 right-4 z-40 flex justify-between items-center bg-transparent">
        <button
          onClick={handleCancel}
          className="px-4 py-2 rounded-full bg-black/40 text-white text-sm font-semibold backdrop-blur-sm transition-colors active:bg-black/60"
        >
          ← Change your mind?
        </button>
        {state?.timerStart && (
          <div className="px-4 py-2 rounded-full bg-amber-500/80 text-white text-sm font-semibold font-mono flex items-center gap-1.5">
            <Timer className="w-4 h-4" /> {timeLeft}
          </div>
        )}
      </div>

      {/* Swipe carousel */}
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
          <div key={i} className="flex-shrink-0 w-screen h-full relative" style={{ scrollSnapAlign: "start" }}>
            <img
              src={p.photo}
              alt={p.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 5%" }}
            />

            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-2xl font-bold text-white">{p.name}</span>
                <span className="text-xl text-white/85">{p.age}</span>
              </div>
              <p className="text-base text-white/75 mb-2">{p.job}</p>
              
              {/* Location Badge */}
              <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full w-fit mb-3 backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-sm font-medium">{p.distance}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {p.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-1 rounded-full text-sm font-medium text-white bg-white/10 backdrop-blur-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Control Dots and Action Buttons */}
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
          <Button variant="outline" className="flex-1 h-12 rounded-full font-semibold">
            View Profile
          </Button>
          <Button className="flex-1 h-12 rounded-full font-semibold" onClick={handleChoose}>
            Choose {current.name}
          </Button>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
