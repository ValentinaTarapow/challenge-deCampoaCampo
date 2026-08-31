import {
  getAbility,
  getEvolutionChainByUrl,
  getPokemonByNameOrId,
  getPokemonImageUrl,
  getPokemonSpecies,
  getPokemonSpriteUrl,
  getType,
  parseAbilityInfo,
  parseEvolutionStages,
  parseVarieties,
  resolvePokemonGeneration,
} from './pokemon';
import { computeTypeMatchups } from './matchups';

export function pickPokemon(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    types: (pokemon.types ?? []).map((entry) => {
      const name =
        typeof entry === 'string' ? entry : entry?.type?.name ?? entry?.name;
      return { type: { name } };
    }),
    stats: (pokemon.stats ?? []).map((stat) => ({
      stat: { name: stat.stat?.name ?? stat.name },
      base_stat: stat.base_stat ?? stat.value,
    })),
    height: pokemon.height ?? 0,
    weight: pokemon.weight ?? 0,
    abilities: (pokemon.abilities ?? []).map((entry) => ({
      is_hidden: Boolean(entry.is_hidden),
      ability: {
        name: entry.ability?.name ?? entry.name ?? entry.id,
      },
    })),
    species: { name: pokemon.species?.name ?? pokemon.name },
  };
}

export function toListItem(pokemon) {
  const id = String(pokemon.id);
  const types = (pokemon.types ?? [])
    .map((entry) => (typeof entry === 'string' ? entry : entry?.type?.name))
    .filter(Boolean);

  return {
    id,
    name: pokemon.name,
    image: pokemon.image || getPokemonSpriteUrl(id),
    types,
  };
}

export function hasFullPokemon(pokemon) {
  return Boolean(pokemon?.stats?.length);
}

export function collectImageUrls({ pokemon, evolution, varieties }) {
  const ids = new Set([String(pokemon.id)]);
  (evolution?.stages ?? []).forEach((stage) => {
    stage.forEach((item) => ids.add(String(item.id)));
  });
  (varieties ?? []).forEach((item) => ids.add(String(item.id)));

  const urls = [];
  ids.forEach((id) => {
    urls.push(getPokemonSpriteUrl(id));
    urls.push(getPokemonSpriteUrl(id, { shiny: true }));
  });
  urls.push(getPokemonImageUrl(pokemon.id));
  urls.push(getPokemonImageUrl(pokemon.id, { shiny: true }));
  return [...new Set(urls)];
}

export function buildDetail({
  pokemon,
  matchups,
  generation,
  varieties,
  evolution,
  abilities,
}) {
  return {
    pokemon: pickPokemon(pokemon),
    matchups: matchups ?? null,
    generation: generation ?? null,
    varieties: varieties ?? null,
    evolution: evolution ?? null,
    abilities: abilities ?? null,
  };
}

export async function getPokemonExtras(pokemon) {
  const visibleAbilities = (pokemon.abilities ?? []).filter(
    (entry) => !entry.is_hidden,
  );
  const typeNames = (pokemon.types ?? [])
    .map((entry) => (typeof entry === 'string' ? entry : entry?.type?.name))
    .filter(Boolean);

  const [typePayloads, species, abilityPayloads] = await Promise.all([
    Promise.all(typeNames.map(getType)),
    getPokemonSpecies(pokemon.species?.name ?? pokemon.id),
    Promise.all(
      visibleAbilities.map((entry) => getAbility(entry.ability.name)),
    ),
  ]);

  const extras = {
    matchups: computeTypeMatchups(typePayloads),
    generation: resolvePokemonGeneration(pokemon, species),
    varieties: parseVarieties(species),
    abilities: abilityPayloads.map((payload, index) => ({
      id: visibleAbilities[index].ability.name,
      ...parseAbilityInfo(payload),
    })),
    evolution: { stages: [], linear: true, total: 0 },
  };

  if (species.evolution_chain?.url) {
    const chain = await getEvolutionChainByUrl(species.evolution_chain.url);
    extras.evolution = parseEvolutionStages(chain.chain);
  }

  return extras;
}

export async function getPokemonDetailBundle(nameOrId) {
  const pokemon = await getPokemonByNameOrId(nameOrId);
  const extras = await getPokemonExtras(pokemon);
  return { pokemon, ...extras };
}
