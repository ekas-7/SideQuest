"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Show, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  API_BASE_URL,
  castVerificationVote,
  createUser,
  getReadableApiError,
  getVerificationAssignments,
  getWeeklyQuests,
  rerollWeeklyQuests,
  submitWeeklyQuestProof,
  type BackendUser,
  type CastVoteResponse,
  type SubmitProofResponse,
  type VerificationAssignment,
  type WeeklyQuest,
  type WeeklyQuestsResponse,
} from "@/lib/api";

type ProofDraft = {
  description: string;
  proofUrl: string;
};

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function buildStorageKey(clerkUserId: string) {
  return `sidequest:backend-user:${clerkUserId}`;
}

function getVoteResultText(result: CastVoteResponse): string {
  if (result.status === "pending") {
    return `Vote recorded — ${result.votesCollected}/${result.votesRequired} votes collected.`;
  }

  return `Vote finalized: ${result.status} (approvals ${result.approvals}, rejections ${result.rejections}).`;
}

function getProofResultText(result: SubmitProofResponse): string {
  return `Proof submitted! Verification job #${result.verificationJobId} created (${result.assignedVoters} voters, ${result.requiredVotes} needed).`;
}

export default function WhitePage() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [username, setUsername] = useState("");

  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

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

  const defaultUsername = useMemo(() => {
    const candidate =
      clerkUser?.username ||
      clerkUser?.firstName ||
      clerkUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "";

    return candidate.trim();
  }, [clerkUser]);

  const loadWeeklyQuests = useCallback(async (userId: string) => {
    setIsWeeklyLoading(true);
    setWeeklyError(null);

    try {
      const response = await getWeeklyQuests(userId, getTodayDate());
      setWeeklyData(response);
    } catch (error) {
      setWeeklyError(getReadableApiError(error));
    } finally {
      setIsWeeklyLoading(false);
    }
  }, []);

  const loadAssignments = useCallback(async (userId: string) => {
    setIsAssignmentsLoading(true);
    setAssignmentsError(null);

    try {
      const response = await getVerificationAssignments(userId);
      setAssignments(response.assignments);
    } catch (error) {
      setAssignmentsError(getReadableApiError(error));
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser?.id) {
      return;
    }

    const stored = window.localStorage.getItem(buildStorageKey(clerkUser.id));

    if (!stored) {
      setUsername(defaultUsername);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as BackendUser;
      setBackendUser(parsed);
      setUsername(parsed.username);
    } catch {
      window.localStorage.removeItem(buildStorageKey(clerkUser.id));
      setUsername(defaultUsername);
    }
  }, [clerkUser?.id, defaultUsername, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!backendUser?.id) {
      return;
    }

    void loadWeeklyQuests(backendUser.id);
    void loadAssignments(backendUser.id);
  }, [backendUser?.id, loadAssignments, loadWeeklyQuests]);

  const handleRegisterUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = username.trim();

    if (!trimmed) {
      setRegistrationError("Please enter a username.");
      return;
    }

    if (!clerkUser?.id) {
      setRegistrationError("You must be signed in before creating a user.");
      return;
    }

    setIsRegistering(true);
    setRegistrationError(null);
    setRegistrationSuccess(null);

    try {
      const response = await createUser({ username: trimmed });
      const createdUser = response.user;
      setBackendUser(createdUser);
      window.localStorage.setItem(
        buildStorageKey(clerkUser.id),
        JSON.stringify(createdUser)
      );
      setRegistrationSuccess(`User @${createdUser.username} created successfully.`);
      await Promise.all([
        loadWeeklyQuests(createdUser.id),
        loadAssignments(createdUser.id),
      ]);
    } catch (error) {
      setRegistrationError(getReadableApiError(error));
    } finally {
      setIsRegistering(false);
    }
  };

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

  const handleProofFieldChange = (
    weeklyQuestId: number,
    field: keyof ProofDraft,
    value: string
  ) => {
    setProofDrafts((prev) => ({
      ...prev,
      [weeklyQuestId]: {
        description: prev[weeklyQuestId]?.description ?? "",
        proofUrl: prev[weeklyQuestId]?.proofUrl ?? "",
        [field]: value,
      },
    }));
  };

  const handleSubmitProof = async (weeklyQuest: WeeklyQuest) => {
    if (!backendUser) {
      return;
    }

    const draft = proofDrafts[weeklyQuest.id] ?? { description: "", proofUrl: "" };
    const description = draft.description.trim();
    const proofUrl = draft.proofUrl.trim();

    if (!description) {
      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: "Please add a proof description.",
      }));
      return;
    }

    if (!proofUrl) {
      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: "Please add a proof URL.",
      }));
      return;
    }

    try {
      const parsedUrl = new URL(proofUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch {
      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: "Please provide a valid http(s) URL.",
      }));
      return;
    }

    setProofPendingByQuestId((prev) => ({ ...prev, [weeklyQuest.id]: true }));
    setProofStatusByQuestId((prev) => ({ ...prev, [weeklyQuest.id]: "Submitting..." }));

    try {
      const response = await submitWeeklyQuestProof(weeklyQuest.id, {
        userId: backendUser.id,
        description,
        proofUrl,
      });

      setProofStatusByQuestId((prev) => ({
        ...prev,
        [weeklyQuest.id]: getProofResultText(response),
      }));

      await loadWeeklyQuests(backendUser.id);
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

      await loadAssignments(backendUser.id);
    } catch (error) {
      setVoteStatusByJobId((prev) => ({
        ...prev,
        [jobId]: getReadableApiError(error),
      }));
    } finally {
      setVotePendingByJobId((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="liquid-glass rounded-2xl p-5 sm:p-6">
          <h1
            className="text-3xl tracking-tight sm:text-4xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            SideQuest MVP Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Backend: <span className="text-foreground">{API_BASE_URL}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in, create your SideQuest user, complete quests, and vote on
            verification jobs.
          </p>
        </section>

        <Show when="signed-out">
          <section className="liquid-glass rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl">Sign in required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please sign in with Clerk to continue.
            </p>
            <div className="mt-4">
              <SignInButton mode="modal">
                <Button className="rounded-full bg-primary text-primary-foreground">
                  Sign in
                </Button>
              </SignInButton>
            </div>
          </section>
        </Show>

        {isSignedIn && (
          <>
            <section className="liquid-glass rounded-2xl p-5 sm:p-6">
              <h2 className="text-xl">1) Register backend user</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a user once, then your weekly quests and voting dashboard
                will load automatically.
              </p>

              <form className="mt-4 flex flex-col gap-3 sm:max-w-md" onSubmit={handleRegisterUser}>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter username"
                  disabled={isRegistering || !!backendUser}
                />

                <Button
                  type="submit"
                  className="w-fit rounded-full bg-primary text-primary-foreground"
                  disabled={isRegistering || !!backendUser}
                >
                  {backendUser
                    ? `Connected as @${backendUser.username}`
                    : isRegistering
                      ? "Creating user..."
                      : "Create user"}
                </Button>
              </form>

              {registrationError && (
                <p className="mt-3 text-sm text-red-300">{registrationError}</p>
              )}
              {registrationSuccess && (
                <p className="mt-3 text-sm text-primary">{registrationSuccess}</p>
              )}
            </section>

            <section className="liquid-glass rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl">2) Weekly quests</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Current week: {weeklyData?.weekStart ?? "-"} • Source: {weeklyData?.source ?? "-"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    className="rounded-full border border-border bg-secondary"
                    onClick={() => backendUser && void loadWeeklyQuests(backendUser.id)}
                    disabled={!backendUser || isWeeklyLoading}
                  >
                    {isWeeklyLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                  <Button
                    className="rounded-full bg-primary text-primary-foreground"
                    onClick={handleReroll}
                    disabled={
                      !backendUser ||
                      isWeeklyLoading ||
                      isRerolling ||
                      !weeklyData ||
                      weeklyData.rerollUsed
                    }
                  >
                    {isRerolling
                      ? "Rerolling..."
                      : weeklyData?.rerollUsed
                        ? "Reroll used"
                        : "Reroll weekly quests"}
                  </Button>
                </div>
              </div>

              {weeklyError && <p className="mt-4 text-sm text-red-300">{weeklyError}</p>}

              {!weeklyError && weeklyData && weeklyData.quests.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">No quests assigned yet.</p>
              )}

              <div className="mt-4 grid gap-4">
                {weeklyData?.quests.map((weeklyQuest) => {
                  const draft = proofDrafts[weeklyQuest.id] ?? {
                    description: "",
                    proofUrl: "",
                  };
                  const isProofPending = proofPendingByQuestId[weeklyQuest.id] ?? false;
                  const canSubmitProof = ["assigned", "rejected"].includes(
                    weeklyQuest.status
                  );

                  return (
                    <article
                      key={weeklyQuest.id}
                      className="rounded-xl border border-border/70 bg-background/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg">{weeklyQuest.quest.title}</h3>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          status: {weeklyQuest.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {weeklyQuest.quest.description}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Slot {weeklyQuest.slot} • Toughness {weeklyQuest.quest.toughness} •
                        Focus {weeklyQuest.quest.statFocus}
                      </p>

                      <div className="mt-4 grid gap-2">
                        <Textarea
                          placeholder="Proof description"
                          value={draft.description}
                          onChange={(event) =>
                            handleProofFieldChange(
                              weeklyQuest.id,
                              "description",
                              event.target.value
                            )
                          }
                          disabled={!canSubmitProof || isProofPending}
                        />
                        <Input
                          placeholder="https://example.com/proof"
                          value={draft.proofUrl}
                          onChange={(event) =>
                            handleProofFieldChange(
                              weeklyQuest.id,
                              "proofUrl",
                              event.target.value
                            )
                          }
                          disabled={!canSubmitProof || isProofPending}
                        />
                        <Button
                          className="w-fit rounded-full bg-primary text-primary-foreground"
                          onClick={() => void handleSubmitProof(weeklyQuest)}
                          disabled={!canSubmitProof || isProofPending}
                        >
                          {isProofPending ? "Submitting proof..." : "Submit proof"}
                        </Button>
                        {proofStatusByQuestId[weeklyQuest.id] && (
                          <p className="text-sm text-muted-foreground">
                            {proofStatusByQuestId[weeklyQuest.id]}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="liquid-glass rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl">3) Verification dashboard</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Assignments for voter user ID: {backendUser?.id ?? "-"}
                  </p>
                </div>

                <Button
                  className="rounded-full border border-border bg-secondary"
                  onClick={() => backendUser && void loadAssignments(backendUser.id)}
                  disabled={!backendUser || isAssignmentsLoading}
                >
                  {isAssignmentsLoading ? "Refreshing..." : "Refresh assignments"}
                </Button>
              </div>

              {assignmentsError && (
                <p className="mt-4 text-sm text-red-300">{assignmentsError}</p>
              )}

              {!assignmentsError && !isAssignmentsLoading && assignments.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">No assignments yet.</p>
              )}

              <div className="mt-4 grid gap-3">
                {assignments.map((assignment) => {
                  const isVotePending = votePendingByJobId[assignment.jobId] ?? false;
                  const alreadyVoted = assignment.vote !== null;

                  return (
                    <article
                      key={assignment.id}
                      className="rounded-xl border border-border/70 bg-background/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base">Job #{assignment.jobId}</h3>
                        <span className="text-xs text-muted-foreground">
                          Assignment #{assignment.id}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Current vote: {assignment.vote === null ? "not voted" : assignment.vote ? "approve" : "reject"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          className="rounded-full bg-primary text-primary-foreground"
                          disabled={alreadyVoted || isVotePending}
                          onClick={() => void handleVote(assignment.jobId, true)}
                        >
                          {isVotePending ? "Submitting..." : "Approve"}
                        </Button>
                        <Button
                          className="rounded-full border border-border bg-secondary"
                          disabled={alreadyVoted || isVotePending}
                          onClick={() => void handleVote(assignment.jobId, false)}
                        >
                          Reject
                        </Button>
                      </div>

                      {voteStatusByJobId[assignment.jobId] && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {voteStatusByJobId[assignment.jobId]}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
