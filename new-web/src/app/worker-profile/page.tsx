"use client"
import React, { useState, useEffect } from "react"
import { User, Calendar, Clock, Settings, BarChart3 } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase" // Adjust import path as needed
import { useUser } from "@/contexts/UserContext"

const WorkerProfile = () => {
  const { user, loading } = useUser()
  const [shopStatus, setShopStatus] = useState({ found: false, shopName: "", loading: true, shifts: [] })
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [editableAvailability, setEditableAvailability] = useState([])
  const [editableMaxShifts, setEditableMaxShifts] = useState(0)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [displayAvailability, setDisplayAvailability] = useState<any[]>([])
  const [displayMaxShifts, setDisplayMaxShifts] = useState<number>(0)

  useEffect(() => {
    const checkShopStatus = async () => {
      if (!user || user.type !== "worker" || !user.ownerId) {
        setShopStatus({ found: false, shopName: "", loading: false, shifts: [] })
        return
      }

      try {
        // Get the owner's shop document
        const shopDoc = await getDoc(doc(db, "shops", user.ownerId))

        if (shopDoc.exists()) {
          const shopData = shopDoc.data()
          setShopStatus({
            found: true,
            shopName: shopData.name || "Unknown Shop",
            shifts: shopData.shifts || [],
            loading: false,
          })
        } else {
          setShopStatus({ found: false, shopName: "", loading: false, shifts: [] })
        }
      } catch (error) {
        console.error("Error checking shop status:", error)
        setShopStatus({ found: false, shopName: "", loading: false, shifts: [] })
      }
    }

    checkShopStatus()
  }, [user])

  useEffect(() => {
    const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const sorted =
      user?.shiftAvailability?.slice()?.sort((a: any, b: any) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)) ||
      []
    setDisplayAvailability(sorted)
    setDisplayMaxShifts(user?.maxShiftsPerWeek || 0)
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary/60 mx-auto"></div>
          <p className="mt-4 text-foreground/70">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user || user.type !== "worker") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-foreground/70">This page is only accessible to workers.</p>
        </div>
      </div>
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  const startEditingSchedule = () => {
    const initialAvailability = dayOrder.map((day) => {
      const existingDay = displayAvailability?.find((avail: any) => avail.day === day)

      const shifts = (shopStatus.shifts || []).map((_: any, idx: number) => {
        if (existingDay?.shifts && Array.isArray(existingDay.shifts)) {
          return existingDay.shifts[idx] ?? 0
        }
        return 0
      })

      return { day, shifts }
    })

    setEditableAvailability(initialAvailability)
    setEditableMaxShifts(displayMaxShifts || 0)
    setIsEditingSchedule(true)
  }

  const cancelEditingSchedule = () => {
    setIsEditingSchedule(false)
    const initialAvailability = dayOrder.map((day) => {
      const existingDay = displayAvailability?.find((avail: any) => avail.day === day)
      return { day, shifts: existingDay?.shifts || [] }
    })
    setEditableAvailability(initialAvailability)
    setEditableMaxShifts(displayMaxShifts || 0)
  }

  const toggleShiftForDay = (dayIndex, shiftIndex) => {
    setEditableAvailability((prev) =>
      prev.map((dayAvailability, i) => {
        if (i !== dayIndex) return dayAvailability

        const newShifts = [...dayAvailability.shifts]
        newShifts[shiftIndex] = newShifts[shiftIndex] === 1 ? 0 : 1

        return { ...dayAvailability, shifts: newShifts }
      }),
    )
  }

  const saveSchedule = async () => {
    if (!user) return
    setSavingSchedule(true)

    try {
      await updateDoc(doc(db, "users", user.id), {
        shiftAvailability: editableAvailability,
        maxShiftsPerWeek: editableMaxShifts,
      })

      setDisplayAvailability(editableAvailability)
      setDisplayMaxShifts(editableMaxShifts)
      setIsEditingSchedule(false)
    } catch (error) {
      console.error("Error saving schedule:", error)
    } finally {
      setSavingSchedule(false)
    }
  }

  // Calculate statistics
  const totalAvailableShifts = displayAvailability.reduce(
    (total: number, day: any) => total + (day.shifts?.filter((v: number) => v === 1)?.length || 0),
    0
  )
  
  const availableDays = displayAvailability.filter(
    (day: any) => day.shifts?.some((shift: number) => shift === 1)
  ).length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3 bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                <p className="text-foreground/70 text-sm">{user.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    Worker
                  </span>
                  {shopStatus.found && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                      {shopStatus.shopName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4 text-center">
              <div className="bg-primary/5 rounded-lg p-3 min-w-[80px]">
                <div className="text-xl font-bold text-primary">{totalAvailableShifts}</div>
                <div className="text-xs text-foreground/70">Available Shifts</div>
              </div>
              <div className="bg-accent/5 rounded-lg p-3 min-w-[80px]">
                <div className="text-xl font-bold text-accent">{displayMaxShifts}</div>
                <div className="text-xs text-foreground/70">Max/Week</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Preferences and Info */}
          <div className="xl:col-span-1 space-y-6">
            {/* Work Preferences */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Work Preferences</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Maximum Shifts Per Week
                  </label>
                  {isEditingSchedule ? (
                    <input
                      type="number"
                      min="0"
                      max="21"
                      value={editableMaxShifts}
                      onChange={(e) => setEditableMaxShifts(Number.parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  ) : (
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium inline-block">
                      {displayMaxShifts} shifts per week
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Preferred Shift Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {user.shiftPreferences?.length > 0 ? (
                      user.shiftPreferences.map((shift: string, index: number) => (
                        <span
                          key={index}
                          className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium capitalize"
                        >
                          {shift}
                        </span>
                      ))
                    ) : (
                      <span className="text-foreground/70 text-sm italic">No preferences set</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Availability Summary</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="text-sm font-medium text-foreground">Total Available Shifts</span>
                  <span className="text-lg font-bold text-primary">{totalAvailableShifts}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-accent/5 rounded-lg">
                  <span className="text-sm font-medium text-foreground">Available Days</span>
                  <span className="text-lg font-bold text-accent">{availableDays}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm font-medium text-foreground">Max Shifts/Week</span>
                  <span className="text-lg font-bold text-blue-600">{displayMaxShifts}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Schedule */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Weekly Availability Schedule</h2>
                </div>

                {!isEditingSchedule ? (
                  <button
                    onClick={startEditingSchedule}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Schedule
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEditingSchedule}
                      className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveSchedule}
                      disabled={savingSchedule}
                      className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {savingSchedule ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>

              {shopStatus.found && shopStatus.shifts?.length > 0 ? (
                <div className="space-y-6">
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-4">
                    {dayOrder.map((day, dayIdx) => (
                      <div key={day} className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-primary/5 border-b">
                          <h3 className="font-semibold capitalize text-foreground">{day}</h3>
                        </div>
                        <div className="divide-y">
                          {shopStatus.shifts.map((shift: any, shiftIdx: number) => {
                            const isAvailable = isEditingSchedule
                              ? editableAvailability[dayIdx]?.shifts[shiftIdx] === 1
                              : displayAvailability.find((avail: any) => avail.day === day)?.shifts[shiftIdx] === 1

                            return (
                              <div key={`${day}-${shift.id}`} className="flex items-center justify-between px-4 py-3">
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">{shift.name}</div>
                                  <div className="text-sm text-foreground/70 flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                </div>

                                {isEditingSchedule ? (
                                  <label className="cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isAvailable}
                                      onChange={() => toggleShiftForDay(dayIdx, shiftIdx)}
                                      className="w-5 h-5 rounded border-2 text-primary focus:ring-primary focus:ring-offset-0"
                                    />
                                  </label>
                                ) : (
                                  <div>
                                    {isAvailable ? (
                                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                        Available
                                      </span>
                                    ) : (
                                      <span className="text-foreground/50 text-xs">Unavailable</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Grid Layout */}
                  <div className="hidden lg:block overflow-x-auto">
                    <div className="min-w-full">
                      <div className="grid grid-cols-8 gap-3">
                        {/* Header Row */}
                        <div className="p-4 font-semibold text-center border rounded-lg bg-primary/10 text-primary">
                          Shifts
                        </div>
                        {dayOrder.map((day) => (
                          <div key={day} className="p-4 text-center border rounded-lg bg-primary/5">
                            <div className="font-semibold capitalize text-foreground text-sm">{day}</div>
                          </div>
                        ))}

                        {/* Shift Rows */}
                        {shopStatus.shifts.map((shift: any, shiftIdx: number) => (
                          <React.Fragment key={shift.id}>
                            {/* Shift Name Column */}
                            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex flex-col justify-center">
                              <div className="font-semibold text-sm text-foreground mb-1">{shift.name}</div>
                              <div className="text-xs text-foreground/70 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {shift.startTime} - {shift.endTime}
                              </div>
                            </div>

                            {/* Day Columns */}
                            {dayOrder.map((day, dayIdx) => {
                              const isAvailable = isEditingSchedule
                                ? editableAvailability[dayIdx]?.shifts[shiftIdx] === 1
                                : displayAvailability.find((avail: any) => avail.day === day)?.shifts[shiftIdx] === 1

                              return (
                                <div
                                  key={`${shift.id}-${day}`}
                                  className="p-4 border rounded-lg min-h-[80px] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  {isEditingSchedule ? (
                                    <label className="cursor-pointer flex items-center justify-center w-full h-full">
                                      <input
                                        type="checkbox"
                                        checked={isAvailable}
                                        onChange={() => toggleShiftForDay(dayIdx, shiftIdx)}
                                        className="w-5 h-5 rounded border-2 text-primary focus:ring-primary focus:ring-offset-0"
                                      />
                                    </label>
                                  ) : (
                                    <div className="text-center">
                                      {isAvailable ? (
                                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                          Available
                                        </div>
                                      ) : (
                                        <div className="text-foreground/40 text-xs">—</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Schedule Available</h3>
                  <p className="text-foreground/70">
                    {shopStatus.loading
                      ? "Loading shop information..."
                      : shopStatus.found
                      ? "No shifts have been configured for your shop yet."
                      : "You haven't been assigned to a shop yet."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerProfile