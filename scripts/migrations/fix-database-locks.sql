-- Kill all active queries that are running for more than 5 minutes
-- Run this in the Supabase SQL Editor

-- First, check what's blocking
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    query_start,
    state,
    wait_event_type,
    wait_event,
    age(clock_timestamp(), query_start) AS query_age,
    LEFT(query, 100) AS query_snippet
FROM pg_stat_activity
WHERE state != 'idle'
    AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;

-- To terminate blocking queries (uncomment and modify PIDs as needed)
-- SELECT pg_terminate_backend(pid) 
-- FROM pg_stat_activity 
-- WHERE pid IN (/* add PIDs here */)
--     AND state != 'idle'
--     AND query_start < NOW() - INTERVAL '5 minutes';

-- Check for locks
SELECT 
    l.pid,
    l.mode,
    l.granted,
    a.usename,
    a.query_start,
    age(clock_timestamp(), a.query_start) AS lock_age,
    LEFT(a.query, 100) AS query_snippet
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted
ORDER BY a.query_start;

-- Reset all connections (CAREFUL - this will disconnect everyone)
-- SELECT pg_terminate_backend(pid) 
-- FROM pg_stat_activity 
-- WHERE datname = current_database()
--     AND pid != pg_backend_pid();