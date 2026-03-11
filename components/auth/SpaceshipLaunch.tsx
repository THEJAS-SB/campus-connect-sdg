'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface SpaceshipLaunchProps {
  isVisible: boolean
  onComplete: () => void
}

const SpaceshipLaunch: React.FC<SpaceshipLaunchProps> = ({
  isVisible,
  onComplete,
}) => {
  const router = useRouter()
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([])

  useEffect(() => {
    if (isVisible) {
      // Generate particles for thruster effect
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 60,
        delay: Math.random() * 0.3,
      }))
      setParticles(newParticles)

      // Navigate after animation completes (3 seconds for slower launch)
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, router])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Dark overlay with blur */}
          <motion.div
            className="absolute inset-0 bg-slate-950"
            animate={{ opacity: [0.3, 0.7, 0.9] }}
            transition={{ duration: 1.5 }}
          />

          {/* Blurred background layer */}
          <motion.div
            className="absolute inset-0 bg-slate-900"
            animate={{ 
              filter: ['blur(0px)', 'blur(10px)', 'blur(20px)'],
              opacity: [1, 0.8, 0.5],
            }}
            transition={{ duration: 1.5 }}
          />

          {/* Stars background */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: Math.random() * 2 + 1,
                  height: Math.random() * 2 + 1,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>

          {/* Main spaceship container */}
          <motion.div
            className="absolute left-1/2 bottom-0"
            style={{ x: '-50%' }}
            initial={{ y: '100vh' }}
            animate={{ y: '-150vh' }}
            transition={{
              duration: 3,
              ease: [0.16, 1, 0.3, 1], // Smooth ease out
            }}
          >
            {/* Glowing trail */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-full w-20 h-96"
              style={{ 
                background: 'linear-gradient(to top, rgba(139, 92, 246, 0.8), rgba(59, 130, 246, 0.4), transparent)',
                filter: 'blur(20px)',
              }}
              animate={{
                opacity: [0.8, 1, 0.8],
                scaleX: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
              }}
            />

            {/* Thruster flame */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-4"
              animate={{
                scaleY: [1, 1.3, 0.8, 1.2, 1],
                scaleX: [1, 1.2, 0.9, 1.1, 1],
                opacity: [1, 0.9, 1],
              }}
              transition={{
                duration: 0.15,
                repeat: Infinity,
              }}
            >
              {/* Outer glow */}
              <div 
                className="w-24 h-40 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.6), rgba(59, 130, 246, 0.8), rgba(6, 182, 212, 1))',
                  filter: 'blur(15px)',
                }}
              />
              
              {/* Inner core */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-0 w-12 h-24 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(34, 211, 238, 1), rgba(6, 182, 212, 0.8), rgba(139, 92, 246, 0.4))',
                  filter: 'blur(5px)',
                }}
              />
            </motion.div>

            {/* Thruster particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: '50%',
                  top: '100%',
                  background: particle.id % 3 === 0 ? '#22d3ee' : particle.id % 3 === 1 ? '#a855f7' : '#fb923c',
                  boxShadow: `0 0 10px ${
                    particle.id % 3 === 0 ? 'rgba(34, 211, 238, 0.8)' : 
                    particle.id % 3 === 1 ? 'rgba(168, 85, 247, 0.8)' : 'rgba(251, 146, 60, 0.8)'
                  }`,
                }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: particle.x * 3,
                  y: 200 + Math.random() * 150,
                  opacity: [1, 0.8, 0],
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.3,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Spaceship body */}
            <div className="relative w-16 h-24">
              {/* Main fuselage */}
              <div 
                className="absolute inset-0 rounded-t-full"
                style={{
                  background: 'linear-gradient(to right, #1e293b, #334155, #1e293b)',
                  boxShadow: 'inset 0 -5px 15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
                }}
              >
                {/* Cockpit window */}
                <div 
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #22d3ee, #0891b2)',
                    boxShadow: '0 0 15px rgba(34, 211, 238, 0.8), inset 0 -2px 5px rgba(0, 0, 0, 0.3)',
                  }}
                />
                
                {/* Body details */}
                <div 
                  className="absolute top-10 left-1/2 -translate-x-1/2 w-8 h-8"
                  style={{
                    background: 'linear-gradient(to right, transparent, rgba(139, 92, 246, 0.3), transparent)',
                  }}
                />
              </div>

              {/* Wings */}
              <div 
                className="absolute top-8 -left-6 w-6 h-10"
                style={{
                  background: 'linear-gradient(to right, #1e293b, #334155)',
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  boxShadow: '2px 0 10px rgba(139, 92, 246, 0.2)',
                }}
              />
              <div 
                className="absolute top-8 -right-6 w-6 h-10"
                style={{
                  background: 'linear-gradient(to left, #1e293b, #334155)',
                  clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                  boxShadow: '-2px 0 10px rgba(139, 92, 246, 0.2)',
                }}
              />

              {/* Engine glow */}
              <motion.div 
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.8), transparent)',
                  filter: 'blur(3px)',
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scaleX: [1, 1.3, 1],
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                }}
              />
            </div>
          </motion.div>

          {/* Launch text */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
            transition={{ duration: 1.5 }}
          >
            <h2 
              className="text-4xl font-bold text-center"
              style={{
                background: 'linear-gradient(135deg, #fff 0%, #22d3ee 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
              }}
            >
              LAUNCHING
            </h2>
            <p className="text-center text-slate-400 mt-2">Preparing your experience...</p>
          </motion.div>

          {/* Speed lines effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(transparent, transparent 50px, rgba(139, 92, 246, 0.03) 50px, rgba(139, 92, 246, 0.03) 51px)',
            }}
            animate={{
              y: [0, -1000],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SpaceshipLaunch

