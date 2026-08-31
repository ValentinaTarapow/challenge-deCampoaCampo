import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getPokemonByNameOrId,
  getPokemonSpriteUrl,
} from '../services/pokemon';
import { getPokemonExtras } from '../services/pokemonDetail';
import { ErrorState } from '../components/states';
import { DetailScreenSkeleton } from '../components/Skeleton';
import { describeError } from '../services/errors';
import { PokemonCard } from '../components/PokemonCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { HeaderDropShadow } from '../components/HeaderDropShadow';
import { colors } from '../theme/colors';

export default function DetailScreen({ route, navigation }) {
  const { nameOrId, id: paramId } = route.params;
  const { isFavorite, toggleFavorite, getFavorite, persistFavoriteDetail } =
    useFavorites();
  const [pokemon, setPokemon] = useState(null);
  const [matchups, setMatchups] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [varieties, setVarieties] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [abilities, setAbilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extrasError, setExtrasError] = useState(null);
  const [extrasRetry, setExtrasRetry] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [shiny, setShiny] = useState(false);

  const applySnapshot = useCallback((detail) => {
    setPokemon(detail.pokemon);
    setMatchups(detail.matchups);
    setGeneration(detail.generation);
    setVarieties(detail.varieties);
    setEvolution(detail.evolution);
    setAbilities(detail.abilities);
  }, []);

  const load = useCallback(async () => {
    const cached = getFavorite(paramId) || getFavorite(nameOrId);
    const detail = cached?.detail;

    setError(null);
    setExtrasError(null);

    if (detail?.pokemon) {
      applySnapshot(detail);
      setFromCache(true);
      setLoading(false);
    } else {
      setPokemon(null);
      setMatchups(null);
      setEvolution(null);
      setVarieties(null);
      setGeneration(null);
      setAbilities(null);
      setFromCache(false);
      setLoading(true);
    }

    try {
      const data = await getPokemonByNameOrId(nameOrId);
      setPokemon(data);
      setFromCache(false);
    } catch (err) {
      if (!detail?.pokemon) {
        setPokemon(null);
        setError(describeError(err, 'detail', { query: nameOrId }));
      }
    } finally {
      setLoading(false);
    }
  }, [applySnapshot, getFavorite, nameOrId, paramId]);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    const id = pokemon?.id ?? paramId;
    const name = pokemon?.name ?? String(nameOrId);
    const favorited = id != null && isFavorite(id);
    navigation.setOptions({
      title: '',
      headerTitleAlign: 'center',
      headerTitle: () => (
        <View style={styles.headerBadge}>
          {id != null ? (
            <Text style={styles.headerId}>#{String(id).padStart(3, '0')}</Text>
          ) : null}
          <Text style={styles.headerName} numberOfLines={1}>
            {name}
          </Text>
        </View>
      ),
      headerRight: () =>
        id != null ? (
          <Pressable
            onPress={() =>
              toggleFavorite(
                pokemon ?? {
                  id,
                  name,
                  image: getPokemonSpriteUrl(id),
                },
              )
            }
            hitSlop={8}
            style={styles.headerFavBtn}
            accessibilityRole="button"
            accessibilityLabel={
              favorited ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            <MaterialCommunityIcons
              name={favorited ? 'heart' : 'heart-outline'}
              size={22}
              color={colors.primary}
            />
          </Pressable>
        ) : null,
    });
  }, [navigation, pokemon, nameOrId, paramId, isFavorite, toggleFavorite]);

  useEffect(() => {
    if (!pokemon) return undefined;
    let cancelled = false;

    async function loadExtras() {
      try {
        setExtrasError(null);
        const extras = await getPokemonExtras(pokemon);
        if (cancelled) return;
        if (extras.matchups != null) setMatchups(extras.matchups);
        if (extras.varieties != null) {
          setGeneration(extras.generation);
          setVarieties(extras.varieties);
        }
        if (extras.abilities != null) setAbilities(extras.abilities);
        if (extras.evolution != null) setEvolution(extras.evolution);
        setExtrasError(
          extras.error ? describeError(extras.error, 'extras') : null,
        );
      } catch (err) {
        if (!cancelled) {
          setExtrasError(describeError(err, 'extras'));
        }
      }
    }

    loadExtras();
    return () => {
      cancelled = true;
    };
  }, [pokemon, extrasRetry]);

  useEffect(() => {
    if (fromCache || !pokemon) return;
    persistFavoriteDetail({
      pokemon,
      matchups,
      generation,
      varieties,
      evolution,
      abilities,
    });
  }, [
    fromCache,
    pokemon,
    matchups,
    generation,
    varieties,
    evolution,
    abilities,
    persistFavoriteDetail,
  ]);

  const openPokemon = useCallback(
    (item) => {
      navigation.push('Detail', { nameOrId: item.name, id: item.id });
    },
    [navigation],
  );

  const retryExtras = () => setExtrasRetry((n) => n + 1);
  const extrasFailed = Boolean(extrasError);

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailScreenSkeleton />
        <HeaderDropShadow />
      </View>
    );
  }

  if (error || !pokemon) {
    const display =
      error ||
      describeError({ response: { status: 404 } }, 'detail', { query: nameOrId });
    return (
      <View style={styles.container}>
        <ErrorState
          kind={display.kind}
          title={display.title}
          message={display.message}
          onRetry={load}
        />
        <HeaderDropShadow />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PokemonCard
        pokemon={pokemon}
        shiny={shiny}
        onToggleShiny={() => setShiny((on) => !on)}
        generation={generation}
        matchups={matchups}
        abilities={abilities}
        evolution={evolution}
        varieties={varieties}
        extrasFailed={extrasFailed}
        extrasError={extrasError}
        onRetryExtras={retryExtras}
        fromCache={fromCache}
        onOpenPokemon={openPokemon}
      >
        <PokemonCard.Body>
          <PokemonCard.OfflineBanner />
          <PokemonCard.Hero>
            <PokemonCard.Generation />
            <PokemonCard.ShinyToggle />
            <PokemonCard.Artwork />
            <PokemonCard.Identity />
            <PokemonCard.HeroTypes />
          </PokemonCard.Hero>
          <PokemonCard.Matchups />
          <PokemonCard.Stats />
          <PokemonCard.Abilities />
          <PokemonCard.Evolutions />
          <PokemonCard.Dimensions />
          <PokemonCard.Forms />
        </PokemonCard.Body>
        <PokemonCard.TipDismiss />
        <PokemonCard.FormsModal />
      </PokemonCard>
      <HeaderDropShadow />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  headerId: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  headerName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  headerFavBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});
