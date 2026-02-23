
import "react-native-reanimated";
import React, { useEffect, createContext, useContext, useState, useCallback } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { getCurrentStore, getStoreMembers, type CurrentStore, type Member } from "@/utils/stores";
import { getDeviceId } from "@/utils/deviceId";
// Note: Error logging is auto-initialized via index.ts import

// ============================================================
// Store Context - provides current store info throughout app
// ============================================================
interface StoreContextType {
  currentStore: CurrentStore | null;
  members: Member[];
  isLoading: boolean;
  refreshStore: () => Promise<void>;
  clearStore: () => void;
}

export const StoreContext = createContext<StoreContextType>({
  currentStore: null,
  members: [],
  isLoading: false,
  refreshStore: async () => {},
  clearStore: () => {},
});

export function useStore(): StoreContextType {
  return useContext(StoreContext);
}

function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentStore, setCurrentStore] = useState<CurrentStore | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStore = useCallback(async () => {
    console.log('[StoreContext] Refreshing store data');
    setIsLoading(true);
    try {
      const deviceId = await getDeviceId();
      const store = await getCurrentStore(deviceId);
      setCurrentStore(store);
      if (store) {
        const storeMembers = await getStoreMembers(store.id);
        setMembers(storeMembers);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('[StoreContext] Error refreshing store:', error);
      setCurrentStore(null);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearStore = useCallback(() => {
    setCurrentStore(null);
    setMembers([]);
  }, []);

  useEffect(() => {
    refreshStore();
  }, []);

  return (
    <StoreContext.Provider value={{ currentStore, members, isLoading, refreshStore, clearStore }}>
      {children}
    </StoreContext.Provider>
  );
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      console.warn('[Network] Device is offline');
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
      background: "rgb(1, 1, 1)", // True black background for OLED displays
      card: "rgb(28, 28, 30)", // Dark card/surface color
      text: "rgb(255, 255, 255)", // White text for dark mode
      border: "rgb(44, 44, 46)", // Dark gray for separators/borders
      notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
    },
  };
  return (
    <>
      <StatusBar style="auto" animated />
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <LanguageProvider>
            <StoreProvider>
              <WidgetProvider>
                <GestureHandlerRootView>
                  <Stack>
                    {/* Main app with tabs */}
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  </Stack>
                  <SystemBars style={"auto"} />
                </GestureHandlerRootView>
              </WidgetProvider>
            </StoreProvider>
          </LanguageProvider>
        </ThemeProvider>
    </>
  );
}
