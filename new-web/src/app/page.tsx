'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pacifico } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Calendar, Users, Clock, Sparkles, TrendingUp, Shield, X } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
})

// Background gradient animation component
function BackgroundGradientAnimation({ children }) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.1),transparent_50%)]" />
      </div>
      {children}
    </div>
  )
}

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'from-gray-200/[0.3]',
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            gradient,
            'backdrop-blur-[2px] border-2 border-gray-200/[0.3]',
            'shadow-[0_8px_32px_0_rgba(31,41,55,0.1)]',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-[radial-gradient(circle_at_50%_50%,rgba(31,41,55,0.2),transparent_70%)]'
          )}
        />
      </motion.div>
    </motion.div>
  )
}

// Auth Modal Component
function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-4">
                <Calendar className="text-blue-600 w-5 h-5" />
                <span className="text-lg text-blue-700 tracking-wide font-medium">योजना</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600">Join योजना and optimize your workforce planning</p>
            </div>
            <AuthForm />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function HeroSection({ onGetStarted }) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/[0.2] via-transparent to-pink-100/[0.2] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-blue-200/[0.3]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-purple-200/[0.3]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-pink-200/[0.3]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-yellow-200/[0.3]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-green-200/[0.3]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.7] border border-gray-200 mb-8 md:mb-12 shadow-sm"
          >
            <Calendar className="text-blue-600 w-5 h-5" />
            <span className="text-lg text-gray-700 tracking-wide font-medium">योजना</span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
                AI-Powered
              </span>
              <br />
              <span
                className={cn(
                  'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500',
                  pacifico.className
                )}
              >
                Workforce Planner
              </span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed font-light tracking-wide max-w-2xl mx-auto px-4">
              Effortlessly manage shift schedules for your small shop with intelligent AI that optimizes staffing based on demand, without any technical complexity.
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started Free
            </button>
            <button className="px-8 py-4 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300">
              See How It Works
            </button>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            {/* <div className="bg-white/[0.7] backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Smart Scheduling</h3>
              <p className="text-sm text-gray-600">AI analyzes demand patterns to create optimal staff schedules automatically</p>
            </div>
            <div className="bg-white/[0.7] backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Time Saving</h3>
              <p className="text-sm text-gray-600">Reduce scheduling time from hours to minutes with automated planning</p>
            </div>
            <div className="bg-white/[0.7] backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <TrendingUp className="w-8 h-8 text-pink-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Cost Optimization</h3>
              <p className="text-sm text-gray-600">Match staffing levels to actual demand and reduce labor costs</p>
            </div> */}
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/20 via-transparent to-gray-50/60 pointer-events-none" />
    </div>
  )
}

export default function HomePage() {
  const { user, loading } = useUser()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (user.type === 'owner') {
        redirect('/dashboard')
      } else {
        redirect('/worker-dashboard')
      }
    }
  }, [user, loading])

  const handleGetStarted = () => {
    setShowAuthModal(true)
  }

  const handleCloseModal = () => {
    setShowAuthModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-600 absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <BackgroundGradientAnimation>
          <HeroSection onGetStarted={handleGetStarted} />
        </BackgroundGradientAnimation>
        <AuthModal isOpen={showAuthModal} onClose={handleCloseModal} />
      </>
    )
  }

  return null
}