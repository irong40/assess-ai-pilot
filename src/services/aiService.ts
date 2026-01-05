import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

export interface RAGQueryRequest {
  query: string;
  documentTypes?: string[];
  maxChunks?: number;
  includeSources?: boolean;
}

export interface RAGQueryResponse {
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
  error?: string;
}

import type { RMFDocumentType } from "@/types/documentTypes";

export interface EmbedDocumentRequest {
  documentId: string;
  documentName: string;
  documentType: RMFDocumentType;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface EmbedDocumentResponse {
  success: boolean;
  document_id: string;
  chunks_created: number;
  total_tokens: number;
  error?: string;
}

export interface Finding {
  id: string;
  control_id: string;
  control_name: string;
  finding_type: "deficiency" | "weakness" | "observation";
  description: string;
  evidence?: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface GeneratePOAMRequest {
  assessmentId: string;
  findings: Finding[];
  dueDateDays?: number;
}

export interface GeneratedPOAM {
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

export interface GeneratePOAMResponse {
  success: boolean;
  assessment_id: string;
  poams_created: number;
  poams: GeneratedPOAM[];
  error?: string;
}

export interface AuditLogEntry {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, unknown>;
  ai_reasoning: string | null;
  created_at: string;
}

// ============================================================================
// RAG SERVICE
// ============================================================================

export const ragService = {
  async query(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const response = await supabase.functions.invoke("rag-query", {
      body: {
        query: request.query,
        document_types: request.documentTypes,
        max_chunks: request.maxChunks ?? 5,
        include_sources: request.includeSources ?? true,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  },

  async embedDocument(request: EmbedDocumentRequest): Promise<EmbedDocumentResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const response = await supabase.functions.invoke("embed-document", {
      body: {
        document_id: request.documentId,
        document_name: request.documentName,
        document_type: request.documentType,
        content: request.content,
        metadata: request.metadata,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  },

  async getQueryHistory(limit: number = 50): Promise<unknown[]> {
    const { data, error } = await supabase
      .from("rag_queries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async submitFeedback(queryId: string, rating: number, feedbackText?: string): Promise<void> {
    const { error } = await supabase
      .from("rag_queries")
      .update({
        feedback_rating: rating,
        feedback_text: feedbackText,
      })
      .eq("id", queryId);

    if (error) throw error;
  },
};

// ============================================================================
// POA&M SERVICE
// ============================================================================

export const poamService = {
  async generateFromFindings(request: GeneratePOAMRequest): Promise<GeneratePOAMResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const response = await supabase.functions.invoke("generate-poam", {
      body: {
        assessment_id: request.assessmentId,
        findings: request.findings,
        due_date_days: request.dueDateDays ?? 90,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  },

  async getAll(filters?: {
    status?: string;
    riskLevel?: string;
    assessmentId?: string;
  }): Promise<unknown[]> {
    let query = supabase
      .from("poam_entries")
      .select("*")
      .order("scheduled_completion_date", { ascending: true });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.riskLevel) {
      query = query.eq("risk_level", filters.riskLevel as "critical" | "high" | "medium" | "low");
    }
    if (filters?.assessmentId) {
      query = query.eq("assessment_id", filters.assessmentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async update(poamId: string, updates: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from("poam_entries")
      .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", poamId);

    if (error) throw error;
  },

  async getSummary(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
    bySeverity: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from("poam_entries")
      .select("status, risk_level, scheduled_completion_date");

    if (error) throw error;

    const today = new Date().toISOString().split("T")[0];
    const entries = data || [];

    return {
      total: entries.length,
      open: entries.filter(e => e.status === "open").length,
      inProgress: entries.filter(e => e.status === "in_progress").length,
      completed: entries.filter(e => e.status === "completed").length,
      overdue: entries.filter(e => 
        e.status !== "completed" && 
        e.scheduled_completion_date && 
        e.scheduled_completion_date < today
      ).length,
      bySeverity: {
        critical: entries.filter(e => e.risk_level === "critical").length,
        high: entries.filter(e => e.risk_level === "high").length,
        medium: entries.filter(e => e.risk_level === "medium").length,
        low: entries.filter(e => e.risk_level === "low").length,
      },
    };
  },
};

// ============================================================================
// AUDIT SERVICE
// ============================================================================

export const auditService = {
  async getLogs(filters?: {
    action?: string;
    resourceType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    let query = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.action) {
      query = query.eq("action", filters.action);
    }
    if (filters?.resourceType) {
      query = query.eq("resource_type", filters.resourceType);
    }
    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AuditLogEntry[];
  },

  async getAIDecisions(limit: number = 100): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("action", "ai_decision")
      .not("ai_reasoning", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AuditLogEntry[];
  },

  async exportToCSV(filters?: {
    action?: string;
    resourceType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<string> {
    const logs = await this.getLogs({ ...filters, limit: 10000 });
    
    const headers = [
      "Timestamp",
      "Action",
      "Resource Type",
      "Resource Name",
      "User ID",
      "Details",
      "AI Reasoning",
    ];

    const rows = logs.map(log => [
      log.created_at,
      log.action,
      log.resource_type,
      log.resource_name || "",
      log.user_id,
      JSON.stringify(log.details),
      log.ai_reasoning || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return csvContent;
  },
};

// ============================================================================
// THREAT INTELLIGENCE SERVICE
// ============================================================================

export const threatIntelService = {
  async getRecent(limit: number = 50): Promise<unknown[]> {
    const { data, error } = await supabase
      .from("threat_intelligence")
      .select("*")
      .order("published_date", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async search(query: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from("threat_intelligence")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,external_id.ilike.%${query}%`)
      .order("cvss_score", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async getBySeverity(severity: "critical" | "high" | "medium" | "low"): Promise<unknown[]> {
    const { data, error } = await supabase
      .from("threat_intelligence")
      .select("*")
      .eq("severity", severity)
      .order("published_date", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  },

  async getSummary(): Promise<{
    total: number;
    last24h: number;
    last7d: number;
    bySeverity: Record<string, number>;
    exploitedCount: number;
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("threat_intelligence")
      .select("severity, is_exploited, created_at");

    if (error) throw error;

    const entries = data || [];

    return {
      total: entries.length,
      last24h: entries.filter(e => e.created_at >= yesterday).length,
      last7d: entries.filter(e => e.created_at >= lastWeek).length,
      bySeverity: {
        critical: entries.filter(e => e.severity === "critical").length,
        high: entries.filter(e => e.severity === "high").length,
        medium: entries.filter(e => e.severity === "medium").length,
        low: entries.filter(e => e.severity === "low").length,
      },
      exploitedCount: entries.filter(e => e.is_exploited).length,
    };
  },
};
