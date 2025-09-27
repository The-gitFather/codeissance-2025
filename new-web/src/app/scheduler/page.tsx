'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Shop, Worker, DAYS_OF_WEEK } from '@/types'
import { Calendar, Clock, Umbrella, Users, Zap } from 'lucide-react'
import { format, startOfWeek, addDays } from 'date-fns'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { toast } from 'sonner'

// Schedule type definitions
interface ScheduleShift {
  shift: number;
  workers: string[];
}

interface ScheduleDay {
  day: number;
  schedule: ScheduleShift[] | 'HOLIDAY';
}

export default function SchedulerPage() {
  // State to hold auto-schedule result
  const [autoSchedule, setAutoSchedule] = useState<ScheduleDay[] | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // AI Optimization handler
  // AI Optimization handler - Fixed version
  const handleOptimizeWithAI = async () => {
    if (!autoSchedule || !shop || workers.length === 0) {
      toast.warning('Please generate an auto-schedule first before optimizing.');
      return;
    }

    setIsOptimizing(true);

    try {
      // Convert current schedule to the format Gemini expects
      const currentScheduleFormatted = Array.from({ length: 7 }, (_, dayIdx) => {
        const shifts = shop.shifts.map((shift, shiftIdx) => {
          // Find workers assigned to this day and shift
          const daySchedule = autoSchedule.find(d => d.day === dayIdx);
          if (daySchedule && daySchedule.schedule === 'HOLIDAY') {
            return [];
          }

          if (daySchedule && Array.isArray(daySchedule.schedule)) {
            const shiftSchedule = daySchedule.schedule.find((s) => s.shift === shiftIdx);
            return shiftSchedule ? shiftSchedule.workers : [];
          }

          return [];
        });

        return shifts;
      });

      // Calculate current shifts per employee
      const shiftsPerEmployee: { [key: string]: number } = {};
      workers.forEach(worker => {
        shiftsPerEmployee[worker.name] = 0;
      });

      currentScheduleFormatted.forEach((dayShifts) => {
        dayShifts.forEach((shiftWorkers) => {
          shiftWorkers.forEach((workerName) => {
            if (shiftsPerEmployee[workerName] !== undefined) {
              shiftsPerEmployee[workerName]++;
            }
          });
        });
      });

      // Prepare the prompt for Gemini
      const prompt = `You are an intelligent scheduling optimizer. Your task is to optimize a work schedule by rearranging shifts among employees while maintaining these STRICT constraints:

CONSTRAINTS:
1. Each employee MUST keep the exact same total number of shifts they currently have
2. The total number of workers per shift must remain the same
3. No shift can exceed its maximum capacity (${shop.shifts.map(s => `${s.name}: ${s.maxEmployees}`).join(', ')})
4. Employees cannot be assigned to shifts on their holidays

CURRENT SCHEDULE DATA:
- Days: Monday(0) to Sunday(6)
- Shifts per day: ${shop.shifts.map((s, i) => `${i}:${s.name}(${s.startTime}-${s.endTime})`).join(', ')}
- Current shifts per employee: ${JSON.stringify(shiftsPerEmployee)}

CURRENT SCHEDULE:
${JSON.stringify(currentScheduleFormatted)}

OPTIMIZATION GOALS:
1. Distribute shifts more evenly across the week for each employee
2. Avoid consecutive shifts for the same employee when possible
3. Balance workload distribution

Return an optimized schedule maintaining all constraints.`;

      // Initialize the Google Generative AI client with proper structure
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "array",
                items: {
                  type: "string"
                }
              }
            }
          }
        }
      });

      const optimizedScheduleText = result.response.text();

      // Parse the JSON response
      let optimizedSchedule;
      try {
        optimizedSchedule = JSON.parse(optimizedScheduleText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', optimizedScheduleText);
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error('Invalid response format from AI: ' + errorMsg);
      }

      // Validate the response structure
      if (!Array.isArray(optimizedSchedule) || optimizedSchedule.length !== 7) {
        throw new Error('Invalid schedule format: expected 7 days');
      }

      // Convert back to the autoSchedule format
      const optimizedAutoSchedule = optimizedSchedule.map((dayShifts, dayIdx) => {
        if (!Array.isArray(dayShifts)) {
          throw new Error(`Invalid day ${dayIdx}: expected array of shifts`);
        }

        const shiftsData = dayShifts.map((shiftWorkers, shiftIdx) => {
          if (!Array.isArray(shiftWorkers)) {
            throw new Error(`Invalid shift ${shiftIdx} on day ${dayIdx}: expected array of workers`);
          }
          return {
            shift: shiftIdx,
            workers: shiftWorkers
          };
        });

        return {
          day: dayIdx,
          schedule: shiftsData
        };
      });

      // Validate constraints before applying
      const newShiftsPerEmployee: { [key: string]: number } = {};
      workers.forEach(worker => {
        newShiftsPerEmployee[worker.name] = 0;
      });

      optimizedSchedule.forEach((dayShifts: string[][]) => {
        dayShifts.forEach((shiftWorkers: string[]) => {
          shiftWorkers.forEach((workerName: string) => {
            if (newShiftsPerEmployee[workerName] !== undefined) {
              newShiftsPerEmployee[workerName]++;
            }
          });
        });
      });

      // Check if shift counts are preserved
      let constraintsViolated = false;
      for (const worker of workers) {
        if (shiftsPerEmployee[worker.name] !== newShiftsPerEmployee[worker.name]) {
          console.error(`Constraint violation: ${worker.name} had ${shiftsPerEmployee[worker.name]} shifts, now has ${newShiftsPerEmployee[worker.name]}`);
          constraintsViolated = true;
        }
      }

      if (constraintsViolated) {
        throw new Error('AI optimization violated shift count constraints');
      }

      // Save optimized schedule to shop document
      if (user?.id) {
        try {
          await updateDoc(doc(db, 'shops', user.id), {
            optimizedSchedule: optimizedAutoSchedule,
            lastOptimized: new Date().toISOString()
          });

          setAutoSchedule(optimizedAutoSchedule);
          console.log('Optimized schedule saved to shop:', optimizedAutoSchedule);
          toast.success('Schedule optimized and saved successfully with AI!');
        } catch (saveError) {
          console.error('Error saving optimized schedule:', saveError);
          // Still update local state even if save fails
          setAutoSchedule(optimizedAutoSchedule);
          toast.error('Schedule optimized but failed to save to database. Please try again.');
        }
      } else {
        console.error('No user ID available for saving schedule');
        setAutoSchedule(optimizedAutoSchedule);
        toast.error('Schedule optimized but could not save (no user ID)');
      }

    } catch (error) {
      console.error('AI optimization error:', error);

      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes('404') || errorMessage?.includes('not found')) {
        toast.error('AI service unavailable. Please check your API key and model access.');
      } else if (errorMessage?.includes('Invalid response format')) {
        toast.error('AI returned invalid data format. Please try again.');
      } else if (errorMessage?.includes('constraint')) {
        toast.error('AI optimization failed to maintain required constraints. Please try again.');
      } else {
        toast.error('AI optimization failed: ' + errorMessage);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  // Auto-schedule handler
  const handleAutoSchedule = async () => {
    if (!shop || workers.length === 0) {
      toast.warning('No shop or workers found.');
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
    // const coverage = Array(shifts).fill(2);
    const coverage = [];
    for (let i = 0; i < shop.shifts.length; i++) {
      coverage.push(shop.shifts[i].maxEmployees);
    }
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
      // Save auto-schedule to shop document
      if (user?.id) {
        try {
          await updateDoc(doc(db, 'shops', user.id), {
            currentSchedule: data.schedule,
            lastScheduled: new Date().toISOString()
          });

          setAutoSchedule(data.schedule);
          console.log('Auto-schedule saved to shop:', data.schedule);
          toast.success('Auto-schedule complete and saved!');
        } catch (saveError) {
          console.error('Error saving auto-schedule:', saveError);
          // Still update local state even if save fails
          setAutoSchedule(data.schedule);
          toast.error('Auto-schedule complete but failed to save to database.');
        }
      } else {
        console.error('No user ID available for saving schedule');
        setAutoSchedule(data.schedule);
        toast.error('Auto-schedule complete but could not save (no user ID)');
      }
    } catch (err) {
      console.error('Auto-schedule error:', err);
      toast.error('Auto-schedule error: ' + err);
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
  const fadeIn = (delay) => ({ animation: `fadeIn ${delay}ms ease-in-out` })
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div
          style={fadeIn(0)}
          className="bg-card border border-border rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Shift Scheduler</h1>
              <p className="text-muted-foreground mt-1">Efficiently manage and optimize your team's weekly schedule.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="px-5 py-5 bg-secondary text-primary border border-primary/30 hover:bg-primary/5 rounded-md font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                variant="secondary"
                onClick={handleAutoSchedule}
              >
                Auto-Schedule
              </Button>
              <Button
                className="px-5 py-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                onClick={handleOptimizeWithAI}
                disabled={isOptimizing || !autoSchedule}
              >
                <Zap className="w-5 h-5 mr-2 opacity-90" />
                {isOptimizing ? "Optimizing..." : "Optimize with AI"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-8">
          {/* Left Column: Schedule Calendar */}
          <div>
            <Card
              style={fadeIn(100)}
              className="bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <CardHeader className="p-6 border-b border-border">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <Calendar className="w-6 h-6 text-primary" />
                  <span>Weekly Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-8 gap-3 min-w-[1100px]">
                    {/* Header Row */}
                    <div className="font-semibold text-center text-primary text-sm uppercase tracking-wider pb-4">
                      Shifts
                    </div>
                    {weekDays.map((day) => (
                      <div key={day.name} className="text-center pb-4">
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold transition-colors duration-200 hover:bg-primary/15">
                          {day.displayName}
                        </div>
                        <div className="text-xs mt-1 text-primary/80 font-medium">{format(day.date, "MMM d")}</div>
                      </div>
                    ))}

                    {/* Shift Rows */}
                    {shop.shifts.map((shift, shiftIdx) => (
                      <React.Fragment key={shift.id}>
                        <div className="p-4 rounded-lg bg-secondary flex flex-col justify-center items-center text-center transition-colors border-l-4 border-primary/70">
                          <div className="font-bold text-base">{shift.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3" /> {shift.startTime} - {shift.endTime}
                          </div>
                        </div>
                        {weekDays.map((day, dayIdx) => {
                          let assignedWorkers = []
                          let isHoliday = false
                          if (autoSchedule) {
                            const dayObj = autoSchedule.find((d) => d.day === dayIdx)
                            if (dayObj?.schedule === "HOLIDAY") isHoliday = true
                            else if (dayObj?.schedule) {
                              const shiftObj = dayObj.schedule.find((s) => s.shift === shiftIdx)
                              assignedWorkers = shiftObj ? shiftObj.workers : []
                            }
                          }
                          const workerCount = assignedWorkers.length
                          const maxEmployees = shift.maxEmployees
                          const isFull = workerCount === maxEmployees
                          const isPartial = workerCount > 0 && !isFull

                          return (
                            <div
                              key={`${shift.id}-${day.name}`}
                              className="p-3 rounded-lg border border-border min-h-[140px] space-y-2 bg-muted/30 hover:border-primary/50 hover:bg-secondary focus-within:ring-1 focus-within:ring-primary/35 transition-all duration-200 ease-out hover:-translate-y-0.5"
                            >
                              {isHoliday ? (
                                <div className="flex items-center justify-center h-full text-center text-warning">
                                  <div className="flex flex-col items-center gap-2 font-semibold">
                                    <Umbrella className="w-6 h-6" />
                                    <span>Holiday</span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div
                                    className={`text-right text-xs font-bold px-2 py-0.5 rounded-full ${isFull ? "text-success" : isPartial ? "text-warning" : "text-muted-foreground"
                                      }`}
                                  >
                                    {workerCount} / {maxEmployees}
                                  </div>
                                  <div className="space-y-1.5">
                                    {assignedWorkers.slice(0, 2).map((workerName) => (
                                      <div
                                        key={workerName}
                                        className="bg-primary/10 text-primary border border-primary/20 rounded-md px-2.5 py-1.5 text-sm font-medium truncate transition-transform duration-150 hover:scale-[1.02]"
                                      >
                                        {workerName}
                                      </div>
                                    ))}
                                    {workerCount > 2 && (
                                      <div className="text-xs text-muted-foreground text-center pt-1 font-medium">
                                        + {workerCount - 2} more
                                      </div>
                                    )}
                                  </div>
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
          </div>

          {/* Right Column: Sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team Members */}
            <Card
              style={fadeIn(200)}
              className="bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5 h-full"
            >
              <CardHeader className="p-6 border-b border-border">
                <CardTitle className="flex items-center justify-between text-xl font-bold">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-primary" />
                    <span>Team Members</span>
                  </div>
                  <Badge className="bg-primary/10 text-primary border border-primary/20 font-semibold">
                    {workers.length} Total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2.5">
                  {workers.map((worker) => (
                    <Badge
                      key={worker.id}
                      className="px-3 py-1 bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 font-medium rounded-md cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/20"
                    >
                      {worker.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Summary */}
            <Card
              style={fadeIn(300)}
              className="bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5 h-full"
            >
              <CardHeader className="p-6 border-b border-border">
                <CardTitle className="text-xl font-bold">Schedule Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Total Assignments</span>
                  <span className="text-2xl font-bold text-primary">
                    {Object.values(selectedWorkers).reduce((acc, w) => acc + w.length, 0)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Coverage</span>
                  <span className="text-2xl font-bold text-success">
                    {Math.round(
                      (Object.values(selectedWorkers).reduce((acc, w) => acc + w.length, 0) /
                        (shop.shifts.length *
                          7 *
                          (shop.shifts.reduce((acc, s) => acc + s.maxEmployees, 0) / shop.shifts.length) || 1)) *
                      100,
                    )}
                    %
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Active Workers</span>
                  <span className="text-2xl font-bold text-warning">
                    {new Set(Object.values(selectedWorkers).flat()).size}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}