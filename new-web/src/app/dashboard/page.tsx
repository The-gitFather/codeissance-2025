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
import { Building2, Users, Settings } from 'lucide-react'
import { InviteEmployeeDialog } from '@/components/employee/InviteEmployeeDialog'

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

      await setDoc(doc(db, 'shops', user.id), shopDoc)
      setShop({ id: user.id, ...shopDoc })
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving shop:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEmployeeAdded = (newEmployee: Worker) => {
    setWorkers(prev => [...prev, newEmployee])
  }

  if (loading || shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.type !== 'owner') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your shop and employees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shop?.shifts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shop Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shop ? 'Active' : 'Setup Required'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Shop Details</h2>
            {shop && !isEditing && (
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {!shop || isEditing ? (
            <ShopForm
              shop={shop || undefined}
              onSubmit={handleShopSubmit}
              loading={saving}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{shop.name}</CardTitle>
                <CardDescription>{shop.shifts?.length || 0} shifts configured</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shop.shifts?.map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{shift.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {shift.maxEmployees} max
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Employees</h2>
            <InviteEmployeeDialog onEmployeeAdded={handleEmployeeAdded} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your employees</CardDescription>
            </CardHeader>
            <CardContent>
              {workers.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No employees added yet. Invite your first employee to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {workers.map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{worker.name}</div>
                        <div className="text-sm text-gray-500">{worker.email}</div>
                      </div>
                      <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}