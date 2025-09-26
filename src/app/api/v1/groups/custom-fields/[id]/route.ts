import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient();

    // TEMPORARY: Mock user for testing
    const user = {
      id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      email: 'demo@timetracker.com',
      user_metadata: { full_name: 'Demo User' }
    };

    const fieldId = params.id;

    if (!fieldId) {
      return NextResponse.json(
        { error: 'Field ID is required' },
        { status: 400 }
      );
    }

    // TODO: Verify user is group admin and owns this field
    // TODO: Soft delete the field
    // UPDATE group_custom_fields
    // SET deleted_at = NOW(), deleted_by = $1
    // WHERE id = $2 AND group_id IN (
    //   SELECT group_id FROM group_memberships
    //   WHERE user_id = $1 AND role = 'admin'
    // )

    return NextResponse.json({
      message: 'Custom field deleted successfully'
    });

  } catch (error) {
    console.error('Delete custom field API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient();

    // TEMPORARY: Mock user for testing
    const user = {
      id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      email: 'demo@timetracker.com',
      user_metadata: { full_name: 'Demo User' }
    };

    const fieldId = params.id;
    const body = await request.json();
    const { name, type, required, placeholder, options } = body;

    if (!fieldId) {
      return NextResponse.json(
        { error: 'Field ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // TODO: Verify user is group admin and owns this field
    // TODO: Update the field
    // UPDATE group_custom_fields
    // SET name = $1, type = $2, required = $3, placeholder = $4, options = $5, updated_at = NOW()
    // WHERE id = $6 AND group_id IN (
    //   SELECT group_id FROM group_memberships
    //   WHERE user_id = $7 AND role = 'admin'
    // )

    const updatedField = {
      id: fieldId,
      name,
      type,
      required: required || false,
      placeholder,
      options: options || [],
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      field: updatedField,
      message: 'Custom field updated successfully'
    });

  } catch (error) {
    console.error('Update custom field API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}