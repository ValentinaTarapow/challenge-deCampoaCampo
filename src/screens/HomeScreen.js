import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getPokemonCatalog,
  getPokemonIdFromUrl,
  getPokemonSpriteUrl,
} from '../services/pokemon';
import { PokemonCard, LoadingState, ErrorState } from '../components/PokemonCard';
import { colors } from '../theme/colors';

const NUM_COLUMNS = 3;
const LIST_PADDING = 16;
const GRID_GAP = 10;

const keyExtractor = (item) => String(item.id);

function ListEmpty() {
  return <Text style={styles.empty}>No hay Pokémon con ese nombre</Text>;
}

const PokemonGridItem = memo(function PokemonGridItem({
  item,
  cardWidth,
  onPress,
}) {
  return (
    <PokemonCard
      pokemon={item}
      style={{ width: cardWidth }}
      onPress={() => onPress(item.name)}
    >
      <PokemonCard.Image size={cardWidth - 24} />
      <PokemonCard.Content>
        <PokemonCard.Id />
        <PokemonCard.Name />
      </PokemonCard.Content>
    </PokemonCard>
  );
});

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const cardWidth =
    (width - LIST_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const mapResults = useCallback((results) => {
    return results.map((item) => {
      const id = getPokemonIdFromUrl(item.url);
      return {
        id,
        name: item.name,
        image: getPokemonSpriteUrl(id),
        types: [],
      };
    });
  }, []);

  const loadCatalog = useCallback(async () => {
    const data = await getPokemonCatalog();
    setPokemon(mapResults(data.results));
  }, [mapResults]);

  const loadInitial = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await loadCatalog();
    } catch (err) {
      setError(err.message || 'No se pudo cargar la lista');
    } finally {
      setLoading(false);
    }
  }, [loadCatalog]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await loadCatalog();
    } catch (err) {
      setError(err.message || 'No se pudo refrescar');
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return pokemon;
    return pokemon.filter((item) => item.name.toLowerCase().includes(term));
  }, [pokemon, query]);

  const onPressPokemon = useCallback(
    (name) => {
      navigation.navigate('Detail', { nameOrId: name });
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

  if (loading) {
    return <LoadingState message="Cargando Pokémon..." />;
  }

  if (error && pokemon.length === 0) {
    return <ErrorState message={error} onRetry={loadInitial} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokédex</Text>
        <Text style={styles.subtitle}>Explorá la PokeAPI</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre..."
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filtered}
        numColumns={NUM_COLUMNS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        windowSize={10}
        removeClippedSubviews
        ListEmptyComponent={ListEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: 12,
    gap: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  list: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: 32,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 32,
    fontSize: 15,
  },
});
