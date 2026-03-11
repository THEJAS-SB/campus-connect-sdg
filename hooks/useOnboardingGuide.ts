"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  fetchGuideContext,
  type GuideContext,
} from "@/app/actions/generate-assistant-greeting";

/* ── Storage key helpers (namespaced per user) ── */
function tourCompletedKey(uid: string) {
  return `innovex-tour-completed-${uid}`;
}
function tourStepKey(uid: string) {
  return `innovex-tour-step-${uid}`;
}
function sessionGreetedKey(uid: string) {
  return `innovex-session-greeted-${uid}`;
}

/* ── Tour steps (first-time users) ── */
interface TourStep {
  message: string;
  ctaText: string;
  ctaLink: string;
  advanceOnPath: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    message:
      "Hey there! 👋 I'm INNO, your AI campus guide! Welcome to INNOVEX — your innovation launchpad. Let's set you up! First, complete your profile so I can match you with the best opportunities.",
    ctaText: "Complete Profile",
    ctaLink: "/student/profile",
    advanceOnPath: "/student/profile",
  },
  {
    message:
      "Nice work on your profile! 🎉 Now let's discover competitions that match your skills. Compete, collaborate, and earn XP!",
    ctaText: "View Competitions",
    ctaLink: "/student/competitions",
    advanceOnPath: "/student/competitions",
  },
  {
    message:
      "Great explorer! 🤝 Now let's find you a mentor. They'll guide your innovation journey and help you level up faster!",
    ctaText: "Find Mentors",
    ctaLink: "/student/matches",
    advanceOnPath: "/student/matches",
  },
  {
    message:
      "You're on fire! 🔥 Check out your Daily Missions — complete them every day to earn XP and maintain your streak!",
    ctaText: "View Missions",
    ctaLink: "/student/missions",
    advanceOnPath: "/student/missions",
  },
  {
    message:
      "Last stop! 🚀 Every great innovator needs a startup. Create yours or level up your existing idea right here!",
    ctaText: "My Startup",
    ctaLink: "/student/startup",
    advanceOnPath: "/student/startup",
  },
];

/* ── Public message shape consumed by the component ── */
export interface GuideMessage {
  message: string;
  ctaText: string;
  ctaLink: string;
  stepLabel?: string; // e.g. "Step 2 / 5"
}

/* ══════════════════════════════════════════════════════
   Hook
   ══════════════════════════════════════════════════════ */

export function useGuideBot() {
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [currentMessage, setCurrentMessage] = useState<GuideMessage | null>(
    null,
  );
  const [bubbleOpen, setBubbleOpen] = useState(false);

  // Tour state
  const [tourStep, setTourStep] = useState(0);
  const [isTourMode, setIsTourMode] = useState(false);
  const [onStepPage, setOnStepPage] = useState(false);

  // Returning-user message queue
  const [messageQueue, setMessageQueue] = useState<GuideMessage[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Refs to prevent double-init, handle pathname changes, and track step page visits
  const initRef = useRef(false);
  const prevPathRef = useRef<string | null>(null);
  const visitedStepPageRef = useRef(false);
  const userIdRef = useRef<string>("");

  /* ── 1. Fetch context & decide mode on mount ── */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    fetchGuideContext().then((ctx) => {
      setLoading(false);
      if (!ctx) return;

      const uid = ctx.userId;
      userIdRef.current = uid;

      const tourDone =
        typeof window !== "undefined" &&
        localStorage.getItem(tourCompletedKey(uid)) === "true";
      const alreadyGreeted =
        typeof window !== "undefined" &&
        sessionStorage.getItem(sessionGreetedKey(uid)) === "true";

      if (!tourDone) {
        /* ── NEW USER → start / resume tour ── */
        const saved = parseInt(
          localStorage.getItem(tourStepKey(uid)) ?? "0",
          10,
        );
        const step = Math.min(Math.max(saved, 0), TOUR_STEPS.length - 1);
        setTourStep(step);
        setIsTourMode(true);

        const s = TOUR_STEPS[step];
        setCurrentMessage({
          message: s.message,
          ctaText: s.ctaText,
          ctaLink: s.ctaLink,
          stepLabel: `Step ${step + 1} / ${TOUR_STEPS.length}`,
        });
        setBubbleOpen(true);
      } else if (!alreadyGreeted) {
        /* ── RETURNING USER → welcome + daily info queue ── */
        const msgs = buildReturningQueue(ctx);
        setMessageQueue(msgs);
        setQueueIndex(0);
        if (msgs.length > 0) {
          setCurrentMessage(msgs[0]);
          setBubbleOpen(true);
        }
        try {
          sessionStorage.setItem(sessionGreetedKey(uid), "true");
        } catch {
          /* SSR guard */
        }
      }
    });
  }, []);

  /* ── 2. Track when user is on the step page & auto-advance on leave ── */
  useEffect(() => {
    if (!isTourMode) return;

    const step = TOUR_STEPS[tourStep];
    if (!step) return;

    const isOnStepPage =
      pathname === step.advanceOnPath ||
      pathname.startsWith(step.advanceOnPath + "/");

    setOnStepPage(isOnStepPage);

    if (isOnStepPage) {
      // User arrived at the step’s page — mark visited, hide initial bubble
      visitedStepPageRef.current = true;
      setBubbleOpen(false);
      // Auto-pop the "Done → Next Step" bubble after 7 seconds
      const timer = setTimeout(() => {
        setBubbleOpen(true);
      }, 7000);
      return () => clearTimeout(timer);
    } else if (visitedStepPageRef.current) {
      // User navigated AWAY after visiting → advance to next step
      visitedStepPageRef.current = false;
      doAdvanceTour();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isTourMode, tourStep]);

  /* ── 3. Shared advance logic ── */
  const doAdvanceTour = useCallback(() => {
    const uid = userIdRef.current;
    visitedStepPageRef.current = false;
    const next = tourStep + 1;
    if (next >= TOUR_STEPS.length) {
      localStorage.setItem(tourCompletedKey(uid), "true");
      localStorage.removeItem(tourStepKey(uid));
      setIsTourMode(false);
      setOnStepPage(false);
      setCurrentMessage({
        message:
          "🎉 Tour complete! You've explored all the key features of INNOVEX. I'll be right here whenever you need me. Go build something amazing!",
        ctaText: "Let's Go!",
        ctaLink: "/student",
      });
      setBubbleOpen(true);
    } else {
      setTourStep(next);
      setOnStepPage(false);
      localStorage.setItem(tourStepKey(uid), next.toString());
      const s = TOUR_STEPS[next];
      setCurrentMessage({
        message: s.message,
        ctaText: s.ctaText,
        ctaLink: s.ctaLink,
        stepLabel: `Step ${next + 1} / ${TOUR_STEPS.length}`,
      });
      setBubbleOpen(true);
    }
  }, [tourStep]);

  /* ── 4. Callbacks ── */

  const nextMessage = useCallback(() => {
    if (isTourMode) return;
    const next = queueIndex + 1;
    if (next < messageQueue.length) {
      setQueueIndex(next);
      setCurrentMessage(messageQueue[next]);
      setBubbleOpen(true);
    } else {
      setBubbleOpen(false);
    }
  }, [isTourMode, queueIndex, messageQueue]);

  const dismiss = useCallback(() => {
    setBubbleOpen(false);
    // Clear the message so the dot disappears (for non-tour messages including nudges)
    if (!isTourMode) {
      setCurrentMessage(null);
    }
  }, [isTourMode]);

  const toggleBubble = useCallback(() => {
    if (isTourMode && onStepPage) {
      // On the step page → show a "Done? Next step" prompt
      setBubbleOpen(true);
      return;
    }
    // If bubble is closed and there's no current message, inject an idle nudge
    if (!bubbleOpen && !currentMessage) {
      const nudges = [
        {
          message:
            "Want to try something new? 🌟 Check out today's missions and earn some XP!",
          ctaText: "View Missions",
          ctaLink: "/student/missions",
        },
        {
          message:
            "Have you explored all the competitions available to you? 🏆 There might be a perfect fit!",
          ctaText: "View Competitions",
          ctaLink: "/student/competitions",
        },
        {
          message:
            "Your mentor match is waiting! 🤝 Connect with someone who can accelerate your journey.",
          ctaText: "Find Mentors",
          ctaLink: "/student/matches",
        },
        {
          message:
            "How's your startup coming along? 🚀 Level it up and attract investors!",
          ctaText: "My Startup",
          ctaLink: "/student/startup",
        },
      ];
      const nudge = nudges[Math.floor(Math.random() * nudges.length)];
      setCurrentMessage(nudge);
      setBubbleOpen(true);
      return;
    }
    setBubbleOpen((prev) => !prev);
  }, [isTourMode, onStepPage, bubbleOpen, currentMessage]);

  const skipTour = useCallback(() => {
    const uid = userIdRef.current;
    localStorage.setItem(tourCompletedKey(uid), "true");
    localStorage.removeItem(tourStepKey(uid));
    setIsTourMode(false);
    setBubbleOpen(false);
  }, []);

  return {
    currentMessage,
    loading,
    isVisible: bubbleOpen,
    isTourMode,
    onStepPage,
    tourStep,
    totalTourSteps: TOUR_STEPS.length,
    hasNextMessage: !isTourMode && queueIndex < messageQueue.length - 1,
    dismiss,
    toggleBubble,
    nextMessage,
    skipTour,
    advanceTour: doAdvanceTour,
  };
}

/* ── Helper: build returning-user message queue ── */
function buildReturningQueue(ctx: GuideContext): GuideMessage[] {
  const msgs: GuideMessage[] = [];

  // 1. Welcome back (Groq quote)
  msgs.push({
    message: ctx.welcomeQuote,
    ctaText: "Let's Go!",
    ctaLink: "/student",
  });

  // 2. Daily missions
  if (ctx.pendingMissions > 0) {
    msgs.push({
      message: `You have ${ctx.pendingMissions} pending mission${ctx.pendingMissions !== 1 ? "s" : ""} today! Complete them to earn XP and keep your ${ctx.streak}-day streak alive! 🔥`,
      ctaText: "View Missions",
      ctaLink: "/student/missions",
    });
  }

  // 3. Unread notifications
  if (ctx.notificationCount > 0) {
    msgs.push({
      message: `You have ${ctx.notificationCount} unread notification${ctx.notificationCount !== 1 ? "s" : ""}! Someone might be reaching out to collaborate 📬`,
      ctaText: "Check Notifications",
      ctaLink: "/student/notifications",
    });
  }

  // 4. Startup nudge
  if (ctx.startupStage) {
    msgs.push({
      message: `Your startup is at the "${ctx.startupStage}" stage. Keep building and level it up! 🚀`,
      ctaText: "View Startup",
      ctaLink: "/student/startup",
    });
  }

  return msgs;
}
