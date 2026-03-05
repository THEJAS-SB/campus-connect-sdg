'use client'

import Link from 'next/link'
import { markAsRead } from '@/app/actions/notifications'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  action_url: string | null
  created_at: string
}

interface NotificationListProps {
  notifications: Notification[]
}

const NOTIFICATION_ICONS: Record<string, string> = {
  badge_earned: '🏆',
  match_created: '🤝',
  meeting_scheduled: '📅',
  mission_reminder: '🎯',
  streak_warning: '🔥',
  startup_milestone: '🚀',
  investment_added: '💰',
}

export default function NotificationList({ notifications }: NotificationListProps) {
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4">🔔</div>
        <p className="text-xl text-slate-400">No notifications yet</p>
        <p className="mt-2 text-sm text-slate-500">
          You'll be notified when you earn badges, receive matches, or have important updates
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const icon = NOTIFICATION_ICONS[notification.type] || '📬'
        const isUnread = !notification.is_read

        return (
          <div
            key={notification.id}
            className={`rounded-xl border backdrop-blur-sm transition ${
              isUnread
                ? 'border-purple-500/30 bg-purple-500/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-4 p-6">
              {/* Icon */}
              <div className="flex-shrink-0 text-4xl">{icon}</div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">
                    {notification.title}
                  </h3>
                  {isUnread && (
                    <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-purple-500" />
                  )}
                </div>
                <p className="text-slate-300">{notification.message}</p>
                <p className="text-sm text-slate-500">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 items-center gap-2">
                {notification.action_url && (
                  <Link
                    href={notification.action_url}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    View
                  </Link>
                )}
                {isUnread && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
