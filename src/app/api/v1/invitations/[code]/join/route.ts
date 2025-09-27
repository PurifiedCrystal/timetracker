import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { code } = params

    // Find the invitation with group details
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select(`
        *,
        groups (
          id,
          name,
          description,
          manager_id,
          max_members
        )
      `)
      .eq('invitation_code', code)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been used or expired' },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if user is already a member of this group
    const { data: existingMembership } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('group_id', invitation.group_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User already in group' },
        { status: 409 }
      )
    }

    // Check group member limit
    const { count: memberCount } = await supabase
      .from('group_memberships')
      .select('*', { count: 'exact' })
      .eq('group_id', invitation.group_id)
      .eq('is_active', true)

    const group = invitation.groups
    if (memberCount >= group.max_members) {
      return NextResponse.json(
        { error: 'Group has reached maximum member limit' },
        { status: 400 }
      )
    }

    // Track invitation access
    const userAgent = request.headers.get('user-agent') || ''
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'

    // Update invitation tracking
    await supabase
      .from('invitations')
      .update({
        access_count: invitation.access_count + 1,
        last_accessed_at: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: clientIp,
        status: 'accepted',
        accepted_by: user.id,
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    // Add user to group
    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: invitation.group_id,
        user_id: user.id,
        role: 'member',
        added_by: invitation.invited_by,
        can_view_reports: true,
        can_export_data: true,
        is_active: true,
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single()

    if (membershipError) {
      console.error('Error creating membership:', membershipError)
      return NextResponse.json(
        { error: 'Failed to join group' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        manager_id: group.manager_id,
        max_members: group.max_members
      },
      membership: {
        id: membership.id,
        role: membership.role,
        joined_at: membership.joined_at
      },
      message: `Successfully joined ${group.name}`
    }, { status: 200 })

  } catch (error) {
    console.error('Join group error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}