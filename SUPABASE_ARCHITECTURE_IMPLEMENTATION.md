
# Supabase Cloud Architecture Implementation

## Overview
Successfully implemented a cloud (Supabase) architecture where stores are isolated by `store_id` and cannot see each other's expiry data, but products are shared globally by barcode.

## Database Schema

### 1. **products** (Global, Shared by Barcode)
- `barcode` (text, unique, primary key) - Global product identifier
- `name` (text, nullable) - Product name (optional)
- `primaryImageUrl` (text, nullable) - URL of the primary product image
- `primaryImageSource` (text, nullable) - Source of the primary image
- `createdAt` (timestamp, required)

**Purpose:** Shared product catalog accessible to all stores. Products are identified by barcode and can be created by any store.

### 2. **product_images** (Global with Store Attribution)
- `id` (uuid, primary key)
- `barcode` (text, required, foreign key to products.barcode)
- `imageUrl` (text, required) - URL of the uploaded image
- `uploadedByStoreId` (uuid, required) - Store that uploaded this image
- `uploadedByMemberId` (uuid, required) - Member who uploaded this image
- `createdAt` (timestamp, required)
- `isPrimary` (boolean, default false) - Whether this is the primary image

**Rules:**
- First uploaded image for a barcode becomes primary
- Other stores can upload additional images but cannot change primary (v1)
- App always shows primary first with option to view more images

### 3. **expiry_batches** (Store-Specific, Isolated)
- `id` (uuid, primary key)
- `storeId` (uuid, required) - Store this batch belongs to (CRITICAL for isolation)
- `barcode` (text, required, foreign key to products.barcode)
- `expiryDate` (date, required) - Expiration date (YYYY-MM-DD)
- `quantity` (integer, required) - Number of items in this batch
- `addedByMemberId` (uuid, required) - Member who added this batch
- `addedAt` (timestamp, required)
- `note` (text, nullable) - Optional note about this batch

**Purpose:** Store-specific expiry tracking. Each store only sees their own batches. Multiple batches can exist for the same barcode+expiry_date combination.

## API Endpoints

### Product Management (Global)

#### GET /api/products/:barcode
Fetch product details by barcode.
- **Returns:** `{ barcode, name, primaryImageUrl, primaryImageSource, createdAt }` or 404

#### POST /api/products
Create a new product entry.
- **Body:** `{ barcode: string, name?: string }`
- **Returns:** Created product

#### PUT /api/products/:barcode
Update product name (only if name is currently null or empty).
- **Body:** `{ name: string }`
- **Returns:** Updated product

### Product Images (Global with Store Attribution)

#### GET /api/products/:barcode/images
Fetch all images for a product.
- **Returns:** Array of images sorted by isPrimary DESC, createdAt ASC

#### POST /api/products/:barcode/images
Upload a new image for a product.
- **Body:** `{ imageUrl: string, uploadedByStoreId: string, uploadedByMemberId: string }`
- **Logic:** First image becomes primary automatically
- **Returns:** Created image

### Expiry Batches (Store-Specific)

#### GET /api/expiry-batches?storeId=xxx&status=xxx
Fetch expiry batches for a specific store.
- **Query params:** `storeId` (required), `status` (optional: 'all' | 'fresh' | 'expiring' | 'expired')
- **Returns:** Array of batches with joined product info (productName, primaryImageUrl)
- **Isolation:** Filtered by storeId (CRITICAL)

#### POST /api/expiry-batches
Create a new expiry batch.
- **Body:** `{ storeId, barcode, expiryDate, quantity, addedByMemberId, note? }`
- **Returns:** Created batch

#### PUT /api/expiry-batches/:id
Update an expiry batch (quantity or note).
- **Body:** `{ storeId, quantity?, note? }`
- **Security:** Verifies storeId matches batch's storeId
- **Returns:** Updated batch

#### DELETE /api/expiry-batches/:id?storeId=xxx
Delete an expiry batch.
- **Query param:** `storeId` (required)
- **Security:** Verifies storeId matches batch's storeId
- **Returns:** `{ success: true }`

#### GET /api/expiry-batches/stats?storeId=xxx
Get statistics for a store's expiry batches.
- **Query param:** `storeId` (required)
- **Returns:** `{ total, fresh, expiring, expired }`
- **Status calculation:** fresh (>7 days), expiring (1-7 days), expired (<=0 days)

## Frontend Implementation

### Flow

1. **Scan Barcode** → Fetch product by barcode
2. **If product exists:**
   - Display product name and primary image
   - Show all available images (with count)
   - User enters expiry date + quantity
3. **If product doesn't exist:**
   - Prompt user to enter product name
   - Prompt user to take/upload photo
   - Create product + upload image (becomes primary)
   - User enters expiry date + quantity
4. **Save** → Create expiry batch linked to store

### UI Features

#### Home Screen (index.tsx)
- Shows statistics for current store only (total, fresh, expiring, expired)
- Displays recent expiry batches with product names and images
- Color-coded status badges (green/yellow/red)

#### Scanner Screen (scanner.tsx)
- Scans barcode using camera
- Fetches product info from global catalog
- If new product: prompts for name + photo
- If existing product: shows product info and images
- Creates expiry batch for current store

#### Products Screen (products.tsx)
- **Groups batches by barcode + expiryDate**
- **Shows summed quantity** for each group
- Color-coded by days until expiration:
  - Green: Fresh (>7 days)
  - Yellow: Expiring (1-7 days)
  - Red: Expired (<=0 days)
- Filter by status (all/fresh/expiring/expired)
- Search by product name or barcode
- Delete entire groups (all batches for a barcode+date)

### Store Isolation

All expiry batch operations require `currentStore.id` from `StoreContext`:
- Home screen stats filtered by store
- Products list filtered by store
- Scanner creates batches for current store
- Delete operations verify store ownership

### Data Types (utils/api.ts)

```typescript
interface Product {
  barcode: string;
  name?: string;
  primaryImageUrl?: string;
  primaryImageSource?: string;
  createdAt: string;
}

interface ProductImage {
  id: string;
  barcode: string;
  imageUrl: string;
  uploadedByStoreId: string;
  uploadedByMemberId: string;
  createdAt: string;
  isPrimary: boolean;
}

interface ExpiryBatch {
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
```

## Security & Isolation

1. **Store Isolation:** All expiry batch endpoints require `storeId` parameter
2. **Ownership Verification:** Update/Delete operations verify storeId matches
3. **Global Products:** Products and images are shared but attributed to uploading store
4. **Member Attribution:** All operations track which member performed them

## Migration Notes

- Existing `stores` and `members` tables unchanged
- Old `product_entries` migrated to `expiry_batches`
- Old `products` table restructured with barcode as primary key
- Product images extracted to separate `product_images` table

## Verified Implementation

✅ Backend API complete and deployed
✅ Frontend updated to use new architecture
✅ Store isolation implemented
✅ Product sharing by barcode working
✅ Image management with primary/additional images
✅ Grouping by barcode+expiry_date with summed quantities
✅ Color-coded status based on days until expiration
✅ All API endpoints verified against OpenAPI spec
