import { subscriptions } from '@/lib/database';
import {
  Subscription,
  CreateSubscriptionData,
  UpdateSubscriptionData,
  SubscriptionStatus,
  isActiveSubscription
} from '@/types/subscription';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export class SubscriptionService {
  /**
   * Get user's subscription
   */
  static async getSubscription(userId: string): Promise<{ data: Subscription | null; error: string | null }> {
    return await subscriptions.get(userId) as { data: Subscription | null; error: string | null };
  }

  /**
   * Create or update subscription
   */
  static async upsertSubscription(subscriptionData: CreateSubscriptionData): Promise<{ data: Subscription | null; error: string | null }> {
    return await subscriptions.upsert({
      id: '', // Will be generated
      ...subscriptionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }) as { data: Subscription | null; error: string | null };
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(userId: string, status: SubscriptionStatus): Promise<{ data: Subscription | null; error: string | null }> {
    return await subscriptions.updateStatus(userId, status) as { data: Subscription | null; error: string | null };
  }

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const { data: subscription } = await this.getSubscription(userId);
    return isActiveSubscription(subscription);
  }

  /**
   * Create Stripe checkout session for new subscription
   */
  static async createCheckoutSession(userId: string, userEmail: string): Promise<{ data: { checkout_url: string } | null; error: string | null }> {
    try {
      // Check if user already has active subscription
      if (await this.hasActiveSubscription(userId)) {
        return { data: null, error: 'User already has active subscription' };
      }

      // Get or create Stripe customer
      const { customer, error: customerError } = await this.getOrCreateStripeCustomer(userId, userEmail);
      if (customerError || !customer) {
        return { data: null, error: customerError || 'Failed to create customer' };
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID!, // $1.99/month price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/subscription?canceled=true`,
        metadata: {
          user_id: userId,
        },
        subscription_data: {
          metadata: {
            user_id: userId,
          },
        },
      });

      if (!session.url) {
        return { data: null, error: 'Failed to create checkout session' };
      }

      return {
        data: { checkout_url: session.url },
        error: null
      };

    } catch (err) {
      console.error('Stripe checkout session creation error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown Stripe error'
      };
    }
  }

  /**
   * Create Stripe customer portal session
   */
  static async createPortalSession(userId: string): Promise<{ data: { portal_url: string } | null; error: string | null }> {
    try {
      const { data: subscription } = await this.getSubscription(userId);
      if (!subscription?.stripe_customer_id) {
        return { data: null, error: 'No Stripe customer found' };
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${process.env.NEXTAUTH_URL}/subscription`,
      });

      return {
        data: { portal_url: portalSession.url },
        error: null
      };

    } catch (err) {
      console.error('Stripe portal session creation error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown Stripe error'
      };
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleStripeWebhook(event: Stripe.Event): Promise<{ success: boolean; error?: string }> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);

        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);

        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event.data.object as Stripe.Invoice);

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
          return { success: true };
      }
    } catch (err) {
      console.error('Webhook handling error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown webhook error'
      };
    }
  }

  /**
   * Get or create Stripe customer
   */
  private static async getOrCreateStripeCustomer(userId: string, userEmail: string): Promise<{ customer: Stripe.Customer | null; error: string | null }> {
    try {
      // Check if user already has a Stripe customer
      const { data: subscription } = await this.getSubscription(userId);
      if (subscription?.stripe_customer_id) {
        const customer = await stripe.customers.retrieve(subscription.stripe_customer_id) as Stripe.Customer;
        return { customer, error: null };
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
        },
      });

      return { customer, error: null };

    } catch (err) {
      return {
        customer: null,
        error: err instanceof Error ? err.message : 'Unknown Stripe error'
      };
    }
  }

  /**
   * Handle subscription creation/update webhook
   */
  private static async handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription): Promise<{ success: boolean; error?: string }> {
    const userId = stripeSubscription.metadata.user_id;
    if (!userId) {
      return { success: false, error: 'No user_id in subscription metadata' };
    }

    const subscriptionData: CreateSubscriptionData = {
      user_id: userId,
      stripe_customer_id: typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer.id,
      stripe_subscription_id: stripeSubscription.id,
      status: this.mapStripeStatusToOurStatus(stripeSubscription.status),
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    };

    const { error } = await this.upsertSubscription(subscriptionData);
    return { success: !error, error: error || undefined };
  }

  /**
   * Handle subscription deletion webhook
   */
  private static async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<{ success: boolean; error?: string }> {
    const userId = stripeSubscription.metadata.user_id;
    if (!userId) {
      return { success: false, error: 'No user_id in subscription metadata' };
    }

    const { error } = await this.updateSubscriptionStatus(userId, 'canceled');
    return { success: !error, error: error || undefined };
  }

  /**
   * Handle successful payment webhook
   */
  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<{ success: boolean; error?: string }> {
    if (!invoice.subscription) {
      return { success: true }; // Not a subscription invoice
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
    );

    return await this.handleSubscriptionUpdate(stripeSubscription);
  }

  /**
   * Handle failed payment webhook
   */
  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<{ success: boolean; error?: string }> {
    if (!invoice.subscription) {
      return { success: true }; // Not a subscription invoice
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
    );

    const userId = stripeSubscription.metadata.user_id;
    if (!userId) {
      return { success: false, error: 'No user_id in subscription metadata' };
    }

    const { error } = await this.updateSubscriptionStatus(userId, 'past_due');
    return { success: !error, error: error || undefined };
  }

  /**
   * Map Stripe subscription status to our status enum
   */
  private static mapStripeStatusToOurStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'past_due':
        return 'past_due';
      case 'canceled':
      case 'unpaid':
        return 'canceled';
      case 'incomplete':
      case 'incomplete_expired':
      default:
        return 'incomplete';
    }
  }
}