import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
  getPokemonList,
  getPokemonSpriteUrl,
} from '../services/pokemon';
import { PokemonCard } from '../components/PokemonCard';
import { LoadingState, ErrorState } from '../components/states';
import { colors } from '../theme/colors';

const PAGE_SIZE = 24;
const NUM_COLUMNS = 3;
const LIST_PADDING = 16;
const GRID_GAP = 10;

const keyExtractor = (item) => String(item.id);

function ListEmpty() {
  return <Text style={styles.empty}>No hay Pokémon con ese nombre</Text>;
}

function LoadMoreFooter({ loading, error, onRetry }) {
  if (loading) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!error) return null;

  return (
    <View style={styles.footer}>
      <Text style={styles.footerError}>{error}</Text>
      <Pressable onPress={onRetry} style={styles.footerRetry}>
        <Text style={styles.footerRetryText}>Reintentar</Text>
      </Pressable>
    </View>
  );
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
  const [catalog, setCatalog] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [query, setQuery] = useState('');
  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);

  const isSearching = query.trim().length > 0;

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

  const fetchPage = useCallback(
    async ({ nextOffset = 0, append = false } = {}) => {
      const data = await getPokemonList(PAGE_SIZE, nextOffset);
      const mapped = mapResults(data.results);
      setPokemon((prev) => {
        if (!append) return mapped;
        const existingIds = new Set(prev.map((item) => item.id));
        const unique = mapped.filter((item) => !existingIds.has(item.id));
        return unique.length ? [...prev, ...unique] : prev;
      });
      offsetRef.current = nextOffset + PAGE_SIZE;
      setHasMore(Boolean(data.next));
    },
    [mapResults],
  );

  const loadCatalog = useCallback(async () => {
    const data = await getPokemonCatalog();
    setCatalog(mapResults(data.results));
  }, [mapResults]);

  const loadInitial = useCallback(async () => {
    try {
      setError(null);
      setLoadMoreError(null);
      setLoading(true);
      offsetRef.current = 0;
      await fetchPage({ nextOffset: 0, append: false });
    } catch (err) {
      setError(err.message || 'No se pudo cargar la lista');
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadCatalog().catch(() => {});
  }, [loadCatalog]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      setLoadMoreError(null);
      offsetRef.current = 0;
      await fetchPage({ nextOffset: 0, append: false });
      loadCatalog().catch(() => {});
    } catch (err) {
      setError(err.message || 'No se pudo refrescar');
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (isSearching || !hasMore || loadingMoreRef.current || loading || refreshing) {
      return;
    }
    loadingMoreRef.current = true;
    try {
      setLoadingMore(true);
      setLoadMoreError(null);
      await fetchPage({ nextOffset: offsetRef.current, append: true });
    } catch (err) {
      setLoadMoreError(err.message || 'No se pudo cargar más');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, isSearching, loading, refreshing]);

  const onEndReached = useCallback(() => {
    if (loadMoreError) return;
    loadMore();
  }, [loadMore, loadMoreError]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return pokemon;
    const source = catalog.length ? catalog : pokemon;
    return source.filter((item) => item.name.toLowerCase().includes(term));
  }, [pokemon, catalog, query]);

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
        onEndReached={isSearching ? undefined : onEndReached}
        onEndReachedThreshold={0.4}
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        removeClippedSubviews
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={
          isSearching ? null : (
            <LoadMoreFooter
              loading={loadingMore}
              error={loadMoreError}
              onRetry={loadMore}
            />
          )
        }
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
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 10,
  },
  footerError: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  footerRetry: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  footerRetryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 32,
    fontSize: 15,
  },
});
