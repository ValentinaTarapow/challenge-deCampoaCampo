import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export function Skeleton({ width, height, radius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      style={[
        styles.bone,
        { width, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
}

export function PokemonCardSkeleton({ cardWidth }) {
  const imageSize = Math.max(cardWidth - 24, 48);

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Skeleton width={imageSize} height={imageSize} radius={12} />
      <Skeleton width={36} height={10} radius={4} />
      <Skeleton width={Math.min(72, cardWidth - 20)} height={12} radius={4} />
    </View>
  );
}

export function PokemonGridSkeleton({ cardWidth, count = 12, gap = 10 }) {
  return (
    <View
      style={[styles.grid, { gap }]}
      accessibilityLabel="Loading Pokémon"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: count }, (_, index) => (
        <PokemonCardSkeleton key={index} cardWidth={cardWidth} />
      ))}
    </View>
  );
}

export function TypeChipSkeleton() {
  return <Skeleton width={72} height={28} radius={999} />;
}

export function AbilityBlockSkeleton() {
  return (
    <View style={styles.abilityBlock}>
      <Skeleton width="42%" height={14} radius={6} />
      <Skeleton width="100%" height={12} radius={4} />
      <Skeleton width="88%" height={12} radius={4} />
    </View>
  );
}

export function EvolutionRowSkeleton() {
  return (
    <View style={styles.evoRow} accessibilityLabel="Loading evolutions">
      <Skeleton width={72} height={88} radius={12} />
      <Skeleton width={72} height={88} radius={12} />
      <Skeleton width={72} height={88} radius={12} />
    </View>
  );
}

export function DetailScreenSkeleton() {
  return (
    <View style={styles.detail} accessibilityLabel="Loading details">
      <View style={styles.hero}>
        <Skeleton width={168} height={168} radius={12} />
        <Skeleton width={180} height={22} radius={8} />
        <View style={styles.chipRow}>
          <TypeChipSkeleton />
          <TypeChipSkeleton />
        </View>
      </View>
      {[0, 1, 2, 3].map((index) => (
        <View key={index} style={styles.section}>
          <Skeleton width={120} height={18} radius={6} />
          <Skeleton width="100%" height={12} radius={4} />
          <Skeleton width="76%" height={12} radius={4} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.skeleton,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  abilityBlock: {
    gap: 8,
    paddingTop: 4,
  },
  evoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  detail: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    paddingTop: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
});
