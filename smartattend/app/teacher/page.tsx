"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getDeviceId,
  formatTime,
  getTimeRemaining,
  getTimerColor,
  getInitials,
  getAvatarColor,
} from "@/lib/utils"
import type { Session, Attendance } from "@/lib/supabase"

interface CurrentSession {
  code: string
  subject: string
  expires_at: string
}

interface AttendanceData {
  session: Session & { is_expired: boolean }
  attendees: Attendance[]
  count: number
}

export default function TeacherPage() {
  const router = useRouter()
  const [deviceId, setDeviceId] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [pastSessions, setPastSessions] = useState<Session[]>([])
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({ percentage: 100, color: "bg-green-500" })
  const [isEnding, setIsEnding] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Initialize device ID
  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  // Create new session
  const createSession = async () => {
    if (!subject.trim()) {
      setError("Please enter a subject name")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), teacher_id: deviceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create session")
      }

      setCurrentSession(data)
      setSubject("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session")
    } finally {
      setIsCreating(false)
    }
  }

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    if (!currentSession) return

    try {
      const response = await fetch(`/api/attendance?code=${currentSession.code}`)
      const data = await response.json()

      if (response.ok) {
        setAttendanceData(data)
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err)
    }
  }, [currentSession])

  // Fetch past sessions
  const fetchPastSessions = useCallback(async () => {
    if (!deviceId) return

    try {
      const response = await fetch(`/api/sessions?teacher_id=${deviceId}`)
      const data = await response.json()

      if (response.ok) {
        setPastSessions(data.sessions || [])
      }
    } catch (err) {
      console.error("Failed to fetch past sessions:", err)
    }
  }, [deviceId])

  // Poll attendance data every 4 seconds
  useEffect(() => {
    if (!currentSession) return

    fetchAttendance()
    const interval = setInterval(fetchAttendance, 4000)

    return () => clearInterval(interval)
  }, [currentSession, fetchAttendance])

  // Load past sessions on mount
  useEffect(() => {
    if (deviceId) {
      fetchPastSessions()
    }
  }, [deviceId, fetchPastSessions])

  // Update timer
  useEffect(() => {
    if (!currentSession) return

    const updateTimer = () => {
      const { percentage, isExpired } = getTimeRemaining(currentSession.expires_at)
      setTimeLeft({
        percentage,
        color: getTimerColor(percentage),
      })

      if (isExpired) {
        setCurrentSession(null)
        fetchPastSessions()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [currentSession, fetchPastSessions])

  // End session early
  const endSession = async () => {
    if (!currentSession) return

    setIsEnding(true)
    try {
      // Update session to expire now
      const response = await fetch("/api/sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentSession.code }),
      })

      if (response.ok) {
        setCurrentSession(null)
        fetchPastSessions()
      }
    } catch (err) {
      console.error("Failed to end session:", err)
    } finally {
      setIsEnding(false)
    }
  }

  // Export CSV
  const exportCSV = async () => {
    if (!currentSession) return

    setIsExporting(true)
    try {
      const response = await fetch(`/api/export?code=${currentSession.code}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${currentSession.subject.replace(/\s+/g, "_")}_attendance.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Failed to export CSV:", err)
    } finally {
      setIsExporting(false)
    }
  }

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage attendance sessions</p>
          </div>
        </header>

        {/* Create Session Form */}
        {!currentSession && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Session
              </CardTitle>
              <CardDescription>
                Enter the subject name to generate a QR code for students to scan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="subject" className="sr-only">
                    Subject Name
                  </Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics 101"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createSession()}
                  />
                </div>
                <Button
                  onClick={createSession}
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Session
                    </>
                  )}
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Session */}
        {currentSession && (
          <Card className="mb-8 border-blue-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentSession.subject}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    Session expires in {formatTimeRemaining(
                      Math.max(0, new Date(currentSession.expires_at).getTime() - Date.now())
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={exportCSV}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Export CSV</span>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={endSession}
                    disabled={isEnding}
                  >
                    {isEnding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">End Session</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Timer Bar */}
              <div className="mb-6">
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full timer-bar ${timeLeft.color}`}
                    style={{ width: `${timeLeft.percentage}%` }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <QRCodeSVG
                      value={currentSession.code}
                      size={220}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Scan this QR code to mark attendance
                  </p>
                </div>

                {/* Session Code & Attendance */}
                <div className="space-y-6">
                  {/* Session Code */}
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Session Code</p>
                    <p className="text-4xl font-bold tracking-[0.2em] code-display text-primary">
                      {currentSession.code}
                    </p>
                  </div>

                  {/* Attendance Count */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Students Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {attendanceData?.count || 0}
                      </span>
                      <RefreshCw className="h-4 w-4 text-muted-foreground animate-pulse-slow" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Attendance List */}
              <Separator className="my-6" />
              
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Live Attendance
                  <span className="text-xs text-muted-foreground font-normal">
                    (updates every 4 seconds)
                  </span>
                </h3>
                
                <ScrollArea className="h-64 rounded-xl border">
                  {attendanceData && attendanceData.attendees.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {attendanceData.attendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={getAvatarColor(attendee.student_name)}>
                              {getInitials(attendee.student_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{attendee.student_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Roll: {attendee.roll_number}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(attendee.marked_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p>No students have marked attendance yet</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Past Sessions (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastSessions.length > 0 ? (
              <div className="space-y-2">
                {pastSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <div>
                      <p className="font-medium">{session.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()} at{" "}
                        {formatTime(session.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="code-display text-lg font-mono text-muted-foreground">
                        {session.code}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const url = `/api/export?code=${session.code}`
                          window.open(url, "_blank")
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No sessions found in the last 7 days
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
