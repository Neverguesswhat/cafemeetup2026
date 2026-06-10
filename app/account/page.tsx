"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AccountPage() {
  const {
    state,
    addNotification,
    setPersona,
    updateSafetySettings,
    adminWarnUser,
    adminBanUser,
    adminUnbanUser,
  } = useAppState();

  const [mounted, setMounted] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notifyPref, setNotifyPref] = useState<"push" | "sms" | "both">("both");

  const [warnedUsers, setWarnedUsers] = useState<string[]>([]);
  const [duplicateMockAlert, setDuplicateMockAlert] = useState(true);
  const [activeTab, setActiveTab] = useState<"account" | "admin">("account");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state?.emergencyContact) {
      setContactName(state.emergencyContact.name || "");
      setContactPhone(state.emergencyContact.phone || "");
    }
    if (state?.notifyPref) {
      setNotifyPref(state.notifyPref);
    }
  }, [state?.emergencyContact, state?.notifyPref]);

  const handleSaveSafety = (e: React.FormEvent) => {
    e.preventDefault();
    updateSafetySettings({ name: contactName, phone: contactPhone }, notifyPref);
    addNotification("Safety Updated", "Emergency contact details and preferences saved successfully.", "system");
  };

  const handleWarn = (user: string) => {
    adminWarnUser(user);
    if (!warnedUsers.includes(user)) {
      setWarnedUsers([...warnedUsers, user]);
    }
  };

  const getStatusLabel = (username: string) => {
    if (state?.bans?.[username]) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Active</Badge>;
  };

  if (!mounted) {
    return (
      <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Account & Safety</h1>
        </div>

        {/* Segmented Control for Admins */}
        {state?.userPersona === "admin" && (
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "account"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              My Account
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "admin"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Admin Controls
            </button>
          </div>
        )}

        {/* Account Tab Content */}
        {(state?.userPersona !== "admin" || activeTab === "account") && (
          <>
            {/* Profile Card */}
            <div className="p-4 rounded-3xl border border-border bg-slate-50 flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {state?.userPersona === "admin" ? (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white font-bold text-xl select-none">
                    A
                  </div>
                ) : (
                  <img 
                    src={`/profiles/${state?.userPersona || "james"}.svg?v=4`} 
                    alt={state?.userPersona ? state.userPersona.charAt(0).toUpperCase() + state.userPersona.slice(1) : "James"} 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <div className="flex-1">
                <span className="font-bold text-lg text-slate-800 block">
                  {state?.userPersona === "admin" ? "System Administrator" : state?.userPersona === "james" ? "James" : "Charlotte"}
                </span>
                <span className="text-sm text-muted-foreground block">
                  {state?.userPersona === "admin" ? "Moderator Mode" : state?.userPersona === "james" ? "Software Engineer • 32" : "Veterinarian at AHS • 29"}
                </span>
              </div>
            </div>

            {/* Switch Persona Box */}
            {state?.userPersona === "admin" && (
              <div className="p-4 rounded-3xl border border-border bg-slate-50 flex flex-col gap-2 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Simulation Settings</span>
                <p className="text-sm text-muted-foreground mb-2">
                  Toggle your active role persona to experience both sides of the commitment matching flow.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant={(state?.userPersona as string) === "james" ? "default" : "outline"}
                      type="button"
                      className="flex-1 rounded-xl h-10 text-sm"
                      onClick={() => setPersona("james")}
                    >
                      James (Chooser)
                    </Button>
                    <Button
                      variant={(state?.userPersona as string) === "charlotte" ? "default" : "outline"}
                      type="button"
                      className="flex-1 rounded-xl h-10 text-sm"
                      onClick={() => setPersona("charlotte")}
                    >
                      Charlotte (Chosen)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Form */}
            {state?.userPersona !== "admin" && (
              <form onSubmit={handleSaveSafety} className="flex flex-col gap-4">
                <div className="p-4 rounded-3xl border border-border bg-slate-50 flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Safety Emergency Contact
                  </span>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="contact-name" className="text-sm text-slate-500">
                      Contact Name
                    </Label>
                    <Input
                      id="contact-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="bg-white h-10 rounded-xl"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="contact-phone" className="text-sm text-slate-500">
                      Their Phone Number
                    </Label>
                    <Input
                      id="contact-phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="bg-white h-10 rounded-xl"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="notify-pref" className="text-sm text-slate-500">
                      Notify me via
                    </Label>
                    <select
                      id="notify-pref"
                      value={notifyPref}
                      onChange={(e: any) => setNotifyPref(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none"
                    >
                      <option value="both">Push Notifications & SMS</option>
                      <option value="push">Push Notifications Only</option>
                      <option value="sms">SMS Only</option>
                    </select>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Entering the code <span className="font-mono font-bold text-red-500">4357</span> (HELP) on the meetup screen
                    will immediately send an SMS with a Google Maps venue location to this contact.
                  </p>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl mt-2 font-semibold">
                  Save Settings
                </Button>
              </form>
            )}
          </>
        )}

        {/* Admin Tab Content */}
        {state?.userPersona === "admin" && activeTab === "admin" && (
          <>
            {/* Duplicate Credential Alert */}
            {duplicateMockAlert && (
              <div className="p-4 rounded-3xl border border-red-200 bg-red-50 flex flex-col gap-2 mb-6">
                <div className="flex items-start justify-between">
                  <span className="text-base font-bold text-red-800 uppercase block">Duplicate Account Alert</span>
                  <button
                    onClick={() => setDuplicateMockAlert(false)}
                    className="text-red-800 text-sm font-bold px-1.5"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-base text-red-700 leading-relaxed">
                  System detected a new registration attempt using the same phone number as suspended user:{" "}
                  <span className="font-bold">charlotte</span>. Action flagged for review.
                </p>
              </div>
            )}

            {/* Users list */}
            <h2 className="text-base font-bold uppercase text-slate-400 tracking-wider mb-3 block">User Accounts</h2>
            <div className="flex flex-col gap-4 mb-6">
              {/* User 1: James */}
              <div className="p-4 rounded-3xl border border-border bg-slate-50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      <img src="/profiles/james.svg?v=4" alt="James" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-base text-slate-800 block">James</span>
                      <span className="text-sm text-slate-400">Phone: +1 (555) 003-5182</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusLabel("james")}
                    <span className="text-sm text-slate-400">Flags: {state?.flags?.james || 0}/3</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    className="flex-1 rounded-xl h-9 text-sm"
                    onClick={() => handleWarn("james")}
                    disabled={warnedUsers.includes("james")}
                  >
                    {warnedUsers.includes("james") ? "Warned ✓" : "Issue Warning"}
                  </Button>
                  {state?.bans?.james ? (
                    <Button
                      variant="outline"
                      type="button"
                      className="flex-1 rounded-xl h-9 text-sm text-green-600 hover:bg-green-50"
                      onClick={() => adminUnbanUser("james")}
                    >
                      Lift Suspension
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      type="button"
                      className="flex-1 rounded-xl h-9 text-sm"
                      onClick={() => adminBanUser("james")}
                    >
                      Suspend Account
                    </Button>
                  )}
                </div>
              </div>

              {/* User 2: Charlotte */}
              <div className="p-4 rounded-3xl border border-border bg-slate-50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      <img src="/profiles/charlotte.svg?v=4" alt="Charlotte" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-base text-slate-800 block">Charlotte</span>
                      <span className="text-sm text-slate-400">Phone: +1 (555) 002-9182</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusLabel("charlotte")}
                    <span className="text-sm text-slate-400">Flags: {state?.flags?.charlotte || 0}/3</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    className="flex-1 rounded-xl h-9 text-sm"
                    onClick={() => handleWarn("charlotte")}
                    disabled={warnedUsers.includes("charlotte")}
                  >
                    {warnedUsers.includes("charlotte") ? "Warned ✓" : "Issue Warning"}
                  </Button>
                  {state?.bans?.charlotte ? (
                    <Button
                      variant="outline"
                      type="button"
                      className="flex-1 rounded-xl h-9 text-sm text-green-600 hover:bg-green-50"
                      onClick={() => adminUnbanUser("charlotte")}
                    >
                      Lift Suspension
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      type="button"
                      className="flex-1 rounded-xl h-9 text-sm"
                      onClick={() => adminBanUser("charlotte")}
                    >
                      Suspend Account
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <TabBar />
    </div>
  );
}

