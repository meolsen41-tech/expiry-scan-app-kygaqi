
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'no';

const LANGUAGE_KEY = '@app_language';

// Translation strings
const translations = {
  en: {
    // Common
    common: {
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      confirm: 'Confirm',
      ok: 'OK',
      yes: 'Yes',
      no: 'No',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      back: 'Back',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      required: 'Required',
      optional: 'Optional',
    },

    // Home Screen
    home: {
      title: 'Expiry Scan',
      subtitle: 'Track product expiration dates',
      totalProducts: 'Total Products',
      fresh: 'Fresh',
      expiringSoon: 'Expiring Soon',
      expired: 'Expired',
      scanBarcode: 'Scan Barcode',
      batchScan: 'Batch Scan',
      notifications: 'Notifications',
      teams: 'Teams',
      recentScans: 'Recent Scans',
      viewAll: 'View All',
      noProducts: 'No products scanned yet',
      noProductsSubtext: 'Tap "Scan Barcode" to get started',
      expires: 'Expires',
    },

    // Scanner Screen
    scanner: {
      title: 'Scan Barcode',
      cameraPermissionRequired: 'Camera Permission Required',
      cameraPermissionMessage: 'We need camera access to scan barcodes',
      grantPermission: 'Grant Permission',
      requestingPermission: 'Requesting camera permission...',
      positionBarcode: 'Position barcode within the frame',
      orEnterManually: 'Or enter manually',
      enterManually: 'Enter Barcode Manually',
      productInformation: 'Product Information',
      barcode: 'Barcode',
      productName: 'Product Name',
      expirationDate: 'Expiration Date',
      category: 'Category',
      quantity: 'Quantity',
      location: 'Location',
      notes: 'Notes',
      takePhoto: 'Take Photo',
      choosePhoto: 'Choose Photo',
      showOptional: 'Show Optional Fields',
      hideOptional: 'Hide Optional Fields',
      saveProduct: 'Save',
      saving: 'Saving...',
      scanAnother: 'Scan Another',
      loadingProductInfo: 'Loading product info...',
      missingInformation: 'Missing Information',
      missingInformationMessage: 'Please fill in all required fields: Barcode, Product Name, and Expiration Date.',
      successTitle: 'Success!',
      successMessage: 'Product has been saved successfully.',
      errorTitle: 'Error',
      errorMessage: 'Failed to save product. Please try again.',
      enterBarcode: 'Enter barcode',
      enterProductName: 'Enter product name',
      datePlaceholder: 'YYYY-MM-DD',
      categoryPlaceholder: 'e.g., Dairy, Meat, Produce',
      quantityPlaceholder: '1',
      locationPlaceholder: 'e.g., Shelf A3, Cooler 2',
      notesPlaceholder: 'Additional notes',
      addExpiryDate: 'Add Expiry Date',
      uploadBetterImage: 'Upload Better Image',
      viewMoreImages: 'View More Images',
    },

    // Products Screen
    products: {
      title: 'All Products',
      searchPlaceholder: 'Search products...',
      loadingProducts: 'Loading products...',
      noResults: 'No results found',
      noResultsSubtext: 'Try a different search term',
      noProducts: 'No products yet',
      noProductsSubtext: 'Start scanning barcodes to track products',
      deleteProduct: 'Delete Product',
      deleteConfirmMessage: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
      deleted: 'Deleted',
      deletedMessage: 'Product has been deleted successfully.',
      deleteError: 'Failed to delete product. Please try again.',
      expires: 'Expires',
      quantity: 'Quantity',
      days: 'days',
      daysAgo: 'days ago',
      fresh: 'Fresh',
      expiringSoon: 'Expiring Soon',
      expired: 'Expired',
    },

    // Notifications Screen
    notifications: {
      title: 'Notifications',
      scheduledReminders: 'Scheduled Reminders',
      scheduledRemindersDesc: 'Get automatic reminders about products expiring soon',
      noSchedules: 'No scheduled reminders',
      noSchedulesSubtext: 'Add a schedule to get automatic notifications',
      addSchedule: 'Add Schedule',
      scheduleType: 'Schedule Type',
      daily: 'Daily',
      weekly: 'Weekly',
      dayOfWeek: 'Day of Week',
      time: 'Time',
      saveSchedule: 'Save Schedule',
      active: 'Active',
      disabled: 'Disabled',
      testNotifications: 'Test Notifications',
      testNotificationsDesc: 'Send a test notification for products expiring soon',
      sendTest: 'Send Test Notification',
      testSent: 'Test Sent',
      testSentMessage: 'Sent {count} expiration reminder(s).',
      scheduleCreated: 'Notification schedule created successfully.',
      scheduleDeleted: 'Notification schedule deleted.',
      updateError: 'Failed to update notification schedule.',
      deleteError: 'Failed to delete notification schedule.',
      createError: 'Failed to create notification schedule.',
      testError: 'Failed to send test notification.',
      loadingSettings: 'Loading notification settings...',
      pushNotUnavailable: 'Push notifications are not available. Please enable notifications in your device settings.',
      dailyAt: 'Daily at {time}',
      weeklyAt: 'Every {day} at {time}',
      sunday: 'Sunday',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
    },

    // Batch Scan Screen
    batchScan: {
      title: 'Batch Scanning',
      loadingBatches: 'Loading batch scans...',
      noActiveBatch: 'No Active Batch',
      noActiveBatchSubtext: 'Create a batch to start scanning multiple items',
      createBatch: 'Create Batch',
      createNewBatch: 'Create New Batch',
      batchName: 'Batch Name',
      batchNamePlaceholder: 'e.g., Morning Stock Check',
      creating: 'Creating...',
      create: 'Create',
      batchCreated: 'Batch Created',
      batchCreatedMessage: 'Batch "{name}" is ready for scanning.',
      items: 'items',
      scan: 'Scan',
      scanBarcode: 'Scan barcode',
      itemsInBatch: 'Items in Batch',
      addItemToBatch: 'Add Item to Batch',
      adding: 'Adding...',
      addItem: 'Add Item',
      itemAdded: 'Item Added',
      itemAddedMessage: 'Added {name} to batch. Scan next item.',
      completeBatch: 'Complete Batch',
      completeBatchConfirm: 'This will create {count} product entries. Continue?',
      batchCompleted: 'Batch Completed',
      batchCompletedMessage: 'Created {count} product entries successfully.',
      deleteBatch: 'Delete Batch?',
      deleteBatchConfirm: 'This will delete the batch and all its items. This cannot be undone.',
      batchDeleted: 'Batch Deleted',
      batchDeletedMessage: 'Batch has been deleted successfully.',
      completedBatches: 'Completed Batches',
      completed: 'Completed',
      missingName: 'Missing Name',
      missingNameMessage: 'Please enter a batch name.',
      missingInfo: 'Missing Information',
      missingInfoMessage: 'Please fill in barcode, product name, and expiration date.',
      addError: 'Failed to add item to batch.',
      completeError: 'Failed to complete batch.',
      deleteError: 'Failed to delete batch.',
    },

    // Teams Screen
    teams: {
      title: 'Teams',
      loadingTeams: 'Loading teams...',
      noTeams: 'No Teams Yet',
      noTeamsSubtext: 'Create a team or join one with an invite code',
      createTeam: 'Create Team',
      joinTeam: 'Join Team',
      teamName: 'Team Name',
      teamNamePlaceholder: 'e.g., Store Team A',
      inviteCode: 'Invite Code',
      inviteCodePlaceholder: 'Enter 6-character code',
      creating: 'Creating...',
      joining: 'Joining...',
      create: 'Create',
      join: 'Join',
      teamCreated: 'Team Created',
      teamCreatedMessage: 'Team "{name}" created. Share invite code: {code}',
      joinedTeam: 'Joined Team',
      joinedTeamMessage: 'Successfully joined "{name}".',
      members: 'Members',
      owner: 'Owner',
      member: 'Member',
      yourRole: 'Your Role',
      code: 'Code',
      inviteCodeLabel: 'Invite Code',
      deleteTeam: 'Delete Team',
      leaveTeam: 'Leave Team',
      deleteTeamConfirm: 'This will delete "{name}" and remove all members. This cannot be undone.',
      leaveTeamConfirm: 'Are you sure you want to leave "{name}"?',
      teamDeleted: 'Team Deleted',
      teamDeletedMessage: '"{name}" has been deleted.',
      leftTeam: 'Left Team',
      leftTeamMessage: 'You have left "{name}".',
      teamProducts: 'Team Products',
      noProducts: 'No products scanned yet',
      scannedBy: 'Scanned by',
      joined: 'Joined',
      missingName: 'Missing Name',
      missingNameMessage: 'Please enter a team name.',
      missingCode: 'Missing Code',
      missingCodeMessage: 'Please enter an invite code.',
      createError: 'Failed to create team.',
      joinError: 'Invalid invite code or failed to join team.',
      loadError: 'Failed to load teams.',
      detailsError: 'Failed to load team details.',
      leaveError: 'Failed to leave team.',
      deleteError: 'Failed to delete team. Only the team owner can delete the team.',
    },

    // Status
    status: {
      fresh: 'Fresh',
      expiringSoon: 'Expiring Soon',
      expired: 'Expired',
    },

    // Settings
    settings: {
      language: 'Language',
      languageNote: 'The app language will change immediately when you select a different language.',
    },

    // Store Screen
    store: {
      title: 'Store',
      notLinked: 'Not Linked to Store',
      notLinkedSubtext: 'Create a store or join one with a store code',
      createStore: 'Create Store',
      joinStore: 'Join Store',
      storeName: 'Store Name',
      storeNamePlaceholder: 'e.g., Downtown Store',
      storeCode: 'Store Code',
      storeCodePlaceholder: 'Enter code (e.g., DSK-7F3K)',
      nickname: 'Nickname',
      nicknamePlaceholder: 'Your name',
      creating: 'Creating...',
      joining: 'Joining...',
      create: 'Create Store',
      join: 'Join Store',
      storeCreated: 'Store Created',
      storeCreatedMessage: 'Store "{name}" created. Share code: {code}',
      joinedStore: 'Joined Store',
      joinedStoreMessage: 'Successfully joined "{name}".',
      members: 'Members',
      owner: 'Owner',
      member: 'Member',
      admin: 'Admin',
      staff: 'Staff',
      shareCode: 'Share Code',
      showQR: 'Show QR',
      switchStore: 'Switch Store',
      leaveStore: 'Leave Store',
      leaveStoreConfirm: 'Are you sure you want to leave "{name}"?',
      leftStore: 'Left Store',
      leftStoreMessage: 'You have left "{name}".',
      deleteStore: 'Delete Store',
      deleteStoreConfirm: 'This will delete "{name}" and remove all members. This cannot be undone.',
      storeDeleted: 'Store Deleted',
      storeDeletedMessage: '"{name}" has been deleted.',
      settings: 'Settings',
      missingName: 'Missing Name',
      missingNameMessage: 'Please enter a store name.',
      missingNickname: 'Missing Nickname',
      missingNicknameMessage: 'Please enter your nickname.',
      missingCode: 'Missing Code',
      missingCodeMessage: 'Please enter a store code.',
      createError: 'Failed to create store.',
      joinError: 'Invalid store code or failed to join store.',
      loadError: 'Failed to load store.',
      leaveError: 'Failed to leave store.',
      deleteError: 'Failed to delete store. Only the store owner can delete the store.',
    },

    // Settings Screen
    settingsScreen: {
      title: 'Settings',
      permissions: 'Permissions',
      cameraPermission: 'Camera Permission',
      photoPermission: 'Photo/Media Permission',
      granted: 'Granted',
      denied: 'Denied',
      notDetermined: 'Not Determined',
      openSettings: 'Open Settings',
      about: 'About',
      privacyPolicy: 'Privacy Policy',
      feedback: 'Feedback',
      version: 'Version',
      build: 'Build',
      language: 'Language',
    },
  },

  no: {
    // Common
    common: {
      cancel: 'Avbryt',
      save: 'Lagre',
      delete: 'Slett',
      confirm: 'Bekreft',
      ok: 'OK',
      yes: 'Ja',
      no: 'Nei',
      loading: 'Laster...',
      error: 'Feil',
      success: 'Suksess',
      warning: 'Advarsel',
      back: 'Tilbake',
      close: 'Lukk',
      search: 'Søk',
      filter: 'Filter',
      all: 'Alle',
      required: 'Påkrevd',
      optional: 'Valgfritt',
    },

    // Home Screen
    home: {
      title: 'Utløpsskanning',
      subtitle: 'Spor produkters utløpsdatoer',
      totalProducts: 'Totalt Produkter',
      fresh: 'Fersk',
      expiringSoon: 'Utløper Snart',
      expired: 'Utløpt',
      scanBarcode: 'Skann Strekkode',
      batchScan: 'Batch-skanning',
      notifications: 'Varsler',
      teams: 'Team',
      recentScans: 'Nylige Skanninger',
      viewAll: 'Vis Alle',
      noProducts: 'Ingen produkter skannet ennå',
      noProductsSubtext: 'Trykk "Skann Strekkode" for å komme i gang',
      expires: 'Utløper',
    },

    // Scanner Screen
    scanner: {
      title: 'Skann Strekkode',
      cameraPermissionRequired: 'Kameratillatelse Påkrevd',
      cameraPermissionMessage: 'Vi trenger kameratilgang for å skanne strekkoder',
      grantPermission: 'Gi Tillatelse',
      requestingPermission: 'Ber om kameratillatelse...',
      positionBarcode: 'Plasser strekkoden innenfor rammen',
      orEnterManually: 'Eller skriv inn manuelt',
      enterManually: 'Skriv Inn Strekkode Manuelt',
      productInformation: 'Produktinformasjon',
      barcode: 'Strekkode',
      productName: 'Produktnavn',
      expirationDate: 'Utløpsdato',
      category: 'Kategori',
      quantity: 'Antall',
      location: 'Plassering',
      notes: 'Notater',
      takePhoto: 'Ta Bilde',
      choosePhoto: 'Velg Bilde',
      showOptional: 'Vis Valgfrie Felt',
      hideOptional: 'Skjul Valgfrie Felt',
      saveProduct: 'Lagre',
      saving: 'Lagrer...',
      scanAnother: 'Skann En Til',
      loadingProductInfo: 'Laster produktinfo...',
      missingInformation: 'Manglende Informasjon',
      missingInformationMessage: 'Vennligst fyll inn alle påkrevde felt: Strekkode, Produktnavn og Utløpsdato.',
      successTitle: 'Suksess!',
      successMessage: 'Produktet er lagret.',
      errorTitle: 'Feil',
      errorMessage: 'Kunne ikke lagre produkt. Vennligst prøv igjen.',
      enterBarcode: 'Skriv inn strekkode',
      enterProductName: 'Skriv inn produktnavn',
      datePlaceholder: 'ÅÅÅÅ-MM-DD',
      categoryPlaceholder: 'f.eks., Meieri, Kjøtt, Grønnsaker',
      quantityPlaceholder: '1',
      locationPlaceholder: 'f.eks., Hylle A3, Kjøler 2',
      notesPlaceholder: 'Tilleggsnotater',
      addExpiryDate: 'Legg til dato',
      uploadBetterImage: 'Last opp bedre bilde',
      viewMoreImages: 'Se flere bilder',
    },

    // Products Screen
    products: {
      title: 'Alle Produkter',
      searchPlaceholder: 'Søk produkter...',
      loadingProducts: 'Laster produkter...',
      noResults: 'Ingen resultater funnet',
      noResultsSubtext: 'Prøv et annet søkeord',
      noProducts: 'Ingen produkter ennå',
      noProductsSubtext: 'Start å skanne strekkoder for å spore produkter',
      deleteProduct: 'Slett Produkt',
      deleteConfirmMessage: 'Er du sikker på at du vil slette "{name}"? Denne handlingen kan ikke angres.',
      deleted: 'Slettet',
      deletedMessage: 'Produktet er slettet.',
      deleteError: 'Kunne ikke slette produkt. Vennligst prøv igjen.',
      expires: 'Utløper',
      quantity: 'Antall',
      days: 'dager',
      daysAgo: 'dager siden',
      fresh: 'Fersk',
      expiringSoon: 'Utløper Snart',
      expired: 'Utløpt',
    },

    // Notifications Screen
    notifications: {
      title: 'Varsler',
      scheduledReminders: 'Planlagte Påminnelser',
      scheduledRemindersDesc: 'Få automatiske påminnelser om produkter som utløper snart',
      noSchedules: 'Ingen planlagte påminnelser',
      noSchedulesSubtext: 'Legg til en plan for å få automatiske varsler',
      addSchedule: 'Legg Til Plan',
      scheduleType: 'Plantype',
      daily: 'Daglig',
      weekly: 'Ukentlig',
      dayOfWeek: 'Ukedag',
      time: 'Tid',
      saveSchedule: 'Lagre Plan',
      active: 'Aktiv',
      disabled: 'Deaktivert',
      testNotifications: 'Test Varsler',
      testNotificationsDesc: 'Send et testvarsel for produkter som utløper snart',
      sendTest: 'Send Testvarsel',
      testSent: 'Test Sendt',
      testSentMessage: 'Sendte {count} utløpspåminnelse(r).',
      scheduleCreated: 'Varselplan opprettet.',
      scheduleDeleted: 'Varselplan slettet.',
      updateError: 'Kunne ikke oppdatere varselplan.',
      deleteError: 'Kunne ikke slette varselplan.',
      createError: 'Kunne ikke opprette varselplan.',
      testError: 'Kunne ikke sende testvarsel.',
      loadingSettings: 'Laster varselinnstillinger...',
      pushNotUnavailable: 'Push-varsler er ikke tilgjengelige. Vennligst aktiver varsler i enhetsinnstillingene.',
      dailyAt: 'Daglig kl. {time}',
      weeklyAt: 'Hver {day} kl. {time}',
      sunday: 'søndag',
      monday: 'mandag',
      tuesday: 'tirsdag',
      wednesday: 'onsdag',
      thursday: 'torsdag',
      friday: 'fredag',
      saturday: 'lørdag',
    },

    // Batch Scan Screen
    batchScan: {
      title: 'Batch-skanning',
      loadingBatches: 'Laster batch-skanninger...',
      noActiveBatch: 'Ingen Aktiv Batch',
      noActiveBatchSubtext: 'Opprett en batch for å skanne flere elementer',
      createBatch: 'Opprett Batch',
      createNewBatch: 'Opprett Ny Batch',
      batchName: 'Batch-navn',
      batchNamePlaceholder: 'f.eks., Morgenkontroll',
      creating: 'Oppretter...',
      create: 'Opprett',
      batchCreated: 'Batch Opprettet',
      batchCreatedMessage: 'Batch "{name}" er klar for skanning.',
      items: 'elementer',
      scan: 'Skann',
      scanBarcode: 'Skann strekkode',
      itemsInBatch: 'Elementer i Batch',
      addItemToBatch: 'Legg Til Element i Batch',
      adding: 'Legger til...',
      addItem: 'Legg Til Element',
      itemAdded: 'Element Lagt Til',
      itemAddedMessage: 'La til {name} i batch. Skann neste element.',
      completeBatch: 'Fullfør Batch',
      completeBatchConfirm: 'Dette vil opprette {count} produktoppføringer. Fortsette?',
      batchCompleted: 'Batch Fullført',
      batchCompletedMessage: 'Opprettet {count} produktoppføringer.',
      deleteBatch: 'Slett Batch?',
      deleteBatchConfirm: 'Dette vil slette batchen og alle elementene. Dette kan ikke angres.',
      batchDeleted: 'Batch Slettet',
      batchDeletedMessage: 'Batch er slettet.',
      completedBatches: 'Fullførte Batcher',
      completed: 'Fullført',
      missingName: 'Manglende Navn',
      missingNameMessage: 'Vennligst skriv inn et batch-navn.',
      missingInfo: 'Manglende Informasjon',
      missingInfoMessage: 'Vennligst fyll inn strekkode, produktnavn og utløpsdato.',
      addError: 'Kunne ikke legge til element i batch.',
      completeError: 'Kunne ikke fullføre batch.',
      deleteError: 'Kunne ikke slette batch.',
    },

    // Teams Screen
    teams: {
      title: 'Team',
      loadingTeams: 'Laster team...',
      noTeams: 'Ingen Team Ennå',
      noTeamsSubtext: 'Opprett et team eller bli med ved hjelp av en invitasjonskode',
      createTeam: 'Opprett Team',
      joinTeam: 'Bli Med i Team',
      teamName: 'Teamnavn',
      teamNamePlaceholder: 'f.eks., Butikkteam A',
      inviteCode: 'Invitasjonskode',
      inviteCodePlaceholder: 'Skriv inn 6-tegns kode',
      creating: 'Oppretter...',
      joining: 'Blir med...',
      create: 'Opprett',
      join: 'Bli Med',
      teamCreated: 'Team Opprettet',
      teamCreatedMessage: 'Team "{name}" opprettet. Del invitasjonskode: {code}',
      joinedTeam: 'Ble Med i Team',
      joinedTeamMessage: 'Ble med i "{name}".',
      members: 'Medlemmer',
      owner: 'Eier',
      member: 'Medlem',
      yourRole: 'Din Rolle',
      code: 'Kode',
      inviteCodeLabel: 'Invitasjonskode',
      deleteTeam: 'Slett Team',
      leaveTeam: 'Forlat Team',
      deleteTeamConfirm: 'Dette vil slette "{name}" og fjerne alle medlemmer. Dette kan ikke angres.',
      leaveTeamConfirm: 'Er du sikker på at du vil forlate "{name}"?',
      teamDeleted: 'Team Slettet',
      teamDeletedMessage: '"{name}" er slettet.',
      leftTeam: 'Forlot Team',
      leftTeamMessage: 'Du har forlatt "{name}".',
      teamProducts: 'Teamprodukter',
      noProducts: 'Ingen produkter skannet ennå',
      scannedBy: 'Skannet av',
      joined: 'Ble med',
      missingName: 'Manglende Navn',
      missingNameMessage: 'Vennligst skriv inn et teamnavn.',
      missingCode: 'Manglende Kode',
      missingCodeMessage: 'Vennligst skriv inn en invitasjonskode.',
      createError: 'Kunne ikke opprette team.',
      joinError: 'Ugyldig invitasjonskode eller kunne ikke bli med i team.',
      loadError: 'Kunne ikke laste team.',
      detailsError: 'Kunne ikke laste teamdetaljer.',
      leaveError: 'Kunne ikke forlate team.',
      deleteError: 'Kunne ikke slette team. Bare teameieren kan slette teamet.',
    },

    // Status
    status: {
      fresh: 'Fersk',
      expiringSoon: 'Utløper Snart',
      expired: 'Utløpt',
    },

    // Settings
    settings: {
      language: 'Språk',
      languageNote: 'Appspråket endres umiddelbart når du velger et annet språk.',
    },

    // Store Screen
    store: {
      title: 'Butikk',
      notLinked: 'Ikke Koblet til Butikk',
      notLinkedSubtext: 'Opprett en butikk eller bli med ved hjelp av en butikkode',
      createStore: 'Opprett butikk',
      joinStore: 'Koble til butikk',
      storeName: 'Butikknavn',
      storeNamePlaceholder: 'f.eks., Sentrumsbutikken',
      storeCode: 'Butikkode',
      storeCodePlaceholder: 'Skriv inn kode (f.eks., DSK-7F3K)',
      nickname: 'Kallenavn',
      nicknamePlaceholder: 'Ditt navn',
      creating: 'Oppretter...',
      joining: 'Kobler til...',
      create: 'Opprett butikk',
      join: 'Koble til butikk',
      storeCreated: 'Butikk Opprettet',
      storeCreatedMessage: 'Butikk "{name}" opprettet. Del kode: {code}',
      joinedStore: 'Koblet til Butikk',
      joinedStoreMessage: 'Koblet til "{name}".',
      members: 'Medlemmer',
      owner: 'Eier',
      member: 'Medlem',
      admin: 'Admin',
      staff: 'Ansatt',
      shareCode: 'Del Kode',
      showQR: 'Vis QR',
      switchStore: 'Bytt Butikk',
      leaveStore: 'Logg ut av Butikk',
      leaveStoreConfirm: 'Er du sikker på at du vil logge ut av "{name}"?',
      leftStore: 'Logget ut av Butikk',
      leftStoreMessage: 'Du har logget ut av "{name}".',
      deleteStore: 'Slett Butikk',
      deleteStoreConfirm: 'Dette vil slette "{name}" og fjerne alle medlemmer. Dette kan ikke angres.',
      storeDeleted: 'Butikk Slettet',
      storeDeletedMessage: '"{name}" er slettet.',
      settings: 'Innstillinger',
      missingName: 'Manglende Navn',
      missingNameMessage: 'Vennligst skriv inn et butikknavn.',
      missingNickname: 'Manglende Kallenavn',
      missingNicknameMessage: 'Vennligst skriv inn ditt kallenavn.',
      missingCode: 'Manglende Kode',
      missingCodeMessage: 'Vennligst skriv inn en butikkode.',
      createError: 'Kunne ikke opprette butikk.',
      joinError: 'Ugyldig butikkode eller kunne ikke koble til butikk.',
      loadError: 'Kunne ikke laste butikk.',
      leaveError: 'Kunne ikke logge ut av butikk.',
      deleteError: 'Kunne ikke slette butikk. Bare butikkeieren kan slette butikken.',
    },

    // Settings Screen
    settingsScreen: {
      title: 'Innstillinger',
      permissions: 'Tillatelser',
      cameraPermission: 'Kameratillatelse',
      photoPermission: 'Foto/Medietillatelse',
      granted: 'Gitt',
      denied: 'Nektet',
      notDetermined: 'Ikke Bestemt',
      openSettings: 'Åpne Innstillinger',
      about: 'Om',
      privacyPolicy: 'Personvernerklæring',
      feedback: 'Tilbakemelding',
      version: 'Versjon',
      build: 'Bygg',
      language: 'Språk',
    },
  },
};

// Current language state
let currentLanguage: Language = 'en';

// Get device language
export const getDeviceLanguage = (): Language => {
  const locales = Localization.getLocales();
  const deviceLanguage = locales[0]?.languageCode || 'en';
  
  // Check if device language is Norwegian
  if (deviceLanguage === 'no' || deviceLanguage === 'nb' || deviceLanguage === 'nn') {
    return 'no';
  }
  
  return 'en';
};

// Initialize language from storage or device
export const initializeLanguage = async (): Promise<Language> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'no')) {
      currentLanguage = storedLanguage as Language;
    } else {
      currentLanguage = getDeviceLanguage();
      await AsyncStorage.setItem(LANGUAGE_KEY, currentLanguage);
    }
  } catch (error) {
    console.error('[i18n] Error initializing language:', error);
    currentLanguage = getDeviceLanguage();
  }
  
  console.log('[i18n] Language initialized:', currentLanguage);
  return currentLanguage;
};

// Get current language
export const getCurrentLanguage = (): Language => {
  return currentLanguage;
};

// Set language
export const setLanguage = async (language: Language): Promise<void> => {
  try {
    currentLanguage = language;
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    console.log('[i18n] Language set to:', language);
  } catch (error) {
    console.error('[i18n] Error setting language:', error);
  }
};

// Get translation
export const t = (key: string, params?: Record<string, string | number>): string => {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`[i18n] Translation key not found: ${key}`);
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    console.warn(`[i18n] Translation value is not a string: ${key}`);
    return key;
  }
  
  // Replace parameters
  if (params) {
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(`{${paramKey}}`, String(paramValue));
    }
    return result;
  }
  
  return value;
};

// Get all translations for a section
export const getTranslations = (section: string): Record<string, string> => {
  const keys = section.split('.');
  let value: any = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return {};
    }
  }
  
  return value || {};
};
