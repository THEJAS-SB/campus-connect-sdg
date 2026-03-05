"use client";

import { checkMyBadges } from "@/app/actions/badges";
import { useState } from "react";

export default function CheckBadgesButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const newBadges = await checkMyBadges();

      if (newBadges.length > 0) {
        setMessage(`🎉 Congratulations! You earned: ${newBadges.join(", ")}`);
      } else {
        setMessage("No new badges earned yet. Keep going!");
      }
    } catch (error) {
      setMessage("Failed to check badges. Please try again.");
      console.error("Badge check error:", error);
    } finally {
      setLoading(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleCheck}
        disabled={loading}
        className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
      >
        {loading ? "⏳ Checking..." : "🏆 Check for New Badges"}
      </button>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.includes("Congratulations")
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-blue-500/30 bg-blue-500/10 text-blue-400"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
