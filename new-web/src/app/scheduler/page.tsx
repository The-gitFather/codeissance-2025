'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Shop, Worker, Shift, DAYS_OF_WEEK } from '@/types'
import { Calendar, Clock, Users, Zap, ChevronLeft, ChevronRight, Plus, ChevronDown } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'

export default function SchedulerPage() {
  // State to hold auto-schedule result
  const [autoSchedule, setAutoSchedule] = useState<any[] | null>(null);
  // Auto-schedule handler
  const handleAutoSchedule = async () => {
    if (!shop || workers.length === 0) {
      alert('No shop or workers found.');
      return;
    }

    // Hardcoded values
    const days = 7;
    const shifts = shop.shifts.length;
    // All workers available for all days and shifts
    const availability = workers.flatMap(worker =>
      Array.from({ length: days }).flatMap((_, dayIdx) =>
        shop.shifts.map((shift, shiftIdx) => [worker.name, dayIdx, shiftIdx])
      )
    );
    // Hardcode max_shifts: 5 per worker
    const max_shifts = Object.fromEntries(workers.map(w => [w.name, 10]));
    // Hardcode coverage: 1 per day
    const coverage = Array(shifts).fill(1);
    // Hardcode holidays: Sunday (6)
    const holidays = [2, 6];

    const body = {
      employees: workers.map(w => w.name),
      days,
      shifts,
      availability,
      max_shifts,
      coverage,
      holidays,
    };

    // Print body
    console.log('Auto-schedule request body:', body);

    try {
      const res = await fetch('http://127.0.0.1:5000/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      // Print response
      console.log('Auto-schedule response:', data);
      setAutoSchedule(data.schedule);
      alert('Auto-schedule complete!');
    } catch (err) {
      console.error('Auto-schedule error:', err);
      alert('Auto-schedule error: ' + err);
    }
  };
  const { user, loading } = useUser()
  const [shop, setShop] = useState<Shop | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorkers, setSelectedWorkers] = useState<{ [key: string]: string[] }>({})
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

  const fetchData = useCallback(async () => {
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
  }, [user])

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
        <div className="flex items-center space-x-2">
          <Button className="flex items-center space-x-2" variant="secondary" onClick={handleAutoSchedule}>
            <span>Auto-Schedule</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Optimize with AI</span>
          </Button>
        </div>
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

      {/* Schedule Calendar (auto-schedule result if present) */}
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
              {shop.shifts.map((shift, shiftIdx) => (
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
                  {weekDays.map((day, dayIdx) => {
                    // If autoSchedule is present, use it
                    let assignedWorkers: string[] = [];
                    let isHoliday = false;
                    if (autoSchedule) {
                      console.log('Auto-schedule data:', autoSchedule);
                      const dayObj = autoSchedule?.find(d => d.day === dayIdx);
                      if (dayObj && dayObj.schedule === 'HOLIDAY') {
                        isHoliday = true;
                      } else if (dayObj && Array.isArray(dayObj.schedule)) {
                        const shiftObj = dayObj.schedule.find(s => s.shift === shiftIdx);
                        assignedWorkers = shiftObj ? shiftObj.workers : [];
                      }
                    }

                    return (
                      <div key={`${shift.id}-${day.name}`} className="p-3 border rounded-lg min-h-[120px] space-y-2">
                        {isHoliday ? (
                          <div className="text-center text-xs text-muted-foreground">Holiday</div>
                        ) : (
                          <>
                            {/* Assignment count indicator */}
                            <div className="text-xs text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${assignedWorkers.length === shift.maxEmployees ? 'bg-green-100 text-green-800' :
                                assignedWorkers.length > 0 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                {assignedWorkers.length}/{shift.maxEmployees}
                              </span>
                            </div>
                            {/* Assigned workers list */}
                            {assignedWorkers.length > 0 && (
                              <div className="space-y-1">
                                {assignedWorkers.slice(0, 3).map((workerName) => (
                                  <div key={workerName} className="flex items-center justify-between bg-primary/10 rounded px-2 py-1">
                                    <span className="text-xs font-medium text-primary truncate">
                                      {workerName}
                                    </span>
                                  </div>
                                ))}
                                {assignedWorkers.length > 3 && (
                                  <div className="text-xs text-muted-foreground text-center">
                                    +{assignedWorkers.length - 3} more
                                  </div>
                                )}
                              </div>
                            )}
                          </>
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