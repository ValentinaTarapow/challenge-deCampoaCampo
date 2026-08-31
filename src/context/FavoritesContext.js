import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  cacheImageUrls,
  deleteImageFiles,
  hydrateImageMap,
} from '../services/imageCache';
import {
  buildDetail,
  collectImageUrls,
  hasCompleteExtras,
  getPokemonDetailBundle,
  getPokemonExtras,
  hasFullPokemon,
  toListItem,
} from '../services/pokemonDetail';
import { getFavorites, saveFavorites } from '../services/storage';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [ready, setReady] = useState(false);
  const favoritesRef = useRef([]);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    let cancelled = false;

    getFavorites()
      .then((list) => {
        if (cancelled) return;
        list.forEach((item) => hydrateImageMap(item.images));
        setFavorites(list);
        favoritesRef.current = list;
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next) => {
    saveFavorites(next).catch(() => {});
    favoritesRef.current = next;
    return next;
  }, []);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((item) => String(item.id))),
    [favorites],
  );

  const isFavorite = useCallback(
    (id) => favoriteIds.has(String(id)),
    [favoriteIds],
  );

  const getFavorite = useCallback((idOrName) => {
    if (idOrName == null) return null;
    const key = String(idOrName).toLowerCase();
    return (
      favoritesRef.current.find(
        (item) =>
          String(item.id) === key || item.name?.toLowerCase() === key,
      ) ?? null
    );
  }, []);

  const upsertFavorite = useCallback(
    (record) => {
      setFavorites((prev) => {
        const index = prev.findIndex(
          (item) => String(item.id) === String(record.id),
        );
        if (index === -1) return prev;

        const current = prev[index];
        const preferLocal = (next, prevValue) => {
          if (next && !String(next).startsWith('http')) return next;
          if (prevValue && !String(prevValue).startsWith('http')) return prevValue;
          return next || prevValue;
        };

        const nextItem = {
          ...current,
          ...record,
          image: preferLocal(record.image, current.image),
          images: { ...current.images, ...record.images },
          detail: record.detail
            ? {
                ...current.detail,
                ...record.detail,
                pokemon: record.detail.pokemon ?? current.detail?.pokemon,
                matchups: record.detail.matchups ?? current.detail?.matchups ?? null,
                generation:
                  record.detail.generation ?? current.detail?.generation ?? null,
                varieties:
                  record.detail.varieties ?? current.detail?.varieties ?? null,
                evolution:
                  record.detail.evolution ?? current.detail?.evolution ?? null,
                abilities:
                  record.detail.abilities ?? current.detail?.abilities ?? null,
              }
            : current.detail,
        };
        const next = [...prev];
        next[index] = nextItem;
        return persist(next);
      });
    },
    [persist],
  );

  const persistFavoriteDetail = useCallback(
    async (bundle) => {
      if (!bundle?.pokemon?.id) return;
      const id = String(bundle.pokemon.id);
      if (!favoritesRef.current.some((item) => String(item.id) === id)) return;

      const listItem = toListItem(bundle.pokemon);
      const detail = buildDetail(bundle);
      const images = await cacheImageUrls(collectImageUrls(bundle));
      const localSprite = images[listItem.image];
      if (localSprite) listItem.image = localSprite;

      upsertFavorite({ ...listItem, detail, images });
    },
    [upsertFavorite],
  );

  const ensureFavoriteDetail = useCallback(
    async (pokemon) => {
      const stored = pokemon?.detail?.pokemon;
      const payload = hasFullPokemon(pokemon) ? pokemon : stored;

      try {
        if (hasFullPokemon(payload)) {
          let extras = {};
          try {
            extras = await getPokemonExtras(payload);
          } catch {
            extras = {};
          }
          await persistFavoriteDetail({ pokemon: payload, ...extras });
          return;
        }

        const bundle = await getPokemonDetailBundle(pokemon.name || pokemon.id);
        await persistFavoriteDetail(bundle);
      } catch {
        // Keep the list card; the full entry can be saved the next time we're online.
      }
    },
    [persistFavoriteDetail],
  );

  useEffect(() => {
    if (!ready) return undefined;
    const pending = favoritesRef.current.filter(
      (item) => !hasCompleteExtras(item.detail),
    );
    pending.forEach((item) => {
      ensureFavoriteDetail(item);
    });
    return undefined;
  }, [ready, ensureFavoriteDetail]);

  const toggleFavorite = useCallback(
    (pokemon) => {
      const snapshot = toListItem(pokemon);
      const id = snapshot.id;
      const wasFavorite = favoriteIds.has(id);

      if (wasFavorite) {
        const removed = favoritesRef.current.find(
          (item) => String(item.id) === id,
        );
        deleteImageFiles(removed?.images).catch(() => {});
        const next = favoritesRef.current.filter(
          (item) => String(item.id) !== id,
        );
        persist(next);
        setFavorites(next);
        return;
      }

      const next = [snapshot, ...favoritesRef.current];
      persist(next);
      setFavorites(next);
      ensureFavoriteDetail(pokemon);
    },
    [ensureFavoriteDetail, favoriteIds, persist],
  );

  const value = useMemo(
    () => ({
      favorites,
      ready,
      isFavorite,
      toggleFavorite,
      getFavorite,
      persistFavoriteDetail,
    }),
    [
      favorites,
      ready,
      isFavorite,
      toggleFavorite,
      getFavorite,
      persistFavoriteDetail,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return context;
}
