import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export async function POST(request: Request) {
  try {
    const { email, day, shift } = await request.json();
    console.log({ email, day, shift });

    if (!email || !day || !shift) {
      return Response.json(
        { error: 'Missing required body parameters', required: 'email, day, shift' },
        { status: 400 }
      );
    }

    const dayLower = day.toLowerCase();
    if (!VALID_DAYS.includes(dayLower)) {
      return Response.json(
        { error: 'Invalid day name', validDays: VALID_DAYS, received: dayLower },
        { status: 400 }
      );
    }

    // ✅ Query users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const usersSnapshot = await getDocs(q);

    if (usersSnapshot.empty) {
      return Response.json({ error: 'User not found', email }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (userData.type !== 'worker') {
      return Response.json(
        { error: 'Only workers can modify shift availability', userType: userData.type },
        { status: 403 }
      );
    }

    if (!userData.ownerId) {
      return Response.json(
        { error: 'Worker is not assigned to any owner/shop' },
        { status: 400 }
      );
    }

    // ✅ Get shop doc
    const shopRef = doc(db, 'shops', userData.ownerId);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      return Response.json(
        { error: 'Associated shop not found', ownerId: userData.ownerId },
        { status: 404 }
      );
    }

    const shopData = shopSnap.data();
    const shopShifts = shopData.shifts || [];

    const shiftIndex = shopShifts.findIndex(s => s.name.toLowerCase() === shift.toLowerCase());
    if (shiftIndex === -1) {
      return Response.json(
        { error: 'Shift not found in shop', availableShifts: shopShifts.map(s => s.name), requested: shift },
        { status: 400 }
      );
    }

    const shiftAvailability = userData.shiftAvailability || [];

    const completeAvailability = VALID_DAYS.map(dayName => {
      const existingDay = shiftAvailability.find(d => d.day === dayName);
      if (existingDay && Array.isArray(existingDay.shifts)) {
        const shifts = [...existingDay.shifts];
        while (shifts.length < shopShifts.length) shifts.push(0);
        return { day: dayName, shifts: shifts.slice(0, shopShifts.length) };
      }
      return { day: dayName, shifts: new Array(shopShifts.length).fill(0) };
    });

    const dayIndex = VALID_DAYS.indexOf(dayLower);
    const targetDay = completeAvailability[dayIndex];
    const currentValue = targetDay.shifts[shiftIndex];
    const newValue = currentValue === 1 ? 0 : 1;
    targetDay.shifts[shiftIndex] = newValue;

    // ✅ Update user
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { shiftAvailability: completeAvailability });

    return Response.json({
      success: true,
      message: `Toggled ${shift} shift availability for ${dayLower}`,
      user: { email: userData.email, name: userData.name, id: userId },
      availability: {
        previous: currentValue,
        current: newValue,
        status: newValue === 1 ? 'available' : 'unavailable'
      },
      updatedAvailability: completeAvailability
    });
  } catch (error: any) {
    console.error('Error toggling shift availability:', error);
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
