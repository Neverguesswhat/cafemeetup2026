"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, Timer, Coffee, Calendar, AlertCircle, Laptop, Stethoscope, Eye } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const {
    state,
    setRole,
    declineProposal,
    acceptProposal,
    handleEditResponse,
    submitVerificationCode,
    reportNoShow,
    submitPostMeetupFeedback,
    liftCooldown,
  } = useAppState();

  const [mounted, setMounted] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<"none" | "success" | "help" | "fail">("none");
  const [timeLeft, setTimeLeft] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const userPersona = state?.userPersona || "james";
  const userRole = state?.roles?.[userPersona] || "idle";

  // Redirect dynamically based on role and active state phase (fixing redirect loops)
  useEffect(() => {
    if (userRole === "chooser") {
      if (state?.phase === "browsing") {
        router.push("/browse");
      } else if (state?.phase === "proposing") {
        router.push("/meetup-propose");
      }
    } else if (userRole === "chosen") {
      if (state?.phase === "idle" || state?.phase === "browsing" || state?.phase === "proposing") {
        router.push("/waiting");
      }
    }
  }, [userRole, state?.phase, router]);

  // Countdown timer for 15-minute states
  useEffect(() => {
    if (!state?.timerStart) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.timerStart!) / 1000);
      const remaining = state.timerDuration - elapsed;
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

  // Countdown for 9am cooldown reset
  useEffect(() => {
    const banTimeStr = state?.bans?.[userPersona];
    if (!banTimeStr) return;

    const interval = setInterval(() => {
      const banTime = new Date(banTimeStr).getTime();
      const remaining = banTime - Date.now();
      if (remaining <= 0) {
        setCooldownLeft("");
        liftCooldown();
      } else {
        const hrs = Math.floor(remaining / (1000 * 60 * 60));
        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
        setCooldownLeft(`${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.bans, userPersona]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 4) return;
    const res = submitVerificationCode(otpCode);
    setOtpStatus(res);
    setOtpCode("");
  };

  if (!mounted) {
    return (
      <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 1. Render Cooldown / Ban Screen
  if (state?.bans?.[userPersona]) {
    return (
      <div className="absolute inset-0 bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 border border-border">
            <Clock className="w-12 h-12 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">On Cooldown</h1>
          <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
            Your match flow is locked. To prevent ghosting and ensure commitment, you can only match again starting at 9:00 AM.
          </p>
          <div className="bg-slate-50 border border-border px-6 py-3 rounded-2xl mb-8 font-mono text-lg font-bold text-slate-800">
            {cooldownLeft || "Resetting..."}
          </div>
          <Button variant="outline" size="lg" className="rounded-full w-48" onClick={liftCooldown}>
            Simulate 9:00 AM Reset
          </Button>
        </main>
        <TabBar />
      </div>
    );
  }

  // 2. Render Deciding State (Chosen's Turn to pick 1 of 3, James waits)
  if (state?.phase === "deciding") {
    const chosenName = state?.activeChosen ? state.activeChosen.charAt(0).toUpperCase() + state.activeChosen.slice(1) : "Charlotte";

    if (userPersona === "james") {
      return (
        <div className="absolute inset-0 bg-background flex flex-col justify-between">
          <main className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 animate-pulse border border-border">
              <MessageSquare className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">Waiting for {chosenName}</h1>
            <p className="text-base text-slate-600 max-w-xs mb-8 leading-relaxed">
              {chosenName} is reviewing your proposed meetups. She has 15 minutes to accept one or suggest an alternative time.
            </p>
            <div className="bg-amber-500/20 text-amber-700 border border-amber-500/30 px-4 py-2 rounded-xl text-sm font-semibold font-mono flex items-center gap-1.5 justify-center">
              <Timer className="w-4 h-4 animate-pulse" /> Time remaining: {timeLeft}
            </div>
          </main>
          <TabBar />
        </div>
      );
    }

    if (userPersona === state?.activeChosen) {
      return (
        <div className="absolute inset-0 bg-background flex flex-col justify-between">
          <main className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Meetup Options</h1>
            <p className="text-base text-slate-500 mb-6">James wants to meet you! Pick one option:</p>

            <div className="flex flex-col gap-4 mb-6">
              {state.proposals.map((option, i) => (
                <div key={i} className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
                  <div>
                    <span className="text-sm font-bold uppercase tracking-wider text-blue-600 block mb-1">Option {i + 1}</span>
                    <span className="text-lg font-bold text-slate-800 flex items-center gap-1.5 mt-2">
                      <Coffee className="w-4 h-4 text-slate-600 shrink-0" />
                      {option.location}
                    </span>
                    <span className="text-base text-slate-600 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                      {option.time}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <Button
                      onClick={() => acceptProposal(i)}
                      className="flex-1 h-11 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-none border-0 active:scale-[0.98]"
                    >
                      Accept Option {i + 1}
                    </Button>
                    <Link href={`/negotiate?option=${i}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl text-sm font-bold border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                      >
                        Edit Time
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-xl w-full text-base font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all"
                onClick={declineProposal}
              >
                Reject all options
              </Button>
              <div className="text-center bg-amber-500/20 text-amber-700 border border-amber-500/30 py-2.5 rounded-xl text-sm font-semibold font-mono mt-1 flex items-center gap-1.5 justify-center">
                <Timer className="w-4 h-4 animate-pulse" /> Timeout Cooldown: {timeLeft}
              </div>
            </div>
          </main>
          <TabBar />
        </div>
      );
    }
  }

  // 3. Render Negotiating State (Chosen user edited an option, James approves/declines)
  if (state?.phase === "negotiating") {
    const chosenName = state?.activeChosen ? state.activeChosen.charAt(0).toUpperCase() + state.activeChosen.slice(1) : "Charlotte";

    if (userPersona === "james") {
      return (
        <div className="absolute inset-0 bg-background flex flex-col justify-between">
          <main className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{chosenName} Suggested a Change</h1>
            <p className="text-base text-slate-500 mb-6">{chosenName} would like to reschedule the time:</p>

            <div className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 mb-6 flex flex-col gap-3">
              <div>
                <span className="text-sm font-bold uppercase tracking-wider text-blue-600 block mb-1">Proposed Meetup</span>
                <span className="text-lg font-bold text-slate-800 flex items-center gap-1.5 mt-2">
                  <Coffee className="w-4 h-4 text-slate-600" /> {state.editedProposal?.location}
                </span>
                <span className="text-base text-slate-400 line-through flex items-center gap-1.5 mt-1">
                  <Calendar className="w-4 h-4 text-slate-400" /> Original: {state.proposals[state.selectedOptionIndex ?? 0]?.time}
                </span>
                <span className="text-base font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-4 h-4 text-emerald-500" /> New suggested time: {state.editedProposal?.time}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl text-sm font-bold border-slate-200 hover:bg-slate-50 text-slate-500"
                  onClick={() => handleEditResponse(false)}
                >
                  Decline & Cancel
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-none border-0 active:scale-[0.98]"
                  onClick={() => handleEditResponse(true)}
                >
                  Accept Change
                </Button>
              </div>
              {state?.timerStart && (
                <div className="text-center bg-amber-500/20 text-amber-700 border border-amber-500/30 py-2.5 rounded-xl text-sm font-semibold font-mono flex items-center gap-1.5 justify-center">
                  <Timer className="w-4 h-4 animate-pulse" /> Reschedule timer: {timeLeft}
                </div>
              )}
            </div>
          </main>
          <TabBar />
        </div>
      );
    }

    if (userPersona === state?.activeChosen) {
      return (
        <div className="absolute inset-0 bg-background flex flex-col justify-between">
          <main className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 animate-pulse border border-border">
              <Timer className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">Waiting for James</h1>
            <p className="text-base text-slate-600 max-w-xs mb-8 leading-relaxed">
              You proposed an alternative time. James has 15 minutes to accept or decline.
            </p>
            <div className="bg-amber-500/20 text-amber-700 border border-amber-500/30 px-4 py-2 rounded-xl text-sm font-semibold font-mono flex items-center gap-1.5 justify-center">
              <Timer className="w-4 h-4 animate-pulse" /> Time remaining: {timeLeft}
            </div>
          </main>
          <TabBar />
        </div>
      );
    }
  }

  // 4. Render Confirmed Meetup Screen (The Date View!)
  if (state?.phase === "confirmed" && state?.selectedOptionIndex !== null) {
    const activeMeetup = state.proposals[state.selectedOptionIndex];
    
    const chosenName = state?.activeChosen ? state.activeChosen.charAt(0).toUpperCase() + state.activeChosen.slice(1) : "Charlotte";
    const peerName = userPersona === "james" ? chosenName : "James";
    
    let peerPhoto = "";
    let peerSubtitle = "Software Engineer • 1.3mi";

    if (userPersona === "james") {
      if (state.activeChosen === "laura") {
        peerPhoto = "/profiles/laura.svg?v=4";
        peerSubtitle = "NGO Executive Assistant • 1.3mi";
      } else if (state.activeChosen === "sarah") {
        peerPhoto = "/profiles/sarah.svg?v=4";
        peerSubtitle = "Graphic Designer • 2.1mi";
      } else {
        peerPhoto = "/profiles/charlotte.svg?v=4";
        peerSubtitle = "Veterinarian at AHS • 1.7mi";
      }
    } else {
      peerPhoto = "/profiles/james.svg?v=4";
      peerSubtitle = "Software Engineer • 1.3mi";
    }

    return (
      <div className="absolute inset-0 bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Your Meetup</h1>
            <Badge className="bg-emerald-500 text-white rounded-full">✓ Confirmed</Badge>
          </div>

          {/* Peer Card */}
          <div className="p-4 rounded-3xl border border-border bg-slate-50 flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shrink-0">
              <img src={peerPhoto} alt={peerName} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{peerName}</p>
              <p className="text-sm text-muted-foreground">{peerSubtitle}</p>
            </div>
          </div>

          {/* Location Details */}
          <div className="p-4 rounded-3xl border border-border bg-slate-50 flex flex-col gap-2 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Meetup Details</span>
            <div className="flex flex-col gap-1.5">
              <span className="text-base font-bold text-slate-800 flex items-center gap-1.5"><Coffee className="w-4 h-4 text-slate-600" /> {activeMeetup.location}</span>
              <span className="text-base text-slate-600 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-500" /> {activeMeetup.time}</span>
            </div>
            <span className="text-sm text-slate-400 mt-2 leading-relaxed">
              Reminders have been set. We will text you 24 hours and 2 hours before the meetup.
            </span>
          </div>

          {/* Verification Code Box */}
          <div className="p-5 rounded-3xl border border-border bg-slate-50 flex flex-col items-center text-center gap-3 mb-6">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">In-Person Verification</span>

            {userPersona === "james" ? (
              // James (Chooser) provides the code
              <>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  When you meet Charlotte, show her this 4-digit code to prove the date is happening.
                </p>
                <div className="text-3xl font-mono font-black tracking-widest text-slate-800 bg-white px-6 py-3 rounded-2xl border border-border mt-1">
                  {state.verificationCode}
                </div>
              </>
            ) : (
              // Charlotte (Chosen) enters the code
              <>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  Enter the 4-digit code James gives you when you meet in person.
                </p>
                <form onSubmit={handleVerify} className="w-full flex flex-col items-center gap-3 mt-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Enter Code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-48 text-center text-xl font-bold tracking-widest h-12 bg-white rounded-xl"
                  />
                  <Button type="submit" disabled={otpCode.length !== 4} className="rounded-xl w-48 h-10 text-sm bg-blue-600 hover:bg-blue-700 text-white">
                    Verify Code
                  </Button>
                </form>

                {state.codeAttempts > 0 && (
                  <span className="text-xs text-red-500 font-semibold mt-1">
                    Failed attempts: {state.codeAttempts}/5. Remaining attempts lock accounts for 24h.
                  </span>
                )}
                {state.emergencyAlert && (
                  <span className="text-sm text-red-600 font-bold bg-red-50 p-2 rounded-xl mt-1 flex items-center gap-1.5 justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" /> Emergency Contact Alert Sent!
                  </span>
                )}
              </>
            )}
          </div>

          {/* Cancel / No-show Buttons */}
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="outline"
              className="rounded-xl h-12 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => reportNoShow(userPersona)}
            >
              {peerName} didn't show up
            </Button>
          </div>
        </main>
        <TabBar />
      </div>
    );
  }

  // 5. Render Post-Meetup Rating Screen
  if (state?.phase === "post_meetup") {
    const chosenName = state?.activeChosen ? state.activeChosen.charAt(0).toUpperCase() + state.activeChosen.slice(1) : "Charlotte";
    const peerName = userPersona === "james" ? chosenName : "James";
    return (
      <div className="absolute inset-0 bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-200">
            <Coffee className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">How did it go?</h1>
          <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
            Would you like to keep {peerName} in your future pool of match options?
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              size="lg"
              className="rounded-full w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => submitPostMeetupFeedback(userPersona, true)}
            >
              Yes, keep in my future pool
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-full"
              onClick={() => submitPostMeetupFeedback(userPersona, false)}
            >
              No, remove from future matches
            </Button>
          </div>
        </main>
        <TabBar />
      </div>
    );
  }



  // 7. Default: Render Idle Role Selector (Frame 00)
  return (
    <div className="absolute inset-0 bg-background flex flex-col justify-between">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
            {userPersona === "admin" ? (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white font-bold text-2xl select-none">
                A
              </div>
            ) : (
              <img 
                src={`/profiles/${userPersona}.svg?v=4`} 
                alt={userPersona.charAt(0).toUpperCase() + userPersona.slice(1)} 
                className="w-full h-full object-cover" 
              />
            )}
          </div>
        </div>

        {/* Greeting */}
        <h1 className="text-3xl font-black text-center mb-1 text-slate-900 tracking-tight">
          Hey {userPersona === "admin" ? "Admin" : userPersona === "james" ? "James" : "Charlotte"}
        </h1>
        <p className="text-base text-muted-foreground text-center mb-10">Select a role for your next meetup</p>

        {/* Locked state notification for Chosen user */}
        {userPersona !== "james" && state?.lockedUser === userPersona && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <Eye className="w-6 h-6 text-amber-600 animate-pulse shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-amber-800">Someone is considering you…</p>
              <p className="text-xs text-amber-700 leading-snug">
                A Chooser is currently looking at your profile. Stay tuned.
              </p>
            </div>
          </div>
        )}

        {/* Role cards using native button elements for mobile touch compatibility */}
        <div className="flex flex-col gap-4">
          {/* Card 1: Be a Chooser */}
          <button
            type="button"
            onClick={() => setRole(userPersona, "chooser")}
            className="w-full flex flex-row items-center gap-4 p-4 rounded-3xl border border-slate-200 bg-white text-left active:bg-slate-50 cursor-pointer transition-all hover:border-blue-500/50 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
              <img src="/chooser_illus.png?v=3" className="w-full h-full object-cover" alt="Be a Chooser" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-slate-800 text-lg leading-snug">Be a Chooser</h3>
              <p className="text-base text-muted-foreground leading-relaxed mt-1">
                Be the one that chooses someone to meet
              </p>
            </div>
          </button>

          {/* Card 2: Be Chosen */}
          <button
            type="button"
            onClick={() => setRole(userPersona, "chosen")}
            className="w-full flex flex-row items-center gap-4 p-4 rounded-3xl border border-slate-200 bg-white text-left active:bg-slate-50 cursor-pointer transition-all hover:border-blue-500/50 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
              <img src="/chosen_illus.png?v=3" className="w-full h-full object-cover" alt="Be Chosen" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-slate-800 text-lg leading-snug">Be Chosen</h3>
              <p className="text-base text-muted-foreground leading-relaxed mt-1">
                Sit back and wait for someone to choose you
              </p>
            </div>
          </button>
        </div>
      </main>

      <TabBar />
    </div>
  );
}
