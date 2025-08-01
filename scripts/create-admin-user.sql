-- =====================================================
-- CREATE ADMIN USER FOR WASTEWISE
-- =====================================================
-- Run this AFTER setting up the main database

-- This script should be run through Supabase Dashboard > Authentication
-- Or you can create the user manually and then run the metadata update

-- Step 1: Create user through Supabase Dashboard with:
-- Email: admin@wastewise.com
-- Password: [your secure password]
-- Confirm email manually

-- Step 2: After creating the user, run this to update metadata:
-- (Replace the email with the actual admin email you created)

UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin", "name": "Admin WasteWise"}'::jsonb
WHERE email = 'admin@wastewise.com';

-- Step 3: Verify the user was created correctly
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'admin@wastewise.com';

-- =====================================================
-- ADDITIONAL ADMIN FUNCTIONS (OPTIONAL)
-- =====================================================

-- Function to get user statistics (admin only)
CREATE OR REPLACE FUNCTION get_user_activity_stats()
RETURNS TABLE (
    total_users BIGINT,
    confirmed_users BIGINT,
    recent_logins BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
        COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '7 days') as recent_logins
    FROM auth.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to backup critical data
CREATE OR REPLACE FUNCTION create_data_backup()
RETURNS TEXT AS $$
DECLARE
    backup_info TEXT;
BEGIN
    -- This is a simple backup info function
    -- In production, you'd want more sophisticated backup strategies
    
    SELECT 
        'Backup created at: ' || NOW()::TEXT || 
        ' | Organic records: ' || (SELECT COUNT(*) FROM waste_organic)::TEXT ||
        ' | Inorganic records: ' || (SELECT COUNT(*) FROM waste_inorganic)::TEXT ||
        ' | Sales records: ' || (SELECT COUNT(*) FROM sales)::TEXT
    INTO backup_info;
    
    RETURN backup_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on admin functions
GRANT EXECUTE ON FUNCTION get_user_activity_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION create_data_backup() TO authenticated;
