

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { UserProvider } from '@/contexts/UserContext'
import { Navbar } from '@/components/layout/Navbar'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import AccessibilityMenuWrapper from "@/components/Accessibility/AccessibiltyWrapper";
import { VoiceNavigationDockComponent } from "@/components/voice-navigation-dock";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ShiftSync - Employee Scheduling Made Easy',
  description: 'Modern employee scheduling and shift management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <AccessibilityMenuWrapper>
            <VoiceNavigationDockComponent />
            <Navbar />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
            <Toaster />
          </AccessibilityMenuWrapper>
        </UserProvider>
      </body>
    </html>
  )
}