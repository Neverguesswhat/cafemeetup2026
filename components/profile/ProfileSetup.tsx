"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CuppaGuide } from "./CuppaGuide";
import { StepIndicator } from "./StepIndicator";
import { InterestChip } from "./InterestChip";

const ALL_INTERESTS = [
  "Coffee", "Live music", "Hiking", "Board games", "Dogs", "Reading",
  "Rooftop bars", "Restaurants", "Movies", "Painting", "Yoga", "Travel",
  "Cooking", "Cycling", "Photography", "Wine", "Theatre", "Running",
  "Art galleries", "Farmers markets",
];

const CUPPA_MESSAGES = [
  "Let's start with your photos. Add at least one clear photo of your face — this is what people will see first.",
  "Great! Now tell people a bit about yourself. Keep it honest, keep it you.",
  "What are you into? Choose up to 8 interests. These help me match you with people who share your vibe.",
  "Almost done. Set up a safety contact — someone who'll be notified if you ever need help on a meetup.",
];

interface PhotoSlot {
  id: number;
  filled: boolean;
}

export function ProfileSetup() {
  const [step, setStep] = useState(0);

  // Step 0 — Photos
  const [photos] = useState<PhotoSlot[]>([
    { id: 1, filled: true },
    { id: 2, filled: false },
    { id: 3, filled: false },
    { id: 4, filled: false },
    { id: 5, filled: false },
    { id: 6, filled: false },
  ]);

  // Step 1 — Basics
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [job, setJob] = useState("");
  const [bio, setBio] = useState("");

  // Step 2 — Interests
  const [interests, setInterests] = useState<string[]>(["Live music", "Hiking"]);

  // Step 3 — Safety
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [notifyPref, setNotifyPref] = useState<string>("");

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label)
        ? prev.filter((i) => i !== label)
        : prev.length < 8
        ? [...prev, label]
        : prev
    );
  }

  function canAdvance() {
    if (step === 0) return photos.some((p) => p.filled);
    if (step === 1) return name.trim() && age && job.trim();
    if (step === 2) return interests.length >= 1;
    if (step === 3) return emergencyName.trim() && emergencyPhone.trim() && notifyPref;
    return false;
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-[22px] font-bold text-[#2b2d31] mb-1">
        {step === 0 && "Your photos"}
        {step === 1 && "About you"}
        {step === 2 && "Your interests"}
        {step === 3 && "Stay safe"}
      </h1>
      <p className="text-sm text-[#787880] mb-4">
        {step === 0 && "Step 1 of 4"}
        {step === 1 && "Step 2 of 4"}
        {step === 2 && "Step 3 of 4"}
        {step === 3 && "Step 4 of 4"}
      </p>

      <StepIndicator current={step} />
      <CuppaGuide message={CUPPA_MESSAGES[step]} />

      {/* STEP 0 — Photos */}
      {step === 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: photo.filled ? "#e6e9e6" : "#f5f5f5",
                border: photo.filled ? "none" : "2px dashed #e6e9e6",
              }}
            >
              {photo.filled ? (
                <div className="w-full h-full bg-gradient-to-br from-[#e6e9e6] to-[#c8ccc8] flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl text-[#c0c0c0]">+</span>
                  {i === 0 && (
                    <span className="text-[10px] text-[#787880]">Main photo</span>
                  )}
                </div>
              )}
              {photo.filled && (
                <div
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ background: "#6227d7" }}
                >
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1 — Basics */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-[#2b2d31]">First name</Label>
            <Input
              placeholder="e.g. James"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-2xl border-[#e6e9e6] bg-[#f9f9f9] text-[#2b2d31] placeholder:text-[#c0c0c0]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-[#2b2d31]">Age</Label>
            <Select onValueChange={(v: string | null) => setAge(v || "")}>
              <SelectTrigger className="h-12 rounded-2xl border-[#e6e9e6] bg-[#f9f9f9] text-[#2b2d31]">
                <SelectValue placeholder="Select your age" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 52 }, (_, i) => i + 18).map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-[#2b2d31]">What do you do?</Label>
            <Input
              placeholder="e.g. Veterinarian at AHS"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className="h-12 rounded-2xl border-[#e6e9e6] bg-[#f9f9f9] text-[#2b2d31] placeholder:text-[#c0c0c0]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-[#2b2d31]">
              Bio <span className="font-normal text-[#787880]">(optional)</span>
            </Label>
            <Textarea
              placeholder="A sentence or two about you…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-2xl border-[#e6e9e6] bg-[#f9f9f9] text-[#2b2d31] placeholder:text-[#c0c0c0] resize-none"
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-[#787880] text-right">{bio.length}/150</p>
          </div>
        </div>
      )}

      {/* STEP 2 — Interests */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#787880]">{interests.length}/8 selected</span>
            {interests.length === 8 && (
              <span className="text-xs text-[#6227d7] font-medium">Max reached</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_INTERESTS.map((interest) => (
              <InterestChip
                key={interest}
                label={interest}
                selected={interests.includes(interest)}
                onToggle={() => toggleInterest(interest)}
              />
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 — Safety */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-4 mb-2"
            style={{ background: "#fff8e6", border: "1px solid #f9dd71" }}
          >
            <p className="text-sm text-[#2b2d31] leading-snug">
              <span className="font-semibold">Why this matters.</span> If you enter the code{" "}
              <span className="font-mono font-bold text-[#c02f33]">4357</span> (HELP) at a meetup,
              your contact will instantly receive your location via SMS.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-[#2b2d31]">Emergency contact name</Label>
            <Input
              placeholder="e.g. Sarah Smith"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              className="h-12 rounded-2xl border-[#e6e9e6] bg-[#f9f9f9] text-[#2b2d31] placeholder:text-[#c0c0c0]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-[#2b2d31]">Their phone number</Label>
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className="h-12 rounded-2xl border-[#e6e9e6] bg-[#f9f9f9] text-[#2b2d31] placeholder:text-[#c0c0c0]"
            />
            <p className="text-xs text-[#787880]">
              They don't need the app. They'll receive a text from us.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-[#2b2d31]">Notify me via</Label>
            <Select onValueChange={(v: string | null) => setNotifyPref(v || "")}>
              <SelectTrigger className="h-12 rounded-2xl border-[#e6e9e6] bg-[#f9f9f9] text-[#2b2d31]">
                <SelectValue placeholder="Choose preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push notifications</SelectItem>
                <SelectItem value="sms">SMS only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-full border-[#e6e9e6] text-[#2b2d31] font-semibold"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        )}
        <Button
          className="flex-1 h-12 rounded-full font-semibold text-white"
          style={{
            background: canAdvance() ? "#6227d7" : "#e6e9e6",
            color: canAdvance() ? "#fff" : "#787880",
            cursor: canAdvance() ? "pointer" : "not-allowed",
          }}
          disabled={!canAdvance()}
          onClick={() => {
            if (step < 3) setStep((s) => s + 1);
          }}
        >
          {step === 3 ? "All done 🎉" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
