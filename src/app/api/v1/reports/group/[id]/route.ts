import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { GroupService } from '@/services/GroupService';
import { HourlyRateService } from '@/services/HourlyRateService';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const includeEarnings = searchParams.get('include_earnings') === 'true';
    const californiaMode = searchParams.get('california_mode') === 'true';

    // Verify user has access to this group (is manager or member)
    const { data: group, error: groupError } = await GroupService.getGroup(params.id);
    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if user is manager or member
    const isManager = group.manager_id === session.user.id;
    const isMember = group.memberships?.some(m => m.user_id === session.user.id);

    if (!isManager && !isMember) {
      return NextResponse.json(
        { error: 'Unauthorized to view group reports' },
        { status: 403 }
      );
    }

    // Get time entries for the group within date range
    let timeQuery = supabase
      .from('time_entries')
      .select(`
        *,
        user_profiles!inner(
          full_name,
          email
        )
      `)
      .eq('group_id', params.id)
      .not('clock_out', 'is', null);

    if (startDate) timeQuery = timeQuery.gte('clock_in', startDate);
    if (endDate) timeQuery = timeQuery.lte('clock_in', endDate);

    const { data: timeEntries, error: timeError } = await timeQuery;

    if (timeError) {
      return NextResponse.json(
        { error: timeError.message },
        { status: 400 }
      );
    }

    // Group time entries by user
    const userTimeData = (timeEntries || []).reduce((acc, entry) => {
      const userId = entry.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          user_name: entry.user_profiles?.full_name || 'Unknown',
          user_email: entry.user_profiles?.email,
          total_minutes: 0,
          total_hours: 0,
          entries: []
        };
      }
      acc[userId].total_minutes += entry.duration_minutes || 0;
      acc[userId].total_hours = acc[userId].total_minutes / 60;
      acc[userId].entries.push(entry);
      return acc;
    }, {} as Record<string, any>);

    const reportData = Object.values(userTimeData);

    // Add earnings if requested and user is manager
    if (includeEarnings && isManager && startDate && endDate) {
      const earningsPromises = reportData.map(async (userData: any) => {
        const { data: earnings } = await HourlyRateService.calculateEarnings(
          params.id,
          userData.user_id,
          startDate,
          endDate,
          californiaMode
        );
        return {
          ...userData,
          earnings
        };
      });

      const dataWithEarnings = await Promise.all(earningsPromises);

      return NextResponse.json({
        group_report: {
          group_id: params.id,
          group_name: group.name,
          period: {
            start_date: startDate,
            end_date: endDate
          },
          generated_at: new Date().toISOString(),
          generated_by: session.user.id,
          california_mode: californiaMode,
          members: dataWithEarnings,
          summary: {
            total_members: dataWithEarnings.length,
            total_hours: dataWithEarnings.reduce((sum, member) => sum + member.total_hours, 0),
            total_earnings: dataWithEarnings.reduce((sum, member) => sum + (member.earnings?.total_earnings || 0), 0)
          }
        }
      });
    }

    return NextResponse.json({
      group_report: {
        group_id: params.id,
        group_name: group.name,
        period: {
          start_date: startDate,
          end_date: endDate
        },
        generated_at: new Date().toISOString(),
        generated_by: session.user.id,
        members: reportData,
        summary: {
          total_members: reportData.length,
          total_hours: reportData.reduce((sum: number, member: any) => sum + member.total_hours, 0)
        }
      }
    });

  } catch (error) {
    console.error('Get group report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}