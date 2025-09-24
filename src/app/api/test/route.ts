import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const supabase = createRouteHandlerClient();

    // Test signup functionality specifically
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    console.log('Testing signUp with:', testEmail);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.error('SignUp test error:', authError);
      return NextResponse.json({
        success: false,
        error: authError.message,
        details: 'SignUp failed',
        errorCode: authError.status,
        authData: authData
      });
    }

    console.log('SignUp test successful:', authData);
    return NextResponse.json({
      success: true,
      message: 'SignUp test successful',
      authData: {
        user: authData.user ? { id: authData.user.id, email: authData.user.email } : null,
        session: authData.session ? { access_token: '***', expires_at: authData.session.expires_at } : null
      },
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name
    }, { status: 500 });
  }
}