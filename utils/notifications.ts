
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiPost, apiGet, apiPut, apiDelete } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSchedule {
  id: string;
  scheduleType: 'weekly' | 'daily';
  dayOfWeek?: number;
  timeOfDay: string;
  enabled: boolean;
}

/**
 * Register device for push notifications and get Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  console.log('[Notifications] Registering for push notifications');

  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device for push notifications');
    return null;
  }

  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Set up notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('expiry-reminders', {
        name: 'Expiration Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
      });
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error('[Notifications] No project ID found');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[Notifications] Expo push token:', token);

    return token;
  } catch (error) {
    console.error('[Notifications] Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Register push token with backend
 */
export async function registerPushToken(deviceId: string, expoPushToken: string): Promise<void> {
  console.log('[Notifications] Registering token with backend');
  await apiPost('/api/notifications/register-token', {
    deviceId,
    expoPushToken,
    platform: Platform.OS,
  });
}

/**
 * Create notification schedule
 */
export async function createNotificationSchedule(
  deviceId: string,
  scheduleType: 'weekly' | 'daily',
  timeOfDay: string,
  dayOfWeek?: number
): Promise<{ success: boolean; scheduleId: string }> {
  console.log('[Notifications] Creating schedule:', { scheduleType, timeOfDay, dayOfWeek });
  return apiPost('/api/notifications/schedule', {
    deviceId,
    scheduleType,
    timeOfDay,
    dayOfWeek,
  });
}

/**
 * Get notification schedules for device
 */
export async function getNotificationSchedules(deviceId: string): Promise<NotificationSchedule[]> {
  console.log('[Notifications] Fetching schedules for device:', deviceId);
  return apiGet(`/api/notifications/schedules/${deviceId}`);
}

/**
 * Update notification schedule
 */
export async function updateNotificationSchedule(
  scheduleId: string,
  updates: { enabled?: boolean; timeOfDay?: string; dayOfWeek?: number }
): Promise<{ success: boolean; schedule: NotificationSchedule }> {
  console.log('[Notifications] Updating schedule:', scheduleId, updates);
  return apiPut(`/api/notifications/schedule/${scheduleId}`, updates);
}

/**
 * Delete notification schedule
 */
export async function deleteNotificationSchedule(scheduleId: string): Promise<{ success: boolean }> {
  console.log('[Notifications] Deleting schedule:', scheduleId);
  return apiDelete(`/api/notifications/schedule/${scheduleId}`);
}

/**
 * Send expiration reminders now
 */
export async function sendExpirationReminders(deviceId: string): Promise<{ success: boolean; notificationsSent: number }> {
  console.log('[Notifications] Sending expiration reminders');
  return apiPost('/api/notifications/send-expiration-reminders', { deviceId });
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  triggerSeconds?: number
): Promise<string> {
  console.log('[Notifications] Scheduling local notification:', title);
  
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: triggerSeconds
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerSeconds,
        }
      : null,
  });
}

/**
 * Get day name from day number (0-6)
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}
