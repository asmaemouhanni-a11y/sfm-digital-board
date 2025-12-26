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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          category_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          priority: Database["public"]["Enums"]["action_priority"] | null
          requires_validation: boolean | null
          responsible_id: string | null
          status: Database["public"]["Enums"]["action_status"] | null
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          category_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: Database["public"]["Enums"]["action_priority"] | null
          requires_validation?: boolean | null
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["action_status"] | null
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          category_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: Database["public"]["Enums"]["action_priority"] | null
          requires_validation?: boolean | null
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["action_status"] | null
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sfm_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      kpi_values: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          kpi_id: string
          recorded_at: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["kpi_status"] | null
          trend: Database["public"]["Enums"]["kpi_trend"] | null
          value: number
          week_number: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          kpi_id: string
          recorded_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          trend?: Database["public"]["Enums"]["kpi_trend"] | null
          value: number
          week_number?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          kpi_id?: string
          recorded_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["kpi_status"] | null
          trend?: Database["public"]["Enums"]["kpi_trend"] | null
          value?: number
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          category_id: string
          chart_type: Database["public"]["Enums"]["chart_type"] | null
          created_at: string
          created_by: string | null
          critical_threshold: number | null
          description: string | null
          display_order: number | null
          frequency: Database["public"]["Enums"]["kpi_frequency"] | null
          id: string
          is_active: boolean | null
          name: string
          performance_direction: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
          warning_threshold: number | null
        }
        Insert: {
          category_id: string
          chart_type?: Database["public"]["Enums"]["chart_type"] | null
          created_at?: string
          created_by?: string | null
          critical_threshold?: number | null
          description?: string | null
          display_order?: number | null
          frequency?: Database["public"]["Enums"]["kpi_frequency"] | null
          id?: string
          is_active?: boolean | null
          name: string
          performance_direction?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          warning_threshold?: number | null
        }
        Update: {
          category_id?: string
          chart_type?: Database["public"]["Enums"]["chart_type"] | null
          created_at?: string
          created_by?: string | null
          critical_threshold?: number | null
          description?: string | null
          display_order?: number | null
          frequency?: Database["public"]["Enums"]["kpi_frequency"] | null
          id?: string
          is_active?: boolean | null
          name?: string
          performance_direction?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          warning_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sfm_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean | null
          title: string | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sfm_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          assigned_to: string | null
          category_id: string
          created_at: string
          description: string | null
          escalated: boolean | null
          id: string
          reported_by: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["problem_severity"] | null
          status: Database["public"]["Enums"]["problem_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          escalated?: boolean | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["problem_severity"] | null
          status?: Database["public"]["Enums"]["problem_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          escalated?: boolean | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["problem_severity"] | null
          status?: Database["public"]["Enums"]["problem_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "problems_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sfm_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sfm_categories: {
        Row: {
          code: string
          color: string
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          color: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      smart_alerts: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_type: string | null
          severity: string
          title: string | null
          type: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_type?: string | null
          severity: string
          title?: string | null
          type: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_type?: string | null
          severity?: string
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_alerts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sfm_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          action_reminders: boolean | null
          created_at: string | null
          email_alerts: boolean | null
          id: string
          kpi_alerts: boolean | null
          problem_escalation: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_reminders?: boolean | null
          created_at?: string | null
          email_alerts?: boolean | null
          id?: string
          kpi_alerts?: boolean | null
          problem_escalation?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_reminders?: boolean | null
          created_at?: string | null
          email_alerts?: boolean | null
          id?: string
          kpi_alerts?: boolean | null
          problem_escalation?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_priority: "low" | "medium" | "high" | "urgent"
      action_status: "todo" | "in_progress" | "completed" | "overdue"
      app_role: "admin" | "manager" | "team_leader" | "operator"
      chart_type:
        | "pareto"
        | "histogram"
        | "time_series"
        | "control_chart"
        | "box_plot"
      kpi_frequency: "daily" | "weekly" | "monthly"
      kpi_status: "green" | "orange" | "red"
      kpi_trend: "up" | "down" | "stable"
      problem_severity: "low" | "medium" | "high" | "critical"
      problem_status: "open" | "in_progress" | "resolved"
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
      action_priority: ["low", "medium", "high", "urgent"],
      action_status: ["todo", "in_progress", "completed", "overdue"],
      app_role: ["admin", "manager", "team_leader", "operator"],
      chart_type: [
        "pareto",
        "histogram",
        "time_series",
        "control_chart",
        "box_plot",
      ],
      kpi_frequency: ["daily", "weekly", "monthly"],
      kpi_status: ["green", "orange", "red"],
      kpi_trend: ["up", "down", "stable"],
      problem_severity: ["low", "medium", "high", "critical"],
      problem_status: ["open", "in_progress", "resolved"],
    },
  },
} as const
