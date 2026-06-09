"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Button } from "@/components/ui/button";
import { CuppaGuide } from "@/components/profile/CuppaGuide";
import { Eye, Radio, Settings, Timer } from "lucide-react";

export default function WaitingPage() {
  const router = useRouter();
  const { state, setPersona, startBrowsing, addNotification, setRole } = useAppState();
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const userPersona = state?.userPersona || "james";

  useEffect(() => {
    // If the state changes to deciding and we are the chosen user, go back to homepage to review options
    if (state?.phase === "deciding" && state?.activeChosen === userPersona) {
      router.push("/");
    }
  }, [state?.phase, state?.activeChosen, userPersona, router]);

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

  // Simulate wait prompt
  const simulateIdleTimeout = () => {
    setShowIdlePrompt(true);
    addNotification("Idle Prompt", "No Chooser selected you in 15 minutes. Asking if you want to switch roles.", "system");
  };

  const handleBecomeChooser = () => {
    setShowIdlePrompt(false);
    setRole(userPersona, "chooser");
    router.push("/browse");
  };

  const isSelected = state?.phase === "proposing" && state?.activeChosen === userPersona;

  if (isSelected) {
    const chooserName = state?.activeChooser ? state.activeChooser.charAt(0).toUpperCase() + state.activeChooser.slice(1) : "James";
    return (
      <div className="absolute inset-0 bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-4 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Be Chosen</h1>
            <p className="text-base text-muted-foreground mb-6">Sit back and wait for someone to choose you</p>

            <div className="p-6 rounded-3xl border border-blue-200 bg-blue-50/50 flex flex-col items-center text-center gap-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center relative">
                <div className="w-16 h-16 rounded-full bg-blue-400 absolute inset-0 animate-ping opacity-25" />
                <Timer className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-lg font-bold text-blue-900">{chooserName} selected you!</span>
                <span className="text-sm font-semibold text-blue-600 font-mono bg-blue-100 px-3 py-1 rounded-full w-fit mx-auto">
                  Proposing options: {timeLeft}
                </span>
              </div>

              <p className="text-sm text-blue-800 leading-relaxed max-w-xs">
                {chooserName} is currently selecting a coffee shop and proposing 3 meetup times. Please keep this screen open. You will review and accept the options as soon as they are submitted!
              </p>
            </div>
          </div>

          {/* Change Mind button */}
          <div className="mb-6">
            <Button
              variant="outline"
              className="w-full rounded-xl h-12"
              onClick={() => {
                setRole(userPersona, "idle");
                router.push("/");
              }}
            >
              Change your mind?
            </Button>
          </div>
        </main>

        <TabBar />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Be Chosen</h1>
          <p className="text-base text-muted-foreground mb-6">Sit back and wait for someone to choose you</p>

          <CuppaGuide message="I'm active in the background matching your profile based on preferences. You'll get a push notification or text the moment a Chooser selects you." />

          {/* Locked status card (James is browsing user) */}
          {state?.lockedUser === userPersona ? (
            <div className="p-5 rounded-3xl border border-amber-200 bg-amber-50 flex flex-col gap-2 mt-4 animate-pulse">
              <Eye className="w-6 h-6 text-amber-600 shrink-0" />
              <span className="text-sm font-bold text-amber-800">Someone is considering you right now!</span>
              <span className="text-sm text-amber-700 leading-relaxed">
                A Chooser nearby is currently browsing your profile card. Stay ready to respond!
              </span>
            </div>
          ) : (
            <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Radio className="w-6 h-6 text-slate-400 animate-pulse" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Waiting in the match pool...</span>
              <span className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Your profile is visible to Choosers within a 10-mile radius. Keep this window open or background the app.
              </span>
            </div>
          )}

          {/* Idle simulation button for testing */}
          {!showIdlePrompt && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="sm" className="rounded-full text-sm flex items-center gap-1.5" onClick={simulateIdleTimeout}>
                <Settings className="w-3.5 h-3.5" /> Simulate 15m idle wait
              </Button>
            </div>
          )}
        </div>

        {/* Change Mind button */}
        <div className="mb-6">
          <Button
            variant="outline"
            className="w-full rounded-xl h-12"
            onClick={() => {
              setRole(userPersona, "idle");
              router.push("/");
            }}
          >
            Change your mind?
          </Button>
        </div>
      </main>

      {/* Idle Prompt Dialog */}
      {showIdlePrompt && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 border border-border animate-in slide-in-from-bottom">
            <h3 className="text-lg font-bold text-slate-800 text-center">Still waiting?</h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              It's been 15 minutes and you haven't been chosen yet. Would you like to switch roles and become a Chooser?
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <Button className="rounded-xl h-11" onClick={handleBecomeChooser}>
                Yes, Be a Chooser
              </Button>
              <Button variant="outline" className="rounded-xl h-11" onClick={() => setShowIdlePrompt(false)}>
                No, I'll keep waiting
              </Button>
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}
