import { StyleSheet, Text, View } from 'react-native';
import { colors, onColor } from '../theme/colors';

export function TypeBadge({ type }) {
  const backgroundColor = colors.types[type] || colors.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: onColor(backgroundColor) }]}>
        {type}
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
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
