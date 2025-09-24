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

    // Create Stripe customer portal session
    const { data: portalData, error } = await SubscriptionService.createPortalSession(session.user.id);

    if (error) {
      if (error.includes('No Stripe customer found')) {
        return NextResponse.json(
          { error: 'No subscription found. Please subscribe first.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      portal_url: portalData?.portal_url
    });

  } catch (error) {
    console.error('Portal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}