"use client"
import { motion } from "framer-motion"
import { FlameIcon as Fire } from "lucide-react"

export function DailyStreak() {
  const streak = 7

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-xl shadow-lg text-white"
    >
      <h2 className="text-2xl font-semibold mb-4">Daily Streak</h2>
      <div className="flex items-center justify-center">
        <Fire size={48} className="mr-4" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="text-6xl font-bold"
        >
          {streak}
        </motion.div>
        <span className="ml-2 text-2xl">days</span>
      </div>
    </motion.div>
  )
}

