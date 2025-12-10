import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, clubId, createdBy } = await request.json()

    // Validate required fields
    if (!email || !clubId || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: email, clubId, createdBy' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get the authenticated user to verify they're an admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the requesting user is an admin of the club
    const { data: membership, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role, coach_id')
      .eq('club_id', clubId)
      .eq('coach_id', createdBy)
      .single()

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only club admins can send invites' },
        { status: 403 }
      )
    }

    // Check if email already has a club membership
    const { data: existingCoach } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingCoach) {
      const { data: existingMembership } = await supabase
        .from('club_memberships')
        .select('id')
        .eq('coach_id', existingCoach.id)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: 'This email is already a member of a club' },
          { status: 400 }
        )
      }
    }

    // Generate invite token
    const token = crypto.randomUUID()

    // Create the invite record using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const { error: insertError } = await adminClient
      .from('club_invites')
      .insert({
        club_id: clubId,
        email: email.toLowerCase().trim(),
        token,
        created_by: createdBy,
      })

    if (insertError) {
      // Check for duplicate email invite
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'An invite has already been sent to this email' },
          { status: 400 }
        )
      }
      console.error('Error creating invite:', insertError)
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      )
    }

    // Build the redirect URL with invite token
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const redirectTo = `${baseUrl}/auth/callback?invite=${token}`

    // Send magic link invite using admin client
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        redirectTo,
      }
    )

    if (inviteError) {
      console.error('Error sending invite email:', inviteError)
      // Delete the invite record since email failed
      await adminClient
        .from('club_invites')
        .delete()
        .eq('token', token)

      return NextResponse.json(
        { error: 'Failed to send invite email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Invite sent to ${email}`,
    })

  } catch (error) {
    console.error('Invite API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
