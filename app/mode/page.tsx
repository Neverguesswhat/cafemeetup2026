"use client";

import { useAppState } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Badge } from "@/components/ui/badge";

const MODES = [
  {
    id: "dating",
    name: "Dating",
    emoji: "❤️",
    desc: "Find romance and real relationships based on chemistry and shared vibes.",
    fields: ["Photos", "Relationship Goals", "Interests", "Relationship Style"],
  },
  {
    id: "networking",
    name: "Networking",
    emoji: "💼",
    desc: "Meet professionals, founders, and mentors nearby in a relaxed environment.",
    fields: ["Professional headshot", "Current Job / Skills", "Networking Goals", "Industry Interests"],
  },
  {
    id: "interests",
    name: "Interests & Hobbies",
    emoji: "🎨",
    desc: "Connect with activity partners for hiking, painting, board games, and more.",
    fields: ["Casual photo", "Favorite Hobbies", "Weekly availability", "Activity Goals"],
  },
] as const;

export default function ModePage() {
  const { state, setMode, addNotification } = useAppState();

  const handleSelectMode = (mode: "dating" | "networking" | "interests") => {
    setMode(mode);
    addNotification("Mode Changed", `Switched active mode to ${mode.toUpperCase()}`, "system");
  };

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-1">Select Mode</h1>
        <p className="text-base text-muted-foreground mb-6">Choose how you want to connect today</p>

        <div className="flex flex-col gap-4">
          {MODES.map((m) => {
            const active = state?.currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectMode(m.id)}
                className={`w-full p-4 rounded-3xl border-2 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-white hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="font-bold text-base text-slate-800">{m.name}</span>
                  </div>
                  {active && (
                    <Badge className="bg-primary text-primary-foreground text-xs rounded-full">Active Mode</Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{m.desc}</p>

                {/* Profile sections pulled */}
                <div className="border-t border-dashed border-slate-200 pt-3">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1.5">
                    Profile Data Pulled:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.fields.map((f) => (
                      <span
                        key={f}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          active ? "bg-primary/10 text-primary font-medium" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <TabBar />
    </div>
  );
}
