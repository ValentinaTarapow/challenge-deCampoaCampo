import { StyleSheet, View } from 'react-native';

const BANDS = [0.16, 0.1, 0.06, 0.03, 0.015];

export function HeaderDropShadow({ edge = 'top' }) {
  const bands = edge === 'above' ? [...BANDS].reverse() : BANDS;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.shadow,
        edge === 'bottom' && styles.bottom,
        edge === 'above' && styles.above,
        edge === 'top' && styles.top,
      ]}
    >
      {bands.map((opacity) => (
        <View key={opacity} style={[styles.band, { opacity }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    zIndex: 40,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: -10,
  },
  above: {
    top: -10,
  },
  band: {
    flex: 1,
    backgroundColor: '#000',
  },
});
