import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { SubscriptionService } from '@/services/SubscriptionService';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const { data: subscription, error } = await SubscriptionService.getSubscription(session.user.id);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    // Check if user has active subscription
    const hasActiveSubscription = await SubscriptionService.hasActiveSubscription(session.user.id);

    return NextResponse.json({
      subscription,
      has_active_subscription: hasActiveSubscription
    });

  } catch (error) {
    console.error('Subscription status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}