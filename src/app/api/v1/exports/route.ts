import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { ExportService } from '@/services/ExportService';
import { isValidExportFormat, isValidExportFrequency } from '@/types/export';

export async function GET(request: NextRequest) {
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

    // Get user's export configurations
    const { data: configurations, error } = await ExportService.getExportConfigurations(user.id);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      configurations: configurations || []
    });

  } catch (error) {
    console.error('Get export configurations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      format,
      frequency,
      schedule_time,
      email_recipients,
      date_range_days,
      is_active
    } = body;

    // Validate required fields
    if (!name || !format || !frequency || !schedule_time) {
      return NextResponse.json(
        { error: 'Missing required fields: name, format, frequency, schedule_time' },
        { status: 400 }
      );
    }

    // Validate format and frequency
    if (!isValidExportFormat(format)) {
      return NextResponse.json(
        { error: 'Invalid export format. Must be csv, pdf, or xlsx' },
        { status: 400 }
      );
    }

    if (!isValidExportFrequency(frequency)) {
      return NextResponse.json(
        { error: 'Invalid export frequency. Must be daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    // Create export configuration
    const { data: configuration, error } = await ExportService.createExportConfiguration({
      user_id: user.id,
      name,
      format,
      frequency,
      schedule_time,
      email_recipients,
      date_range_days,
      is_active
    });

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      configuration
    }, { status: 201 });

  } catch (error) {
    console.error('Create export configuration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}