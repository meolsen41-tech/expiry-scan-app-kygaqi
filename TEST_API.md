
# 🧪 API Testing Guide

## Quick Test Commands (using curl)

### Basic Product Management

#### 1. Test Backend Health
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/entries/stats
```
Expected: `{"total":0,"fresh":0,"expiringSoon":0,"expired":0}`

#### 2. Create a Test Product Entry
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

#### 3. Get All Products
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/entries
```

#### 4. Look Up Product by Barcode
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/barcode/1234567890123
```

#### 5. Get Updated Statistics
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/products/entries/stats
```
Expected: `{"total":1,"fresh":1,"expiringSoon":0,"expired":0}`

### Push Notifications

#### 6. Register Push Token
```bash
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/notifications/register-token \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_device_123",
    "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "ios"
  }'
```

#### 7. Create Weekly Notification Schedule
```bash
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/notifications/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_device_123",
    "scheduleType": "weekly",
    "dayOfWeek": 1,
    "timeOfDay": "09:00"
  }'
```

#### 8. Get Notification Schedules
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/notifications/schedules/test_device_123
```

#### 9. Send Test Expiration Reminders
```bash
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/notifications/send-expiration-reminders \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_device_123"
  }'
```

### Batch Scanning

#### 10. Create Batch Scan
```bash
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/batch-scans \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_device_123",
    "batchName": "Morning Stock Check"
  }'
```

#### 11. Add Item to Batch
```bash
# Replace {batchId} with actual batch ID from step 10
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/batch-scans/{batchId}/items \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "1234567890123",
    "productName": "Test Milk",
    "expirationDate": "2026-02-15",
    "category": "Dairy",
    "quantity": 2
  }'
```

#### 12. Get Batch Items
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/batch-scans/{batchId}/items
```

#### 13. Complete Batch Scan
```bash
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/batch-scans/{batchId}/complete
```

#### 14. Get All Batches
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/batch-scans/test_device_123
```

### Team Collaboration

#### 15. Create Team
```bash
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_device_123",
    "teamName": "Store Team A",
    "deviceName": "iPhone 15"
  }'
```

#### 16. Join Team with Invite Code
```bash
# Replace {inviteCode} with actual code from step 15
curl -X POST https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/teams/join \
  -H "Content-Type: application/json" \
  -d '{
    "inviteCode": "ABC123",
    "deviceId": "test_device_456",
    "deviceName": "iPad Pro"
  }'
```

#### 17. Get Teams for Device
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/teams/test_device_123
```

#### 18. Get Team Members
```bash
# Replace {teamId} with actual team ID
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/teams/{teamId}/members
```

#### 19. Get Team Entries
```bash
curl https://yf2jn49tsq3c3ucam6esjarj9eh5g3xq.app.specular.dev/api/teams/{teamId}/entries
```

## Testing in the App

### Scenario 1: First Time User (Basic Product Scanning)
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

### Scenario 5: Push Notifications Setup
1. From Home, tap "Notifications"
2. Grant notification permissions when prompted
3. See push token registered automatically
4. Tap "Add Schedule"
5. Select "Weekly" schedule type
6. Choose "Monday" and time "09:00"
7. Tap "Save Schedule"
8. See schedule appear in list with toggle enabled
9. Tap "Send Test Notification" to verify it works
10. Toggle schedule off/on to test enable/disable
11. Delete schedule to test removal

### Scenario 6: Batch Scanning Mode
1. From Home, tap "Batch Scan"
2. Tap "Create Batch"
3. Enter batch name: "Morning Stock Check"
4. Tap "Create"
5. Tap "Scan" button to start scanning
6. Scan or enter barcode: `1234567890123`
7. Fill in product details and tap "Add Item"
8. Notice item count increases
9. Scan multiple items (repeat steps 6-8)
10. Tap "Complete Batch" when done
11. Verify all items are created as product entries
12. Check Home screen to see updated statistics

### Scenario 7: Team Collaboration
1. From Home, tap "Teams"
2. Tap "Create Team"
3. Enter team name: "Store Team A"
4. Tap "Create"
5. Note the 6-character invite code (e.g., "ABC123")
6. Share invite code with team member
7. Team member opens app → Teams → "Join Team"
8. Enter invite code and tap "Join"
9. Both devices should see team with 2 members
10. Tap on team to view details
11. See list of team members
12. See shared product entries from all team members
13. Test "Leave Team" (for member) or "Delete Team" (for owner)

### Scenario 8: Complete Workflow Test
1. **Setup**: Create team and add 2 members
2. **Batch Scan**: Member 1 creates batch "Morning Check"
3. **Scan Items**: Add 5 products to batch
4. **Complete**: Complete batch to create entries
5. **Notifications**: Set up weekly reminder for Monday 9am
6. **Team View**: Member 2 views team entries
7. **Verify**: All 5 products visible to both members
8. **Test Reminder**: Send test notification
9. **Cleanup**: Delete expired products
10. **Stats**: Verify statistics are accurate across team

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
- [ ] Push token registration works
- [ ] Notification schedules CRUD operations work
- [ ] Batch scan creation and completion work
- [ ] Team creation and joining work
- [ ] Team entries aggregation works

✅ **UI Functionality - Basic**
- [ ] Home screen displays statistics
- [ ] Scanner screen opens
- [ ] Camera permissions requested
- [ ] Form validation works
- [ ] Products list displays entries
- [ ] Search filters products
- [ ] Status filters work
- [ ] Delete confirmation modal appears

✅ **UI Functionality - Notifications**
- [ ] Notifications screen accessible from home
- [ ] Push permission request appears
- [ ] Schedule creation form works
- [ ] Weekly/Daily toggle works
- [ ] Day of week selector works
- [ ] Time selection works
- [ ] Schedule list displays correctly
- [ ] Toggle enable/disable works
- [ ] Delete schedule confirmation works
- [ ] Test notification button works

✅ **UI Functionality - Batch Scanning**
- [ ] Batch scan screen accessible from home
- [ ] Create batch form works
- [ ] Batch name validation works
- [ ] Scanner opens in batch mode
- [ ] Items added to batch correctly
- [ ] Item count updates in real-time
- [ ] Batch items list displays
- [ ] Complete batch creates entries
- [ ] Completed batches show in history
- [ ] Delete batch confirmation works

✅ **UI Functionality - Teams**
- [ ] Teams screen accessible from home
- [ ] Create team form works
- [ ] Invite code generated (6 chars)
- [ ] Join team with code works
- [ ] Invalid code shows error
- [ ] Teams list displays correctly
- [ ] Team details show members
- [ ] Team entries aggregated correctly
- [ ] Leave team confirmation works
- [ ] Delete team (owner only) works
- [ ] Role badges display correctly

✅ **Data Flow**
- [ ] Creating product updates home stats
- [ ] Deleting product updates list
- [ ] Screen focus refreshes data
- [ ] Status colors match expiration dates
- [ ] Batch completion creates product entries
- [ ] Team entries update across devices
- [ ] Notification schedules persist
- [ ] Device ID generated and stored

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
