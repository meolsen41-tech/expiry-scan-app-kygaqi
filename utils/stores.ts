
import { apiPost, apiGet, apiDeleteWithBody } from './api';

export interface Store {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Member {
  id: string;
  storeId?: string;
  nickname: string;
  deviceId?: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface CurrentStore {
  id: string;
  name: string;
  joinCode: string;
  role: 'owner' | 'member';
  nickname: string;
  memberId?: string;
  members?: Array<{ id: string; nickname: string; role: string; joinedAt: string }>;
}

/**
 * Create a new store
 * POST /api/stores - Body: { name, nickname, deviceId }
 * Returns: { id, name, joinCode, createdAt }
 */
export async function createStore(name: string, nickname: string, deviceId: string): Promise<Store> {
  console.log('[Store] Creating store:', { name, nickname, deviceId });
  return apiPost<Store>('/api/stores', {
    name,
    nickname,
    deviceId,
  });
}

/**
 * Join an existing store using join code
 * POST /api/stores/join - Body: { joinCode, nickname, deviceId }
 * Returns: { store: { id, name, joinCode }, member: { id, nickname, role } }
 */
export async function joinStore(joinCode: string, nickname: string, deviceId: string): Promise<{ store: Store; member: Member }> {
  console.log('[Store] Joining store:', { joinCode, nickname, deviceId });
  return apiPost<{ store: Store; member: Member }>('/api/stores/join', {
    joinCode,
    nickname,
    deviceId,
  });
}

/**
 * Get current store for the device
 * GET /api/stores/:deviceId
 * Returns: { id, name, joinCode, role, nickname } or null
 */
export async function getCurrentStore(deviceId: string): Promise<CurrentStore | null> {
  console.log('[Store] Fetching current store for device:', deviceId);
  return apiGet<CurrentStore | null>(`/api/stores/${deviceId}`);
}

/**
 * Get store members
 * GET /api/stores/:storeId/members
 * Returns: [{ id, nickname, role, joinedAt }]
 */
export async function getStoreMembers(storeId: string): Promise<Member[]> {
  console.log('[Store] Fetching members for store:', storeId);
  return apiGet<Member[]>(`/api/stores/${storeId}/members`);
}

/**
 * Leave a store
 * POST /api/stores/:storeId/leave - Body: { deviceId }
 * Returns: { success: true }
 */
export async function leaveStore(storeId: string, deviceId: string): Promise<{ success: boolean }> {
  console.log('[Store] Leaving store:', { storeId, deviceId });
  return apiPost<{ success: boolean }>(`/api/stores/${storeId}/leave`, { deviceId });
}

/**
 * Delete a store (owner only)
 * DELETE /api/stores/:storeId - Body: { deviceId }
 * Returns: { success: true }
 */
export async function deleteStore(storeId: string, deviceId: string): Promise<{ success: boolean }> {
  console.log('[Store] Deleting store:', { storeId, deviceId });
  return apiDeleteWithBody<{ success: boolean }>(`/api/stores/${storeId}`, { deviceId });
}
