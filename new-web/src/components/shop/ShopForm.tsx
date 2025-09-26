'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, X, Briefcase, Clock } from 'lucide-react'
import { Shop, Shift } from '@/types'

interface ShopFormProps {
  shop?: Shop
  onSubmit: (shopData: Omit<Shop, 'id' | 'createdAt'>) => void
  loading?: boolean
}

const commonRoles = [
  'Manager',
  'Cashier',
  'Sales Associate',
  'Kitchen Staff',
  'Delivery Driver',
  'Customer Service',
  'Cleaner',
  'Security',
  'Supervisor',
  'Maintenance'
]

export function ShopForm({ shop, onSubmit, loading }: ShopFormProps) {
  const [shopName, setShopName] = useState(shop?.name || '')
  const [shifts, setShifts] = useState<Omit<Shift, 'id'>[]>(
    shop?.shifts?.map(({ id, ...shift }) => shift) || []
  )
  const [workTypes, setWorkTypes] = useState<string[]>(shop?.workTypes || [])
  const [isAddingShift, setIsAddingShift] = useState(false)
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [customRole, setCustomRole] = useState('')
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

  const addWorkType = (role: string) => {
    if (role && !workTypes.includes(role)) {
      setWorkTypes([...workTypes, role])
    }
  }

  const removeWorkType = (role: string) => {
    setWorkTypes(workTypes.filter(type => type !== role))
  }

  const addCustomRole = () => {
    if (customRole.trim()) {
      addWorkType(customRole.trim())
      setCustomRole('')
      setIsAddingRole(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: shopName,
      ownerId: shop?.ownerId || '',
      workTypes: workTypes,
      shifts: shifts.map((shift, index) => ({
        ...shift,
        id: shop?.shifts?.[index]?.id || `shift-${index}`
      }))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shop Name */}
      <div className="space-y-2">
        <Label htmlFor="shopName" className="text-sm font-medium">Shop Name</Label>
        <Input
          id="shopName"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Enter your shop name"
          required
          className="h-10"
        />
      </div>

      {/* Work Types/Roles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-slate-600" />
            <Label className="text-sm font-medium">Job Roles</Label>
          </div>
          <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Job Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Quick add common roles */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Common Roles</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {commonRoles.filter(role => !workTypes.includes(role)).map((role) => (
                      <Button
                        key={role}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          addWorkType(role)
                          setIsAddingRole(false)
                        }}
                        className="text-xs h-8"
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Custom role input */}
                <div>
                  <Label htmlFor="customRole" className="text-sm font-medium">Custom Role</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="customRole"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="Enter custom role"
                      className="h-9"
                    />
                    <Button type="button" onClick={addCustomRole} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Work Types */}
        <div className="space-y-2">
          {workTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {workTypes.map((type, index) => (
                <div key={index} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <span>{type}</span>
                  <button
                    type="button"
                    onClick={() => removeWorkType(type)}
                    className="ml-2 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No roles added yet</p>
          )}
        </div>
      </div>

      {/* Shifts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <Label className="text-sm font-medium">Shifts</Label>
          </div>
          <Dialog open={isAddingShift} onOpenChange={setIsAddingShift}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Shift
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
                    placeholder="e.g., Morning, Evening"
                    className="h-9 mt-1"
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
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                      className="h-9 mt-1"
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
                    className="h-9 mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
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
          {shifts.length > 0 ? (
            shifts.map((shift, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <div>
                  <span className="font-medium text-slate-900">{shift.name}</span>
                  <div className="text-sm text-slate-600">
                    {shift.startTime} - {shift.endTime} • Max {shift.maxEmployees} employees
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeShift(index)}
                  className="text-slate-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No shifts added yet</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-10">
        {loading ? 'Saving...' : (shop ? 'Update Shop' : 'Create Shop')}
      </Button>
    </form>
  )
}