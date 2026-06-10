"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, Coffee, AlertCircle } from "lucide-react";

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

function NegotiateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, editProposal } = useAppState();
  const [timeLeft, setTimeLeft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const optionIndexStr = searchParams ? searchParams.get("option") : null;
  const optionIndex = optionIndexStr !== null ? parseInt(optionIndexStr, 10) : 0;
  const activeProposal = (state?.proposals || [])[optionIndex];

  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    if (activeProposal) {
      setNewTime(parseToRawDateTime(activeProposal.time));
    }
  }, [activeProposal]);

  // Redirect if state phase changes
  useEffect(() => {
    if (state?.phase !== "deciding") {
      router.push("/");
    }
  }, [state?.phase]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTime.trim() === "") return;

    // Prevent past date/time submission
    const selectedDate = new Date(newTime);
    if (selectedDate.getTime() < Date.now()) {
      const inputEl = document.getElementById("new-time") as HTMLInputElement;
      if (inputEl) {
        inputEl.setCustomValidity("Date and Time must be in the future");
        inputEl.reportValidity();
      }
      return;
    }

    setError(null);
    setSubmitting(true);
    const success = await editProposal(optionIndex, formatDateTime(newTime));
    setSubmitting(false);

    if (success) {
      router.push("/");
    } else {
      setError(
        "Violates Supabase Row Level Security (RLS) policies. Please ensure you have executed " +
        "the required SQL UPDATE policies for 'meetups' in your Supabase SQL Editor."
      );
    }
  };

  if (!activeProposal) {
    return (
      <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
        <span>No proposal selected.</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-4 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Edit Meetup Time</h1>
              <p className="text-sm text-muted-foreground">Suggest a new time. Venue location is locked.</p>
            </div>
            {state?.timerStart && (
              <div className="px-3 py-1 bg-amber-500 text-white font-mono text-sm font-bold rounded-full flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" /> {timeLeft}
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-3xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 text-sm leading-relaxed">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold mb-0.5">Database Reschedule Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl border border-border bg-slate-50 mb-6 flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-500 uppercase">Selected Option {optionIndex + 1}</span>
            <span className="text-base font-bold text-slate-800 flex items-center gap-1.5"><Coffee className="w-4 h-4 text-slate-500" /> {activeProposal.location}</span>
            <span className="text-base text-slate-600">Original Time: {activeProposal.time}</span>
          </div>

          <form id="negotiate-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-time">Suggested New Time</Label>
              <Input
                id="new-time"
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
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
                required
              />
              <p className="text-xs text-slate-400">
                Ensure this works with your schedule. If James declines, match flow resets.
              </p>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <Button type="submit" form="negotiate-form" onClick={handleSubmit} disabled={submitting} className="w-full h-12 rounded-xl font-semibold disabled:opacity-50">
            {submitting ? "Submitting..." : "Propose Time Reschedule"}
          </Button>
          <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => router.push("/")}>
            Back to Proposals
          </Button>
        </div>
      </main>

      <TabBar />
    </div>
  );
}

export default function NegotiatePage() {
  return (
    <Suspense fallback={
      <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
        <span className="text-base text-muted-foreground">Loading reschedule options...</span>
      </div>
    }>
      <NegotiateContent />
    </Suspense>
  );
}
