export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  location_state: string | null;
  timezone: string;
  export_preferences: Record<string, any>;
  california_mode: boolean; // New field for California labor law compliance
  tracking_mode: 'work' | 'habits'; // New field for dual-mode tracking
  created_at: string;
  updated_at: string;
}

export interface CreateUserProfileData {
  id: string;
  email?: string;
  full_name?: string;
  location_state?: string | null;
  timezone?: string;
  export_preferences?: Record<string, any>;
  california_mode?: boolean;
  tracking_mode?: 'work' | 'habits';
}

export interface UpdateUserProfileData {
  full_name?: string;
  location_state?: string | null;
  timezone?: string;
  export_preferences?: Record<string, any>;
  california_mode?: boolean;
  tracking_mode?: 'work' | 'habits';
}

export interface UserWithProfile extends User {
  profile?: UserProfile;
}

// US State codes for location validation
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

export type USState = typeof US_STATES[number];

export function isValidUSState(state: string): state is USState {
  return US_STATES.includes(state as USState);
}

// Common timezone options
export const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
] as const;

export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}