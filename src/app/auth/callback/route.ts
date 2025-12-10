import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const inviteToken = requestUrl.searchParams.get('invite')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // Ensure coach profile exists for magic link users
    if (data.user) {
      const userId = data.user.id
      const email = data.user.email || ''

      // Check if coach profile exists
      const { data: existingCoach, error: fetchError } = await supabase
        .from('coaches')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      // Create coach profile if it doesn't exist
      if (!existingCoach && fetchError?.code === 'PGRST116') {
        const { error: createError } = await supabase
          .from('coaches')
          .insert({
            auth_user_id: userId,
            email,
            name: email.split('@')[0],
            onboarding_completed: false,
          })

        if (createError) {
          console.error('Error creating coach profile:', createError)
        }
      }
    }
  }

  // If there's an invite token, redirect to the invite page
  // The user is now authenticated, so they'll see the "Join Club" UI
  if (inviteToken) {
    return NextResponse.redirect(`${origin}/invite/${inviteToken}`)
  }

  // No invite token - redirect to dashboard
  return NextResponse.redirect(`${origin}/`)
}
