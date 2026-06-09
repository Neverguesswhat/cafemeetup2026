"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserPersona = "james" | "charlotte" | "laura" | "sarah" | "admin";
export type AppPhase =
  | "idle"
  | "browsing"
  | "proposing"
  | "deciding"
  | "negotiating"
  | "confirmed"
  | "post_meetup"
  | "cooldown";

export interface MeetupOption {
  time: string;
  location: string;
}

export interface MeetupHistoryItem {
  id: string;
  name: string;
  role: "Chooser" | "Chosen";
  date: string;
  location: string;
  status: "completed" | "no_show" | "cancelled";
  mode: "dating" | "networking" | "interests";
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  type: "sms" | "push" | "system";
}

export interface AppState {
  userPersona: UserPersona;
  currentMode: "dating" | "networking" | "interests";
  phase: AppPhase;
  activeChooser: string | null;
  activeChosen: string | null;
  lockedUser: string | null;
  lockExpiresAt: number | null;
  timerStart: number | null;
  timerDuration: number; // in seconds
  proposals: MeetupOption[];
  selectedOptionIndex: number | null;
  editedProposal: MeetupOption | null; // Charlotte's edit
  verificationCode: string;
  codeAttempts: number;
  emergencyAlert: boolean;
  emergencyAlertDetails: { time: string; location: string } | null;
  flags: Record<string, number>;
  bans: Record<string, string | null>; // ISO date of ban expiration (e.g. 9am next day)
  meetupHistory: MeetupHistoryItem[];
  contactableList: string[]; // names of users available for fast-track
  notifications: NotificationItem[];
  emergencyContact: { name: string; phone: string };
  notifyPref: "push" | "sms" | "both";
  savedLocations: string[];
  roles: Record<string, "chooser" | "chosen" | "idle">;
}

const DEFAULT_STATE: AppState = {
  userPersona: "james",
  currentMode: "dating",
  phase: "idle",
  activeChooser: null,
  activeChosen: null,
  lockedUser: null,
  lockExpiresAt: null,
  timerStart: null,
  timerDuration: 900, // 15 mins
  proposals: [],
  selectedOptionIndex: null,
  editedProposal: null,
  verificationCode: "0035",
  codeAttempts: 0,
  emergencyAlert: false,
  emergencyAlertDetails: null,
  flags: { james: 0, charlotte: 0, laura: 0, sarah: 0 },
  bans: { james: null, charlotte: null, laura: null, sarah: null },
  meetupHistory: [
    {
      id: "hist-1",
      name: "Laura",
      role: "Chooser",
      date: "2026-06-01",
      location: "Retro Cafe",
      status: "completed",
      mode: "dating",
    },
  ],
  contactableList: ["Laura"],
  notifications: [
    {
      id: "not-1",
      timestamp: new Date().toLocaleTimeString(),
      title: "Welcome to Cafe Meetup!",
      body: "Choose Dating, Networking, or Interests and find real connections.",
      type: "system",
    },
  ],
  emergencyContact: { name: "Sarah Smith", phone: "+1 (555) 019-2831" },
  notifyPref: "both",
  savedLocations: ["Retro Cafe", "Cuppa & Co", "The Beanery"],
  roles: { james: "idle", charlotte: "idle", laura: "idle", sarah: "idle", admin: "idle" },
};

interface AppContextType {
  state: AppState;
  setPersona: (p: UserPersona) => void;
  setMode: (m: "dating" | "networking" | "interests") => void;
  setRole: (persona: UserPersona, role: "chooser" | "chosen" | "idle") => void;
  startBrowsing: () => void;
  lockProfile: (name: string) => void;
  releaseProfile: () => void;
  chooseProfile: (name: string) => void;
  submitProposals: (options: MeetupOption[]) => void;
  acceptProposal: (optionIndex: number) => void;
  editProposal: (optionIndex: number, newTime: string) => void;
  handleEditResponse: (accept: boolean) => void;
  declineProposal: () => void;
  submitVerificationCode: (code: string) => "success" | "help" | "fail";
  reportNoShow: (reporter: string) => void;
  submitPostMeetupFeedback: (user: string, optIn: boolean) => void;
  resetApp: () => void;
  addNotification: (title: string, body: string, type?: "sms" | "push" | "system") => void;
  fastForwardTimer: (seconds: number) => void;
  liftCooldown: () => void;
  adminWarnUser: (username: string) => void;
  adminBanUser: (username: string) => void;
  adminUnbanUser: (username: string) => void;
  addFastTrackInvite: (name: string) => void;
  updateSafetySettings: (contact: { name: string; phone: string }, pref: "push" | "sms" | "both") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "cafemeetup2026_state";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          const merged = { ...DEFAULT_STATE };
          for (const key of Object.keys(DEFAULT_STATE) as Array<keyof AppState>) {
            if (parsed[key] !== undefined && parsed[key] !== null) {
              if (Array.isArray(DEFAULT_STATE[key])) {
                if (Array.isArray(parsed[key])) {
                  (merged as any)[key] = parsed[key];
                }
              } else if (typeof DEFAULT_STATE[key] === "object" && DEFAULT_STATE[key] !== null) {
                if (typeof parsed[key] === "object" && !Array.isArray(parsed[key])) {
                  (merged as any)[key] = { ...DEFAULT_STATE[key], ...parsed[key] };
                }
              } else {
                (merged as any)[key] = parsed[key];
              }
            }
          }
          setState(merged);
        }
      } catch (e) {
        console.error("Error parsing local storage state", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Sync state changes to local storage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isInitialized]);

  // Listen for storage changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Error parsing cross-tab state update", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (!state.timerStart) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - state.timerStart!) / 1000);
      const remaining = state.timerDuration - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        // Timeout handling
        handleTimeout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state.timerStart, state.timerDuration, state.phase]);

  const handleTimeout = () => {
    addNotification("Timer Expired", "The action timed out.", "system");

    if (state.phase === "browsing" || state.phase === "proposing") {
      // James timed out choosing or proposing
      setState((prev) => ({
        ...prev,
        phase: "idle",
        timerStart: null,
        lockedUser: null,
        lockExpiresAt: null,
      }));
    } else if (state.phase === "deciding" || state.phase === "negotiating") {
      // Charlotte timed out accepting or James timed out accepting Charlotte's edit
      // Penalize Charlotte (24h ban) if she timed out on choosing. Let's make it a general reset.
      setState((prev) => {
        const nextBans = { ...(prev?.bans || {}) };
        // If it was their turn to decide, ban them for 24h
        const timedOutUser = prev?.activeChosen;
        if (prev?.phase === "deciding" && timedOutUser) {
          const nextDay = new Date();
          nextDay.setHours(9, 0, 0, 0);
          if (nextDay.getTime() <= Date.now()) {
            nextDay.setDate(nextDay.getDate() + 1);
          }
          nextBans[timedOutUser] = nextDay.toISOString();
        }

        return {
          ...prev,
          phase: "idle",
          timerStart: null,
          lockedUser: null,
          lockExpiresAt: null,
          bans: nextBans,
        };
      });
    }
  };

  const addNotification = (title: string, body: string, type: "sms" | "push" | "system" = "system") => {
    const newItem: NotificationItem = {
      id: "not-" + Date.now() + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString(),
      title,
      body,
      type,
    };
    setState((prev) => ({
      ...prev,
      notifications: [newItem, ...(prev?.notifications || [])].slice(0, 50),
    }));
  };

  const setPersona = (userPersona: UserPersona) => {
    setState((prev) => ({ ...prev, userPersona }));
  };

  const setRole = (persona: UserPersona, role: "chooser" | "chosen" | "idle") => {
    // If user is banned, prevent choosing role
    if (role !== "idle" && state?.bans?.[persona]) {
      addNotification("Blocked", "You are currently on cooldown until 9:00 AM.", "system");
      return;
    }

    setState((prev) => {
      const nextRoles = { ...(prev?.roles || {}), [persona]: role };

      let nextPhase = prev?.phase;
      let nextTimerStart = prev?.timerStart;
      let nextActiveChooser = prev?.activeChooser;

      if (role === "chooser") {
        nextPhase = "browsing";
        nextTimerStart = Date.now();
        nextActiveChooser = persona;
      } else if (role === "chosen") {
        // wait state
        if (persona === "charlotte" && prev?.phase === "idle") {
          // waits
        }
      } else {
        // Setting to idle
        if (persona === "james" && prev?.phase === "browsing") {
          nextPhase = "idle";
          nextTimerStart = null;
        }
      }

      return {
        ...prev,
        roles: nextRoles,
        phase: nextPhase,
        timerStart: nextTimerStart,
        activeChooser: nextActiveChooser,
      };
    });

    addNotification("Role Selection", `${persona.toUpperCase()} selected role: ${role.toUpperCase()}`, "system");
  };

  const setMode = (currentMode: "dating" | "networking" | "interests") => {
    setState((prev) => ({ ...prev, currentMode }));
  };

  const startBrowsing = () => {
    // If user is banned, prevent browsing
    if (state?.bans?.[state?.userPersona || "james"]) {
      addNotification("Blocked", "You are currently on cooldown until 9:00 AM.", "system");
      return;
    }
    setState((prev) => ({
      ...prev,
      phase: "browsing",
      activeChooser: (prev?.userPersona || "james") === "james" ? "james" : "charlotte",
      activeChosen: null,
      timerStart: Date.now(),
      timerDuration: 900, // 15 mins
    }));
    addNotification("Matching Started", "Browse matching profiles. You have 15 minutes to choose.", "push");
  };

  const lockProfile = (profileName: string) => {
    const nameLower = profileName.toLowerCase();
    setState((prev) => ({
      ...prev,
      lockedUser: nameLower,
      lockExpiresAt: Date.now() + 15 * 60 * 1000,
    }));
    addNotification("Lock Active", `${profileName} is currently being considered by James.`, "system");
  };

  const releaseProfile = () => {
    const prevLocked = state.lockedUser;
    setState((prev) => ({
      ...prev,
      lockedUser: null,
      lockExpiresAt: null,
    }));
    if (prevLocked) {
      const nameCapitalized = prevLocked.charAt(0).toUpperCase() + prevLocked.slice(1);
      addNotification("Lock Released", `${nameCapitalized} is available in the pool again.`, "system");
    }
  };

  const chooseProfile = (profileName: string) => {
    const nameLower = profileName.toLowerCase();
    setState((prev) => ({
      ...prev,
      phase: "proposing",
      activeChosen: nameLower,
      timerStart: Date.now(),
      timerDuration: 900,
    }));
    addNotification("Selected " + profileName, `Propose 3 meetup options for ${profileName}.`, "push");
  };

  const submitProposals = (proposals: MeetupOption[]) => {
    setState((prev) => ({
      ...prev,
      phase: "deciding",
      proposals,
      timerStart: Date.now(),
      timerDuration: 900,
    }));
    addNotification(
      "Options Sent",
      "Proposals sent to Charlotte. She has 15 minutes to respond.",
      "push"
    );
    // Charlotte gets notified
    addNotification(
      "Meetup Proposal Received",
      "James proposed 3 meetups! Review options on your home screen.",
      "sms"
    );
  };

  const acceptProposal = (optionIndex: number) => {
    setState((prev) => ({
      ...prev,
      phase: "confirmed",
      selectedOptionIndex: optionIndex,
      timerStart: null, // Meetup confirmed, no more 15-min countdown
      codeAttempts: 0,
      emergencyAlert: false,
    }));
    addNotification(
      "Meetup Confirmed",
      `Meetup confirmed at ${state.proposals[optionIndex].location} on ${state.proposals[optionIndex].time}!`,
      "push"
    );
    addNotification(
      "Meetup Confirmed",
      `Meetup confirmed at ${state.proposals[optionIndex].location} on ${state.proposals[optionIndex].time}!`,
      "sms"
    );
  };

  const editProposal = (optionIndex: number, newTime: string) => {
    const updatedOption = {
      ...state.proposals[optionIndex],
      time: newTime,
    };
    setState((prev) => ({
      ...prev,
      phase: "negotiating",
      selectedOptionIndex: optionIndex,
      editedProposal: updatedOption,
      timerStart: Date.now(),
      timerDuration: 900,
    }));
    addNotification(
      "Edit Proposed",
      `You suggested editing the time of Option ${optionIndex + 1} to ${newTime}.`,
      "push"
    );
    addNotification(
      "Charlotte suggested a change",
      `Charlotte suggested changing the time of ${state.proposals[optionIndex].location} to ${newTime}.`,
      "sms"
    );
  };

  const handleEditResponse = (accept: boolean) => {
    if (accept && state.editedProposal && state.selectedOptionIndex !== null) {
      const updatedProposals = [...state.proposals];
      updatedProposals[state.selectedOptionIndex] = state.editedProposal;

      setState((prev) => ({
        ...prev,
        phase: "confirmed",
        proposals: updatedProposals,
        editedProposal: null,
        timerStart: null,
        codeAttempts: 0,
      }));
      addNotification("Edit Accepted", "James accepted the time change! Meetup is confirmed.", "push");
      addNotification("Edit Accepted", "James accepted the time change! Meetup is confirmed.", "sms");
    } else {
      // Decline: Charlotte goes back to Be Chooser/Be Chosen. James gets new profiles but his options are saved
      setState((prev) => ({
        ...prev,
        phase: "idle", // Reset Charlotte
        timerStart: null,
        lockedUser: null,
        editedProposal: null,
        selectedOptionIndex: null,
      }));
      addNotification("Edit Declined", "James declined the time change. Match flow cancelled.", "push");
      addNotification("Edit Declined", "James declined the time change. Match flow cancelled.", "sms");
    }
  };

  const declineProposal = () => {
    const nextDay = new Date();
    nextDay.setHours(9, 0, 0, 0);
    if (nextDay.getTime() <= Date.now()) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    let declinedUser = "charlotte";
    setState((prev) => {
      const nextBans = { ...(prev?.bans || {}) };
      declinedUser = prev?.activeChosen || "charlotte";
      nextBans[declinedUser] = nextDay.toISOString();
      return {
        ...prev,
        phase: "idle",
        timerStart: null,
        lockedUser: null,
        bans: nextBans,
      };
    });

    const chosenName = declinedUser.charAt(0).toUpperCase() + declinedUser.slice(1);
    addNotification("Proposal Declined", `${chosenName} declined the invitation and is suspended for 24h.`, "push");
    addNotification("Meetup Cancelled", `${chosenName} declined your proposal. Matching restarted.`, "sms");
  };

  const submitVerificationCode = (code: string): "success" | "help" | "fail" => {
    if (code === "4357") {
      setState((prev) => ({
        ...prev,
        emergencyAlert: true,
        emergencyAlertDetails: {
          time: new Date().toLocaleString(),
          location: (prev?.proposals || [])[prev?.selectedOptionIndex ?? 0]?.location ?? "Unknown",
        },
      }));
      addNotification(
        "EMERGENCY ALERT",
        `HELP alert triggered! Location sent to emergency contact (${state.emergencyContact.name}): ${
          state.proposals[state.selectedOptionIndex ?? 0]?.location
        }`,
        "sms"
      );
      return "help";
    }

    if (code === state.verificationCode) {
      // Date successfully verified
      setState((prev) => ({
        ...prev,
        phase: "post_meetup",
      }));
      addNotification("Code Verified", "Date verified! Enjoy your meetup.", "push");
      return "success";
    }

    // Wrong code
    const nextAttempts = state.codeAttempts + 1;
    if (nextAttempts >= 5) {
      // 5 failed attempts = no show penalty for BOTH
      const nextDay = new Date();
      nextDay.setHours(9, 0, 0, 0);
      if (nextDay.getTime() <= Date.now()) {
        nextDay.setDate(nextDay.getDate() + 1);
      }

      setState((prev) => {
        const currentChosen = prev?.activeChosen || "charlotte";
        const nextBans = { ...(prev?.bans || {}) };
        nextBans.james = nextDay.toISOString();
        nextBans[currentChosen] = nextDay.toISOString();

        const nextFlags = { ...(prev?.flags || {}) };
        nextFlags.james = (prev?.flags?.james ?? 0) + 1;
        nextFlags[currentChosen] = (prev?.flags?.[currentChosen] ?? 0) + 1;

        return {
          ...prev,
          phase: "idle",
          codeAttempts: 0,
          bans: nextBans,
          flags: nextFlags,
        };
      });
      addNotification("Meetup Cancelled", "5 failed code verification attempts. Both accounts suspended for 24h.", "push");
      addNotification("Meetup Cancelled", "5 failed code verification attempts. Both accounts suspended for 24h.", "sms");
      return "fail";
    }

    setState((prev) => ({
      ...prev,
      codeAttempts: nextAttempts,
    }));
    return "fail";
  };

  const reportNoShow = (reporter: string) => {
    const offender = reporter === "james" ? (state.activeChosen || "charlotte") : "james";

    const nextDay = new Date();
    nextDay.setHours(9, 0, 0, 0);
    if (nextDay.getTime() <= Date.now()) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    setState((prev) => {
      const nextBans = { ...(prev?.bans || {}) };
      nextBans[offender] = nextDay.toISOString();

      const nextFlags = { ...(prev?.flags || {}) };
      nextFlags[offender] = (nextFlags[offender] ?? 0) + 1;

      const offenderNameCapitalized = offender === "james" ? "James" : (offender.charAt(0).toUpperCase() + offender.slice(1));

      // Log meetup history
      const newHistoryItem: MeetupHistoryItem = {
        id: "hist-" + Date.now(),
        name: offenderNameCapitalized,
        role: reporter === "james" ? "Chooser" : "Chosen",
        date: new Date().toLocaleDateString(),
        location: (prev?.proposals || [])[prev?.selectedOptionIndex ?? 0]?.location ?? "Local Venue",
        status: "no_show",
        mode: prev?.currentMode || "dating",
      };

      return {
        ...prev,
        phase: "idle",
        bans: nextBans,
        flags: nextFlags,
        meetupHistory: [newHistoryItem, ...(prev?.meetupHistory || [])],
        selectedOptionIndex: null,
      };
    });

    const offenderName = offender === "james" ? "James" : (offender.charAt(0).toUpperCase() + offender.slice(1));
    addNotification(
      "No-Show Reported",
      `${offenderName} was marked as a no-show. Suspended for 24h.`,
      "push"
    );
    addNotification(
      "No-Show Reported",
      `${offenderName} was marked as a no-show. Suspended for 24h.`,
      "sms"
    );
  };

  const submitPostMeetupFeedback = (user: string, optIn: boolean) => {
    // For simplicity, we just complete the date
    setState((prev) => {
      const peerName = prev?.activeChosen ? (prev.activeChosen.charAt(0).toUpperCase() + prev.activeChosen.slice(1)) : "Charlotte";
      const peer = user === "james" ? peerName : "James";
      const isMutual = optIn; // In real life, check if peer also said yes. We'll simulate mutual-opt in.

      const newHistoryItem: MeetupHistoryItem = {
        id: "hist-" + Date.now(),
        name: peer,
        role: user === "james" ? "Chooser" : "Chosen",
        date: new Date().toLocaleDateString(),
        location: (prev?.proposals || [])[prev?.selectedOptionIndex ?? 0]?.location ?? "Local Venue",
        status: "completed",
        mode: prev?.currentMode || "dating",
      };

      const nextContactable = [...(prev?.contactableList || [])];
      if (optIn && !nextContactable.includes(peer)) {
        nextContactable.push(peer);
      }

      // 9am reset cooldown
      const nextDay = new Date();
      nextDay.setHours(9, 0, 0, 0);
      if (nextDay.getTime() <= Date.now()) {
        nextDay.setDate(nextDay.getDate() + 1);
      }

      const nextBans = { ...(prev?.bans || {}) };
      nextBans[user] = nextDay.toISOString(); // Lock user out until 9am tomorrow

      return {
        ...prev,
        phase: "idle", // Reset to idle (but banned until 9am)
        meetupHistory: [newHistoryItem, ...(prev?.meetupHistory || [])],
        contactableList: nextContactable,
        bans: nextBans,
        selectedOptionIndex: null,
      };
    });

    addNotification(
      "Feedback Submitted",
      "Thank you for your feedback! Match flow locked until 9:00 AM tomorrow.",
      "push"
    );
  };

  const resetApp = () => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    addNotification("App Reset", "Simulated system has been reset to defaults.", "system");
  };

  const fastForwardTimer = (seconds: number) => {
    setState((prev) => {
      if (!prev?.timerStart) return prev;
      return {
        ...prev,
        timerStart: prev.timerStart - seconds * 1000,
      };
    });
    addNotification("Fast Forwarded", `Simulated timer fast-forwarded by ${seconds / 60} minutes.`, "system");
  };

  const liftCooldown = () => {
    setState((prev) => ({
      ...prev,
      bans: { james: null, charlotte: null, laura: null, sarah: null },
    }));
    addNotification("Cooldown Lifted", "Simulated 9:00 AM / 24h suspension lifted.", "system");
  };

  const adminWarnUser = (username: string) => {
    addNotification("Admin Action", `Warning issued to user: ${username}`, "system");
  };

  const adminBanUser = (username: string) => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1); // 24 hour ban
    setState((prev) => {
      const nextBans = { ...(prev?.bans || {}) };
      nextBans[username] = nextDay.toISOString();
      return { ...prev, bans: nextBans };
    });
    addNotification("Admin Action", `Suspended user: ${username}`, "system");
  };

  const adminUnbanUser = (username: string) => {
    setState((prev) => {
      const nextBans = { ...(prev?.bans || {}) };
      nextBans[username] = null;
      return { ...prev, bans: nextBans };
    });
    addNotification("Admin Action", `Lifting ban on user: ${username}`, "system");
  };

  const addFastTrackInvite = (name: string) => {
    setState((prev) => ({
      ...prev,
      phase: "proposing",
      activeChooser: (prev?.userPersona || "james") === "james" ? "james" : "charlotte",
      activeChosen: name.toLowerCase(),
      timerStart: Date.now(),
      timerDuration: 900,
    }));
    addNotification("Fast-track Invitation", `Proposing meetup options directly to ${name}.`, "push");
  };

  const updateSafetySettings = (emergencyContact: { name: string; phone: string }, notifyPref: "push" | "sms" | "both") => {
    setState((prev) => ({
      ...prev,
      emergencyContact,
      notifyPref,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setPersona,
        setMode,
        setRole,
        startBrowsing,
        lockProfile,
        releaseProfile,
        chooseProfile,
        submitProposals,
        acceptProposal,
        editProposal,
        handleEditResponse,
        declineProposal,
        submitVerificationCode,
        reportNoShow,
        submitPostMeetupFeedback,
        resetApp,
        addNotification,
        fastForwardTimer,
        liftCooldown,
        adminWarnUser,
        adminBanUser,
        adminUnbanUser,
        addFastTrackInvite,
        updateSafetySettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
