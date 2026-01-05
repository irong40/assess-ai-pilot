import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Finding {
  id: string;
  control_id: string;
  control_name: string;
  finding_type: "deficiency" | "weakness" | "observation";
  description: string;
  evidence?: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface POAMGenerationRequest {
  assessment_id: string;
  findings: Finding[];
  due_date_days?: number;
}

interface GeneratedPOAM {
  finding_id: string;
  control_id: string;
  weakness_description: string;
  risk_level: "critical" | "high" | "medium" | "low";
  remediation_plan: string;
  milestones: Array<{
    description: string;
    target_date: string;
  }>;
  resources_required: string;
  estimated_cost: string;
  responsible_party: string;
  scheduled_completion_date: string;
  ai_reasoning: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("User profile not found");
    }

    const { 
      assessment_id, 
      findings, 
      due_date_days = 90 
    }: POAMGenerationRequest = await req.json();

    if (!assessment_id || !findings || findings.length === 0) {
      throw new Error("assessment_id and findings are required");
    }

    console.log(`Generating POA&Ms for ${findings.length} findings in assessment ${assessment_id}`);

    const generatedPOAMs: GeneratedPOAM[] = [];
    const baseDate = new Date();
    const defaultCompletionDate = new Date(baseDate.getTime() + due_date_days * 24 * 60 * 60 * 1000);

    for (const finding of findings) {
      const systemPrompt = `You are a cybersecurity compliance expert specializing in NIST SP 800-53 and CMMC frameworks. Generate a comprehensive POA&M (Plan of Action & Milestones) entry for security findings.

Your response must be valid JSON with this exact structure:
{
  "weakness_description": "Clear, formal description of the weakness for compliance documentation",
  "remediation_plan": "Detailed step-by-step remediation plan",
  "milestones": [
    {"description": "Milestone 1 description", "days_from_start": 30},
    {"description": "Milestone 2 description", "days_from_start": 60},
    {"description": "Final verification", "days_from_start": 90}
  ],
  "resources_required": "Personnel, tools, and budget needed",
  "estimated_cost": "Cost estimate range (e.g., '$5,000 - $10,000' or 'Staff time only')",
  "responsible_party": "Role responsible (e.g., 'ISSO', 'System Administrator', 'Security Team')",
  "reasoning": "Brief explanation of why this remediation approach was chosen"
}

Consider:
- Severity level determines urgency and milestone spacing
- Critical/High findings need faster remediation timelines
- Include verification/testing milestones
- Be specific about actions, not vague`;

      const userPrompt = `Generate a POA&M entry for this security finding:

Control ID: ${finding.control_id}
Control Name: ${finding.control_name}
Finding Type: ${finding.finding_type}
Severity: ${finding.severity}
Description: ${finding.description}
${finding.evidence ? `Evidence: ${finding.evidence}` : ""}

Default completion timeframe: ${due_date_days} days
Organization prefers practical, achievable milestones.`;

      const completionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1000,
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      const completionData = await completionResponse.json();
      
      if (!completionData.choices?.[0]?.message?.content) {
        console.error("OpenAI error for finding:", finding.id, completionData);
        continue;
      }

      try {
        const aiResponse = JSON.parse(completionData.choices[0].message.content);
        
        const milestones = (aiResponse.milestones || []).map((m: any) => ({
          description: m.description,
          target_date: new Date(
            baseDate.getTime() + (m.days_from_start || 30) * 24 * 60 * 60 * 1000
          ).toISOString().split("T")[0],
        }));

        let adjustedDays = due_date_days;
        switch (finding.severity) {
          case "critical": adjustedDays = Math.min(30, due_date_days); break;
          case "high": adjustedDays = Math.min(60, due_date_days); break;
          case "medium": adjustedDays = Math.min(90, due_date_days); break;
          case "low": adjustedDays = due_date_days; break;
        }

        const completionDate = new Date(
          baseDate.getTime() + adjustedDays * 24 * 60 * 60 * 1000
        ).toISOString().split("T")[0];

        generatedPOAMs.push({
          finding_id: finding.id,
          control_id: finding.control_id,
          weakness_description: aiResponse.weakness_description || finding.description,
          risk_level: finding.severity,
          remediation_plan: aiResponse.remediation_plan || "Remediation plan pending review",
          milestones,
          resources_required: aiResponse.resources_required || "To be determined",
          estimated_cost: aiResponse.estimated_cost || "To be determined",
          responsible_party: aiResponse.responsible_party || "ISSO",
          scheduled_completion_date: completionDate,
          ai_reasoning: aiResponse.reasoning || "AI-generated based on finding severity and type",
        });

      } catch (parseError) {
        console.error("Failed to parse AI response for finding:", finding.id, parseError);
        
        generatedPOAMs.push({
          finding_id: finding.id,
          control_id: finding.control_id,
          weakness_description: finding.description,
          risk_level: finding.severity,
          remediation_plan: "Remediation plan requires manual review",
          milestones: [
            { description: "Initial assessment", target_date: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
            { description: "Remediation implementation", target_date: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
            { description: "Verification and closure", target_date: defaultCompletionDate.toISOString().split("T")[0] },
          ],
          resources_required: "To be determined",
          estimated_cost: "To be determined",
          responsible_party: "ISSO",
          scheduled_completion_date: defaultCompletionDate.toISOString().split("T")[0],
          ai_reasoning: "Fallback POA&M - AI parsing failed, requires manual review",
        });
      }
    }

    // Insert POA&M entries into database
    const poamRecords = generatedPOAMs.map(poam => ({
      company_id: profile.company_id,
      assessment_id,
      finding_id: poam.finding_id,
      control_id: poam.control_id,
      weakness_description: poam.weakness_description,
      risk_level: poam.risk_level,
      remediation_plan: poam.remediation_plan,
      milestones: poam.milestones,
      resources_required: poam.resources_required,
      estimated_cost: poam.estimated_cost,
      responsible_party: poam.responsible_party,
      scheduled_completion_date: poam.scheduled_completion_date,
      status: "open",
      created_by: user.id,
      ai_generated: true,
      ai_reasoning: poam.ai_reasoning,
    }));

    const { data: insertedPOAMs, error: insertError } = await supabase
      .from("poam_entries")
      .insert(poamRecords)
      .select("id, control_id, risk_level");

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to save POA&M entries: ${insertError.message}`);
    }

    // Log audit event
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email;
    
    await supabase.rpc("log_audit_event", {
      p_company_id: profile.company_id,
      p_user_id: user.id,
      p_action: "ai_decision",
      p_resource_type: "poam",
      p_resource_id: assessment_id,
      p_resource_name: `POA&M Generation for Assessment ${assessment_id}`,
      p_details: {
        findings_processed: findings.length,
        poams_created: generatedPOAMs.length,
        generated_by: fullName,
        severity_breakdown: {
          critical: generatedPOAMs.filter(p => p.risk_level === "critical").length,
          high: generatedPOAMs.filter(p => p.risk_level === "high").length,
          medium: generatedPOAMs.filter(p => p.risk_level === "medium").length,
          low: generatedPOAMs.filter(p => p.risk_level === "low").length,
        },
      },
      p_ai_reasoning: `Generated ${generatedPOAMs.length} POA&M entries from ${findings.length} findings. Completion dates adjusted based on severity.`,
    });

    console.log(`Successfully generated ${generatedPOAMs.length} POA&Ms`);

    return new Response(
      JSON.stringify({
        success: true,
        assessment_id,
        poams_created: insertedPOAMs?.length || 0,
        poams: generatedPOAMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("POA&M generation error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An error occurred",
        poams_created: 0,
        poams: [],
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
