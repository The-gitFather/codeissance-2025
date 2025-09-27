'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useUser } from '@/contexts/UserContext'
import { Calendar, Hop as Home, LogOut, Settings, QrCode, Scan, X, Menu } from 'lucide-react'

export function Navbar() {
  const { user, logout } = useUser()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const mobileMenuId = "primary-nav"

  if (!user) return null

  const roleLabel = user.type === "owner" ? "Owner" : "Worker"

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5">
        <div className="flex min-h-20 items-center justify-between py-2">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">ShiftSync</h1>
            </div>

            {user.type === "owner" && (
              <div className="hidden items-center gap-6 md:flex">
                <Link href="/dashboard">
                  <Button
                    variant={pathname === "/dashboard" ? "default" : "ghost"}
                    size="default"
                    className="flex items-center gap-2 transition-colors"
                  >
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Button>
                </Link>

                <Link href="/scheduler">
                  <Button
                    variant={pathname === "/scheduler" ? "default" : "ghost"}
                    size="default"
                    className="flex items-center gap-2 transition-colors"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Scheduler</span>
                  </Button>
                </Link>

                <Link href="/attendance/qr">
                  <Button
                    variant={pathname === "/attendance/qr" ? "default" : "ghost"}
                    size="default"
                    className="flex items-center gap-2 transition-colors"
                  >
                    <QrCode className="h-5 w-5" />
                    <span>Attendance QR</span>
                  </Button>
                </Link>
              </div>
            )}

            {user.type === "worker" && (
              <div className="hidden items-center gap-6 md:flex">
                <Link href="/attendance/scan">
                  <Button
                    variant={pathname === "/attendance/scan" ? "default" : "ghost"}
                    size="default"
                    className="flex items-center gap-2 transition-colors"
                  >
                    <Scan className="h-5 w-5" />
                    <span>Mark Attendance</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-5 md:flex">
              <span className="max-w-[240px] truncate text-sm text-muted-foreground">
                {user.name} • {roleLabel}
              </span>
              <Button onClick={logout} variant="ghost" size="default" className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((v) => !v)}
              aria-controls={mobileMenuId}
              aria-expanded={open}
              className="md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </div>
        </div>

        <div
          id={mobileMenuId}
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="border-t py-3">
            {user.type === "owner" && (
              <div className="flex flex-col gap-2 py-2">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button
                    variant={pathname === "/dashboard" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>

                <Link href="/scheduler" onClick={() => setOpen(false)}>
                  <Button
                    variant={pathname === "/scheduler" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Scheduler</span>
                  </Button>
                </Link>

                <Link href="/attendance/qr" onClick={() => setOpen(false)}>
                  <Button
                    variant={pathname === "/attendance/qr" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Attendance QR</span>
                  </Button>
                </Link>
              </div>
            )}

            {user.type === "worker" && (
              <div className="flex flex-col gap-2 py-2">
                <Link href="/attendance/scan" onClick={() => setOpen(false)}>
                  <Button
                    variant={pathname === "/attendance/scan" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <Scan className="h-4 w-4" />
                    <span>Mark Attendance</span>
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {user.name} ({user.type})
              </span>
              <Button
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}