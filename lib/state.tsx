"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

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
  submitProposals: (options: MeetupOption[]) => Promise<boolean>;
  acceptProposal: (optionIndex: number) => void;
  editProposal: (optionIndex: number, newTime: string) => Promise<boolean>;
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

// Mapping persona names to their simulation emails
const PERSONA_EMAILS: Record<UserPersona, string> = {
  james: "james@cafemeetup.com",
  charlotte: "charlotte@cafemeetup.com",
  laura: "laura@cafemeetup.com",
  sarah: "sarah@cafemeetup.com",
  admin: "admin@cafemeetup.com",
};

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [useDb, setUseDb] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // References to keep callbacks current without running effects
  const useDbRef = useRef(useDb);
  const currentUserIdRef = useRef(currentUserId);
  const stateRef = useRef(state);

  useEffect(() => {
    useDbRef.current = useDb;
    currentUserIdRef.current = currentUserId;
    stateRef.current = state;
  }, [useDb, currentUserId, state]);

  // Seeder: Signs up/in the 5 simulation accounts to populate auth.users and public.profiles
  const seedProfiles = async () => {
    const personas: UserPersona[] = ["james", "charlotte", "laura", "sarah", "admin"];
    const originalPersona = stateRef.current.userPersona;

    for (const p of personas) {
      const email = PERSONA_EMAILS[p];
      const password = "password123";
      try {
        let authUser: any = null;
        const { data: signinData } = await supabase.auth.signInWithPassword({ email, password });
        authUser = signinData?.user;

        if (!authUser) {
          const { data: signupData } = await supabase.auth.signUp({ email, password });
          authUser = signupData?.user;
        }

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", authUser.id)
            .maybeSingle();

          if (!profile) {
            const defaults: Record<string, any> = {
              james: { full_name: "James", avatar_url: "/profiles/james.svg", emergency_contact_name: "Sarah Smith", emergency_contact_phone: "+1 (555) 019-2831" },
              charlotte: { full_name: "Charlotte", avatar_url: "/profiles/charlotte.svg", emergency_contact_name: "Sarah Smith", emergency_contact_phone: "+1 (555) 019-2831" },
              laura: { full_name: "Laura", avatar_url: "/profiles/laura.svg", emergency_contact_name: "Sarah Smith", emergency_contact_phone: "+1 (555) 019-2831" },
              sarah: { full_name: "Sarah", avatar_url: "/profiles/sarah.svg", emergency_contact_name: "Sarah Smith", emergency_contact_phone: "+1 (555) 019-2831" },
              admin: { full_name: "Admin", avatar_url: "", emergency_contact_name: "", emergency_contact_phone: "" },
            };
            const d = defaults[p];
            await supabase.from("profiles").insert({
              id: authUser.id,
              full_name: d.full_name,
              avatar_url: d.avatar_url,
              emergency_contact_name: d.emergency_contact_name,
              emergency_contact_phone: d.emergency_contact_phone,
              role: "idle",
              current_mode: "dating",
            });
          }
        }
      } catch (err) {
        console.error(`Seeding failed for persona ${p}:`, err);
      }
    }

    // Sign back into the active persona
    const email = PERSONA_EMAILS[originalPersona];
    const { data: activeSession } = await supabase.auth.signInWithPassword({ email, password: "password123" });
    if (activeSession?.user) {
      setCurrentUserId(activeSession.user.id);
    }
  };

  // Rebuilds the global AppState by querying the DB
  const syncStateFromDb = async (persona: UserPersona, userId: string) => {
    try {
      // 1. Fetch all profiles to rebuild flags, bans, roles, and lock states
      const { data: allProfiles, error: profError } = await supabase
        .from("profiles")
        .select("*");

      if (profError) throw profError;

      const flags: Record<string, number> = { james: 0, charlotte: 0, laura: 0, sarah: 0 };
      const bans: Record<string, string | null> = { james: null, charlotte: null, laura: null, sarah: null };
      const roles: Record<string, "chooser" | "chosen" | "idle"> = { james: "idle", charlotte: "idle", laura: "idle", sarah: "idle", admin: "idle" };
      let lockedUser: string | null = null;
      let lockExpiresAt: number | null = null;

      allProfiles?.forEach((p) => {
        const nameLower = p.full_name?.toLowerCase();
        if (nameLower) {
          flags[nameLower] = p.flags_count || 0;
          bans[nameLower] = p.banned_until || null;
          roles[nameLower] = p.role || "idle";

          if (p.is_locked && p.lock_expires_at && new Date(p.lock_expires_at).getTime() > Date.now()) {
            if (nameLower === "charlotte") {
              lockedUser = "charlotte";
              lockExpiresAt = new Date(p.lock_expires_at).getTime();
            }
          }
        }
      });

      // Find active user profile
      const activeProfile = allProfiles?.find((p) => p.id === userId);
      const currentMode = (activeProfile?.current_mode as any) || "dating";
      const emergencyContact = {
        name: activeProfile?.emergency_contact_name || "",
        phone: activeProfile?.emergency_contact_phone || "",
      };
      const notifyPref = activeProfile?.notify_pref || "both";

      // 2. Fetch the active meetup for the logged-in user
      const { data: activeMeetup } = await supabase
        .from("meetups")
        .select("*, chooser_id(full_name), chosen_id(full_name)")
        .in("status", ["proposed", "negotiating", "confirmed"])
        .or(`chooser_id.eq.${userId},chosen_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let phase: AppPhase = "idle";
      let activeChooser: string | null = null;
      let activeChosen: string | null = null;
      let proposals: MeetupOption[] = [];
      let selectedOptionIndex: number | null = null;
      let editedProposal: MeetupOption | null = null;
      let verificationCode = "0035";
      let codeAttempts = 0;
      let emergencyAlert = false;
      let emergencyAlertDetails: any = null;
      let timerStart: number | null = null;

      if (activeMeetup) {
        activeChooser = (activeMeetup.chooser_id as any)?.full_name?.toLowerCase() || null;
        activeChosen = (activeMeetup.chosen_id as any)?.full_name?.toLowerCase() || null;
        proposals = activeMeetup.options;
        selectedOptionIndex = activeMeetup.selected_option_index;
        editedProposal = activeMeetup.edited_proposal;
        verificationCode = activeMeetup.verification_code;
        codeAttempts = activeMeetup.code_attempts || 0;
        emergencyAlert = activeMeetup.emergency_alert || false;
        emergencyAlertDetails = activeMeetup.emergency_alert_details;
        timerStart = (activeMeetup.status !== "confirmed" && activeMeetup.expires_at)
          ? (new Date(activeMeetup.expires_at).getTime() - 15 * 60 * 1000)
          : null;

        if (activeMeetup.status === "proposed") {
          phase = "deciding";
        } else if (activeMeetup.status === "negotiating") {
          phase = "negotiating";
        } else if (activeMeetup.status === "confirmed") {
          phase = "confirmed";
        }
      } else {
        // Deduced phase
        const activeRole = activeProfile?.role;
        if (stateRef.current.phase === "proposing" && stateRef.current.activeChosen) {
          phase = "proposing";
          activeChosen = stateRef.current.activeChosen;
          timerStart = stateRef.current.timerStart;
        } else if (activeRole === "chooser") {
          phase = "browsing";
          // We can estimate browse timer start or keep it clean
        } else if (activeProfile?.banned_until && new Date(activeProfile.banned_until).getTime() > Date.now()) {
          phase = "cooldown";
        } else {
          phase = "idle";
        }
      }

      // 3. Fetch completed/cancelled/no_show meetup history
      const { data: historyData } = await supabase
        .from("meetups")
        .select("*, chooser_id(full_name), chosen_id(full_name)")
        .in("status", ["completed", "cancelled", "no_show"])
        .or(`chooser_id.eq.${userId},chosen_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(20);

      const meetupHistory: MeetupHistoryItem[] = historyData?.map((h: any) => {
        const isChooser = h.chooser_id.id === userId || h.chooser_id === userId;
        const peerName = isChooser ? h.chosen_id?.full_name : h.chooser_id?.full_name;
        return {
          id: h.id,
          name: peerName || "User",
          role: isChooser ? "Chooser" : "Chosen",
          date: new Date(h.created_at).toLocaleDateString(),
          location: h.options[h.selected_option_index ?? 0]?.location || "Local Cafe",
          status: h.status,
          mode: "dating",
        };
      }) || [];

      // 4. Fetch notifications
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      const notifications: NotificationItem[] = notificationsData?.map((n) => ({
        id: n.id,
        timestamp: new Date(n.created_at).toLocaleTimeString(),
        title: n.title,
        body: n.body,
        type: n.type,
      })) || [];

      setState((prev) => ({
        ...prev,
        userPersona: persona,
        currentMode,
        phase,
        activeChooser,
        activeChosen,
        lockedUser,
        lockExpiresAt,
        timerStart,
        proposals,
        selectedOptionIndex,
        editedProposal,
        verificationCode,
        codeAttempts,
        emergencyAlert,
        emergencyAlertDetails,
        flags,
        bans,
        meetupHistory,
        notifications,
        emergencyContact,
        notifyPref,
        roles,
      }));
    } catch (err) {
      console.error("Error syncing state from DB:", err);
    }
  };

  // Auth Persona Swapper: Authenticates the client context as the chosen persona
  const handleAuthPersona = async (persona: UserPersona) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      setUseDb(false);
      return;
    }

    try {
      const email = PERSONA_EMAILS[persona];
      const password = "password123";

      let { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error && error.message.includes("Invalid login credentials")) {
        // Seeder handles creating accounts, but trigger it here just in case
        await seedProfiles();
        const retry = await supabase.auth.signInWithPassword({ email, password });
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      if (data?.user) {
        setUseDb(true);
        setCurrentUserId(data.user.id);
        await syncStateFromDb(persona, data.user.id);
      }
    } catch (err) {
      console.error("Supabase signin failed, falling back to local state:", err);
      setUseDb(false);
    }
  };

  // 1. Initial mounting: check database connection, run seeder if credentials exist, or load local storage
  useEffect(() => {
    const init = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        try {
          // Run the seeder to guarantee james/charlotte/etc. exist
          await seedProfiles();
          // Authenticate James by default
          await handleAuthPersona("james");
        } catch (e) {
          console.error("Supabase database connection failed on mount, local storage active:", e);
          setUseDb(false);
        }
      } else {
        setUseDb(false);
      }

      // Load local storage fallback if not using DB
      if (!useDbRef.current) {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === "object") {
              setState(parsed);
            }
          } catch (e) {
            console.error("Error parsing local storage fallback", e);
          }
        }
      }
      setIsInitialized(true);
    };

    init();
  }, []);

  // 2. Realtime Database Subscriptions to auto-refresh state across tabs
  useEffect(() => {
    if (!useDb || !currentUserId) return;

    const profileChannel = supabase
      .channel("db-profiles-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          syncStateFromDb(stateRef.current.userPersona, currentUserIdRef.current!);
        }
      )
      .subscribe();

    const meetupChannel = supabase
      .channel("db-meetups-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetups" },
        () => {
          syncStateFromDb(stateRef.current.userPersona, currentUserIdRef.current!);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(meetupChannel);
    };
  }, [useDb, currentUserId]);

  // 3. Fallback Local Storage Sync
  useEffect(() => {
    if (isInitialized && !useDb) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isInitialized, useDb]);

  // 4. Fallback Cross-Tab Local Storage Sync
  useEffect(() => {
    if (useDb) return;
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
  }, [useDb]);

  // 5. Timer ticks for local countdown display
  useEffect(() => {
    if (!state.timerStart) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - state.timerStart!) / 1000);
      const remaining = state.timerDuration - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        handleTimeout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state.timerStart, state.timerDuration, state.phase]);

  const handleTimeout = async () => {
    addNotification("Timer Expired", "The action timed out.", "system");

    if (useDb && currentUserId) {
      // Find active meetup and mark it cancelled
      const { data: meetup } = await supabase
        .from("meetups")
        .select("id, status, chosen_id")
        .in("status", ["proposed", "negotiating"])
        .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (meetup) {
        await supabase
          .from("meetups")
          .update({ status: "cancelled" })
          .eq("id", meetup.id);

        if (state.phase === "deciding") {
          // Ban the chosen user if they failed to decide in 15 mins
          const nextDay = new Date();
          nextDay.setHours(9, 0, 0, 0);
          if (nextDay.getTime() <= Date.now()) {
            nextDay.setDate(nextDay.getDate() + 1);
          }
          await supabase
            .from("profiles")
            .update({ banned_until: nextDay.toISOString() })
            .eq("id", meetup.chosen_id);
        }
      }

      // Reset profile role
      await supabase
        .from("profiles")
        .update({ role: "idle", is_locked: false, locked_by: null })
        .eq("id", currentUserId);

      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

    // Local Storage Fallback
    if (state.phase === "browsing" || state.phase === "proposing") {
      setState((prev) => ({
        ...prev,
        phase: "idle",
        timerStart: null,
        lockedUser: null,
        lockExpiresAt: null,
      }));
    } else if (state.phase === "deciding" || state.phase === "negotiating") {
      setState((prev) => {
        const nextBans = { ...(prev?.bans || {}) };
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

  const addNotification = async (title: string, body: string, type: "sms" | "push" | "system" = "system") => {
    if (useDb && currentUserId) {
      await supabase.from("notifications").insert({
        profile_id: currentUserId,
        title,
        body,
        type,
      });
      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

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

  const setPersona = async (userPersona: UserPersona) => {
    if (useDb) {
      await handleAuthPersona(userPersona);
      return;
    }

    setState((prev) => ({ ...prev, userPersona }));
  };

  const setRole = async (persona: UserPersona, role: "chooser" | "chosen" | "idle") => {
    if (role !== "idle" && state?.bans?.[persona]) {
      addNotification("Blocked", "You are currently on cooldown until 9:00 AM.", "system");
      return;
    }

    if (useDb) {
      // Find UUID of persona
      const { data: targetUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("full_name", persona.charAt(0).toUpperCase() + persona.slice(1))
        .maybeSingle();

      if (targetUser) {
        await supabase
          .from("profiles")
          .update({ role, updated_at: new Date().toISOString() })
          .eq("id", targetUser.id);
      }

      await syncStateFromDb(state.userPersona, currentUserId!);
      addNotification("Role Selection", `${persona.toUpperCase()} selected role: ${role.toUpperCase()}`, "system");
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
        if (persona === "charlotte" && prev?.phase === "idle") {
          // wait
        }
      } else {
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

  const setMode = async (currentMode: "dating" | "networking" | "interests") => {
    if (useDb && currentUserId) {
      await supabase
        .from("profiles")
        .update({ current_mode: currentMode })
        .eq("id", currentUserId);
      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

    setState((prev) => ({ ...prev, currentMode }));
  };

  const startBrowsing = async () => {
    if (state?.bans?.[state?.userPersona || "james"]) {
      addNotification("Blocked", "You are currently on cooldown until 9:00 AM.", "system");
      return;
    }

    if (useDb && currentUserId) {
      await supabase
        .from("profiles")
        .update({ role: "chooser" })
        .eq("id", currentUserId);
      await syncStateFromDb(state.userPersona, currentUserId);
      addNotification("Matching Started", "Browse matching profiles. You have 15 minutes to choose.", "push");
      return;
    }

    setState((prev) => ({
      ...prev,
      phase: "browsing",
      activeChooser: (prev?.userPersona || "james") === "james" ? "james" : "charlotte",
      activeChosen: null,
      timerStart: Date.now(),
      timerDuration: 900,
    }));
    addNotification("Matching Started", "Browse matching profiles. You have 15 minutes to choose.", "push");
  };

  const lockProfile = async (profileName: string) => {
    const nameLower = profileName.toLowerCase();

    if (useDb && currentUserId) {
      // Find lock target profile UUID
      const { data: target } = await supabase
        .from("profiles")
        .select("id")
        .eq("full_name", profileName)
        .maybeSingle();

      if (target) {
        await supabase
          .from("profiles")
          .update({
            is_locked: true,
            locked_by: currentUserId,
            lock_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          })
          .eq("id", target.id);
      }
      await syncStateFromDb(state.userPersona, currentUserId);
      addNotification("Lock Active", `${profileName} is currently being considered by James.`, "system");
      return;
    }

    setState((prev) => ({
      ...prev,
      lockedUser: nameLower,
      lockExpiresAt: Date.now() + 15 * 60 * 1000,
    }));
    addNotification("Lock Active", `${profileName} is currently being considered by James.`, "system");
  };

  const releaseProfile = async () => {
    if (useDb && currentUserId) {
      // Release any profile locked by current user
      await supabase
        .from("profiles")
        .update({
          is_locked: false,
          locked_by: null,
          lock_expires_at: null,
        })
        .eq("locked_by", currentUserId);

      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

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

  const chooseProfile = async (profileName: string) => {
    const nameLower = profileName.toLowerCase();

    if (useDb && currentUserId) {
      // Choosing local client state is persistent until proposals submitted
      setState((prev) => ({
        ...prev,
        phase: "proposing",
        activeChosen: nameLower,
        timerStart: Date.now(),
        timerDuration: 900,
      }));
      addNotification("Selected " + profileName, `Propose 3 meetup options for ${profileName}.`, "push");
      return;
    }

    setState((prev) => ({
      ...prev,
      phase: "proposing",
      activeChosen: nameLower,
      timerStart: Date.now(),
      timerDuration: 900,
    }));
    addNotification("Selected " + profileName, `Propose 3 meetup options for ${profileName}.`, "push");
  };

  const submitProposals = async (options: MeetupOption[]): Promise<boolean> => {
    if (useDb && currentUserId && state.activeChosen) {
      try {
        // Find chosen user UUID
        const { data: chosenUser, error: chooseError } = await supabase
          .from("profiles")
          .select("id")
          .eq("full_name", state.activeChosen.charAt(0).toUpperCase() + state.activeChosen.slice(1))
          .maybeSingle();

        if (chooseError || !chosenUser) {
          console.error("Error finding chosen user:", chooseError);
          return false;
        }

        // Insert active meetup
        const { error: insertError } = await supabase.from("meetups").insert({
          chooser_id: currentUserId,
          chosen_id: chosenUser.id,
          status: "proposed",
          options,
          verification_code: "0035",
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });

        if (insertError) {
          console.error("Error inserting meetup:", insertError);
          return false;
        }

        // Add notifications
        const { error: notifError } = await supabase.from("notifications").insert([
          {
            profile_id: currentUserId,
            title: "Options Sent",
            body: "Proposals sent to Charlotte. She has 15 minutes to respond.",
            type: "push",
          },
          {
            profile_id: chosenUser.id,
            title: "Meetup Proposal Received",
            body: "James proposed 3 meetups! Review options on your home screen.",
            type: "sms",
          },
        ]);
        if (notifError) {
          console.error("Error inserting notifications:", notifError);
        }
      } catch (e) {
        console.error("Exception in submitProposals:", e);
        return false;
      }

      await syncStateFromDb(state.userPersona, currentUserId);
      return true;
    }

    setState((prev) => ({
      ...prev,
      phase: "deciding",
      proposals: options,
      timerStart: Date.now(),
      timerDuration: 900,
    }));
    addNotification("Options Sent", "Proposals sent to Charlotte. She has 15 minutes to respond.", "push");
    addNotification("Meetup Proposal Received", "James proposed 3 meetups! Review options on your home screen.", "sms");
    return true;
  };

  const acceptProposal = async (optionIndex: number) => {
    if (useDb && currentUserId) {
      const { data: activeMeetup } = await supabase
        .from("meetups")
        .select("id, chooser_id, chosen_id")
        .in("status", ["proposed", "negotiating"])
        .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeMeetup) {
        await supabase
          .from("meetups")
          .update({
            status: "confirmed",
            selected_option_index: optionIndex,
            expires_at: null, // confirmed meetups don't timeout
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", activeMeetup.id);

        const peerId = activeMeetup.chooser_id === currentUserId ? activeMeetup.chosen_id : activeMeetup.chooser_id;

        await supabase.from("notifications").insert([
          { profile_id: currentUserId, title: "Meetup Confirmed", body: `Meetup confirmed at ${state.proposals[optionIndex].location} on ${state.proposals[optionIndex].time}!`, type: "push" },
          { profile_id: peerId, title: "Meetup Confirmed", body: `Meetup confirmed at ${state.proposals[optionIndex].location} on ${state.proposals[optionIndex].time}!`, type: "sms" },
        ]);
      }

      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

    setState((prev) => ({
      ...prev,
      phase: "confirmed",
      selectedOptionIndex: optionIndex,
      timerStart: null,
      codeAttempts: 0,
      emergencyAlert: false,
    }));
    addNotification("Meetup Confirmed", `Meetup confirmed at ${state.proposals[optionIndex].location} on ${state.proposals[optionIndex].time}!`, "push");
    addNotification("Meetup Confirmed", `Meetup confirmed at ${state.proposals[optionIndex].location} on ${state.proposals[optionIndex].time}!`, "sms");
  };

  const editProposal = async (optionIndex: number, newTime: string): Promise<boolean> => {
    const updatedOption = {
      ...state.proposals[optionIndex],
      time: newTime,
    };

    if (useDb && currentUserId) {
      try {
        const { data: activeMeetup, error: fetchError } = await supabase
          .from("meetups")
          .select("id, chooser_id, chosen_id")
          .in("status", ["proposed"])
          .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError || !activeMeetup) {
          console.error("Error fetching active meetup for edit:", fetchError);
          return false;
        }

        const { error: updateError } = await supabase
          .from("meetups")
          .update({
            status: "negotiating",
            selected_option_index: optionIndex,
            edited_proposal: updatedOption,
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          })
          .eq("id", activeMeetup.id);

        if (updateError) {
          console.error("Error updating meetup for edit:", updateError);
          return false;
        }

        const peerId = activeMeetup.chooser_id === currentUserId ? activeMeetup.chosen_id : activeMeetup.chooser_id;

        const { error: notifError } = await supabase.from("notifications").insert([
          { profile_id: currentUserId, title: "Edit Proposed", body: `You suggested editing the time of Option ${optionIndex + 1} to ${newTime}.`, type: "push" },
          { profile_id: peerId, title: "Charlotte suggested a change", body: `Charlotte suggested changing the time of ${state.proposals[optionIndex].location} to ${newTime}.`, type: "sms" },
        ]);
        if (notifError) {
          console.error("Error inserting notifications for edit:", notifError);
        }
      } catch (e) {
        console.error("Exception in editProposal:", e);
        return false;
      }

      await syncStateFromDb(state.userPersona, currentUserId);
      return true;
    }

    setState((prev) => ({
      ...prev,
      phase: "negotiating",
      selectedOptionIndex: optionIndex,
      editedProposal: updatedOption,
      timerStart: Date.now(),
      timerDuration: 900,
    }));
    addNotification("Edit Proposed", `You suggested editing the time of Option ${optionIndex + 1} to ${newTime}.`, "push");
    addNotification("Charlotte suggested a change", `Charlotte suggested changing the time of ${state.proposals[optionIndex].location} to ${newTime}.`, "sms");
    return true;
  };

  const handleEditResponse = async (accept: boolean) => {
    if (useDb && currentUserId) {
      const { data: activeMeetup } = await supabase
        .from("meetups")
        .select("id, chooser_id, chosen_id, selected_option_index, options, edited_proposal")
        .eq("status", "negotiating")
        .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeMeetup) {
        const peerId = activeMeetup.chooser_id === currentUserId ? activeMeetup.chosen_id : activeMeetup.chooser_id;

        if (accept && activeMeetup.edited_proposal && activeMeetup.selected_option_index !== null) {
          const updatedProposals = [...activeMeetup.options];
          updatedProposals[activeMeetup.selected_option_index] = activeMeetup.edited_proposal;

          await supabase
            .from("meetups")
            .update({
              status: "confirmed",
              options: updatedProposals,
              edited_proposal: null,
              expires_at: null,
            })
            .eq("id", activeMeetup.id);

          await supabase.from("notifications").insert([
            { profile_id: currentUserId, title: "Edit Accepted", body: "James accepted the time change! Meetup is confirmed.", type: "push" },
            { profile_id: peerId, title: "Edit Accepted", body: "James accepted the time change! Meetup is confirmed.", type: "sms" },
          ]);
        } else {
          // Decline cancels meetup
          await supabase
            .from("meetups")
            .update({ status: "cancelled", edited_proposal: null })
            .eq("id", activeMeetup.id);

          await supabase
            .from("profiles")
            .update({ role: "idle" })
            .in("id", [activeMeetup.chooser_id, activeMeetup.chosen_id]);

          await supabase.from("notifications").insert([
            { profile_id: currentUserId, title: "Edit Declined", body: "James declined the time change. Match flow cancelled.", type: "push" },
            { profile_id: peerId, title: "Edit Declined", body: "James declined the time change. Match flow cancelled.", type: "sms" },
          ]);
        }
      }

      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

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
      setState((prev) => ({
        ...prev,
        phase: "idle",
        timerStart: null,
        lockedUser: null,
        editedProposal: null,
        selectedOptionIndex: null,
      }));
      addNotification("Edit Declined", "James declined the time change. Match flow cancelled.", "push");
      addNotification("Edit Declined", "James declined the time change. Match flow cancelled.", "sms");
    }
  };

  const declineProposal = async () => {
    const nextDay = new Date();
    nextDay.setHours(9, 0, 0, 0);
    if (nextDay.getTime() <= Date.now()) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    if (useDb && currentUserId) {
      const { data: activeMeetup } = await supabase
        .from("meetups")
        .select("id, chooser_id, chosen_id")
        .in("status", ["proposed", "negotiating"])
        .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeMeetup) {
        await supabase
          .from("meetups")
          .update({ status: "cancelled" })
          .eq("id", activeMeetup.id);

        const peerId = activeMeetup.chooser_id === currentUserId ? activeMeetup.chosen_id : activeMeetup.chooser_id;

        // Ban the chosen user (Charlotte) for declining
        const chosenId = activeMeetup.chosen_id;
        await supabase
          .from("profiles")
          .update({ banned_until: nextDay.toISOString(), role: "idle" })
          .eq("id", chosenId);

        await supabase
          .from("profiles")
          .update({ role: "idle" })
          .eq("id", activeMeetup.chooser_id);

        await supabase.from("notifications").insert([
          { profile_id: chosenId, title: "Proposal Declined", body: "Charlotte declined the invitation and is suspended for 24h.", type: "push" },
          { profile_id: peerId, title: "Meetup Cancelled", body: "Charlotte declined your proposal. Matching restarted.", type: "sms" },
        ]);
      }

      await syncStateFromDb(state.userPersona, currentUserId);
      return;
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
    // HELP Panic SMS Alert trigger
    if (code === "4357") {
      if (useDb && currentUserId) {
        const triggerHelp = async () => {
          const { data: activeMeetup } = await supabase
            .from("meetups")
            .select("id, selected_option_index, options")
            .eq("status", "confirmed")
            .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeMeetup) {
            const loc = activeMeetup.options[activeMeetup.selected_option_index ?? 0]?.location ?? "Local Venue";
            await supabase
              .from("meetups")
              .update({
                emergency_alert: true,
                emergency_alert_details: { time: new Date().toLocaleString(), location: loc },
              })
              .eq("id", activeMeetup.id);

            await supabase.from("notifications").insert({
              profile_id: currentUserId,
              title: "EMERGENCY ALERT",
              body: `HELP alert triggered! Location sent to emergency contact (${state.emergencyContact.name}): ${loc}`,
              type: "sms",
            });
          }
          await syncStateFromDb(state.userPersona, currentUserId);
        };
        triggerHelp();
      } else {
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
      }
      return "help";
    }

    if (code === state.verificationCode) {
      if (useDb && currentUserId) {
        const confirmCode = async () => {
          const { data: activeMeetup } = await supabase
            .from("meetups")
            .select("id")
            .eq("status", "confirmed")
            .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeMeetup) {
            await supabase
              .from("meetups")
              .update({ status: "completed" })
              .eq("id", activeMeetup.id);

            await supabase.from("notifications").insert({
              profile_id: currentUserId,
              title: "Code Verified",
              body: "Date verified! Enjoy your meetup.",
              type: "push",
            });
          }
          await syncStateFromDb(state.userPersona, currentUserId);
        };
        confirmCode();
      } else {
        setState((prev) => ({
          ...prev,
          phase: "post_meetup",
        }));
        addNotification("Code Verified", "Date verified! Enjoy your meetup.", "push");
      }
      return "success";
    }

    // Wrong verification code attempts
    const nextAttempts = state.codeAttempts + 1;
    if (nextAttempts >= 5) {
      const nextDay = new Date();
      nextDay.setHours(9, 0, 0, 0);
      if (nextDay.getTime() <= Date.now()) {
        nextDay.setDate(nextDay.getDate() + 1);
      }

      if (useDb && currentUserId) {
        const failCode = async () => {
          const { data: activeMeetup } = await supabase
            .from("meetups")
            .select("id, chooser_id, chosen_id")
            .eq("status", "confirmed")
            .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeMeetup) {
            // Cancel meetup
            await supabase
              .from("meetups")
              .update({ status: "cancelled", code_attempts: nextAttempts })
              .eq("id", activeMeetup.id);

            // Increment flags and issue 24h ban for both profiles
            for (const uid of [activeMeetup.chooser_id, activeMeetup.chosen_id]) {
              const { data: prof } = await supabase.from("profiles").select("flags_count").eq("id", uid).single();
              const fCount = (prof?.flags_count || 0) + 1;
              await supabase
                .from("profiles")
                .update({ banned_until: nextDay.toISOString(), flags_count: fCount, role: "idle" })
                .eq("id", uid);

              await supabase.from("notifications").insert({
                profile_id: uid,
                title: "Meetup Cancelled",
                body: "5 failed code verification attempts. Both accounts suspended for 24h.",
                type: "push",
              });
            }
          }
          await syncStateFromDb(state.userPersona, currentUserId);
        };
        failCode();
      } else {
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
      }
      return "fail";
    }

    if (useDb && currentUserId) {
      const incrementAttempts = async () => {
        const { data: activeMeetup } = await supabase
          .from("meetups")
          .select("id")
          .eq("status", "confirmed")
          .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeMeetup) {
          await supabase
            .from("meetups")
            .update({ code_attempts: nextAttempts })
            .eq("id", activeMeetup.id);
        }
        await syncStateFromDb(state.userPersona, currentUserId);
      };
      incrementAttempts();
    } else {
      setState((prev) => ({
        ...prev,
        codeAttempts: nextAttempts,
      }));
    }
    return "fail";
  };

  const reportNoShow = async (reporter: string) => {
    const offender = reporter === "james" ? (state.activeChosen || "charlotte") : "james";
    const nextDay = new Date();
    nextDay.setHours(9, 0, 0, 0);
    if (nextDay.getTime() <= Date.now()) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    if (useDb && currentUserId) {
      const { data: activeMeetup } = await supabase
        .from("meetups")
        .select("id, chooser_id, chosen_id")
        .eq("status", "confirmed")
        .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeMeetup) {
        // Mark as no_show
        await supabase
          .from("meetups")
          .update({ status: "no_show" })
          .eq("id", activeMeetup.id);

        const offenderId = activeMeetup.chooser_id === currentUserId ? activeMeetup.chosen_id : activeMeetup.chooser_id;

        // Ban and flag offender
        const { data: offenderProf } = await supabase.from("profiles").select("flags_count").eq("id", offenderId).single();
        const fCount = (offenderProf?.flags_count || 0) + 1;
        await supabase
          .from("profiles")
          .update({ banned_until: nextDay.toISOString(), flags_count: fCount, role: "idle" })
          .eq("id", offenderId);

        // Reset reporter role
        await supabase
          .from("profiles")
          .update({ role: "idle" })
          .eq("id", currentUserId);

        const offenderName = offender === "james" ? "James" : (offender.charAt(0).toUpperCase() + offender.slice(1));
        await supabase.from("notifications").insert([
          { profile_id: currentUserId, title: "No-Show Reported", body: `${offenderName} was marked as a no-show. Suspended for 24h.`, type: "push" },
          { profile_id: offenderId, title: "No-Show Reported", body: `${offenderName} was marked as a no-show. Suspended for 24h.`, type: "sms" },
        ]);
      }

      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

    setState((prev) => {
      const nextBans = { ...(prev?.bans || {}) };
      nextBans[offender] = nextDay.toISOString();

      const nextFlags = { ...(prev?.flags || {}) };
      nextFlags[offender] = (nextFlags[offender] ?? 0) + 1;

      const offenderNameCapitalized = offender === "james" ? "James" : (offender.charAt(0).toUpperCase() + offender.slice(1));

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
    addNotification("No-Show Reported", `${offenderName} was marked as a no-show. Suspended for 24h.`, "push");
    addNotification("No-Show Reported", `${offenderName} was marked as a no-show. Suspended for 24h.`, "sms");
  };

  const submitPostMeetupFeedback = async (user: string, optIn: boolean) => {
    const nextDay = new Date();
    nextDay.setHours(9, 0, 0, 0);
    if (nextDay.getTime() <= Date.now()) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    if (useDb && currentUserId) {
      // Complete user session, lock out until 9am tomorrow
      await supabase
        .from("profiles")
        .update({
          last_meetup_at: new Date().toISOString(),
          banned_until: nextDay.toISOString(),
          role: "idle",
        })
        .eq("id", currentUserId);

      // Add to contactable list if opt-in is successful (simulate peer mutual match logic)
      if (optIn && state.activeChosen) {
        // Simple client-side mock tracking in list
        const peer = state.activeChosen.charAt(0).toUpperCase() + state.activeChosen.slice(1);
        setState((prev) => {
          const next = [...(prev?.contactableList || [])];
          if (!next.includes(peer)) next.push(peer);
          return { ...prev, contactableList: next };
        });
      }

      await supabase.from("notifications").insert({
        profile_id: currentUserId,
        title: "Feedback Submitted",
        body: "Thank you for your feedback! Match flow locked until 9:00 AM tomorrow.",
        type: "push",
      });

      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

    setState((prev) => {
      const peerName = prev?.activeChosen ? (prev.activeChosen.charAt(0).toUpperCase() + prev.activeChosen.slice(1)) : "Charlotte";
      const peer = user === "james" ? peerName : "James";

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

      const nextBans = { ...(prev?.bans || {}) };
      nextBans[user] = nextDay.toISOString();

      return {
        ...prev,
        phase: "idle",
        meetupHistory: [newHistoryItem, ...(prev?.meetupHistory || [])],
        contactableList: nextContactable,
        bans: nextBans,
        selectedOptionIndex: null,
      };
    });

    addNotification("Feedback Submitted", "Thank you for your feedback! Match flow locked until 9:00 AM tomorrow.", "push");
  };

  const resetApp = async () => {
    if (useDb && currentUserId) {
      // Clear current meetups, reset roles
      await supabase
        .from("meetups")
        .update({ status: "cancelled" })
        .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
        .in("status", ["proposed", "negotiating", "confirmed"]);

      await supabase
        .from("profiles")
        .update({
          role: "idle",
          banned_until: null,
          is_locked: false,
          locked_by: null,
          flags_count: 0,
        })
        .eq("id", currentUserId);

      // Clean notifications
      await supabase.from("notifications").delete().eq("profile_id", currentUserId);

      await syncStateFromDb(state.userPersona, currentUserId);
      addNotification("App Reset", "Simulated system has been reset to defaults.", "system");
      return;
    }

    setState(DEFAULT_STATE);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    addNotification("App Reset", "Simulated system has been reset to defaults.", "system");
  };

  const fastForwardTimer = async (seconds: number) => {
    if (useDb && currentUserId) {
      // Find active meetup
      const { data: activeMeetup } = await supabase
        .from("meetups")
        .select("id, expires_at")
        .in("status", ["proposed", "negotiating"])
        .or(`chooser_id.eq.${currentUserId},chosen_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeMeetup && activeMeetup.expires_at) {
        const nextExpiry = new Date(new Date(activeMeetup.expires_at).getTime() - seconds * 1000).toISOString();
        await supabase
          .from("meetups")
          .update({ expires_at: nextExpiry })
          .eq("id", activeMeetup.id);
      }
      await syncStateFromDb(state.userPersona, currentUserId);
      addNotification("Fast Forwarded", `Simulated timer fast-forwarded by ${seconds / 60} minutes.`, "system");
      return;
    }

    setState((prev) => {
      if (!prev?.timerStart) return prev;
      return {
        ...prev,
        timerStart: prev.timerStart - seconds * 1000,
      };
    });
    addNotification("Fast Forwarded", `Simulated timer fast-forwarded by ${seconds / 60} minutes.`, "system");
  };

  const liftCooldown = async () => {
    if (useDb && currentUserId) {
      await supabase
        .from("profiles")
        .update({ banned_until: null });
      await syncStateFromDb(state.userPersona, currentUserId);
      addNotification("Cooldown Lifted", "Simulated 9:00 AM / 24h suspension lifted.", "system");
      return;
    }

    setState((prev) => ({
      ...prev,
      bans: { james: null, charlotte: null, laura: null, sarah: null },
    }));
    addNotification("Cooldown Lifted", "Simulated 9:00 AM / 24h suspension lifted.", "system");
  };

  const adminWarnUser = async (username: string) => {
    const usernameCapitalized = username.charAt(0).toUpperCase() + username.slice(1);
    if (useDb) {
      const { data: target } = await supabase
        .from("profiles")
        .select("id, flags_count")
        .eq("full_name", usernameCapitalized)
        .maybeSingle();

      if (target) {
        await supabase
          .from("profiles")
          .update({ flags_count: (target.flags_count || 0) + 1 })
          .eq("id", target.id);

        await supabase.from("notifications").insert({
          profile_id: target.id,
          title: "Admin Warning",
          body: "You have received a formal warning from system moderation.",
          type: "push",
        });
      }
      await syncStateFromDb(state.userPersona, currentUserId!);
      addNotification("Admin Action", `Warning issued to user: ${username}`, "system");
      return;
    }

    addNotification("Admin Action", `Warning issued to user: ${username}`, "system");
  };

  const adminBanUser = async (username: string) => {
    const usernameCapitalized = username.charAt(0).toUpperCase() + username.slice(1);
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    if (useDb) {
      const { data: target } = await supabase
        .from("profiles")
        .select("id")
        .eq("full_name", usernameCapitalized)
        .maybeSingle();

      if (target) {
        await supabase
          .from("profiles")
          .update({ banned_until: nextDay.toISOString(), role: "idle" })
          .eq("id", target.id);
      }
      await syncStateFromDb(state.userPersona, currentUserId!);
      addNotification("Admin Action", `Suspended user: ${username}`, "system");
      return;
    }

    setState((prev) => {
      const nextBans = { ...(prev?.bans || {}) };
      nextBans[username] = nextDay.toISOString();
      return { ...prev, bans: nextBans };
    });
    addNotification("Admin Action", `Suspended user: ${username}`, "system");
  };

  const adminUnbanUser = async (username: string) => {
    const usernameCapitalized = username.charAt(0).toUpperCase() + username.slice(1);

    if (useDb) {
      const { data: target } = await supabase
        .from("profiles")
        .select("id")
        .eq("full_name", usernameCapitalized)
        .maybeSingle();

      if (target) {
        await supabase
          .from("profiles")
          .update({ banned_until: null })
          .eq("id", target.id);
      }
      await syncStateFromDb(state.userPersona, currentUserId!);
      addNotification("Admin Action", `Lifting ban on user: ${username}`, "system");
      return;
    }

    setState((prev) => {
      const nextBans = { ...(prev?.bans || {}) };
      nextBans[username] = null;
      return { ...prev, bans: nextBans };
    });
    addNotification("Admin Action", `Lifting ban on user: ${username}`, "system");
  };

  const addFastTrackInvite = async (name: string) => {
    if (useDb && currentUserId) {
      const nameCapitalized = name.charAt(0).toUpperCase() + name.slice(1);
      const { data: chosenUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("full_name", nameCapitalized)
        .maybeSingle();

      if (chosenUser) {
        // Start proposing proposals directly
        await supabase.from("meetups").insert({
          chooser_id: currentUserId,
          chosen_id: chosenUser.id,
          status: "proposed",
          options: [
            { time: "Today at 7:00 PM", location: "Retro Cafe" },
            { time: "Tomorrow at 8:30 PM", location: "The Beanery" },
            { time: "Saturday at 2:00 PM", location: "Cuppa & Co" },
          ],
          verification_code: "0035",
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      }
      await syncStateFromDb(state.userPersona, currentUserId);
      addNotification("Fast-track Invitation", `Proposing meetup options directly to ${name}.`, "push");
      return;
    }

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

  const updateSafetySettings = async (
    emergencyContact: { name: string; phone: string },
    notifyPref: "push" | "sms" | "both"
  ) => {
    if (useDb && currentUserId) {
      await supabase
        .from("profiles")
        .update({
          emergency_contact_name: emergencyContact.name,
          emergency_contact_phone: emergencyContact.phone,
          notify_pref: notifyPref,
        })
        .eq("id", currentUserId);

      await syncStateFromDb(state.userPersona, currentUserId);
      return;
    }

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
