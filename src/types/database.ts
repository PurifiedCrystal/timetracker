export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          location_state: string | null
          timezone: string
          export_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          location_state?: string | null
          timezone?: string
          export_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_state?: string | null
          timezone?: string
          export_preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          clock_in: string
          clock_out: string | null
          duration_minutes: number | null
          break_minutes: number
          overtime_minutes: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clock_in: string
          clock_out?: string | null
          break_minutes?: number
          overtime_minutes?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          clock_in?: string
          clock_out?: string | null
          break_minutes?: number
          overtime_minutes?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'active' | 'past_due' | 'canceled' | 'incomplete'
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'past_due' | 'canceled' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'past_due' | 'canceled' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      export_configurations: {
        Row: {
          id: string
          user_id: string
          name: string
          format: 'csv' | 'pdf' | 'xlsx'
          frequency: 'daily' | 'weekly' | 'monthly'
          schedule_time: string
          email_recipients: string[]
          date_range_days: number
          is_active: boolean
          created_at: string
          last_sent_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          format: 'csv' | 'pdf' | 'xlsx'
          frequency: 'daily' | 'weekly' | 'monthly'
          schedule_time: string
          email_recipients?: string[]
          date_range_days?: number
          is_active?: boolean
          created_at?: string
          last_sent_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          format?: 'csv' | 'pdf' | 'xlsx'
          frequency?: 'daily' | 'weekly' | 'monthly'
          schedule_time?: string
          email_recipients?: string[]
          date_range_days?: number
          is_active?: boolean
          created_at?: string
          last_sent_at?: string | null
        }
      }
      labor_rule_applications: {
        Row: {
          id: string
          time_entry_id: string
          rule_type: 'overtime_daily' | 'overtime_weekly' | 'meal_period'
          rule_value: Json
          applied_at: string
        }
        Insert: {
          id?: string
          time_entry_id: string
          rule_type: 'overtime_daily' | 'overtime_weekly' | 'meal_period'
          rule_value: Json
          applied_at?: string
        }
        Update: {
          id?: string
          time_entry_id?: string
          rule_type?: 'overtime_daily' | 'overtime_weekly' | 'meal_period'
          rule_value?: Json
          applied_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_active_time_entry: {
        Args: {
          p_user_id: string
        }
        Returns: string | null
      }
      calculate_weekly_hours: {
        Args: {
          p_user_id: string
          p_week_start: string
        }
        Returns: number
      }
    }
    Enums: {
      subscription_status: 'active' | 'past_due' | 'canceled' | 'incomplete'
      export_format: 'csv' | 'pdf' | 'xlsx'
      export_frequency: 'daily' | 'weekly' | 'monthly'
      labor_rule_type: 'overtime_daily' | 'overtime_weekly' | 'meal_period'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}