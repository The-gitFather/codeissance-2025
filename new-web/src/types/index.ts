export interface User {
  id: string
  email: string
  name: string
  type: 'owner' | 'worker'
  createdAt: Date
}

export interface Owner extends User {
  type: 'owner'
  shopId?: string
}

export interface Worker extends User {
  type: 'worker'
  ownerId?: string
  shiftAvailability: ShiftAvailability[]
  shiftPreferences: string[]
  maxShiftsPerWeek: number
}

export interface Shop {
  id: string
  name: string
  ownerId: string
  shifts: Shift[]
  createdAt: Date
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  maxEmployees: number
}

export interface ShiftAvailability {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  shifts: string[] // shift IDs
}

export interface ScheduleEntry {
  id: string
  shopId: string
  workerId: string
  shiftId: string
  date: string
  status: 'assigned' | 'confirmed' | 'cancelled'
}

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday', 
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

export type DayOfWeek = typeof DAYS_OF_WEEK[number]