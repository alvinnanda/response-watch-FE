import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/notifications';
import type { Notification } from '../../types/notifications';

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  
  // Track page visibility to pause/resume polling
  const isPageVisible = usePageVisibility();
  const wasEverHiddenRef = useRef(false);
  const prevVisibilityRef = useRef(isPageVisible);

  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const data = await getNotifications(1, 10);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch unread count on mount - only when page is visible
  useEffect(() => {
    if (!isPageVisible) return;
    
    fetchUnreadCount();
    
    // Poll for unread count every 60 seconds - only when page is visible
    const interval = setInterval(() => {
      if (isPageVisible) {
        fetchUnreadCount();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount, isPageVisible]);

  // Refresh when page becomes visible again after being hidden
  useEffect(() => {
    // Track when page becomes hidden
    if (!isPageVisible) {
      wasEverHiddenRef.current = true;
    }
    
    // Only refresh if page was previously hidden and now visible
    const wasHidden = prevVisibilityRef.current === false;
    const shouldRefresh = isPageVisible && wasHidden && wasEverHiddenRef.current;
    
    // Update previous visibility
    prevVisibilityRef.current = isPageVisible;
    
    if (shouldRefresh) {
      fetchUnreadCount();
    }
  }, [isPageVisible, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate to request if available
    if (notification.metadata?.request_token) {
      setIsOpen(false);
      navigate(`/t/${notification.metadata.request_token}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getStatusColor = (notification: Notification) => {
    // Handle reminder notifications
    if (notification.type === 'reminder') {
      if (notification.metadata?.delivery_status === 'sent') {
        return 'bg-green-500';
      } else if (notification.metadata?.delivery_status === 'failed') {
        return 'bg-red-500';
      }
      return 'bg-purple-500';
    }

    // Handle status change notifications
    switch (notification.metadata?.new_status) {
      case 'in_progress':
        return 'bg-blue-500';
      case 'done':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Status Indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${getStatusColor(notification)}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard/notifications');
                }}
                className="w-full text-center text-xs text-gray-600 hover:text-gray-900 font-medium py-1"
              >
                Lihat semua notifikasi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
