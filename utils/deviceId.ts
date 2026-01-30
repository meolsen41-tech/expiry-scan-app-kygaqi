
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const DEVICE_ID_KEY = 'expiry_scan_device_id';

/**
 * Get or create a unique device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      console.log('[DeviceId] Generated new device ID:', deviceId);
    } else {
      console.log('[DeviceId] Retrieved existing device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('[DeviceId] Error managing device ID:', error);
    // Fallback to session-based ID
    return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Get device name for display
 */
export function getDeviceName(): string {
  const deviceName = Constants.deviceName || 'Unknown Device';
  return deviceName;
}
