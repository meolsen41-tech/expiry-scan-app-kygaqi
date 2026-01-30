
# 🧪 API Testing Guide

## Quick Test Commands (using curl)

### 1. Test Backend Health
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/entries/stats
```
Expected: `{"total":0,"fresh":0,"expiringSoon":0,"expired":0}`

### 2. Create a Test Product Entry
```bash
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/entries \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "1234567890123",
    "productName": "Test Milk",
    "category": "Dairy",
    "expirationDate": "2026-02-15",
    "quantity": 2,
    "location": "Shelf A1",
    "notes": "Test product"
  }'
```

### 3. Get All Products
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/entries
```

### 4. Look Up Product by Barcode
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/barcode/1234567890123
```

### 5. Get Updated Statistics
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/entries/stats
```
Expected: `{"total":1,"fresh":1,"expiringSoon":0,"expired":0}`

## Testing in the App

### Scenario 1: First Time User
1. Open app → See empty state with 0 statistics
2. Tap "Scan Barcode"
3. Enter barcode manually: `1234567890123`
4. Fill form:
   - Product Name: `Organic Milk`
   - Expiration Date: `2026-02-15`
   - Category: `Dairy`
5. Tap "Save Product"
6. Return to Home → See statistics updated (Total: 1, Fresh: 1)

### Scenario 2: Scanning Known Product
1. Create a product with barcode `9876543210987`
2. Go to scanner again
3. Enter the same barcode `9876543210987`
4. Product name and category should auto-fill
5. Change expiration date and save
6. This creates a new entry (for tracking multiple batches)

### Scenario 3: Managing Products
1. From Home, tap "View All"
2. See list of all products
3. Use search to find specific products
4. Filter by status (Fresh, Expiring, Expired)
5. Delete unwanted products

### Scenario 4: Expiring Products
1. Create a product with expiration date 3 days from now
2. Status should show "Expiring Soon" (amber)
3. Create a product with past expiration date
4. Status should show "Expired" (red)
5. Home screen statistics should reflect these statuses

## Expected Console Output

When everything is working correctly, you should see:

```
[API] Backend URL: https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev
[API] GET .../api/products/entries/stats
[API] Response status: 200
[API] Success: {"total":0,"fresh":0,"expiringSoon":0,"expired":0}
HomeScreen: Stats loaded: {"total":0,"fresh":0,"expiringSoon":0,"expired":0}
[API] GET .../api/products/entries
[API] Response status: 200
[API] Success: []
HomeScreen: Entries loaded: 0 items
```

## Common Test Data

### Test Barcodes
- `1234567890123` - Generic test barcode
- `9876543210987` - Alternative test barcode
- `5901234123457` - EAN-13 format
- `012345678905` - UPC-A format

### Test Products
1. **Fresh Product**
   - Name: `Fresh Milk`
   - Expiration: 30 days from now
   - Expected Status: Fresh (green)

2. **Expiring Soon Product**
   - Name: `Yogurt`
   - Expiration: 3 days from now
   - Expected Status: Expiring Soon (amber)

3. **Expired Product**
   - Name: `Old Cheese`
   - Expiration: 5 days ago
   - Expected Status: Expired (red)

## Verification Points

✅ **API Integration**
- [ ] Backend URL loads from app.json
- [ ] Stats endpoint returns data
- [ ] Entries endpoint returns array
- [ ] POST creates new entries
- [ ] DELETE removes entries
- [ ] Barcode lookup works

✅ **UI Functionality**
- [ ] Home screen displays statistics
- [ ] Scanner screen opens
- [ ] Camera permissions requested
- [ ] Form validation works
- [ ] Products list displays entries
- [ ] Search filters products
- [ ] Status filters work
- [ ] Delete confirmation modal appears

✅ **Data Flow**
- [ ] Creating product updates home stats
- [ ] Deleting product updates list
- [ ] Screen focus refreshes data
- [ ] Status colors match expiration dates

## Performance Checks

- API response time: < 1 second
- Image upload time: < 3 seconds
- Screen navigation: Smooth, no lag
- List scrolling: 60 FPS

## Error Handling

Test these error scenarios:
1. **Network Error**: Turn off WiFi → Should show error modal
2. **Invalid Date**: Enter `abc` as date → Should validate
3. **Missing Fields**: Try to save without required fields → Should show warning
4. **Delete Confirmation**: Cancel delete → Product should remain

---

**All tests passing?** ✅ Integration is complete and working!
