'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  text: string
  url?: string
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false)

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  const handleWhatsAppShare = () => {
    const message = `${title}\n\n${text}\n\n${shareUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    setShowMenu(false)
  }

  const handleLinkedInShare = () => {
    // LinkedIn share URL format
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`
    window.open(linkedinUrl, '_blank', 'width=600,height=600')
    setShowMenu(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 transition hover:bg-purple-500/20"
        aria-label="Share achievement"
      >
        🔗 Share
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Share Menu */}
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-xl">
            <button
              onClick={handleWhatsAppShare}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition hover:bg-white/5"
            >
              <span className="text-2xl">💬</span>
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={handleLinkedInShare}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition hover:bg-white/5"
            >
              <span className="text-2xl">💼</span>
              <span>Share on LinkedIn</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition hover:bg-white/5"
            >
              <span className="text-2xl">📋</span>
              <span>Copy Link</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
