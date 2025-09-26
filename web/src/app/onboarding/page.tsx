'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserType } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const OnboardingPage = () => {
    const [selectedType, setSelectedType] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(false);
    const { user, updateUserProfile } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType || !user) return;
        setLoading(true);
        try {
            // Update userType in Firestore
            await updateUserProfile({ userType: selectedType });
            router.push('/dashboard');
        } catch (err) {
            // handle error (optional: show toast)
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Select your user type</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-64">
                <Button
                    type="button"
                    variant={selectedType === 'owner' ? 'default' : 'outline'}
                    onClick={() => setSelectedType('owner')}
                >
                    Owner
                </Button>
                <Button
                    type="button"
                    variant={selectedType === 'worker' ? 'default' : 'outline'}
                    onClick={() => setSelectedType('worker')}
                >
                    Worker
                </Button>
                <Button type="submit" disabled={!selectedType || loading} className="mt-4">
                    Continue
                </Button>
            </form>
        </div>
    );
};

export default OnboardingPage;