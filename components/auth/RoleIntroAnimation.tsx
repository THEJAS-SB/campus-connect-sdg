'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface RoleConfig {
  value: string
  label: string
  message: string
  color: string
}

interface RoleIntroAnimationProps {
  isVisible: boolean
  role: string | null
  onComplete: () => void
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  student: {
    value: 'student',
    label: 'Student',
    message: 'Welcome Student',
    color: 'from-blue-500 to-cyan-400',
  },
  mentor: {
    value: 'mentor',
    label: 'Mentor',
    message: 'Welcome Mentor',
    color: 'from-purple-500 to-pink-400',
  },
  investor: {
    value: 'investor',
    label: 'Investor',
    message: 'Welcome Investor',
    color: 'from-amber-500 to-yellow-400',
  },
  admin: {
    value: 'admin',
    label: 'Admin',
    message: 'Welcome Admin',
    color: 'from-red-500 to-orange-400',
  },
}

const RoleIntroAnimation: React.FC<RoleIntroAnimationProps> = ({
  isVisible,
  role,
  onComplete,
}) => {
  const [showMessage, setShowMessage] = useState(false)
  const [textIndex, setTextIndex] = useState(0)
  
  const config = role ? ROLE_CONFIGS[role] : null

  useEffect(() => {
    if (isVisible && config) {
      setShowMessage(false)
      setTextIndex(0)

      const messageTimer = setTimeout(() => {
        setShowMessage(true)
      }, 800)

      const typewriterInterval = setInterval(() => {
        setTextIndex((prev) => {
          if (prev >= config.message.length) {
            clearInterval(typewriterInterval)
            return config.message.length
          }
          return prev + 1
        })
      }, 80)

      const completeTimer = setTimeout(() => {
        onComplete()
      }, 2800)

      return () => {
        clearTimeout(messageTimer)
        clearTimeout(completeTimer)
        clearInterval(typewriterInterval)
      }
    }
  }, [isVisible, role, config, onComplete])

  return (
    <AnimatePresence>
      {isVisible && config && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-slate-950/95" />
          <SpaceParticles />

          <div className="relative flex flex-col items-center">
            <motion.div
              className="relative"
              initial={{ scale: 0, y: 200, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, y: -200, opacity: 0, rotate: 20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, mass: 1 }}
            >
              <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color}`}
                style={{ filter: 'blur(40px)', transform: 'scale(1.5)', opacity: 0.6 }}
                animate={{ scale: [1.5, 1.7, 1.5], opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative w-64 h-64 rounded-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-white/20 shadow-2xl">
                <DotLottieReact
                  src="/animations/avatar_excited.json"
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: i % 2 === 0 ? '#a855f7' : '#22d3ee',
                    boxShadow: `0 0 10px ${i % 2 === 0 ? 'rgba(168, 85, 247, 0.8)' : 'rgba(34, 211, 238, 0.8)'}`,
                  }}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos((i * 30 * Math.PI) / 180) * 180,
                    y: Math.sin((i * 30 * Math.PI) / 180) * 180,
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                />
              ))}
            </motion.div>

            <AnimatePresence>
              {showMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8"
                >
                  <div className="relative px-8 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/10 border-l border-t border-white/20 rotate-45" />
                    <h2
                      className="text-4xl font-bold text-white text-center"
                      style={{
                        background: `linear-gradient(135deg, #fff 0%, ${config.color.split(' ')[1].replace('to-', '')} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {config.message.slice(0, textIndex)}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block w-1 h-8 ml-1 bg-cyan-400"
                      />
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className="absolute inset-0 bg-purple-600/20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.5, delay: 2 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const SpaceParticles: React.FC = () => {
  const particles = React.useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }))
  }, [])

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            boxShadow: `0 0 ${particle.size * 2}px rgba(255, 255, 255, 0.8)`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  )
}

export default RoleIntroAnimation

