'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { redirect } from 'next/navigation'
import { Scanner } from '@yudiel/react-qr-scanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle, XCircle, QrCode, RefreshCw, Camera } from 'lucide-react'

export default function ScanQRPage() {
  const { user } = useUser()
  const [scanning, setScanning] = useState(true)
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [cameraError, setCameraError] = useState(false)

  useEffect(() => {
    // if (!user || user.type !== 'worker') {
    //   redirect('/')
    // }
  }, [user])

  const handleScan = async (result) => {
    if (!result || !scanning) return
    
    // Get the scanned data from the result array
    const scannedData = result[0]?.rawValue
    if (!scannedData) return

    setScanning(false)
    setScanResult(null)

    try {
      const res = await fetch('/api/attendance/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: scannedData }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to mark attendance')
      }

      setScanResult('success')
      setLastScanTime(new Date())
      toast.success(responseData.message || 'Attendance marked successfully!')
      
      // Auto-reset scanner after 3 seconds
      setTimeout(() => {
        resetScanner()
      }, 3000)

    } catch (error: any) {
      console.error('Attendance error:', error)
      setScanResult('error')
      toast.error(error.message || 'Failed to mark attendance')
      
      // Auto-reset scanner after 2 seconds on error
      setTimeout(() => {
        resetScanner()
      }, 2000)
    }
  }

  const resetScanner = () => {
    setScanning(true)
    setScanResult(null)
    setCameraError(false)
  }

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error)
    setCameraError(true)
    toast.error('Camera access denied or unavailable')
  }

  if (cameraError) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Camera Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Please allow camera access to scan QR codes for attendance.
            </p>
            <Button onClick={resetScanner} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 space-y-4">
      {/* Status Card */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Attendance Scanner
            </CardTitle>
            <Badge variant={scanning ? "default" : "secondary"}>
              {scanning ? "Ready" : "Processing"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Scanner Card */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            {scanning && !scanResult && (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600 mb-4">
                  Position the QR code within the camera view
                </div>
                <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-blue-300">
                  <Scanner 
                    onScan={handleScan}
                    onError={handleCameraError}
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {!scanning && !scanResult && (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Processing scan...</p>
              </div>
            )}

            {scanResult === 'success' && (
              <div className="flex flex-col items-center justify-center h-64 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Success!
                </h3>
                <p className="text-green-700 text-center mb-4">
                  Attendance marked successfully
                </p>
                {lastScanTime && (
                  <p className="text-sm text-green-600">
                    {lastScanTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}

            {scanResult === 'error' && (
              <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="w-16 h-16 text-red-600 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Scan Failed
                </h3>
                <p className="text-red-700 text-center mb-4">
                  Please try scanning again
                </p>
              </div>
            )}
          </div>

          {!scanning && (
            <div className="mt-4 text-center">
              <Button onClick={resetScanner} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Scan Another QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Hold your device steady</li>
            <li>• Ensure good lighting</li>
            <li>• Keep QR code within the frame</li>
            <li>• Wait for automatic detection</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== Second Component =====