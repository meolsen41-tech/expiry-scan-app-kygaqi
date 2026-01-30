
import { apiPost, apiGet, apiDelete } from './api';

export interface BatchScan {
  id: string;
  batchName: string;
  status: 'in_progress' | 'completed';
  itemCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface BatchScanItem {
  id: string;
  barcode: string;
  productName: string;
  expirationDate: string;
  category?: string;
  quantity: number;
  location?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

/**
 * Create a new batch scan
 */
export async function createBatchScan(deviceId: string, batchName: string): Promise<BatchScan> {
  console.log('[BatchScan] Creating batch:', batchName);
  return apiPost('/api/batch-scans', { deviceId, batchName });
}

/**
 * Get all batch scans for device
 */
export async function getBatchScans(deviceId: string): Promise<BatchScan[]> {
  console.log('[BatchScan] Fetching batches for device:', deviceId);
  return apiGet(`/api/batch-scans/${deviceId}`);
}

/**
 * Add item to batch scan
 */
export async function addBatchScanItem(
  batchId: string,
  item: {
    barcode: string;
    productName: string;
    expirationDate: string;
    category?: string;
    quantity?: number;
    location?: string;
    notes?: string;
    imageUrl?: string;
  }
): Promise<{ success: boolean; item: BatchScanItem; batchItemCount: number }> {
  console.log('[BatchScan] Adding item to batch:', batchId);
  return apiPost(`/api/batch-scans/${batchId}/items`, item);
}

/**
 * Get items in batch scan
 */
export async function getBatchScanItems(batchId: string): Promise<BatchScanItem[]> {
  console.log('[BatchScan] Fetching items for batch:', batchId);
  return apiGet(`/api/batch-scans/${batchId}/items`);
}

/**
 * Complete batch scan (creates product entries)
 */
export async function completeBatchScan(batchId: string): Promise<{ success: boolean; entriesCreated: number }> {
  console.log('[BatchScan] Completing batch:', batchId);
  return apiPost(`/api/batch-scans/${batchId}/complete`, {});
}

/**
 * Delete batch scan
 */
export async function deleteBatchScan(batchId: string): Promise<{ success: boolean }> {
  console.log('[BatchScan] Deleting batch:', batchId);
  return apiDelete(`/api/batch-scans/${batchId}`);
}
