/**
 * GRC Analyst Agent Edge Function
 *
 * The primary value-producing agent in ASSESS-AI. Performs CMMC compliance
 * gap analysis following NIST 800-171A methodology, generates remediation
 * recommendations ranked by cost and effort, tracks compliance over time,
 * and prepares audit-ready documentation packages.
 *
 * Actions:
 * - gap-analysis: Full or family-scoped compliance gap analysis
 * - control-review: Detailed review of a specific control
 * - remediation-plan: Prioritized remediation recommendations
 * - audit-package: SSP sections organized by the 14 control families
 *
 * Pattern: fetch task -> normalize enums -> executeAgentTask with generateText handler
 * (same as agent-test/index.ts)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateText } from "npm:ai@6";
import { anthropic } from "npm:@ai-sdk/anthropic@3";
import { executeAgentTask } from "../_shared/agent-base.ts";
import {
  GRC_SYSTEM_PROMPT,
  createGrcTools,
  buildPromptForAction,
  storeGrcResult,
} from "../_shared/grc-tools.ts";
import { GapAnalysisReportSchema } from "../_shared/grc-schemas.ts";

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
      // Build domain-specific tools scoped to this task's company
      const tools = createGrcTools(supabase, t);

      // Use Vercel AI SDK generateText with Claude for compliance reasoning
      const { text, steps } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: GRC_SYSTEM_PROMPT,
        prompt: buildPromptForAction(t.action, t.input ?? {}),
        tools,
        maxSteps: 10, // GRC needs more steps than test agent for compliance reasoning
      });

      // Parse the structured output from the LLM response
      let parsedReport;
      try {
        // Extract JSON from the response text (may be wrapped in markdown code blocks)
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ??
          text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch?.[1] ?? jsonMatch?.[0] ?? text;
        const parsed = JSON.parse(jsonStr);
        parsedReport = GapAnalysisReportSchema.parse(parsed);
      } catch {
        // If structured output parsing fails, return the raw text as output
        return {
          output: {
            raw_response: text,
            parse_error: "Failed to parse structured GapAnalysisReport from LLM output",
            action: t.action,
            timestamp: new Date().toISOString(),
          },
          reasoning: text.substring(0, 500),
        };
      }

      // Store the gap analysis result and create compliance snapshot
      if (t.action === "gap-analysis" || t.action === "control-review") {
        await storeGrcResult(supabase, t, parsedReport);
      }

      // Summarize the reasoning from multi-step tool usage
      const stepSummary = (steps ?? [])
        .map((s: any, i: number) => `Step ${i + 1}: ${s.text?.substring(0, 100) ?? "tool call"}`)
        .join("; ");

      return {
        output: parsedReport,
        reasoning: stepSummary || text.substring(0, 500),
      };
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GRC Analyst agent error:", error);
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
