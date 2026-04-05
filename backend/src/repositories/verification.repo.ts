import type { QueryResultRow } from "pg";

import type { VerificationJob, VerificationJobStatus, VerificationVote } from "../models/verification.model.ts";
import { type QueryExecutor, db } from "../config/database.ts";

interface VerificationJobRow extends QueryResultRow {
  id: number;
  weekly_side_quest_id: number;
  required_votes: number;
  status: VerificationJobStatus;
  created_at: string;
  decided_at: string | null;
}

interface VerificationAssignmentRow extends QueryResultRow {
  id: number;
  job_id: number;
  voter_user_id: string;
  vote: boolean | null;
  responded_at: string | null;
  trust_delta_applied: boolean;
  created_at: string;
}

interface RespondedVoteRow extends QueryResultRow {
  id: number;
  voter_user_id: string;
  vote: boolean;
  responded_at: string;
}

const mapJob = (row: VerificationJobRow): VerificationJob => ({
  id: row.id,
  weeklySideQuestId: row.weekly_side_quest_id,
  requiredVotes: row.required_votes,
  status: row.status,
  createdAt: row.created_at,
  decidedAt: row.decided_at,
});

export interface VerificationAssignment {
  id: number;
  jobId: number;
  voterUserId: string;
  vote: boolean | null;
  respondedAt: string | null;
  trustDeltaApplied: boolean;
  createdAt: string;
}

const mapAssignment = (row: VerificationAssignmentRow): VerificationAssignment => ({
  id: row.id,
  jobId: row.job_id,
  voterUserId: row.voter_user_id,
  vote: row.vote,
  respondedAt: row.responded_at,
  trustDeltaApplied: row.trust_delta_applied,
  createdAt: row.created_at,
});

export const createVerificationJob = async (
  weeklySideQuestId: number,
  requiredVotes: number,
  executor: QueryExecutor = db,
): Promise<VerificationJob> => {
  const { rows } = await executor.query<VerificationJobRow>(
    `
      INSERT INTO verification_jobs (weekly_side_quest_id, required_votes)
      VALUES ($1, $2)
      ON CONFLICT (weekly_side_quest_id)
      DO UPDATE SET weekly_side_quest_id = EXCLUDED.weekly_side_quest_id
      RETURNING id, weekly_side_quest_id, required_votes, status, created_at, decided_at
    `,
    [weeklySideQuestId, requiredVotes],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to create verification job.");
  }

  return mapJob(row);
};

export const getVerificationJobById = async (
  id: number,
  executor: QueryExecutor = db,
): Promise<VerificationJob | null> => {
  const { rows } = await executor.query<VerificationJobRow>(
    `
      SELECT id, weekly_side_quest_id, required_votes, status, created_at, decided_at
      FROM verification_jobs
      WHERE id = $1
    `,
    [id],
  );

  return rows[0] ? mapJob(rows[0]) : null;
};

export const createVerificationAssignments = async (
  jobId: number,
  voterUserIds: string[],
  executor: QueryExecutor = db,
): Promise<void> => {
  const inserts = voterUserIds.map((voterUserId) =>
    executor.query(
      `
        INSERT INTO verification_assignments (job_id, voter_user_id)
        VALUES ($1, $2)
        ON CONFLICT (job_id, voter_user_id) DO NOTHING
      `,
      [jobId, voterUserId],
    ),
  );

  await Promise.all(inserts);
};

export const getAssignmentForVoter = async (
  jobId: number,
  voterUserId: string,
  executor: QueryExecutor = db,
): Promise<VerificationAssignment | null> => {
  const { rows } = await executor.query<VerificationAssignmentRow>(
    `
      SELECT id, job_id, voter_user_id, vote, responded_at, trust_delta_applied, created_at
      FROM verification_assignments
      WHERE job_id = $1 AND voter_user_id = $2
    `,
    [jobId, voterUserId],
  );

  return rows[0] ? mapAssignment(rows[0]) : null;
};

export const recordVoteForAssignment = async (
  assignmentId: number,
  vote: boolean,
  executor: QueryExecutor = db,
): Promise<void> => {
  await executor.query(
    `
      UPDATE verification_assignments
      SET vote = $2, responded_at = NOW()
      WHERE id = $1
    `,
    [assignmentId, vote],
  );
};

export const listRespondedVotesForJob = async (
  jobId: number,
  limit: number,
  executor: QueryExecutor = db,
): Promise<VerificationVote[]> => {
  const { rows } = await executor.query<RespondedVoteRow>(
    `
      SELECT id, voter_user_id, vote, responded_at
      FROM verification_assignments
      WHERE job_id = $1 AND responded_at IS NOT NULL
      ORDER BY responded_at ASC
      LIMIT $2
    `,
    [jobId, limit],
  );

  return rows.map((row) => ({
    assignmentId: row.id,
    voterUserId: row.voter_user_id,
    vote: row.vote,
    respondedAt: row.responded_at,
  }));
};

export const markVerificationJobDecision = async (
  jobId: number,
  approved: boolean,
  executor: QueryExecutor = db,
): Promise<void> => {
  await executor.query(
    `
      UPDATE verification_jobs
      SET status = $2, decided_at = NOW()
      WHERE id = $1
    `,
    [jobId, approved ? "approved" : "rejected"],
  );
};

export const markTrustDeltaAppliedForAssignments = async (
  assignmentIds: number[],
  executor: QueryExecutor = db,
): Promise<void> => {
  if (!assignmentIds.length) {
    return;
  }

  await executor.query(
    `
      UPDATE verification_assignments
      SET trust_delta_applied = TRUE
      WHERE id = ANY($1::int[])
    `,
    [assignmentIds],
  );
};

export const listAssignmentsForVoter = async (
  voterUserId: string,
  executor: QueryExecutor = db,
): Promise<VerificationAssignment[]> => {
  const { rows } = await executor.query<VerificationAssignmentRow>(
    `
      SELECT id, job_id, voter_user_id, vote, responded_at, trust_delta_applied, created_at
      FROM verification_assignments
      WHERE voter_user_id = $1
      ORDER BY created_at DESC
    `,
    [voterUserId],
  );

  return rows.map(mapAssignment);
};
