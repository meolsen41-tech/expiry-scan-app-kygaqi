
import Constants from 'expo-constants';

// Get backend URL from app.json configuration
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

console.log('[API] Backend URL:', BACKEND_URL);

/**
 * Generic API call wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`[API] ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMsg = errorData?.error || errorData?.message || `HTTP ${response.status}`;
      // Only log as error for non-404 responses (404 is expected for "not found" cases)
      if (response.status !== 404) {
        console.error(`[API] HTTP Error ${response.status}:`, errorMsg);
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log(`[API] Success:`, data);
    return data;
  } catch (error: any) {
    // Only log unexpected errors (not 404s which are handled by callers)
    const msg = error?.message || '';
    if (!msg.includes('HTTP 404') && !msg.includes('not found') && !msg.includes('Not Found')) {
      console.error(`[API] Error:`, error);
    }
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' });
}

/**
 * DELETE request helper with body (for endpoints that require a body with DELETE)
 */
export async function apiDeleteWithBody<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
}

/**
 * Upload image helper (multipart/form-data)
 */
export async function uploadImage(imageUri: string): Promise<{ url: string; filename: string }> {
  const url = `${BACKEND_URL}/api/upload/product-image`;
  console.log(`[API] POST ${url} (image upload)`);

  const formData = new FormData();
  
  // Extract filename from URI
  const filename = imageUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log(`[API] Upload response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API] Upload success:`, data);
    return data;
  } catch (error) {
    console.error(`[API] Upload error:`, error);
    throw error;
  }
}

// ============================================
// Product API Methods (Global Products)
// ============================================

export interface Product {
  barcode: string;
  name?: string;
  primaryImageUrl?: string;
  primaryImageSourceStoreId?: string;
  primaryImageSourceMemberId?: string;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  barcode: string;
  imageUrl: string;
  uploadedByStoreId: string;
  uploadedByMemberId: string;
  createdAt: string;
  isPrimary: boolean;
}

export interface ExpiryBatch {
  id: string;
  storeId: string;
  barcode: string;
  expiryDate: string;
  quantity: number;
  addedByMemberId: string;
  addedAt: string;
  note?: string;
  productName?: string;
  primaryImageUrl?: string;
  status?: 'fresh' | 'expiring' | 'expired';
}

export interface ExpiryBatchStats {
  total: number;
  fresh: number;
  expiring: number;
  expired: number;
}

// Legacy types for backward compatibility
export interface ProductEntry {
  id: string;
  productId?: string;
  barcode: string;
  productName?: string;
  expirationDate?: string;
  quantity: number;
  imageUrl?: string;
  createdAt?: string;
  status?: 'fresh' | 'expiring' | 'expired';
  storeId?: string;
  addedByMemberId?: string;
}

export interface ProductStats extends ExpiryBatchStats {
  expiringSoon?: number;
}

/**
 * Look up product by barcode
 * GET /api/products/:barcode
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    return await apiGet<Product>(`/api/products/${barcode}`);
  } catch (error: any) {
    // Return null if product not found (404)
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new product
 * POST /api/products
 */
export async function createProduct(data: {
  barcode: string;
  name?: string;
}): Promise<Product> {
  return apiPost<Product>('/api/products', data);
}

/**
 * Update product name
 * PUT /api/products/:barcode
 */
export async function updateProduct(barcode: string, data: { name: string }): Promise<Product> {
  return apiPut<Product>(`/api/products/${barcode}`, data);
}

/**
 * Get all images for a product
 * GET /api/products/:barcode/images
 */
export async function getProductImages(barcode: string): Promise<ProductImage[]> {
  return apiGet<ProductImage[]>(`/api/products/${barcode}/images`);
}

/**
 * Upload a new image for a product
 * POST /api/products/:barcode/images
 */
export async function uploadProductImage(
  barcode: string,
  imageUrl: string,
  storeId: string,
  memberId: string
): Promise<ProductImage> {
  return apiPost<ProductImage>(`/api/products/${barcode}/images`, {
    imageUrl,
    storeId,
    memberId,
  });
}

/**
 * Get expiry batches for a store
 * GET /api/stores/:storeId/expiry-batches?status=xxx
 */
export async function getExpiryBatches(params: {
  store_id: string;
  status?: 'all' | 'fresh' | 'expiring' | 'expired';
}): Promise<ExpiryBatch[]> {
  const queryParams = new URLSearchParams();
  if (params.status && params.status !== 'all') {
    queryParams.append('status', params.status);
  }
  const query = queryParams.toString();
  const endpoint = `/api/stores/${encodeURIComponent(params.store_id)}/expiry-batches${query ? `?${query}` : ''}`;
  console.log(`[API] getExpiryBatches endpoint: ${endpoint}`);
  return apiGet<ExpiryBatch[]>(endpoint);
}

/**
 * Create a new expiry batch
 * POST /api/stores/:storeId/expiry-batches
 */
export async function createExpiryBatch(data: {
  store_id: string;
  barcode: string;
  expiry_date: string;
  quantity: number;
  added_by_member_id: string;
  note?: string;
}): Promise<ExpiryBatch> {
  console.log(`[API] createExpiryBatch for store: ${data.store_id}`);
  return apiPost<ExpiryBatch>(`/api/stores/${encodeURIComponent(data.store_id)}/expiry-batches`, {
    barcode: data.barcode,
    expiryDate: data.expiry_date,
    quantity: data.quantity,
    addedByMemberId: data.added_by_member_id,
    note: data.note,
  });
}

/**
 * Update an expiry batch
 * PUT /api/expiry-batches/:id
 */
export async function updateExpiryBatch(
  id: string,
  data: {
    store_id: string;
    quantity?: number;
    note?: string;
  }
): Promise<ExpiryBatch> {
  return apiPut<ExpiryBatch>(`/api/expiry-batches/${id}`, {
    storeId: data.store_id,
    quantity: data.quantity,
    note: data.note,
  });
}

/**
 * Delete an expiry batch
 * DELETE /api/stores/:storeId/expiry-batches/:id
 */
export async function deleteExpiryBatch(id: string, storeId: string): Promise<{ success: boolean }> {
  console.log(`[API] deleteExpiryBatch id=${id} storeId=${storeId}`);
  return apiDelete<{ success: boolean }>(`/api/stores/${encodeURIComponent(storeId)}/expiry-batches/${id}`);
}

/**
 * Get expiry batch statistics for a store
 * GET /api/expiry-batches/stats?storeId=xxx
 */
export async function getExpiryBatchStats(storeId: string): Promise<ExpiryBatchStats> {
  return apiGet<ExpiryBatchStats>(`/api/expiry-batches/stats?storeId=${encodeURIComponent(storeId)}`);
}

// ============================================
// Legacy API Methods (for backward compatibility)
// ============================================

/**
 * @deprecated Use createProduct instead
 */
export async function createOrUpdateProduct(data: {
  barcode: string;
  name: string;
  category?: string;
  imageUrl?: string;
}): Promise<Product> {
  return createProduct({ barcode: data.barcode, name: data.name });
}

/**
 * @deprecated Use getExpiryBatches instead
 */
export async function getProductEntries(storeId?: string): Promise<ProductEntry[]> {
  if (!storeId) {
    console.warn('[API] getProductEntries called without storeId - returning empty array');
    return [];
  }
  const batches = await getExpiryBatches({ store_id: storeId, status: 'all' });
  // Map to legacy format
  return batches.map(batch => ({
    ...batch,
    productId: batch.barcode,
    productName: batch.productName || '',
    expirationDate: batch.expiryDate,
    imageUrl: batch.primaryImageUrl,
    createdAt: batch.addedAt,
    quantity: batch.quantity,
  }));
}

/**
 * @deprecated Use createExpiryBatch instead
 */
export async function createProductEntry(data: {
  barcode: string;
  productName: string;
  category?: string;
  expirationDate: string;
  quantity?: number;
  location?: string;
  notes?: string;
  imageUrl?: string;
  storeId?: string;
  createdByMemberId?: string;
}): Promise<ProductEntry> {
  if (!data.storeId || !data.createdByMemberId) {
    throw new Error('storeId and createdByMemberId are required');
  }
  const batch = await createExpiryBatch({
    store_id: data.storeId,
    barcode: data.barcode,
    expiry_date: data.expirationDate,
    quantity: data.quantity || 1,
    added_by_member_id: data.createdByMemberId,
    note: data.notes,
  });
  return {
    ...batch,
    productId: batch.barcode,
    productName: batch.productName || data.productName,
    expirationDate: batch.expiryDate,
    imageUrl: batch.primaryImageUrl,
    createdAt: batch.addedAt,
  };
}

/**
 * @deprecated Use updateExpiryBatch instead
 */
export async function updateProductEntry(
  id: string,
  data: {
    productName?: string;
    category?: string;
    expirationDate?: string;
    quantity?: number;
    location?: string;
    notes?: string;
    imageUrl?: string;
    storeId?: string;
  }
): Promise<ProductEntry> {
  if (!data.storeId) {
    throw new Error('storeId is required');
  }
  const batch = await updateExpiryBatch(id, {
    store_id: data.storeId,
    quantity: data.quantity,
    note: data.notes,
  });
  return {
    ...batch,
    productId: batch.barcode,
    productName: batch.productName || '',
    expirationDate: batch.expiryDate,
    imageUrl: batch.primaryImageUrl,
    createdAt: batch.addedAt,
  };
}

/**
 * @deprecated Use deleteExpiryBatch instead
 */
export async function deleteProductEntry(id: string, storeId?: string): Promise<{ success: boolean }> {
  if (!storeId) {
    throw new Error('storeId is required');
  }
  return deleteExpiryBatch(id, storeId);
}

/**
 * @deprecated Use getExpiryBatchStats instead
 */
export async function getProductStats(storeId?: string): Promise<ProductStats> {
  if (!storeId) {
    console.warn('[API] getProductStats called without storeId - returning zero stats');
    return { total: 0, fresh: 0, expiring: 0, expired: 0, expiringSoon: 0 };
  }
  const stats = await getExpiryBatchStats(storeId);
  return {
    ...stats,
    expiringSoon: stats.expiring,
  };
}
