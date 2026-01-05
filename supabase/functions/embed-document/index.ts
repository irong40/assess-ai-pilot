import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmbedRequest {
  document_id: string;
  document_name: string;
  document_type: "policy" | "assessment" | "finding" | "threat_intel" | "framework" | "other";
  content: string;
  metadata?: Record<string, any>;
}

interface EmbedResponse {
  success: boolean;
  document_id: string;
  chunks_created: number;
  total_tokens: number;
  error?: string;
}

// Chunk text into smaller pieces for embedding
function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  
  const cleanText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphs = cleanText.split(/\n\n+/);
  
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + "\n\n" + paragraph;
    } else {
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 100);
}

// Get embeddings from OpenAI in batches
async function getEmbeddings(texts: string[], openaiKey: string): Promise<number[][]> {
  const batchSize = 20;
  const allEmbeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: batch,
      }),
    });
    
    const data = await response.json();
    
    if (!data.data || data.error) {
      throw new Error(`OpenAI embedding error: ${data.error?.message || "Unknown error"}`);
    }
    
    const sortedData = data.data.sort((a: any, b: any) => a.index - b.index);
    allEmbeddings.push(...sortedData.map((item: any) => item.embedding));
  }
  
  return allEmbeddings;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("User profile not found");
    }

    const { 
      document_id, 
      document_name, 
      document_type, 
      content, 
      metadata = {} 
    }: EmbedRequest = await req.json();

    if (!document_id || !document_name || !content) {
      throw new Error("document_id, document_name, and content are required");
    }

    console.log(`Embedding document: ${document_name} (${document_type})`);

    // Delete any existing embeddings for this document (re-processing)
    await supabase
      .from("document_embeddings")
      .delete()
      .eq("document_id", document_id)
      .eq("company_id", profile.company_id);

    // Chunk the content
    const chunks = chunkText(content);
    
    if (chunks.length === 0) {
      throw new Error("Document content is too short to process");
    }

    console.log(`Processing ${chunks.length} chunks for document: ${document_name}`);

    // Get embeddings for all chunks
    const embeddings = await getEmbeddings(chunks, openaiKey);

    // Prepare records for insertion
    const records = chunks.map((chunk, index) => ({
      company_id: profile.company_id,
      document_id,
      document_name,
      document_type,
      chunk_index: index,
      chunk_text: chunk,
      embedding: embeddings[index],
      token_count: estimateTokens(chunk),
      metadata: {
        ...metadata,
        original_chunk_count: chunks.length,
        processed_at: new Date().toISOString(),
      },
    }));

    // Insert in batches
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from("document_embeddings")
        .insert(batch);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Failed to store embeddings: ${insertError.message}`);
      }
      
      totalInserted += batch.length;
    }

    const totalTokens = records.reduce((sum, r) => sum + (r.token_count || 0), 0);

    // Log audit event
    await supabase.rpc("log_audit_event", {
      p_company_id: profile.company_id,
      p_user_id: user.id,
      p_action: "create",
      p_resource_type: "document",
      p_resource_id: document_id,
      p_resource_name: document_name,
      p_details: {
        document_type,
        chunks_created: chunks.length,
        total_tokens: totalTokens,
        content_length: content.length,
      },
    });

    console.log(`Successfully embedded ${totalInserted} chunks for ${document_name}`);

    const response: EmbedResponse = {
      success: true,
      document_id,
      chunks_created: totalInserted,
      total_tokens: totalTokens,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Embed document error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        document_id: "",
        chunks_created: 0,
        total_tokens: 0,
        error: error.message || "An error occurred",
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
