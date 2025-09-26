import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { generateQRToken, validateQRToken } from '@/lib/qr-utils'

export async function GET() {
  try {
    // Check if user is authorized (owner)
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)
    if (!user || user.type !== 'owner') {
      return NextResponse.json({ error: 'Forbidden - Only owners can generate QR codes' }, { status: 403 })
    }

    // Generate daily token
    const token = generateQRToken()
    
    // Store token in Firestore
    await setDoc(doc(db, 'attendance-qr', 'current'), {
      token,
      generatedAt: new Date().toISOString(),
      generatedBy: user.id || user.email
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating QR:', error)
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    
    // Get user from cookies
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)
    if (!user || user.type !== 'worker') {
      return NextResponse.json({ error: 'Forbidden - Only workers can mark attendance' }, { status: 403 })
    }

    // Validate token
    const isValid = await validateQRToken(token)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 400 })
    }

    // Check if user already marked attendance today
    const today = new Date().toISOString().split('T')[0]
    const attendanceId = `${user.id || user.email}-${today}`
    
    const existingAttendance = await getDoc(doc(db, 'attendance', attendanceId))
    if (existingAttendance.exists()) {
      return NextResponse.json({ 
        error: 'Attendance already marked for today' 
      }, { status: 400 })
    }

    // Record attendance
    await setDoc(doc(db, 'attendance', attendanceId), {
      userId: user.id || user.email,
      userName: user.name || user.email,
      userType: user.type,
      timestamp: new Date().toISOString(),
      date: today,
      token
    })

    return NextResponse.json({ 
      success: true,
      message: `Attendance marked successfully for ${user.name || user.email}`
    })
  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
  }
}