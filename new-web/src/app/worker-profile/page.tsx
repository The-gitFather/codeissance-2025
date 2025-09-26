"use client";
import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, MapPin, Building2, CheckCircle, XCircle } from 'lucide-react';
import { doc, getDoc, query, collection, where, getDocs,updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust import path as needed
import { useUser } from '@/contexts/UserContext'
// Mock useUser hook - replace with your actual import


const WorkerProfile = () => {
  const { user, loading } = useUser();
  const [shopStatus, setShopStatus] = useState({ found: false, shopName: '', loading: true, shifts: [] });
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editableAvailability, setEditableAvailability] = useState([]);
  const [editableMaxShifts, setEditableMaxShifts] = useState(0);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    const checkShopStatus = async () => {
      if (!user || user.type !== 'worker' || !user.ownerId) {
        setShopStatus({ found: false, shopName: '', loading: false });
        return;
      }

      try {
        // Get the owner's shop document
        const shopDoc = await getDoc(doc(db, 'shops', user.ownerId));
        
        if (shopDoc.exists()) {
          const shopData = shopDoc.data();
          console.log('Shop Data:', shopData);
          setShopStatus({ 
            found: true, 
            shopName: shopData.name || 'Unknown Shop', 
            shifts: shopData.shifts || [],
            loading: false 
          });
        } else {
          setShopStatus({ found: false, shopName: '', loading: false });
        }
      } catch (error) {
        console.error('Error checking shop status:', error);
        setShopStatus({ found: false, shopName: '', loading: false });
      }
    };
    
    checkShopStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || user.type !== 'worker') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to workers.</p>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const sortedAvailability = user?.shiftAvailability?.sort((a, b) => 
    dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  ) || [];

  const startEditingSchedule = () => {
  const initialAvailability = dayOrder.map(day => {
    const existingDay = user?.shiftAvailability?.find(avail => avail.day === day);

    // Convert existing shifts to array or create new array of 0s
    const shifts = shopStatus.shifts.map((_, idx) => {
      if (existingDay?.shifts && Array.isArray(existingDay.shifts)) {
        return existingDay.shifts[idx] ?? 0; // keep existing, fallback to 0
      }
      return 0;
    });

    return { day, shifts };
  });

  setEditableAvailability(initialAvailability);
  setEditableMaxShifts(user?.maxShiftsPerWeek || 0);
  setIsEditingSchedule(true);
};




  const cancelEditingSchedule = () => {
    setIsEditingSchedule(false);
    // Reset to original values
    const initialAvailability = dayOrder.map(day => {
      const existingDay = user?.shiftAvailability?.find(avail => avail.day === day);
      return {
        day,
        shifts: existingDay?.shifts || []
      };
    });
    setEditableAvailability(initialAvailability);
    setEditableMaxShifts(user?.maxShiftsPerWeek || 0);
  };

  const toggleShiftForDay = (dayIndex, shiftIndex) => {
  setEditableAvailability(prev =>
    prev.map((dayAvailability, i) => {
      if (i !== dayIndex) return dayAvailability;

      const newShifts = [...dayAvailability.shifts];
      newShifts[shiftIndex] = newShifts[shiftIndex] === 1 ? 0 : 1;

      return { ...dayAvailability, shifts: newShifts };
    })
  );
};




  const saveSchedule = async () => {
  if (!user) return;
  setSavingSchedule(true);

  try {
    await updateDoc(doc(db, 'users', user.id), {
      shiftAvailability: editableAvailability, // now days × shift arrays
      maxShiftsPerWeek: editableMaxShifts
    });

    setIsEditingSchedule(false);
  } catch (error) {
    console.error('Error saving schedule:', error);
  } finally {
    setSavingSchedule(false);
  }
};



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                  Worker
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Shop Status</h2>
          </div>
          
          {shopStatus.loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Checking shop status...</span>
            </div>
          ) : shopStatus.found ? (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">Shop Found: {shopStatus.shopName}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 font-medium">Shop Not Found</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Preferences */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Work Preferences</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Max Shifts Per Week</label>
                <div className="mt-1 flex items-center space-x-2">
                  {isEditingSchedule ? (
                    <input
                      type="number"
                      min="0"
                      max="21"
                      value={editableMaxShifts}
                      onChange={(e) => setEditableMaxShifts(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {user.maxShiftsPerWeek || 0} shifts
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Preferred Shifts</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.shiftPreferences?.length > 0 ? (
                    user.shiftPreferences.map((shift, index) => (
                      <span 
                        key={index}
                        className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm font-medium capitalize"
                      >
                        {shift}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No preferences set</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MapPin className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Member Since</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-500 font-mono">
                  {user.id}
                </p>
              </div>
              
              {user.ownerId && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Assigned to Owner</label>
                  <p className="mt-1 text-sm text-gray-500 font-mono">
                    {user.ownerId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Availability Schedule */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Weekly Availability</h2>
            </div>
            
            {!isEditingSchedule ? (
              <button
                onClick={startEditingSchedule}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <span>Edit Schedule</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={cancelEditingSchedule}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <span>Cancel</span>
                </button>
                <button
                  onClick={saveSchedule}
                  disabled={savingSchedule}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <span>{savingSchedule ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>
          
          {shopStatus.found && shopStatus.shifts?.length > 0 ? (
            <div className="space-y-6">
              {/* Max Shifts Input */}
              {isEditingSchedule && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Shifts Per Week
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={shopStatus.shifts.length * 7}
                    value={editableMaxShifts}
                    onChange={(e) => setEditableMaxShifts(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="ml-2 text-sm text-gray-500">
                    shifts (max: {shopStatus.shifts.length * 7})
                  </span>
                </div>
              )}

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-2 min-w-[800px]">
                  {/* Header Row */}
                  <div className="p-3 font-semibold text-center border rounded-lg bg-gray-50">
                    Shifts / Days
                  </div>
                  {dayOrder.map((day) => (
                    <div key={day} className="p-3 text-center border rounded-lg bg-gray-50">
                      <div className="font-semibold capitalize">{day}</div>
                    </div>
                  ))}

                  {/* Shift Rows */}
                  {shopStatus.shifts.map((shift, shiftIdx) => (
  <React.Fragment key={shift.id}>
    {/* Shift Name */}
    <div className="p-3 border rounded-lg bg-blue-50 flex flex-col justify-center">
      <div className="font-semibold text-sm">{shift.name}</div>
      <div className="text-xs text-gray-500 flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        {shift.startTime} - {shift.endTime}
      </div>
    </div>

    {/* Days */}
    {dayOrder.map((day, dayIdx) => {
      const isAvailable = isEditingSchedule 
        ? editableAvailability[dayIdx]?.shifts[shiftIdx] === 1
        : sortedAvailability.find(avail => avail.day === day)?.shifts[shiftIdx] === 1;

      return (
        <div key={`${shift.id}-${day}`} className="p-3 border rounded-lg min-h-[80px] flex items-center justify-center">
          {isEditingSchedule ? (
            <label className="cursor-pointer flex items-center justify-center w-full h-full">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={() => toggleShiftForDay(dayIdx, shiftIdx)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              {isAvailable ? (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  Available
                </div>
              ) : (
                <div className="text-gray-400 text-xs">Not Available</div>
              )}
            </div>
          )}
        </div>
      );
    })}
  </React.Fragment>
))}

                </div>
              </div>

              {/* Summary */}
              {!isEditingSchedule && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sortedAvailability.reduce((total, day) => total + day.shifts.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Available Shifts</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {user.maxShiftsPerWeek || 0}
                    </div>
                    <div className="text-sm text-gray-600">Max Shifts Per Week</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {sortedAvailability.length}
                    </div>
                    <div className="text-sm text-gray-600">Available Days</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {shopStatus.loading 
                  ? 'Loading shop information...' 
                  : shopStatus.found 
                    ? 'No shifts available in your shop yet.'
                    : 'You are not assigned to any shop yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;