import { apiClient } from './client';

export async function getPokemonList(limit = 20, offset = 0) {
  const { data } = await apiClient.get('/pokemon', {
    params: { limit, offset },
  });
  return data;
}

export async function getPokemonByNameOrId(nameOrId) {
  const { data } = await apiClient.get(`/pokemon/${nameOrId}`);
  return data;
}

export function getPokemonIdFromUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

export function getPokemonImageUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
