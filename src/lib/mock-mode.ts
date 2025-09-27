/**
 * Mock Mode Controller - Instant frontend development
 * Toggle between real API calls and instant mock responses
 */

export const MOCK_MODE = true; // Set to false when ready for real backend

// Mock data store
const mockStore = {
  user: {
    id: 'mock-user-123',
    email: 'demo@timetracker.com',
    name: 'Demo User',
    subscription: {
      plan: 'standard',
      status: 'active',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    settings: {
      california_mode: true,
      notifications: true,
      timezone: 'America/Los_Angeles'
    }
  },

  timeEntries: [
    {
      id: 'entry-1',
      user_id: 'mock-user-123',
      clock_in: '2025-09-26T09:00:00.000Z',
      clock_out: '2025-09-26T17:00:00.000Z',
      metadata: { mode: 'work', project: 'Project A' },
      created_at: '2025-09-26T09:00:00.000Z'
    },
    {
      id: 'entry-2',
      user_id: 'mock-user-123',
      clock_in: '2025-09-25T10:00:00.000Z',
      clock_out: '2025-09-25T18:30:00.000Z',
      metadata: { mode: 'work', project: 'Project B' },
      created_at: '2025-09-25T10:00:00.000Z'
    }
  ],

  activeSession: null as any,

  habits: [
    { id: 'h1', name: 'Drink Water', category: 'Health', target: 8, completed_today: 3 },
    { id: 'h2', name: 'Exercise', category: 'Fitness', target: 1, completed_today: 0 },
    { id: 'h3', name: 'Read', category: 'Learning', target: 30, completed_today: 15 }
  ],

  groups: [
    { id: 'g1', name: 'Development Team', role: 'admin', members: 8 },
    { id: 'g2', name: 'Design Team', role: 'member', members: 4 }
  ],

  exports: [
    { id: 'e1', format: 'csv', status: 'completed', created_at: '2025-09-25T10:00:00.000Z', download_url: '#' },
    { id: 'e2', format: 'pdf', status: 'processing', created_at: '2025-09-26T08:00:00.000Z' }
  ]
};

// Mock API responses with realistic delays
const mockDelay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Auth
  async signIn(email: string, password: string) {
    await mockDelay(300);
    return { success: true, user: mockStore.user };
  },

  async signUp(email: string, password: string) {
    await mockDelay(500);
    return { success: true, user: mockStore.user };
  },

  async getSession() {
    await mockDelay(50);
    return { user: mockStore.user };
  },

  // Time tracking with server timestamp integrity
  async startTimeEntry(metadata: any = {}) {
    await mockDelay(200);
    // Simulate server time - this would come from your backend
    const serverTimestamp = new Date();
    const entry = {
      id: `mock-${Date.now()}`,
      user_id: mockStore.user.id,
      clock_in: serverTimestamp.toISOString(),
      startedAt: serverTimestamp.toISOString(), // For compatibility
      clock_out: null,
      endedAt: null,
      metadata,
      created_at: serverTimestamp.toISOString(),
      // Server provides exact timestamp to prevent client manipulation
      _serverStartTime: serverTimestamp.getTime()
    };
    mockStore.activeSession = entry;
    mockStore.timeEntries.unshift(entry);
    return {
      success: true,
      entry,
      serverTime: serverTimestamp.toISOString(),
      message: 'Time tracking started with server timestamp'
    };
  },

  async stopTimeEntry(id: string) {
    await mockDelay(200);
    const serverStopTime = new Date();
    if (mockStore.activeSession?.id === id) {
      mockStore.activeSession.clock_out = serverStopTime.toISOString();
      mockStore.activeSession.endedAt = serverStopTime.toISOString();
      // Calculate accurate duration based on server timestamps
      if (mockStore.activeSession._serverStartTime) {
        const durationMs = serverStopTime.getTime() - mockStore.activeSession._serverStartTime;
        mockStore.activeSession.duration = Math.floor(durationMs / 1000);
      }
      mockStore.activeSession = null;
    }
    return {
      success: true,
      serverTime: serverStopTime.toISOString(),
      message: 'Time tracking stopped with server timestamp'
    };
  },

  async getActiveSession() {
    await mockDelay(50);
    return { session: mockStore.activeSession };
  },

  async getTimeEntries(filters: any = {}) {
    await mockDelay(100);
    return { entries: mockStore.timeEntries };
  },

  // Habits
  async getHabits() {
    await mockDelay(100);
    return { habits: mockStore.habits };
  },

  async logHabit(habitId: string) {
    await mockDelay(150);
    const habit = mockStore.habits.find(h => h.id === habitId);
    if (habit && habit.completed_today < habit.target) {
      habit.completed_today += 1;
    }
    return { success: true, habit };
  },

  async removeHabitEntry(habitId: string) {
    await mockDelay(150);
    const habit = mockStore.habits.find(h => h.id === habitId);
    if (habit && habit.completed_today > 0) {
      habit.completed_today -= 1;
    }
    return { success: true, habit };
  },

  // Groups
  async getGroups() {
    await mockDelay(100);
    return { groups: mockStore.groups };
  },

  async createGroup(name: string) {
    await mockDelay(300);
    const group = { id: `g${Date.now()}`, name, role: 'admin', members: 1 };
    mockStore.groups.push(group);
    return { success: true, group };
  },

  // Exports
  async generateExport(format: string, filters: any = {}) {
    await mockDelay(400);
    const exportJob = {
      id: `e${Date.now()}`,
      format,
      status: 'processing',
      created_at: new Date().toISOString()
    };
    mockStore.exports.unshift(exportJob);

    // Simulate processing completion after 2 seconds
    setTimeout(() => {
      exportJob.status = 'completed';
      exportJob.download_url = '#mock-download';
    }, 2000);

    return { success: true, export: exportJob };
  },

  async getExports() {
    await mockDelay(100);
    return { exports: mockStore.exports };
  },

  // Settings
  async updateSettings(settings: any) {
    await mockDelay(200);
    Object.assign(mockStore.user.settings, settings);
    return { success: true, settings: mockStore.user.settings };
  },

  // Subscription
  async getSubscription() {
    await mockDelay(100);
    return { subscription: mockStore.user.subscription };
  },

  async updateSubscription(plan: string) {
    await mockDelay(500);
    mockStore.user.subscription.plan = plan;
    return { success: true, subscription: mockStore.user.subscription };
  }
};

// Helper to conditionally use mock or real API
export function useMockApi<T>(mockFn: () => Promise<T>, realFn: () => Promise<T>): Promise<T> {
  return MOCK_MODE ? mockFn() : realFn();
}

// Quick mock responses for instant UI updates
export const instantMock = {
  success: { success: true },
  user: mockStore.user,
  timeEntries: mockStore.timeEntries,
  habits: mockStore.habits,
  groups: mockStore.groups,
  exports: mockStore.exports
};