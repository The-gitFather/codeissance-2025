import React from 'react';
import { Mail, User, School } from 'lucide-react';
import Image from 'next/image';

const ProfileCard = ({ user }: any) => {
    const formatDate = (timestamp) => {
        const date = new Date(parseInt(timestamp));
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateAccountAge = () => {
        const createdDate = new Date(parseInt(user.metadata.createdAt));
        const now = new Date();
        const diffTime = Math.abs(now - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 30) return `${diffDays} days`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
        return `${Math.floor(diffDays / 365)} years`;
    };

    return (
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-200 to-indigo-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Profile Image */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto md:mx-0">
                    <Image
                        src={user.photoURL || '/default-profile.png'}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                    />
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl font-semibold text-indigo-900 capitalize">{user.displayName}</h1>
                    <div className="text-indigo-700 mt-1 flex items-center justify-center md:justify-start">
                        <Mail size={16} className="mr-2" />
                        <span>{user.email}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                        {user.onboardingAnswers.slice(0, 2).map((answer, idx) => (
                            <span key={idx} className="bg-indigo-200 text-indigo-800 text-xs font-medium px-3 py-1 rounded-full">
                                {answer}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex justify-center md:justify-end gap-6 text-center">
                    <div>
                        <div className="text-xl font-semibold text-indigo-900">{user.goals.length}</div>
                        <div className="text-sm text-indigo-600">Goals</div>
                    </div>
                    <div>
                        <div className="text-xl font-semibold text-indigo-900">
                            {user.goals.reduce((total, goal) => total + goal.roadmap.length, 0)}
                        </div>
                        <div className="text-sm text-indigo-600">Checkpoints</div>
                    </div>
                    <div>
                        <div className="text-xl font-semibold text-indigo-900">{calculateAccountAge()}</div>
                        <div className="text-sm text-indigo-600">Member</div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <hr className="my-6 border-indigo-200" />

            {/* Combined Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-indigo-800">
                <div>
                    <h3 className="font-semibold flex items-center mb-3">
                        <User size={18} className="mr-2 text-indigo-600" />
                        Account Details
                    </h3>
                    <div className="space-y-2">
                        <p><span className="text-indigo-500">Member Since:</span> {formatDate(user.metadata.createdAt)}</p>
                        <p><span className="text-indigo-500">Last Login:</span> {formatDate(user.metadata.lastLoginAt)}</p>
                        <p>
                            <span className="text-indigo-500">Email Status:</span>{' '}
                            <span className={`${user.emailVerified ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                {user.emailVerified ? 'Verified' : 'Not Verified'}
                            </span>
                        </p>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold flex items-center mb-3">
                        <School size={18} className="mr-2 text-indigo-600" />
                        Learning Preferences
                    </h3>
                    <div className="space-y-2">
                        <p><span className="text-indigo-500">Education:</span> {user.onboardingAnswers[0]}</p>
                        <p><span className="text-indigo-500">Interest:</span> {user.onboardingAnswers[1]}</p>
                        <p><span className="text-indigo-500">Format:</span> {user.onboardingAnswers[2]}</p>
                        <p><span className="text-indigo-500">Goal:</span> {user.onboardingAnswers[3]}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
