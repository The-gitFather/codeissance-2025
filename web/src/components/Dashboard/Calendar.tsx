import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SimpleCalendar = ({ schedule = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthEvents, setMonthEvents] = useState([]);
  const [dailyEvents, setDailyEvents] = useState([]);

  // Format date to YYYY-MM-DD for comparison (fixes timezone issues)
  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Group events by date
  const groupEventsByDate = (events) => {
    const grouped = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.start);
      const dateKey = formatDateKey(eventDate);
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(event);
    });
    
    return grouped;
  };

  // Get day events
  useEffect(() => {
    console.log("Schedule updated in Calendar:", schedule);
    console.log("Selected date:", selectedDate, formatDateKey(selectedDate));
    
    if (schedule && Array.isArray(schedule)) {
      // Get events for the selected date
      const dateKey = formatDateKey(selectedDate);
      const grouped = groupEventsByDate(schedule);
      console.log("Grouped events:", grouped);
      console.log("Looking for events on:", dateKey);
      setDailyEvents(grouped[dateKey] || []);
      
      // Get all events for the month to mark days with events
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const thisMonthEvents = schedule.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= firstDay && eventDate <= lastDay;
      });
      
      console.log("Events for current month:", thisMonthEvents);
      setMonthEvents(thisMonthEvents);
    }
  }, [schedule, selectedDate, currentMonth]);

  // Generate days for the calendar
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    // Create an array for all days in the month
    const calendarDays = [];
    
    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add actual days of the month
    const groupedEvents = groupEventsByDate(monthEvents);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const hasEvents = !!groupedEvents[dateKey];
      const isToday = formatDateKey(new Date()) === dateKey;
      const isSelected = formatDateKey(selectedDate) === dateKey;
      
      calendarDays.push({
        day,
        date,
        hasEvents,
        isToday,
        isSelected
      });
    }
    
    return calendarDays;
  };

  // Format time from date string
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Set to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Set initial month to March 2024 for the sample data
  useEffect(() => {
    // Check if data is for March 2024
    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      const firstEventDate = new Date(schedule[0].start);
      if (firstEventDate.getMonth() === 2 && firstEventDate.getFullYear() === 2024) {
        setCurrentMonth(new Date(2024, 2, 1)); // March 2024
        setSelectedDate(new Date(2024, 2, 26)); // March 26, 2024 (first event)
      }
    }
  }, [schedule]);

  return (
    <Card className="w-full shadow-md max-h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <div className="flex space-x-2">
            <button 
              onClick={goToPreviousMonth}
              className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              ←
            </button>
            <button 
              onClick={goToCurrentMonth}
              className="px-3 py-1 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
            >
              Today
            </button>
            <button 
              onClick={goToNextMonth}
              className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {/* Calendar Grid */}
        <div className="mb-4">
          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((day, index) => (
              <div key={index} className="text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((dayObj, index) => (
              <div key={index} className="aspect-square">
                {dayObj ? (
                  <button
                    onClick={() => setSelectedDate(dayObj.date)}
                    className={`w-full h-full flex flex-col items-center justify-center rounded-md transition-all ${
                      dayObj.isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : dayObj.isToday
                          ? 'bg-indigo-100'
                          : dayObj.hasEvents
                            ? 'bg-gray-100 hover:bg-gray-200'
                            : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{dayObj.day}</span>
                    {dayObj.hasEvents && !dayObj.isSelected && (
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1"></div>
                    )}
                  </button>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Events for selected day */}
        <div className="mt-4">
          <h3 className="font-medium mb-2">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          
          {dailyEvents.length > 0 ? (
            <div className="space-y-2">
              {dailyEvents
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .map(event => (
                  <div 
                    key={event.id} 
                    className="p-2 rounded-md border-l-4"
                    style={{ borderLeftColor: event.color }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{event.title}</div>
                      <Badge 
                        className="text-white text-xs"
                        style={{ backgroundColor: event.color }}
                      >
                        {event.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                    {event.description && (
                      <div className="text-sm mt-1 text-gray-700">{event.description}</div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No events scheduled for this day</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleCalendar;