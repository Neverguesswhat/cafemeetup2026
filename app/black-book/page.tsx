"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState, MeetupHistoryItem } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coffee } from "lucide-react";

export default function BlackBookPage() {
  const router = useRouter();
  const { state, addFastTrackInvite } = useAppState();
  const [activeTab, setActiveTab] = useState<"history" | "contactable">("contactable");

  const handleFastTrack = (name: string) => {
    addFastTrackInvite(name);
    router.push("/meetup-propose");
  };

  const getStatusBadge = (status: MeetupHistoryItem["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white rounded-full">Completed</Badge>;
      case "no_show":
        return <Badge className="bg-red-500 text-white rounded-full">No-Show</Badge>;
      case "cancelled":
        return <Badge className="bg-slate-400 text-white rounded-full">Cancelled</Badge>;
    }
  };

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-1">Black Book</h1>
        <p className="text-base text-muted-foreground mb-6">Manage your past meetups and active connections</p>

        {/* Custom Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab("contactable")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "contactable" ? "bg-white text-slate-800" : "text-slate-500"
            }`}
          >
            Contactable ({(state?.contactableList || []).length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "history" ? "bg-white text-slate-800" : "text-slate-500"
            }`}
          >
            History ({(state?.meetupHistory || []).length})
          </button>
        </div>

        {/* Tab 1: Contactable Connections */}
        {activeTab === "contactable" && (
          <div className="flex flex-col gap-3">
            {(state?.contactableList || []).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                ✨ No contactable connections yet. Complete meetups and mutually opt-in to unlock fast-track.
              </div>
            ) : (
              (state?.contactableList || []).map((name) => {
                const nameLower = name.toLowerCase();
                const peerPhoto = nameLower === "charlotte"
                  ? "/profiles/charlotte.svg?v=4"
                  : nameLower === "james"
                  ? "/profiles/james.svg?v=4"
                  : nameLower === "sarah"
                  ? "/profiles/sarah.svg?v=4"
                  : "/profiles/laura.svg?v=4";
                const details = nameLower === "charlotte"
                  ? "Veterinarian"
                  : nameLower === "james"
                  ? "Software Engineer"
                  : nameLower === "sarah"
                  ? "Graphic Designer"
                  : "NGO Assistant";

                return (
                  <div key={name} className="p-4 rounded-3xl border border-border bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        <img src={peerPhoto} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-bold text-base block text-slate-800">{name}</span>
                        <span className="text-sm text-muted-foreground">{details}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full px-4 h-9 text-sm"
                      onClick={() => handleFastTrack(name)}
                    >
                      Fast-track Invite
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: History */}
        {activeTab === "history" && (
          <div className="flex flex-col gap-3">
            {(state?.meetupHistory || []).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No past meetups logged.</div>
            ) : (
              (state?.meetupHistory || []).map((item) => (
                <div key={item.id} className="p-4 rounded-3xl border border-border bg-slate-50 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-base text-slate-800">{item.name}</span>
                      <span className="text-sm text-slate-400 block mt-0.5">{item.date}</span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-dashed border-slate-200 pt-2 mt-1">
                    <span className="text-slate-500 flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5 text-slate-400" /> {item.location}</span>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {item.mode}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <TabBar />
    </div>
  );
}
