"use client";

import { useState } from "react";
import Link from "next/link";
import { TabBar } from "@/components/layout/TabBar";

type Role = "chooser" | "chosen" | null;

export default function Home() {
  const [selected, setSelected] = useState<Role>(null);

  return (
    <div className="h-dvh bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-16 pb-4">

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
            <span className="text-4xl">👤</span>
          </div>
        </div>

        {/* Greeting */}
        <h1 className="text-2xl font-bold text-center mb-1">Hey James</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Select a role for your next meetup
        </p>

        {/* Role cards */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSelected("chooser")}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-colors"
            style={{
              borderColor: selected === "chooser" ? "var(--color-primary)" : "var(--color-border)",
              background: "var(--color-background)",
            }}
          >
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0 text-3xl">
              🫵
            </div>
            <div>
              <p className="font-semibold text-base leading-snug">Be a Chooser</p>
              <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                Be the one that chooses someone to meet
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelected("chosen")}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-colors"
            style={{
              borderColor: selected === "chosen" ? "var(--color-primary)" : "var(--color-border)",
              background: "var(--color-background)",
            }}
          >
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0 text-3xl">
              🪑
            </div>
            <div>
              <p className="font-semibold text-base leading-snug">Be Chosen</p>
              <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                Sit back and wait for someone to choose you
              </p>
            </div>
          </button>
        </div>

        {/* CTA */}
        {selected && (
          <Link
            href={selected === "chooser" ? "/browse" : "/waiting"}
            className="mt-6 flex items-center justify-center h-12 w-full rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            {selected === "chooser" ? "Choose someone to meet" : "Start waiting"}
          </Link>
        )}
      </main>

      <TabBar />
    </div>
  );
}
