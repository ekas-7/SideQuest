CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  trust_score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  xp INT NOT NULL DEFAULT 0,
  strength INT NOT NULL DEFAULT 0,
  agility INT NOT NULL DEFAULT 0,
  intelligence INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS onboarding_suggestions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_catalog (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  toughness INT NOT NULL CHECK (toughness >= 1),
  stat_focus TEXT NOT NULL CHECK (stat_focus IN ('strength', 'agility', 'intelligence'))
);

CREATE TABLE IF NOT EXISTS weekly_quests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  slot SMALLINT NOT NULL CHECK (slot >= 1 AND slot <= 3),
  status TEXT NOT NULL CHECK (status IN ('assigned', 'submitted', 'verified', 'rejected')),
  quest_id INT NOT NULL REFERENCES quest_catalog(id),
  proof_description TEXT,
  proof_url TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start, slot)
);

CREATE TABLE IF NOT EXISTS quest_rerolls (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS verification_jobs (
  id BIGSERIAL PRIMARY KEY,
  weekly_quest_id BIGINT UNIQUE NOT NULL REFERENCES weekly_quests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  approvals INT NOT NULL DEFAULT 0,
  rejections INT NOT NULL DEFAULT 0,
  required_votes INT NOT NULL DEFAULT 5,
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS verification_assignments (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES verification_jobs(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote BOOLEAN,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voted_at TIMESTAMPTZ,
  UNIQUE(job_id, voter_user_id)
);

CREATE TABLE IF NOT EXISTS user_stat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('streak', 'xp', 'trust')),
  value INT NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, metric, recorded_at)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO quest_catalog (title, description, toughness, stat_focus)
VALUES
  ('10 Push-Ups', 'Complete 10 strict push-ups.', 1, 'strength'),
  ('1km Jog', 'Jog or run 1 kilometer.', 2, 'agility'),
  ('Read 20 Pages', 'Read at least 20 pages of a useful book.', 1, 'intelligence'),
  ('30-Min Deep Work', 'Do 30 minutes of uninterrupted focus work.', 2, 'intelligence'),
  ('Bodyweight Circuit', 'Complete a 12-minute bodyweight circuit.', 3, 'strength'),
  ('Agility Ladder', 'Do a 10-minute agility footwork session.', 2, 'agility')
ON CONFLICT DO NOTHING;
