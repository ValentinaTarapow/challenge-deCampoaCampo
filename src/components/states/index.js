import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { ERROR_ICONS } from '../../services/errors';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorState({
  kind = 'unknown',
  title = 'Something went wrong',
  message = 'Try again.',
  onRetry,
  retryLabel = 'Retry',
  compact = false,
}) {
  return (
    <View style={compact ? styles.compact : styles.center} accessibilityRole="alert">
      <MaterialCommunityIcons
        name={ERROR_ICONS[kind] || ERROR_ICONS.unknown}
        size={compact ? 28 : 40}
        color={colors.primary}
      />
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={styles.retry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  message,
  image,
  icon = 'magnify',
  actionLabel,
  onAction,
}) {
  return (
    <View style={styles.empty}>
      {image ? (
        <Image
          source={image}
          style={styles.emptyImage}
          resizeMode="contain"
          accessibilityLabel={title}
        />
      ) : (
        <MaterialCommunityIcons name={icon} size={40} color={colors.textMuted} />
      )}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {onAction && actionLabel ? (
        <Pressable
          onPress={onAction}
          style={styles.retry}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.retryText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  compact: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 15,
  },
  text: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  retry: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 8,
  },
  emptyImage: {
    width: 200,
    height: 156,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
