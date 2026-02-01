-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. EMAILS TABLE (Dependencies: auth.users)
create table public.emails (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  outlook_id text not null,
  subject text,
  sender text,
  received_at timestamptz,
  created_at timestamptz default now(),

  unique(user_id, outlook_id) -- Prevent duplicates per user
);

alter table public.emails enable row level security;

create policy "Users can view their own emails" 
on public.emails for select 
using (auth.uid() = user_id);

create policy "Users can insert their own emails" 
on public.emails for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own emails" 
on public.emails for update 
using (auth.uid() = user_id);


-- 2. TASK LISTS TABLE (Dependencies: auth.users)
create table public.task_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  color text default '#6366f1',
  icon text default 'list',
  created_at timestamptz default now()
);

alter table public.task_lists enable row level security;

create policy "Users can view their own lists" 
on public.task_lists for select 
using (auth.uid() = user_id);

create policy "Users can insert their own lists" 
on public.task_lists for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own lists" 
on public.task_lists for update 
using (auth.uid() = user_id);

create policy "Users can delete their own lists" 
on public.task_lists for delete 
using (auth.uid() = user_id);


-- 3. TASKS TABLE (Dependencies: auth.users, public.task_lists)
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  list_id uuid references public.task_lists(id),
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'done', 'backlog')) default 'todo',
  energy_cost integer check (energy_cost >= 1 and energy_cost <= 10),
  context text, 
  priority text check (priority in ('High', 'Medium', 'Low')) default 'Medium',
  deadline timestamptz,
  scheduled_date timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  importance boolean default false,
  is_urgent boolean default false,
  linked_email_id uuid references public.emails(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks" 
on public.tasks for select 
using (auth.uid() = user_id);

create policy "Users can insert their own tasks" 
on public.tasks for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own tasks" 
on public.tasks for update 
using (auth.uid() = user_id);

create policy "Users can delete their own tasks" 
on public.tasks for delete 
using (auth.uid() = user_id);


-- 3. DOCS TABLE (Dependencies: auth.users)
create table public.docs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  content jsonb, -- Tiptap JSON content
  last_edited timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.docs enable row level security;

create policy "Users can view their own docs" 
on public.docs for select 
using (auth.uid() = user_id);

create policy "Users can insert their own docs" 
on public.docs for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own docs" 
on public.docs for update 
using (auth.uid() = user_id);

create policy "Users can delete their own docs" 
on public.docs for delete 
using (auth.uid() = user_id);


-- 4. ENERGY LOGS TABLE (Dependencies: auth.users)
create table public.energy_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  date date not null default CURRENT_DATE,
  total_capacity integer default 30,
  used_capacity integer default 0,
  mood_score integer check (mood_score >= 1 and mood_score <= 5),
  created_at timestamptz default now(),

  unique(user_id, date) -- One log per user per day
);

alter table public.energy_logs enable row level security;

create policy "Users can view their own energy logs" 
on public.energy_logs for select 
using (auth.uid() = user_id);

create policy "Users can insert their own energy logs" 
on public.energy_logs for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own energy logs" 
on public.energy_logs for update 
using (auth.uid() = user_id);


-- 5. LINKED TASKS TABLE (Dependencies: auth.users, public.emails, public.docs)
create table public.linked_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  source_type text check (source_type in ('email', 'document')) not null,
  source_email_id uuid references public.emails(id),
  source_doc_id uuid references public.docs(id),
  status text check (status in ('pending', 'converted', 'dismissed')) default 'pending',
  created_at timestamptz default now(),

  constraint check_source check (
    (source_type = 'email' and source_email_id is not null) or 
    (source_type = 'document' and source_doc_id is not null)
  )
);

alter table public.linked_tasks enable row level security;

create policy "Users can view their own linked tasks" 
on public.linked_tasks for select 
using (auth.uid() = user_id);

create policy "Users can insert their own linked tasks" 
on public.linked_tasks for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own linked tasks" 
on public.linked_tasks for update 
using (auth.uid() = user_id);

create policy "Users can delete their own linked tasks" 
on public.linked_tasks for delete 
using (auth.uid() = user_id);

