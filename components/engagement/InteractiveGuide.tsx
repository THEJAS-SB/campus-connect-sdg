"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottiePlayer } from "@dotlottie/react-player";
import "@dotlottie/react-player/dist/index.css";
import { useGuideBot } from "@/hooks/useOnboardingGuide";

export default function InteractiveGuide() {
  const {
    currentMessage,
    loading,
    isVisible,
    isTourMode,
    onStepPage,
    tourStep,
    totalTourSteps,
    hasNextMessage,
    dismiss,
    toggleBubble,
    nextMessage,
    skipTour,
    advanceTour,
  } = useGuideBot();

  const hasMessage = !!currentMessage;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ── Speech Bubble ── */}
      <AnimatePresence>
        {isVisible && currentMessage && (
          <motion.div
            key={`msg-${tourStep}-${currentMessage.ctaLink}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative w-72 sm:w-80 rounded-2xl border border-white/15 bg-linear-to-br from-[#1a1050]/95 to-[#0f1a4a]/95 p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-xl"
          >
            {/* Badge: Step indicator or AI label */}
            <span className="absolute left-4 top-3 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
              {currentMessage.stepLabel ?? "INNO AI"}
            </span>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>

            {/* Message body */}
            <p className="mt-5 text-sm leading-relaxed text-slate-200">
              {currentMessage.message}
            </p>

            {/* Tour progress bar */}
            {isTourMode && (
              <div className="mt-3 flex gap-1">
                {Array.from({ length: totalTourSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= tourStep ? "bg-blue-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Action row */}
            <div className="mt-4 flex gap-2">
              {isTourMode && onStepPage ? (
                /* User is ON the step page → show "Next Step" button */
                <button
                  onClick={advanceTour}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-linear-to-r from-green-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition hover:shadow-green-500/40 hover:-translate-y-0.5"
                >
                  Done → Next Step
                </button>
              ) : (
                <Link
                  href={currentMessage.ctaLink}
                  onClick={dismiss}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-linear-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:-translate-y-0.5"
                >
                  {currentMessage.ctaText}
                </Link>
              )}

              {/* "Next" for returning-user queue */}
              {hasNextMessage && (
                <button
                  onClick={nextMessage}
                  className="flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                >
                  Next →
                </button>
              )}
            </div>

            {/* Skip tour link */}
            {isTourMode && (
              <button
                onClick={skipTour}
                className="mt-2 w-full text-center text-xs text-slate-500 transition hover:text-slate-300"
              >
                Skip tour
              </button>
            )}

            {/* Tail triangle – points toward the character's head below */}
            <div className="absolute -bottom-2 right-12 h-4 w-4 rotate-45 border-b border-r border-white/15 bg-[#0f1a4a]/95" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lottie Avatar (always visible) ── */}
      {/* Outer motion wrapper handles scale/glow — canvas must never be transformed */}
      <motion.div
        whileHover={{
          scale: 1.08,
          filter: "drop-shadow(0 0 18px rgba(99,102,241,0.7))",
        }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="relative cursor-pointer"
        style={{ width: 112, height: 112 }}
      >
        {/* Glow ring pulse when a message is waiting */}
        {hasMessage && (
          <span className="pointer-events-none absolute inset-0 rounded-full guide-glow-ring ring-4 ring-blue-400/40" />
        )}

        {/* Clickable canvas area — fixed integer px size so ImageData never gets fractional dimensions */}
        <button
          onClick={toggleBubble}
          className="relative block focus:outline-none"
          style={{ width: 112, height: 112 }}
          aria-label="Toggle AI assistant"
        >
          <DotLottiePlayer
            key={isVisible ? "talking" : "idle"}
            src={
              isVisible
                ? "/animations/boy_talking.json"
                : "/animations/boy_idle.json"
            }
            autoplay
            loop
            style={{ width: 112, height: 112 }}
          />

          {/* Loading spinner overlay */}
          {loading && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            </span>
          )}

          {/* Notification dot when bubble is closed but a message is ready */}
          {hasMessage && !isVisible && (
            <span className="absolute right-1 top-2 z-10 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-blue-500" />
            </span>
          )}
        </button>
      </motion.div>
    </div>
  );
}
