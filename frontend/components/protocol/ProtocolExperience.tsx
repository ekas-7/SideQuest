"use client";

import { useEffect, useMemo, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import {
  Camera,
  Check,
  Compass,
  EyeOff,
  LogOut,
  Navigation2,
  ShieldCheck,
  Swords,
  UploadCloud,
  User,
  X,
  Zap,
} from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import { ChartContainer, type ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type ViewKey = "dashboard" | "outpost" | "profile";

type Quest = {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  img: string;
  desc: string;
  requirement: string;
};

type VerifyCard = {
  id: number;
  user: string;
  quest: string;
  image: string;
  desc: string;
  time: string;
};

const WEEKLY_OPTIONS: Quest[] = [
  {
    id: 1,
    title: "Cold Satori",
    category: "Physical Mastery",
    difficulty: "Vanguard",
    img: "https://images.unsplash.com/photo-1517030330234-94c4fa948ebc?auto=format&fit=crop&q=80&w=1200",
    desc: "Silence the panic response. Master the initial shock of frozen immersion.",
    requirement: "Complete a 4-minute cold immersion daily. Photo of the timer required.",
  },
  {
    id: 2,
    title: "Scriptorium",
    category: "Mental Fortitude",
    difficulty: "Seeker",
    img: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200",
    desc: "4 hours of uninterrupted deep work. Reclaim the absolute fortress of focus.",
    requirement: "One 4-hour focus session per day. Screenshot of focus timer required.",
  },
  {
    id: 3,
    title: "Midnight Map",
    category: "Urban Spirit",
    difficulty: "Rogue",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200",
    desc: "Explore the architectural silence in the quiet hours. Mapping required.",
    requirement: "10km urban traverse after midnight. GPS map and entry photo required.",
  },
];

const INITIAL_VERIFY_QUEUE: VerifyCard[] = [
  {
    id: 101,
    user: "Kael_Rift",
    quest: "Cold Satori",
    image: "https://images.unsplash.com/photo-1457410129867-5999af49daf7?auto=format&fit=crop&q=80&w=900",
    desc: "Final minute of the plunge. Controlled breathing established.",
    time: "12m ago",
  },
  {
    id: 102,
    user: "Sera_V",
    quest: "Scriptorium",
    image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=900",
    desc: "3.5 hours into the deep work session. Signal is strong.",
    time: "45m ago",
  },
];

const INITIAL_TIMER = 7 * 24 * 60 * 60;

const WEEKLY_ALIGNMENT_STEPS = [
  { label: "W1", status: "complete" },
  { label: "W2", status: "complete" },
  { label: "W3", status: "complete" },
  { label: "W4", status: "complete" },
  { label: "W5", status: "complete" },
  { label: "W6", status: "active" },
  { label: "W7", status: "locked" },
] as const;

function formatTimer(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d.toString().padStart(2, "0")}d ${h.toString().padStart(2, "0")}h ${m
    .toString()
    .padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}

export function ProtocolExperience() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState(false);
  const [notifMessage, setNotifMessage] = useState("Path Committed");
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(INITIAL_TIMER);

  const [verifyQueue, setVerifyQueue] = useState<VerifyCard[]>(INITIAL_VERIFY_QUEUE);
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const stats = { will: 92, focus: 88, grit: 74, adapt: 80, lore: 60 };

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeout = window.setTimeout(() => setNotification(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  useEffect(() => {
    if (!activeQuest) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimerSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeQuest]);

  const timerDisplay = useMemo(() => formatTimer(timerSeconds), [timerSeconds]);

  const identityRadarChartData = useMemo(
    () => [
      { skill: "Will", score: stats.will },
      { skill: "Focus", score: stats.focus },
      { skill: "Grit", score: stats.grit },
      { skill: "Adapt", score: stats.adapt },
      { skill: "Lore", score: stats.lore },
    ],
    [stats.adapt, stats.focus, stats.grit, stats.lore, stats.will]
  );

  const identityRadarChartConfig = {
    score: {
      label: "Alignment",
      color: "#ffffff",
    },
  } satisfies ChartConfig;

  const lockQuest = (quest: Quest) => {
    setActiveQuest(quest);
    setTimerSeconds(INITIAL_TIMER);
    setNotifMessage("Path Committed");
    setNotification(true);
  };

  const submitProof = () => {
    setModalOpen(false);
    setNotifMessage("Artifact Deposited");
    setNotification(true);
    window.setTimeout(() => setView("profile"), 3000);
  };

  const getClientX = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ("touches" in event) {
      return event.touches[0]?.clientX ?? 0;
    }

    return event.clientX;
  };

  const handleStart = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(getClientX(event));
  };

  const handleMove = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    setSwipeX(getClientX(event) - startX);
  };

  const resolveSwipe = (direction?: "left" | "right") => {
    const dir = direction ? (direction === "right" ? 800 : -800) : swipeX > 0 ? 800 : -800;
    setSwipeX(dir);

    window.setTimeout(() => {
      setVerifyQueue((prev) => prev.slice(1));
      setSwipeX(0);
      setNotifMessage("Judgment Logged");
      setNotification(true);
    }, 350);
  };

  const handleEnd = () => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);

    if (Math.abs(swipeX) > 120) {
      resolveSwipe();
      return;
    }

    setSwipeX(0);
  };

  const topCard = verifyQueue[0];

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#05070a] text-slate-100">
      <aside className="fixed top-0 left-0 z-50 hidden h-full w-80 flex-col border-r border-white/5 bg-[#05070a] p-12 xl:flex">
        <button
          type="button"
          className="group mb-20 flex items-center gap-4 text-left"
          onClick={() => setView("dashboard")}
        >
          <div className="flex h-12 w-12 rotate-3 items-center justify-center rounded-2xl bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-500 group-hover:rotate-0">
            <Swords className="h-6 w-6" />
          </div>
          <div>
            <span className="block font-[family-name:var(--font-display)] text-2xl leading-none tracking-tight italic text-white">
              SideQuest
            </span>
            <span className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase opacity-60">
              Protocol 3.0
            </span>
          </div>
        </button>

        <nav className="flex-1 space-y-12">
          <div className="space-y-6">
            <h5 className="px-2 text-[10px] font-bold tracking-[0.5em] text-slate-500/60 uppercase">Discovery</h5>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => setView("dashboard")}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl px-6 py-4 text-left transition-all ${
                    view === "dashboard" ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Compass className="h-5 w-5" /> Current Path
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setView("outpost")}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl px-6 py-4 text-left transition-all ${
                    view === "outpost" ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" /> The Outpost
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="px-2 text-[10px] font-bold tracking-[0.5em] text-slate-500/60 uppercase">Personal</h5>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => setView("profile")}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl px-6 py-4 text-left transition-all ${
                    view === "profile" ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <User className="h-5 w-5" /> Identity
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <div className="glass mt-auto rounded-[2rem] border-white/5 p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#161b25] text-xs font-bold">
              V
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-white">Vance Thorne</p>
              <p className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">Lvl 14 Seeker</p>
            </div>
          </div>
          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-2/3 bg-white" />
          </div>
          <p className="text-right text-[9px] font-bold tracking-widest text-slate-400 uppercase">420/600 XP</p>

          <SignOutButton>
            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold tracking-[0.35em] text-slate-300 uppercase transition hover:border-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </SignOutButton>
        </div>
      </aside>

      <nav className="glass cinematic-shadow fixed bottom-8 left-1/2 z-[60] flex w-[90%] -translate-x-1/2 items-center justify-between rounded-[2.5rem] border-white/10 px-10 py-5 xl:hidden">
        <button
          type="button"
          onClick={() => setView("dashboard")}
          className={`transition-all ${view === "dashboard" ? "scale-110 text-white" : "text-slate-400"}`}
        >
          <Compass />
        </button>
        <button
          type="button"
          onClick={() => setView("outpost")}
          className={`transition-all ${view === "outpost" ? "scale-110 text-white" : "text-slate-400"}`}
        >
          <ShieldCheck />
        </button>
        <button
          type="button"
          onClick={() => setView("profile")}
          className={`transition-all ${view === "profile" ? "scale-110 text-white" : "text-slate-400"}`}
        >
          <User />
        </button>
        <SignOutButton>
          <button
            type="button"
            className="text-slate-400 transition-all hover:text-white"
            aria-label="Logout"
          >
            <LogOut />
          </button>
        </SignOutButton>
      </nav>

      <main className="min-h-screen px-6 pb-44 md:px-16 lg:px-24 xl:ml-80">
        {view === "dashboard" && (
          <section className="mx-auto max-w-4xl animate-fade-rise space-y-20 py-8 md:py-12">
            {!activeQuest && (
              <>
                <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
                  <div className="max-w-2xl">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="text-[10px] font-bold tracking-[0.5em] text-amber-400 uppercase">Weekly Cycle 42</span>
                      <div className="h-px w-12 bg-amber-400/30" />
                    </div>
                    <h1 className="mb-8 font-[family-name:var(--font-display)] text-6xl leading-[0.9] tracking-tighter text-white italic md:text-8xl">
                      Choose Thy <br />
                      Next Trial.
                    </h1>
                    <p className="text-lg leading-relaxed text-slate-400 italic">
                      The following pathways have been manifested for your current rank. You may only lock one for
                      the next 7-day cycle.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {WEEKLY_OPTIONS.map((quest) => (
                    <div
                      key={quest.id}
                      className="gradient-border cinematic-shadow group relative overflow-hidden rounded-[2.5rem] border border-transparent bg-[#0f1219] transition-all duration-500 hover:border-white/20"
                    >
                      <div className="flex h-full flex-col md:flex-row">
                        <div className="relative h-52 overflow-hidden md:h-auto md:w-1/3">
                          <img
                            src={quest.img}
                            alt={quest.title}
                            className="h-full w-full object-cover opacity-40 grayscale transition-all duration-1000 group-hover:scale-105 group-hover:opacity-60 group-hover:grayscale-0"
                          />
                          <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-[#0f1219] md:block" />
                          <div className="absolute inset-0 block bg-gradient-to-t from-[#0f1219] via-transparent to-transparent md:hidden" />
                        </div>

                        <div className="flex flex-col justify-between p-10 md:w-2/3">
                          <div className="mb-8">
                            <div className="mb-4 flex items-center justify-between">
                              <span className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase">
                                {quest.category}
                              </span>
                              <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                                {quest.difficulty}
                              </span>
                            </div>
                            <h3 className="mb-4 font-[family-name:var(--font-display)] text-4xl leading-none text-white italic">
                              {quest.title}
                            </h3>
                            <p className="pr-6 text-sm leading-relaxed text-slate-400 italic">{quest.desc}</p>
                          </div>

                          <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-amber-400 uppercase">
                              <Zap className="h-3 w-3" /> 400 XP
                            </div>
                            <button
                              type="button"
                              onClick={() => lockQuest(quest)}
                              className="rounded-2xl bg-white px-8 py-3.5 text-[10px] font-bold tracking-[0.2em] text-black uppercase shadow-xl shadow-white/5 transition-all hover:scale-105 active:scale-95"
                            >
                              Lock Path
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeQuest && (
              <div className="space-y-16">
                <div className="flex flex-col items-start gap-12 border-b border-white/5 pb-16 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600 shadow-[0_0_15px_#e11d48]" />
                      <span className="text-[11px] font-bold tracking-[0.5em] text-white uppercase">Protocol Active</span>
                    </div>
                    <h1 className="font-[family-name:var(--font-display)] text-7xl leading-[0.85] tracking-tighter text-white italic md:text-9xl">
                      {activeQuest.title}
                    </h1>
                  </div>
                  <div className="glass flex min-w-[240px] flex-col rounded-[2.5rem] px-10 py-7 text-center md:text-right">
                    <span className="mb-2 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">
                      Cycle Remaining
                    </span>
                    <span className="font-[family-name:var(--font-display)] text-4xl tracking-tighter text-white italic tabular-nums">
                      {timerDisplay}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                  <div className="space-y-12 lg:col-span-8">
                    <div className="gradient-border cinematic-shadow group relative overflow-hidden rounded-[3rem] bg-[#0f1219]">
                      <div className="scan-line animate-scan" />
                      <img src={activeQuest.img} alt={activeQuest.title} className="h-96 w-full object-cover opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1219] via-[#0f1219]/40 to-transparent" />

                      <div className="relative z-10 p-12">
                        <div className="mb-10 flex items-center gap-6">
                          <h4 className="font-[family-name:var(--font-display)] text-3xl leading-none text-white italic">
                            The Mandate
                          </h4>
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <p className="mb-16 pr-10 text-xl leading-relaxed text-slate-400 italic">
                          {activeQuest.requirement}
                        </p>

                        <button
                          type="button"
                          onClick={() => setModalOpen(true)}
                          className="group flex h-72 w-full cursor-pointer flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-white/5 transition-all duration-500 hover:border-white/20 hover:bg-white/5"
                        >
                          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/5 text-slate-400 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:text-black">
                            <Camera className="h-8 w-8" />
                          </div>
                          <p className="text-xs font-bold tracking-[0.3em] text-slate-400 uppercase transition-colors group-hover:text-white">
                            Manifest Physical Evidence
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 lg:col-span-4">
                    <div className="glass space-y-10 rounded-[3rem] p-10">
                      <div>
                        <h5 className="mb-8 text-[11px] font-bold tracking-[0.4em] text-slate-400 uppercase">
                          Yield Projections
                        </h5>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 italic">Experience Gain</span>
                            <span className="text-sm font-bold tracking-widest text-white">+750 XP</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 italic">Honor Allocation</span>
                            <span className="text-sm font-bold tracking-widest text-amber-400">+20 HP</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-8">
                        <h5 className="mb-6 text-[11px] font-bold tracking-[0.4em] text-slate-400 uppercase">Penalties</h5>
                        <p className="text-[11px] font-medium leading-relaxed tracking-widest text-rose-600 italic uppercase">
                          Failure results in total Momentum reset and Honor deduction.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {view === "outpost" && (
          <section className="mx-auto max-w-2xl animate-fade-rise py-8 md:py-12">
            <header className="mb-20 text-center">
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-7xl leading-none text-white italic">
                The Outpost
              </h2>
              <p className="text-[11px] tracking-[0.6em] text-slate-400 uppercase">Witness and Validate the Deeds</p>
            </header>

            <div className="relative flex h-[650px] w-full items-center justify-center">
              {verifyQueue.length === 0 && (
                <div className="space-y-8 text-center">
                  <div className="cinematic-shadow mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/5 bg-[#0f1219]">
                    <EyeOff className="h-10 w-10 text-slate-500/30" />
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-2xl text-slate-400 italic">
                    The Registry is silent. <br />
                    All paths are verified.
                  </p>
                  <button
                    type="button"
                    onClick={() => setVerifyQueue(INITIAL_VERIFY_QUEUE)}
                    className="text-[10px] font-bold tracking-[0.3em] text-slate-300 uppercase transition-colors hover:text-white"
                  >
                    Invoke Fresh Registry
                  </button>
                </div>
              )}

              {topCard && (
                <div
                  className="swipe-card cinematic-shadow group absolute aspect-[4/5] w-full cursor-grab overflow-hidden rounded-[3.5rem] border border-white/10 bg-[#0f1219] active:cursor-grabbing"
                  style={{ transform: `translateX(${swipeX}px) rotate(${swipeX / 25}deg)` }}
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                >
                  <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between px-16">
                    <span
                      className="rounded-full bg-rose-600 px-8 py-4 text-[11px] font-bold tracking-widest text-white uppercase shadow-2xl"
                      style={{ opacity: swipeX < -60 ? 1 : 0 }}
                    >
                      Reject
                    </span>
                    <span
                      className="rounded-full bg-emerald-600 px-8 py-4 text-[11px] font-bold tracking-widest text-white uppercase shadow-2xl"
                      style={{ opacity: swipeX > 60 ? 1 : 0 }}
                    >
                      Verify
                    </span>
                  </div>

                  <div className="relative h-[60%] overflow-hidden">
                    <img
                      src={topCard.image}
                      alt={topCard.quest}
                      className="h-full w-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1219] via-transparent to-transparent" />
                  </div>

                  <div className="flex h-[40%] flex-col justify-between p-12">
                    <div>
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#161b25] text-[11px] font-bold text-white shadow-xl">
                          S
                        </div>
                        <div>
                          <p className="text-xs font-bold tracking-widest text-white">{topCard.user}</p>
                          <p className="text-[10px] tracking-tight text-slate-400 uppercase">{topCard.time}</p>
                        </div>
                        <span className="ml-auto rounded-full border border-white/5 px-3 py-1.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                          {topCard.quest}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-lg leading-relaxed text-slate-400 italic">{topCard.desc}</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => resolveSwipe("left")}
                        className="flex-1 rounded-2xl border border-white/5 bg-white/5 py-5 transition-all hover:scale-[1.02] hover:bg-rose-600/10"
                      >
                        <X className="mx-auto h-5 w-5 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveSwipe("right")}
                        className="flex-1 rounded-2xl border border-white/5 bg-white/5 py-5 transition-all hover:scale-[1.02] hover:bg-emerald-600/10"
                      >
                        <Check className="mx-auto h-5 w-5 text-slate-100" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {view === "profile" && (
          <section className="mx-auto max-w-6xl animate-fade-rise py-8 md:py-12">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
              <div className="space-y-16 lg:col-span-5">
                <div className="flex flex-col items-center text-center">
                  <div className="group relative mb-12">
                    <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                    <img
                      src="https://i.pravatar.cc/300?u=vance"
                      alt="Vance Thorne"
                      className="cinematic-shadow relative z-10 h-48 w-48 rounded-[3.5rem] border border-white/10 object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h2 className="mb-4 font-[family-name:var(--font-display)] text-7xl leading-none tracking-tighter text-white italic">
                    Vance Thorne
                  </h2>
                  <div className="flex items-center gap-6">
                    <span className="text-[11px] font-bold tracking-[0.5em] text-slate-400 uppercase">Lvl 14 Seeker</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400/40" />
                    <span className="text-[11px] font-bold tracking-[0.5em] text-amber-400 uppercase">340 Honor</span>
                  </div>
                </div>

                <div className="gradient-border cinematic-shadow rounded-[3.5rem] bg-[#0f1219] p-12 text-center">
                  <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-[2.5rem] border border-white/10 bg-[#161b25] shadow-2xl">
                    <Navigation2 className="h-8 w-8 text-white" />
                  </div>
                  <span className="mb-4 block text-[10px] font-bold tracking-[0.6em] text-slate-400 uppercase">
                    Current Alignment
                  </span>
                  <h3 className="mb-8 font-[family-name:var(--font-display)] text-5xl leading-none text-white italic">
                    The Urban Nomad
                  </h3>
                  <p className="pr-6 text-base leading-relaxed text-slate-400 italic">
                    &quot;Master of adaptation. Forging a path through the architectural silence of the modern city.
                    Strength found in transitions.&quot;
                  </p>
                </div>
              </div>

              <div className="space-y-12 lg:col-span-7">
                <div className="cinematic-shadow relative overflow-hidden rounded-[3.5rem] border border-white/5 bg-[#0f1219] p-12">
                  <div className="mb-12 flex items-end justify-between">
                    <div>
                      <h3 className="mb-3 font-[family-name:var(--font-display)] text-4xl leading-none text-white italic">
                        Weekly Alignment
                      </h3>
                      <p className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">
                        Status across the 7-week arc
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-[family-name:var(--font-display)] text-6xl leading-none text-white italic">05</span>
                      <span className="mt-2 text-[10px] font-bold tracking-widest text-amber-400 uppercase">Active Streak</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {WEEKLY_ALIGNMENT_STEPS.map((week) => (
                      <div key={week.label} className="flex flex-1 flex-col items-center gap-4">
                        <div
                          className={`flex aspect-square w-full items-center justify-center rounded-2xl border transition-all duration-700 ${
                            week.status === "complete"
                              ? "border-transparent bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                              : week.status === "active"
                                ? "animate-pulse border-white/20 bg-[#161b25] text-white"
                                : "border-white/5 bg-[#0f1219] text-slate-500/30"
                          }`}
                        >
                          {week.status === "complete" ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span className="text-[10px] font-bold tracking-tighter uppercase">{week.label}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold tracking-widest text-slate-400">{week.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass relative overflow-hidden rounded-[3.5rem] p-12">
                  <header className="mb-14">
                    <h3 className="font-[family-name:var(--font-display)] text-4xl leading-none text-white italic">
                      Prism Matrix
                    </h3>
                    <p className="mt-2 text-[10px] tracking-widest text-slate-400 uppercase">Personal Evolution Progress</p>
                  </header>

                  <div className="flex flex-col items-center gap-16 md:flex-row">
                    <ChartContainer
                      config={identityRadarChartConfig}
                      className="relative h-72 w-72 shrink-0 aspect-square drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                      <RadarChart data={identityRadarChartData} outerRadius="80%">
                        <PolarGrid stroke="rgba(255,255,255,0.08)" radialLines />
                        <PolarAngleAxis
                          dataKey="skill"
                          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Radar
                          dataKey="score"
                          fill="var(--color-score)"
                          fillOpacity={0.12}
                          stroke="var(--color-score)"
                          strokeWidth={1.6}
                          animationDuration={900}
                        />
                      </RadarChart>
                    </ChartContainer>

                    <div className="w-full flex-1 space-y-10">
                      <div className="space-y-4">
                        <div className="flex items-end justify-between">
                          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Mental Fortitude</span>
                          <span className="text-xs font-bold text-white">92%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full w-[92%] bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-end justify-between">
                          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Physical Prowess</span>
                          <span className="text-xs font-bold text-white">74%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full w-[74%] bg-white" />
                        </div>
                      </div>

                      <p className="border-t border-white/5 pt-8 text-[11px] leading-relaxed tracking-widest text-slate-400 italic uppercase">
                        Seeker, your &apos;Lore&apos; is lagging behind. Consider Knowledge-based trials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#05070a]/98 backdrop-blur-2xl"
            onClick={() => setModalOpen(false)}
            aria-label="Close modal"
          />
          <div className="relative w-full max-w-xl rounded-[3.5rem] border border-white/10 bg-[#0f1219] p-14 shadow-2xl md:p-20">
            <h2 className="mb-8 font-[family-name:var(--font-display)] text-6xl leading-none tracking-tighter text-white italic">
              Manifest Proof.
            </h2>
            <p className="mb-14 text-lg leading-relaxed text-slate-400 italic">
              The collective awaits your documentation. Ensure your Seeker Code is visible in the physical evidence.
            </p>
            <form
              className="space-y-12"
              onSubmit={(event) => {
                event.preventDefault();
                submitProof();
              }}
            >
              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-white/10 py-24 transition-all duration-500 hover:border-white/20 hover:bg-white/5">
                <input type="file" className="sr-only" accept="image/*" />
                <UploadCloud className="mb-6 h-12 w-12 text-slate-400 transition-all duration-500 group-hover:text-white" />
                <p className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase transition-all duration-500 group-hover:text-white">
                  Deposit Artifact
                </p>
              </label>
              <button
                type="submit"
                className="w-full rounded-2xl bg-white py-5 text-xs font-bold tracking-[0.4em] text-black uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Transmit Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <div className="glass cinematic-shadow fixed right-12 bottom-12 z-[300] flex items-center gap-6 rounded-[2rem] px-10 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black shadow-xl">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.2em] text-white uppercase">{notifMessage}</p>
            <p className="text-[10px] tracking-widest text-slate-400 italic uppercase">Protocol Recorded.</p>
          </div>
        </div>
      )}
    </div>
  );
}
