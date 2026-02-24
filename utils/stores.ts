
import { apiPost, apiGet, apiDeleteWithBody } from './api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LEFT_STORE_KEY = 'expiry_scan_left_store';

// Web-safe SecureStore helpers
async function secureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

export interface Store {
  id: string;
  name: string;
  storeCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Member {
  id: string;
  storeId?: string;
  nickname: string;
  deviceId?: string;
  role: 'admin' | 'staff';
  joinedAt: string;
}

export interface CurrentStore {
  id: string;
  name: string;
  storeCode: string;
  role: 'admin' | 'staff';
  nickname: string;
  memberId?: string;
  members?: Array<{ id: string; nickname: string; role: string; joinedAt: string }>;
}

/**
 * Create a new store
 * POST /api/stores - Body: { name, nickname, deviceId }
 * Returns: { id, name, storeCode, createdAt }
 */
export async function createStore(name: string, nickname: string, deviceId: string): Promise<Store> {
  console.log('[Store] Creating store:', { name, nickname, deviceId });
  const store = await apiPost<Store>('/api/stores', {
    name,
    nickname,
    deviceId,
  });
  // Clear any left-store flag so the newly created store is visible
  await secureDelete(LEFT_STORE_KEY);
  return store;
}

/**
 * Join an existing store using store code
 * POST /api/stores/join - Body: { storeCode, nickname, deviceId }
 * Returns: { id, name, storeCode, role, memberId }
 */
export async function joinStore(storeCode: string, nickname: string, deviceId: string): Promise<{ store: Store; member: Member }> {
  console.log('[Store] Joining store:', { storeCode, nickname, deviceId });
  const result = await apiPost<{ id: string; name: string; storeCode: string; role: string; memberId: string }>('/api/stores/join', {
    storeCode,
    nickname,
    deviceId,
  });
  // Clear any left-store flag so the newly joined store is visible
  await secureDelete(LEFT_STORE_KEY);
  // Normalize the flat API response into the expected { store, member } shape
  return {
    store: {
      id: result.id,
      name: result.name,
      storeCode: result.storeCode,
      createdAt: new Date().toISOString(),
    },
    member: {
      id: result.memberId,
      storeId: result.id,
      nickname,
      role: (result.role as 'admin' | 'staff') || 'staff',
      joinedAt: new Date().toISOString(),
    },
  };
}

/**
 * Get current store for the device
 * GET /api/stores/current?deviceId=xxx
 * Returns: { id, name, storeCode, role, nickname, memberId, members } or null
 */
export async function getCurrentStore(deviceId: string): Promise<CurrentStore | null> {
  console.log('[Store] Fetching current store for device:', deviceId);
  try {
    // Check if user has locally "left" the store
    const leftStoreId = await secureGet(LEFT_STORE_KEY);
    
    const store = await apiGet<CurrentStore>(`/api/stores/current?deviceId=${encodeURIComponent(deviceId)}`);
    
    // If the user has left this store locally, return null
    if (leftStoreId && store && store.id === leftStoreId) {
      console.log('[Store] Device has locally left store:', leftStoreId);
      return null;
    }
    
    // Clear any stale left-store flag if the store is different
    if (leftStoreId && store && store.id !== leftStoreId) {
      await secureDelete(LEFT_STORE_KEY);
    }
    
    return store;
  } catch (error: any) {
    // Return null if store not found (404) or any "not found" type error
    const msg = (error?.message || '').toLowerCase();
    if (
      msg.includes('404') ||
      msg.includes('not found') ||
      msg.includes('device not found') ||
      msg.includes('no store') ||
      msg.includes('http 404')
    ) {
      console.log('[Store] No store found for device (treating as unlinked)');
      return null;
    }
    // For any other error, also return null to avoid crashing the app
    console.warn('[Store] getCurrentStore error (returning null):', msg);
    return null;
  }
}

/**
 * Get store members
 * GET /api/stores/:storeId/members
 * Returns: [{ id, storeId, nickname, role, createdAt }]
 */
export async function getStoreMembers(storeId: string): Promise<Member[]> {
  console.log('[Store] Fetching members for store:', storeId);
  const members = await apiGet<Array<{ id: string; storeId?: string; nickname: string; role: string; createdAt?: string; joinedAt?: string }>>(`/api/stores/${storeId}/members`);
  // Normalize createdAt -> joinedAt for compatibility
  return members.map(m => ({
    id: m.id,
    storeId: m.storeId,
    nickname: m.nickname,
    role: (m.role as 'admin' | 'staff') || 'staff',
    joinedAt: m.joinedAt || m.createdAt || new Date().toISOString(),
  }));
}

/**
 * Leave a store (stores a local flag so the device appears unlinked)
 * Note: The backend does not have a dedicated leave endpoint.
 * We store a local flag in SecureStore to mark the device as having left.
 * Returns: { success: true }
 */
export async function leaveStore(storeId: string, deviceId: string): Promise<{ success: boolean }> {
  console.log('[Store] Leaving store (local flag):', { storeId, deviceId });
  await secureSet(LEFT_STORE_KEY, storeId);
  console.log('[Store] Left store flag set for storeId:', storeId);
  return { success: true };
}

/**
 * Delete a store (owner only)
 * Note: The backend does not have a delete store endpoint in v1.
 * This sets a local flag to hide the store from the device.
 * Returns: { success: true }
 */
export async function deleteStore(storeId: string, deviceId: string): Promise<{ success: boolean }> {
  console.log('[Store] Deleting store (local flag):', { storeId, deviceId });
  // Since there's no backend delete endpoint, we use the leave flag to hide the store locally
  return leaveStore(storeId, deviceId);
}
