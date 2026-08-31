import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

const MIN_VISIBLE_MS = 2200;
const FADE_MS = 380;

export default function SplashScreen({ onFinish }) {
  const { width, height } = useWindowDimensions();
  const fade = useRef(new Animated.Value(1)).current;
  const lensGlow = useRef(new Animated.Value(0.55)).current;
  const lightOpacities = [
    useRef(new Animated.Value(0.25)).current,
    useRef(new Animated.Value(0.25)).current,
    useRef(new Animated.Value(0.25)).current,
  ];
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
    const powerOn = Animated.stagger(
      160,
      lightOpacities.map((opacity) =>
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ),
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(lensGlow, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(lensGlow, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    powerOn.start(() => pulse.start());
    const timer = setTimeout(finish, MIN_VISIBLE_MS);

    return () => {
      clearTimeout(timer);
      pulse.stop();
      fade.stopAnimation();
    };
  }, []);

  const hingeWidth = Math.max(28, width * 0.07);
  const lensSize = Math.min(112, width * 0.28);
  const lightSize = Math.max(16, lensSize * 0.18);

  return (
    <Animated.View style={[styles.root, { opacity: fade }]}>
      <Pressable style={styles.fill} onPress={finish}>
        <View style={styles.body}>
          <View style={[styles.topPlate, { height: height * 0.24 }]} />

          <View style={[styles.headerRow, { top: height * 0.055 }]}>
            <Animated.View
              style={[
                styles.lensRing,
                {
                  width: lensSize,
                  height: lensSize,
                  borderRadius: lensSize / 2,
                  opacity: lensGlow,
                },
              ]}
            >
              <View
                style={[
                  styles.lensGlass,
                  {
                    width: lensSize * 0.72,
                    height: lensSize * 0.72,
                    borderRadius: lensSize * 0.36,
                  },
                ]}
              >
                <View style={styles.lensInner} />
                <View style={styles.lensHighlight} />
              </View>
            </Animated.View>

            <View style={styles.lightsRow}>
              {['#FF3B3B', '#F7D02C', '#3DDC84'].map((color, index) => (
                <Animated.View
                  key={color}
                  style={[
                    styles.lightRing,
                    {
                      width: lightSize,
                      height: lightSize,
                      borderRadius: lightSize / 2,
                      opacity: lightOpacities[index],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.lightCore,
                      {
                        backgroundColor: color,
                        width: lightSize * 0.62,
                        height: lightSize * 0.62,
                        borderRadius: lightSize * 0.31,
                      },
                    ]}
                  />
                </Animated.View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.seam,
              {
                top: height * 0.27,
                width: width * 0.72,
              },
            ]}
          />

          <View style={[styles.titleBlock, { right: hingeWidth }]}>
            <Text style={styles.title}>Pokedex</Text>
            <Text style={styles.subtitle}>by Valentina Tarapow</Text>
          </View>

          <View style={[styles.arrow, { top: height * 0.62 }]} />

          <View style={[styles.slot, { top: height * 0.88 }]} />

          <View style={[styles.hinge, { width: hingeWidth }]}>
            <View style={styles.hingeHighlight} />
            <View style={[styles.hingeScrew, { top: height * 0.08 }]} />
            <View style={[styles.hingeScrew, { top: height * 0.5 }]} />
            <View style={[styles.hingeScrew, { top: height * 0.88 }]} />
          </View>
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
  },
  body: {
    flex: 1,
    backgroundColor: colors.pokedex.red,
    overflow: 'hidden',
  },
  topPlate: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.pokedex.redDeep,
    borderBottomWidth: 3,
    borderBottomColor: colors.pokedex.redShadow,
  },
  headerRow: {
    position: 'absolute',
    left: 28,
    right: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  lensRing: {
    backgroundColor: colors.pokedex.silver,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.pokedex.chrome,
    shadowColor: '#0B4F8A',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  lensGlass: {
    backgroundColor: colors.pokedex.lens,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lensInner: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: colors.pokedex.lensDeep,
    opacity: 0.55,
  },
  lensHighlight: {
    position: 'absolute',
    top: '14%',
    left: '16%',
    width: '28%',
    height: '22%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    transform: [{ rotate: '-18deg' }],
  },
  lightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  lightRing: {
    backgroundColor: colors.pokedex.silver,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.pokedex.chrome,
  },
  lightCore: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  seam: {
    position: 'absolute',
    right: 44,
    height: 4,
    backgroundColor: colors.pokedex.redShadow,
    borderRadius: 4,
    transform: [{ rotate: '-11deg' }],
  },
  titleBlock: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  arrow: {
    position: 'absolute',
    left: 22,
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderRightWidth: 18,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.pokedex.yellow,
  },
  slot: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pokedex.redShadow,
    borderWidth: 1,
    borderColor: colors.pokedex.redDeep,
  },
  hinge: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.pokedex.redShadow,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  hingeHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 5,
    width: 5,
    backgroundColor: colors.pokedex.redDeep,
    opacity: 0.7,
    borderRadius: 4,
  },
  hingeScrew: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.pokedex.chrome,
    borderWidth: 2,
    borderColor: colors.pokedex.silver,
  },
});
