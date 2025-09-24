import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { ExportService } from '@/services/ExportService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { GenerateExportRequest, isValidExportFormat } from '@/types/export';

export async function POST(request: NextRequest) {
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

    // Check if user has active subscription
    const hasActiveSubscription = await SubscriptionService.hasActiveSubscription(session.user.id);
    if (!hasActiveSubscription) {
      return NextResponse.json(
        { error: 'Active subscription required for exports' },
        { status: 403 }
      );
    }

    const body: GenerateExportRequest = await request.json();
    const { format, start_date, end_date, include_breaks, include_overtime, group_by } = body;

    // Validate required fields
    if (!format || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Format, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    // Validate export format
    if (!isValidExportFormat(format)) {
      return NextResponse.json(
        { error: 'Invalid export format. Supported: csv, pdf, xlsx' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }

    // Generate export
    const { data: exportData, error } = await ExportService.generateExport(session.user.id, {
      format,
      start_date,
      end_date,
      include_breaks: include_breaks !== false,
      include_overtime: include_overtime !== false,
      group_by: group_by || 'day'
    });

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      export: exportData
    });

  } catch (error) {
    console.error('Generate export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}