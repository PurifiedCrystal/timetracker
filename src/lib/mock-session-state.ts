/**
 * Mock Session State Manager
 *
 * Simple in-memory state management for mock development when database operations fail.
 * This provides consistent state between clock-in/out and active entry checks.
 */

interface MockTimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  project?: string;
  task?: string;
  description?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface MockSessionState {
  user_id: string;
  is_clocked_in: boolean;
  active_time_entry_id: string | null;
  timezone: string;
  last_activity: string;
  updated_at: string;
}

// In-memory storage for mock sessions
const mockSessions = new Map<string, MockSessionState>();
const mockTimeEntries = new Map<string, MockTimeEntry>();

export class MockSessionManager {

  static getSessionState(userId: string): MockSessionState | null {
    return mockSessions.get(userId) || null;
  }

  static setSessionState(userId: string, sessionState: MockSessionState): void {
    mockSessions.set(userId, sessionState);
  }

  static getActiveTimeEntry(userId: string): MockTimeEntry | null {
    const session = mockSessions.get(userId);
    if (!session || !session.is_clocked_in || !session.active_time_entry_id) {
      return null;
    }
    return mockTimeEntries.get(session.active_time_entry_id) || null;
  }

  static clockIn(userId: string, data: {
    project?: string;
    task?: string;
    description?: string;
    timezone?: string;
  }): MockTimeEntry {
    const now = new Date().toISOString();
    const entryId = Math.random().toString(36).substring(2, 15);

    const timeEntry: MockTimeEntry = {
      id: entryId,
      user_id: userId,
      clock_in: now,
      clock_out: null,
      project: data.project,
      task: data.task,
      description: data.description,
      timezone: data.timezone || 'UTC',
      created_at: now,
      updated_at: now
    };

    const sessionState: MockSessionState = {
      user_id: userId,
      is_clocked_in: true,
      active_time_entry_id: entryId,
      timezone: data.timezone || 'UTC',
      last_activity: now,
      updated_at: now
    };

    mockTimeEntries.set(entryId, timeEntry);
    mockSessions.set(userId, sessionState);

    return timeEntry;
  }

  static initializeFromDatabaseEntry(userId: string, dbEntry: {
    id: string;
    clock_in: string;
    project?: string;
    task?: string;
    description?: string;
    timezone?: string;
  }): MockTimeEntry {
    const timeEntry: MockTimeEntry = {
      id: dbEntry.id,
      user_id: userId,
      clock_in: dbEntry.clock_in,
      clock_out: null,
      project: dbEntry.project,
      task: dbEntry.task,
      description: dbEntry.description,
      timezone: dbEntry.timezone || 'UTC',
      created_at: dbEntry.clock_in,
      updated_at: new Date().toISOString()
    };

    const sessionState: MockSessionState = {
      user_id: userId,
      is_clocked_in: true,
      active_time_entry_id: dbEntry.id,
      timezone: dbEntry.timezone || 'UTC',
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockTimeEntries.set(dbEntry.id, timeEntry);
    mockSessions.set(userId, sessionState);

    return timeEntry;
  }

  static clockOut(userId: string, data: {
    description?: string;
    timezone?: string;
  }): MockTimeEntry | null {
    const session = mockSessions.get(userId);
    if (!session || !session.is_clocked_in || !session.active_time_entry_id) {
      return null;
    }

    const timeEntry = mockTimeEntries.get(session.active_time_entry_id);
    if (!timeEntry) {
      return null;
    }

    const now = new Date().toISOString();
    const clockInTime = new Date(timeEntry.clock_in);
    const clockOutTime = new Date(now);
    const durationMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));

    // Update time entry with clock out
    const updatedTimeEntry: MockTimeEntry = {
      ...timeEntry,
      clock_out: now,
      description: data.description || timeEntry.description,
      updated_at: now
    };

    // Update session state to clocked out
    const updatedSessionState: MockSessionState = {
      ...session,
      is_clocked_in: false,
      active_time_entry_id: null,
      last_activity: now,
      updated_at: now
    };

    mockTimeEntries.set(timeEntry.id, updatedTimeEntry);
    mockSessions.set(userId, updatedSessionState);

    return updatedTimeEntry;
  }

  static getCurrentDuration(userId: string): number {
    const activeEntry = this.getActiveTimeEntry(userId);
    if (!activeEntry) {
      return 0;
    }

    const clockInTime = new Date(activeEntry.clock_in);
    const currentTime = new Date();
    return Math.floor((currentTime.getTime() - clockInTime.getTime()) / (1000 * 60));
  }

  static clearUserData(userId: string): void {
    const session = mockSessions.get(userId);
    if (session && session.active_time_entry_id) {
      mockTimeEntries.delete(session.active_time_entry_id);
    }
    mockSessions.delete(userId);
  }
}