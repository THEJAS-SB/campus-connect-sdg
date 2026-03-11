'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { signIn } from '@/app/actions/auth'
import { SpaceBackground, GlowingCard, EnhancedButton, SpaceshipLaunch } from '@/components/auth'
import FormField from '@/components/auth/EnhancedFormFields'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default function SignInPage({ searchParams }: PageProps) {
  const [error, setError] = React.useState<string>('')
  const [showLaunchAnimation, setShowLaunchAnimation] = useState<boolean>(false)

  React.useEffect(() => {
    const getError = async () => {
      const params = await searchParams
      if (params.error) {
        setError(decodeURIComponent(params.error))
      }
    }
    getError()
  }, [searchParams])

  const handleSignInClick = () => {
    setShowLaunchAnimation(true)
  }

  const handleLaunchComplete = () => {
    setShowLaunchAnimation(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <>
      <SpaceBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <GlowingCard>
            <motion.div variants={itemVariants} className="mb-8 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                INNOVEX
              </h1>
              <motion.p className="mt-2 text-sm text-slate-400">
                Campus Innovation OS
              </motion.p>
            </motion.div>

            <motion.h2 variants={itemVariants} className="mb-6 text-xl font-semibold text-white">
              Welcome back
            </motion.h2>

            {error && (
              <motion.div
                variants={itemVariants}
                className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <form action={signIn} className="space-y-4">
              <motion.div variants={itemVariants}>
                <FormField
                  id="email"
                  name="email"
                  type="email"
                  label="Institutional Email"
                  placeholder="you@university.edu"
                  required
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  required
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <EnhancedButton onClick={handleSignInClick}>Sign In</EnhancedButton>
              </motion.div>
            </form>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-center text-sm text-slate-400"
            >
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="font-medium text-purple-400 hover:text-purple-300 transition">
                Sign up
              </Link>
            </motion.p>
          </GlowingCard>
        </motion.div>
      </div>

      <SpaceshipLaunch
        isVisible={showLaunchAnimation}
        onComplete={handleLaunchComplete}
      />
    </>
  )
}

