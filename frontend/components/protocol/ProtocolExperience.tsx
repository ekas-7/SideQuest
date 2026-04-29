"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import {
  Camera,
  Check,
  Compass,
  EyeOff,
  LogOut,
  Navigation2,
  RefreshCw,
  ShieldCheck,
  Swords,
  UploadCloud,
  User,
  X,
  Zap,
} from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useSideQuest } from "@/contexts/sidequest-context";
import {
  getWeeklyQuests,
  getVerificationAssignments,
  castVote,
  uploadProofPhoto,
  submitProof,
  rerollWeeklyQuests,
  type WeeklyQuest,
  type VerificationAssignment,
} from "@/lib/api";

type ViewKey = "dashboard" | "outpost" | "profile";

const XP_PER_LEVEL = 500;
const INITIAL_TIMER = 7 * 24 * 60 * 60;

const STAT_FOCUS_META: Record<string, { category: string; img: string }> = {
  strength: {
    category: "Physical Mastery",
    img: "https://images.unsplash.com/photo-1517030330234-94c4fa948ebc?auto=format&fit=crop&q=80&w=1200",
  },
  agility: {
    category: "Athletic Endeavor",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200",
  },
  intelligence: {
    category: "Mental Fortitude",
    img: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200",
  },
};

const DIFFICULTY: Record<number, string> = {
  1: "Seeker", 2: "Seeker", 3: "Seeker",
  4: "Vanguard", 5: "Vanguard", 6: "Vanguard",
  7: "Rogue", 8: "Rogue", 9: "Rogue", 10: "Legendary",
};

const ARCHETYPES: Record<string, { title: string; desc: string }> = {
  strength: {
    title: "The Iron Vanguard",
    desc: '"Forged through physical trial. Where others falter, you push further. Strength is the foundation of all progress."',
  },
  agility: {
    title: "The Urban Nomad",
    desc: '"Master of adaptation. Forging a path through constant motion. Speed and flexibility are your weapons."',
  },
  intelligence: {
    title: "The Lore Keeper",
    desc: '"Knowledge is power. You seek to understand the patterns beneath the surface. The mind is your greatest tool."',
  },
};

function formatTimer(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d)}d ${p(h)}h ${p(m)}m ${p(sec)}s`;
}

function buildAlignmentSteps(streak: number) {
  return Array.from({ length: 7 }, (_, i) => ({
    label: `W${i + 1}`,
    status: (i < streak ? "complete" : i === streak ? "active" : "locked") as
      | "complete"
      | "active"
      | "locked",
  }));
}

export function ProtocolExperience() {
  const { backendUser } = useSideQuest();
  const userId = backendUser?.id ?? null;

  const [view, setView] = useState<ViewKey>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);
  const [activeQuest, setActiveQuest] = useState<WeeklyQuest | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(INITIAL_TIMER);

  const [weeklyQuests, setWeeklyQuests] = useState<WeeklyQuest[]>([]);
  const [rerollUsed, setRerollUsed] = useState(false);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [rerolling, setRerolling] = useState(false);

  const [verifyQueue, setVerifyQueue] = useState<VerificationAssignment[]>([]);
  const [loadingVerify, setLoadingVerify] = useState(true);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofDesc, setProofDesc] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  // Fetch weekly quests
  useEffect(() => {
    if (!userId) return;
    setLoadingQuests(true);
    getWeeklyQuests(userId)
      .then((d) => { setWeeklyQuests(d.quests); setRerollUsed(d.rerollUsed); })
      .catch(console.error)
      .finally(() => setLoadingQuests(false));
  }, [userId]);

  // Fetch verification queue
  useEffect(() => {
    if (!userId) return;
    setLoadingVerify(true);
    getVerificationAssignments(userId)
      .then((d) => setVerifyQueue(d.assignments))
      .catch(console.error)
      .finally(() => setLoadingVerify(false));
  }, [userId]);

  // Auto-dismiss notification
  useEffect(() => {
    if (!notifMsg) return;
    const t = window.setTimeout(() => setNotifMsg(null), 3000);
    return () => window.clearTimeout(t);
  }, [notifMsg]);

  // Active quest countdown timer
  useEffect(() => {
    if (!activeQuest) return;
    const id = window.setInterval(
      () => setTimerSeconds((prev) => Math.max(prev - 1, 0)),
      1000
    );
    return () => window.clearInterval(id);
  }, [activeQuest]);

  const timerDisplay = useMemo(() => formatTimer(timerSeconds), [timerSeconds]);

  // Derived user stats
  const level = Math.floor((backendUser?.xp ?? 0) / XP_PER_LEVEL) + 1;
  const xpInLevel = (backendUser?.xp ?? 0) % XP_PER_LEVEL;

  const alignmentSteps = useMemo(
    () => buildAlignmentSteps(Math.min(backendUser?.streak ?? 0, 7)),
    [backendUser?.streak]
  );

  const radarData = useMemo(
    () => [
      { skill: "Strength", score: backendUser?.strength ?? 0 },
      { skill: "Agility", score: backendUser?.agility ?? 0 },
      { skill: "Intelligence", score: backendUser?.intelligence ?? 0 },
    ],
    [backendUser]
  );

  const radarConfig = {
    score: { label: "Alignment", color: "#ffffff" },
  } satisfies ChartConfig;

  const topStatFocus = useMemo(() => {
    if (!backendUser) return "strength";
    const stats: [string, number][] = [
      ["strength", backendUser.strength],
      ["agility", backendUser.agility],
      ["intelligence", backendUser.intelligence],
    ];
    return stats.reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
  }, [backendUser]);

  const lagStatName = useMemo(() => {
    if (!backendUser) return "Strength";
    const stats: [string, number][] = [
      ["Strength", backendUser.strength],
      ["Agility", backendUser.agility],
      ["Intelligence", backendUser.intelligence],
    ];
    return stats.reduce((a, b) => (a[1] <= b[1] ? a : b))[0];
  }, [backendUser]);

  const archetype = ARCHETYPES[topStatFocus] ?? ARCHETYPES.strength;
  const displayName = backendUser?.username
    ? backendUser.username.charAt(0).toUpperCase() + backendUser.username.slice(1)
    : "Seeker";

  // Lock a quest (UI only — no API call until proof submit)
  const lockQuest = (quest: WeeklyQuest) => {
    if (quest.status !== "assigned") return;
    setActiveQuest(quest);
    setTimerSeconds(INITIAL_TIMER);
    setNotifMsg("Path Committed");
  };

  // Reroll weekly quests
  const handleReroll = async () => {
    if (!userId || rerollUsed || rerolling) return;
    setRerolling(true);
    try {
      const d = await rerollWeeklyQuests(userId);
      setWeeklyQuests(d.quests);
      setRerollUsed(true);
      setNotifMsg("Paths Rerolled");
    } catch (err) {
      console.error(err);
      setNotifMsg("Reroll Failed");
    } finally {
      setRerolling(false);
    }
  };

  // Proof submission
  const handleSubmitProof = async () => {
    if (!activeQuest || !userId || !proofFile) return;
    setSubmittingProof(true);
    try {
      const { url } = await uploadProofPhoto(proofFile);
      await submitProof(activeQuest.id, {
        userId,
        description: proofDesc.trim() || "Proof of completion",
        proofUrl: url,
      });
      setModalOpen(false);
      setProofFile(null);
      setProofDesc("");
      setNotifMsg("Artifact Deposited");
      const d = await getWeeklyQuests(userId);
      setWeeklyQuests(d.quests);
      const updated = d.quests.find((q) => q.id === activeQuest.id);
      if (updated) setActiveQuest(updated);
      setTimeout(() => setView("profile"), 2500);
    } catch (err) {
      console.error(err);
      setNotifMsg("Transmission Failed");
    } finally {
      setSubmittingProof(false);
    }
  };

  // Swipe helpers
  const getClientX = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => ("touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX);

  const handleStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => { setIsDragging(true); setStartX(getClientX(e)); };

  const handleMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => { if (!isDragging) return; setSwipeX(getClientX(e) - startX); };

  const resolveVote = useCallback(
    async (direction?: "left" | "right") => {
      const card = verifyQueue[0];
      if (!card || !userId) return;
      const approve =
        direction === "right" || (!direction && swipeX > 0);
      setSwipeX(approve ? 800 : -800);
      try {
        await castVote(card.id, { voterUserId: userId, vote: approve });
      } catch (err) {
        console.error(err);
      }
      setTimeout(() => {
        setVerifyQueue((prev) => prev.slice(1));
        setSwipeX(0);
        setNotifMsg("Judgment Logged");
      }, 350);
    },
    [verifyQueue, userId, swipeX]
  );

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(swipeX) > 120) { void resolveVote(); return; }
    setSwipeX(0);
  };

  const topVerifyCard = verifyQueue[0];

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#05070a] text-slate-100">

      {/* ── Sidebar (desktop) ── */}
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
            <h5 className="px-2 text-[10px] font-bold tracking-[0.5em] text-slate-500/60 uppercase">
              Discovery
            </h5>
            <ul className="space-y-2">
              {(["dashboard", "outpost"] as const).map((v) => (
                <li key={v}>
                  <button
                    type="button"
                    onClick={() => setView(v)}
                    className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 text-left transition-all ${
                      view === v ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {v === "dashboard" ? (
                      <Compass className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                    {v === "dashboard" ? "Current Path" : "The Outpost"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="px-2 text-[10px] font-bold tracking-[0.5em] text-slate-500/60 uppercase">
              Personal
            </h5>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => setView("profile")}
                  className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 text-left transition-all ${
                    view === "profile"
                      ? "bg-white/5 text-white"
                      : "text-slate-400 hover:text-white"
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
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-white">{displayName}</p>
              <p className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">
                Lvl {level} Seeker
              </p>
            </div>
          </div>
          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }}
            />
          </div>
          <p className="text-right text-[9px] font-bold tracking-widest text-slate-400 uppercase">
            {xpInLevel}/{XP_PER_LEVEL} XP
          </p>
          <SignOutButton>
            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold tracking-[0.35em] text-slate-300 uppercase transition hover:border-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* ── Mobile nav ── */}
      <nav className="glass cinematic-shadow fixed bottom-8 left-1/2 z-[60] flex w-[90%] -translate-x-1/2 items-center justify-between rounded-[2.5rem] border-white/10 px-10 py-5 xl:hidden">
        {(["dashboard", "outpost", "profile"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`transition-all ${view === v ? "scale-110 text-white" : "text-slate-400"}`}
          >
            {v === "dashboard" ? (
              <Compass />
            ) : v === "outpost" ? (
              <ShieldCheck />
            ) : (
              <User />
            )}
          </button>
        ))}
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

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <section className="mx-auto max-w-4xl animate-fade-rise space-y-20 py-8 md:py-12">
            {!activeQuest ? (
              <>
                <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
                  <div className="max-w-2xl">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="text-[10px] font-bold tracking-[0.5em] text-amber-400 uppercase">
                        Streak · {backendUser?.streak ?? 0} Weeks
                      </span>
                      <div className="h-px w-12 bg-amber-400/30" />
                    </div>
                    <h1 className="mb-8 font-[family-name:var(--font-display)] text-6xl leading-[0.9] tracking-tighter text-white italic md:text-8xl">
                      Choose Thy <br /> Next Trial.
                    </h1>
                    <p className="text-lg leading-relaxed text-slate-400 italic">
                      The following pathways have been manifested for your rank. Lock one
                      to begin the 7-day cycle.
                    </p>
                  </div>
                  {!rerollUsed && weeklyQuests.some((q) => q.status === "assigned") && (
                    <button
                      type="button"
                      onClick={() => void handleReroll()}
                      disabled={rerolling}
                      className="flex items-center gap-3 self-start rounded-2xl border border-white/10 px-6 py-3 text-[10px] font-bold tracking-[0.3em] text-slate-300 uppercase transition hover:border-white/20 hover:text-white disabled:opacity-40"
                    >
                      <RefreshCw className={`h-4 w-4 ${rerolling ? "animate-spin" : ""}`} />
                      Reroll Paths
                    </button>
                  )}
                </div>

                {loadingQuests ? (
                  <div className="flex h-48 items-center justify-center text-sm italic text-slate-400">
                    Manifesting your paths…
                  </div>
                ) : weeklyQuests.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm italic text-slate-400">
                    No quests found. Reload to try again.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {weeklyQuests.map((quest) => {
                      const meta =
                        STAT_FOCUS_META[quest.quest?.statFocus ?? "strength"] ??
                        STAT_FOCUS_META.strength;
                      const difficulty = DIFFICULTY[quest.quest?.toughness ?? 1] ?? "Seeker";
                      const xpReward = (quest.quest?.toughness ?? 1) * 50;
                      const isCompleted = quest.status !== "assigned";

                      return (
                        <div
                          key={quest.id}
                          className={`gradient-border cinematic-shadow group relative overflow-hidden rounded-[2.5rem] border border-transparent bg-[#0f1219] transition-all duration-500 hover:border-white/20 ${
                            isCompleted ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex h-full flex-col md:flex-row">
                            <div className="relative h-52 overflow-hidden md:h-auto md:w-1/3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={meta.img}
                                alt={quest.quest?.title ?? "Quest"}
                                className="h-full w-full object-cover opacity-40 grayscale transition-all duration-1000 group-hover:scale-105 group-hover:opacity-60 group-hover:grayscale-0"
                              />
                              <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-[#0f1219] md:block" />
                              <div className="absolute inset-0 block bg-gradient-to-t from-[#0f1219] via-transparent to-transparent md:hidden" />
                            </div>

                            <div className="flex flex-col justify-between p-10 md:w-2/3">
                              <div className="mb-8">
                                <div className="mb-4 flex items-center justify-between">
                                  <span className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase">
                                    {meta.category}
                                  </span>
                                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                                    {difficulty}
                                  </span>
                                </div>
                                <h3 className="mb-4 font-[family-name:var(--font-display)] text-4xl leading-none text-white italic">
                                  {quest.quest?.title ?? "Quest"}
                                </h3>
                                <p className="pr-6 text-sm leading-relaxed text-slate-400 italic">
                                  {quest.quest?.description ?? ""}
                                </p>
                              </div>

                              <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-amber-400 uppercase">
                                  <Zap className="h-3 w-3" /> +{xpReward} XP
                                </div>
                                {isCompleted ? (
                                  <span className="rounded-2xl border border-white/10 px-6 py-3 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                    {quest.status.charAt(0).toUpperCase() +
                                      quest.status.slice(1)}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => lockQuest(quest)}
                                    className="rounded-2xl bg-white px-8 py-3.5 text-[10px] font-bold tracking-[0.2em] text-black uppercase shadow-xl shadow-white/5 transition-all hover:scale-105 active:scale-95"
                                  >
                                    Lock Path
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* Active quest detail */
              <div className="space-y-16">
                <div className="flex flex-col items-start gap-12 border-b border-white/5 pb-16 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600 shadow-[0_0_15px_#e11d48]" />
                      <span className="text-[11px] font-bold tracking-[0.5em] text-white uppercase">
                        Protocol Active
                      </span>
                    </div>
                    <h1 className="font-[family-name:var(--font-display)] text-7xl leading-[0.85] tracking-tighter text-white italic md:text-9xl">
                      {activeQuest.quest?.title ?? "Quest"}
                    </h1>
                  </div>
                  <div className="glass flex min-w-[240px] flex-col rounded-[2.5rem] px-10 py-7 text-center">
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          STAT_FOCUS_META[activeQuest.quest?.statFocus ?? "strength"]
                            ?.img ?? STAT_FOCUS_META.strength.img
                        }
                        alt={activeQuest.quest?.title ?? ""}
                        className="h-96 w-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1219] via-[#0f1219]/40 to-transparent" />

                      <div className="relative z-10 p-12">
                        <div className="mb-10 flex items-center gap-6">
                          <h4 className="font-[family-name:var(--font-display)] text-3xl leading-none text-white italic">
                            The Mandate
                          </h4>
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <p className="mb-16 pr-10 text-xl leading-relaxed text-slate-400 italic">
                          {activeQuest.quest?.description ?? ""}
                        </p>

                        {activeQuest.status === "submitted" ||
                        activeQuest.status === "verified" ? (
                          <div className="flex h-72 w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-white/10 bg-white/5">
                            <Check className="mb-4 h-10 w-10 text-emerald-400" />
                            <p className="text-xs font-bold tracking-[0.3em] text-emerald-400 uppercase">
                              {activeQuest.status === "verified"
                                ? "Proof Verified by Community"
                                : "Proof Submitted — Awaiting Judgment"}
                            </p>
                          </div>
                        ) : (
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
                        )}
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
                            <span className="text-xs italic text-slate-400">Experience Gain</span>
                            <span className="text-sm font-bold tracking-widest text-white">
                              +{(activeQuest.quest?.toughness ?? 1) * 50} XP
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs italic text-slate-400">Trust Allocation</span>
                            <span className="text-sm font-bold tracking-widest text-amber-400">
                              +{(activeQuest.quest?.toughness ?? 1) * 5} TP
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-8">
                        <h5 className="mb-6 text-[11px] font-bold tracking-[0.4em] text-slate-400 uppercase">
                          Penalties
                        </h5>
                        <p className="text-[11px] font-medium leading-relaxed tracking-widest text-rose-600 italic uppercase">
                          Failure results in Momentum reset and Trust deduction.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveQuest(null)}
                      className="w-full rounded-2xl border border-white/5 px-4 py-3 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase transition hover:text-white"
                    >
                      ← Back to Paths
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── OUTPOST ── */}
        {view === "outpost" && (
          <section className="mx-auto max-w-2xl animate-fade-rise py-8 md:py-12">
            <header className="mb-20 text-center">
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-7xl leading-none text-white italic">
                The Outpost
              </h2>
              <p className="text-[11px] tracking-[0.6em] text-slate-400 uppercase">
                Witness and Validate the Deeds
              </p>
            </header>

            <div className="relative flex h-[650px] w-full items-center justify-center">
              {loadingVerify ? (
                <p className="text-sm italic text-slate-400">Loading submissions…</p>
              ) : verifyQueue.length === 0 ? (
                <div className="space-y-8 text-center">
                  <div className="cinematic-shadow mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/5 bg-[#0f1219]">
                    <EyeOff className="h-10 w-10 text-slate-500/30" />
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-2xl italic text-slate-400">
                    The Registry is silent. <br /> All paths are verified.
                  </p>
                </div>
              ) : (
                topVerifyCard && (
                  <div
                    className="swipe-card cinematic-shadow group absolute aspect-[4/5] w-full cursor-grab overflow-hidden rounded-[3.5rem] border border-white/10 bg-[#0f1219] active:cursor-grabbing"
                    style={{
                      transform: `translateX(${swipeX}px) rotate(${swipeX / 25}deg)`,
                    }}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          topVerifyCard.proofUrl ||
                          `https://i.pravatar.cc/900?u=${topVerifyCard.submitterUserId}`
                        }
                        alt={topVerifyCard.quest?.title ?? "Proof"}
                        className="h-full w-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1219] via-transparent to-transparent" />
                    </div>

                    <div className="flex h-[40%] flex-col justify-between p-12">
                      <div>
                        <div className="mb-6 flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#161b25] text-[11px] font-bold text-white shadow-xl">
                            {topVerifyCard.submitterUserId.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold tracking-widest text-white">
                              {topVerifyCard.submitterUserId.slice(0, 10)}…
                            </p>
                            <p className="text-[10px] tracking-tight text-slate-400 uppercase">
                              {new Date(topVerifyCard.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="ml-auto rounded-full border border-white/5 px-3 py-1.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                            {topVerifyCard.quest?.title ?? "Quest"}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-lg leading-relaxed italic text-slate-400">
                          {topVerifyCard.proofDescription}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => void resolveVote("left")}
                          className="flex-1 rounded-2xl border border-white/5 bg-white/5 py-5 transition-all hover:scale-[1.02] hover:bg-rose-600/10"
                        >
                          <X className="mx-auto h-5 w-5 text-slate-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void resolveVote("right")}
                          className="flex-1 rounded-2xl border border-white/5 bg-white/5 py-5 transition-all hover:scale-[1.02] hover:bg-emerald-600/10"
                        >
                          <Check className="mx-auto h-5 w-5 text-slate-100" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* ── PROFILE ── */}
        {view === "profile" && (
          <section className="mx-auto max-w-6xl animate-fade-rise py-8 md:py-12">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
              <div className="space-y-16 lg:col-span-5">
                <div className="flex flex-col items-center text-center">
                  <div className="group relative mb-12">
                    <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.pravatar.cc/300?u=${userId}`}
                      alt={displayName}
                      className="cinematic-shadow relative z-10 h-48 w-48 rounded-[3.5rem] border border-white/10 object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h2 className="mb-4 font-[family-name:var(--font-display)] text-7xl leading-none tracking-tighter text-white italic">
                    {displayName}
                  </h2>
                  <div className="flex items-center gap-6">
                    <span className="text-[11px] font-bold tracking-[0.5em] text-slate-400 uppercase">
                      Lvl {level} Seeker
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400/40" />
                    <span className="text-[11px] font-bold tracking-[0.5em] text-amber-400 uppercase">
                      {backendUser?.trustScore ?? 0} Trust
                    </span>
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
                    {archetype.title}
                  </h3>
                  <p className="pr-6 text-base leading-relaxed italic text-slate-400">
                    {archetype.desc}
                  </p>
                </div>
              </div>

              <div className="space-y-12 lg:col-span-7">
                {/* Weekly alignment */}
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
                      <span className="font-[family-name:var(--font-display)] text-6xl leading-none text-white italic">
                        {String(backendUser?.streak ?? 0).padStart(2, "0")}
                      </span>
                      <span className="mt-2 text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                        Active Streak
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {alignmentSteps.map((week) => (
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
                            <span className="text-[10px] font-bold tracking-tighter uppercase">
                              {week.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold tracking-widest text-slate-400">
                          {week.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prism Matrix */}
                <div className="glass relative overflow-hidden rounded-[3.5rem] p-12">
                  <header className="mb-14">
                    <h3 className="font-[family-name:var(--font-display)] text-4xl leading-none text-white italic">
                      Prism Matrix
                    </h3>
                    <p className="mt-2 text-[10px] tracking-widest text-slate-400 uppercase">
                      Personal Evolution Progress
                    </p>
                  </header>

                  <div className="flex flex-col items-center gap-16 md:flex-row">
                    <ChartContainer
                      config={radarConfig}
                      className="relative aspect-square h-72 w-72 shrink-0 drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                      <RadarChart data={radarData} outerRadius="80%">
                        <PolarGrid stroke="rgba(255,255,255,0.08)" radialLines />
                        <PolarAngleAxis
                          dataKey="skill"
                          tick={{
                            fill: "rgba(148,163,184,0.9)",
                            fontSize: 10,
                            letterSpacing: 2,
                            fontWeight: 700,
                          }}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
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
                      {radarData.map(({ skill, score }) => (
                        <div key={skill} className="space-y-4">
                          <div className="flex items-end justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                              {skill}
                            </span>
                            <span className="text-xs font-bold text-white">{score}</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all"
                              style={{ width: `${Math.min(score, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      <p className="border-t border-white/5 pt-8 text-[11px] leading-relaxed tracking-widest italic text-slate-400 uppercase">
                        Seeker, your &apos;{lagStatName}&apos; needs attention. Consider{" "}
                        {lagStatName.toLowerCase()}-focused trials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Proof upload modal ── */}
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
            <p className="mb-14 text-lg leading-relaxed italic text-slate-400">
              The collective awaits your documentation.
            </p>

            <form
              className="space-y-8"
              onSubmit={(e) => { e.preventDefault(); void handleSubmitProof(); }}
            >
              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-white/10 py-16 transition-all duration-500 hover:border-white/20 hover:bg-white/5">
                <input
                  ref={proofInputRef}
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                <UploadCloud className="mb-4 h-10 w-10 text-slate-400 transition-all duration-500 group-hover:text-white" />
                <p className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase transition-all group-hover:text-white">
                  {proofFile ? proofFile.name : "Deposit Artifact"}
                </p>
              </label>

              <textarea
                value={proofDesc}
                onChange={(e) => setProofDesc(e.target.value)}
                placeholder="Describe your feat…"
                rows={3}
                className="no-scrollbar w-full resize-none rounded-2xl border border-white/5 bg-[#0f1219] px-6 py-4 text-sm italic text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!proofFile || submittingProof}
                className="w-full rounded-2xl bg-white py-5 text-xs font-bold tracking-[0.4em] text-black uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
              >
                {submittingProof ? "Transmitting…" : "Transmit Entry"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast notification ── */}
      {notifMsg && (
        <div className="glass cinematic-shadow fixed right-12 bottom-12 z-[300] flex items-center gap-6 rounded-[2rem] px-10 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black shadow-xl">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.2em] text-white uppercase">
              {notifMsg}
            </p>
            <p className="text-[10px] tracking-widest italic text-slate-400 uppercase">
              Protocol Recorded.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
