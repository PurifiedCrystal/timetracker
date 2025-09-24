export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
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
}

export interface UpdateSubscriptionData {
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status?: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
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
  return subscription.status === 'active';
}

export function isSubscriptionExpired(subscription: Subscription): boolean {
  if (!subscription.current_period_end) return false;
  const endDate = new Date(subscription.current_period_end);
  return endDate < new Date();
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'green';
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