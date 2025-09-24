import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { SubscriptionService } from '@/services/SubscriptionService';

export async function POST(request: NextRequest) {
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

    if (!session.user.email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const { data: checkoutData, error } = await SubscriptionService.createCheckoutSession(
      session.user.id,
      session.user.email
    );

    if (error) {
      if (error.includes('already has active subscription')) {
        return NextResponse.json(
          { error },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      checkout_url: checkoutData?.checkout_url
    });

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}