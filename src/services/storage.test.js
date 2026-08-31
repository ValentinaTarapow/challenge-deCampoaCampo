import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCachedCatalog,
  getFavorites,
  getLastList,
  saveCachedCatalog,
  saveFavorites,
  saveLastList,
} from './storage';

describe('storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists and reads favorites', async () => {
    const favorites = [{ id: '25', name: 'pikachu' }];
    await saveFavorites(favorites);
    await expect(getFavorites()).resolves.toEqual(favorites);
  });

  it('returns an empty list when favorites are missing', async () => {
    await expect(getFavorites()).resolves.toEqual([]);
  });

  it('persists the last loaded list', async () => {
    const payload = {
      pokemon: [{ id: '1', name: 'bulbasaur' }],
      offset: 24,
      hasMore: true,
    };
    await saveLastList(payload);
    await expect(getLastList()).resolves.toEqual(payload);
  });

  it('returns null when the last list is empty', async () => {
    await saveLastList({ pokemon: [], offset: 0, hasMore: true });
    await expect(getLastList()).resolves.toBeNull();
  });

  it('persists the search catalog', async () => {
    const catalog = [{ id: '4', name: 'charmander' }];
    await saveCachedCatalog(catalog);
    await expect(getCachedCatalog()).resolves.toEqual(catalog);
  });
});
