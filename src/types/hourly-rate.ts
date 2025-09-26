export interface HourlyRate {
  id: string;
  group_id: string;
  user_id: string;
  set_by: string;
  hourly_rate: number;
  currency: string;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HourlyRateWithDetails extends HourlyRate {
  user_name?: string;
  user_email?: string;
  set_by_name?: string;
  group_name?: string;
}

export interface CreateHourlyRateRequest {
  group_id: string;
  user_id: string;
  hourly_rate: number;
  currency?: string;
  effective_from?: string;
}

export interface UpdateHourlyRateRequest {
  hourly_rate?: number;
  currency?: string;
  effective_from?: string;
  effective_until?: string;
}

export interface HourlyRateHistory {
  rates: HourlyRateWithDetails[];
  current_rate?: HourlyRateWithDetails;
  total_changes: number;
}

export interface EarningsCalculation {
  user_id: string;
  user_name?: string;
  hours_worked: number;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  regular_earnings: number;
  overtime_earnings: number;
  total_earnings: number;
  currency: string;
  period_start: string;
  period_end: string;
}