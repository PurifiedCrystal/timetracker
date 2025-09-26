/**
 * Unit tests for HabitTrackerMode component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HabitTrackerMode } from '@/components/HabitTrackerMode';

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Hash: () => <div data-testid="hash-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Target: () => <div data-testid="target-icon" />
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('HabitTrackerMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  const mockHabits = [
    {
      id: 'habit-1',
      name: 'Morning Exercise',
      category: 'Health',
      type: 'duration',
      target_value: 30,
      color: '#10B981'
    },
    {
      id: 'habit-2',
      name: 'Read Books',
      category: 'Learning',
      type: 'count',
      target_value: 25,
      color: '#3B82F6'
    },
    {
      id: 'habit-3',
      name: 'Meditation',
      category: 'Wellness',
      type: 'boolean',
      target_value: 1,
      color: '#8B5CF6'
    }
  ];

  const mockTodayEntries = [
    {
      id: 'entry-1',
      habit_id: 'habit-1',
      date: new Date().toISOString().split('T')[0],
      completed: true,
      value: 45,
      notes: 'Good workout'
    }
  ];

  it('should render habit tracker interface', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: mockTodayEntries })
      });

    render(<HabitTrackerMode />);

    expect(screen.getByText('Habit Tracker')).toBeInTheDocument();
    expect(screen.getByText('Track your daily habits and build positive routines')).toBeInTheDocument();

    // Wait for habits to load
    await waitFor(() => {
      expect(screen.getByText('Morning Exercise')).toBeInTheDocument();
      expect(screen.getByText('Read Books')).toBeInTheDocument();
      expect(screen.getByText('Meditation')).toBeInTheDocument();
    });
  });

  it('should display loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<HabitTrackerMode />);

    expect(screen.getByText('Loading habits...')).toBeInTheDocument();
  });

  it('should display error state when habits fail to load', async () => {
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Failed to fetch habits'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load habits. Please try again.')).toBeInTheDocument();
    });
  });

  it('should show completed habits with check mark', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: mockTodayEntries })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      const completedHabit = screen.getByTestId('habit-habit-1');
      expect(completedHabit).toHaveClass('bg-green-50');
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });

  it('should allow user to mark habit as complete', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] }) // No completed habits initially
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entry: { id: 'new-entry', habit_id: 'habit-2' } })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('Read Books')).toBeInTheDocument();
    });

    const readBooksHabit = screen.getByTestId('habit-habit-2');
    fireEvent.click(readBooksHabit);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/v1/habits/entries', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('habit-2')
      }));
    });
  });

  it('should display different habit types correctly', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      // Duration type habit should show clock icon
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();

      // Count type habit should show hash icon
      expect(screen.getByTestId('hash-icon')).toBeInTheDocument();

      // Boolean type habit should show target icon
      expect(screen.getByTestId('target-icon')).toBeInTheDocument();
    });
  });

  it('should show habit categories', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('Learning')).toBeInTheDocument();
      expect(screen.getByText('Wellness')).toBeInTheDocument();
    });
  });

  it('should display target values for habits', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('30 min')).toBeInTheDocument(); // Duration target
      expect(screen.getByText('25 pages')).toBeInTheDocument(); // Count target
      expect(screen.getByText('Complete')).toBeInTheDocument(); // Boolean target
    });
  });

  it('should show progress for partially completed habits', async () => {
    const partialEntry = {
      id: 'entry-2',
      habit_id: 'habit-2',
      date: new Date().toISOString().split('T')[0],
      completed: false,
      value: 15, // 15 out of 25 pages
      notes: 'Making progress'
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [partialEntry] })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('15 / 25')).toBeInTheDocument(); // Progress indicator
    });
  });

  it('should show add new habit button', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('Add New Habit')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });
  });

  it('should display empty state when no habits exist', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('No habits yet')).toBeInTheDocument();
      expect(screen.getByText('Start building positive habits by adding your first one!')).toBeInTheDocument();
    });
  });

  it('should handle habit completion with custom values', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entry: { id: 'new-entry', habit_id: 'habit-1' } })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('Morning Exercise')).toBeInTheDocument();
    });

    // For duration habits, should allow custom value input
    const exerciseHabit = screen.getByTestId('habit-habit-1');
    fireEvent.click(exerciseHabit);

    // Mock implementation would show input dialog for duration/count habits
    // In a real implementation, this would trigger a modal or inline input
  });

  it('should refresh data when habit is completed', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: mockHabits })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entry: { id: 'new-entry' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: mockTodayEntries })
      });

    render(<HabitTrackerMode />);

    await waitFor(() => {
      expect(screen.getByText('Morning Exercise')).toBeInTheDocument();
    });

    const exerciseHabit = screen.getByTestId('habit-habit-1');
    fireEvent.click(exerciseHabit);

    await waitFor(() => {
      // Should refresh entries after completion
      expect(fetch).toHaveBeenCalledTimes(4); // Initial habits, initial entries, post entry, refresh entries
    });
  });

  it('should display today\'s date prominently', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ habits: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      });

    render(<HabitTrackerMode />);

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    await waitFor(() => {
      expect(screen.getByText(today)).toBeInTheDocument();
    });
  });
});