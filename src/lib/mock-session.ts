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
  globalThis.mockTimeTracker = {
    activeSession: null,
    timeEntries: []
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