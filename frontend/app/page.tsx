import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import RedirectOnSignIn from "@/components/auth/RedirectOnSignIn";
export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
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

      <nav className="liquid-glass relative z-10 mx-auto mt-[max(1.25rem,env(safe-area-inset-top))] flex w-[min(94%,76rem)] items-center justify-between rounded-full border border-border/60 bg-background/45 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div
          className="text-2xl tracking-tight text-foreground sm:text-3xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          SideQuest
        </div>

        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button
              variant="secondary"
              className="group relative h-auto overflow-hidden rounded-full border border-border bg-secondary px-6 py-2 text-sm font-semibold text-foreground transition-all duration-300 hover:scale-[1.03]"
            >
              <span className="relative z-10">Login</span>
            </Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <Link href="/app">
            <Button className="group relative h-auto overflow-hidden rounded-full bg-[#36E2B2] px-6 py-2 text-sm font-semibold text-black shadow-[0_8px_22px_rgb(54_226_178/0.35)] transition-all duration-300 hover:scale-[1.03] hover:ring-2 hover:ring-[#36E2B2] hover:ring-offset-2 hover:ring-offset-black focus-visible:ring-2 focus-visible:ring-[#36E2B2] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              <span className="relative z-10">Go to App</span>
              <span className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover:translate-y-0" />
            </Button>
          </Link>
        </Show>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-90px)] w-[min(94%,76rem)] flex-col items-center justify-center px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-20 text-center sm:px-6 sm:pt-24">
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
