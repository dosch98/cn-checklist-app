-- Add task_states column to store task completion data
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS task_states JSONB DEFAULT '{}';
