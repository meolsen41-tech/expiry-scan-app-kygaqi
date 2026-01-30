
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { getProductStats, getProductEntries, type ProductEntry, type ProductStats } from "@/utils/api";
import { colors } from "@/styles/commonStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";

export default function HomeScreen() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<ProductEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    console.log('[HomeScreen] Loading data');
    setLoading(true);
    try {
      const [statsData, entriesData] = await Promise.all([
        getProductStats(),
        getProductEntries(),
      ]);
      
      setStats(statsData);
      // Get 5 most recent entries
      const sorted = entriesData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentEntries(sorted.slice(0, 5));
      
      console.log('[HomeScreen] Data loaded:', { stats: statsData, recentCount: sorted.length });
    } catch (error) {
      console.error('[HomeScreen] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleScanPress = () => {
    console.log('[HomeScreen] Navigate to scanner');
    router.push('/(tabs)/(home)/scanner');
  };

  const handleViewAllPress = () => {
    console.log('[HomeScreen] Navigate to products');
    router.push('/(tabs)/(home)/products');
  };

  const handleNotificationsPress = () => {
    console.log('[HomeScreen] Navigate to notifications');
    router.push('/(tabs)/(home)/notifications');
  };

  const handleBatchScanPress = () => {
    console.log('[HomeScreen] Navigate to batch scan');
    router.push('/(tabs)/(home)/batch-scan');
  };

  const handleTeamsPress = () => {
    console.log('[HomeScreen] Navigate to teams');
    router.push('/(tabs)/(home)/teams');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'fresh':
        return '#10B981';
      case 'expiring_soon':
        return '#F59E0B';
      case 'expired':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'fresh':
        return 'Fresh';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const totalProducts = stats?.total || 0;
  const freshCount = stats?.fresh || 0;
  const expiringSoonCount = stats?.expiringSoon || 0;
  const expiredCount = stats?.expired || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Expiry Scan</Text>
            <Text style={styles.subtitle}>Track product expiration dates</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalProducts}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statValue}>{freshCount}</Text>
            <Text style={styles.statLabel}>Fresh</Text>
          </View>
          <View style={[styles.statCard, styles.statCardYellow]}>
            <Text style={styles.statValue}>{expiringSoonCount}</Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRed]}>
            <Text style={styles.statValue}>{expiredCount}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleScanPress}>
            <IconSymbol ios_icon_name="barcode.viewfinder" android_material_icon_name="qr-code-scanner" size={32} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Scan Barcode</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryAction} onPress={handleBatchScanPress}>
              <IconSymbol ios_icon_name="tray.fill" android_material_icon_name="inventory" size={24} color={colors.primary} />
              <Text style={styles.secondaryActionText}>Batch Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={handleNotificationsPress}>
              <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={24} color={colors.primary} />
              <Text style={styles.secondaryActionText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={handleTeamsPress}>
              <IconSymbol ios_icon_name="person.3.fill" android_material_icon_name="group" size={24} color={colors.primary} />
              <Text style={styles.secondaryActionText}>Teams</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={handleViewAllPress}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol ios_icon_name="tray.fill" android_material_icon_name="inventory" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No products scanned yet</Text>
              <Text style={styles.emptySubtext}>Tap "Scan Barcode" to get started</Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recentEntries.map((entry) => {
                const statusColor = getStatusColor(entry.status);
                const statusText = getStatusText(entry.status);
                const expirationDate = formatDate(entry.expirationDate);
                
                return (
                  <View key={entry.id} style={styles.recentItem}>
                    <View style={styles.recentItemInfo}>
                      <Text style={styles.recentItemName}>{entry.productName}</Text>
                      <Text style={styles.recentItemDate}>Expires: {expirationDate}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusText}>{statusText}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  statCardGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  statCardYellow: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  statCardRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recentItemDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
