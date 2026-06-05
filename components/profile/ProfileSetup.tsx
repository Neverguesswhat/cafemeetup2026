"use client";

import { useState } from "react";
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

export function ProfileSetup() {
  const [step, setStep] = useState(0);

  const [photos] = useState([
    { id: 1, filled: true },
    { id: 2, filled: false },
    { id: 3, filled: false },
    { id: 4, filled: false },
    { id: 5, filled: false },
    { id: 6, filled: false },
  ]);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [job, setJob] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>(["Live music", "Hiking"]);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [notifyPref, setNotifyPref] = useState("");

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

  const titles = ["Your photos", "About you", "Your interests", "Stay safe"];
  const subtitles = ["Step 1 of 4", "Step 2 of 4", "Step 3 of 4", "Step 4 of 4"];

  return (
    <div className="px-4 pt-14 pb-8">
      <h1 className="text-2xl font-bold mb-0.5">{titles[step]}</h1>
      <p className="text-sm text-muted-foreground mb-4">{subtitles[step]}</p>

      <StepIndicator current={step} />
      <CuppaGuide message={CUPPA_MESSAGES[step]} />

      {step === 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className={`aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden
                ${photo.filled ? "bg-muted" : "bg-background border-2 border-dashed border-border"}`}
            >
              {photo.filled ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl text-muted-foreground">+</span>
                  {i === 0 && <span className="text-[10px] text-muted-foreground">Main photo</span>}
                </div>
              )}
              {photo.filled && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>First name</Label>
            <Input placeholder="e.g. James" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Age</Label>
            <Select onValueChange={(v: string | null) => setAge(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select your age" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 52 }, (_, i) => i + 18).map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>What do you do?</Label>
            <Input placeholder="e.g. Veterinarian at AHS" value={job} onChange={(e) => setJob(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              Bio <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              placeholder="A sentence or two about you…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={150}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/150</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{interests.length}/8 selected</span>
            {interests.length === 8 && (
              <span className="text-xs text-primary font-medium">Max reached</span>
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

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 mb-2 bg-muted border border-border">
            <p className="text-sm leading-snug">
              <span className="font-semibold">Why this matters.</span>{" "}
              If you enter the code{" "}
              <span className="font-mono font-bold text-destructive">4357</span>{" "}
              (HELP) at a meetup, your contact will instantly receive your location via SMS.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Emergency contact name</Label>
            <Input
              placeholder="e.g. Sarah Smith"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Their phone number</Label>
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              They don't need the app. They'll receive a text from us.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notify me via</Label>
            <Select onValueChange={(v: string | null) => setNotifyPref(v || "")}>
              <SelectTrigger>
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

      <div className="flex gap-3 mt-8 pb-[env(safe-area-inset-bottom,16px)]">
        {step > 0 && (
          <button
            type="button"
            className="flex-1 h-12 rounded-lg border border-border bg-background text-sm font-medium"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className={`flex-1 h-12 rounded-lg text-sm font-medium transition-opacity
            ${canAdvance()
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground opacity-50 pointer-events-none"
            }`}
          onClick={() => { if (canAdvance() && step < 3) setStep((s) => s + 1); }}
        >
          {step === 3 ? "All done" : "Continue"}
        </button>
      </div>
    </div>
  );
}
