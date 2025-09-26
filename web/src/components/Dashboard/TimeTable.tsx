"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, X, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]

export function TimeTable() {
  // Initial schedule data
  const initialSchedule = {
    Monday: { "9:00 AM": "Math", "11:00 AM": "History", "2:00 PM": "Physics" },
    Tuesday: { "10:00 AM": "English", "1:00 PM": "Chemistry", "3:00 PM": "Art" },
    Wednesday: { "9:00 AM": "Biology", "11:00 AM": "Computer Science", "2:00 PM": "Physical Education" },
    Thursday: { "10:00 AM": "Literature", "1:00 PM": "Geography", "3:00 PM": "Music" },
    Friday: { "9:00 AM": "Economics", "11:00 AM": "Foreign Language", "2:00 PM": "Study Hall" },
  }

  const [schedule, setSchedule] = useState(initialSchedule)
  const [editMode, setEditMode] = useState({ day: null, time: null })
  const [editValue, setEditValue] = useState("")
  const [newSubject, setNewSubject] = useState("")

  // Function to add or update a schedule item
  const handleAddUpdate = (day, time, value) => {
    if (!value.trim()) {
      // If value is empty, remove the item
      handleDelete(day, time)
      return
    }

    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: value
      }
    }))
    
    setEditMode({ day: null, time: null })
    setEditValue("")
  }

  // Function to delete a schedule item
  const handleDelete = (day, time) => {
    setSchedule(prev => {
      const updatedDay = { ...prev[day] }
      delete updatedDay[time]
      return {
        ...prev,
        [day]: updatedDay
      }
    })
  }

  // Function to start editing a cell
  const startEdit = (day, time, value) => {
    setEditMode({ day, time })
    setEditValue(value || "")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-lg overflow-auto max-h-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-indigo-700">Weekly Time Table</h2>
        <div className="flex">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSchedule(initialSchedule)}
            className="mr-2 text-xs"
          >
            Reset
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSchedule(weekdays.reduce((acc, day) => ({ ...acc, [day]: {} }), {}))}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2 bg-indigo-100 text-indigo-800 sticky left-0 z-10">Time</th>
              {weekdays.map((day) => (
                <th key={day} className="px-4 py-2 bg-indigo-100 text-indigo-800">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td className="border px-4 py-2 font-medium text-indigo-700 bg-white sticky left-0">{time}</td>
                {weekdays.map((day) => (
                  <td key={`${day}-${time}`} className="border px-4 py-2 min-w-32 h-16 relative">
                    {editMode.day === day && editMode.time === time ? (
                      <div className="flex items-center space-x-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm p-1 h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddUpdate(day, time, editValue)
                            } else if (e.key === 'Escape') {
                              setEditMode({ day: null, time: null })
                            }
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6" 
                          onClick={() => handleAddUpdate(day, time, editValue)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6" 
                          onClick={() => setEditMode({ day: null, time: null })}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : schedule[day]?.[time] ? (
                      <div className="flex items-center justify-between group">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-lg">
                          {schedule[day][time]}
                        </span>
                        <div className="hidden group-hover:flex items-center space-x-1 absolute right-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6" 
                            onClick={() => startEdit(day, time, schedule[day][time])}
                          >
                            <Edit2 className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6" 
                            onClick={() => handleDelete(day, time)}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full opacity-0 hover:opacity-100">
                            <Plus className="h-4 w-4 text-gray-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2">
                          <div className="flex items-center space-x-1">
                            <Input
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                              placeholder="Add subject"
                              className="text-sm h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newSubject.trim()) {
                                  handleAddUpdate(day, time, newSubject)
                                  setNewSubject("")
                                }
                              }}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => {
                                if (newSubject.trim()) {
                                  handleAddUpdate(day, time, newSubject)
                                  setNewSubject("")
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}