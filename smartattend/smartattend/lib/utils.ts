import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random 6-character alphanumeric code
 * Excludes O, 0, I, 1 to avoid confusion
 */
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generate or retrieve device ID from localStorage
 * This is used for anti-proxy/duplicate prevention
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  
  const STORAGE_KEY = 'smartattend_device_id'
  let deviceId = localStorage.getItem(STORAGE_KEY)
  
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, deviceId)
  }
  
  return deviceId
}

/**
 * Format date for display
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Format date for CSV export
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Calculate time remaining and progress for countdown timer
 */
export function getTimeRemaining(expiresAt: string): {
  remaining: number
  total: number
  percentage: number
  isExpired: boolean
} {
  const now = Date.now()
  const expires = new Date(expiresAt).getTime()
  const created = expires - 60 * 60 * 1000 // Session lasts 1 hour
  
  const remaining = Math.max(0, expires - now)
  const total = expires - created
  const percentage = Math.min(100, Math.max(0, (remaining / total) * 100))
  const isExpired = remaining === 0
  
  return { remaining, total, percentage, isExpired }
}

/**
 * Get timer bar color based on remaining time
 */
export function getTimerColor(percentage: number): string {
  if (percentage > 25) return 'bg-green-500'
  if (percentage > 8) return 'bg-amber-500'
  return 'bg-red-500'
}

/**
 * Get initials from name for avatar
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Generate avatar color based on name
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
