import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NotificationData, CreateNotificationData } from '@/types/analytics';

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (notification: CreateNotificationData) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  organizationId: string;
}

export function NotificationProvider({ children, organizationId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((notification: CreateNotificationData) => {
    const newNotification: NotificationData = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      timestamp: new Date(),
      read: false,
      organizationId
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove non-critical notifications after 5 seconds
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  }, [organizationId]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Simulate real-time notifications for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const types = ['info', 'warning', 'success'] as const;
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const messages = {
          info: {
            title: 'Assessment Update',
            message: 'New security assessment data is available for review.'
          },
          warning: {
            title: 'Security Alert',
            message: 'Potential security issue detected in network monitoring.'
          },
          success: {
            title: 'Compliance Check',
            message: 'Weekly compliance review completed successfully.'
          }
        };

        addNotification({
          type: randomType,
          ...messages[randomType]
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    unreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}