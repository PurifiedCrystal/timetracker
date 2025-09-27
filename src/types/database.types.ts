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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      export_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          date_range_end: string
          date_range_start: string
          email_delivered: boolean
          email_sent: boolean
          error_message: string | null
          execution_duration_ms: number | null
          export_type: string
          file_path: string | null
          file_size_bytes: number | null
          format: string
          group_id: string | null
          id: string
          schedule_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date_range_end: string
          date_range_start: string
          email_delivered?: boolean
          email_sent?: boolean
          error_message?: string | null
          execution_duration_ms?: number | null
          export_type?: string
          file_path?: string | null
          file_size_bytes?: number | null
          format: string
          group_id?: string | null
          id?: string
          schedule_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          email_delivered?: boolean
          email_sent?: boolean
          error_message?: string | null
          execution_duration_ms?: number | null
          export_type?: string
          file_path?: string | null
          file_size_bytes?: number | null
          format?: string
          group_id?: string | null
          id?: string
          schedule_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "export_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      export_schedules: {
        Row: {
          created_at: string
          created_by: string
          export_time: string
          export_timezone: string
          group_id: string
          id: string
          is_active: boolean
          is_hourly_basis: boolean
          last_executed_at: string | null
          next_execution_at: string
          recipient_email: string
          recipient_name: string
          target_scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          export_time: string
          export_timezone?: string
          group_id: string
          id?: string
          is_active?: boolean
          is_hourly_basis?: boolean
          last_executed_at?: string | null
          next_execution_at: string
          recipient_email: string
          recipient_name: string
          target_scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          export_time?: string
          export_timezone?: string
          group_id?: string
          id?: string
          is_active?: boolean
          is_hourly_basis?: boolean
          last_executed_at?: string | null
          next_execution_at?: string
          recipient_email?: string
          recipient_name?: string
          target_scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_schedules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          added_by: string | null
          can_export_data: boolean
          can_view_reports: boolean
          group_id: string
          hourly_rate: number | null
          id: string
          is_active: boolean
          joined_at: string | null
          last_activity_at: string | null
          notes: string | null
          removed_at: string | null
          removed_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          can_export_data?: boolean
          can_view_reports?: boolean
          group_id: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          joined_at?: string | null
          last_activity_at?: string | null
          notes?: string | null
          removed_at?: string | null
          removed_by?: string | null
          role?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          can_export_data?: boolean
          can_view_reports?: boolean
          group_id?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          joined_at?: string | null
          last_activity_at?: string | null
          notes?: string | null
          removed_at?: string | null
          removed_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          manager_id: string
          max_members: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id: string
          max_members?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string
          max_members?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_entries: {
        Row: {
          completed_at: string | null
          count_value: number | null
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          entry_date: string | null
          entry_type: string
          habit_category: string | null
          habit_name: string
          id: string
          mood_rating: number | null
          notes: string | null
          start_time: string | null
          target_value: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          count_value?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          entry_date?: string | null
          entry_type?: string
          habit_category?: string | null
          habit_name: string
          id?: string
          mood_rating?: number | null
          notes?: string | null
          start_time?: string | null
          target_value?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          count_value?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          entry_date?: string | null
          entry_type?: string
          habit_category?: string | null
          habit_name?: string
          id?: string
          mood_rating?: number | null
          notes?: string | null
          start_time?: string | null
          target_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hourly_rates: {
        Row: {
          created_at: string | null
          currency: string
          effective_from: string | null
          effective_until: string | null
          group_id: string
          hourly_rate: number
          id: string
          is_active: boolean | null
          set_by: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          effective_from?: string | null
          effective_until?: string | null
          group_id: string
          hourly_rate: number
          id?: string
          is_active?: boolean | null
          set_by: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          effective_from?: string | null
          effective_until?: string | null
          group_id?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          set_by?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hourly_rates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hourly_rates_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hourly_rates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          access_count: number
          created_at: string | null
          declined_at: string | null
          expires_at: string | null
          generation_count: number
          group_id: string
          id: string
          invitation_code: string
          invited_by: string
          invited_email: string | null
          ip_address: unknown | null
          last_accessed_at: string | null
          qr_code_data: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_count?: number
          created_at?: string | null
          declined_at?: string | null
          expires_at?: string | null
          generation_count?: number
          group_id: string
          id?: string
          invitation_code: string
          invited_by: string
          invited_email?: string | null
          ip_address?: unknown | null
          last_accessed_at?: string | null
          qr_code_data?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_count?: number
          created_at?: string | null
          declined_at?: string | null
          expires_at?: string | null
          generation_count?: number
          group_id?: string
          id?: string
          invitation_code?: string
          invited_by?: string
          invited_email?: string | null
          ip_address?: unknown | null
          last_accessed_at?: string | null
          qr_code_data?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          break_minutes: number | null
          clock_in: string
          clock_out: string | null
          created_at: string | null
          duration_minutes: number | null
          group_id: string | null
          id: string
          metadata: Json
          overtime_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_minutes?: number | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          group_id?: string | null
          id?: string
          metadata?: Json
          overtime_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_minutes?: number | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          group_id?: string | null
          id?: string
          metadata?: Json
          overtime_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          california_mode: boolean | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          tracking_mode:
            | Database["public"]["Enums"]["tracking_mode_enum"]
            | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          california_mode?: boolean | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          tracking_mode?:
            | Database["public"]["Enums"]["tracking_mode_enum"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          california_mode?: boolean | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          tracking_mode?:
            | Database["public"]["Enums"]["tracking_mode_enum"]
            | null
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
      generate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "trialing"
      tracking_mode_enum: "work" | "habits"
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
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "trialing",
      ],
      tracking_mode_enum: ["work", "habits"],
    },
  },
} as const