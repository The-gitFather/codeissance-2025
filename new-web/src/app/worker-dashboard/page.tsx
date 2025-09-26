'use client'

import React from 'react'
import { useUser } from '@/contexts/UserContext'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WorkerDashboardPage() {
  const { user, loading } = useUser()

  if (!loading && (!user || user.type !== 'worker')) {
    redirect('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Worker Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Worker features are under development</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            This area will show your schedule, shift preferences, and availability settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}