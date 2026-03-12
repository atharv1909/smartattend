import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateSessionCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, teacher_id } = body

    if (!subject || !teacher_id) {
      return NextResponse.json(
        { error: 'Subject and teacher_id are required' },
        { status: 400 }
      )
    }

    // Generate a unique 6-character code
    let code = generateSessionCode()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      // Check if code already exists
      const { data: existing } = await supabase
        .from('sessions')
        .select('code')
        .eq('code', code)
        .single()

      if (!existing) {
        break
      }

      code = generateSessionCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 }
      )
    }

    // Create session with 1 hour expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        code,
        subject,
        teacher_id,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      code: data.code,
      subject: data.subject,
      expires_at: data.expires_at,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacher_id is required' },
        { status: 400 }
      )
    }

    // Get sessions from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
