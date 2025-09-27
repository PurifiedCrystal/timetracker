/**
 * React hooks for instant mock data - No API delays during development
 */
import { useState, useEffect } from 'react';
import { MOCK_MODE, mockApi, instantMock } from '@/lib/mock-mode';

export function useTimeTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [timeEntries, setTimeEntries] = useState(instantMock.timeEntries);
  const [loading, setLoading] = useState(false);

  const startTracking = async (metadata = { mode: 'work' }) => {
    if (MOCK_MODE) {
      setLoading(true);
      const result = await mockApi.startTimeEntry(metadata);
      setCurrentSession(result.entry);
      setIsTracking(true);
      setTimeEntries([result.entry, ...timeEntries]);
      setLoading(false);
      return result;
    }
    // Real API call would go here
  };

  const stopTracking = async () => {
    if (MOCK_MODE && currentSession) {
      setLoading(true);
      await mockApi.stopTimeEntry(currentSession.id);
      setCurrentSession(null);
      setIsTracking(false);
      setLoading(false);
    }
    // Real API call would go here
  };

  return {
    isTracking,
    currentSession,
    timeEntries,
    loading,
    startTracking,
    stopTracking
  };
}

export function useHabits() {
  const [habits, setHabits] = useState(instantMock.habits);
  const [loading, setLoading] = useState(false);

  const logHabit = async (habitId: string) => {
    if (MOCK_MODE) {
      setLoading(true);
      const result = await mockApi.logHabit(habitId);
      setHabits(habits.map(h => h.id === habitId ? result.habit : h));
      setLoading(false);
    }
    // Real API call would go here
  };

  const removeHabitEntry = async (habitId: string) => {
    if (MOCK_MODE) {
      setLoading(true);
      const result = await mockApi.removeHabitEntry(habitId);
      setHabits(habits.map(h => h.id === habitId ? result.habit : h));
      setLoading(false);
    }
    // Real API call would go here
  };

  return {
    habits,
    loading,
    logHabit,
    removeHabitEntry
  };
}

export function useExports() {
  const [exports, setExports] = useState(instantMock.exports);
  const [loading, setLoading] = useState(false);

  const generateExport = async (format: string, filters = {}) => {
    if (MOCK_MODE) {
      setLoading(true);
      const result = await mockApi.generateExport(format, filters);
      setExports([result.export, ...exports]);
      setLoading(false);
      return result;
    }
    // Real API call would go here
  };

  return {
    exports,
    loading,
    generateExport
  };
}

export function useAuth() {
  const [user, setUser] = useState(instantMock.user);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    if (MOCK_MODE) {
      setLoading(true);
      const result = await mockApi.signIn(email, password);
      setUser(result.user);
      setLoading(false);
      return result;
    }
    // Real API call would go here
  };

  const signOut = async () => {
    if (MOCK_MODE) {
      setUser(null);
    }
    // Real API call would go here
  };

  return {
    user,
    loading,
    signIn,
    signOut
  };
}

// Quick hook for instant UI state changes (no delays)
export function useInstantUI() {
  return {
    // Toggle states instantly
    toggleCA: (currentState: boolean) => !currentState,
    toggleMode: (currentMode: 'work' | 'habits') =>
      currentMode === 'work' ? 'habits' : 'work',

    // Generate mock data instantly
    mockTimeEntry: () => ({
      id: `instant-${Date.now()}`,
      duration: '2h 30m',
      project: 'Current Project',
      status: 'active'
    }),

    mockNotification: (type: 'success' | 'error' | 'info', message: string) => ({
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    })
  };
}