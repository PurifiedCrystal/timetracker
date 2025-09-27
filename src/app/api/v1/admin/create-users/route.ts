import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client with service role key for user management
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 10 } = body;

    const results = [];
    const errors = [];

    console.log(`Creating ${count} test users...`);

    for (let i = 1; i <= count; i++) {
      const email = `user${i}@timetracker.com`;
      const password = `user${i}`;
      const fullName = `Test User ${i}`;

      try {
        // Create user with Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email for testing
          user_metadata: {
            full_name: fullName,
            display_name: fullName
          }
        });

        if (authError) {
          console.error(`Failed to create user${i}:`, authError);
          errors.push({
            user: `user${i}`,
            error: authError.message
          });
          continue;
        }

        results.push({
          id: authData.user.id,
          email,
          password,
          full_name: fullName,
          created_at: authData.user.created_at
        });

        console.log(`✅ Created user${i} (${email})`);

      } catch (error: any) {
        console.error(`Error creating user${i}:`, error);
        errors.push({
          user: `user${i}`,
          error: error.message || 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} users successfully`,
      users: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total_requested: count,
        successfully_created: results.length,
        failed: errors.length
      }
    });

  } catch (error: any) {
    console.error('Bulk user creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create users',
        details: error.message
      },
      { status: 500 }
    );
  }
}