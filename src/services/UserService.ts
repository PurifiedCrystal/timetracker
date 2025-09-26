import { userProfiles } from '@/lib/database';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, CreateUserProfileData, UpdateUserProfileData } from '@/types/user';

// For testing, create admin client with service role key directly
const supabaseAdmin = createClient(
  'https://kgwklydkmeihoulipqof.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2tseWRrbWVpaG91bGlwcW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyODA5OSwiZXhwIjoyMDc0MzA0MDk5fQ.YZ2qyKTGNJH_Hl1l7yiQ9O4kQaECNSXfQmTePNzTG0Y',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export class UserService {
  /**
   * Get user profile by user ID
   */
  static async getProfile(userId: string): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const result = await userProfiles.get(userId);

      // If profile doesn't exist, return null (not an error)
      if (result.error && result.error.includes('No rows')) {
        return { data: null, error: null };
      }

      return {
        data: result.data as UserProfile | null,
        error: result.error
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { data: null, error: null }; // Return null instead of error to prevent crashes
    }
  }

  /**
   * Create user profile
   */
  static async createProfile(profileData: CreateUserProfileData): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      // Use admin client to bypass RLS for profile creation
      const admin = supabaseAdmin;
      const { data, error } = await admin
        .from('user_profiles')
        .upsert([{
          user_id: profileData.id,
          email: profileData.email || '',
          full_name: profileData.full_name || null,
          california_mode: profileData.location_state === 'CA',
          tracking_mode: 'work',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        return { data: null, error: error.message };
      }

      return { data: data as UserProfile, error: null };
    } catch (err) {
      console.error('Profile creation exception:', err);
      return { data: null, error: 'Failed to create profile' };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: UpdateUserProfileData): Promise<{ data: UserProfile | null; error: string | null }> {
    const result = await userProfiles.update(userId, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    return {
      data: result.data as UserProfile | null,
      error: result.error
    };
  }

  /**
   * Check if user has a profile
   */
  static async hasProfile(userId: string): Promise<boolean> {
    const { data } = await this.getProfile(userId);
    return data !== null;
  }

  /**
   * Get or create user profile
   * Useful for ensuring profile exists after signup
   */
  static async getOrCreateProfile(userId: string, email: string, initialData?: Partial<CreateUserProfileData>): Promise<{ data: UserProfile | null; error: string | null }> {
    // Try to get existing profile first
    const { data: existingProfile, error: getError } = await this.getProfile(userId);

    if (existingProfile) {
      return { data: existingProfile, error: null };
    }

    if (getError && !getError.includes('not found') && !getError.includes('No rows')) {
      return { data: null, error: getError };
    }

    // Profile doesn't exist, create it
    return await this.createProfile({
      id: userId,
      email: email,
      timezone: initialData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      location_state: initialData?.location_state || null,
      export_preferences: initialData?.export_preferences || {},
    });
  }

  /**
   * Update user timezone based on browser detection
   */
  static async updateTimezone(userId: string, timezone: string): Promise<{ data: UserProfile | null; error: string | null }> {
    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      return { data: null, error: 'Invalid timezone' };
    }

    return await this.updateProfile(userId, { timezone });
  }

  /**
   * Update user location state (for labor rules)
   */
  static async updateLocationState(userId: string, locationState: string | null): Promise<{ data: UserProfile | null; error: string | null }> {
    // Validate state code if provided
    if (locationState && locationState.length !== 2) {
      return { data: null, error: 'Location state must be a 2-character state code' };
    }

    return await this.updateProfile(userId, {
      location_state: locationState?.toUpperCase() || null
    });
  }

  /**
   * Update export preferences
   */
  static async updateExportPreferences(userId: string, preferences: Record<string, any>): Promise<{ data: UserProfile | null; error: string | null }> {
    return await this.updateProfile(userId, { export_preferences: preferences });
  }

  /**
   * Check if user is in California (for labor rules)
   */
  static async isCaliforniaUser(userId: string): Promise<boolean> {
    const { data: profile } = await this.getProfile(userId);
    return profile?.location_state === 'CA';
  }

  /**
   * Get user's timezone
   */
  static async getUserTimezone(userId: string): Promise<string> {
    const { data: profile } = await this.getProfile(userId);
    return profile?.timezone || 'America/New_York';
  }

  /**
   * Delete user profile (soft delete by clearing data)
   */
  static async deleteProfile(userId: string): Promise<{ data: boolean; error: string | null }> {
    const { data: profile, error } = await this.updateProfile(userId, {
      location_state: null,
      timezone: 'UTC',
      export_preferences: {},
    });

    if (error) {
      return { data: false, error };
    }

    return { data: true, error: null };
  }
}