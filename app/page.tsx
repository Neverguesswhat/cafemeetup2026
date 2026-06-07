import Link from "next/link";
import { TabBar } from "@/components/layout/TabBar";

export default function Home() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col">
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

        {/* Role cards — plain links, no JS state needed */}
        <div className="flex flex-col gap-3">
          <Link
            href="/browse"
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-background text-left active:border-primary active:bg-muted transition-colors"
          >
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0 text-3xl">
              🫵
            </div>
            <div>
              <p className="font-semibold text-base leading-snug text-foreground">Be a Chooser</p>
              <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                Be the one that chooses someone to meet
              </p>
            </div>
          </Link>

          <Link
            href="/waiting"
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-background text-left active:border-primary active:bg-muted transition-colors"
          >
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0 text-3xl">
              🪑
            </div>
            <div>
              <p className="font-semibold text-base leading-snug text-foreground">Be Chosen</p>
              <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                Sit back and wait for someone to choose you
              </p>
            </div>
          </Link>
        </div>
      </main>

      <TabBar />
    </div>
  );
}
