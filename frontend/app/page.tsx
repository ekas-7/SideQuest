import Link from "next/link";
import { Button } from "@/components/ui/button";
import RedirectOnSignIn from "@/components/auth/RedirectOnSignIn";
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <RedirectOnSignIn />

      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source
          src="/hero.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/65 via-background/40 to-background/90" />
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.2),transparent_40%),radial-gradient(circle_at_80%_15%,hsl(var(--foreground)/0.15),transparent_32%)]" />

  <nav className="relative z-10 mx-auto mt-5 flex w-[min(94%,76rem)] items-center justify-between rounded-full border border-border/60 bg-background px-4 py-3 sm:px-6">
        <div
          className="text-2xl tracking-tight text-foreground sm:text-3xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          SideQuest
        </div>

        <div className="hidden items-center gap-7 md:flex">
          <Link className="text-sm text-foreground transition-colors" href="/">
            Home
          </Link>
          <Link
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            href="/app/quests"
          >
            Quests
          </Link>
          <Link
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            href="/app"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            href="/app/verify"
          >
            Verify
          </Link>
        </div>

        <Link href="/app/quests">
          <Button className="h-auto rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground hover:scale-[1.03] sm:px-6">
            Start Quest
          </Button>
        </Link>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-90px)] w-[min(94%,76rem)] flex-col items-center justify-center px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-24">
        <h1
          className="animate-fade-rise max-w-6xl text-5xl leading-[0.95] font-normal tracking-[-1.8px] sm:text-7xl md:text-8xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Turn <em className="not-italic text-foreground/70">real life</em> into
          <br className="hidden sm:block" />
          your <em className="not-italic text-foreground/70">next side quest.</em>
        </h1>

        <p className="animate-fade-rise-delay mt-7 max-w-3xl text-base leading-relaxed text-foreground/80 sm:text-lg">
          Every week, get a random real-world challenge, complete it, upload
          proof, and get verified by the community. Build streaks, earn points,
          and stay consistent with social accountability that makes growth more
          fun, intentional, and shareable.
        </p>
      </main>
    </div>
  );
}
