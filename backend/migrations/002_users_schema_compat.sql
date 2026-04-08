CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS clerk_id TEXT;

UPDATE users
SET clerk_id = id
WHERE clerk_id IS NULL;

ALTER TABLE users
  ALTER COLUMN clerk_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND conname = 'users_clerk_id_key'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_clerk_id_key UNIQUE (clerk_id);
  END IF;
END $$;

DO $$
DECLARE
  user_id_type TEXT;
BEGIN
  SELECT data_type
  INTO user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'id';

  IF user_id_type = 'text' THEN
    ALTER TABLE users
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  ELSIF user_id_type = 'uuid' THEN
    ALTER TABLE users
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;
