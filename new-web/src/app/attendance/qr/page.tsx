

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { redirect } from 'next/navigation'
import QRCode from 'react-qr-code'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Download, Clock, QrCode as QrCodeIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function AttendanceQRPage() {
  const { user } = useUser()
  const [qrData, setQrData] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    // if (!user || user.type !== 'owner') {
    //   redirect('/')
    // }
  }, [user])

  const fetchQR = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/attendance/qr')
      
      if (!res.ok) {
        throw new Error('Failed to generate QR code')
      }
      
      const data = await res.json()
      
      // If the API returns an object, stringify it for QR code
      const qrValue = typeof data.token === 'object' 
        ? JSON.stringify(data.token) 
        : data.token
        
      setQrData(qrValue)
      setLastGenerated(new Date())
      toast.success('QR code generated successfully!')
    } catch (error: any) {
      console.error('Failed to fetch QR:', error)
      toast.error(error.message || 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQR()
    
    // Auto-refresh QR code every 4 hours if enabled
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchQR, 1000 * 60 * 60 * 4)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const downloadQR = () => {
    const svg = document.getElementById('attendance-qr')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `attendance-qr-${new Date().toISOString().split('T')[0]}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 space-y-4">
      {/* Status Card */}
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5" />
              Attendance QR Code
            </CardTitle>
            <Badge variant={loading ? "secondary" : "default"}>
              {loading ? "Generating..." : "Active"}
            </Badge>
          </div>
          {lastGenerated && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Generated {formatTimeAgo(lastGenerated)}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* QR Code Card */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">Generating QR code...</p>
            </div>
          ) : qrData ? (
            <div className="space-y-4">
              <div className="flex justify-center bg-white p-4 rounded-lg border">
                <QRCode 
                  id="attendance-qr"
                  value={qrData} 
                  size={256} 
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={fetchQR} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={downloadQR} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <QrCodeIcon className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Failed to generate QR code</p>
              <Button onClick={fetchQR}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-refresh Toggle */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-900">Auto-refresh</h4>
              <p className="text-sm text-green-700">Refresh every 4 hours</p>
            </div>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "ON" : "OFF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-medium text-blue-900 mb-2">For Workers:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use your mobile device to scan this QR code</li>
            <li>• Make sure you're logged in as a worker</li>
            <li>• Scan only during your scheduled work time</li>
            <li>• Each QR code can only be used once per day</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}