export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionData {
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status?: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
}

export interface UpdateSubscriptionData {
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status?: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
}

// Stripe-related types
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  created: number;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring: {
          interval: string;
          interval_count: number;
        };
      };
    }>;
  };
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer: string | null;
  subscription: string | null;
  status: string;
  success_url: string;
  cancel_url: string;
}

// Subscription utility functions
export function isActiveSubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
}

export function isSubscriptionExpired(subscription: Subscription): boolean {
  // For trialing subscriptions, check trial_end
  if (subscription.status === 'trialing' && subscription.trial_end) {
    const trialEnd = new Date(subscription.trial_end);
    return trialEnd < new Date();
  }

  // For paid subscriptions, check current_period_end
  if (!subscription.current_period_end) return false;
  const endDate = new Date(subscription.current_period_end);
  return endDate < new Date();
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'green';
    case 'trialing':
      return 'blue';
    case 'past_due':
      return 'yellow';
    case 'canceled':
      return 'red';
    case 'incomplete':
      return 'gray';
    default:
      return 'gray';
  }
}

export function getSubscriptionStatusText(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Free Trial';
    case 'past_due':
      return 'Past Due';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
      return 'Incomplete';
    default:
      return 'Unknown';
  }
}

export function formatSubscriptionPeriod(subscription: Subscription): string {
  if (!subscription.current_period_start || !subscription.current_period_end) {
    return 'No active period';
  }

  const start = new Date(subscription.current_period_start);
  const end = new Date(subscription.current_period_end);

  const startFormatted = start.toLocaleDateString();
  const endFormatted = end.toLocaleDateString();

  return `${startFormatted} - ${endFormatted}`;
}

// Pricing constants
export const SUBSCRIPTION_PRICE = 1.99; // $1.99/month
export const SUBSCRIPTION_CURRENCY = 'USD';
export const SUBSCRIPTION_INTERVAL = 'month';

// Free trial constants
export const FREE_TRIAL_DAYS = 14;

// Utility function to create trial end date
export function getTrialEndDate(): Date {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + FREE_TRIAL_DAYS);
  return trialEnd;
}

// Check if trial is still active
export function isTrialActive(subscription: Subscription): boolean {
  if (subscription.status !== 'trialing' || !subscription.trial_end) return false;
  const trialEnd = new Date(subscription.trial_end);
  return trialEnd > new Date();
}

// Get days remaining in trial
export function getTrialDaysRemaining(subscription: Subscription): number {
  if (subscription.status !== 'trialing' || !subscription.trial_end) return 0;
  const trialEnd = new Date(subscription.trial_end);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}