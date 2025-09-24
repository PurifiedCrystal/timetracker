import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

interface SigninRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SigninRequest = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient();

    // Attempt to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please check your email and confirm your account before signing in' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Failed to sign in' },
        { status: 500 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Get subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile: profile || null
      },
      session: {
        access_token: authData.session.access_token,
        expires_at: authData.session.expires_at
      },
      subscription_status: subscription ? (subscription as any).status : null
    });

  } catch (error) {
    console.error('Signin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}