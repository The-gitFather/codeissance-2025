'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Camera, 
  MessageSquare, 
  TrendingUp,
  MapPin,
  CheckCircle,
  User,
  CalendarDays,
  Wallet
} from 'lucide-react'

// Mock data - replace with real API calls
const mockScheduleData = {
  '2025-09-26': {
    shifts: [
      { id: 1, startTime: '09:00', endTime: '17:00', location: 'Store A', rate: 250, status: 'confirmed' },
      { id: 2, startTime: '18:00', endTime: '22:00', location: 'Store B', rate: 280, status: 'pending' }
    ],
    totalHours: 12,
    totalWage: 3160
  },
  '2025-09-25': {
    shifts: [
      { id: 3, startTime: '10:00', endTime: '18:00', location: 'Store A', rate: 250, status: 'completed' }
    ],
    totalHours: 8,
    totalWage: 2000
  },
  '2025-09-27': {
    shifts: [
      { id: 4, startTime: '14:00', endTime: '22:00', location: 'Store C', rate: 300, status: 'confirmed' }
    ],
    totalHours: 8,
    totalWage: 2400
  }
}

const mockMonthlyData = {
  totalHours: 160,
  totalWage: 42000,
  workingDays: 20,
  averageDaily: 2100
}

export default function WorkerDashboardPage() {
  const { user, loading } = useUser()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [recommendation, setRecommendation] = useState('')
  const [isSubmittingRecommendation, setIsSubmittingRecommendation] = useState(false)

  if (!loading && (!user || user.type !== 'worker')) {
    redirect('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  const selectedDateData = mockScheduleData[selectedDate]
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Get today, previous, and next day data
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const quickDates = [
    { label: 'Yesterday', date: yesterdayStr, data: mockScheduleData[yesterdayStr] },
    { label: 'Today', date: todayStr, data: mockScheduleData[todayStr] },
    { label: 'Tomorrow', date: tomorrowStr, data: mockScheduleData[tomorrowStr] }
  ]

  const handleRecommendationSubmit = async () => {
    if (!recommendation.trim()) return
    
    setIsSubmittingRecommendation(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmittingRecommendation(false)
    setRecommendation('')
    // Show success message
    alert('Availability recommendation submitted successfully!')
  }

  const handleQRScan = () => {
    setShowCamera(true)
    // In a real app, this would open the camera for QR scanning
    // For demo purposes, we'll just show a placeholder
    setTimeout(() => {
      setShowCamera(false)
      alert('QR Code scanned successfully! Attendance recorded.')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ShiftSync</h1>
                <p className="text-sm text-gray-600">Worker Dashboard</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.name}</span>
              <span className="sm:hidden">Profile</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <div>
                  <p className="text-sm opacity-90">Today's Wage</p>
                  <p className="text-xl font-bold">₹{selectedDateData?.totalWage || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="text-sm opacity-90">Today's Hours</p>
                  <p className="text-xl font-bold">{selectedDateData?.totalHours || 0}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <div>
                  <p className="text-sm opacity-90">Monthly Hours</p>
                  <p className="text-xl font-bold">{mockMonthlyData.totalHours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <div>
                  <p className="text-sm opacity-90">Monthly Wage</p>
                  <p className="text-xl font-bold">₹{mockMonthlyData.totalWage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Schedule View */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-gray-900">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span>Quick Schedule</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Other Date
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {quickDates.map((dayInfo) => (
                <div 
                  key={dayInfo.date}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedDate === dayInfo.date 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedDate(dayInfo.date)}
                >
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{dayInfo.label}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(dayInfo.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    {dayInfo.data ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-600">
                          {dayInfo.data.shifts.length} shifts
                        </p>
                        <p className="text-xs text-gray-500">₹{dayInfo.data.totalWage}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No shifts</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showDatePicker && (
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setShowDatePicker(false)
                  }}
                  className="w-full text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Schedule Details - {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateData ? (
              <div className="space-y-4">
                {selectedDateData.shifts.map((shift) => (
                  <div 
                    key={shift.id} 
                    className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900">
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        shift.status === 'completed' ? 'bg-green-100 text-green-800' :
                        shift.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {shift.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{shift.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{shift.rate}/hr</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Daily Total</span>
                    <div className="text-right">
                      <p className="font-bold text-green-700">{selectedDateData.totalHours} hours</p>
                      <p className="font-bold text-green-700">₹{selectedDateData.totalWage}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No shifts scheduled for this date</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Monthly Summary - {currentMonth}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700">{mockMonthlyData.totalHours}</p>
                <p className="text-sm text-blue-600">Total Hours</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-700">₹{mockMonthlyData.totalWage}</p>
                <p className="text-sm text-green-600">Total Wage</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-700">{mockMonthlyData.workingDays}</p>
                <p className="text-sm text-purple-600">Working Days</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold text-orange-700">₹{mockMonthlyData.averageDaily}</p>
                <p className="text-sm text-orange-600">Daily Average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Availability Recommendation */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>Availability Assistant</span>
              </CardTitle>
              <CardDescription>
                Share your preferences for better shift matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., I prefer morning shifts on weekdays, available for overtime on weekends..."
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="min-h-[80px] border-2 border-gray-200 focus:border-indigo-500 rounded-xl resize-none"
              />
              <Button 
                onClick={handleRecommendationSubmit}
                disabled={!recommendation.trim() || isSubmittingRecommendation}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl"
              >
                {isSubmittingRecommendation ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <span>Submit Preferences</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* QR Code Scanner */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <Camera className="w-5 h-5 text-red-600" />
                <span>Attendance Scanner</span>
              </CardTitle>
              <CardDescription>
                Quick attendance marking via QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-center">
              {showCamera ? (
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-6 text-center text-white">
                  <Camera className="w-12 h-12 mx-auto mb-3 animate-pulse" />
                  <p className="font-semibold mb-2">Camera Active</p>
                  <p className="text-sm opacity-75 mb-4">Position QR code in frame</p>
                  <div className="w-24 h-24 mx-auto border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                    <div className="animate-pulse text-2xl">📱</div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-red-600" />
                  </div>
                  <Button
                    onClick={handleQRScan}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-2.5 rounded-xl"
                  >
                    Scan QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}