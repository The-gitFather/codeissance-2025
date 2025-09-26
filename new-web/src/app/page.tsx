'use client'

import { useUser } from '@/contexts/UserContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, loading } = useUser()

  useEffect(() => {
    if (!loading && user) {
      if (user.type === 'owner') {
        redirect('/dashboard')
      } else {
        redirect('/worker-dashboard')
      }
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return null
}