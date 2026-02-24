
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'expiry_scan_device_id';

// In-memory cache for the device ID (avoids repeated async lookups)
let cachedDeviceId: string | null = null;

/**
 * Get or create a unique device ID (web-safe)
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    let deviceId: string | null = null;

    if (Platform.OS === 'web') {
      // Use localStorage on web
      if (typeof localStorage !== 'undefined') {
        deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
          deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
          console.log('[DeviceId] Generated new device ID (web):', deviceId);
        } else {
          console.log('[DeviceId] Retrieved existing device ID (web):', deviceId);
        }
      } else {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      }
    } else {
      // Use SecureStore on native
      deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
        console.log('[DeviceId] Generated new device ID (native):', deviceId);
      } else {
        console.log('[DeviceId] Retrieved existing device ID (native):', deviceId);
      }
    }

    cachedDeviceId = deviceId;
    return deviceId;
  } catch (error) {
    console.warn('[DeviceId] Error managing device ID, using fallback:', error);
    // Fallback to session-based ID
    const fallback = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    cachedDeviceId = fallback;
    return fallback;
  }
}

/**
 * Get device name for display
 */
export function getDeviceName(): string {
  const deviceName = Constants.deviceName || 'Unknown Device';
  return deviceName;
}
