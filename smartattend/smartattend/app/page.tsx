"use client"

import Link from "next/link"
import { GraduationCap, UserCircle, QrCode, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <header className="text-center mb-12 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <QrCode className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">SmartAttend</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Smart attendance tracking with QR codes. Quick, secure, and hassle-free.
          </p>
        </header>

        {/* Role Selection Cards */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
            {/* Teacher Card */}
            <Link href="/teacher" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-blue-500/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">
                    I&apos;m a Teacher
                  </CardTitle>
                  <CardDescription className="text-base">
                    Create attendance sessions, generate QR codes, and track student presence in real-time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                    <Users className="mr-2 h-5 w-5" />
                    Start Teaching
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Student Card */}
            <Link href="/student" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-green-500/50 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-900">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UserCircle className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-green-700 dark:text-green-400">
                    I&apos;m a Student
                  </CardTitle>
                  <CardDescription className="text-base">
                    Scan QR codes or enter session codes to mark your attendance quickly and easily.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                    <QrCode className="mr-2 h-5 w-5" />
                    Mark Attendance
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-muted-foreground text-sm">
          <p>SmartAttend &copy; {new Date().getFullYear()} — Secure QR-based attendance system</p>
        </footer>
      </div>
    </main>
  )
}
