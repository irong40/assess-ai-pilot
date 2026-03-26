/**
 * Test Agent Edge Function
 * Validates the full ASSESS-AI agent runtime infrastructure:
 * dispatch -> AI execution -> state persistence -> audit trail
 *
 * This agent:
 * 1. Receives a task via the agent-worker queue consumer
 * 2. Uses Vercel AI SDK generateText with Claude for reasoning
 * 3. Defines a queryDatabase tool to verify data access
 * 4. Persists state via the shared agent-base module
 * 5. Logs an audit trail with AI reasoning
 *
 * Use this to verify the entire agent pipeline works end-to-end.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateText, tool } from "npm:ai@6";
import { anthropic } from "npm:@ai-sdk/anthropic@3";
import { z } from "npm:zod@3";
import { executeAgentTask } from "../_shared/agent-base.ts";
import { AgentTaskSchema } from "../_shared/agent-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create service role client (invoked by agent-worker, not directly by users)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse the task payload from the request body
    const body = await req.json();
    const { task_id, company_id } = body;

    if (!task_id || !company_id) {
      return new Response(
        JSON.stringify({ error: "task_id and company_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the full task from the database
    const { data: taskRow, error: fetchError } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("id", task_id)
      .eq("company_id", company_id)
      .single();

    if (fetchError || !taskRow) {
      return new Response(
        JSON.stringify({
          error: `Task not found: ${task_id}`,
          details: fetchError?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalize the task data (Postgres uses underscores, TypeScript uses hyphens)
    const task = {
      ...taskRow,
      agent_type: taskRow.agent_type?.replace(/_/g, "-"),
      source_agent: taskRow.source_agent?.replace(/_/g, "-") ?? null,
    };

    // Execute the task through the shared agent framework
    const result = await executeAgentTask(supabase, task, async (t) => {
      // Use Vercel AI SDK generateText with Claude
      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system:
          "You are a test agent verifying the ASSESS-AI agent runtime infrastructure. " +
          "Report your findings concisely. If you have access to a queryDatabase tool, " +
          "use it to verify that the controls data is accessible.",
        prompt: `Execute test action: ${t.action}. Input: ${JSON.stringify(t.input)}. ` +
          `Report on the health of the agent infrastructure for company ${t.company_id}.`,
        tools: {
          queryDatabase: tool({
            description:
              "Query the controls table to verify CMMC control data is accessible. " +
              "Pass a control_id like '3.1.1' to look up a specific control.",
            parameters: z.object({
              control_id: z
                .string()
                .describe("The NIST 800-171 control ID, e.g., '3.1.1'"),
            }),
            execute: async ({ control_id }) => {
              const { data, error } = await supabase
                .from("controls")
                .select("control_id, title, family_name, cmmc_level")
                .eq("control_id", control_id)
                .eq("company_id", t.company_id)
                .maybeSingle();

              if (error) {
                return {
                  found: false,
                  error: error.message,
                  note: "Controls table may not be seeded yet (Plan 01-01)",
                };
              }
              if (!data) {
                return {
                  found: false,
                  note: "Control not found. Controls may not be seeded yet (Plan 01-01).",
                };
              }
              return {
                found: true,
                control: data,
              };
            },
          }),
        },
        maxSteps: 3,
      });

      return {
        output: {
          test_result: "infrastructure_validated",
          ai_response: text,
          timestamp: new Date().toISOString(),
        },
        reasoning: text.substring(0, 500),
      };
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Agent test error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
