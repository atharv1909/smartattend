import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Session code is required' },
        { status: 400 }
      )
    }

    // Get session info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session is expired
    const isExpired = new Date(session.expires_at) < new Date()

    // Get attendance list
    const { data: attendees, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_code', code)
      .order('marked_at', { ascending: false })

    if (attendanceError) {
      console.error('Supabase error:', attendanceError)
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session: {
        ...session,
        is_expired: isExpired,
      },
      attendees: attendees || [],
      count: attendees?.length || 0,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
