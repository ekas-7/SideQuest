import type { PoolClient } from "../config/database.ts";
import { query } from "../config/database.ts";
import type { VerificationAssignment } from "../models/types.ts";

type JobRow = {
  id: number;
  weekly_quest_id: number;
  status: "pending" | "approved" | "rejected";
  approvals: number;
  rejections: number;
  required_votes: number;
};

export async function createVerificationJobRepo(weeklyQuestId: number, client?: PoolClient): Promise<number> {
  const result = await query<{ id: number }>(
    `
      INSERT INTO verification_jobs (weekly_quest_id, status, approvals, rejections, required_votes)
      VALUES ($1, 'pending', 0, 0, 5)
      RETURNING id
    `,
    [weeklyQuestId],
    client,
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create verification job");
  }

  return row.id;
}

export async function createAssignmentsRepo(jobId: number, voterUserIds: string[], client?: PoolClient): Promise<void> {
  for (const voterUserId of voterUserIds) {
    await query(
      `INSERT INTO verification_assignments (job_id, voter_user_id) VALUES ($1, $2)`,
      [jobId, voterUserId],
      client,
    );
  }
}

export async function getAssignmentsRepo(voterUserId: string, client?: PoolClient): Promise<VerificationAssignment[]> {
  const result = await query<{
    assignment_id: number;
    job_id: number;
    weekly_quest_id: number;
    proof_description: string;
    proof_url: string;
    quest_title: string;
    quest_description: string;
    submitted_at: Date;
  }>(
    `
      SELECT
        va.id AS assignment_id,
        va.job_id,
        vj.weekly_quest_id,
        COALESCE(wq.proof_description, '') AS proof_description,
        COALESCE(wq.proof_url, '') AS proof_url,
        qc.title AS quest_title,
        qc.description AS quest_description,
        COALESCE(wq.submitted_at, NOW()) AS submitted_at
      FROM verification_assignments va
      JOIN verification_jobs vj ON vj.id = va.job_id
      JOIN weekly_quests wq ON wq.id = vj.weekly_quest_id
      JOIN quest_catalog qc ON qc.id = wq.quest_id
      WHERE va.voter_user_id = $1
        AND va.vote IS NULL
        AND vj.status = 'pending'
      ORDER BY va.id ASC
    `,
    [voterUserId],
    client,
  );

  return result.rows.map((row) => ({
    assignmentId: row.assignment_id,
    jobId: row.job_id,
    weeklyQuestId: row.weekly_quest_id,
    proofDescription: row.proof_description,
    proofUrl: row.proof_url,
    questTitle: row.quest_title,
    questDescription: row.quest_description,
    submittedAt: row.submitted_at.toISOString(),
  }));
}

export async function getJobRepo(jobId: number, client?: PoolClient): Promise<JobRow | null> {
  const result = await query<JobRow>(
    `SELECT id, weekly_quest_id, status, approvals, rejections, required_votes FROM verification_jobs WHERE id = $1`,
    [jobId],
    client,
  );
  return result.rows[0] ?? null;
}

export async function ensureVoterAssignmentRepo(jobId: number, voterUserId: string, client?: PoolClient): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1 FROM verification_assignments
        WHERE job_id = $1 AND voter_user_id = $2 AND vote IS NULL
      ) AS exists
    `,
    [jobId, voterUserId],
    client,
  );
  return result.rows[0]?.exists ?? false;
}

export async function castVoteRepo(jobId: number, voterUserId: string, vote: boolean, client?: PoolClient): Promise<void> {
  await query(
    `
      UPDATE verification_assignments
      SET vote = $3, voted_at = NOW()
      WHERE job_id = $1 AND voter_user_id = $2 AND vote IS NULL
    `,
    [jobId, voterUserId, vote],
    client,
  );
}

export async function recomputeJobTallyRepo(jobId: number, client?: PoolClient): Promise<JobRow> {
  const result = await query<JobRow>(
    `
      UPDATE verification_jobs vj
      SET approvals = tally.approvals,
          rejections = tally.rejections
      FROM (
        SELECT
          job_id,
          COUNT(*) FILTER (WHERE vote = TRUE)::int AS approvals,
          COUNT(*) FILTER (WHERE vote = FALSE)::int AS rejections
        FROM verification_assignments
        WHERE job_id = $1
        GROUP BY job_id
      ) AS tally
      WHERE vj.id = tally.job_id
      RETURNING vj.id, vj.weekly_quest_id, vj.status, vj.approvals, vj.rejections, vj.required_votes
    `,
    [jobId],
    client,
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to recompute verification tally");
  }

  return row;
}

export async function finalizeJobRepo(
  jobId: number,
  status: "approved" | "rejected",
  client?: PoolClient,
): Promise<void> {
  await query(
    `UPDATE verification_jobs SET status = $2, decided_at = NOW() WHERE id = $1`,
    [jobId, status],
    client,
  );
}

export async function listCastVotesRepo(
  jobId: number,
  client?: PoolClient,
): Promise<{ voterUserId: string; vote: boolean }[]> {
  const result = await query<{ voter_user_id: string; vote: boolean }>(
    `
      SELECT voter_user_id, vote
      FROM verification_assignments
      WHERE job_id = $1 AND vote IS NOT NULL
    `,
    [jobId],
    client,
  );

  return result.rows.map((row) => ({ voterUserId: row.voter_user_id, vote: row.vote }));
}

export async function updateUserTrustScoreRepo(
  voterUserId: string,
  delta: number,
  client?: PoolClient,
): Promise<void> {
  await query(
    `UPDATE users SET trust_score = trust_score + $2 WHERE id = $1`,
    [voterUserId, delta],
    client,
  );
}

export type { JobRow };
