/**
 * Agent Worker Edge Function
 * Queue consumer that reads messages from the pgmq 'agent_tasks' queue
 * and dispatches them to the appropriate agent Edge Functions.
 *
 * Triggered by:
 * - pg_cron every minute (body: {"source": "cron"})
 * - Direct invocation by authenticated users (requires JWT)
 *
 * Processing rules:
 * - Reads up to 5 messages per invocation (visibility timeout: 120s)
 * - Dispatches to agent-{type} Edge Function
 * - Deletes message from queue on successful processing
 * - On failure, message becomes visible again after vt expires (auto-retry)
 * - Stays within 150-second Edge Function timeout
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map of agent types (hyphenated) to their Edge Function names
const AGENT_FUNCTION_MAP: Record<string, string> = {
  "ciso-orchestrator": "agent-ciso-orchestrator",
  "grc-analyst": "agent-grc-analyst",
  "soc-analyst": "agent-soc-analyst",
  "threat-intel": "agent-threat-intel",
  "incident-response": "agent-incident-response",
  "appsec": "agent-appsec",
  "pen-test": "agent-pen-test",
  // Test agent for infrastructure validation
  "test": "agent-test",
};

// Maximum messages to process per invocation
const MAX_MESSAGES = 5;

// Visibility timeout in seconds (message hidden from other readers while processing)
const VISIBILITY_TIMEOUT = 120;

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Parse request body to determine source
    const body = await req.json().catch(() => ({}));
    const isCron = body?.source === "cron";

    // Authenticate: Accept pg_cron requests OR authenticated users
    if (!isCron) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization header" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify the JWT is valid
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: authError,
      } = await tempClient.auth.getUser(authHeader.replace("Bearer ", ""));

      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create service role client for queue operations
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Read up to MAX_MESSAGES from the pgmq queue with visibility timeout
    // deno-lint-ignore no-explicit-any
    const { data: messages, error: readError } = await (supabase as any)
      .schema("pgmq_public")
      .rpc("read", {
        queue_name: "agent_tasks",
        sleep_seconds: VISIBILITY_TIMEOUT,
        n: MAX_MESSAGES,
      });

    if (readError) {
      console.error("Failed to read from queue:", readError);
      return new Response(
        JSON.stringify({
          processed: 0,
          error: `Queue read failed: ${readError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No messages in queue" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing ${messages.length} agent task(s) from queue`);

    let processed = 0;
    let failed = 0;

    for (const msg of messages) {
      try {
        const payload = msg.message;
        const agentType = payload.agent_type;

        // Determine the target Edge Function
        const functionName = AGENT_FUNCTION_MAP[agentType];
        if (!functionName) {
          console.error(`Unknown agent type: ${agentType}`);
          // Delete the message to prevent infinite retry of unknown agent types
          await deleteMessage(supabase, msg.msg_id);
          failed++;
          continue;
        }

        console.log(
          `Dispatching task ${payload.task_id} to ${functionName} (agent: ${agentType})`
        );

        // Dispatch to the appropriate agent Edge Function
        const { error: invokeError } = await supabase.functions.invoke(
          functionName,
          {
            body: {
              task_id: payload.task_id,
              company_id: payload.company_id,
              action: payload.action,
              input: payload.input,
              parent_task_id: payload.parent_task_id,
              delegation_depth: payload.delegation_depth,
              risk_level: payload.risk_level,
            },
          }
        );

        if (invokeError) {
          console.error(
            `Agent function ${functionName} failed:`,
            invokeError
          );
          // Do NOT delete -- message becomes visible after vt expires for auto-retry
          failed++;
          continue;
        }

        // Delete message from queue on successful processing
        await deleteMessage(supabase, msg.msg_id);
        processed++;
        console.log(
          `Task ${payload.task_id} processed successfully, message ${msg.msg_id} deleted`
        );
      } catch (err) {
        console.error(`Error processing message ${msg.msg_id}:`, err);
        // Message will become visible again after visibility timeout expires
        failed++;
      }
    }

    console.log(
      `Queue processing complete: ${processed} processed, ${failed} failed`
    );

    return new Response(
      JSON.stringify({
        processed,
        failed,
        total: messages.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Agent worker error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        processed: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Deletes a message from the pgmq queue after successful processing.
 */
// deno-lint-ignore no-explicit-any
async function deleteMessage(supabase: any, msgId: number): Promise<void> {
  const { error } = await supabase.schema("pgmq_public").rpc("delete", {
    queue_name: "agent_tasks",
    msg_id: msgId,
  });

  if (error) {
    console.error(`Failed to delete message ${msgId}:`, error);
  }
}
