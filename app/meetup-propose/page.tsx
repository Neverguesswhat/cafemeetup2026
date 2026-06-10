"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState, MeetupOption } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, MapPin, Calendar, ArrowLeft, AlertCircle } from "lucide-react";

const SUGGESTED_VENUES = [
  "Cuppa & Co (1.4mi)",
  "Retro Cafe (0.8mi)",
  "The Beanery (2.1mi)",
  "Daily Grind (1.1mi)",
  "Brewed Awakening (2.5mi)",
  "Espresso Junction (1.9mi)",
  "Mocha Haven (3.2mi)",
  "The Coffee Emporium (4.0mi)"
];

const DEFAULT_PROPOSALS: MeetupOption[] = [
  { location: "Cuppa & Co (1.4mi)", time: "Today at 7:00 PM" },
  { location: "Retro Cafe (0.8mi)", time: "Tomorrow at 6:30 PM" },
  { location: "The Beanery (2.1mi)", time: "Wednesday at 4:00 PM" },
];

const formatToLocalDateTimeInput = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const parseToRawDateTime = (formatted: string): string => {
  const now = new Date();
  
  if (formatted.toLowerCase().includes("today")) {
    const timeMatch = formatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hr = parseInt(timeMatch[1], 10);
      const min = timeMatch[2];
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hr < 12) hr += 12;
      if (ampm === "AM" && hr === 12) hr = 0;
      now.setHours(hr, parseInt(min, 10), 0, 0);
    } else {
      now.setHours(19, 0, 0, 0); // default to 7pm today
    }
    return formatToLocalDateTimeInput(now);
  }
  
  if (formatted.toLowerCase().includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const timeMatch = formatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hr = parseInt(timeMatch[1], 10);
      const min = timeMatch[2];
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hr < 12) hr += 12;
      if (ampm === "AM" && hr === 12) hr = 0;
      tomorrow.setHours(hr, parseInt(min, 10), 0, 0);
    } else {
      tomorrow.setHours(18, 30, 0, 0); // default to 6:30pm tomorrow
    }
    return formatToLocalDateTimeInput(tomorrow);
  }

  const parsedDate = new Date(formatted);
  if (!isNaN(parsedDate.getTime())) {
    return formatToLocalDateTimeInput(parsedDate);
  }

  return formatToLocalDateTimeInput(now);
};

const formatDateTime = (rawDateTime: string): string => {
  if (!rawDateTime) return "";
  const date = new Date(rawDateTime);
  if (isNaN(date.getTime())) return rawDateTime;

  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  } else {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateStr = date.toLocaleDateString([], options);
    return `${dateStr} at ${timeStr}`;
  }
};

export default function MeetupProposePage() {
  const router = useRouter();
  const { state, submitProposals, startBrowsing } = useAppState();
  const [timeLeft, setTimeLeft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [proposalLocations, setProposalLocations] = useState<string[]>(() => {
    if (state?.proposals && state.proposals.length === 3) {
      return state.proposals.map((p) => p.location);
    }
    return DEFAULT_PROPOSALS.map((p) => p.location);
  });

  const [proposalTimes, setProposalTimes] = useState<string[]>(() => {
    if (state?.proposals && state.proposals.length === 3) {
      return state.proposals.map((p) => parseToRawDateTime(p.time));
    }
    return DEFAULT_PROPOSALS.map((p) => parseToRawDateTime(p.time));
  });

  const [dropdownOpen, setDropdownOpen] = useState([false, false, false]);

  // Redirect if state phase changes
  useEffect(() => {
    if (state?.phase !== "proposing") {
      router.push("/");
    }
  }, [state?.phase]);

  // 15-minute timer countdown
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

  const handleLocationChange = (index: number, location: string) => {
    const updated = [...proposalLocations];
    updated[index] = location;
    setProposalLocations(updated);
  };

  const handleTimeChange = (index: number, time: string) => {
    const updated = [...proposalTimes];
    updated[index] = time;
    setProposalTimes(updated);
  };

  const handleOpenDropdown = (index: number) => {
    setDropdownOpen((prev) => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
  };

  const handleCloseDropdown = (index: number) => {
    setDropdownOpen((prev) => {
      const copy = [...prev];
      copy[index] = false;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedOptions: MeetupOption[] = [
      { location: proposalLocations[0], time: formatDateTime(proposalTimes[0]) },
      { location: proposalLocations[1], time: formatDateTime(proposalTimes[1]) },
      { location: proposalLocations[2], time: formatDateTime(proposalTimes[2]) },
    ];
    
    setError(null);
    setSubmitting(true);
    const success = await submitProposals(formattedOptions);
    setSubmitting(false);

    if (success) {
      router.push("/");
    } else {
      setError(
        "Violates Supabase Row Level Security (RLS) policies. Please ensure you have executed " +
        "the required SQL INSERT policies for 'meetups' in your Supabase SQL Editor."
      );
    }
  };

  const handleBack = () => {
    startBrowsing();
    router.push("/browse");
  };

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
        {/* Back navigation */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to profiles
        </button>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Propose 3 Options</h1>
            <p className="text-base text-slate-500 mt-1">Set dates, times, and coffee shop locations</p>
          </div>
          {state?.timerStart && (
            <div className="px-3 py-1.5 bg-amber-500/20 text-amber-700 border border-amber-500/30 font-mono text-sm font-bold rounded-full flex items-center gap-1.5 h-fit shrink-0">
              <Timer className="w-3.5 h-3.5 animate-pulse" /> {timeLeft}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-3xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 text-sm leading-relaxed animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Database Sync Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => {
            const filteredSuggestions = SUGGESTED_VENUES.filter((venue) =>
              venue.toLowerCase().includes(proposalLocations[i].toLowerCase())
            );

            return (
              <div key={i} className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
                <span className="text-sm font-bold uppercase tracking-wider text-blue-600">Option {i + 1}</span>

                {/* Location Select (Predictive Search) */}
                <div className="flex flex-col gap-1 relative">
                  <Label htmlFor={`location-${i}`} className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Coffee Shop Location</span>
                  </Label>
                  <Input
                    id={`location-${i}`}
                    type="text"
                    placeholder="Search coffee shop... (e.g. Cuppa)"
                    value={proposalLocations[i]}
                    onChange={(e) => handleLocationChange(i, e.target.value)}
                    onFocus={() => handleOpenDropdown(i)}
                    onBlur={() => setTimeout(() => handleCloseDropdown(i), 200)}
                    className="bg-white h-11 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-all"
                    required
                    autoComplete="off"
                  />

                  {/* Suggestions Dropdown */}
                  {dropdownOpen[i] && (
                    <div className="absolute left-0 right-0 top-[68px] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredSuggestions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 italic">
                          No matching venues. You can type a custom location!
                        </div>
                      ) : (
                        filteredSuggestions.map((venue) => (
                          <button
                            key={venue}
                            type="button"
                            onClick={() => {
                              handleLocationChange(i, venue);
                              handleCloseDropdown(i);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 font-semibold"
                          >
                            {venue}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Time Input (Calendar Picker) */}
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`time-${i}`} className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Date and Time</span>
                  </Label>
                  <Input
                    id={`time-${i}`}
                    type="datetime-local"
                    value={proposalTimes[i]}
                    onChange={(e) => handleTimeChange(i, e.target.value)}
                    min={formatToLocalDateTimeInput(new Date())}
                    onInvalid={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.validity.rangeUnderflow) {
                        target.setCustomValidity("Date and Time must be in the future");
                      } else {
                        target.setCustomValidity("");
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.setCustomValidity("");
                    }}
                    className="bg-white h-11 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-all"
                    required
                  />
                </div>
              </div>
            );
          })}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl mt-4 font-bold text-base bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-none border-0 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Sending Proposals..." : "Send Meetup Proposals"}
          </Button>
        </form>
      </main>

      <TabBar />
    </div>
  );
}
