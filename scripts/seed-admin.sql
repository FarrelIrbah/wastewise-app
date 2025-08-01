-- Create admin user (run this after setting up authentication)
-- This should be run through Supabase dashboard or CLI

-- First, create the user through Supabase Auth (via dashboard or API)
-- Then update the user metadata to include admin role

-- Example of updating user metadata (replace with actual user ID)
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'admin@wastewise.com';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
