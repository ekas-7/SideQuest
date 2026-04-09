"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { ApiClientError, createUser, type BackendUser } from "@/lib/api";
import {
  buildOnboardingSessionKey,
  buildOnboardingStorageKey,
  isOnboardingInterest,
  type OnboardingInterest,
} from "@/lib/onboarding-data";

function buildBackendUserStorageKey(clerkUserId: string) {
  return `sidequest:backend-user:${clerkUserId}`;
}

type SideQuestContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  backendUser: BackendUser | null;
  onboardingInterests: OnboardingInterest[];
  isOnboardingComplete: boolean;
  saveOnboardingInterests: (interests: OnboardingInterest[]) => void;
};

const SideQuestContext = createContext<SideQuestContextValue | null>(null);

export function SideQuestProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const lastResolvedClerkUserIdRef = useRef<string | null>(null);

  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);

  const [onboardingInterests, setOnboardingInterests] = useState<OnboardingInterest[]>([]);
  const [onboardingSessionComplete, setOnboardingSessionComplete] = useState(false);

  const defaultUsername = useMemo(() => {
    const candidate =
      clerkUser?.username ||
      clerkUser?.firstName ||
      clerkUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "";

    return candidate.trim();
  }, [clerkUser]);

  const buildUsernameCandidate = useCallback(
    (suffix?: string) => {
      const baseSource = defaultUsername || clerkUser?.id?.slice(0, 8) || "adventurer";
      const sanitized = baseSource
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      const base = sanitized || "adventurer";

      if (!suffix) {
        return base;
      }

      return `${base}_${suffix}`.slice(0, 28);
    },
    [clerkUser?.id, defaultUsername]
  );

  const hydrateOnboardingState = useCallback(() => {
    if (!clerkUser?.id) {
      setOnboardingInterests([]);
      return;
    }

    const stored = window.localStorage.getItem(buildOnboardingStorageKey(clerkUser.id));

    if (!stored) {
      setOnboardingInterests([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      const interests = Array.isArray(parsed)
        ? parsed.filter(
            (entry): entry is OnboardingInterest =>
              typeof entry === "string" && isOnboardingInterest(entry)
          )
        : [];

      setOnboardingInterests(interests);
    } catch {
      window.localStorage.removeItem(buildOnboardingStorageKey(clerkUser.id));
      setOnboardingInterests([]);
    }
  }, [clerkUser?.id]);

  const saveOnboardingInterests = useCallback(
    (interests: OnboardingInterest[]) => {
      if (!clerkUser?.id) {
        return;
      }

      const uniqueInterests = Array.from(new Set(interests)).slice(0, 5);

      setOnboardingInterests(uniqueInterests);

      if (uniqueInterests.length === 0) {
        window.localStorage.removeItem(buildOnboardingStorageKey(clerkUser.id));
        window.sessionStorage.removeItem(buildOnboardingSessionKey(clerkUser.id));
        setOnboardingSessionComplete(false);
        return;
      }

      window.localStorage.setItem(
        buildOnboardingStorageKey(clerkUser.id),
        JSON.stringify(uniqueInterests)
      );
      window.sessionStorage.setItem(buildOnboardingSessionKey(clerkUser.id), "1");
      setOnboardingSessionComplete(true);
    },
    [clerkUser?.id]
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const currentClerkUserId = isSignedIn ? (clerkUser?.id ?? null) : null;

    if (lastResolvedClerkUserIdRef.current === currentClerkUserId) {
      return;
    }

    lastResolvedClerkUserIdRef.current = currentClerkUserId;

    setBackendUser(null);

    if (!currentClerkUserId) {
      setOnboardingInterests([]);
      setOnboardingSessionComplete(false);
    }
  }, [clerkUser?.id, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser?.id) {
      setOnboardingInterests([]);
      return;
    }

    let isCancelled = false;

    const hydrateBackendUser = async () => {
      try {
        const fallbackSuffix = clerkUser.id.slice(-4).toLowerCase();
        const candidates = [
          buildUsernameCandidate(),
          buildUsernameCandidate(fallbackSuffix),
        ];

        let resolvedUser: BackendUser | null = null;

        for (const candidate of candidates) {
          try {
            const response = await createUser({ username: candidate }, clerkUser.id);
            resolvedUser = response.user;
            break;
          } catch (error) {
            if (error instanceof ApiClientError && error.status === 409) {
              continue;
            }

            throw error;
          }
        }

        if (!resolvedUser) {
          throw new Error("Unable to initialize your profile automatically.");
        }

        if (isCancelled) {
          return;
        }

        setBackendUser(resolvedUser);
        window.localStorage.setItem(
          buildBackendUserStorageKey(clerkUser.id),
          JSON.stringify(resolvedUser)
        );
      } catch {
        if (isCancelled) {
          return;
        }

        const cached = window.localStorage.getItem(buildBackendUserStorageKey(clerkUser.id));

        if (cached) {
          try {
            const parsed = JSON.parse(cached) as BackendUser;
            setBackendUser(parsed);
            return;
          } catch {
            window.localStorage.removeItem(buildBackendUserStorageKey(clerkUser.id));
          }
        }
      }
    };

    void hydrateBackendUser();

    return () => {
      isCancelled = true;
    };
  }, [buildUsernameCandidate, clerkUser?.id, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser?.id) {
      return;
    }

    hydrateOnboardingState();
  }, [clerkUser?.id, hydrateOnboardingState, isLoaded, isSignedIn]);

  useLayoutEffect(() => {
    if (!clerkUser?.id) {
      setOnboardingSessionComplete(false);
      return;
    }

    setOnboardingSessionComplete(
      window.sessionStorage.getItem(buildOnboardingSessionKey(clerkUser.id)) === "1"
    );
  }, [clerkUser?.id]);

  const value: SideQuestContextValue = {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    backendUser,
    onboardingInterests,
    isOnboardingComplete: onboardingSessionComplete,
    saveOnboardingInterests,
  };

  return (
    <SideQuestContext.Provider value={value}>{children}</SideQuestContext.Provider>
  );
}

export function useSideQuest() {
  const ctx = useContext(SideQuestContext);
  if (!ctx) {
    throw new Error("useSideQuest must be used within SideQuestProvider");
  }
  return ctx;
}
