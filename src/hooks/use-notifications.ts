'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';

const NOTIFICATION_PREFERENCE_KEY = 'notification-enabled';

// Helper functions to check notification state
function getNotificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function getNotificationPermission(): NotificationPermission | null {
  if (getNotificationSupport()) {
    return Notification.permission;
  }
  return null;
}

function getNotificationEnabled(): boolean {
  if (getNotificationSupport() && Notification.permission === 'granted') {
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
      return storedPreference === 'true';
    }
  }
  return false;
}

// Simple store for notification state
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function getSnapshot() {
  return JSON.stringify({
    isSupported: getNotificationSupport(),
    permission: getNotificationPermission(),
    isEnabled: getNotificationEnabled(),
  });
}

export interface UseNotificationsReturn {
  isSupported: boolean;
  isEnabled: boolean;
  permission: NotificationPermission | null;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  disableNotifications: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [isEnabledState, setIsEnabledState] = useState(getNotificationEnabled);
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(getNotificationPermission);

  const isSupported = getNotificationSupport();
  const isEnabled = isEnabledState && permissionState === 'granted';

  const notifyListeners = useCallback(() => {
    listeners.forEach(listener => listener());
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);

      if (result === 'granted') {
        localStorage.setItem(NOTIFICATION_PREFERENCE_KEY, 'true');
        setIsEnabledState(true);
        notifyListeners();
        return true;
      } else {
        localStorage.removeItem(NOTIFICATION_PREFERENCE_KEY);
        setIsEnabledState(false);
        notifyListeners();
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, notifyListeners]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || !isEnabled || permissionState !== 'granted') {
        console.warn('Cannot send notification: not enabled or permission not granted');
        return;
      }

      try {
        new Notification(title, {
          icon: '/logo.svg',
          badge: '/logo.svg',
          lang: 'bn',
          ...options,
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    },
    [isSupported, isEnabled, permissionState]
  );

  const disableNotifications = useCallback(() => {
    localStorage.removeItem(NOTIFICATION_PREFERENCE_KEY);
    setIsEnabledState(false);
    notifyListeners();
  }, [notifyListeners]);

  return {
    isSupported,
    isEnabled,
    permission: permissionState,
    requestPermission,
    sendNotification,
    disableNotifications,
  };
}
