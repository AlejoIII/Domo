SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('totpSecret', 'totpEnabled');
SELECT c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname LIKE 'audit_logs%' ORDER BY c.relname;
