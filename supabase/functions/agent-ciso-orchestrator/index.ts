/**
 * CISO Orchestrator Edge Function
 *
 * The coordination layer for the ASSESS-AI multi-agent system.
 * Receives high-level compliance requests, delegates tasks to specialist
 * agents (primarily GRC Analyst), synthesizes results, and generates
 * executive summaries.
 *
 * Actions:
 * - run-compliance-assessment: Plans delegation, delegates to GRC, schedules synthesis
 * - synthesize-results: Reads completed subtasks, generates executive summary
 * - generate-executive-summary: Produces executive-level compliance report
 * - assess-risk-posture: Evaluates current risk posture from compliance data
 *
 * Follows the same skeleton as agent-test/index.ts:
 * Deno.serve -> CORS -> service client -> parse body -> fetch task -> normalize -> execute
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateText } from "npm:ai@6";
import { anthropic } from "npm:@ai-sdk/anthropic@3";
import {
  executeAgentTask,
  delegateTask,
} from "../_shared/agent-base.ts";
import { AgentTaskSchema } from "../_shared/agent-types.ts";
import {
  CISO_SYSTEM_PROMPT,
  createCisoTools,
  buildCisoPrompt,
} from "../_shared/ciso-tools.ts";

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

    // Create CISO-specific tools bound to this task
    const cisoTools = createCisoTools(supabase, task);

    // Build the action-specific prompt
    const userPrompt = buildCisoPrompt(task.action, task.input ?? {});

    // Execute the task through the shared agent framework
    const result = await executeAgentTask(supabase, task, async (t) => {
      // Use Vercel AI SDK generateText with Claude
      const { text, steps } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: CISO_SYSTEM_PROMPT,
        prompt: userPrompt,
        tools: cisoTools,
        maxSteps: 8,
      });

      // Determine if this is a high-risk assessment based on action type
      // run-compliance-assessment and synthesize-results produce strategic output
      // that should be reviewed -- escalate via risk_level
      const isHighRiskAction =
        t.action === "run-compliance-assessment" &&
        t.input?.cmmc_level === 2;

      // If high risk, update the task risk_level so the approval gate catches it
      if (isHighRiskAction) {
        await supabase
          .from("agent_tasks")
          .update({ risk_level: "high" })
          .eq("id", t.id)
          .eq("company_id", t.company_id);

        // Update the in-memory task to match
        t.risk_level = "high";
      }

      return {
        output: {
          action: t.action,
          result: text,
          steps_taken: steps?.length ?? 0,
          timestamp: new Date().toISOString(),
        },
        reasoning: text.substring(0, 500),
      };
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CISO Orchestrator error:", error);
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
