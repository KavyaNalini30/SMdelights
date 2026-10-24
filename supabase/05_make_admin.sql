-- =============================================================================
-- SM Delights — 05_make_admin.sql
-- Run LAST, after you have signed up on the website with the email you want to
-- use as admin. Replace the email below, then run. Repeat for each admin.
-- =============================================================================

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'REPLACE-WITH-YOUR-EMAIL@example.com');

-- Check: should show your email with role = admin.
select u.email, p.role
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin';

-- To remove admin access later:
-- update public.profiles set role = 'customer'
-- where id = (select id from auth.users where email = 'someone@example.com');
