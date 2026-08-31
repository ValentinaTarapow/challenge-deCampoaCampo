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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GENERATIONS,
  REGIONS,
  getPokemonCatalog,
  getPokemonIdFromUrl,
  getPokemonList,
  getPokemonNamesByGeneration,
  getPokemonNamesByRegion,
  getPokemonNamesByType,
  getPokemonSpriteUrl,
} from '../services/pokemon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PokemonCard } from '../components/PokemonCard';
import { LoadingState, ErrorState } from '../components/states';
import {
  EMPTY_FILTERS,
  FilterSheet,
  countActiveFilters,
} from '../components/FilterSheet';
import { colors } from '../theme/colors';

const PAGE_SIZE = 24;
const NUM_COLUMNS = 3;
const LIST_PADDING = 16;
const GRID_GAP = 10;

const keyExtractor = (item) => String(item.id);

function ListEmpty({ searching, filtering }) {
  const message =
    searching && filtering
      ? 'No Pokémon match that search and filters'
      : filtering
        ? 'No Pokémon match those filters'
        : 'No Pokémon match that search';
  return <Text style={styles.empty}>{message}</Text>;
}

function ActiveFilterChip({ label, onRemove }) {
  return (
    <Pressable
      onPress={onRemove}
      style={styles.activeChip}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label} filter`}
    >
      <Text style={styles.activeChipText}>{label}</Text>
      <MaterialCommunityIcons name="close" size={14} color={colors.primary} />
    </Pressable>
  );
}

function matchesSearch(item, term) {
  if (term.startsWith('#')) {
    const digits = term.slice(1);
    if (!digits || !/^\d+$/.test(digits)) return false;
    return String(Number(item.id)) === String(Number(digits));
  }

  return item.name.toLowerCase().includes(term);
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
        <Text style={styles.footerRetryText}>Retry</Text>
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
      onPress={() => onPress(item)}
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
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterSets, setFilterSets] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterRetry, setFilterRetry] = useState(0);
  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);

  const isSearching = query.trim().length > 0;
  const activeFilterCount = countActiveFilters(filters);
  const hasFilters = activeFilterCount > 0;
  const isFilteredView = isSearching || hasFilters;
  const filterKey = `${filters.region ?? ''}|${filters.generation ?? ''}|${filters.type ?? ''}`;

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
      setError(err.message || 'Could not load the list');
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
      setError(err.message || 'Could not refresh');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!hasFilters) {
      setFilterSets(null);
      setFilterError(null);
      setFilterLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadFilterSets = async () => {
      try {
        setFilterLoading(true);
        setFilterError(null);
        const [typeNames, generationNames, regionNames] = await Promise.all([
          filters.type ? getPokemonNamesByType(filters.type) : null,
          filters.generation
            ? getPokemonNamesByGeneration(filters.generation)
            : null,
          filters.region ? getPokemonNamesByRegion(filters.region) : null,
        ]);
        if (!cancelled) {
          setFilterSets({
            key: filterKey,
            type: typeNames,
            generation: generationNames,
            region: regionNames,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setFilterSets(null);
          setFilterError(err.message || 'Could not load filters');
        }
      } finally {
        if (!cancelled) setFilterLoading(false);
      }
    };

    loadFilterSets();
    return () => {
      cancelled = true;
    };
  }, [filters, filterKey, filterRetry, hasFilters]);

  const loadMore = useCallback(async () => {
    if (isFilteredView || !hasMore || loadingMoreRef.current || loading || refreshing) {
      return;
    }
    loadingMoreRef.current = true;
    try {
      setLoadingMore(true);
      setLoadMoreError(null);
      await fetchPage({ nextOffset: offsetRef.current, append: true });
    } catch (err) {
      setLoadMoreError(err.message || 'Could not load more');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, isFilteredView, loading, refreshing]);

  const onEndReached = useCallback(() => {
    if (loadMoreError) return;
    loadMore();
  }, [loadMore, loadMoreError]);

  const activeSets = filterSets?.key === filterKey ? filterSets : null;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term && !hasFilters) return pokemon;
    const source = catalog.length ? catalog : pokemon;
    return source.filter((item) => {
      if (activeSets?.type && !activeSets.type.has(item.name)) return false;
      if (activeSets?.generation && !activeSets.generation.has(item.name)) {
        return false;
      }
      if (activeSets?.region && !activeSets.region.has(item.name)) return false;
      if (term && !matchesSearch(item, term)) return false;
      return true;
    });
  }, [pokemon, catalog, query, hasFilters, activeSets]);

  const waitingForCatalog = isFilteredView && catalog.length === 0;
  const showFilterSpinner =
    !filterError &&
    ((hasFilters && (filterLoading || !activeSets)) || waitingForCatalog);
  const listData = showFilterSpinner || filterError ? [] : filtered;

  const onApplyFilters = useCallback((next) => {
    setFilters(next);
    setFiltersOpen(false);
  }, []);

  const clearFilter = useCallback((key) => {
    setFilters((prev) => ({ ...prev, [key]: null }));
  }, []);

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

  if (loading) {
    return <LoadingState message="Loading Pokémon..." />;
  }

  if (error && pokemon.length === 0) {
    return <ErrorState message={error} onRetry={loadInitial} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokédex</Text>
        <Text style={styles.subtitle}>Explore the PokeAPI</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or #id..."
              placeholderTextColor={colors.textMuted}
              style={[styles.search, query.length > 0 && styles.searchWithClearRight]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                style={styles.searchClear}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setFiltersOpen(true);
            }}
            style={[styles.filterBtn, hasFilters && styles.filterBtnActive]}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={22}
              color={hasFilters ? '#fff' : colors.text}
            />
            {hasFilters ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        {hasFilters ? (
          <View style={styles.activeFilters}>
            {filters.region ? (
              <ActiveFilterChip
                label={REGIONS.find((item) => item.id === filters.region)?.label}
                onRemove={() => clearFilter('region')}
              />
            ) : null}
            {filters.generation ? (
              <ActiveFilterChip
                label={
                  GENERATIONS.find((item) => item.id === filters.generation)
                    ?.label
                }
                onRemove={() => clearFilter('generation')}
              />
            ) : null}
            {filters.type ? (
              <ActiveFilterChip
                label={filters.type}
                onRemove={() => clearFilter('type')}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      <FilterSheet
        visible={filtersOpen}
        value={filters}
        onApply={onApplyFilters}
        onClose={() => setFiltersOpen(false)}
      />

      <FlatList
        data={listData}
        numColumns={NUM_COLUMNS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        columnWrapperStyle={listData.length ? styles.row : undefined}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={isFilteredView ? undefined : onEndReached}
        onEndReachedThreshold={0.4}
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        removeClippedSubviews
        ListEmptyComponent={
          showFilterSpinner ? (
            <View style={styles.listStatus}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : filterError ? (
            <View style={styles.listStatus}>
              <Text style={styles.footerError}>{filterError}</Text>
              <Pressable
                onPress={() => setFilterRetry((n) => n + 1)}
                style={styles.footerRetry}
              >
                <Text style={styles.footerRetryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <ListEmpty searching={isSearching} filtering={hasFilters} />
          )
        }
        ListFooterComponent={
          isFilteredView ? null : (
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
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
  searchWithClearRight: {
    paddingRight: 42,
  },
  searchClear: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    elevation: 2,
    height: '100%',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  list: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: 32,
    flexGrow: 1,
  },
  listStatus: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
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
