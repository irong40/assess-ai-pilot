import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RAGRequest {
  query: string;
  document_types?: string[];
  max_chunks?: number;
  include_sources?: boolean;
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    document_name: string;
    document_type: string;
    chunk_text: string;
    similarity: number;
  }>;
  query_id: string;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      throw new Error("User profile not found");
    }

    const { query, document_types, max_chunks = 5, include_sources = true }: RAGRequest = await req.json();

    if (!query || query.trim().length === 0) {
      throw new Error("Query is required");
    }

    console.log(`RAG query from user ${user.id}: "${query}"`);

    // Step 1: Generate embedding for the query
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
      }),
    });

    const embeddingData = await embeddingResponse.json();
    
    if (!embeddingData.data?.[0]?.embedding) {
      console.error("Embedding error:", embeddingData);
      throw new Error("Failed to generate query embedding");
    }

    const queryEmbedding = embeddingData.data[0].embedding;

    // Step 2: Semantic search for relevant chunks
    const { data: chunks, error: searchError } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_company_id: profile.company_id,
      match_count: max_chunks,
      match_threshold: 0.7,
    });

    if (searchError) {
      console.error("Search error:", searchError);
      throw new Error("Failed to search documents");
    }

    // Filter by document types if specified
    let filteredChunks = chunks || [];
    if (document_types && document_types.length > 0) {
      filteredChunks = filteredChunks.filter((c: any) => 
        document_types.includes(c.document_type)
      );
    }

    console.log(`Found ${filteredChunks.length} relevant chunks`);

    // Step 3: Build context from retrieved chunks
    const context = filteredChunks
      .map((chunk: any) => `[${chunk.document_name} - ${chunk.document_type}]\n${chunk.chunk_text}`)
      .join("\n\n---\n\n");

    // Step 4: Generate answer using LLM
    const systemPrompt = `You are Sentinel AI, a cybersecurity compliance expert assistant. You help security professionals with:
- NIST SP 800-53 and CMMC compliance
- Security assessments and findings
- POA&M (Plan of Action & Milestones) management
- Risk analysis and threat intelligence
- Policy interpretation and implementation

Answer questions based on the provided context from the organization's documents. If the context doesn't contain enough information, say so clearly. Always cite which document your information comes from.

Be concise, accurate, and actionable. Use security terminology appropriately.`;

    const userPrompt = context.length > 0
      ? `Context from organization documents:\n\n${context}\n\n---\n\nQuestion: ${query}`
      : `Question: ${query}\n\nNote: No relevant documents were found in your organization's knowledge base. I'll provide general guidance based on my training.`;

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
      }),
    });

    const completionData = await completionResponse.json();
    
    if (!completionData.choices?.[0]?.message?.content) {
      console.error("Completion error:", completionData);
      throw new Error("Failed to generate response");
    }

    const answer = completionData.choices[0].message.content;
    const tokenUsage = completionData.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    // Step 5: Log the query for analytics and audit
    const latencyMs = Date.now() - startTime;
    
    const { data: queryLog, error: logError } = await supabase
      .from("rag_queries")
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        query_text: query,
        query_embedding: queryEmbedding,
        retrieved_chunks: filteredChunks.map((c: any) => c.id),
        llm_response: answer,
        llm_model: "gpt-4o-mini",
        token_usage: tokenUsage,
        latency_ms: latencyMs,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Failed to log query:", logError);
    }

    // Log audit event
    await supabase.rpc("log_audit_event", {
      p_company_id: profile.company_id,
      p_user_id: user.id,
      p_action: "ai_query",
      p_resource_type: "rag_query",
      p_resource_id: queryLog?.id,
      p_details: {
        query_length: query.length,
        chunks_retrieved: filteredChunks.length,
        latency_ms: latencyMs,
      },
      p_ai_reasoning: `Retrieved ${filteredChunks.length} relevant chunks with similarity scores: ${filteredChunks.map((c: any) => c.similarity.toFixed(3)).join(", ")}`,
    });

    // Step 6: Build response
    const response: RAGResponse = {
      answer,
      sources: include_sources
        ? filteredChunks.map((c: any) => ({
            document_name: c.document_name,
            document_type: c.document_type,
            chunk_text: c.chunk_text.substring(0, 200) + "...",
            similarity: c.similarity,
          }))
        : [],
      query_id: queryLog?.id || "",
      token_usage: tokenUsage,
    };

    console.log(`RAG query completed in ${latencyMs}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("RAG query error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred",
        answer: "I apologize, but I encountered an error processing your question. Please try again.",
        sources: [],
        query_id: "",
        token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
