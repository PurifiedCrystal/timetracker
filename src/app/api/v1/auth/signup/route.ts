import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { UserService } from '@/services/UserService';

interface SignupRequest {
  email: string;
  password: string;
  timezone?: string;
  location_state?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { email, password, timezone, location_state } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient();

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXTAUTH_URL}/dashboard`
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user profile
    const { data: profile, error: profileError } = await UserService.getOrCreateProfile(
      authData.user.id,
      email,
      {
        email: email,
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        location_state: location_state?.toUpperCase() || null
      }
    );

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the signup if profile creation fails
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile: profile || null
      },
      session: authData.session ? {
        access_token: authData.session.access_token,
        expires_at: authData.session.expires_at
      } : null,
      message: authData.user.email_confirmed_at
        ? 'Account created successfully'
        : 'Account created. Please check your email to confirm your account.'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}