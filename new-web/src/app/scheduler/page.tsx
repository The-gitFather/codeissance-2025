'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Shop, Worker, Shift, DAYS_OF_WEEK } from '@/types'
import { Calendar, Clock, Users, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'

export default function SchedulerPage() {
  const { user, loading } = useUser()
  const [shop, setShop] = useState<Shop | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorkers, setSelectedWorkers] = useState<{[key: string]: string[]}>({})
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.type !== 'owner')) {
      redirect('/')
    }
  }, [user, loading])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return
    
    try {
      // Fetch shop
      const shopDoc = await getDoc(doc(db, 'shops', user.id))
      if (shopDoc.exists()) {
        setShop({ id: shopDoc.id, ...shopDoc.data() } as Shop)
      }

      // Fetch workers
      const workersQuery = query(
        collection(db, 'users'),
        where('type', '==', 'worker'),
        where('ownerId', '==', user.id)
      )
      const workersSnapshot = await getDocs(workersQuery)
      const workersData = workersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Worker[]
      setWorkers(workersData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const toggleWorkerShift = (workerId: string, day: string, shiftId: string) => {
    const key = `${day}-${shiftId}`
    setSelectedWorkers(prev => {
      const current = prev[key] || []
      const isSelected = current.includes(workerId)
      
      if (isSelected) {
        return {
          ...prev,
          [key]: current.filter(id => id !== workerId)
        }
      } else {
        const shift = shop?.shifts.find(s => s.id === shiftId)
        if (shift && current.length < shift.maxEmployees) {
          return {
            ...prev,
            [key]: [...current, workerId]
          }
        }
      }
      return prev
    })
  }

  const getWorkerName = (workerId: string) => {
    return workers.find(w => w.id === workerId)?.name || 'Unknown'
  }

  const isWorkerAssigned = (workerId: string, day: string, shiftId: string) => {
    const key = `${day}-${shiftId}`
    return (selectedWorkers[key] || []).includes(workerId)
  }

  const getAssignedCount = (day: string, shiftId: string) => {
    const key = `${day}-${shiftId}`
    return (selectedWorkers[key] || []).length
  }

  const getMaxEmployees = (shiftId: string) => {
    return shop?.shifts.find(s => s.id === shiftId)?.maxEmployees || 0
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.type !== 'owner' || !shop) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Please set up your shop first in the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const weekDays = DAYS_OF_WEEK.map((day, index) => ({
    name: day,
    date: addDays(currentWeek, index),
    displayName: day.charAt(0).toUpperCase() + day.slice(1)
  }))

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduler</h1>
          <p className="text-gray-600">Assign employees to shifts</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Zap className="w-4 h-4" />
          <span>Optimize Schedule AI</span>
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous Week
        </Button>
        
        <h2 className="text-xl font-semibold">
          Week of {format(currentWeek, 'MMM d, yyyy')}
        </h2>
        
        <Button
          variant="outline"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          Next Week
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Employees List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Employees ({workers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {workers.map((worker) => (
              <Badge key={worker.id} variant="outline" className="px-3 py-1">
                {worker.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Weekly Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-8 gap-2 min-w-[800px]">
              {/* Header Row */}
              <div className="p-3 font-semibold text-center border rounded-lg bg-gray-50">
                Shifts / Days
              </div>
              {weekDays.map((day) => (
                <div key={day.name} className="p-3 text-center border rounded-lg bg-gray-50">
                  <div className="font-semibold">{day.displayName}</div>
                  <div className="text-sm text-gray-500">{format(day.date, 'MMM d')}</div>
                </div>
              ))}

              {/* Shift Rows */}
              {shop.shifts.map((shift) => (
                <React.Fragment key={shift.id}>
                  {/* Shift Name */}
                  <div className="p-3 border rounded-lg bg-blue-50 flex flex-col justify-center">
                    <div className="font-semibold text-sm">{shift.name}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {shift.startTime} - {shift.endTime}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Max: {shift.maxEmployees}
                    </div>
                  </div>

                  {/* Days */}
                  {weekDays.map((day) => {
                    const assigned = getAssignedCount(day.name, shift.id)
                    const max = getMaxEmployees(shift.id)
                    
                    return (
                      <div key={`${shift.id}-${day.name}`} className="p-2 border rounded-lg min-h-[120px]">
                        <div className="mb-2 text-xs text-center">
                          <span className={`px-2 py-1 rounded ${
                            assigned === max ? 'bg-green-100 text-green-800' :
                            assigned > 0 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {assigned}/{max}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          {workers.map((worker) => {
                            const isAssigned = isWorkerAssigned(worker.id, day.name, shift.id)
                            const canAssign = assigned < max || isAssigned
                            
                            return (
                              <button
                                key={worker.id}
                                onClick={() => canAssign && toggleWorkerShift(worker.id, day.name, shift.id)}
                                disabled={!canAssign}
                                className={`w-full text-xs p-1 rounded transition-colors ${
                                  isAssigned
                                    ? 'bg-primary text-primary-foreground'
                                    : canAssign
                                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {worker.name.split(' ')[0]}
                              </button>
                            )
                          })}
                        </div>
                        
                        {/* Show assigned workers */}
                        {assigned > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs font-medium text-gray-600 mb-1">Assigned:</div>
                            {(selectedWorkers[`${day.name}-${shift.id}`] || []).map((workerId) => (
                              <div key={workerId} className="text-xs text-primary font-medium">
                                {getWorkerName(workerId)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(selectedWorkers).reduce((acc, workers) => acc + workers.length, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((Object.values(selectedWorkers).reduce((acc, workers) => acc + workers.length, 0) / 
                (shop.shifts.length * 7 * (shop.shifts.reduce((acc, s) => acc + s.maxEmployees, 0) / shop.shifts.length))) * 100)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(Object.values(selectedWorkers).flat()).size}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}