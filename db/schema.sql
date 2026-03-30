-- db/schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tables Creation (Ensuring structures exist)
CREATE TABLE IF NOT EXISTS users (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null default '',
  email text unique not null,
  phone text unique,
  password_hash text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  profession text,
  birth_date date
);

CREATE TABLE IF NOT EXISTS task_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  icon text default 'list',
  is_permanent boolean default false,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS task_statuses (
  id smallint primary key,
  name text unique not null
);

INSERT INTO task_statuses values
(1, 'todo'), (2, 'in_progress'), (3, 'done'), (4, 'backlog')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS task_priorities (
  id smallint primary key,
  name text unique not null
);

INSERT INTO task_priorities values
(1, 'low'), (2, 'medium'), (3, 'high')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  list_id uuid references task_lists(id) on delete set null,
  title text not null,
  description text,
  status_id smallint references task_statuses(id),
  priority_id smallint references task_priorities(id),
  importance boolean default false,
  is_urgent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS task_schedule (
  task_id uuid primary key references tasks(id) on delete cascade,
  scheduled_date timestamptz,
  deadline timestamptz
);

CREATE TABLE IF NOT EXISTS task_execution (
  task_id uuid primary key references tasks(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  energy_cost integer check (energy_cost between 1 and 10)
);

CREATE TABLE IF NOT EXISTS contexts (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

CREATE TABLE IF NOT EXISTS task_contexts (
  task_id uuid references tasks(id) on delete cascade,
  context_id uuid references contexts(id) on delete cascade,
  primary key (task_id, context_id)
);

CREATE TABLE IF NOT EXISTS docs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  content jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS entity_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  source_entity text not null,
  source_id uuid not null,
  target_entity text not null,
  target_id uuid not null,
  relation_type text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS energy_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  total_capacity integer default 90,
  used_capacity integer default 0,
  mood_score integer check (mood_score between 1 and 5),
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- 2. State Mapping & Data Migration for 3NF Normalization
-- We wrap migrations in a DO block to safely check column existence

DO $$ 
BEGIN
  -- We add new columns before moving if they don't exist yet (for older DB versions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='status_id') THEN
    ALTER TABLE tasks ADD COLUMN status_id smallint REFERENCES task_statuses(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='priority_id') THEN
    ALTER TABLE tasks ADD COLUMN priority_id smallint REFERENCES task_priorities(id);
  END IF;

  -- Task Status Normalization
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='status') THEN
    UPDATE tasks SET status_id = ts.id FROM task_statuses ts WHERE tasks.status = ts.name;
    ALTER TABLE tasks DROP COLUMN status;
  END IF;

  -- Task Priority Normalization
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='priority') THEN
    UPDATE tasks SET priority_id = tp.id FROM task_priorities tp WHERE tasks.priority = tp.name;
    ALTER TABLE tasks DROP COLUMN priority;
  END IF;

  -- Default Missing Relations (Backfill if explicitly null)
  UPDATE tasks SET status_id = 1 WHERE status_id IS NULL;
  UPDATE tasks SET priority_id = 2 WHERE priority_id IS NULL;

  -- Task Schedule Normalization (1:1 relation offloading)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='deadline') THEN
    INSERT INTO task_schedule (task_id, deadline)
    SELECT id, deadline FROM tasks WHERE deadline IS NOT NULL ON CONFLICT DO NOTHING;
    ALTER TABLE tasks DROP COLUMN deadline;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='scheduled_date') THEN
    INSERT INTO task_schedule (task_id, scheduled_date)
    SELECT id, scheduled_date FROM tasks WHERE scheduled_date IS NOT NULL ON CONFLICT DO NOTHING;
    ALTER TABLE tasks DROP COLUMN scheduled_date;
  END IF;

  -- Task Execution Normalization (1:1 relation offloading)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='started_at') THEN
    INSERT INTO task_execution (task_id, started_at, ended_at, energy_cost)
    SELECT id, started_at, ended_at, COALESCE(energy_cost, 1) FROM tasks ON CONFLICT DO NOTHING;
    ALTER TABLE tasks DROP COLUMN started_at;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='ended_at') THEN
     ALTER TABLE tasks DROP COLUMN ended_at;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='energy_cost') THEN
    ALTER TABLE tasks DROP COLUMN energy_cost;
  END IF;

  -- Task Context Normalization (M:N relation offloading for strict 3NF)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='context') THEN
    INSERT INTO contexts (name) SELECT DISTINCT context FROM tasks WHERE context IS NOT NULL AND context != '' ON CONFLICT DO NOTHING;
    INSERT INTO task_contexts (task_id, context_id) 
    SELECT t.id, c.id FROM tasks t JOIN contexts c ON t.context = c.name ON CONFLICT DO NOTHING;
    ALTER TABLE tasks DROP COLUMN context;
  END IF;

END $$;

-- 3. Seed Permanent (System) Task Lists
-- These are smart/filter lists visible to all users (user_id IS NULL).
INSERT INTO task_lists (name, icon, color, is_permanent, user_id) VALUES
  ('Today',     'sun',          '#f59e0b', true, NULL),
  ('Scheduled', 'calendar',     '#3b82f6', true, NULL),
  ('All',       'layers',       '#8b5cf6', true, NULL),
  ('Important', 'star',         '#ef4444', true, NULL),
  ('Completed', 'check-circle', '#10b981', true, NULL)
ON CONFLICT DO NOTHING;
