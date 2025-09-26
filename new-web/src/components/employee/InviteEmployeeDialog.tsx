'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUser } from '@/contexts/UserContext'
import { Worker } from '@/types'

interface InviteEmployeeDialogProps {
    onEmployeeAdded?: (employee: Worker) => void
}

export function InviteEmployeeDialog({ onEmployeeAdded }: InviteEmployeeDialogProps) {
    const { user } = useUser()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [feedback, setFeedback] = useState<{
        type: 'error' | 'success' | null
        message: string
    }>({ type: null, message: '' })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user || user.type !== 'owner') {
            setFeedback({ type: 'error', message: 'Only owners can add employees' })
            return
        }

        if (!email.trim()) {
            setFeedback({ type: 'error', message: 'Please enter an email address' })
            return
        }

        setLoading(true)
        setFeedback({ type: null, message: '' })

        try {
            // Find user with the given email
            const usersQuery = query(
                collection(db, 'users'),
                where('email', '==', email.trim())
            )
            const querySnapshot = await getDocs(usersQuery)

            if (querySnapshot.empty) {
                setFeedback({
                    type: 'error',
                    message: 'No user found with this email address. Please ask them to create an account first.'
                })
                return
            }

            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()

            // Check if user is already a worker type
            if (userData.type !== 'worker') {
                setFeedback({
                    type: 'error',
                    message: 'This user is not registered as a worker. Only worker accounts can be added.'
                })
                return
            }

            // Check if worker is already assigned to this owner
            if (userData.ownerId === user.id) {
                setFeedback({
                    type: 'error',
                    message: 'This worker is already part of your team.'
                })
                return
            }

            // Check if worker is already assigned to another owner
            if (userData.ownerId && userData.ownerId !== user.id) {
                setFeedback({
                    type: 'error',
                    message: 'This worker is already assigned to another shop owner.'
                })
                return
            }

            // Update the worker to assign them to this owner
            const workerRef = doc(db, 'users', userDoc.id)
            await updateDoc(workerRef, {
                ownerId: user.id
            })

            // Create the worker object for the parent component
            const updatedWorker: Worker = {
                id: userDoc.id,
                email: userData.email,
                name: userData.name,
                type: 'worker',
                createdAt: userData.createdAt?.toDate() || new Date(),
                ownerId: user.id,
                shiftAvailability: userData.shiftAvailability || [],
                shiftPreferences: userData.shiftPreferences || [],
                maxShiftsPerWeek: userData.maxShiftsPerWeek || 0
            }

            // Notify parent component
            onEmployeeAdded?.(updatedWorker)

            setFeedback({
                type: 'success',
                message: `Successfully added ${userData.name} to your team!`
            })

            // Reset form and close dialog after a short delay
            setTimeout(() => {
                setEmail('')
                setFeedback({ type: null, message: '' })
                setOpen(false)
            }, 1500)

        } catch (error) {
            console.error('Error adding employee:', error)
            setFeedback({
                type: 'error',
                message: 'An error occurred while adding the employee. Please try again.'
            })
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEmail('')
        setFeedback({ type: null, message: '' })
    }

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen)
            if (!newOpen) {
                resetForm()
            }
        }}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Existing Employee</DialogTitle>
                    <DialogDescription>
                        Enter the email address of an existing worker to add them to your team.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {feedback.type && (
                            <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
                                {feedback.type === 'error' ? (
                                    <AlertCircle className="h-4 w-4" />
                                ) : (
                                    <CheckCircle className="h-4 w-4" />
                                )}
                                <AlertDescription>
                                    {feedback.message}
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="col-span-3"
                                placeholder="worker@example.com"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || feedback.type === 'success'}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                'Add Employee'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
