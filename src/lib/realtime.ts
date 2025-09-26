/**
 * Supabase real-time subscriptions for live updates
 */
import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface TimeEntrySubscriptionCallback {
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

interface SubscriptionManagerOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userId: string;
}

export class RealtimeSubscriptionManager {
  private supabase: any;
  private userId: string;
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  constructor(options: SubscriptionManagerOptions) {
    this.supabase = createClient(options.supabaseUrl, options.supabaseAnonKey);
    this.userId = options.userId;
  }

  /**
   * Subscribe to time entries changes for the current user
   */
  subscribeToTimeEntries(callbacks: TimeEntrySubscriptionCallback): string {
    const subscriptionId = `time-entries-${this.userId}`;

    // Remove existing subscription if it exists
    this.unsubscribe(subscriptionId);

    const channel = this.supabase
      .channel(`time-entries-${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${this.userId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Real-time time entry change:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              callbacks.onInsert?.(payload);
              break;
            case 'UPDATE':
              callbacks.onUpdate?.(payload);
              break;
            case 'DELETE':
              callbacks.onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, channel);
    console.log(`Subscribed to time entries changes for user ${this.userId}`);

    return subscriptionId;
  }

  /**
   * Subscribe to active session status changes
   */
  subscribeToActiveSession(callback: (activeEntry: any | null) => void): string {
    const subscriptionId = `active-session-${this.userId}`;

    // Remove existing subscription if it exists
    this.unsubscribe(subscriptionId);

    const channel = this.supabase
      .channel(`active-session-${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${this.userId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Real-time active session change:', payload);

          // Check if this change affects the active session
          if (payload.eventType === 'INSERT' && !payload.new.clock_out) {
            // New active session started
            callback(payload.new);
          } else if (payload.eventType === 'UPDATE' && payload.old && !payload.old.clock_out && payload.new.clock_out) {
            // Active session ended
            callback(null);
          } else if (payload.eventType === 'UPDATE' && !payload.new.clock_out) {
            // Active session updated
            callback(payload.new);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, channel);
    console.log(`Subscribed to active session changes for user ${this.userId}`);

    return subscriptionId;
  }

  /**
   * Subscribe to subscription status changes
   */
  subscribeToSubscription(callback: (subscription: any) => void): string {
    const subscriptionId = `subscription-${this.userId}`;

    // Remove existing subscription if it exists
    this.unsubscribe(subscriptionId);

    const channel = this.supabase
      .channel(`subscription-${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${this.userId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Real-time subscription change:', payload);
          callback(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, channel);
    console.log(`Subscribed to subscription changes for user ${this.userId}`);

    return subscriptionId;
  }

  /**
   * Subscribe to export configuration changes
   */
  subscribeToExportConfigurations(callback: (configs: any[]) => void): string {
    const subscriptionId = `export-configs-${this.userId}`;

    // Remove existing subscription if it exists
    this.unsubscribe(subscriptionId);

    const channel = this.supabase
      .channel(`export-configs-${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'export_configurations',
          filter: `user_id=eq.${this.userId}`
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Real-time export config change:', payload);

          // Fetch updated list of export configurations
          try {
            const { data: configs, error } = await this.supabase
              .from('export_configurations')
              .select('*')
              .eq('user_id', this.userId)
              .order('created_at', { ascending: false });

            if (!error && configs) {
              callback(configs);
            }
          } catch (error) {
            console.error('Error fetching updated export configurations:', error);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, channel);
    console.log(`Subscribed to export configurations changes for user ${this.userId}`);

    return subscriptionId;
  }

  /**
   * Subscribe to habit entries changes (if habits are enabled)
   */
  subscribeToHabits(callback: (payload: RealtimePostgresChangesPayload<any>) => void): string {
    const subscriptionId = `habits-${this.userId}`;

    // Remove existing subscription if it exists
    this.unsubscribe(subscriptionId);

    const channel = this.supabase
      .channel(`habits-${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habit_entries', // Assuming this table exists
          filter: `user_id=eq.${this.userId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Real-time habit change:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, channel);
    console.log(`Subscribed to habits changes for user ${this.userId}`);

    return subscriptionId;
  }

  /**
   * Subscribe to group notifications (if groups are enabled)
   */
  subscribeToGroupNotifications(callback: (notification: any) => void): string {
    const subscriptionId = `group-notifications-${this.userId}`;

    // Remove existing subscription if it exists
    this.unsubscribe(subscriptionId);

    // This would subscribe to a custom notifications table or use Supabase's broadcast feature
    const channel = this.supabase
      .channel(`group-notifications-${this.userId}`)
      .on('broadcast', { event: 'group_notification' }, (payload: any) => {
        console.log('Real-time group notification:', payload);
        if (payload.payload.userId === this.userId) {
          callback(payload.payload);
        }
      })
      .subscribe();

    this.subscriptions.set(subscriptionId, channel);
    console.log(`Subscribed to group notifications for user ${this.userId}`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const channel = this.subscriptions.get(subscriptionId);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from ${subscriptionId}`);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((channel, subscriptionId) => {
      this.supabase.removeChannel(channel);
      console.log(`Unsubscribed from ${subscriptionId}`);
    });
    this.subscriptions.clear();
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Destroy the manager by unsubscribing from all subscriptions
   */
  destroy(): void {
    this.unsubscribeAll();
  }

  /**
   * Get list of active subscription IDs
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Send a broadcast message to other users (e.g., group notifications)
   */
  async sendBroadcast(channel: string, event: string, payload: any): Promise<void> {
    const broadcastChannel = this.supabase.channel(channel);
    await broadcastChannel.send({
      type: 'broadcast',
      event,
      payload
    });
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' {
    // This is a simplified status check
    // In a real implementation, you might want to track the actual connection status
    return this.subscriptions.size > 0 ? 'OPEN' : 'CLOSED';
  }
}

// Utility function to create a subscription manager
export function createRealtimeManager(userId: string): RealtimeSubscriptionManager {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  return new RealtimeSubscriptionManager({
    supabaseUrl,
    supabaseAnonKey,
    userId
  });
}

// Hooks for React components
export function useRealtimeTimeEntries(userId: string, callbacks: TimeEntrySubscriptionCallback) {
  const manager = createRealtimeManager(userId);

  // Subscribe on mount, cleanup on unmount
  const subscriptionId = manager.subscribeToTimeEntries(callbacks);

  return {
    unsubscribe: () => manager.unsubscribe(subscriptionId),
    manager
  };
}

export function useRealtimeActiveSession(userId: string, callback: (activeEntry: any | null) => void) {
  const manager = createRealtimeManager(userId);

  const subscriptionId = manager.subscribeToActiveSession(callback);

  return {
    unsubscribe: () => manager.unsubscribe(subscriptionId),
    manager
  };
}

// Export types for use in components
export type {
  TimeEntrySubscriptionCallback,
  SubscriptionManagerOptions
};