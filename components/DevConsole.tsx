"use client";

import { useState, useEffect } from "react";
import { useAppState } from "@/lib/state";
import { Sliders, Timer, AlertOctagon } from "lucide-react";

export function DevConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    state,
    setPersona,
    resetApp,
    fastForwardTimer,
    liftCooldown,
    addNotification,
  } = useAppState();

  const [timeLeft, setTimeLeft] = useState<string>("N/A");

  useEffect(() => {
    if (!state?.timerStart) {
      setTimeLeft("N/A");
      return;
    }
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - state.timerStart!) / 1000);
      const remaining = (state?.timerDuration || 900) - elapsed;
      if (remaining <= 0) {
        setTimeLeft("0:00 (Expired)");
      } else {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [state?.timerStart, state?.timerDuration]);

  const userPersona = state?.userPersona || "james";

  if (!isOpen) {
    return (
      <div className="absolute bottom-20 right-4 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 bg-black/90 text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 hover:bg-black active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md"
          title="Open Simulator Controls"
        >
          <Sliders className="w-4 h-4 text-neutral-200" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-auto bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 h-fit z-50 transition-all duration-300">
      <div className="bg-black/95 text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sliders className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Simulator Controls</span>
          </div>
          <div className="flex items-center gap-2">
            {state?.timerStart && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono flex items-center gap-1">
                <Timer className="w-3 h-3" /> {timeLeft}
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 rounded-full">
              {userPersona.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg transition-colors font-medium"
            >
              Hide
            </button>
          </div>
        </div>

        {/* Section: Switch User */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-2">
            Active Simulator Perspective
          </span>
          <div className="grid grid-cols-5 gap-1">
            {(["james", "charlotte", "laura", "sarah", "admin"] as const).map((p) => {
              const active = userPersona === p;
              let btnLabel = p.charAt(0).toUpperCase() + p.slice(1);
              if (p === "james") btnLabel = "James";
              return (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  className={`py-1.5 rounded-lg text-[9px] font-bold transition-all border leading-tight ${
                    active
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                  }`}
                >
                  {btnLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: State Information */}
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs flex flex-col gap-1 font-mono">
          <div>
            <span className="text-neutral-400">Current Phase:</span>{" "}
            <span className="text-amber-400 font-bold">{(state?.phase || "idle").toUpperCase()}</span>
          </div>
          <div>
            <span className="text-neutral-400">Dating Mode:</span>{" "}
            <span className="text-blue-400">{(state?.currentMode || "dating").toUpperCase()}</span>
          </div>
          {state?.lockedUser && (
            <div>
              <span className="text-neutral-400">Locked User:</span>{" "}
              <span className="text-red-400">{state.lockedUser} (Being considered)</span>
            </div>
          )}
          <div>
            <span className="text-neutral-400">Bans:</span>{" "}
            <span className="text-neutral-300">
              J: {state?.bans?.james ? "Y" : "-"} | C: {state?.bans?.charlotte ? "Y" : "-"} | L: {state?.bans?.laura ? "Y" : "-"} | S: {state?.bans?.sarah ? "Y" : "-"}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Rep Flags:</span>{" "}
            <span className="text-neutral-300">
              J: {state?.flags?.james || 0} | C: {state?.flags?.charlotte || 0} | L: {state?.flags?.laura || 0} | S: {state?.flags?.sarah || 0}
            </span>
          </div>
          {state?.emergencyAlert && (
            <div className="mt-1 p-2 bg-red-950/50 border border-red-500/30 rounded text-[10px] text-red-300 font-sans">
              <span className="flex items-center gap-1 font-bold mb-1"><AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse" /> HELP ALERT ACTIVE</span>
              Sent to: {state?.emergencyContact?.name} ({state?.emergencyContact?.phone})
              <br />
              Venue: {state?.emergencyAlertDetails?.location}
            </div>
          )}
        </div>

        {/* Section: Timer Actions */}
        {state?.timerStart && (
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-2">
              Timer Acceleration
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fastForwardTimer(300)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
              >
                FF 5 Mins
              </button>
              <button
                onClick={() => fastForwardTimer(840)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
              >
                FF 14 Mins
              </button>
              <button
                onClick={() => fastForwardTimer(900)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              >
                Trigger Timeout
              </button>
            </div>
          </div>
        )}

        {/* Section: Quick Triggers */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-2">
            State Tools
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={liftCooldown}
              className="flex-1 min-w-[100px] py-1.5 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
            >
              Clear Bans
            </button>
            <button
              onClick={() =>
                addNotification(
                  "Simulated Test Push",
                  "This is a simulated background push notification alert.",
                  "push"
                )
              }
              className="flex-1 min-w-[100px] py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
            >
              Push Alert
            </button>
            <button
              onClick={resetApp}
              className="flex-1 min-w-[100px] py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700"
            >
              Reset App
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 min-w-[100px] py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700"
            >
              Reload Page
            </button>
          </div>
        </div>

        {/* Section: SMS Logger */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
            Simulated Outgoing SMS Logs
          </span>
          <div className="bg-neutral-900 border border-white/5 rounded-xl p-2 max-h-36 overflow-y-auto text-[10px] font-mono text-neutral-300 flex flex-col gap-1">
            {!state?.notifications || state.notifications.filter((n) => n.type === "sms").length === 0 ? (
              <span className="text-neutral-500 italic">No SMS sent yet.</span>
            ) : (
              state.notifications
                .filter((n) => n.type === "sms")
                .map((n) => (
                  <div key={n.id} className="border-b border-white/5 pb-1">
                    <span className="text-neutral-500">[{n.timestamp}]</span>{" "}
                    <span className="text-emerald-400 font-bold">{n.title}:</span> {n.body}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
