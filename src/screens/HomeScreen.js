import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  RefreshControl,
  Keyboard,
  ScrollView,
} from 'react-native';
import {
  REGIONS,
  getPokemonCatalog,
  getPokemonIdFromUrl,
  getPokemonList,
  getPokemonNamesByRegion,
  getPokemonNamesByType,
  getPokemonSpriteUrl,
  isDefaultPokemon,
  pokemonNamesForRegions,
} from '../services/pokemon';
import {
  getCachedCatalog,
  getLastList,
  saveCachedCatalog,
  saveLastList,
} from '../services/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PokemonGridItem } from '../components/PokemonGridItem';
import { PokemonGridSkeleton } from '../components/Skeleton';
import { Screen } from '../components/Screen';
import { HeaderDropShadow } from '../components/HeaderDropShadow';
import { ErrorState } from '../components/states';
import {
  EMPTY_FILTERS,
  FilterSheet,
  countActiveFilters,
  createEmptyFilters,
  normalizeFilters,
} from '../components/FilterSheet';
import { describeError } from '../services/errors';
import { matchesSearch } from '../utils/search';
import { colors } from '../theme/colors';

const PAGE_SIZE = 24;
const NUM_COLUMNS = 3;
const LIST_PADDING = 16;
const GRID_GAP = 10;

const keyExtractor = (item) => String(item.id);

function ListEmpty({ query, searching, filtering }) {
  const term = query.trim();
  const message =
    searching && filtering
      ? `No Pokémon match “${term}” with those filters.`
      : filtering
        ? 'No Pokémon match those filters. Try removing a region or type.'
        : searching
          ? `No Pokémon match “${term}”. Try another name or #id.`
          : 'There are no Pokémon to show right now.';

  return (
    <View style={styles.empty}>
      <Image
        source={require('../../assets/whos-that-pokemon.png')}
        style={styles.emptyImage}
        resizeMode="contain"
        accessibilityLabel="Who's that Pokémon silhouette"
      />
      <Text style={styles.emptyTitle}>Who's that Pokémon?</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
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

async function unionNameSets(ids, loader) {
  if (!ids?.length) return null;
  const sets = await Promise.all(ids.map(loader));
  const names = new Set();
  sets.forEach((set) => {
    set.forEach((name) => names.add(name));
  });
  return names;
}

function LoadMoreFooter({ loading, error, onRetry }) {
  if (loading) {
    return (
      <View style={styles.footer} accessibilityRole="progressbar">
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.footerHint}>Loading more Pokémon...</Text>
      </View>
    );
  }

  if (!error) return null;

  return (
    <ErrorState
      compact
      kind={error.kind}
      title={error.title}
      message={error.message}
      onRetry={onRetry}
    />
  );
}

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
  const [fromCache, setFromCache] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);
  const pokemonRef = useRef([]);

  const activeFilters = useMemo(() => normalizeFilters(filters), [filters]);
  const isSearching = query.trim().length > 0;
  const activeFilterCount = countActiveFilters(activeFilters);
  const hasFilters = activeFilterCount > 0;
  const isFilteredView = isSearching || hasFilters;
  const filterKey = `${[...activeFilters.regions].sort().join(',')}|${[...activeFilters.types].sort().join(',')}`;

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
      const mapped = mapResults(data.results).filter(isDefaultPokemon);
      const nextOffsetValue = nextOffset + PAGE_SIZE;
      const reachedVarieties = (data.results ?? []).some(
        (item) => !isDefaultPokemon({ id: getPokemonIdFromUrl(item.url) }),
      );
      const hasMorePages = Boolean(data.next) && !reachedVarieties;

      let nextList;
      if (!append) {
        nextList = mapped;
      } else {
        const existingIds = new Set(pokemonRef.current.map((item) => item.id));
        const unique = mapped.filter((item) => !existingIds.has(item.id));
        nextList = unique.length ? [...pokemonRef.current, ...unique] : pokemonRef.current;
      }

      pokemonRef.current = nextList;
      setPokemon(nextList);
      offsetRef.current = nextOffsetValue;
      setHasMore(hasMorePages);
      saveLastList({
        pokemon: nextList,
        offset: nextOffsetValue,
        hasMore: hasMorePages,
      }).catch(() => {});
    },
    [mapResults],
  );

  const loadCatalog = useCallback(async () => {
    setCatalogError(null);
    const cached = await getCachedCatalog();
    if (cached.length) {
      setCatalog(cached);
      setCatalogLoading(false);
    } else {
      setCatalogLoading(true);
    }

    try {
      const data = await getPokemonCatalog();
      const mapped = mapResults(data.results);
      setCatalog(mapped);
      saveCachedCatalog(mapped).catch(() => {});
    } catch (err) {
      if (!cached.length) {
        setCatalogError(describeError(err, 'list'));
      }
    } finally {
      setCatalogLoading(false);
    }
  }, [mapResults]);

  const loadInitial = useCallback(async () => {
    setError(null);
    setLoadMoreError(null);

    const cached = await getLastList();
    const hasCache = Boolean(cached?.pokemon?.length);

    if (hasCache) {
      pokemonRef.current = cached.pokemon;
      setPokemon(cached.pokemon);
      offsetRef.current = cached.offset ?? cached.pokemon.length;
      setHasMore(cached.hasMore !== false);
      setFromCache(true);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      offsetRef.current = 0;
      await fetchPage({ nextOffset: 0, append: false });
      setFromCache(false);
    } catch (err) {
      if (!hasCache) {
        setError(describeError(err, 'list'));
      }
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
      setFromCache(false);
      loadCatalog().catch(() => {});
    } catch (err) {
      if (pokemon.length === 0) {
        setError(describeError(err, 'list'));
      } else {
        setFromCache(true);
      }
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
        const [typeNames, regionEntries] = await Promise.all([
          unionNameSets(activeFilters.types, getPokemonNamesByType),
          activeFilters.regions.length
            ? Promise.all(
                activeFilters.regions.map(async (id) => ({
                  id,
                  species: await getPokemonNamesByRegion(id),
                })),
              )
            : null,
        ]);
        if (!cancelled) {
          setFilterSets({
            key: filterKey,
            type: typeNames,
            regions: regionEntries,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setFilterSets(null);
          setFilterError(describeError(err, 'filters'));
        }
      } finally {
        if (!cancelled) setFilterLoading(false);
      }
    };

    loadFilterSets();
    return () => {
      cancelled = true;
    };
  }, [activeFilters, filterKey, filterRetry, hasFilters]);

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
      setLoadMoreError(describeError(err, 'loadMore'));
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

  const catalogNames = useMemo(
    () => catalog.map((item) => item.name),
    [catalog],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term && !hasFilters) return pokemon.filter(isDefaultPokemon);
    const regionNames = activeSets?.regions
      ? pokemonNamesForRegions(activeSets.regions, catalogNames)
      : null;
    return catalog.filter((item) => {
      if (activeSets?.type && !activeSets.type.has(item.name)) return false;
      if (regionNames && !regionNames.has(item.name)) return false;
      if (!isDefaultPokemon(item) && !regionNames?.has(item.name)) return false;
      if (term && !matchesSearch(item, term)) return false;
      return true;
    });
  }, [pokemon, catalog, catalogNames, query, hasFilters, activeSets]);

  const catalogPending = isFilteredView && catalog.length === 0 && catalogLoading;
  const catalogFailed =
    isFilteredView && catalog.length === 0 && catalogError ? catalogError : null;
  const showGridSkeleton =
    loading ||
    catalogPending ||
    (!filterError && hasFilters && (filterLoading || !activeSets));
  const listError =
    filterError || catalogFailed || (error && pokemon.length === 0 ? error : null);
  const listData = showGridSkeleton || listError ? [] : filtered;
  const showEmpty = !showGridSkeleton && !listError && listData.length === 0;

  const onApplyFilters = useCallback((next) => {
    setFilters(normalizeFilters(next));
    setFiltersOpen(false);
  }, []);

  const clearFilter = useCallback((key, id) => {
    setFilters((prev) => {
      const current = normalizeFilters(prev);
      return {
        ...current,
        [key]: current[key].filter((item) => item !== id),
      };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(createEmptyFilters());
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

  return (
    <Screen>
          <View style={styles.header}>
            <Image
              source={require('../../assets/pokedex-logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="PokéDex logo"
            />
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
          {fromCache ? (
            <View style={styles.offlineBanner}>
              <MaterialCommunityIcons
                name="wifi-off"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.offlineText}>Showing last saved list</Text>
            </View>
          ) : null}
          {hasFilters ? (
            <View style={styles.activeFilters}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.activeFiltersScroller}
                contentContainerStyle={styles.activeFiltersScroll}
                keyboardShouldPersistTaps="handled"
              >
                {activeFilters.regions.map((regionId) => (
                  <ActiveFilterChip
                    key={`region-${regionId}`}
                    label={REGIONS.find((item) => item.id === regionId)?.filterLabel}
                    onRemove={() => clearFilter('regions', regionId)}
                  />
                ))}
                {activeFilters.types.map((type) => (
                  <ActiveFilterChip
                    key={`type-${type}`}
                    label={type}
                    onRemove={() => clearFilter('types', type)}
                  />
                ))}
              </ScrollView>
              <Pressable
                onPress={clearAllFilters}
                style={styles.clearAllBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
              >
                <Text style={styles.clearAllText}>Clear all</Text>
              </Pressable>
            </View>
          ) : null}
          <HeaderDropShadow edge="bottom" />
          </View>

          <FilterSheet
            visible={filtersOpen}
            value={filters}
            onApply={onApplyFilters}
            onClose={() => setFiltersOpen(false)}
          />

          {showGridSkeleton ? (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            >
              <PokemonGridSkeleton />
            </ScrollView>
          ) : listError ? (
            <ErrorState
              kind={listError.kind}
              title={listError.title}
              message={listError.message}
              onRetry={
                filterError
                  ? () => setFilterRetry((n) => n + 1)
                  : catalogFailed
                    ? loadCatalog
                    : loadInitial
              }
            />
          ) : showEmpty ? (
            <ListEmpty
              query={query}
              searching={isSearching}
              filtering={hasFilters}
            />
          ) : (
            <FlatList
              data={listData}
              numColumns={NUM_COLUMNS}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.row}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              onEndReached={isFilteredView ? undefined : onEndReached}
              onEndReachedThreshold={0.4}
              initialNumToRender={12}
              maxToRenderPerBatch={9}
              removeClippedSubviews
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
          )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: LIST_PADDING,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
    backgroundColor: colors.background,
  },
  logo: {
    width: 180,
    height: 65,
  },
  searchRow: {
    alignSelf: 'stretch',
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
  offlineBanner: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeFilters: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  activeFiltersScroller: {
    flex: 1,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clearAllBtn: {
    flexShrink: 0,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'capitalize',
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
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 10,
  },
  footerHint: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 8,
  },
  emptyImage: {
    width: 260,
    height: 204,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
