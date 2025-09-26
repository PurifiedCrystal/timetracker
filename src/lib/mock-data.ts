// Temporary mock data layer until database issues are resolved

interface MockTimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  overtime_minutes: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface MockUserProfile {
  id: string;
  location_state: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// In-memory store (would be replaced with Redis in production)
const mockTimeEntries: MockTimeEntry[] = [];
const mockUserProfiles: MockUserProfile[] = [];

export class MockDataService {
  // Time Entries
  static async getTimeEntries(userId: string, options: any = {}) {
    const userEntries = mockTimeEntries.filter(entry => entry.user_id === userId);
    return { data: userEntries, error: null };
  }

  static async getActiveTimeEntry(userId: string) {
    const activeEntry = mockTimeEntries.find(entry =>
      entry.user_id === userId && entry.clock_out === null
    );
    return { data: activeEntry || null, error: null };
  }

  static async createTimeEntry(userId: string, data: any) {
    // Check if user already has active time entry
    const activeEntry = mockTimeEntries.find(entry =>
      entry.user_id === userId && entry.clock_out === null
    );

    if (activeEntry) {
      return { data: null, error: 'User already clocked in' };
    }

    const entry: MockTimeEntry = {
      id: `entry_${Date.now()}`,
      user_id: userId,
      clock_in: data.clock_in,
      clock_out: null,
      duration_minutes: null,
      break_minutes: 0,
      overtime_minutes: 0,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockTimeEntries.push(entry);
    return { data: entry, error: null };
  }

  static async updateTimeEntry(userId: string, entryId: string, updates: any) {
    const entryIndex = mockTimeEntries.findIndex(entry =>
      entry.id === entryId && entry.user_id === userId
    );

    if (entryIndex === -1) {
      return { data: null, error: 'Entry not found' };
    }

    const entry = mockTimeEntries[entryIndex];
    Object.assign(entry, updates);

    if (entry.clock_out) {
      const clockIn = new Date(entry.clock_in);
      const clockOut = new Date(entry.clock_out);
      entry.duration_minutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));
    }

    entry.updated_at = new Date().toISOString();
    return { data: entry, error: null };
  }

  static async clockOut(userId: string, entryId: string, clockOutTime: string, breakMinutes: number = 0) {
    return this.updateTimeEntry(userId, entryId, {
      clock_out: clockOutTime,
      break_minutes: breakMinutes
    });
  }

  // User Profiles
  static async getUserProfile(userId: string) {
    const profile = mockUserProfiles.find(p => p.id === userId);
    if (!profile) {
      // Create default profile
      const defaultProfile: MockUserProfile = {
        id: userId,
        location_state: null,
        timezone: 'America/New_York',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockUserProfiles.push(defaultProfile);
      return { data: defaultProfile, error: null };
    }
    return { data: profile, error: null };
  }

  static async updateUserProfile(userId: string, updates: any) {
    const profileIndex = mockUserProfiles.findIndex(p => p.id === userId);

    if (profileIndex === -1) {
      // Create new profile
      const newProfile: MockUserProfile = {
        id: userId,
        location_state: updates.location_state || null,
        timezone: updates.timezone || 'America/New_York',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockUserProfiles.push(newProfile);
      return { data: newProfile, error: null };
    }

    const profile = mockUserProfiles[profileIndex];
    Object.assign(profile, updates);
    profile.updated_at = new Date().toISOString();
    return { data: profile, error: null };
  }

  // Subscription
  static async getSubscription(userId: string) {
    // Mock subscription - free tier
    return { data: null, error: null };
  }

  // Groups
  static async getGroups(userId: string) {
    return { data: [], error: null };
  }

  // Habits (for dashboard compatibility)
  static async getHabitEntries(userId: string, startDate: string, endDate: string) {
    return { data: [], error: null };
  }

  static async getHabitStats(userId: string) {
    return {
      data: {
        total_habits: 0,
        completed_today: 0,
        streak: 0,
        completion_rate: 0
      },
      error: null
    };
  }

  static async createHabitEntry(userId: string, data: any) {
    return { data: null, error: 'Habits feature requires subscription' };
  }
}