import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const loadedUris = new Set();

export default function ProgressiveImage({ source, size = 72, style }) {
  const [loadedUri, setLoadedUri] = useState(() =>
    loadedUris.has(source) ? source : null,
  );
  const ready = loadedUri === source;
  const imageSource = useMemo(() => ({ uri: source }), [source]);
  const wrapStyle = useMemo(
    () => [{ width: size, height: size }, styles.wrap, style],
    [size, style],
  );

  const onLoad = useCallback(() => {
    loadedUris.add(source);
    setLoadedUri(source);
  }, [source]);

  return (
    <View style={wrapStyle}>
      <Image
        source={imageSource}
        style={[styles.image, ready ? styles.visible : styles.hidden]}
        resizeMode="contain"
        fadeDuration={0}
        onLoad={onLoad}
      />
      {!ready ? (
        <View style={styles.placeholder} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  visible: {
    opacity: 1,
  },
  hidden: {
    opacity: 0,
  },
});
