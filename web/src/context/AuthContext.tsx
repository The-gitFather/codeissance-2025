'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import type { Worker, Owner } from '@/lib/types';


// Goal type to represent the structured goal data
export interface Goal {
    title: string;
    roadmap: string[];
}

// Separate interface for the additional user data we store in Firestore


export type UserType = 'owner' | 'worker';

interface UserData {
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    onboardingCompleted: boolean;
    onboardingAnswers: string[];
    goals: Goal[];
    userType: UserType;
    // Optionally, store worker/owner data for denormalization
    workerData?: Worker;
    ownerData?: Owner;
}

// Extended user type that combines Firebase User with our additional data
interface ExtendedUser extends User {
    onboardingCompleted: boolean;
    onboardingAnswers: string[];
    goals: Goal[];
    userType: UserType;
    workerData?: Worker;
    ownerData?: Owner;
}

interface AuthContextType {
    user: ExtendedUser | null;
    loading: boolean;
    signUp: (email: string, password: string, name: string, userType: UserType) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: (userType: UserType) => Promise<void>;
    logout: () => Promise<void>;
    updateOnboardingAnswers: (answers: string[]) => Promise<void>;
    updateUserGoals: (goals: Goal[]) => Promise<void>;
    completeOnboarding: () => Promise<void>;
    uploadProfileImage: (file: File) => Promise<string>;
    updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<ExtendedUser | null>(null);
    const [loading, setLoading] = useState(true);


    // No steps, so default onboardingAnswers to empty array
    const getDefaultOnboardingAnswers = (): string[] => [];

    const createOrUpdateUserDocument = async (firebaseUser: User, userType?: UserType): Promise<ExtendedUser> => {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        // Default to 'worker' if not provided
        const type: UserType = userType || (userSnap.exists() && (userSnap.data() as UserData).userType) || 'worker';

        // Optionally, create worker/owner data for new users
        let workerData: Worker | undefined = undefined;
        let ownerData: Owner | undefined = undefined;
        if (!userSnap.exists()) {
            if (type === 'worker') {
                workerData = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || '',
                    shopId: '',
                    type: 'full-time',
                    skills: [],
                    wageRate: 0,
                    workType: '',
                    attendance: [],
                };
            } else if (type === 'owner') {
                ownerData = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || '',
                    shopIds: [],
                };
            }
        }


        // Only include workerData/ownerData if defined (avoid undefined fields for Firestore)
        const defaultData: UserData = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            onboardingCompleted: false,
            onboardingAnswers: getDefaultOnboardingAnswers(),
            goals: [],
            userType: type,
            ...(workerData ? { workerData } : {}),
            ...(ownerData ? { ownerData } : {}),
        };

        if (!userSnap.exists()) {
            await setDoc(userRef, defaultData);
        } else if (userType && (userSnap.data() as UserData).userType !== userType) {
            await updateDoc(userRef, { userType });
        }

        const userData = userSnap.exists() ? { ...defaultData, ...userSnap.data() } as UserData : defaultData;

        const normalizedGoals = Array.isArray(userData.goals) ?
            userData.goals.map(goal => {
                if (typeof goal === 'string') {
                    return { title: goal, roadmap: [] };
                }
                return goal;
            }) : [];

        return {
            ...firebaseUser,
            onboardingCompleted: userData.onboardingCompleted,
            onboardingAnswers: userData.onboardingAnswers,
            goals: normalizedGoals,
            userType: userData.userType,
            workerData: userData.workerData,
            ownerData: userData.ownerData,
        } as ExtendedUser;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const extendedUser = await createOrUpdateUserDocument(firebaseUser);
                setUser(extendedUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const uploadProfileImage = async (file: File): Promise<string> => {
        if (!user) throw new Error('No user logged in');

        // Create a reference to the file in Firebase Storage
        const fileRef = ref(storage, `profile-images/${user.uid}/${Date.now()}-${file.name}`);

        // Upload the file
        await uploadBytes(fileRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(fileRef);

        // Update user profile with new photo URL
        await updateUserProfile({ photoURL: downloadURL });

        return downloadURL;
    };

    const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
        if (!user) throw new Error('No user logged in');

        // Update Firebase Auth profile
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No authenticated user found');

        await updateProfile(currentUser, data);

        // Update Firestore document
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, data);

        // Get the updated user data and set it in state
        const updatedUser = await createOrUpdateUserDocument(currentUser);
        setUser(updatedUser);
    };

    const signInWithGoogle = async (userType: UserType) => {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const extendedUser = await createOrUpdateUserDocument(userCredential.user, userType);
            setUser(extendedUser);
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string, name: string, userType: UserType) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    await updateProfile(currentUser, {
                        displayName: name
                    });
                }
                const extendedUser = await createOrUpdateUserDocument(userCredential.user, userType);
                setUser(extendedUser);
            }
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    };

    const updateOnboardingAnswers = async (answers: string[]) => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            onboardingAnswers: answers
        });

        // Get the current Firebase user and create an updated extended user
        const currentUser = auth.currentUser;
        if (currentUser) {
            const updatedUser = await createOrUpdateUserDocument(currentUser);
            setUser(updatedUser);
        }
    };

    const updateUserGoals = async (goals: Goal[]) => {
        if (!user) return;

        console.log("Storing goals in Firebase:", goals);

        // Ensure goals are properly formatted before storing
        const formattedGoals = goals.map(goal => ({
            title: goal.title,
            roadmap: goal.roadmap || []
        }));

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            goals: formattedGoals
        });

        // Get the current Firebase user and create an updated extended user
        const currentUser = auth.currentUser;
        if (currentUser) {
            const updatedUser = await createOrUpdateUserDocument(currentUser);
            setUser(updatedUser);
        }
    };

    const completeOnboarding = async () => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            onboardingCompleted: true
        });

        // Get the current Firebase user and create an updated extended user
        const currentUser = auth.currentUser;
        if (currentUser) {
            const updatedUser = await createOrUpdateUserDocument(currentUser);
            setUser(updatedUser);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        updateOnboardingAnswers,
        updateUserGoals,
        completeOnboarding,
        uploadProfileImage,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}