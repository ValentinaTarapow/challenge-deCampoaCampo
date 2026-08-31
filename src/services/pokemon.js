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

const abilityCache = new Map();

export async function getAbility(nameOrId) {
  const key = String(nameOrId).toLowerCase();
  if (abilityCache.has(key)) return abilityCache.get(key);
  const { data } = await apiClient.get(`/ability/${key}`);
  abilityCache.set(key, data);
  return data;
}

function pickLocalized(entries, langs, field) {
  for (const lang of langs) {
    const matches = (entries ?? []).filter((entry) => entry.language?.name === lang);
    if (!matches.length) continue;
    const raw = matches[matches.length - 1]?.[field];
    if (raw) return String(raw).replace(/\s+/g, ' ').trim();
  }
  return null;
}

export function parseAbilityInfo(ability) {
  const langs = ['en'];
  return {
    name:
      pickLocalized(ability.names, langs, 'name') ||
      ability.name.replace(/-/g, ' '),
    description:
      pickLocalized(ability.flavor_text_entries, langs, 'flavor_text') ||
      pickLocalized(ability.effect_entries, langs, 'short_effect') ||
      null,
  };
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

  function walk(node, depth, gender) {
    if (!stages[depth]) stages[depth] = [];
    stages[depth].push({
      id: getPokemonIdFromUrl(node.species.url),
      name: node.species.name,
      gender,
    });
    node.evolves_to.forEach((child) => walk(child, depth + 1, genderFromDetails(child.evolution_details)));
  }

  walk(chain, 0, null);
  inferSiblingGenders(stages);
  const linear = stages.every((stage) => stage.length === 1);
  const total = stages.reduce((sum, stage) => sum + stage.length, 0);
  return { stages, linear, total };
}

function genderFromDetails(details) {
  for (const detail of details ?? []) {
    if (detail.gender === 1) return 'female';
    if (detail.gender === 2) return 'male';
  }
  return null;
}

function inferSiblingGenders(stages) {
  stages.forEach((stage) => {
    if (stage.length !== 2) return;
    const [left, right] = stage;
    if (left.gender && !right.gender) {
      right.gender = left.gender === 'female' ? 'male' : 'female';
    } else if (right.gender && !left.gender) {
      left.gender = right.gender === 'female' ? 'male' : 'female';
    }
    stage.sort((a, b) => {
      const order = { male: 0, female: 1 };
      return (order[a.gender] ?? 2) - (order[b.gender] ?? 2);
    });
  });
}

export function parseVarieties(species) {
  const speciesName = species.name;
  return (species.varieties ?? []).map((entry) => {
    const name = entry.pokemon.name;
    const suffix = name.startsWith(`${speciesName}-`)
      ? name.slice(speciesName.length + 1).replace(/-/g, ' ')
      : name.replace(/-/g, ' ');
    return {
      id: getPokemonIdFromUrl(entry.pokemon.url),
      name,
      label: entry.is_default ? speciesName.replace(/-/g, ' ') : suffix,
    };
  });
}

export function getPokemonIdFromUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

const VARIETY_ID_START = 10000;

export function isDefaultPokemon(item) {
  return Number(item?.id) < VARIETY_ID_START;
}

export function getPokemonSpriteUrl(id, { shiny = false } = {}) {
  const path = shiny ? `shiny/${id}` : id;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${path}.png`;
}

export function getPokemonImageUrl(id, { shiny = false } = {}) {
  const path = shiny ? `shiny/${id}` : id;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${path}.png`;
}

const GENERATION_REGIONS = {
  'generation-i': 'Kanto',
  'generation-ii': 'Johto',
  'generation-iii': 'Hoenn',
  'generation-iv': 'Sinnoh',
  'generation-v': 'Unova',
  'generation-vi': 'Kalos',
  'generation-vii': 'Alola',
  'generation-viii': 'Galar',
  'generation-ix': 'Paldea',
};

export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

function generationRoman(generation) {
  return generation.replace(/^generation-/, '').toUpperCase();
}

export const REGIONS = [
  { id: 'kanto', label: 'Kanto', generation: 'generation-i', pokedexes: ['kanto'] },
  { id: 'johto', label: 'Johto', generation: 'generation-ii', pokedexes: ['original-johto'] },
  { id: 'hoenn', label: 'Hoenn', generation: 'generation-iii', pokedexes: ['hoenn'] },
  { id: 'sinnoh', label: 'Sinnoh', generation: 'generation-iv', pokedexes: ['original-sinnoh'] },
  { id: 'unova', label: 'Unova', generation: 'generation-v', pokedexes: ['original-unova'] },
  {
    id: 'kalos',
    label: 'Kalos',
    generation: 'generation-vi',
    pokedexes: ['kalos-central', 'kalos-coastal', 'kalos-mountain'],
  },
  {
    id: 'alola',
    label: 'Alola',
    generation: 'generation-vii',
    pokedexes: ['original-alola'],
    formSuffix: 'alola',
  },
  {
    id: 'galar',
    label: 'Galar',
    generation: 'generation-viii',
    pokedexes: ['galar', 'isle-of-armor', 'crown-tundra'],
    formSuffix: 'galar',
  },
  {
    id: 'hisui',
    label: 'Hisui',
    generation: 'generation-viii',
    pokedexes: ['hisui'],
    formSuffix: 'hisui',
  },
  {
    id: 'paldea',
    label: 'Paldea',
    generation: 'generation-ix',
    pokedexes: ['paldea', 'kitakami', 'blueberry'],
    formSuffix: 'paldea',
  },
].map((region) => ({
  ...region,
  filterLabel: `${region.label} (Gen ${generationRoman(region.generation)})`,
}));

export function getGenerationLabel(generationName) {
  if (!generationName) return null;
  const region = GENERATION_REGIONS[generationName];
  const roman = generationName.replace(/^generation-/, '').toUpperCase();
  if (!region) return `Gen ${roman}`;
  return `${region} (Gen ${roman})`;
}

const filterNameCache = new Map();

async function cachedNameSet(key, loader) {
  if (filterNameCache.has(key)) return filterNameCache.get(key);
  const pending = loader()
    .then((set) => {
      filterNameCache.set(key, Promise.resolve(set));
      return set;
    })
    .catch((err) => {
      filterNameCache.delete(key);
      throw err;
    });
  filterNameCache.set(key, pending);
  return pending;
}

export async function getPokedex(nameOrId) {
  const { data } = await apiClient.get(`/pokedex/${nameOrId}`);
  return data;
}

export async function getPokemonNamesByType(type) {
  return cachedNameSet(`type:${type}`, async () => {
    const data = await getType(type);
    return new Set((data.pokemon ?? []).map((entry) => entry.pokemon.name));
  });
}

export async function getPokemonNamesByRegion(regionId) {
  const region = REGIONS.find((item) => item.id === regionId);
  if (!region) return new Set();

  return cachedNameSet(`region:${regionId}`, async () => {
    const dexes = await Promise.all(
      region.pokedexes.map((name) => getPokedex(name)),
    );
    const names = new Set();
    dexes.forEach((dex) => {
      (dex.pokemon_entries ?? []).forEach((entry) => {
        names.add(entry.pokemon_species.name);
      });
    });
    return names;
  });
}

function isRegionalFormName(pokemonName, speciesName, suffix) {
  if (!suffix || pokemonName.includes('-cap')) return false;
  const prefix = `${speciesName}-${suffix}`;
  return (
    pokemonName === prefix ||
    pokemonName.startsWith(`${prefix}-`) ||
    pokemonName === `${speciesName}-totem-${suffix}`
  );
}

function toNameSet(names) {
  if (!names) return new Set();
  if (names instanceof Set) return names;
  return new Set(names);
}

export function expandRegionPokemonNames(speciesNames, regionId, catalogNames) {
  const suffix = REGIONS.find((item) => item.id === regionId)?.formSuffix;
  const catalog = toNameSet(catalogNames);
  const result = new Set();

  toNameSet(speciesNames).forEach((species) => {
    if (!suffix) {
      result.add(species);
      return;
    }

    if (catalog.size) {
      let found = false;
      catalog.forEach((name) => {
        if (isRegionalFormName(name, species, suffix)) {
          result.add(name);
          found = true;
        }
      });
      if (found) return;
    } else {
      result.add(`${species}-${suffix}`);
    }

    result.add(species);
  });

  return result;
}

export function pokemonNamesForRegions(regionEntries, catalogNames) {
  const names = new Set();
  (regionEntries ?? []).forEach(({ id, species }) => {
    expandRegionPokemonNames(species, id, catalogNames).forEach((name) => {
      names.add(name);
    });
  });
  return names;
}
