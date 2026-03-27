/**
 * Threat Intelligence Agent Edge Function
 *
 * Generates strategic threat briefs, tracks IOCs, maps threats to CMMC
 * controls via CWE categorization, and produces attack surface assessments
 * relevant to the company's declared tech stack.
 *
 * Actions:
 * - generate-threat-brief: Tech-stack-relevant threat brief with CWE-to-CMMC mapping
 * - scan-iocs: Extract and track IOCs from recent CVE data
 * - map-attack-surface: Combine tech stack + compliance gaps + active threats
 *
 * Pattern: Deno.serve -> CORS -> service client -> parse body -> fetch task
 *          -> normalize enums -> executeAgentTask with generateText handler
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateText } from "npm:ai@6";
import { anthropic } from "npm:@ai-sdk/anthropic@3";
import { executeAgentTask } from "../_shared/agent-base.ts";
import {
  THREAT_INTEL_SYSTEM_PROMPT,
  createThreatIntelTools,
  buildThreatIntelPrompt,
} from "../_shared/threat-intel-tools.ts";
import { ThreatAnalysisResultSchema } from "../_shared/threat-intel-schemas.ts";

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
      const tools = createThreatIntelTools(supabase, t);

      // Use Vercel AI SDK generateText with Claude for threat analysis reasoning
      const { text, steps } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: THREAT_INTEL_SYSTEM_PROMPT,
        prompt: buildThreatIntelPrompt(t.action, t.input ?? {}),
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
        parsedResult = ThreatAnalysisResultSchema.parse(parsed);
      } catch {
        // If structured output parsing fails, return the raw text as output
        // The Threat Intel agent persists briefs via saveThreatBrief and IOCs via
        // trackIOCs tools during execution, so data is saved even if the final
        // structured parse fails
        return {
          output: {
            raw_response: text,
            parse_error:
              "Failed to parse structured ThreatAnalysisResult from LLM output",
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
    console.error("Threat Intel agent error:", error);
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
