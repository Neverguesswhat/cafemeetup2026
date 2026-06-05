import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Cafe Meetup</h1>
        <p className="text-sm text-muted-foreground">Prototype screens</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Link
          href="/profile"
          className="inline-flex h-11 w-full items-center justify-between rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <span>Profile Setup</span>
          <span>→</span>
        </Link>
        <Link
          href="/browse"
          className="inline-flex h-11 w-full items-center justify-between rounded-md bg-secondary px-5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <span>Browse Profiles (Chooser)</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
