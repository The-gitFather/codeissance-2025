"use client"
import { motion } from "framer-motion"
import { Lightbulb } from "lucide-react"

export function Suggestions() {
  const suggestions = [
    "Create a study schedule and stick to it",
    "Take regular breaks to improve focus and productivity",
    "Use active recall techniques to reinforce learning",
    "Join or form a study group for collaborative learning",
    "Practice mindfulness or meditation to reduce stress",
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-purple-400 to-pink-500 p-6 rounded-xl shadow-lg text-white"
    >
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Lightbulb className="mr-2" />
        Suggestions for Improvement
      </h2>
      <ul className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center"
          >
            <span className="bg-white text-purple-600 rounded-full w-6 h-6 flex items-center justify-center mr-2">
              {index + 1}
            </span>
            {suggestion}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

