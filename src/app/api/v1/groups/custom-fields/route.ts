import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // TEMPORARY: Mock user for testing
    const user = {
      id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      email: 'demo@timetracker.com',
      user_metadata: { full_name: 'Demo User' }
    };

    // TODO: Get user's group ID and check if they're an admin
    const groupId = 'default-group';

    // For now, return empty array - this would normally query the database
    // SELECT * FROM group_custom_fields WHERE group_id = $1 AND deleted_at IS NULL

    return NextResponse.json({
      fields: [],
      group_id: groupId
    });

  } catch (error) {
    console.error('Custom fields API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient();

    // TEMPORARY: Mock user for testing
    const user = {
      id: 'c8a6da09-4108-4808-bea6-1a10d8b4c430',
      email: 'demo@timetracker.com',
      user_metadata: { full_name: 'Demo User' }
    };

    // TODO: Verify user is group admin
    const body = await request.json();
    const { name, type, required, placeholder, options, group_id } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // TODO: Insert into database
    // INSERT INTO group_custom_fields (id, group_id, name, type, required, placeholder, options, created_by, created_at)
    // VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NOW())

    const newField = {
      id: Date.now().toString(),
      group_id: group_id || 'default-group',
      name,
      type,
      required: required || false,
      placeholder,
      options: options || [],
      created_by: user.id,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      field: newField,
      message: 'Custom field created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create custom field API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}