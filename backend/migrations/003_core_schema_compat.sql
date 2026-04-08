CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  users_id_type text;
BEGIN
  SELECT data_type
  INTO users_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'id';

  IF users_id_type IS NULL THEN
    RAISE EXCEPTION 'users.id column not found';
  END IF;

  IF to_regclass('public.weekly_quests') IS NULL THEN
    EXECUTE format(
      'CREATE TABLE public.weekly_quests (
        id BIGSERIAL PRIMARY KEY,
        user_id %s NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        week_start DATE NOT NULL,
        slot SMALLINT NOT NULL CHECK (slot >= 1 AND slot <= 3),
        status TEXT NOT NULL CHECK (status IN (''assigned'', ''submitted'', ''verified'', ''rejected'')),
        quest_id INT NOT NULL REFERENCES public.quest_catalog(id),
        proof_description TEXT,
        proof_url TEXT,
        submitted_at TIMESTAMPTZ,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, week_start, slot)
      )',
      CASE
        WHEN users_id_type = 'uuid' THEN 'UUID'
        ELSE 'TEXT'
      END
    );
  END IF;

  IF to_regclass('public.quest_rerolls') IS NULL THEN
    EXECUTE format(
      'CREATE TABLE public.quest_rerolls (
        user_id %s NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        week_start DATE NOT NULL,
        used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(user_id, week_start)
      )',
      CASE
        WHEN users_id_type = 'uuid' THEN 'UUID'
        ELSE 'TEXT'
      END
    );
  END IF;

  IF to_regclass('public.user_stat_history') IS NULL THEN
    EXECUTE format(
      'CREATE TABLE public.user_stat_history (
        id BIGSERIAL PRIMARY KEY,
        user_id %s NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        metric TEXT NOT NULL CHECK (metric IN (''streak'', ''xp'', ''trust'')),
        value INT NOT NULL,
        recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
        UNIQUE(user_id, metric, recorded_at)
      )',
      CASE
        WHEN users_id_type = 'uuid' THEN 'UUID'
        ELSE 'TEXT'
      END
    );
  END IF;

  IF to_regclass('public.notifications') IS NULL THEN
    EXECUTE format(
      'CREATE TABLE public.notifications (
        id BIGSERIAL PRIMARY KEY,
        user_id %s NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )',
      CASE
        WHEN users_id_type = 'uuid' THEN 'UUID'
        ELSE 'TEXT'
      END
    );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.verification_jobs') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'verification_jobs'
         AND column_name = 'weekly_quest_id'
     ) THEN
    IF to_regclass('public.verification_jobs_legacy') IS NULL THEN
      ALTER TABLE public.verification_jobs RENAME TO verification_jobs_legacy;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.verification_jobs (
  id BIGSERIAL PRIMARY KEY,
  weekly_quest_id BIGINT UNIQUE NOT NULL REFERENCES public.weekly_quests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  approvals INT NOT NULL DEFAULT 0,
  rejections INT NOT NULL DEFAULT 0,
  required_votes INT NOT NULL DEFAULT 5,
  decided_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF to_regclass('public.verification_assignments') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'verification_assignments'
         AND column_name = 'voted_at'
     ) THEN
    IF to_regclass('public.verification_assignments_legacy') IS NULL THEN
      ALTER TABLE public.verification_assignments RENAME TO verification_assignments_legacy;
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  users_id_type text;
BEGIN
  SELECT data_type
  INTO users_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'id';

  IF to_regclass('public.verification_assignments') IS NULL THEN
    EXECUTE format(
      'CREATE TABLE public.verification_assignments (
        id BIGSERIAL PRIMARY KEY,
        job_id BIGINT NOT NULL REFERENCES public.verification_jobs(id) ON DELETE CASCADE,
        voter_user_id %s NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        vote BOOLEAN,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        voted_at TIMESTAMPTZ,
        UNIQUE(job_id, voter_user_id)
      )',
      CASE
        WHEN users_id_type = 'uuid' THEN 'UUID'
        ELSE 'TEXT'
      END
    );
  END IF;
END $$;
