/**
 * Pen Test Agent Edge Function
 *
 * Performs PASSIVE ONLY vulnerability discovery by matching the company's
 * declared tech stack against known CVE patterns in the threat_intelligence table.
 * No active exploitation, no network scanning, no port probing.
 *
 * Actions:
 * - passive-scan: Full passive vulnerability scan (authorization -> tech stack -> CVE match -> findings)
 * - tech-stack-cve-match: Focused CVE matching for specific tech stack components
 * - generate-vulnerability-report: Aggregate all findings into VulnerabilityReport
 *
 * Pattern: Deno.serve -> CORS -> service client -> parse body -> fetch task
 *          -> executeAgentTask with generateText handler
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateText } from "npm:ai@6";
import { anthropic } from "npm:@ai-sdk/anthropic@3";
import { executeAgentTask } from "../_shared/agent-base.ts";
import {
  PEN_TEST_SYSTEM_PROMPT,
  createPenTestTools,
  buildPenTestPrompt,
} from "../_shared/pen-test-tools.ts";
import { VulnerabilityReportSchema } from "../_shared/pen-test-schemas.ts";

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
      const tools = createPenTestTools(supabase, t);

      // Use Vercel AI SDK generateText with Claude for Pen Test reasoning
      const { text, steps } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: PEN_TEST_SYSTEM_PROMPT,
        prompt: buildPenTestPrompt(t.action, t.input ?? {}),
        tools,
        maxSteps: 8, // Limited to 8 to stay within 150s Edge Function timeout
      });

      // Parse the structured output from the LLM response
      let parsedResult;
      try {
        // Extract JSON from the response text (may be wrapped in markdown code blocks)
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ??
          text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch?.[1] ?? jsonMatch?.[0] ?? text;
        const parsed = JSON.parse(jsonStr);
        parsedResult = VulnerabilityReportSchema.parse(parsed);
      } catch {
        // If structured output parsing fails, return the raw text as output
        // The Pen Test agent persists findings via tools during execution,
        // so findings are saved even if the final structured parse fails
        return {
          output: {
            raw_response: text,
            parse_error:
              "Failed to parse structured VulnerabilityReport from LLM output",
            action: t.action,
            timestamp: new Date().toISOString(),
          },
          reasoning: text.substring(0, 500),
        };
      }

      // Summarize the reasoning from multi-step tool usage
      const stepSummary = (steps ?? [])
        .map(
          (s: any, i: number) =>
            `Step ${i + 1}: ${s.text?.substring(0, 100) ?? "tool call"}`
        )
        .join("; ");

      return {
        output: parsedResult,
        reasoning: stepSummary || text.substring(0, 500),
      };
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Pen Test agent error:", error);
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
