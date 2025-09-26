"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User,
  Calendar,
  Trophy,
  Award,
  Book,
  Activity,
  GitBranch,
  Zap,
  Code,
  Users,
  Puzzle
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function UserProfile() {
  // This data would typically come from a backend or state management system
  const user = {
    name: "John Doe",
    username: "@johndoe",
    email: "john.doe@example.com",
    school: "Springfield High School",
    avatarUrl: null, // Replace with actual avatar URL
    streak: 16,
    level: 7,
    xp: 2850,
    nextLevelXp: 3500,
    badges: [
      { id: 1, name: "Coding Novice", icon: <Code size={16} />, color: "text-indigo-600", bg: "bg-indigo-100" },
      { id: 2, name: "Team Player", icon: <Users size={16} />, color: "text-emerald-600", bg: "bg-emerald-100" },
      { id: 3, name: "Problem Solver", icon: <Puzzle size={16} />, color: "text-amber-600", bg: "bg-amber-100" },
    ],
    stats: [
      { label: "Projects", value: 12, icon: <GitBranch size={20} />, color: "text-indigo-600", bg: "bg-indigo-50" },
      { label: "Challenges", value: 24, icon: <Trophy size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
      { label: "Courses", value: 8, icon: <Book size={20} />, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Activity", value: "High", icon: <Activity size={20} />, color: "text-rose-600", bg: "bg-rose-50" },
    ]
  }

  // Calculate XP percentage for progress bar
  const xpPercentage = Math.round((user.xp / user.nextLevelXp) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-lg w-full mb-5"
    >
      {/* Top section with profile and streaks */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full bg-white border shadow-sm overflow-hidden flex items-center justify-center mr-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-gray-500">{user.username}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                {user.school}
              </span>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                Level {user.level}
              </span>
            </div>
          </div>
        </div>
        <motion.div
          className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-3 py-2 rounded-full font-medium"
          whileHover={{ scale: 1.05 }}
        >
          <Zap size={16} className="text-amber-500" />
          <span className="text-base font-bold">{user.streak}</span>
          <span className="text-sm">day streak</span>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-600">XP Progress</span>
          <span className="text-xs font-medium text-indigo-600">{user.xp} / {user.nextLevelXp} XP</span>
        </div>
        <Progress value={xpPercentage} className="h-2 bg-gray-100">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
        </Progress>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {user.stats.map((stat, index) => (
          <motion.div
            key={index}
            className={`${stat.bg} p-3 rounded-lg border border-gray-100`}
            whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <div className={`${stat.color} mb-1`}>
              {stat.icon}
            </div>
            <div className="text-xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-gray-500 text-xs">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Badges
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Award size={16} className="mr-2 text-indigo-500" /> 
          Badges
        </h3>
        <div className="flex space-x-4">
          {user.badges.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full ${badge.bg} flex items-center justify-center mb-1`}>
                <span className={badge.color}>{badge.icon}</span>
              </div>
              <span className="text-gray-600 text-xs text-center">{badge.name}</span>
            </div>
          ))}
        </div>
      </div> */}
    </motion.div>
  )
}