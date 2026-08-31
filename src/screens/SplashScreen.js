import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const MIN_VISIBLE_MS = 2200;
const FADE_MS = 380;

export default function SplashScreen({ onFinish }) {
  const fade = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(fade, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(({ finished: done }) => {
      if (done) onFinish?.();
    });
  };

  useEffect(() => {
    const timer = setTimeout(finish, MIN_VISIBLE_MS);
    return () => {
      clearTimeout(timer);
      fade.stopAnimation();
    };
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fade }]}>
      <Pressable style={styles.fill} onPress={finish}>
        <View style={styles.header}>
          <View style={styles.lens} />
          <View style={styles.lights}>
            <View style={[styles.light, styles.lightRed]} />
            <View style={[styles.light, styles.lightYellow]} />
            <View style={[styles.light, styles.lightGreen]} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Pokedex</Text>
          <Text style={styles.subtitle}>Valentina Tarapow</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.pokedex.red,
  },
  fill: {
    flex: 1,
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  lens: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.pokedex.lens,
    borderWidth: 6,
    borderColor: '#FFFFFF',
  },
  lights: {
    flexDirection: 'row',
    gap: 8,
  },
  light: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  lightRed: {
    backgroundColor: '#FF5A5A',
  },
  lightYellow: {
    backgroundColor: colors.pokedex.yellow,
  },
  lightGreen: {
    backgroundColor: '#3DDC84',
  },
  divider: {
    height: 3,
    backgroundColor: colors.pokedex.redShadow,
    marginTop: 28,
    marginHorizontal: 28,
    borderRadius: 2,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
