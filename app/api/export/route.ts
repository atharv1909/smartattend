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

    // Get attendance list
    const { data: attendees, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_code', code)
      .order('marked_at', { ascending: true })

    if (attendanceError) {
      console.error('Supabase error:', attendanceError)
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      )
    }

    // Generate CSV content
    const csvHeader = 'Name,Roll Number,Time\n'
    const csvRows = (attendees || [])
      .map(a => {
        const name = escapeCsv(a.student_name)
        const roll = escapeCsv(a.roll_number)
        const time = new Date(a.marked_at).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        return `${name},${roll},${time}`
      })
      .join('\n')

    const csvContent = csvHeader + csvRows

    // Create safe filename from subject
    const safeSubject = session.subject
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 30)
    const filename = `${safeSubject}_attendance.csv`

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Escape CSV field to handle commas, quotes, and newlines
 */
function escapeCsv(field: string): string {
  // If field contains commas, quotes, or newlines, wrap in quotes
  if (/[",\n\r]/.test(field)) {
    // Double any existing quotes
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}
