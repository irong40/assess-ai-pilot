export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          company_id: string
          compliance_scope: string
          created_at: string
          environment: string
          id: string
          status: Database["public"]["Enums"]["assessment_status"]
          system_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          compliance_scope: string
          created_at?: string
          environment: string
          id?: string
          status?: Database["public"]["Enums"]["assessment_status"]
          system_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          compliance_scope?: string
          created_at?: string
          environment?: string
          id?: string
          status?: Database["public"]["Enums"]["assessment_status"]
          system_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_metrics: {
        Row: {
          assessment_id: string | null
          calculated_at: string
          company_id: string
          created_at: string
          id: string
          measurement_date: string
          metric_type: string
          metric_value: number
          target_value: number | null
        }
        Insert: {
          assessment_id?: string | null
          calculated_at?: string
          company_id: string
          created_at?: string
          id?: string
          measurement_date?: string
          metric_type: string
          metric_value: number
          target_value?: number | null
        }
        Update: {
          assessment_id?: string | null
          calculated_at?: string
          company_id?: string
          created_at?: string
          id?: string
          measurement_date?: string
          metric_type?: string
          metric_value?: number
          target_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_metrics_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_intelligence: {
        Row: {
          actionability: Database["public"]["Enums"]["actionability_level"]
          ai_priority: Database["public"]["Enums"]["notification_priority"]
          category: Database["public"]["Enums"]["notification_category"]
          company_id: string
          correlation_data: Json | null
          created_at: string | null
          id: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          processed_at: string
          raw_payload: Json
          real_time_sent: boolean | null
          real_time_sent_at: string | null
          reasoning: string
          recommended_actions: string[] | null
          requires_immediate_attention: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          source: string
          updated_at: string | null
          workflow_execution_id: string | null
        }
        Insert: {
          actionability: Database["public"]["Enums"]["actionability_level"]
          ai_priority: Database["public"]["Enums"]["notification_priority"]
          category: Database["public"]["Enums"]["notification_category"]
          company_id: string
          correlation_data?: Json | null
          created_at?: string | null
          id?: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          processed_at?: string
          raw_payload?: Json
          real_time_sent?: boolean | null
          real_time_sent_at?: string | null
          reasoning: string
          recommended_actions?: string[] | null
          requires_immediate_attention?: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          source?: string
          updated_at?: string | null
          workflow_execution_id?: string | null
        }
        Update: {
          actionability?: Database["public"]["Enums"]["actionability_level"]
          ai_priority?: Database["public"]["Enums"]["notification_priority"]
          category?: Database["public"]["Enums"]["notification_category"]
          company_id?: string
          correlation_data?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          processed_at?: string
          raw_payload?: Json
          real_time_sent?: boolean | null
          real_time_sent_at?: string | null
          reasoning?: string
          recommended_actions?: string[] | null
          requires_immediate_attention?: boolean | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          source?: string
          updated_at?: string | null
          workflow_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_intelligence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          ai_filtering_enabled: boolean | null
          company_id: string
          created_at: string | null
          email_enabled: boolean | null
          enabled_categories:
            | Database["public"]["Enums"]["notification_category"][]
            | null
          id: string
          immediate_attention_override: boolean | null
          priority_threshold:
            | Database["public"]["Enums"]["notification_priority"]
            | null
          real_time_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_filtering_enabled?: boolean | null
          company_id: string
          created_at?: string | null
          email_enabled?: boolean | null
          enabled_categories?:
            | Database["public"]["Enums"]["notification_category"][]
            | null
          id?: string
          immediate_attention_override?: boolean | null
          priority_threshold?:
            | Database["public"]["Enums"]["notification_priority"]
            | null
          real_time_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_filtering_enabled?: boolean | null
          company_id?: string
          created_at?: string | null
          email_enabled?: boolean | null
          enabled_categories?:
            | Database["public"]["Enums"]["notification_category"][]
            | null
          id?: string
          immediate_attention_override?: boolean | null
          priority_threshold?:
            | Database["public"]["Enums"]["notification_priority"]
            | null
          real_time_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poam_entries: {
        Row: {
          ai_confidence_score: number | null
          assessment_id: string | null
          assigned_to: string | null
          auto_generated: boolean | null
          company_id: string
          control_id: string
          created_at: string
          id: string
          planned_completion_date: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          status: string
          updated_at: string
          weakness_description: string
        }
        Insert: {
          ai_confidence_score?: number | null
          assessment_id?: string | null
          assigned_to?: string | null
          auto_generated?: boolean | null
          company_id: string
          control_id: string
          created_at?: string
          id?: string
          planned_completion_date: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          status?: string
          updated_at?: string
          weakness_description: string
        }
        Update: {
          ai_confidence_score?: number | null
          assessment_id?: string | null
          assigned_to?: string | null
          auto_generated?: boolean | null
          company_id?: string
          control_id?: string
          created_at?: string
          id?: string
          planned_completion_date?: string
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: string
          updated_at?: string
          weakness_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "poam_entries_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poam_entries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poam_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          api_calls_made: number | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          execution_id: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          processing_duration_ms: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_status"]
          tokens_used: number | null
          updated_at: string | null
          workflow_name: string | null
          workflow_type: string
        }
        Insert: {
          api_calls_made?: number | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_duration_ms?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          tokens_used?: number | null
          updated_at?: string | null
          workflow_name?: string | null
          workflow_type: string
        }
        Update: {
          api_calls_made?: number | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_duration_ms?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          tokens_used?: number | null
          updated_at?: string | null
          workflow_name?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      high_priority_notifications: {
        Row: {
          actionability:
            | Database["public"]["Enums"]["actionability_level"]
            | null
          ai_priority:
            | Database["public"]["Enums"]["notification_priority"]
            | null
          category: Database["public"]["Enums"]["notification_category"] | null
          company_id: string | null
          company_name: string | null
          correlation_data: Json | null
          created_at: string | null
          id: string | null
          message: string | null
          notification_type:
            | Database["public"]["Enums"]["notification_type"]
            | null
          processed_at: string | null
          raw_payload: Json | null
          real_time_sent: boolean | null
          real_time_sent_at: string | null
          reasoning: string | null
          recommended_actions: string[] | null
          requires_immediate_attention: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          source: string | null
          updated_at: string | null
          user_name: string | null
          workflow_execution_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_intelligence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_company_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      actionability:
        | "immediate"
        | "within_24h"
        | "within_week"
        | "informational"
      actionability_level: "immediate" | "urgent" | "routine" | "informational"
      assessment_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "needs_review"
      notification_category:
        | "security_incident"
        | "compliance_alert"
        | "assessment_update"
        | "poam_reminder"
        | "system_maintenance"
      notification_priority: "1" | "2" | "3" | "4" | "5"
      notification_type:
        | "security_alert"
        | "compliance_finding"
        | "assessment_reminder"
        | "poam_update"
        | "system_status"
      risk_level: "critical" | "high" | "medium" | "low"
      user_role: "admin" | "issm" | "isso" | "viewer"
      workflow_status: "running" | "completed" | "error" | "timeout"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      actionability: [
        "immediate",
        "within_24h",
        "within_week",
        "informational",
      ],
      actionability_level: ["immediate", "urgent", "routine", "informational"],
      assessment_status: [
        "not_started",
        "in_progress",
        "completed",
        "needs_review",
      ],
      notification_category: [
        "security_incident",
        "compliance_alert",
        "assessment_update",
        "poam_reminder",
        "system_maintenance",
      ],
      notification_priority: ["1", "2", "3", "4", "5"],
      notification_type: [
        "security_alert",
        "compliance_finding",
        "assessment_reminder",
        "poam_update",
        "system_status",
      ],
      risk_level: ["critical", "high", "medium", "low"],
      user_role: ["admin", "issm", "isso", "viewer"],
      workflow_status: ["running", "completed", "error", "timeout"],
    },
  },
} as const
