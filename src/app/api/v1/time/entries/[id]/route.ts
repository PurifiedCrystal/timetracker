import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { TimeEntryService } from '@/services/TimeEntryService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: entry, error } = await TimeEntryService.getTimeEntry(session.user.id, params.id);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Time entry not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entry
    });

  } catch (error) {
    console.error('Get time entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { clock_out, break_minutes, metadata } = body;

    // If clock_out is provided, this is a clock out operation
    if (clock_out !== undefined) {
      const { data: entry, error } = await TimeEntryService.clockOut(
        session.user.id,
        params.id,
        clock_out,
        break_minutes || 0
      );

      if (error) {
        if (error.includes('not found')) {
          return NextResponse.json(
            { error: 'Time entry not found' },
            { status: 404 }
          );
        }
        if (error.includes('already completed')) {
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
        entry
      });
    }

    // Otherwise, this is a general update
    const updates: any = {};
    if (break_minutes !== undefined) updates.break_minutes = break_minutes;
    if (metadata !== undefined) updates.metadata = metadata;

    const { data: entry, error } = await TimeEntryService.updateTimeEntry(
      session.user.id,
      params.id,
      updates
    );

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Time entry not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      entry
    });

  } catch (error) {
    console.error('Update time entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: success, error } = await TimeEntryService.deleteTimeEntry(session.user.id, params.id);

    if (error) {
      if (error.includes('not found')) {
        return NextResponse.json(
          { error: 'Time entry not found' },
          { status: 404 }
        );
      }
      if (error.includes('Cannot delete active')) {
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
      success
    });

  } catch (error) {
    console.error('Delete time entry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}