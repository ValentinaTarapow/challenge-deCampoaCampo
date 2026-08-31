import { apiClient } from './client';

export async function getPokemonList(limit = 20, offset = 0) {
  const { data } = await apiClient.get('/pokemon', {
    params: { limit, offset },
  });
  return data;
}

export async function getPokemonCatalog() {
  const { count } = await getPokemonList(1, 0);
  return getPokemonList(count, 0);
}

export async function getPokemonByNameOrId(nameOrId) {
  const { data } = await apiClient.get(`/pokemon/${nameOrId}`);
  return data;
}

export async function getType(name) {
  const { data } = await apiClient.get(`/type/${name}`);
  return data;
}

export async function getPokemonSpecies(nameOrId) {
  const { data } = await apiClient.get(`/pokemon-species/${nameOrId}`);
  return data;
}

export async function getEvolutionChainByUrl(url) {
  const { data } = await apiClient.get(url);
  return data;
}

export function parseEvolutionStages(chain) {
  const stages = [];

  function walk(node, depth) {
    if (!stages[depth]) stages[depth] = [];
    stages[depth].push({
      id: getPokemonIdFromUrl(node.species.url),
      name: node.species.name,
    });
    node.evolves_to.forEach((child) => walk(child, depth + 1));
  }

  walk(chain, 0);
  const linear = stages.every((stage) => stage.length === 1);
  const total = stages.reduce((sum, stage) => sum + stage.length, 0);
  return { stages, linear, total };
}

export function getPokemonIdFromUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

export function getPokemonSpriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function getPokemonImageUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

const GENERATION_REGIONS = {
  'generation-i': 'Kanto',
  'generation-ii': 'Johto',
  'generation-iii': 'Hoenn',
  'generation-iv': 'Sinnoh',
  'generation-v': 'Teselia',
  'generation-vi': 'Kalos',
  'generation-vii': 'Alola',
  'generation-viii': 'Galar',
  'generation-ix': 'Paldea',
};

export function getGenerationLabel(generationName) {
  if (!generationName) return null;
  return GENERATION_REGIONS[generationName] ?? null;
}
