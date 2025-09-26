'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, X } from 'lucide-react'
import { Shop, Shift } from '@/types'

interface ShopFormProps {
  shop?: Shop
  onSubmit: (shopData: Omit<Shop, 'id' | 'createdAt'>) => void
  loading?: boolean
}

export function ShopForm({ shop, onSubmit, loading }: ShopFormProps) {
  const [shopName, setShopName] = useState(shop?.name || '')
  const [shifts, setShifts] = useState<Omit<Shift, 'id'>[]>(
    shop?.shifts?.map(({ id, ...shift }) => shift) || []
  )
  const [isAddingShift, setIsAddingShift] = useState(false)
  const [newShift, setNewShift] = useState({
    name: '',
    startTime: '',
    endTime: '',
    maxEmployees: 1
  })

  const addShift = () => {
    if (newShift.name && newShift.startTime && newShift.endTime) {
      setShifts([...shifts, newShift])
      setNewShift({
        name: '',
        startTime: '',
        endTime: '',
        maxEmployees: 1
      })
      setIsAddingShift(false)
    }
  }

  const removeShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: shopName,
      ownerId: shop?.ownerId || '',
      shifts: shifts.map((shift, index) => ({
        ...shift,
        id: shop?.shifts?.[index]?.id || `shift-${index}`
      }))
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{shop ? 'Edit Shop Details' : 'Create Your Shop'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Shifts</Label>
              <Dialog open={isAddingShift} onOpenChange={setIsAddingShift}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Shift</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Shift</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shiftName">Shift Name</Label>
                      <Input
                        id="shiftName"
                        value={newShift.name}
                        onChange={(e) => setNewShift({...newShift, name: e.target.value})}
                        placeholder="e.g., Morning, Afternoon, Evening"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={newShift.startTime}
                          onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={newShift.endTime}
                          onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="maxEmployees">Maximum Employees</Label>
                      <Input
                        id="maxEmployees"
                        type="number"
                        min="1"
                        value={newShift.maxEmployees}
                        onChange={(e) => setNewShift({...newShift, maxEmployees: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddingShift(false)}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={addShift}>
                        Add Shift
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {shifts.map((shift, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{shift.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {shift.startTime} - {shift.endTime} ({shift.maxEmployees} employees max)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeShift(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : (shop ? 'Update Shop' : 'Create Shop')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}