import {
  getAbility,
  getEvolutionChainByUrl,
  getPokemonSpecies,
  getType,
} from './pokemon';
import {
  buildDetail,
  collectImageUrls,
  getPokemonExtras,
  hasFullPokemon,
  pickPokemon,
  toListItem,
} from './pokemonDetail';

jest.mock('./pokemon', () => {
  const actual = jest.requireActual('./pokemon');
  return {
    ...actual,
    getType: jest.fn(),
    getPokemonSpecies: jest.fn(),
    getAbility: jest.fn(),
    getEvolutionChainByUrl: jest.fn(),
  };
});

const pikachu = {
  id: 25,
  name: 'pikachu',
  types: [{ type: { name: 'electric' } }],
  stats: [{ stat: { name: 'hp' }, base_stat: 35 }],
  height: 4,
  weight: 60,
  abilities: [{ is_hidden: false, ability: { name: 'static' } }],
  species: { name: 'pikachu' },
};

describe('pokemonDetail', () => {
  it('maps a list card from a Pokémon payload', () => {
    expect(toListItem(pikachu)).toEqual({
      id: '25',
      name: 'pikachu',
      image:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      types: ['electric'],
    });
  });

  it('keeps a local image if one is already stored', () => {
    expect(toListItem({ ...pikachu, image: 'file://cache/25.png' }).image).toBe(
      'file://cache/25.png',
    );
  });

  it('detects a full Pokémon payload by stats', () => {
    expect(hasFullPokemon(pikachu)).toBe(true);
    expect(hasFullPokemon({ id: 25, name: 'pikachu' })).toBe(false);
  });

  it('normalizes a Pokémon for offline detail', () => {
    expect(pickPokemon(pikachu)).toMatchObject({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      types: [{ type: { name: 'electric' } }],
      stats: [{ stat: { name: 'hp' }, base_stat: 35 }],
    });
  });

  it('builds a persistable detail bundle', () => {
    const detail = buildDetail({
      pokemon: pikachu,
      matchups: { weaknesses: ['ground'], resistances: ['steel'], immunities: [] },
      generation: 'generation-i',
      varieties: [],
      evolution: { stages: [], linear: true, total: 0 },
      abilities: [{ id: 'static', name: 'Static' }],
    });

    expect(detail.pokemon.name).toBe('pikachu');
    expect(detail.matchups.weaknesses).toEqual(['ground']);
    expect(detail.generation).toBe('generation-i');
  });

  it('collects sprite and artwork urls including evolutions', () => {
    const urls = collectImageUrls({
      pokemon: pikachu,
      evolution: {
        stages: [[{ id: 172, name: 'pichu' }], [{ id: 25, name: 'pikachu' }]],
      },
      varieties: [{ id: 10194, name: 'pikachu-gmax' }],
    });

    expect(urls).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/sprites/pokemon/25.png'),
        expect.stringContaining('/sprites/pokemon/shiny/25.png'),
        expect.stringContaining('/official-artwork/25.png'),
        expect.stringContaining('/sprites/pokemon/172.png'),
        expect.stringContaining('/sprites/pokemon/10194.png'),
      ]),
    );
    expect(new Set(urls).size).toBe(urls.length);
  });
});

const emptyRelations = {
  damage_relations: {
    double_damage_from: [{ name: 'ground' }],
    half_damage_from: [],
    no_damage_from: [],
  },
};

const speciesPayload = {
  name: 'pikachu',
  generation: { name: 'generation-i' },
  pokedex_numbers: [{ pokedex: { name: 'kanto' } }],
  varieties: [
    {
      is_default: true,
      pokemon: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
    },
  ],
  evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/10/' },
};

const chainPayload = {
  chain: {
    species: {
      name: 'pichu',
      url: 'https://pokeapi.co/api/v2/pokemon-species/172/',
    },
    evolves_to: [
      {
        evolution_details: [],
        species: {
          name: 'pikachu',
          url: 'https://pokeapi.co/api/v2/pokemon-species/25/',
        },
        evolves_to: [],
      },
    ],
  },
};

const staticAbility = {
  name: 'static',
  names: [{ language: { name: 'en' }, name: 'Static' }],
  flavor_text_entries: [
    { language: { name: 'en' }, flavor_text: 'Paralyzes on contact.' },
  ],
};

describe('getPokemonExtras', () => {
  beforeEach(() => {
    getType.mockResolvedValue(emptyRelations);
    getPokemonSpecies.mockResolvedValue(speciesPayload);
    getAbility.mockResolvedValue(staticAbility);
    getEvolutionChainByUrl.mockResolvedValue(chainPayload);
  });

  it('keeps matchups when the evolution chain fails', async () => {
    getEvolutionChainByUrl.mockRejectedValue(new Error('chain down'));

    const extras = await getPokemonExtras(pikachu);

    expect(extras.matchups.weaknesses).toContain('ground');
    expect(extras.abilities[0].id).toBe('static');
    expect(extras.evolution).toBeNull();
    expect(extras.error).toEqual(expect.any(Error));
  });

  it('keeps matchups and evolutions when one ability fails', async () => {
    getAbility.mockRejectedValue(new Error('ability down'));

    const extras = await getPokemonExtras(pikachu);

    expect(extras.matchups).not.toBeNull();
    expect(extras.evolution.total).toBe(2);
    expect(extras.abilities).toBeNull();
    expect(extras.error).toEqual(expect.any(Error));
  });

  it('keeps abilities when types fail', async () => {
    getType.mockRejectedValue(new Error('type down'));

    const extras = await getPokemonExtras(pikachu);

    expect(extras.matchups).toBeNull();
    expect(extras.abilities[0].id).toBe('static');
    expect(extras.evolution.total).toBe(2);
    expect(extras.error).toEqual(expect.any(Error));
  });
});
