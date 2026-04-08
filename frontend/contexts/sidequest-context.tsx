"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import {
  ApiClientError,
  castVerificationVote,
  createUser,
  getReadableApiError,
  getVerificationAssignments,
  getWeeklyQuests,
  rerollWeeklyQuests,
  submitWeeklyQuestProof,
  uploadProofPhoto,
  type BackendUser,
  type VerificationAssignment,
  type WeeklyQuest,
  type WeeklyQuestsResponse,
} from "@/lib/api";
import {
  buildStorageKey,
  getProofResultText,
  getTodayDate,
  getVoteResultText,
} from "@/lib/dashboard-utils";
import {
  buildOnboardingStorageKey,
  generateQuestSuggestions,
  isOnboardingInterest,
  type OnboardingInterest,
  type SuggestedSideQuest,
} from "@/lib/onboarding-data";

type ProofDraft = {
  description: string;
  file: File | null;
};

type SideQuestContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  backendUser: BackendUser | null;
  registrationError: string | null;
  registrationSuccess: string | null;
  isRegistering: boolean;
  handleRegisterUser: () => Promise<void>;
  weeklyData: WeeklyQuestsResponse | null;
  weeklyError: string | null;
  isWeeklyLoading: boolean;
  isRerolling: boolean;
  loadWeeklyQuests: () => Promise<void>;
  handleReroll: () => Promise<void>;
  assignments: VerificationAssignment[];
  assignmentsError: string | null;
  isAssignmentsLoading: boolean;
  loadAssignments: () => Promise<void>;
  proofDrafts: Record<number, ProofDraft>;
  proofPendingByQuestId: Record<number, boolean>;
  proofStatusByQuestId: Record<number, string>;
  handleProofDescriptionChange: (weeklyQuestId: number, value: string) => void;
  handleProofFileChange: (weeklyQuestId: number, file: File | null) => void;
  handleSubmitProof: (weeklyQuest: WeeklyQuest) => Promise<void>;
  votePendingByJobId: Record<number, boolean>;
  voteStatusByJobId: Record<number, string>;
  handleVote: (jobId: number, vote: boolean) => Promise<void>;
  onboardingInterests: OnboardingInterest[];
  suggestedSideQuests: SuggestedSideQuest[];
  isOnboardingComplete: boolean;
  saveOnboardingInterests: (interests: OnboardingInterest[]) => void;
};

const SideQuestContext = createContext<SideQuestContextValue | null>(null);

export function SideQuestProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);

  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const isAutoCreatingProfileRef = useRef(false);

  const [weeklyData, setWeeklyData] = useState<WeeklyQuestsResponse | null>(null);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);

  const [assignments, setAssignments] = useState<VerificationAssignment[]>([]);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  const [proofDrafts, setProofDrafts] = useState<Record<number, ProofDraft>>({});
  const [proofPendingByQuestId, setProofPendingByQuestId] = useState<
    Record<number, boolean>
  >({});
  const [proofStatusByQuestId, setProofStatusByQuestId] = useState<
    Record<number, string>
  >({});

  const [votePendingByJobId, setVotePendingByJobId] = useState<
    Record<number, boolean>
  >({});
  const [voteStatusByJobId, setVoteStatusByJobId] = useState<Record<number, string>>(
    {}
  );

  const [onboardingInterests, setOnboardingInterests] = useState<
    OnboardingInterest[]
  >([]);
  const [suggestedSideQuests, setSuggestedSideQuests] = useState<
    SuggestedSideQuest[]
  >([]);

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
      setSuggestedSideQuests([]);
      return;
    }

    const stored = window.localStorage.getItem(buildOnboardingStorageKey(clerkUser.id));

    if (!stored) {
      setOnboardingInterests([]);
      setSuggestedSideQuests([]);
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
      setSuggestedSideQuests(generateQuestSuggestions(interests));
    } catch {
      window.localStorage.removeItem(buildOnboardingStorageKey(clerkUser.id));
      setOnboardingInterests([]);
      setSuggestedSideQuests([]);
    }
  }, [clerkUser?.id]);

  const saveOnboardingInterests = useCallback(
    (interests: OnboardingInterest[]) => {
      if (!clerkUser?.id) {
        return;
      }

      const uniqueInterests = Array.from(new Set(interests)).slice(0, 5);
      const nextSuggestions = generateQuestSuggestions(uniqueInterests);

      setOnboardingInterests(uniqueInterests);
      setSuggestedSideQuests(nextSuggestions);

      if (uniqueInterests.length === 0) {
        window.localStorage.removeItem(buildOnboardingStorageKey(clerkUser.id));
        return;
      }

      window.localStorage.setItem(
        buildOnboardingStorageKey(clerkUser.id),
        JSON.stringify(uniqueInterests)
      );
    },
    [clerkUser?.id]
  );

  const handleRegisterUser = useCallback(async () => {
    if (!clerkUser?.id || backendUser?.id || isAutoCreatingProfileRef.current) {
      return;
    }

    isAutoCreatingProfileRef.current = true;
    setIsRegistering(true);
    setRegistrationError(null);
    setRegistrationSuccess(null);

    const fallbackSuffix = clerkUser.id.slice(-4).toLowerCase();
    const candidates = [
      buildUsernameCandidate(),
      buildUsernameCandidate(fallbackSuffix),
    ];

    try {
      let createdUser: BackendUser | null = null;

      for (const candidate of candidates) {
        try {
          const response = await createUser({ username: candidate });
          createdUser = response.user;
          break;
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 409) {
            continue;
          }

          throw error;
        }
      }

      if (!createdUser) {
        throw new Error("Unable to create profile automatically. Please retry.");
      }

      setBackendUser(createdUser);
      window.localStorage.setItem(
        buildStorageKey(clerkUser.id),
        JSON.stringify(createdUser)
      );
      setRegistrationSuccess(`Welcome, @${createdUser.username}. Your quests are ready.`);
      await Promise.all([
        getWeeklyQuests(createdUser.id, getTodayDate()).then(setWeeklyData),
        getVerificationAssignments(createdUser.id).then((r) =>
          setAssignments(r.assignments)
        ),
      ]);
    } catch (error) {
      setRegistrationError(getReadableApiError(error));
    } finally {
      setIsRegistering(false);
      isAutoCreatingProfileRef.current = false;
    }
  }, [backendUser?.id, buildUsernameCandidate, clerkUser?.id]);

  const loadWeeklyQuests = useCallback(async () => {
    if (!backendUser?.id) {
      return;
    }

    setIsWeeklyLoading(true);
    setWeeklyError(null);

    try {
      const response = await getWeeklyQuests(backendUser.id, getTodayDate());
      setWeeklyData(response);
    } catch (error) {
      setWeeklyError(getReadableApiError(error));
    } finally {
      setIsWeeklyLoading(false);
    }
  }, [backendUser?.id]);

  const loadAssignments = useCallback(async () => {
    if (!backendUser?.id) {
      return;
    }

    setIsAssignmentsLoading(true);
    setAssignmentsError(null);

    try {
      const response = await getVerificationAssignments(backendUser.id);
      setAssignments(response.assignments);
    } catch (error) {
      setAssignmentsError(getReadableApiError(error));
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, [backendUser?.id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser?.id) {
      setOnboardingInterests([]);
      setSuggestedSideQuests([]);
      return;
    }

    const stored = window.localStorage.getItem(buildStorageKey(clerkUser.id));

    if (!stored) {
      void handleRegisterUser();
      return;
    }

    try {
      const parsed = JSON.parse(stored) as BackendUser;
      setBackendUser(parsed);
    } catch {
      window.localStorage.removeItem(buildStorageKey(clerkUser.id));
      void handleRegisterUser();
    }
  }, [clerkUser?.id, handleRegisterUser, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser?.id) {
      return;
    }

    hydrateOnboardingState();
  }, [clerkUser?.id, hydrateOnboardingState, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!backendUser?.id) {
      return;
    }

    void loadWeeklyQuests();
    void loadAssignments();
  }, [backendUser?.id, loadAssignments, loadWeeklyQuests]);

  const handleReroll = async () => {
    if (!backendUser) {
      return;
    }

    setIsRerolling(true);
    setWeeklyError(null);

    try {
      const response = await rerollWeeklyQuests(backendUser.id, getTodayDate());
      setWeeklyData(response);
    } catch (error) {
      setWeeklyError(getReadableApiError(error));
    } finally {
      setIsRerolling(false);
    }
  };

  const handleProofDescriptionChange = (weeklyQuestId: number, value: string) => {
    setProofDrafts((prev) => ({
      ...prev,
      [weeklyQuestId]: {
        description: value,
        file: prev[weeklyQuestId]?.file ?? null,
      },
    }));
  };

  const handleProofFileChange = (weeklyQuestId: number, file: File | null) => {
    setProofDrafts((prev) => ({
      ...prev,
      [weeklyQuestId]: {
        description: prev[weeklyQuestId]?.description ?? "",
        file,
      },
    }));
  };

  const handleSubmitProof = async (weeklyQuest: WeeklyQuest) => {
    if (!backendUser) {
      return;
    }

    const draft = proofDrafts[weeklyQuest.id] ?? { description: "", file: null };
    const description = draft.description.trim();
    const proofFile = draft.file;

    if (!description) {
      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: "Please add a proof description.",
      }));
      return;
    }

    if (!proofFile) {
      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: "Please choose a proof photo.",
      }));
      return;
    }

    setProofPendingByQuestId((prev) => ({ ...prev, [weeklyQuest.id]: true }));
    setProofStatusByQuestId((prev) => ({
      ...prev,
      [weeklyQuest.id]: "Uploading photo...",
    }));

    try {
      const { url: proofUrl } = await uploadProofPhoto(proofFile);

      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: "Submitting proof...",
      }));

      const response = await submitWeeklyQuestProof(weeklyQuest.id, {
        userId: backendUser.id,
        description,
        proofUrl,
      });

      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: getProofResultText(response),
      }));

      setProofDrafts((prev) => {
        const next = { ...prev };
        delete next[weeklyQuest.id];
        return next;
      });

      await loadWeeklyQuests();
    } catch (error) {
      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: getReadableApiError(error),
      }));
    } finally {
      setProofPendingByQuestId((prev) => ({ ...prev, [weeklyQuest.id]: false }));
    }
  };

  const handleVote = async (jobId: number, vote: boolean) => {
    if (!backendUser) {
      return;
    }

    setVotePendingByJobId((prev) => ({ ...prev, [jobId]: true }));
    setVoteStatusByJobId((prev) => ({ ...prev, [jobId]: "Submitting vote..." }));

    try {
      const response = await castVerificationVote(jobId, {
        voterUserId: backendUser.id,
        vote,
      });

      setVoteStatusByJobId((prev) => ({
        ...prev,
        [jobId]: getVoteResultText(response),
      }));

      await loadAssignments();
    } catch (error) {
      setVoteStatusByJobId((prev) => ({
        ...prev,
        [jobId]: getReadableApiError(error),
      }));
    } finally {
      setVotePendingByJobId((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const value: SideQuestContextValue = {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    backendUser,
    registrationError,
    registrationSuccess,
    isRegistering,
    handleRegisterUser,
    weeklyData,
    weeklyError,
    isWeeklyLoading,
    isRerolling,
    loadWeeklyQuests,
    handleReroll,
    assignments,
    assignmentsError,
    isAssignmentsLoading,
    loadAssignments,
    proofDrafts,
    proofPendingByQuestId,
    proofStatusByQuestId,
    handleProofDescriptionChange,
    handleProofFileChange,
    handleSubmitProof,
    votePendingByJobId,
    voteStatusByJobId,
    handleVote,
    onboardingInterests,
    suggestedSideQuests,
    isOnboardingComplete: onboardingInterests.length > 0,
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
