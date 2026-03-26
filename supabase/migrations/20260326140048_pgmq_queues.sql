-- pgmq Queue Setup Migration
-- Creates the durable message queue for agent task dispatch.
-- Part of Phase 1 Plan 02: Agent Runtime Infrastructure
--
-- Architecture: pgmq is the durable bus for guaranteed task delivery.
-- Realtime Broadcast is reserved for UI notifications only (ephemeral).
-- pg_cron + pg_net schedules periodic queue processing via Edge Function.

-- Enable required extensions
-- pgmq: durable PostgreSQL-native message queue with exactly-once delivery
-- pg_cron: scheduled job execution within PostgreSQL
-- pg_net: HTTP requests from PostgreSQL (used by pg_cron to invoke Edge Functions)
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the agent task queue
-- Messages in this queue contain task_id, company_id, agent_type, action, input
-- Visibility timeout ensures failed tasks become available for retry automatically
SELECT pgmq.create('agent_tasks');

-- Store project URL and service role key in Supabase vault
-- IMPORTANT: Replace these placeholder values with real secrets via Supabase Dashboard
-- Dashboard > Project Settings > Vault > Add Secret
-- These secrets are read by pg_cron to authenticate Edge Function invocations
SELECT vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',  -- Replace with actual project URL
  'project_url'
);
SELECT vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY_HERE',  -- Replace with actual service role key
  'service_role_key'
);

-- Schedule pg_cron job to process the agent task queue every minute
-- Note: pg_cron on Supabase supports minute-level granularity only (5-field cron syntax).
-- Sub-minute scheduling (e.g., every 30 seconds) is NOT supported.
-- The worker processes up to 5 messages per invocation to stay within
-- the 150-second Edge Function timeout.
SELECT cron.schedule(
  'process-agent-tasks',
  '* * * * *',  -- Every minute (minimum pg_cron interval)
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/agent-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);

-- RLS policy for Realtime messages
-- Authenticated users can receive Realtime Broadcast messages (used for UI notifications only)
-- Note: The actual agent task dispatch uses pgmq (durable), NOT Realtime Broadcast (ephemeral)
DO $$
BEGIN
  -- Only create the policy if the realtime schema and messages table exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'realtime' AND table_name = 'messages'
  ) THEN
    EXECUTE '
      CREATE POLICY "Authenticated users can receive realtime messages"
        ON realtime.messages
        FOR SELECT
        TO authenticated
        USING (true)
    ';
  END IF;
END $$;

-- Add comments explaining the architecture decision
COMMENT ON EXTENSION pgmq IS
  'Durable message queue for agent task dispatch. Provides exactly-once delivery, '
  'visibility timeouts, and automatic archival. This is the primary agent communication bus.';

-- Note: Realtime Broadcast is used ONLY for live UI notifications (e.g., "new approval needed").
-- It is ephemeral and does not guarantee delivery. All durable task dispatch goes through pgmq.
