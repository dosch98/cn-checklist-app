-- Create admin_users table for simple username/password login
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  estimated_days INTEGER DEFAULT 14,
  categories JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  public_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'in_progress', 'completed', 'overdue')),
  due_date TIMESTAMP WITH TIME ZONE,
  categories JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for public token lookups
CREATE INDEX IF NOT EXISTS idx_checklists_public_token ON checklists(public_token);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (read-only for verification)
CREATE POLICY "Allow public read for login verification" ON admin_users
  FOR SELECT USING (true);

-- RLS Policies for templates (public read/write for admin - no auth required per user request)
CREATE POLICY "Allow public read on templates" ON templates
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on templates" ON templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on templates" ON templates
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on templates" ON templates
  FOR DELETE USING (true);

-- RLS Policies for checklists (public read/write)
CREATE POLICY "Allow public read on checklists" ON checklists
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on checklists" ON checklists
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on checklists" ON checklists
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on checklists" ON checklists
  FOR DELETE USING (true);
