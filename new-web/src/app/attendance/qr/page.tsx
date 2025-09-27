

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
    if (!user || user.type !== 'owner') {
      redirect('/')
    }
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
    <div className="mx-auto mt-8 max-w-5xl space-y-6 md:space-y-8">
      {/* Status Card */}
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary">
              <QrCodeIcon className="w-5 h-5" />
              Attendance QR Code
            </CardTitle>
            <Badge variant={loading ? "secondary" : "default"}>{loading ? "Generating..." : "Active"}</Badge>
          </div>
          {lastGenerated ? (
            <p className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              Generated {formatTimeAgo(lastGenerated)}
            </p>
          ) : null}
        </CardHeader>
      </Card>

      {/* QR Code Card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* LEFT: QR Code Card */}
        <Card className="border bg-card">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                <p className="text-muted-foreground">Generating QR code...</p>
              </div>
            ) : qrData ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-background p-4">
                  <div className="mx-auto max-w-[256px]">
                    <QRCode
                      id="attendance-qr"
                      value={qrData}
                      size={256}
                      level="H"
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={fetchQR}
                    variant="outline"
                    className="w-full transition-all duration-200 hover:translate-y-[-1px] bg-transparent"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button
                    onClick={downloadQR}
                    variant="outline"
                    className="w-full transition-all duration-200 hover:translate-y-[-1px] bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <QrCodeIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">Failed to generate QR code</p>
                <Button className="transition-all duration-200 hover:translate-y-[-1px]" onClick={fetchQR}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Details (Status, Auto-refresh, Instructions) */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card className="border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <QrCodeIcon className="h-5 w-5 text-primary" />
                  Status
                </CardTitle>
                <Badge variant={loading ? "secondary" : "default"}>{loading ? "Generating..." : "Active"}</Badge>
              </div>
              {lastGenerated ? (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Generated {formatTimeAgo(lastGenerated)}
                </p>
              ) : null}
            </CardHeader>
          </Card>

          {/* Auto-refresh Toggle */}
          <Card className="border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Auto-refresh</h4>
                  <p className="text-sm text-muted-foreground">Refresh every 4 hours</p>
                </div>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="transition-all duration-200 hover:translate-y-[-1px]"
                >
                  {autoRefresh ? "ON" : "OFF"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="border bg-card">
            <CardContent className="pt-6">
              <h4 className="mb-2 font-medium text-foreground">For Workers:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use your mobile device to scan this QR code</li>
                <li>• Make sure you're logged in as a worker</li>
                <li>• Scan only during your scheduled work time</li>
                <li>• Each QR code can only be used once per day</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}