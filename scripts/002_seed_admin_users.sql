-- Seed admin users with password 'comnovorocks'
-- Using simple hash for demo purposes (in production, use proper bcrypt)
INSERT INTO admin_users (username, password_hash, display_name) VALUES
  ('schweizer', 'comnovorocks', 'Schweizer'),
  ('hille', 'comnovorocks', 'Hille'),
  ('lammering', 'comnovorocks', 'Lammering')
ON CONFLICT (username) DO NOTHING;
