"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signUp } from "@/app/actions/auth";
import {
  SpaceBackground,
  GlowingCard,
  EnhancedButton,
} from "@/components/auth";
import FormField from "@/components/auth/EnhancedFormFields";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

const ROLES = [
  {
    value: "student",
    label: "Student",
    description: "Build startups, earn XP, find mentors",
    icon: "🎓",
  },
  {
    value: "mentor",
    label: "Mentor",
    description: "Guide the next generation of founders",
    icon: "🧑‍🏫",
  },
  {
    value: "investor",
    label: "Investor",
    description: "Discover vetted campus startups",
    icon: "💼",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage and analyse the ecosystem",
    icon: "🏛️",
  },
];

export default function SignUpPage({ searchParams }: PageProps) {
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    const getError = async () => {
      const params = await searchParams;
      if (params.error) {
        setError(decodeURIComponent(params.error));
      }
    };
    getError();
  }, [searchParams]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

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

            <motion.h2
              variants={itemVariants}
              className="mb-6 text-xl font-semibold text-white"
            >
              Create your account
            </motion.h2>

            {error && (
              <motion.div
                variants={itemVariants}
                className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <form action={signUp} className="space-y-4">
              <motion.div variants={itemVariants}>
                <FormField
                  id="full_name"
                  name="full_name"
                  type="text"
                  label="Full Name"
                  placeholder="Your full name"
                  required
                />
              </motion.div>

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
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  I am a…
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => (
                    <label
                      key={role.value}
                      className="relative flex cursor-pointer flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:border-purple-500/50 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-500/10"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        defaultChecked={role.value === "student"}
                        className="absolute opacity-0"
                      />
                      <span className="text-lg">{role.icon}</span>
                      <span className="text-sm font-semibold text-white">
                        {role.label}
                      </span>
                      <span className="text-xs text-slate-400 leading-tight">
                        {role.description}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <EnhancedButton>Create Account</EnhancedButton>
              </motion.div>
            </form>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-center text-sm text-slate-400"
            >
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-purple-400 hover:text-purple-300 transition"
              >
                Sign in
              </Link>
            </motion.p>
          </GlowingCard>
        </motion.div>
      </div>
    </>
  );
}
