import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  favorites: '@pokedex/favorites',
  lastList: '@pokedex/lastList',
  catalog: '@pokedex/catalog',
};

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getFavorites() {
  const list = await readJson(KEYS.favorites, []);
  return Array.isArray(list) ? list : [];
}

export async function saveFavorites(list) {
  await writeJson(KEYS.favorites, list);
}

export async function getLastList() {
  const data = await readJson(KEYS.lastList, null);
  if (!data?.pokemon?.length) return null;
  return data;
}

export async function saveLastList(payload) {
  await writeJson(KEYS.lastList, payload);
}

export async function getCachedCatalog() {
  const list = await readJson(KEYS.catalog, []);
  return Array.isArray(list) ? list : [];
}

export async function saveCachedCatalog(list) {
  await writeJson(KEYS.catalog, list);
}
