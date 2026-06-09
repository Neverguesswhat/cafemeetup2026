// Archived Role Confirmed / Transition Screen (Figma Screen 02 & 04)
// This was displayed when a user selected to "Be a Chooser" or "Be Chosen" before proceeding to browse or wait.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TabBar } from "@/components/layout/TabBar";

interface ArchivedOnboardingProps {
  userRole: "chooser" | "chosen";
  userPersona: string;
  setRole: (persona: string, role: "chooser" | "chosen" | "idle") => void;
}

export function ArchivedOnboarding({ userRole, userPersona, setRole }: ArchivedOnboardingProps) {
  const isChooser = userRole === "chooser";

  return (
    <div className="absolute inset-0 bg-background flex flex-col justify-between">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-4 flex flex-col justify-between">
        <div>
          {/* Top Selection Status Card */}
          <div className="bg-white rounded-3xl border border-slate-150 p-4 mb-6 flex flex-row items-center gap-4">
            <img
              src={isChooser ? "/chooser_illus.png?v=3" : "/chosen_illus.png?v=3"}
              className="w-12 h-12 object-cover rounded-lg"
              alt="Role Illustration"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {isChooser ? "You've selected to be a Chooser" : "You've selected to be Chosen"}
              </p>
              <button
                onClick={() => setRole(userPersona, "idle")}
                className="text-sm text-blue-600 font-semibold underline text-left block mt-1.5"
              >
                Change your mind?
              </button>
            </div>
          </div>

          {/* Content Details */}
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Great.</h1>

          {isChooser ? (
            <>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mb-8">
                Next, you'll be shown 3 profiles. Choose one of them to meet.
              </p>

              {/* Simulated visual card selector */}
              <div className="flex justify-center gap-3 my-8">
                <div className="w-16 h-24 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-lg">
                  ✕
                </div>
                <div className="w-16 h-24 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-lg">
                  ✕
                </div>
                <div className="w-16 h-24 rounded-2xl border-2 border-blue-500 bg-blue-50/50 flex items-center justify-center text-blue-600 font-bold text-lg animate-pulse">
                  ✓
                </div>
              </div>

              {/* Blue warning alert note */}
              <div className="bg-[#f0f7ff] border border-[#d0e7ff] rounded-2xl p-4 text-xs text-[#1e40af] leading-relaxed mb-6">
                <span className="font-bold">Note:</span> Once you choose someone, you will not be able to go back and
                choose someone else. You must attend the meetup or cancel and wait for 24hrs.
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mb-8">
                Now, sit back and wait for someone to choose you.
              </p>

              {/* Pulse waiting indicators */}
              <div className="flex justify-center items-center gap-2 my-12">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-blue-500 font-bold uppercase tracking-wider ml-1">
                  Waiting in pool
                </span>
              </div>

              {/* Blue warning alert note */}
              <div className="bg-[#f0f7ff] border border-[#d0e7ff] rounded-2xl p-4 text-xs text-[#1e40af] leading-relaxed mb-6">
                <span className="font-bold">Note:</span> If someone chooses you and you reject them, you will have to
                wait for 24hrs until you can try again.
              </div>
            </>
          )}
        </div>

        {/* Action button */}
        <div className="mb-6">
          {isChooser ? (
            <Link href="/browse" className="w-full block">
              <Button className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all">
                OK let's go
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <Link href="/waiting" className="w-full block">
                <Button className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all">
                  OK
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-slate-500 hover:bg-slate-50 border-slate-200"
                onClick={() => setRole(userPersona, "idle")}
              >
                Cancel Wait List
              </Button>
            </div>
          )}
        </div>
      </main>
      <TabBar />
    </div>
  );
}
