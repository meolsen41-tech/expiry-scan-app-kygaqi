
# Norwegian Language Integration

## Overview

The app now supports **Norwegian (Norsk)** in addition to English. Users can switch between languages in the Profile screen, and the app will automatically detect and use the device's language on first launch.

## Features

✅ **Automatic Language Detection**: The app detects if the device is set to Norwegian and automatically uses Norwegian on first launch.

✅ **Manual Language Switching**: Users can manually switch between English and Norwegian in the Profile screen.

✅ **Persistent Language Preference**: The selected language is saved and persists across app restarts.

✅ **Comprehensive Translations**: All screens and UI elements are translated:
- Home Screen
- Scanner Screen
- Products Screen
- Notifications Screen
- Batch Scan Screen
- Teams Screen
- Profile/Settings Screen
- Common UI elements (buttons, labels, status messages)

## How to Use

### For Users

1. **Open the Profile tab** (bottom navigation)
2. **Scroll to the "Language" section**
3. **Tap on your preferred language**:
   - **English** - English
   - **Norwegian** - Norsk
4. The app will immediately switch to the selected language

### For Developers

#### Using Translations in Components

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t, language } = useLanguage();
  
  // Simple translation
  const title = t('home.title');
  
  // Translation with parameters
  const message = t('notifications.testSentMessage', { count: 5 });
  
  return (
    <View>
      <Text>{title}</Text>
      <Text>{message}</Text>
    </View>
  );
}
```

#### Adding New Translations

Edit `utils/i18n.ts` and add your translations to both `en` and `no` objects:

```typescript
const translations = {
  en: {
    mySection: {
      myKey: 'My English Text',
      withParam: 'Hello {name}!',
    },
  },
  no: {
    mySection: {
      myKey: 'Min Norske Tekst',
      withParam: 'Hei {name}!',
    },
  },
};
```

Then use it in your component:

```typescript
const text = t('mySection.myKey');
const greeting = t('mySection.withParam', { name: 'John' });
```

## Translation Keys Structure

```
common.*          - Common UI elements (buttons, labels)
home.*            - Home screen
scanner.*         - Scanner screen
products.*        - Products screen
notifications.*   - Notifications screen
batchScan.*       - Batch scan screen
teams.*           - Teams screen
status.*          - Product status labels
settings.*        - Settings/language screen
```

## Implementation Details

### Core Files

1. **`utils/i18n.ts`**
   - Translation strings for English and Norwegian
   - Language detection and persistence
   - Translation function `t(key, params)`

2. **`contexts/LanguageContext.tsx`**
   - React Context for language state
   - `useLanguage()` hook for accessing translations
   - Automatic language initialization

3. **`app/_layout.tsx`**
   - Wraps app in `LanguageProvider`

4. **`app/(tabs)/profile.tsx`**
   - Language selection UI
   - Displays current language
   - Allows switching between English and Norwegian

### Language Detection

The app uses `expo-localization` to detect the device language:

```typescript
import * as Localization from 'expo-localization';

const locales = Localization.getLocales();
const deviceLanguage = locales[0]?.languageCode;

// Detects: 'no', 'nb' (Bokmål), 'nn' (Nynorsk)
if (deviceLanguage === 'no' || deviceLanguage === 'nb' || deviceLanguage === 'nn') {
  return 'no'; // Use Norwegian
}
```

### Storage

Language preference is stored using `@react-native-async-storage/async-storage`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save language
await AsyncStorage.setItem('@app_language', 'no');

// Load language
const language = await AsyncStorage.getItem('@app_language');
```

## Norwegian Translation Coverage

### Fully Translated Screens

✅ **Home Screen**
- Title, subtitle, stats, buttons, empty states

✅ **Scanner Screen**
- Camera permissions, form labels, buttons, success/error messages

✅ **Products Screen**
- Search, filters, product details, delete confirmations

✅ **Notifications Screen**
- Schedule types, day names, time selection, test notifications

✅ **Batch Scan Screen**
- Batch creation, item scanning, completion messages

✅ **Teams Screen**
- Team creation, joining, member management, product listings

✅ **Profile/Settings Screen**
- Language selection, settings labels

✅ **Common Elements**
- Buttons (Save, Cancel, Delete, Confirm)
- Status labels (Fresh, Expiring Soon, Expired)
- Loading states, error messages

## Testing

### Test Language Switching

1. Open the app
2. Go to Profile tab
3. Switch to Norwegian (Norsk)
4. Navigate through all screens to verify translations
5. Switch back to English
6. Verify all screens display English

### Test Device Language Detection

1. Change device language to Norwegian in system settings
2. Delete and reinstall the app (or clear app data)
3. Open the app
4. Verify it starts in Norwegian

### Test Persistence

1. Switch to Norwegian
2. Close the app completely
3. Reopen the app
4. Verify it's still in Norwegian

## Future Enhancements

- Add more languages (Swedish, Danish, German, etc.)
- Add date/time formatting based on locale
- Add number formatting based on locale
- Add currency formatting for future payment features
- Add RTL (Right-to-Left) support for Arabic, Hebrew, etc.

## Dependencies

```json
{
  "@react-native-async-storage/async-storage": "^2.2.0",
  "expo-localization": "^17.0.8"
}
```

## Notes

- The app uses **Bokmål** Norwegian (most common variant)
- All translations follow Norwegian grammar and conventions
- Date formats use the device's locale settings
- The language switch is instant (no app restart required)

## Support

For translation improvements or corrections, please:
1. Edit `utils/i18n.ts`
2. Update both `en` and `no` translation objects
3. Test thoroughly on both iOS and Android
4. Verify all screens display correctly

---

**Velkommen til Utløpsskanning!** 🇳🇴
