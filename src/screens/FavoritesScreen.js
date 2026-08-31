import { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { PokemonGridItem } from '../components/PokemonGridItem';
import { PokemonGridSkeleton } from '../components/Skeleton';
import { Screen } from '../components/Screen';
import { HeaderDropShadow } from '../components/HeaderDropShadow';
import { EmptyState } from '../components/states';
import { useFavorites } from '../context/FavoritesContext';
import { colors } from '../theme/colors';

const NUM_COLUMNS = 3;
const LIST_PADDING = 16;
const GRID_GAP = 10;

const keyExtractor = (item) => String(item.id);

export default function FavoritesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const cardWidth =
    (width - LIST_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
  const { favorites, ready } = useFavorites();

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

  const listData = ready ? favorites : [];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {!ready
            ? 'Loading your saved Pokémon...'
            : favorites.length
              ? `${favorites.length} saved · available offline`
              : 'Your saved Pokémon'}
        </Text>
        <HeaderDropShadow edge="bottom" />
      </View>
      <FlatList
        data={listData}
        numColumns={NUM_COLUMNS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          listData.length === 0 && styles.listContentEmpty,
        ]}
        columnWrapperStyle={listData.length ? styles.row : undefined}
        ListEmptyComponent={
          ready ? (
            <EmptyState
              icon="heart-outline"
              title="No favorites yet"
              message="Tap the heart on a Pokémon to save it here. Favorites stay available offline."
            />
          ) : (
            <PokemonGridSkeleton cardWidth={cardWidth} />
          )
        }
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
    zIndex: 2,
    backgroundColor: colors.background,
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
    flex: 1,
  },
  listContent: {
    paddingHorizontal: LIST_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  listContentEmpty: {
    justifyContent: 'center',
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
});
