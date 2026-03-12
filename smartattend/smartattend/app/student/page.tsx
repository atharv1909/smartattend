"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import jsQR from "jsqr"
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Loader2,
  QrCode,
  ScanLine,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getDeviceId } from "@/lib/utils"

export default function StudentPage() {
  const [deviceId, setDeviceId] = useState<string>("")
  const [studentName, setStudentName] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [sessionCode, setSessionCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  // Initialize device ID
  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  // Start QR scanning
  const startScanning = async () => {
    setError(null)
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        scanQRCode()
      }
    } catch (err) {
      console.error("Camera error:", err)
      setError("Unable to access camera. Please allow camera permissions or enter the code manually.")
      setIsScanning(false)
    }
  }

  // Stop QR scanning
  const stopScanning = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsScanning(false)
  }, [])

  // Scan QR code from video stream
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      // Validate code format (6 alphanumeric characters)
      const cleanedCode = code.data.trim().toUpperCase()
      if (/^[A-Z0-9]{6}$/.test(cleanedCode)) {
        setSessionCode(cleanedCode)
        stopScanning()
        return
      }
    }

    animationRef.current = requestAnimationFrame(scanQRCode)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  // Submit attendance
  const submitAttendance = async () => {
    // Validate inputs
    if (!studentName.trim()) {
      setError("Please enter your full name")
      return
    }
    if (!rollNumber.trim()) {
      setError("Please enter your roll number")
      return
    }
    if (!sessionCode.trim()) {
      setError("Please enter the session code")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_code: sessionCode.trim().toUpperCase(),
          student_name: studentName.trim(),
          roll_number: rollNumber.trim(),
          device_id: deviceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 410) {
          throw new Error("Session expired — ask your teacher for a new one")
        }
        throw new Error(data.error || "Failed to mark attendance")
      }

      setShowSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark attendance")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setStudentName("")
    setRollNumber("")
    setSessionCode("")
    setShowSuccess(false)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Student</h1>
            <p className="text-muted-foreground">Mark your attendance</p>
          </div>
        </header>

        {/* Success Screen */}
        {showSuccess ? (
          <Card className="border-green-500/50">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                Attendance Marked!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your attendance has been successfully recorded.
              </p>
              <Button onClick={resetForm} className="w-full bg-green-600 hover:bg-green-700">
                Mark Another
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Enter Details
              </CardTitle>
              <CardDescription>
                Scan the QR code or enter the session code manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scan QR Button */}
              <Button
                variant="outline"
                className="w-full h-16 text-lg border-dashed border-2"
                onClick={startScanning}
              >
                <Camera className="mr-2 h-5 w-5" />
                Scan QR Code
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roll">Roll Number</Label>
                  <Input
                    id="roll"
                    placeholder="e.g., 2024001"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Session Code</Label>
                  <Input
                    id="code"
                    placeholder="XXXXXX"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    className="code-display text-lg tracking-[0.15em]"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                onClick={submitAttendance}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Mark Attendance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* QR Scanner Dialog */}
        <Dialog open={isScanning} onOpenChange={(open) => !open && stopScanning()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Scan QR Code
              </DialogTitle>
              <DialogDescription>
                Point your camera at the QR code displayed by your teacher.
              </DialogDescription>
            </DialogHeader>
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1" />
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={stopScanning} className="w-full">
              Cancel
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
