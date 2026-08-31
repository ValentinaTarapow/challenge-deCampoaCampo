import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getPokemonIdFromUrl,
  getPokemonImageUrl,
  getPokemonList,
} from '../services/pokemon';
import { PokemonCard, LoadingState, ErrorState } from '../components/PokemonCard';
import { colors } from '../theme/colors';

const PAGE_SIZE = 20;

export default function HomeScreen({ navigation }) {
  const [pokemon, setPokemon] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const mapResults = useCallback((results) => {
    return results.map((item) => {
      const id = getPokemonIdFromUrl(item.url);
      return {
        id,
        name: item.name,
        image: getPokemonImageUrl(id),
        types: [],
      };
    });
  }, []);

  const fetchPage = useCallback(
    async ({ nextOffset = 0, append = false } = {}) => {
      const data = await getPokemonList(PAGE_SIZE, nextOffset);
      const mapped = mapResults(data.results);
      setPokemon((prev) => (append ? [...prev, ...mapped] : mapped));
      setOffset(nextOffset + PAGE_SIZE);
      setHasMore(Boolean(data.next));
    },
    [mapResults],
  );

  const loadInitial = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
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

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await fetchPage({ nextOffset: 0, append: false });
    } catch (err) {
      setError(err.message || 'No se pudo refrescar');
    } finally {
      setRefreshing(false);
    }
  };

  const onEndReached = async () => {
    if (!hasMore || loadingMore || loading) return;
    try {
      setLoadingMore(true);
      await fetchPage({ nextOffset: offset, append: true });
    } catch (err) {
      setError(err.message || 'No se pudo cargar más');
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = pokemon.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
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
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? <LoadingState message="Cargando más..." /> : null
        }
        renderItem={({ item }) => (
          <PokemonCard
            pokemon={item}
            onPress={() =>
              navigation.navigate('Detail', {
                nameOrId: item.name,
              })
            }
          >
            <PokemonCard.Image />
            <PokemonCard.Content>
              <PokemonCard.Id />
              <PokemonCard.Name />
            </PokemonCard.Content>
          </PokemonCard>
        )}
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
    paddingHorizontal: 16,
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
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
});
