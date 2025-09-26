import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { MockDataService } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          user: null,
          session: null,
          subscription_status: null
        },
        { status: 200 }
      );
    }

    // Get user profile information using mock service
    const { data: profile } = await MockDataService.getUserProfile(user.id);

    // Get subscription status using mock service
    const { data: subscription } = await MockDataService.getSubscription(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profile: profile || null
      },
      session: {
        access_token: 'mock_access_token',
        expires_at: Date.now() + 3600000 // 1 hour from now
      },
      subscription_status: subscription ? (subscription as any).status : null
    });

  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}