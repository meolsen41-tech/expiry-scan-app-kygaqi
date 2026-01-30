
# Translation Keys Reference

Quick reference for all available translation keys in the app.

## Common

```typescript
t('common.cancel')      // "Cancel" / "Avbryt"
t('common.save')        // "Save" / "Lagre"
t('common.delete')      // "Delete" / "Slett"
t('common.confirm')     // "Confirm" / "Bekreft"
t('common.ok')          // "OK" / "OK"
t('common.yes')         // "Yes" / "Ja"
t('common.no')          // "No" / "Nei"
t('common.loading')     // "Loading..." / "Laster..."
t('common.error')       // "Error" / "Feil"
t('common.success')     // "Success" / "Suksess"
t('common.warning')     // "Warning" / "Advarsel"
t('common.back')        // "Back" / "Tilbake"
t('common.close')       // "Close" / "Lukk"
t('common.search')      // "Search" / "Søk"
t('common.filter')      // "Filter" / "Filter"
t('common.all')         // "All" / "Alle"
t('common.required')    // "Required" / "Påkrevd"
t('common.optional')    // "Optional" / "Valgfritt"
```

## Home Screen

```typescript
t('home.title')                  // "Expiry Scan" / "Utløpsskanning"
t('home.subtitle')               // "Track product expiration dates"
t('home.totalProducts')          // "Total Products"
t('home.fresh')                  // "Fresh" / "Fersk"
t('home.expiringSoon')           // "Expiring Soon" / "Utløper Snart"
t('home.expired')                // "Expired" / "Utløpt"
t('home.scanBarcode')            // "Scan Barcode" / "Skann Strekkode"
t('home.batchScan')              // "Batch Scan" / "Batch-skanning"
t('home.notifications')          // "Notifications" / "Varsler"
t('home.teams')                  // "Teams" / "Team"
t('home.recentScans')            // "Recent Scans" / "Nylige Skanninger"
t('home.viewAll')                // "View All" / "Vis Alle"
t('home.noProducts')             // "No products scanned yet"
t('home.noProductsSubtext')      // "Tap 'Scan Barcode' to get started"
t('home.expires')                // "Expires" / "Utløper"
```

## Scanner Screen

```typescript
t('scanner.title')                        // "Scan Barcode" / "Skann Strekkode"
t('scanner.cameraPermissionRequired')     // "Camera Permission Required"
t('scanner.cameraPermissionMessage')      // "We need camera access..."
t('scanner.grantPermission')              // "Grant Permission"
t('scanner.requestingPermission')         // "Requesting camera permission..."
t('scanner.positionBarcode')              // "Position barcode within the frame"
t('scanner.orEnterManually')              // "Or enter manually"
t('scanner.enterManually')                // "Enter Barcode Manually"
t('scanner.productInformation')           // "Product Information"
t('scanner.barcode')                      // "Barcode" / "Strekkode"
t('scanner.productName')                  // "Product Name" / "Produktnavn"
t('scanner.expirationDate')               // "Expiration Date" / "Utløpsdato"
t('scanner.category')                     // "Category" / "Kategori"
t('scanner.quantity')                     // "Quantity" / "Antall"
t('scanner.location')                     // "Location" / "Plassering"
t('scanner.notes')                        // "Notes" / "Notater"
t('scanner.takePhoto')                    // "Take Photo" / "Ta Bilde"
t('scanner.choosePhoto')                  // "Choose Photo" / "Velg Bilde"
t('scanner.showOptional')                 // "Show Optional Fields"
t('scanner.hideOptional')                 // "Hide Optional Fields"
t('scanner.saveProduct')                  // "Save Product" / "Lagre Produkt"
t('scanner.saving')                       // "Saving..." / "Lagrer..."
t('scanner.scanAnother')                  // "Scan Another" / "Skann En Til"
t('scanner.loadingProductInfo')           // "Loading product info..."
t('scanner.missingInformation')           // "Missing Information"
t('scanner.missingInformationMessage')    // "Please fill in all required fields..."
t('scanner.successTitle')                 // "Success!" / "Suksess!"
t('scanner.successMessage')               // "Product has been saved successfully."
t('scanner.errorTitle')                   // "Error" / "Feil"
t('scanner.errorMessage')                 // "Failed to save product..."
```

## Products Screen

```typescript
t('products.title')                  // "All Products" / "Alle Produkter"
t('products.searchPlaceholder')      // "Search products..." / "Søk produkter..."
t('products.loadingProducts')        // "Loading products..."
t('products.noResults')              // "No results found"
t('products.noResultsSubtext')       // "Try a different search term"
t('products.noProducts')             // "No products yet"
t('products.noProductsSubtext')      // "Start scanning barcodes..."
t('products.deleteProduct')          // "Delete Product" / "Slett Produkt"
t('products.deleteConfirmMessage', { name: 'Product' })  // With parameter
t('products.deleted')                // "Deleted" / "Slettet"
t('products.deletedMessage')         // "Product has been deleted..."
t('products.deleteError')            // "Failed to delete product..."
t('products.expires')                // "Expires" / "Utløper"
t('products.quantity')               // "Quantity" / "Antall"
t('products.days')                   // "days" / "dager"
t('products.daysAgo')                // "days ago" / "dager siden"
```

## Notifications Screen

```typescript
t('notifications.title')                    // "Notifications" / "Varsler"
t('notifications.scheduledReminders')       // "Scheduled Reminders"
t('notifications.scheduledRemindersDesc')   // "Get automatic reminders..."
t('notifications.noSchedules')              // "No scheduled reminders"
t('notifications.noSchedulesSubtext')       // "Add a schedule..."
t('notifications.addSchedule')              // "Add Schedule"
t('notifications.scheduleType')             // "Schedule Type"
t('notifications.daily')                    // "Daily" / "Daglig"
t('notifications.weekly')                   // "Weekly" / "Ukentlig"
t('notifications.dayOfWeek')                // "Day of Week" / "Ukedag"
t('notifications.time')                     // "Time" / "Tid"
t('notifications.saveSchedule')             // "Save Schedule"
t('notifications.active')                   // "Active" / "Aktiv"
t('notifications.disabled')                 // "Disabled" / "Deaktivert"
t('notifications.testNotifications')        // "Test Notifications"
t('notifications.testNotificationsDesc')    // "Send a test notification..."
t('notifications.sendTest')                 // "Send Test Notification"
t('notifications.testSent')                 // "Test Sent"
t('notifications.testSentMessage', { count: 5 })  // With parameter
t('notifications.dailyAt', { time: '09:00' })     // With parameter
t('notifications.weeklyAt', { day: 'Monday', time: '09:00' })  // With parameters
t('notifications.monday')                   // "Monday" / "mandag"
t('notifications.tuesday')                  // "Tuesday" / "tirsdag"
// ... other days
```

## Batch Scan Screen

```typescript
t('batchScan.title')                    // "Batch Scanning" / "Batch-skanning"
t('batchScan.loadingBatches')           // "Loading batch scans..."
t('batchScan.noActiveBatch')            // "No Active Batch"
t('batchScan.noActiveBatchSubtext')     // "Create a batch..."
t('batchScan.createBatch')              // "Create Batch" / "Opprett Batch"
t('batchScan.createNewBatch')           // "Create New Batch"
t('batchScan.batchName')                // "Batch Name" / "Batch-navn"
t('batchScan.creating')                 // "Creating..." / "Oppretter..."
t('batchScan.create')                   // "Create" / "Opprett"
t('batchScan.batchCreated')             // "Batch Created"
t('batchScan.batchCreatedMessage', { name: 'Morning' })  // With parameter
t('batchScan.items')                    // "items" / "elementer"
t('batchScan.scan')                     // "Scan" / "Skann"
t('batchScan.itemsInBatch')             // "Items in Batch"
t('batchScan.addItemToBatch')           // "Add Item to Batch"
t('batchScan.adding')                   // "Adding..." / "Legger til..."
t('batchScan.addItem')                  // "Add Item"
t('batchScan.itemAdded')                // "Item Added"
t('batchScan.itemAddedMessage', { name: 'Milk' })  // With parameter
t('batchScan.completeBatch')            // "Complete Batch"
t('batchScan.completeBatchConfirm', { count: 10 })  // With parameter
t('batchScan.batchCompleted')           // "Batch Completed"
t('batchScan.batchCompletedMessage', { count: 10 })  // With parameter
```

## Teams Screen

```typescript
t('teams.title')                    // "Teams" / "Team"
t('teams.loadingTeams')             // "Loading teams..."
t('teams.noTeams')                  // "No Teams Yet"
t('teams.noTeamsSubtext')           // "Create a team or join one..."
t('teams.createTeam')               // "Create Team" / "Opprett Team"
t('teams.joinTeam')                 // "Join Team" / "Bli Med i Team"
t('teams.teamName')                 // "Team Name" / "Teamnavn"
t('teams.inviteCode')               // "Invite Code" / "Invitasjonskode"
t('teams.creating')                 // "Creating..." / "Oppretter..."
t('teams.joining')                  // "Joining..." / "Blir med..."
t('teams.create')                   // "Create" / "Opprett"
t('teams.join')                     // "Join" / "Bli Med"
t('teams.teamCreated')              // "Team Created"
t('teams.teamCreatedMessage', { name: 'Team A', code: 'ABC123' })  // With parameters
t('teams.joinedTeam')               // "Joined Team"
t('teams.joinedTeamMessage', { name: 'Team A' })  // With parameter
t('teams.members')                  // "Members" / "Medlemmer"
t('teams.owner')                    // "Owner" / "Eier"
t('teams.member')                   // "Member" / "Medlem"
t('teams.yourRole')                 // "Your Role" / "Din Rolle"
t('teams.deleteTeam')               // "Delete Team" / "Slett Team"
t('teams.leaveTeam')                // "Leave Team" / "Forlat Team"
t('teams.teamProducts')             // "Team Products" / "Teamprodukter"
t('teams.scannedBy')                // "Scanned by" / "Skannet av"
```

## Status

```typescript
t('status.fresh')          // "Fresh" / "Fersk"
t('status.expiringSoon')   // "Expiring Soon" / "Utløper Snart"
t('status.expired')        // "Expired" / "Utløpt"
```

## Settings

```typescript
t('settings.language')         // "Language" / "Språk"
t('settings.languageNote')     // "The app language will change immediately..."
```

## Usage Examples

### Simple Translation

```typescript
const { t } = useLanguage();
const title = t('home.title');
```

### Translation with Parameters

```typescript
const { t } = useLanguage();
const message = t('notifications.testSentMessage', { count: 5 });
// English: "Sent 5 expiration reminder(s)."
// Norwegian: "Sendte 5 utløpspåminnelse(r)."
```

### Multiple Parameters

```typescript
const { t } = useLanguage();
const schedule = t('notifications.weeklyAt', { day: 'Monday', time: '09:00' });
// English: "Every Monday at 09:00"
// Norwegian: "Hver mandag kl. 09:00"
```

### Conditional Text

```typescript
const { t } = useLanguage();
const statusText = status === 'fresh' 
  ? t('status.fresh') 
  : status === 'expiring_soon'
  ? t('status.expiringSoon')
  : t('status.expired');
```

---

**Note**: All translation keys are case-sensitive and use dot notation for nested keys.
