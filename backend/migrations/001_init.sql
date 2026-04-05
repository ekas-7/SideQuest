CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  trust_score INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  strength INTEGER NOT NULL DEFAULT 0,
  agility INTEGER NOT NULL DEFAULT 0,
  intelligence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_catalog (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  toughness INTEGER NOT NULL CHECK (toughness BETWEEN 1 AND 5),
  stat_focus TEXT NOT NULL CHECK (stat_focus IN ('strength', 'agility', 'intelligence'))
);

CREATE TABLE IF NOT EXISTS weekly_actions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  reroll_used BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS weekly_side_quests (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  slot SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 3),
  quest_id INTEGER NOT NULL REFERENCES quest_catalog(id),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'submitted', 'verified', 'rejected')),
  proof_description TEXT,
  proof_url TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start, slot)
);

CREATE TABLE IF NOT EXISTS verification_jobs (
  id SERIAL PRIMARY KEY,
  weekly_side_quest_id INTEGER NOT NULL UNIQUE REFERENCES weekly_side_quests(id) ON DELETE CASCADE,
  required_votes SMALLINT NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS verification_assignments (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES verification_jobs(id) ON DELETE CASCADE,
  voter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote BOOLEAN,
  responded_at TIMESTAMPTZ,
  trust_delta_applied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, voter_user_id)
);

INSERT INTO quest_catalog (title, description, toughness, stat_focus)
VALUES
  ('Morning Sprint', 'Run or brisk-walk for at least 20 minutes before noon.', 2, 'agility'),
  ('Strength Circuit', 'Complete 4 rounds of pushups, squats, and planks.', 3, 'strength'),
  ('Deep Work Block', 'Finish one uninterrupted 90-minute focus session.', 3, 'intelligence'),
  ('Skill Drill', 'Practice a useful skill for 45 minutes with notes.', 2, 'intelligence'),
  ('Cold Start Challenge', 'Do a difficult task first thing in the morning.', 2, 'strength'),
  ('No-Scroll Evening', 'Spend one evening with no social media and journal after.', 1, 'intelligence'),
  ('Mobility Quest', 'Complete a 30-minute mobility + stretching session.', 2, 'agility'),
  ('Hill or Stair Repeats', 'Do 8 rounds of hill/stair repeats with rest.', 4, 'agility'),
  ('Full Body Session', 'Complete a full body workout and track each set.', 4, 'strength'),
  ('Teach What You Learned', 'Share a concise write-up/video teaching one concept.', 3, 'intelligence'),
  ('Hard Conversation', 'Initiate one avoided but important conversation.', 5, 'strength'),
  ('Build in Public', 'Ship one tiny public artifact from your weekly goal.', 4, 'intelligence')
ON CONFLICT (title) DO NOTHING;
