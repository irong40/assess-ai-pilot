export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_category: string
          settings: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_category: string
          settings: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_category?: string
          settings?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      agent_assessments: {
        Row: {
          agent_id: string
          analysis_result: string | null
          assessment_id: string
          created_at: string
          id: string
          progress: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          analysis_result?: string | null
          assessment_id: string
          created_at?: string
          id?: string
          progress?: number
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          analysis_result?: string | null
          assessment_id?: string
          created_at?: string
          id?: string
          progress?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          compliance_scope: string
          created_at: string
          criticality_level: string | null
          description: string | null
          environment: string
          id: string
          owner_name: string | null
          owner_role: string | null
          status: string
          system_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          compliance_scope: string
          created_at?: string
          criticality_level?: string | null
          description?: string | null
          environment: string
          id?: string
          owner_name?: string | null
          owner_role?: string | null
          status?: string
          system_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          compliance_scope?: string
          created_at?: string
          criticality_level?: string | null
          description?: string | null
          environment?: string
          id?: string
          owner_name?: string | null
          owner_role?: string | null
          status?: string
          system_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string | null
          description: string | null
          headquarters_city: string | null
          headquarters_state: string | null
          id: string
          industry: string | null
          letterhead_template: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          size_category: string | null
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          headquarters_city?: string | null
          headquarters_state?: string | null
          id?: string
          industry?: string | null
          letterhead_template?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          size_category?: string | null
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          headquarters_city?: string | null
          headquarters_state?: string | null
          id?: string
          industry?: string | null
          letterhead_template?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          size_category?: string | null
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_capabilities: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          experience_level: string | null
          id: string
          keywords: string[] | null
          naics_codes: string[] | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          experience_level?: string | null
          id?: string
          keywords?: string[] | null
          naics_codes?: string[] | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          experience_level?: string | null
          id?: string
          keywords?: string[] | null
          naics_codes?: string[] | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_capabilities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_certifications: {
        Row: {
          certification_name: string
          certification_number: string | null
          certification_type: string | null
          company_id: string
          created_at: string
          expiration_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string | null
          issuing_authority: string | null
          updated_at: string
        }
        Insert: {
          certification_name: string
          certification_number?: string | null
          certification_type?: string | null
          company_id: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          updated_at?: string
        }
        Update: {
          certification_name?: string
          certification_number?: string | null
          certification_type?: string | null
          company_id?: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_certifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_naics: {
        Row: {
          company_id: string
          created_at: string
          experience_years: number | null
          id: string
          is_primary: boolean | null
          naics_code: string
          naics_title: string | null
          total_contracts: number | null
          total_value: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          experience_years?: number | null
          id?: string
          is_primary?: boolean | null
          naics_code: string
          naics_title?: string | null
          total_contracts?: number | null
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          experience_years?: number | null
          id?: string
          is_primary?: boolean | null
          naics_code?: string
          naics_title?: string | null
          total_contracts?: number | null
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_naics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_past_performance: {
        Row: {
          client_name: string
          company_id: string
          contract_title: string
          contract_value: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          lessons_learned: string | null
          naics_code: string | null
          performance_rating: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          client_name: string
          company_id: string
          contract_title: string
          contract_value?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          lessons_learned?: string | null
          naics_code?: string | null
          performance_rating?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string
          company_id?: string
          contract_title?: string
          contract_value?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          lessons_learned?: string | null
          naics_code?: string | null
          performance_rating?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_past_performance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          contract_id: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          signature_url: string | null
          signed_at: string | null
          signer_email: string
          signer_name: string
          signer_role: string
          signing_order: number
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          signature_url?: string | null
          signed_at?: string | null
          signer_email: string
          signer_name: string
          signer_role: string
          signing_order: number
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          signature_url?: string | null
          signed_at?: string | null
          signer_email?: string
          signer_name?: string
          signer_role?: string
          signing_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          company_id: string
          content: string
          created_at: string | null
          created_by: string
          dynamic_fields: Json | null
          id: string
          is_default: boolean | null
          name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string | null
          created_by: string
          dynamic_fields?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string | null
          created_by?: string
          dynamic_fields?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          assigned_to: string | null
          client_contact: Json | null
          client_name: string | null
          company_id: string
          content: string | null
          contract_number: string | null
          contract_value: number | null
          created_at: string | null
          created_by: string
          end_date: string | null
          id: string
          milestones: Json | null
          notifications: Json | null
          proposal_id: string | null
          renewal_date: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"] | null
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_contact?: Json | null
          client_name?: string | null
          company_id: string
          content?: string | null
          contract_number?: string | null
          contract_value?: number | null
          created_at?: string | null
          created_by: string
          end_date?: string | null
          id?: string
          milestones?: Json | null
          notifications?: Json | null
          proposal_id?: string | null
          renewal_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_contact?: Json | null
          client_name?: string | null
          company_id?: string
          content?: string | null
          contract_number?: string | null
          contract_value?: number | null
          created_at?: string | null
          created_by?: string
          end_date?: string | null
          id?: string
          milestones?: Json | null
          notifications?: Json | null
          proposal_id?: string | null
          renewal_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_correlations: {
        Row: {
          correlation_reason: string | null
          correlation_score: number | null
          correlation_type: string
          created_at: string | null
          detected_at: string | null
          detection_method: string | null
          id: string
          primary_notification_id: string | null
          related_notification_id: string | null
        }
        Insert: {
          correlation_reason?: string | null
          correlation_score?: number | null
          correlation_type: string
          created_at?: string | null
          detected_at?: string | null
          detection_method?: string | null
          id?: string
          primary_notification_id?: string | null
          related_notification_id?: string | null
        }
        Update: {
          correlation_reason?: string | null
          correlation_score?: number | null
          correlation_type?: string
          created_at?: string | null
          detected_at?: string | null
          detection_method?: string | null
          id?: string
          primary_notification_id?: string | null
          related_notification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_correlations_primary_notification_id_fkey"
            columns: ["primary_notification_id"]
            isOneToOne: false
            referencedRelation: "high_priority_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_correlations_primary_notification_id_fkey"
            columns: ["primary_notification_id"]
            isOneToOne: false
            referencedRelation: "notification_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_correlations_related_notification_id_fkey"
            columns: ["related_notification_id"]
            isOneToOne: false
            referencedRelation: "high_priority_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_correlations_related_notification_id_fkey"
            columns: ["related_notification_id"]
            isOneToOne: false
            referencedRelation: "notification_intelligence"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_intelligence: {
        Row: {
          actionability: Database["public"]["Enums"]["actionability"]
          ai_priority: Database["public"]["Enums"]["notification_priority"]
          category: Database["public"]["Enums"]["notification_category"]
          company_id: string | null
          correlation_data: Json | null
          created_at: string | null
          id: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_category"]
          processed_at: string
          processing_version: string | null
          raw_payload: Json
          real_time_sent: boolean | null
          real_time_sent_at: string | null
          reasoning: string
          recommended_actions: string[] | null
          requires_immediate_attention: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          source: string
          timestamp: string
          updated_at: string | null
          user_role: string | null
          workflow_execution_id: string | null
        }
        Insert: {
          actionability: Database["public"]["Enums"]["actionability"]
          ai_priority: Database["public"]["Enums"]["notification_priority"]
          category: Database["public"]["Enums"]["notification_category"]
          company_id?: string | null
          correlation_data?: Json | null
          created_at?: string | null
          id?: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_category"]
          processed_at?: string
          processing_version?: string | null
          raw_payload?: Json
          real_time_sent?: boolean | null
          real_time_sent_at?: string | null
          reasoning: string
          recommended_actions?: string[] | null
          requires_immediate_attention?: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          source?: string
          timestamp?: string
          updated_at?: string | null
          user_role?: string | null
          workflow_execution_id?: string | null
        }
        Update: {
          actionability?: Database["public"]["Enums"]["actionability"]
          ai_priority?: Database["public"]["Enums"]["notification_priority"]
          category?: Database["public"]["Enums"]["notification_category"]
          company_id?: string | null
          correlation_data?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_category"]
          processed_at?: string
          processing_version?: string | null
          raw_payload?: Json
          real_time_sent?: boolean | null
          real_time_sent_at?: string | null
          reasoning?: string
          recommended_actions?: string[] | null
          requires_immediate_attention?: boolean | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          source?: string
          timestamp?: string
          updated_at?: string | null
          user_role?: string | null
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
          company_id: string | null
          correlation_enabled: boolean | null
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
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          real_time_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_filtering_enabled?: boolean | null
          company_id?: string | null
          correlation_enabled?: boolean | null
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
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          real_time_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_filtering_enabled?: boolean | null
          company_id?: string | null
          correlation_enabled?: boolean | null
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
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          real_time_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          agency: string | null
          company_id: string
          contacts: Json | null
          created_at: string | null
          deadline: string | null
          description: string | null
          estimated_value: number | null
          id: string
          location: string | null
          naics_code: string | null
          opportunity_type: string | null
          requirements: Json | null
          set_aside: string | null
          solicitation_number: string | null
          source_data: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agency?: string | null
          company_id: string
          contacts?: Json | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          location?: string | null
          naics_code?: string | null
          opportunity_type?: string | null
          requirements?: Json | null
          set_aside?: string | null
          solicitation_number?: string | null
          source_data?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agency?: string | null
          company_id?: string
          contacts?: Json | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          location?: string | null
          naics_code?: string | null
          opportunity_type?: string | null
          requirements?: Json | null
          set_aside?: string | null
          solicitation_number?: string | null
          source_data?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          department: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          timezone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          timezone?: string | null
          title?: string | null
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
      proposal_sections: {
        Row: {
          ai_enhanced_content: string | null
          content: string | null
          created_at: string | null
          id: string
          is_ai_enhanced: boolean | null
          proposal_id: string
          section_name: string
          section_order: number
          updated_at: string | null
        }
        Insert: {
          ai_enhanced_content?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_ai_enhanced?: boolean | null
          proposal_id: string
          section_name: string
          section_order: number
          updated_at?: string | null
        }
        Update: {
          ai_enhanced_content?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_ai_enhanced?: boolean | null
          proposal_id?: string
          section_name?: string
          section_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string | null
          created_by: string
          deadline: string | null
          id: string
          opportunity_id: string | null
          status: Database["public"]["Enums"]["proposal_status"] | null
          submitted_at: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          deadline?: string | null
          id?: string
          opportunity_id?: string | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          submitted_at?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          deadline?: string | null
          id?: string
          opportunity_id?: string | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          submitted_at?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          actionability: Database["public"]["Enums"]["actionability"] | null
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
            | Database["public"]["Enums"]["notification_category"]
            | null
          processed_at: string | null
          processing_version: string | null
          raw_payload: Json | null
          real_time_sent: boolean | null
          real_time_sent_at: string | null
          reasoning: string | null
          recommended_actions: string[] | null
          requires_immediate_attention: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          source: string | null
          timestamp: string | null
          updated_at: string | null
          user_name: string | null
          user_role: string | null
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
      workflow_execution_summary: {
        Row: {
          avg_duration_ms: number | null
          failed_executions: number | null
          last_execution: string | null
          successful_executions: number | null
          total_executions: number | null
          total_tokens_used: number | null
          workflow_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_company_with_admin: {
        Args: {
          company_name: string
          company_description?: string
          admin_id?: string
        }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string; company_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_company_permission: {
        Args: {
          user_id: string
          company_id: string
          required_roles: Database["public"]["Enums"]["user_role"][]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      actionability:
        | "immediate"
        | "within_24h"
        | "within_week"
        | "informational"
      app_role: "admin" | "isso" | "issm"
      contract_status:
        | "draft"
        | "pending_approval"
        | "active"
        | "completed"
        | "terminated"
      notification_category:
        | "security_incident"
        | "compliance_alert"
        | "system_status"
        | "assessment_update"
        | "threat_intelligence"
        | "user_action"
        | "general"
      notification_priority: "1" | "2" | "3" | "4" | "5"
      proposal_status:
        | "draft"
        | "in_review"
        | "submitted"
        | "awarded"
        | "rejected"
      risk_level: "critical" | "high" | "medium" | "low" | "informational"
      user_role:
        | "admin"
        | "proposal_writer"
        | "reviewer"
        | "contract_manager"
        | "viewer"
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
      app_role: ["admin", "isso", "issm"],
      contract_status: [
        "draft",
        "pending_approval",
        "active",
        "completed",
        "terminated",
      ],
      notification_category: [
        "security_incident",
        "compliance_alert",
        "system_status",
        "assessment_update",
        "threat_intelligence",
        "user_action",
        "general",
      ],
      notification_priority: ["1", "2", "3", "4", "5"],
      proposal_status: [
        "draft",
        "in_review",
        "submitted",
        "awarded",
        "rejected",
      ],
      risk_level: ["critical", "high", "medium", "low", "informational"],
      user_role: [
        "admin",
        "proposal_writer",
        "reviewer",
        "contract_manager",
        "viewer",
      ],
      workflow_status: ["running", "completed", "error", "timeout"],
    },
  },
} as const
