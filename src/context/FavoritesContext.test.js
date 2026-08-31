import { act, renderHook, waitFor } from '@testing-library/react-native';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { getFavorites, saveFavorites } from '../services/storage';
import { cacheImageUrls, deleteImageFiles } from '../services/imageCache';

jest.mock('../services/storage', () => ({
  getFavorites: jest.fn(),
  saveFavorites: jest.fn(async () => {}),
}));

jest.mock('../services/imageCache', () => ({
  cacheImageUrls: jest.fn(async () => ({})),
  deleteImageFiles: jest.fn(async () => {}),
  hydrateImageMap: jest.fn(),
  resolveImage: (url) => url,
}));

jest.mock('../services/pokemonDetail', () => {
  const actual = jest.requireActual('../services/pokemonDetail');
  return {
    ...actual,
    getPokemonDetailBundle: jest.fn(async () => ({
      pokemon: {
        id: 25,
        name: 'pikachu',
        types: [{ type: { name: 'electric' } }],
        stats: [{ stat: { name: 'hp' }, base_stat: 35 }],
        height: 4,
        weight: 60,
        abilities: [],
        species: { name: 'pikachu' },
      },
      matchups: { weaknesses: ['ground'], resistances: [] },
      generation: 'generation-i',
      varieties: [],
      evolution: { stages: [], linear: true, total: 0 },
      abilities: [],
    })),
    getPokemonExtras: jest.fn(async () => ({
      matchups: { weaknesses: ['ground'], resistances: [] },
      generation: 'generation-i',
      varieties: [],
      evolution: { stages: [], linear: true, total: 0 },
      abilities: [],
    })),
  };
});

function wrapper({ children }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

const pikachu = { id: 25, name: 'pikachu', image: 'https://img/25.png' };
const snapshot = {
  id: '25',
  name: 'pikachu',
  image: 'https://img/25.png',
  types: [],
};
const cachedImages = {
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png':
    'file://cache/25.png',
};

describe('FavoritesContext', () => {
  beforeEach(() => {
    getFavorites.mockResolvedValue([]);
    cacheImageUrls.mockResolvedValue(cachedImages);
  });

  it('hydrates saved favorites on start', async () => {
    getFavorites.mockResolvedValue([{ id: '25', name: 'pikachu' }]);

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.isFavorite(25)).toBe(true);
    expect(result.current.favorites[0]).toMatchObject({
      id: '25',
      name: 'pikachu',
    });

    await waitFor(() => {
      expect(result.current.favorites[0]?.detail?.pokemon?.name).toBe('pikachu');
    });
  });

  it('adds and removes a Pokémon from favorites', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      result.current.toggleFavorite(pikachu);
    });

    expect(result.current.isFavorite(25)).toBe(true);
    expect(saveFavorites).toHaveBeenCalledWith([snapshot]);

    await waitFor(() => {
      expect(result.current.favorites[0]?.detail?.pokemon?.name).toBe('pikachu');
    });

    expect(saveFavorites).toHaveBeenLastCalledWith([
      expect.objectContaining({
        id: '25',
        name: 'pikachu',
        types: ['electric'],
        image: 'file://cache/25.png',
        images: cachedImages,
        detail: expect.objectContaining({
          pokemon: expect.objectContaining({ id: 25, name: 'pikachu' }),
          matchups: { weaknesses: ['ground'], resistances: [] },
          generation: 'generation-i',
        }),
      }),
    ]);

    await act(async () => {
      result.current.toggleFavorite(pikachu);
    });

    expect(result.current.isFavorite(25)).toBe(false);
    expect(result.current.favorites).toEqual([]);
    expect(saveFavorites).toHaveBeenLastCalledWith([]);
    expect(deleteImageFiles).toHaveBeenCalledWith(cachedImages);
  });
});
