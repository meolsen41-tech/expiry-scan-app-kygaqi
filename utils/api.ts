
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API] Success:`, data);
    return data;
  } catch (error) {
    console.error(`[API] Error:`, error);
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
// Product API Methods
// ============================================

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductEntry {
  id: string;
  productId: string;
  barcode: string;
  productName: string;
  category?: string;
  expirationDate: string;
  quantity: number;
  location?: string;
  notes?: string;
  imageUrl?: string;
  status: 'fresh' | 'expiring_soon' | 'expired';
  createdAt: string;
  updatedAt?: string;
}

export interface ProductStats {
  total: number;
  fresh: number;
  expiringSoon: number;
  expired: number;
}

/**
 * Look up product by barcode
 * GET /api/products/barcode/:barcode
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    return await apiGet<Product>(`/api/products/barcode/${barcode}`);
  } catch (error: any) {
    // Return null if product not found (404)
    if (error.message?.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update product master data
 * POST /api/products
 */
export async function createOrUpdateProduct(data: {
  barcode: string;
  name: string;
  category?: string;
  imageUrl?: string;
}): Promise<Product> {
  return apiPost<Product>('/api/products', data);
}

/**
 * Get all product entries
 * GET /api/products/entries
 * Optionally filter by storeId
 */
export async function getProductEntries(storeId?: string): Promise<ProductEntry[]> {
  const endpoint = storeId
    ? `/api/products/entries?storeId=${encodeURIComponent(storeId)}`
    : '/api/products/entries';
  return apiGet<ProductEntry[]>(endpoint);
}

/**
 * Create a new product entry
 * POST /api/products/entries
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
  return apiPost<ProductEntry>('/api/products/entries', data);
}

/**
 * Update product entry
 * PUT /api/products/entries/:id
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
  }
): Promise<ProductEntry> {
  return apiPut<ProductEntry>(`/api/products/entries/${id}`, data);
}

/**
 * Delete product entry
 * DELETE /api/products/entries/:id
 */
export async function deleteProductEntry(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/api/products/entries/${id}`);
}

/**
 * Get product entry statistics
 * GET /api/products/entries/stats
 */
export async function getProductStats(): Promise<ProductStats> {
  return apiGet<ProductStats>('/api/products/entries/stats');
}
