'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShopForm } from '@/components/shop/ShopForm'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Shop, Worker } from '@/types'
import { 
  Building2, 
  Users, 
  Settings, 
  DollarSign, 
  Clock, 
  Briefcase,
  UserPlus,
  TrendingUp,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Plus
} from 'lucide-react'
import {  AddEmployeeDialog} from '@/components/InviteEmployeeDialog'

export default function DashboardPage() {
  const { user, loading } = useUser()
  const [shop, setShop] = useState<Shop | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [shopLoading, setShopLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.type !== 'owner')) {
      // redirect('/')
    }
  }, [user, loading])

  useEffect(() => {
    if (user) {
      fetchShopData()
      fetchWorkers()
    }
  }, [user])

  const fetchShopData = useCallback(async () => {
    if (!user) return

    try {
      const shopDoc = await getDoc(doc(db, 'shops', user.id))
      if (shopDoc.exists()) {
        setShop({ id: shopDoc.id, ...shopDoc.data() } as Shop)
      }
    } catch (error) {
      console.error('Error fetching shop:', error)
    } finally {
      setShopLoading(false)
    }
  }, [user])

  const fetchWorkers = useCallback(async () => {
    if (!user) return

    try {
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
      console.error('Error fetching workers:', error)
    }
  }, [user])

  const handleShopSubmit = async (shopData: Omit<Shop, 'id' | 'createdAt'>) => {
    if (!user) return

    setSaving(true)
    try {
      const shopDoc = {
        ...shopData,
        ownerId: user.id,
        createdAt: shop?.createdAt || new Date()
      }

      // Create/update the shop document
      await setDoc(doc(db, 'shops', user.id), shopDoc)
      
      setShop({ id: user.id, ...shopDoc })
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving shop:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEmployeeAdded = async (newEmployee: Worker) => {
    setWorkers(prev => [...prev, newEmployee])
    
    // Update shop's work types if new work type is added
    if (shop && newEmployee.workType && !shop.workTypes?.includes(newEmployee.workType)) {
      const updatedShop = {
        ...shop,
        workTypes: [...(shop.workTypes || []), newEmployee.workType]
      }
      
      try {
        await setDoc(doc(db, 'shops', user!.id), updatedShop)
        setShop(updatedShop)
      } catch (error) {
        console.error('Error updating shop work types:', error)
      }
    }
  }

  // Calculate statistics
  const totalWages = workers.reduce((sum, worker) => sum + (worker.hourlyWage || 0), 0)
  const averageWage = workers.length > 0 ? totalWages / workers.length : 0
  const uniqueWorkTypes = [...new Set(workers.map(w => w.workType).filter(Boolean))]

  if (loading || shopLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.type !== 'owner') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Business Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Welcome back! Manage your shop and team efficiently
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Workers</CardTitle>
              <Users className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workers.length}</div>
              <p className="text-xs opacity-80 mt-1">
                {workers.length > 0 ? '+12% from last month' : 'Start building your team'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Shifts</CardTitle>
              <Clock className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{shop?.shifts?.length || 0}</div>
              <p className="text-xs opacity-80 mt-1">
                {shop?.shifts?.length ? 'Shifts configured' : 'Setup required'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Average Wage</CardTitle>
              <DollarSign className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${averageWage.toFixed(2)}</div>
              <p className="text-xs opacity-80 mt-1">Per hour average</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Work Types</CardTitle>
              <Briefcase className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueWorkTypes.length}</div>
              <p className="text-xs opacity-80 mt-1">
                {uniqueWorkTypes.length > 0 ? 'Different roles' : 'Setup required'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Shop Details Section - Takes 2 columns */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Building2 className="w-6 h-6 mr-2 text-indigo-600" />
                Shop Details
              </h2>
              {shop && !isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Shop
                </Button>
              )}
            </div>

            {!shop || isEditing ? (
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    {shop ? 'Edit Shop Details' : 'Setup Your Shop'}
                  </CardTitle>
                  <CardDescription className="text-indigo-100">
                    Configure your shop settings and shift schedules
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ShopForm
                    shop={shop || undefined}
                    onSubmit={handleShopSubmit}
                    loading={saving}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center">
                        <Star className="w-6 h-6 mr-2" />
                        {shop.name}
                      </CardTitle>
                      <CardDescription className="text-indigo-100 mt-1">
                        {shop.shifts?.length || 0} shifts configured • {workers.length} employees
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {shop.shifts && shop.shifts.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 flex items-center mb-4">
                        <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                        Shift Schedule
                      </h3>
                      <div className="grid gap-4">
                        {shop.shifts.map((shift, index) => (
                          <div key={shift.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-indigo-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                  {index + 1}
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-800">{shift.name}</span>
                                  <div className="text-sm text-gray-600 flex items-center mt-1">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                                  Max: {shift.maxEmployees}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No shifts configured yet</p>
                    </div>
                  )}

                  {shop.workTypes && shop.workTypes.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold text-gray-800 flex items-center mb-4">
                        <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                        Available Work Types
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {shop.workTypes.map((workType, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {workType}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Employees Section - Takes 1 column */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Users className="w-6 h-6 mr-2 text-indigo-600" />
                Team
              </h2>
              <AddEmployeeDialog onEmployeeAdded={handleEmployeeAdded} />
            </div>

            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Team Members
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Manage your employees and their roles
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {workers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No employees yet</h3>
                    <p className="text-gray-500 mb-6">
                      Invite your first employee to get started with team management
                    </p>
                    <InviteEmployeeDialog onEmployeeAdded={handleEmployeeAdded} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workers.map((worker, index) => (
                      <div key={worker.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                              {worker.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-800 truncate">{worker.name}</h3>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Mail className="w-3 h-3 mr-1" />
                                <span className="truncate">{worker.email}</span>
                              </div>
                              
                              {worker.workType && (
                                <div className="flex items-center mt-2">
                                  <Briefcase className="w-3 h-3 mr-1 text-purple-600" />
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                                    {worker.workType}
                                  </span>
                                </div>
                              )}
                              
                              {worker.hourlyWage && (
                                <div className="flex items-center mt-2">
                                  <DollarSign className="w-3 h-3 mr-1 text-green-600" />
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                    ${worker.hourlyWage}/hr
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Summary Stats */}
                    {workers.length > 0 && (
                      <div className="mt-6 pt-4 border-t bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
                          Team Summary
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{workers.length}</div>
                            <div className="text-xs text-gray-600">Total Employees</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">${averageWage.toFixed(2)}</div>
                            <div className="text-xs text-gray-600">Avg. Wage/hr</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}