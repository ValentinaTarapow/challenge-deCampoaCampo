import { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PokemonGridItem } from '../components/PokemonGridItem';
import { Screen } from '../components/Screen';
import { useFavorites } from '../context/FavoritesContext';
import { colors } from '../theme/colors';

const NUM_COLUMNS = 3;
const LIST_PADDING = 16;
const GRID_GAP = 10;

const keyExtractor = (item) => String(item.id);

function EmptyFavorites() {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons
        name="heart-outline"
        size={40}
        color={colors.textMuted}
      />
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptyText}>
        Tap the heart on a Pokémon to save it here. Favorites stay available offline.
      </Text>
    </View>
  );
}

export default function FavoritesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const cardWidth =
    (width - LIST_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
  const { favorites } = useFavorites();

  const onPressPokemon = useCallback(
    (item) => {
      navigation.navigate('Detail', { nameOrId: item.name, id: item.id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <PokemonGridItem
        item={item}
        cardWidth={cardWidth}
        onPress={onPressPokemon}
      />
    ),
    [cardWidth, onPressPokemon],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {favorites.length
            ? `${favorites.length} saved · available offline`
            : 'Your saved Pokémon'}
        </Text>
      </View>
      <FlatList
        data={favorites}
        numColumns={NUM_COLUMNS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        columnWrapperStyle={favorites.length ? styles.row : undefined}
        ListEmptyComponent={EmptyFavorites}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: LIST_PADDING,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  list: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: 32,
    flexGrow: 1,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  empty: {
    alignItems: 'center',
    marginTop: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
