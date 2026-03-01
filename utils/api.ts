
import Constants from 'expo-constants';

// Get Supabase configuration from app.json
export const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 'https://orzzjwgteknzqmymampw.supabase.co';
export const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yenpqd2d0ZWtuenFteW1hbXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzI5OTYsImV4cCI6MjA4NzU0ODk5Nn0.BP32iXVO98dvYE_5UFIwxR1PiFiFkimnjAkNZO9r0yw';

console.log('[API] Supabase URL:', SUPABASE_URL);

/**
 * Generic API call wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SUPABASE_URL}/functions/v1${endpoint}`;
  console.log(`[API] ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
  const url = `${SUPABASE_URL}/functions/v1/upload-api`;
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
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
 * GET /products-api/:barcode
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    return await apiGet<Product>(`/products-api/${barcode}`);
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
 * POST /products-api
 */
export async function createProduct(data: {
  barcode: string;
  name?: string;
}): Promise<Product> {
  return apiPost<Product>('/products-api', data);
}

/**
 * Update product name
 * PUT /products-api/:barcode
 */
export async function updateProduct(barcode: string, data: { name: string }): Promise<Product> {
  return apiPut<Product>(`/products-api/${barcode}`, data);
}

/**
 * Get all images for a product
 * GET /products-api/:barcode/images
 */
export async function getProductImages(barcode: string): Promise<ProductImage[]> {
  return apiGet<ProductImage[]>(`/products-api/${barcode}/images`);
}

/**
 * Upload a new image for a product
 * POST /products-api/:barcode/images
 */
export async function uploadProductImage(
  barcode: string,
  imageUrl: string,
  storeId: string,
  memberId: string
): Promise<ProductImage> {
  return apiPost<ProductImage>(`/products-api/${barcode}/images`, {
    imageUrl,
    storeId,
    memberId,
  });
}

/**
 * Get expiry batches for a store
 * GET /expiry-batches-api/:storeId?status=xxx
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
  const endpoint = `/expiry-batches-api/${encodeURIComponent(params.store_id)}${query ? `?${query}` : ''}`;
  console.log(`[API] getExpiryBatches endpoint: ${endpoint}`);
  return apiGet<ExpiryBatch[]>(endpoint);
}

/**
 * Create a new expiry batch
 * POST /expiry-batches-api/:storeId
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
  return apiPost<ExpiryBatch>(`/expiry-batches-api/${encodeURIComponent(data.store_id)}`, {
    barcode: data.barcode,
    expiryDate: data.expiry_date,
    quantity: data.quantity,
    addedByMemberId: data.added_by_member_id,
    note: data.note,
  });
}

/**
 * Update an expiry batch
 * PUT /expiry-batches/:id
 */
export async function updateExpiryBatch(
  id: string,
  data: {
    store_id: string;
    quantity?: number;
    note?: string;
  }
): Promise<ExpiryBatch> {
  return apiPut<ExpiryBatch>(`/expiry-batches/${id}`, {
    storeId: data.store_id,
    quantity: data.quantity,
    note: data.note,
  });
}

/**
 * Delete an expiry batch
 * DELETE /expiry-batches-api/:storeId/:id
 */
export async function deleteExpiryBatch(id: string, storeId: string): Promise<{ success: boolean }> {
  console.log(`[API] deleteExpiryBatch id=${id} storeId=${storeId}`);
  return apiDelete<{ success: boolean }>(`/expiry-batches-api/${encodeURIComponent(storeId)}/${id}`);
}

/**
 * Get expiry batch statistics for a store
 * GET /expiry-batches-api/stats/:storeId
 */
export async function getExpiryBatchStats(storeId: string): Promise<ExpiryBatchStats> {
  return apiGet<ExpiryBatchStats>(`/expiry-batches-api/stats/${encodeURIComponent(storeId)}`);
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

// ============================================
// Daily Check API Methods
// ============================================

export interface DailyCheckSession {
  id: string;
  storeId: string;
  startedByMemberId: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  warningDays: number;
  totalChecked: number;
  totalDiscounted: number;
  totalSold: number;
  totalDiscarded: number;
  totalSkipped: number;
}

export interface DailyCheckProduct extends ExpiryBatch {
  // Inherits all ExpiryBatch fields
}

export interface DailyCheckAction {
  id: string;
  sessionId: string;
  expiryBatchId: string;
  actionType: 'checked' | 'discounted' | 'sold' | 'discarded' | 'skipped';
  performedByMemberId: string;
  performedAt: string;
}

/**
 * Start a new daily check session
 * POST /daily-check-api/sessions
 */
export async function startDailyCheckSession(data: {
  storeId: string;
  memberId: string;
  warningDays?: number;
}): Promise<DailyCheckSession> {
  console.log('[API] Starting daily check session:', data);
  return apiPost<DailyCheckSession>('/daily-check-api/sessions', {
    storeId: data.storeId,
    memberId: data.memberId,
    warningDays: data.warningDays || 7,
  });
}

/**
 * Get daily check sessions for a store
 * GET /daily-check-api/sessions/:storeId
 */
export async function getDailyCheckSessions(storeId: string): Promise<DailyCheckSession[]> {
  console.log('[API] Fetching daily check sessions for store:', storeId);
  return apiGet<DailyCheckSession[]>(`/daily-check-api/sessions/${encodeURIComponent(storeId)}`);
}

/**
 * Get products to check for a session
 * GET /daily-check-api/sessions/:sessionId/products
 */
export async function getDailyCheckProducts(sessionId: string): Promise<DailyCheckProduct[]> {
  console.log('[API] Fetching products for session:', sessionId);
  return apiGet<DailyCheckProduct[]>(`/daily-check-api/sessions/${sessionId}/products`);
}

/**
 * Record an action for a product in a session
 * POST /daily-check-api/actions
 */
export async function recordDailyCheckAction(data: {
  sessionId: string;
  expiryBatchId: string;
  actionType: 'checked' | 'discounted' | 'sold' | 'discarded' | 'skipped';
  memberId: string;
}): Promise<DailyCheckAction> {
  console.log('[API] Recording daily check action:', data);
  return apiPost<DailyCheckAction>('/daily-check-api/actions', {
    sessionId: data.sessionId,
    expiryBatchId: data.expiryBatchId,
    actionType: data.actionType,
    memberId: data.memberId,
  });
}

/**
 * Complete a daily check session
 * PUT /daily-check-api/sessions/:sessionId/complete
 */
export async function completeDailyCheckSession(sessionId: string): Promise<DailyCheckSession> {
  console.log('[API] Completing daily check session:', sessionId);
  return apiPut<DailyCheckSession>(`/daily-check-api/sessions/${sessionId}/complete`, {});
}
