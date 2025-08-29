import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Check, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  read: boolean;
  timestamp: Date;
  link?: string;
}

interface NotificationBellProps {
  className?: string;
}

const NotificationBell = ({ className }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Mock notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Warning: Code Quality Issue',
        message: 'Your recent submission had some code quality concerns.',
        type: 'warning',
        read: false,
        timestamp: new Date(Date.now() - 3600000),
        link: '/submissions/123'
      },
      {
        id: '2',
        title: 'Reminder: Daily Challenge',
        message: 'Complete today\'s challenge to maintain your streak!',
        type: 'info',
        read: true,
        timestamp: new Date(Date.now() - 86400000)
      }
    ];
    
    setNotifications(mockNotifications);
    setHasUnread(mockNotifications.some(n => !n.read));
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setHasUnread(notifications.some(n => !n.read && n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setHasUnread(false);
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className={`relative ${className || ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-amber-500" />
        {hasUnread && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-popover rounded-md shadow-lg border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={markAllAsRead}
              disabled={!hasUnread}
            >
              Mark all as read
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "p-3 hover:bg-accent cursor-pointer",
                  !notification.read && "bg-accent/50"
                )}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {notification.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    ) : notification.type === 'success' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
