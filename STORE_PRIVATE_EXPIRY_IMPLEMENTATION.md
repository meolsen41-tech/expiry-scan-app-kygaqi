
# Store-Private Expiry Tracking + Global Barcode Image Library

## Implementation Summary

This implementation provides a complete store-private expiry tracking system with a global barcode image library, following the Supabase architecture requirements.

## Database Schema

### Tables

1. **stores**
   - `id` (uuid, primary key)
   - `name` (text, required)
   - `store_code` (text, unique, human-friendly like DSK-7F3K)
   - `created_at` (timestamp)

2. **store_members**
   - `id` (uuid, primary key)
   - `store_id` (uuid, foreign key to stores)
   - `nickname` (text, required)
   - `device_id` (text, required)
   - `role` ('admin' | 'staff')
   - `joined_at` (timestamp)

3. **products** (Global - readable by all stores)
   - `barcode` (text, primary key, unique)
   - `name` (text, optional)
   - `primary_image_url` (text, optional)
   - `primary_image_source_store_id` (uuid, optional)
   - `primary_image_source_member_id` (uuid, optional)
   - `created_at` (timestamp)

4. **product_images** (Global - readable by all stores)
   - `id` (uuid, primary key)
   - `barcode` (text, foreign key to products)
   - `image_url` (text, required)
   - `uploaded_by_store_id` (uuid, required)
   - `uploaded_by_member_id` (uuid, required)
   - `is_primary` (boolean, default false)
   - `created_at` (timestamp)

5. **expiry_batches** (Store-private - filtered by store_id)
   - `id` (uuid, primary key)
   - `store_id` (uuid, foreign key to stores)
   - `barcode` (text, foreign key to products)
   - `expiry_date` (date, required)
   - `quantity` (integer, required)
   - `note` (text, optional)
   - `added_by_member_id` (uuid, foreign key to store_members)
   - `added_at` (timestamp)

## Key Rules

### Privacy & Access Control
- **Store-Private Data**: `expiry_batches` and `store_members` are filtered by `store_id`
- **Global Data**: `products` and `product_images` are readable by all stores
- Stores can only read/write their own expiry batches and members

### Image Management
- First image uploaded for a product becomes the primary image (`is_primary=true`)
- Subsequent images are marked as `is_primary=false`
- Primary image cannot be changed in v1 (future feature)
- All stores can view all product images but cannot modify primary status

### Product Scanning Flow
1. Scan barcode → fetch `products.primary_image_url`
2. If product not found:
   - Prompt user to take photo
   - Create `products` entry
   - Create `product_images` entry with `is_primary=true`
3. If product found:
   - Display existing product name and primary image
   - Allow adding expiry batch

### Expiry Batch Creation
- **Required fields**: `expiry_date`, `quantity`
- **Optional fields**: `note`
- Automatically includes: `store_id`, `barcode`, `added_by_member_id`, `added_at`

### UI Grouping
- Expiry batches are grouped by `barcode` + `expiry_date`
- Quantities are summed for each group
- Color-coded by status: green (fresh), yellow (expiring), red (expired)

## API Endpoints

### Products (Global)
- `GET /api/products/:barcode` - Get product by barcode
- `POST /api/products` - Create new product
- `GET /api/products/:barcode/images` - Get all images for a product
- `POST /api/products/:barcode/images` - Upload new image for a product

### Expiry Batches (Store-Private)
- `GET /api/stores/:storeId/expiry-batches` - Get expiry batches for a store
- `POST /api/stores/:storeId/expiry-batches` - Create expiry batch
- `DELETE /api/stores/:storeId/expiry-batches/:id` - Delete expiry batch

### Stores & Members
- `POST /api/stores` - Create new store (generates store_code)
- `POST /api/stores/join` - Join store by store_code
- `GET /api/stores/current?deviceId=xxx` - Get current store for device
- `GET /api/stores/:storeId/members` - Get store members

## Frontend Implementation

### Updated Files

1. **utils/i18n.ts**
   - Added Norwegian translations for new buttons:
     - "Legg til dato" (Add Expiry Date)
     - "Last opp bedre bilde" (Upload Better Image)
     - "Se flere bilder" (View More Images)
     - "Lagre" (Save)
     - "Opprett butikk" (Create Store)
     - "Koble til butikk" (Join Store)
   - Updated role labels: 'admin' and 'staff' (instead of 'owner' and 'member')

2. **utils/api.ts**
   - Updated `Product` interface to include `primaryImageSourceStoreId` and `primaryImageSourceMemberId`
   - Updated `uploadProductImage` to send correct field names

3. **utils/stores.ts**
   - Changed `joinCode` to `storeCode` throughout
   - Updated role types from 'owner'|'member' to 'admin'|'staff'
   - Updated `getCurrentStore` to use new endpoint: `GET /api/stores/current?deviceId=xxx`

4. **app/(tabs)/butikk.tsx** and **app/(tabs)/butikk.ios.tsx**
   - Updated to use `storeCode` instead of `joinCode`
   - Updated role labels to 'admin' and 'staff'
   - Updated all references to display correct terminology

5. **app/(tabs)/(home)/scanner.tsx**
   - Already implements the correct flow:
     - Scans barcode → fetches product
     - If product not found, prompts for name and photo
     - Creates product and uploads image
     - Creates expiry batch with required fields

## Store Code Format

Store codes are human-friendly, 8-character codes:
- Format: `XXX-XXXX` (e.g., `DSK-7F3K`)
- Uppercase letters and numbers
- Avoids confusing characters: O/0, I/1
- Easy to share and type

## User Flow

### First-Time Setup
1. User opens "Butikk" tab
2. Chooses "Opprett butikk" (Create Store) or "Koble til butikk" (Join Store)
3. If creating: enters store name and nickname → receives store code
4. If joining: enters store code and nickname → joins existing store

### Scanning Products
1. User taps "Scan Barcode" on home screen
2. Scans barcode with camera
3. If product exists:
   - Shows product name and primary image
   - User enters expiry date and quantity
   - Saves expiry batch
4. If product doesn't exist:
   - User enters product name
   - Takes/uploads photo
   - Creates product globally
   - User enters expiry date and quantity
   - Saves expiry batch

### Viewing Expiry Batches
1. User opens "All Products" screen
2. Sees grouped list of expiry batches
3. Each group shows:
   - Product name and image
   - Expiry date
   - Total quantity (summed)
   - Status color (green/yellow/red)
4. Can delete batches (with confirmation)

## Backend Integration Status

The backend has been updated with the new schema and API endpoints. The changes include:
- Renamed `stores.join_code` to `stores.store_code`
- Renamed `members` table to `store_members`
- Updated `products` table with new source tracking fields
- Implemented all required API endpoints
- Added proper access control for store-private data

## Next Steps

The implementation is complete and ready for testing. Key features to test:
1. Store creation and joining with new store codes
2. Product scanning and creation flow
3. Image upload and primary image assignment
4. Expiry batch creation and grouping
5. Store-private data isolation
6. Global product/image sharing across stores
