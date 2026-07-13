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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_version: number
          board_id: string
          confidence_score: number | null
          created_at: string
          decision_brief: string | null
          dimension_results: Json | null
          id: string
          overall_readiness: number | null
          recommendation: string | null
        }
        Insert: {
          analysis_version?: number
          board_id: string
          confidence_score?: number | null
          created_at?: string
          decision_brief?: string | null
          dimension_results?: Json | null
          id?: string
          overall_readiness?: number | null
          recommendation?: string | null
        }
        Update: {
          analysis_version?: number
          board_id?: string
          confidence_score?: number | null
          created_at?: string
          decision_brief?: string | null
          dimension_results?: Json | null
          id?: string
          overall_readiness?: number | null
          recommendation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "decision_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_dimensions: {
        Row: {
          blocking_condition_reason: string | null
          board_id: string
          created_at: string
          dimension_name: string
          id: string
          readiness_level: string | null
          readiness_score: number | null
          status: string
        }
        Insert: {
          blocking_condition_reason?: string | null
          board_id: string
          created_at?: string
          dimension_name: string
          id?: string
          readiness_level?: string | null
          readiness_score?: number | null
          status?: string
        }
        Update: {
          blocking_condition_reason?: string | null
          board_id?: string
          created_at?: string
          dimension_name?: string
          id?: string
          readiness_level?: string | null
          readiness_score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_dimensions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "decision_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_boards: {
        Row: {
          analysis_status: string
          created_at: string
          decision_type: string | null
          description: string | null
          id: string
          owner_id: string
          status: string
          target_date: string | null
          template: string | null
          title: string
          updated_at: string
        }
        Insert: {
          analysis_status?: string
          created_at?: string
          decision_type?: string | null
          description?: string | null
          id?: string
          owner_id: string
          status?: string
          target_date?: string | null
          template?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          analysis_status?: string
          created_at?: string
          decision_type?: string | null
          description?: string | null
          id?: string
          owner_id?: string
          status?: string
          target_date?: string | null
          template?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      evidence: {
        Row: {
          attachment_path: string | null
          attachment_paths: string[]
          created_at: string
          description: string | null
          dimension_id: string
          evidence_date: string | null
          evidence_strength: string | null
          evidence_type: string | null
          file_url: string | null
          id: string
          notes: string | null
          recency: string | null
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_paths?: string[]
          created_at?: string
          description?: string | null
          dimension_id: string
          evidence_date?: string | null
          evidence_strength?: string | null
          evidence_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          recency?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachment_path?: string | null
          attachment_paths?: string[]
          created_at?: string
          description?: string | null
          dimension_id?: string
          evidence_date?: string | null
          evidence_strength?: string | null
          evidence_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          recency?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "assessment_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      final_decisions: {
        Row: {
          board_id: string
          created_at: string
          id: string
          reasoning: string | null
          user_decision: string | null
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          reasoning?: string | null
          user_decision?: string | null
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          reasoning?: string | null
          user_decision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "final_decisions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "decision_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
