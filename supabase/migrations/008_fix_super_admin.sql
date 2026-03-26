-- Fix: ensure all James accounts are super_admin
UPDATE users SET super_admin = true WHERE first_name = 'James' AND last_name = 'Rolon';
