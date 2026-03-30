-- Optimization Indices
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_id ON tasks(status_id);
CREATE INDEX IF NOT EXISTS idx_task_execution_ended_at ON task_execution(ended_at);
CREATE INDEX IF NOT EXISTS idx_task_schedule_deadline ON task_schedule(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
