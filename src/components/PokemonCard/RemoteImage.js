import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { resolveImage } from '../../services/imageCache';

const loadedUris = new Set();
const FALLBACK_IMAGE = require('../../../assets/pokeball-placeholder.png');

export default function RemoteImage({ source, size = 72, style }) {
  const uri = resolveImage(source);
  const [loadedUri, setLoadedUri] = useState(() =>
    loadedUris.has(uri) ? uri : null,
  );
  const [failedUri, setFailedUri] = useState(null);
  const ready = loadedUri === uri;
  const failed = failedUri === uri;
  const imageSource = useMemo(() => ({ uri }), [uri]);

  const onLoad = useCallback(() => {
    loadedUris.add(uri);
    setFailedUri(null);
    setLoadedUri(uri);
  }, [uri]);

  const onError = useCallback(() => {
    setFailedUri(uri);
  }, [uri]);

  return (
    <View style={[{ width: size, height: size }, styles.wrap, style]}>
      <Image
        source={imageSource}
        style={[styles.image, ready ? styles.visible : styles.hidden]}
        resizeMode="contain"
        fadeDuration={0}
        onLoad={onLoad}
        onError={onError}
      />
      {!ready ? (
        <View style={styles.placeholder} pointerEvents="none">
          {failed ? (
            <Image
              source={FALLBACK_IMAGE}
              style={styles.fallback}
              resizeMode="contain"
            />
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.imageBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.imageBackground,
  },
  fallback: {
    width: '46%',
    height: '46%',
    opacity: 0.55,
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
