import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_code, student_name, roll_number, device_id } = body

    // Validate required fields
    if (!session_code || !student_name || !roll_number || !device_id) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if session exists and is not expired
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', session_code)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const isExpired = new Date(session.expires_at) < new Date()
    if (isExpired) {
      return NextResponse.json(
        { error: 'Session expired — ask your teacher for a new one' },
        { status: 410 }
      )
    }

    // Check for duplicate roll number
    const { data: existingRoll } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_code', session_code)
      .eq('roll_number', roll_number)
      .single()

    if (existingRoll) {
      return NextResponse.json(
        { error: 'Already marked! This roll number has already been registered.' },
        { status: 409 }
      )
    }

    // Check for duplicate device
    const { data: existingDevice } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_code', session_code)
      .eq('device_id', device_id)
      .single()

    if (existingDevice) {
      return NextResponse.json(
        { error: 'Already marked! This device has already been used.' },
        { status: 409 }
      )
    }

    // Insert attendance record
    const { error: insertError } = await supabase
      .from('attendance')
      .insert({
        session_code,
        student_name,
        roll_number,
        device_id,
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      
      // Handle unique constraint violations
      if (insertError.code === '23505') {
        if (insertError.message.includes('session_code_roll_number')) {
          return NextResponse.json(
            { error: 'Already marked! This roll number has already been registered.' },
            { status: 409 }
          )
        }
        if (insertError.message.includes('session_code_device_id')) {
          return NextResponse.json(
            { error: 'Already marked! This device has already been used.' },
            { status: 409 }
          )
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to mark attendance' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
