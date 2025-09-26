import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { invitations } from '@/lib/database';

interface RouteParams {
  params: {
    code: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { data: joinResult, error } = await invitations.accept(params.code, user.id);

    if (error) {
      if (error.includes('not found') || error.includes('expired')) {
        return NextResponse.json(
          { error },
          { status: 404 }
        );
      }
      if (error.includes('full')) {
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
      success: true,
      invitation: joinResult,
      message: 'Successfully joined the group!'
    });

  } catch (error) {
    console.error('Join group API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}