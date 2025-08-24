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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          id: string
          is_encrypted: boolean | null
          setting_key: string
          setting_value: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          setting_key: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_models: {
        Row: {
          context_length: number | null
          created_at: string
          description: string | null
          id: string
          input_cost: number | null
          is_active: boolean | null
          model_id: string
          name: string
          output_cost: number | null
          provider: string
        }
        Insert: {
          context_length?: number | null
          created_at?: string
          description?: string | null
          id?: string
          input_cost?: number | null
          is_active?: boolean | null
          model_id: string
          name: string
          output_cost?: number | null
          provider?: string
        }
        Update: {
          context_length?: number | null
          created_at?: string
          description?: string | null
          id?: string
          input_cost?: number | null
          is_active?: boolean | null
          model_id?: string
          name?: string
          output_cost?: number | null
          provider?: string
        }
        Relationships: []
      }
      analysis_history: {
        Row: {
          analysis_result: Json | null
          analysis_type: string | null
          created_at: string
          id: string
          idea_text: string
          language: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_result?: Json | null
          analysis_type?: string | null
          created_at?: string
          id?: string
          idea_text: string
          language?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_result?: Json | null
          analysis_type?: string | null
          created_at?: string
          id?: string
          idea_text?: string
          language?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          message_type: string | null
          name: string
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          message_type?: string | null
          name: string
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          message_type?: string | null
          name?: string
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          analysis_count: number
          created_at: string | null
          id: string
          marketing_plan_count: number
          updated_at: string | null
          usage_date: string
          user_id: string | null
        }
        Insert: {
          analysis_count?: number
          created_at?: string | null
          id?: string
          marketing_plan_count?: number
          updated_at?: string | null
          usage_date?: string
          user_id?: string | null
        }
        Update: {
          analysis_count?: number
          created_at?: string | null
          id?: string
          marketing_plan_count?: number
          updated_at?: string | null
          usage_date?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
          target_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message: string
          target_url?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message?: string
          target_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          name: string
          price: number | null
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          name: string
          price?: number | null
          type: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          name?: string
          price?: number | null
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_ideas: {
        Row: {
          analysis_result: Json | null
          created_at: string
          id: string
          idea_text: string
          is_web_project: boolean | null
          language: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string
          id?: string
          idea_text: string
          is_web_project?: boolean | null
          language?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string
          id?: string
          idea_text?: string
          is_web_project?: boolean | null
          language?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          price: number | null
          service_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          price?: number | null
          service_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          price?: number | null
          service_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: {
        Args: { assigned_by_id: string; target_email: string }
        Returns: Json
      }
      increment_daily_usage: {
        Args: { p_usage_type: string; p_user_id: string }
        Returns: Json
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      remove_admin_role: {
        Args: { removed_by_id: string; target_email: string }
        Returns: Json
      }
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
