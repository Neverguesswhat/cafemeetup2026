-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table: Handles roles, locking, and cooldowns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('chooser', 'chosen', 'idle')) DEFAULT 'idle',
    current_mode TEXT CHECK (current_mode IN ('dating', 'networking', 'interests')) DEFAULT 'dating',
    
    -- Exclusivity Lock: Prevents Charlotte from being browsed by two Jameses at once
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by UUID REFERENCES public.profiles(id),
    lock_expires_at TIMESTAMPTZ,
    
    -- Cooldown & Reputation Logic
    flags_count INT DEFAULT 0,
    last_meetup_at TIMESTAMPTZ,
    last_reset_at TIMESTAMPTZ DEFAULT (CURRENT_DATE + TIME '09:00:00'),
    emergency_contact_phone TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Meetups Table: The Core State Machine
CREATE TABLE IF NOT EXISTS public.meetups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chooser_id UUID REFERENCES public.profiles(id) NOT NULL,
    chosen_id UUID REFERENCES public.profiles(id) NOT NULL,
    
    -- Transitions: proposed -> negotiating -> confirmed -> completed/no_show
    status TEXT CHECK (status IN ('proposed', 'negotiating', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'proposed',
    
    -- Proposer's 3 Options: {time: string, location: string, address: string}
    options JSONB NOT NULL, 
    selected_option_index INT CHECK (selected_option_index IN (0, 1, 2)),
    
    -- The Verification Code (e.g., '0035' or '4357' for HELP)
    verification_code CHAR(4) NOT NULL,
    
    -- Timing: Each step has a 15-minute window
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all (for matching) but only update their own
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Meetups: Only the chooser or chosen can see/edit the meetup
CREATE POLICY "Participants can view their own meetups." 
    ON public.meetups FOR SELECT 
    USING (auth.uid() = chooser_id OR auth.uid() = chosen_id);

CREATE POLICY "Participants can update their own meetups." 
    ON public.meetups FOR UPDATE 
    USING (auth.uid() = chooser_id OR auth.uid() = chosen_id);