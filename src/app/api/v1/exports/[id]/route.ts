import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { exports } from '@/lib/database';
import { generateTimeTrackingCSV, generateHabitsCSV } from '@/lib/csv-generator';
import { isValidExportFormat, isValidExportFrequency } from '@/types/export';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // For demo purposes, we'll generate a sample export based on the export ID
    // In a real implementation, you'd store export data in a database
    const exportId = params.id;

    // Parse export ID to determine type and format
    // For now, we'll use query params to determine the export type
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'time_tracking';
    const format = searchParams.get('format') || 'csv';

    // Get date range from query params or use last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let exportData;
    let error;

    if (type === 'time_tracking') {
      const result = await exports.generateTimeTracking(user.id, {
        startDate,
        endDate,
        format: format as 'csv' | 'pdf',
        includeBreaks: true
      });
      exportData = result.data;
      error = result.error;
    } else if (type === 'habits') {
      const result = await exports.generateHabits(user.id, {
        startDate,
        endDate,
        format: format as 'csv' | 'pdf'
      });
      exportData = result.data;
      error = result.error;
    }

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    if (format === 'csv') {
      let csvContent: string;

      if (type === 'time_tracking') {
        csvContent = generateTimeTrackingCSV(exportData);
      } else {
        csvContent = generateHabitsCSV(exportData);
      }

      const filename = `${type}_export_${startDate}_to_${endDate}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // For PDF format, return the export data as JSON for now
      return NextResponse.json({
        export: exportData,
        message: 'PDF generation not implemented yet. Here is the data.'
      });
    }

  } catch (error) {
    console.error('Get export API error:', error);
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      schedule_time,
      email_recipients,
      date_range_days,
      is_active
    } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (schedule_time !== undefined) updates.schedule_time = schedule_time;
    if (email_recipients !== undefined) updates.email_recipients = email_recipients;
    if (date_range_days !== undefined) updates.date_range_days = date_range_days;
    if (is_active !== undefined) updates.is_active = is_active;

    // Update export configuration (placeholder - not implemented for simplified exports)
    const configuration = { id: params.id, ...updates };

    // For now, always succeed since this is a placeholder implementation
    // In real implementation, this would update the database and handle errors

    return NextResponse.json({
      configuration
    });

  } catch (error) {
    console.error('Update export configuration API error:', error);
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete export configuration (placeholder - not implemented for simplified exports)
    const success = true;

    // For now, always succeed since this is a placeholder implementation
    // In real implementation, this would delete from database and handle errors

    return NextResponse.json({
      success
    });

  } catch (error) {
    console.error('Delete export configuration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}