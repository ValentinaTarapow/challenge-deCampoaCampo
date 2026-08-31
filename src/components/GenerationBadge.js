import { StyleSheet, Text, View } from 'react-native';
import { REGIONS, getGenerationLabel } from '../services/pokemon';
import { colors, onColor } from '../theme/colors';

export function GenerationBadge({ generation }) {
  const label = getGenerationLabel(generation);
  if (!label) return null;
  const region = REGIONS.find((item) => item.id === generation);
  const backgroundColor =
    colors.generations[generation] ||
    colors.generations[region?.generation] ||
    colors.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text
        style={[styles.text, { color: onColor(backgroundColor) }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
