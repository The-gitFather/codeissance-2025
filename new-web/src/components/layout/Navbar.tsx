'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useUser } from '@/contexts/UserContext'
import { Calendar, Hop as Home, LogOut, Settings } from 'lucide-react'

export function Navbar() {
  const { user, logout } = useUser()
  const pathname = usePathname()

  if (!user) return null

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">ShiftSync</h1>
            </div>
            
            {user.type === 'owner' && (
              <div className="flex space-x-4">
                <Link href="/dashboard">
                  <Button
                    variant={pathname === '/dashboard' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Link href="/scheduler">
                  <Button
                    variant={pathname === '/scheduler' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Scheduler</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user.name} ({user.type})
            </span>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}