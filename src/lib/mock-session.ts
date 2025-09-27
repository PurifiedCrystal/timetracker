// TEMPORARY: Mock session storage for demo purposes
// This would normally be stored in a database or Redis
// Using globalThis to persist across module reloads in development

declare global {
  var mockTimeTracker: {
    activeSession: any;
    timeEntries: any[];
  } | undefined;
}

if (typeof globalThis.mockTimeTracker === 'undefined') {
  // Create some sample time entries for demo
  const now = new Date();
  const sampleEntries = [
    {
      id: 'demo_entry_1',
      user_id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      clock_in: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      clock_out: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
      duration_minutes: 240,
      metadata: { mode: 'work' },
      group_id: null,
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo_entry_2',
      user_id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      clock_in: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      clock_out: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // 6 hours later
      duration_minutes: 360,
      metadata: { mode: 'work' },
      group_id: null,
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo_entry_3',
      user_id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      clock_in: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      clock_out: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(), // 5 hours later
      duration_minutes: 300,
      metadata: { mode: 'work' },
      group_id: null,
      created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo_entry_4',
      user_id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      clock_in: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      clock_out: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      duration_minutes: 120,
      metadata: { mode: 'work' },
      group_id: null,
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];

  globalThis.mockTimeTracker = {
    activeSession: null,
    timeEntries: sampleEntries
  };
}

const getMockStorage = () => globalThis.mockTimeTracker!;

export function getActiveSession() {
  return getMockStorage().activeSession;
}

export function setActiveSession(session: any) {
  const storage = getMockStorage();
  storage.activeSession = session;
  // Also add to time entries list if not already there
  const exists = storage.timeEntries.find(entry => entry.id === session.id);
  if (!exists) {
    storage.timeEntries.push(session);
  }
  console.log('setActiveSession - stored entry with ID:', session.id);
  console.log('Total timeEntries now:', storage.timeEntries.length);
}

export function clearActiveSession() {
  getMockStorage().activeSession = null;
}

export function getTimeEntries() {
  return getMockStorage().timeEntries;
}

export function addTimeEntry(entry: any) {
  getMockStorage().timeEntries.push(entry);
}

export function updateTimeEntry(id: string, updates: any) {
  console.log('updateTimeEntry called with:', { id, updates });
  const storage = getMockStorage();
  console.log('Current timeEntries:', storage.timeEntries.map(e => ({ id: e.id, clock_out: e.clock_out })));
  console.log('Current activeSession:', storage.activeSession ? { id: storage.activeSession.id, clock_out: storage.activeSession.clock_out } : null);

  const index = storage.timeEntries.findIndex(entry => entry.id === id);
  if (index >= 0) {
    storage.timeEntries[index] = { ...storage.timeEntries[index], ...updates };
    console.log('Updated entry:', storage.timeEntries[index]);

    // If this was the active session, update it too
    if (storage.activeSession && storage.activeSession.id === id) {
      storage.activeSession = storage.timeEntries[index];
      console.log('Updated activeSession:', storage.activeSession);

      // Clear active session if clocking out
      if (updates.clock_out) {
        storage.activeSession = null;
        console.log('Cleared activeSession due to clock_out');
      }
    }
    return storage.timeEntries[index];
  }
  console.log('Entry not found for id:', id);
  return null;
}