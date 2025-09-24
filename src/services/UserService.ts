import { userProfiles } from '@/lib/database';
import { UserProfile, CreateUserProfileData, UpdateUserProfileData } from '@/types/user';

export class UserService {
  /**
   * Get user profile by user ID
   */
  static async getProfile(userId: string): Promise<{ data: UserProfile | null; error: string | null }> {
    return await userProfiles.get(userId);
  }

  /**
   * Create user profile
   */
  static async createProfile(profileData: CreateUserProfileData): Promise<{ data: UserProfile | null; error: string | null }> {
    return await userProfiles.create({
      id: profileData.id,
      location_state: profileData.location_state || null,
      timezone: profileData.timezone || 'America/New_York',
      export_preferences: profileData.export_preferences || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: UpdateUserProfileData): Promise<{ data: UserProfile | null; error: string | null }> {
    return await userProfiles.update(userId, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
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