'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUser } from '@/contexts/UserContext'
import { doc, getDoc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Worker } from '@/types'
import { UserPlus, Mail, DollarSign, Briefcase, Loader2, Building, Users } from 'lucide-react'
import { toast } from 'sonner'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  hourlyWage: z.string().min(1, 'Hourly wage is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Hourly wage must be a positive number'
  ),
  workType: z.string().min(1, 'Work type is required'),
})

interface AddEmployeeDialogProps {
  onEmployeeAdded: (employee: Worker) => void
}

export function AddEmployeeDialog({ onEmployeeAdded }: AddEmployeeDialogProps) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<string[]>(['General Worker'])

  useEffect(() => {
    async function fetchShopRoles() {
      if (!user) return
      try {
        const shopDoc = await getDoc(doc(db, 'shops', user.id))
        if (shopDoc.exists()) {
          const shopData = shopDoc.data()
          setAvailableRoles(shopData.workTypes && shopData.workTypes.length > 0 
            ? shopData.workTypes 
            : ['General Worker'])
        }
      } catch (err) {
        console.error('Error fetching shop roles:', err)
      }
    }
    fetchShopRoles()
  }, [user])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      hourlyWage: '',
      workType: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return

    setLoading(true)
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', values.email)
      )
      const usersSnapshot = await getDocs(usersQuery)
      
      if (usersSnapshot.empty) {
        toast.error('No user found with this email address')
        setLoading(false)
        return
      }

      const userDoc = usersSnapshot.docs[0]
      const existingUserData = userDoc.data()
      
      if (existingUserData.type === 'worker' && existingUserData.ownerId === user.id) {
        toast.error('This user is already an employee of your shop')
        setLoading(false)
        return
      }

      const updatedWorkerData = {
        ...existingUserData,
        type: 'worker',
        ownerId: user.id,
        hourlyWage: Number(values.hourlyWage),
        workType: values.workType,
        isActive: true,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, 'users', userDoc.id), updatedWorkerData)

      const shopDoc = await getDoc(doc(db, 'shops', user.id))
      if (shopDoc.exists()) {
        const shopData = shopDoc.data()
        const currentWorkTypes = shopData.workTypes || []
        
        if (!currentWorkTypes.includes(values.workType)) {
          await updateDoc(doc(db, 'shops', user.id), {
            workTypes: [...currentWorkTypes, values.workType]
          })
          setAvailableRoles([...currentWorkTypes, values.workType]) // keep UI in sync
        }
      }

      const newWorker: Worker = {
        id: userDoc.id,
        ...updatedWorkerData
      } as Worker

      onEmployeeAdded(newWorker)
      
      toast.success(`Employee added successfully with role: ${values.workType}`)
      
      form.reset()
      setOpen(false)
    } catch (error: any) {
      console.error('Error adding employee:', error)
      toast.error(error.message || 'Failed to add employee')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogTrigger asChild>
        <Button className="bg-slate-700 hover:bg-slate-800 text-white shadow-md border-0 transition-colors">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg z-50"
        onInteractOutside={(e) => {
          if (loading) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="space-y-4 pb-4 border-b border-gray-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              Add Employee to Shop
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm">
              Add an existing user as an employee with role and wage
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-slate-500" />
                      Employee Email
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="employee@example.com" 
                        {...field} 
                        className="h-10 border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-500">
                      Enter email of an existing user to add as employee
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Work Type and Hourly Wage in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium flex items-center text-sm">
                        <Briefcase className="w-4 h-4 mr-2 text-slate-500" />
                        Job Role
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-50">
                          {availableRoles.map((role) => (
                            <SelectItem key={role} value={role} className="cursor-pointer">
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyWage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium flex items-center text-sm">
                        <DollarSign className="w-4 h-4 mr-2 text-slate-500" />
                        Hourly Rate (₹)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                          <Input 
                            type="number" 
                            placeholder="500" 
                            step="1"
                            min="0"
                            {...field} 
                            className="h-10 pl-8 border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                            disabled={loading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 h-10 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-10 bg-slate-700 hover:bg-slate-800 text-white border-0 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <Building className="w-4 h-4 text-slate-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-slate-800 mb-1">Adding Employee Process</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></div>
                  User must already exist in the system
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></div>
                  User profile updated with employee role
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></div>
                  Employee added to your shop with specified wage and role
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
