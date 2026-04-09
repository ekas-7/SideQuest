"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Activity,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  Heart,
  Mountain,
  Palette,
  Sparkles,
  Swords,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useSideQuest } from "@/contexts/sidequest-context";
import { cn } from "@/lib/utils";
import type { OnboardingInterest } from "@/lib/onboarding-data";

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?u=new_seeker";

const PATHWAYS: {
  id: OnboardingInterest;
  name: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  { id: "Fitness", name: "Fitness", desc: "Strength, movement, endurance.", Icon: Activity },
  { id: "Learning", name: "Learning", desc: "Books, skills, curiosity.", Icon: BookOpen },
  { id: "Creativity", name: "Creativity", desc: "Art, writing, making.", Icon: Palette },
  { id: "Social", name: "Social", desc: "People, connection, presence.", Icon: Users },
  { id: "Mindfulness", name: "Mindfulness", desc: "Calm, focus, reflection.", Icon: Sparkles },
  { id: "Adventure", name: "Adventure", desc: "Explore, risk, novelty.", Icon: Mountain },
  { id: "Career", name: "Career", desc: "Work, craft, momentum.", Icon: Briefcase },
  { id: "Finance", name: "Finance", desc: "Money, clarity, discipline.", Icon: Wallet },
  { id: "Wellness", name: "Wellness", desc: "Sleep, fuel, recovery.", Icon: Heart },
];

const MAX_INTERESTS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded: clerkLoaded, isSignedIn, user } = useUser();
  const { isLoaded: sqLoaded, saveOnboardingInterests, onboardingInterests } = useSideQuest();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR);
  const avatarObjectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [interests, setInterests] = useState<OnboardingInterest[]>([]);
  const seededInterestsFromContext = useRef(false);

  useEffect(() => {
    if (seededInterestsFromContext.current || onboardingInterests.length === 0) {
      return;
    }
    seededInterestsFromContext.current = true;
    setInterests(onboardingInterests);
  }, [onboardingInterests]);

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn || !user) {
      return;
    }
    const moniker =
      user.username ||
      user.firstName ||
      user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "";
    setName((prev) => (prev.trim() ? prev : moniker.trim()));
  }, [clerkLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!clerkLoaded) {
      return;
    }
    if (!isSignedIn) {
      router.replace("/");
    }
  }, [clerkLoaded, isSignedIn, router]);

  const revokeAvatar = useCallback(() => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
  }, []);

  const onAvatarFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    revokeAvatar();
    const next = URL.createObjectURL(file);
    avatarObjectUrlRef.current = next;
    setAvatarUrl(next);
  };

  useEffect(() => {
    return () => revokeAvatar();
  }, [revokeAvatar]);

  const toggleInterest = (id: OnboardingInterest) => {
    setInterests((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_INTERESTS) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const completeOnboarding = () => {
    saveOnboardingInterests(interests);
    router.replace("/app");
  };

  const displayName = name.trim() || "Seeker";

  const ready = clerkLoaded && sqLoaded && isSignedIn;

  const stepClass = "space-y-12 animate-fade-up";

  const headingSerif =
    "font-[family-name:var(--font-display)] text-5xl leading-none tracking-tighter text-white italic sm:text-6xl";

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#05070a] p-6 text-slate-100 no-scrollbar">
      <div className="w-full max-w-xl">
        {!ready ? (
          <div className="flex min-h-[50dvh] items-center justify-center text-sm text-slate-400">
            Loading…
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className={stepClass}>
                <header className="text-center">
                  <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.5em] text-slate-400">
                    Manifestation I
                  </span>
                  <h1 className={headingSerif}>
                    Declare Your <br />
                    Identity.
                  </h1>
                </header>

                <div className="space-y-8">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      className="group relative cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-32 w-32 rounded-[2.5rem] border border-white/10 object-cover cinematic-shadow transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-[2.5rem] bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Camera className="h-6 w-6 text-white" aria-hidden />
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onAvatarFile(e.target.files?.[0])}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="pl-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Seeker Moniker
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name the vessel..."
                      className="w-full rounded-2xl border border-white/5 bg-[#0f1219] py-5 px-8 font-[family-name:var(--font-display)] text-2xl italic text-white transition-all placeholder:text-slate-500 focus:border-white/20 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="pl-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Personal Mantra
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="A brief philosophy..."
                      className="no-scrollbar w-full resize-none rounded-2xl border border-white/5 bg-[#0f1219] py-5 px-8 text-sm italic text-white transition-all placeholder:text-slate-500 focus:border-white/20 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                  className="w-full rounded-2xl bg-white py-5 text-xs font-bold uppercase tracking-[0.4em] text-black shadow-xl shadow-white/5 transition-all hover:scale-[1.02] disabled:opacity-20"
                >
                  Continue to Alignment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className={stepClass}>
                <header className="text-center">
                  <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.5em] text-slate-400">
                    Manifestation II
                  </span>
                  <h1 className={headingSerif}>
                    Select Thy <br />
                    Pathways.
                  </h1>
                  <p className="mt-4 text-sm italic text-slate-400">
                    Select the domains you wish to expand (up to {MAX_INTERESTS}).
                  </p>
                </header>

                <div className="grid grid-cols-2 gap-4">
                  {PATHWAYS.map(({ id, name: pathwayName, desc, Icon }) => {
                    const selected = interests.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleInterest(id)}
                        className={cn(
                          "group relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-500",
                          selected
                            ? "border-transparent bg-white text-black"
                            : "border-white/5 bg-[#0f1219] text-slate-400 hover:border-white/20"
                        )}
                      >
                        <div className="relative z-10 flex flex-col gap-4">
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-current">
                              {pathwayName}
                            </p>
                            <p
                              className={cn(
                                "text-[9px] italic",
                                selected ? "opacity-80" : "opacity-60"
                              )}
                            >
                              {desc}
                            </p>
                          </div>
                        </div>
                        {selected ? (
                          <div className="absolute right-4 top-4">
                            <Check className="h-3 w-3" aria-hidden />
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-2xl border border-white/10 py-5 text-[10px] font-bold uppercase tracking-[0.4em] text-white transition-all hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={interests.length === 0}
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-2xl bg-white py-5 text-[10px] font-bold uppercase tracking-[0.4em] text-black shadow-xl shadow-white/5 transition-all hover:scale-[1.02] disabled:opacity-20"
                  >
                    Confirm Alignment
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={cn(stepClass, "text-center")}>
                <div className="mx-auto flex h-32 w-32 animate-float items-center justify-center rounded-full bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                  <Swords className="h-12 w-12" aria-hidden />
                </div>

                <div className="space-y-4">
                  <h2 className={headingSerif}>The Path is Open.</h2>
                  <p className="leading-relaxed italic text-slate-400">
                    Welcome,{" "}
                    <span className="font-bold text-white">{displayName}</span>. Your
                    alignment with the{" "}
                    <span className="italic text-white">{interests.length}</span>{" "}
                    pathways has been recorded. The Protocol begins now.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={completeOnboarding}
                  className="w-full rounded-2xl bg-white py-6 text-xs font-bold uppercase tracking-[0.5em] text-black shadow-2xl transition-all hover:scale-[1.05]"
                >
                  Enter SideQuest
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
