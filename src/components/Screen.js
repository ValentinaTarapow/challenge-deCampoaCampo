import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export function Screen({ children }) {
  return (
    <View style={styles.topSafe}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.screen}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  topSafe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  safe: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
});
