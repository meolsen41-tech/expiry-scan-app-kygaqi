import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  primary: '#10B981',    // Fresh Green
  secondary: '#059669',  // Darker Green
  accent: '#34D399',     // Light Green
  background: '#FFFFFF',  // Clean White
  backgroundAlt: '#F9FAFB',  // Light Gray
  text: '#111827',       // Dark Gray Text
  textSecondary: '#6B7280', // Medium Gray
  card: '#FFFFFF',       // White Card
  cardBorder: '#E5E7EB', // Light Border
  fresh: '#10B981',      // Fresh Green
  expiringSoon: '#F59E0B', // Warning Amber
  expired: '#EF4444',    // Danger Red
  highlight: '#DBEAFE',  // Light Blue Highlight
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    width: '100%',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
  },
});
