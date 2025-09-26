import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { SubscriptionService } from '@/services/SubscriptionService';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const { data: subscription, error } = await SubscriptionService.getSubscription(user.id);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscription
    });

  } catch (error) {
    console.error('Get subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create checkout session
    const { data: checkoutSession, error } = await SubscriptionService.createCheckoutSession(
      user.id,
      user.email || ''
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
      checkout_url: checkoutSession?.checkout_url
    }, { status: 201 });

  } catch (error) {
    console.error('Create subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}