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

export function PokemonCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.imageSlot}>
        <Skeleton radius={12} style={styles.imageBone} />
      </View>
      <Skeleton width={36} height={10} radius={4} />
      <Skeleton width="70%" height={12} radius={4} />
    </View>
  );
}

export function PokemonGridSkeleton({ count = 12, gap = 10, columns = 3 }) {
  const rows = [];
  for (let i = 0; i < count; i += columns) {
    rows.push(
      Array.from({ length: Math.min(columns, count - i) }, (_, col) => i + col),
    );
  }

  return (
    <View
      style={[styles.grid, { gap }]}
      accessibilityLabel="Loading Pokémon"
      accessibilityRole="progressbar"
    >
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.gridRow, { gap }]}>
          {row.map((index) => (
            <View key={index} style={styles.gridCell}>
              <PokemonCardSkeleton />
            </View>
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }, (_, pad) => (
                <View key={`pad-${pad}`} style={styles.gridCell} />
              ))
            : null}
        </View>
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
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  gridCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
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
  imageSlot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageBone: {
    ...StyleSheet.absoluteFillObject,
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
