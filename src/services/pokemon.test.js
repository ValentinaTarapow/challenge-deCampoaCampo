import { apiClient } from './client';
import {
  expandRegionPokemonNames,
  getGenerationLabel,
  getPokemonByNameOrId,
  getPokemonIdFromUrl,
  getPokemonImageUrl,
  getPokemonList,
  getPokemonSpriteUrl,
  parseAbilityInfo,
  parseEvolutionStages,
  parseVarieties,
  pokemonNamesForRegions,
  isDefaultPokemon,
} from './pokemon';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn() },
}));

describe('pokemon helpers', () => {
  it('extracts an id from a PokeAPI url', () => {
    expect(
      getPokemonIdFromUrl('https://pokeapi.co/api/v2/pokemon/25/'),
    ).toBe('25');
  });

  it('treats national dex entries as default and 10000+ ids as extra forms', () => {
    expect(isDefaultPokemon({ id: 25 })).toBe(true);
    expect(isDefaultPokemon({ id: '474' })).toBe(true);
    expect(isDefaultPokemon({ id: 10091 })).toBe(false);
    expect(isDefaultPokemon({ id: '10194' })).toBe(false);
  });

  it('builds sprite and artwork urls', () => {
    expect(getPokemonSpriteUrl(25)).toContain('/sprites/pokemon/25.png');
    expect(getPokemonSpriteUrl(25, { shiny: true })).toContain(
      '/sprites/pokemon/shiny/25.png',
    );
    expect(getPokemonImageUrl(25)).toContain(
      '/official-artwork/25.png',
    );
  });

  it('labels a generation with its region', () => {
    expect(getGenerationLabel('generation-i')).toBe('Kanto (Gen I)');
    expect(getGenerationLabel('generation-ix')).toBe('Paldea (Gen IX)');
    expect(getGenerationLabel(null)).toBeNull();
  });

  it('maps regional dex species to catalog form names', () => {
    const catalog = [
      'rattata',
      'rattata-alola',
      'rowlet',
      'mr-mime',
      'mr-mime-galar',
      'growlithe',
      'growlithe-hisui',
      'tauros',
      'tauros-paldea-combat-breed',
      'pikachu',
      'pikachu-alola-cap',
    ];

    expect(
      [...expandRegionPokemonNames(['rattata', 'rowlet'], 'alola', catalog)].sort(),
    ).toEqual(['rattata-alola', 'rowlet']);
    expect(
      [...expandRegionPokemonNames(['mr-mime'], 'galar', catalog)],
    ).toEqual(['mr-mime-galar']);
    expect(
      [...expandRegionPokemonNames(['growlithe'], 'hisui', catalog)],
    ).toEqual(['growlithe-hisui']);
    expect(
      [...expandRegionPokemonNames(['tauros'], 'paldea', catalog)],
    ).toEqual(['tauros-paldea-combat-breed']);
    expect(
      [...expandRegionPokemonNames(['rattata'], 'kanto', catalog)],
    ).toEqual(['rattata']);
    expect(
      [...expandRegionPokemonNames(['pikachu'], 'alola', catalog)],
    ).toEqual(['pikachu']);
  });

  it('unions expanded names when several regions are selected', () => {
    const names = pokemonNamesForRegions(
      [
        { id: 'kanto', species: new Set(['rattata']) },
        { id: 'alola', species: new Set(['rattata']) },
      ],
      ['rattata', 'rattata-alola'],
    );

    expect([...names].sort()).toEqual(['rattata', 'rattata-alola']);
  });

  it('guesses the regional form name before the catalog loads', () => {
    expect([...expandRegionPokemonNames(['rattata'], 'alola', [])].sort()).toEqual(
      ['rattata', 'rattata-alola'],
    );
  });

  it('parses a linear evolution chain', () => {
    const result = parseEvolutionStages({
      species: {
        name: 'charmander',
        url: 'https://pokeapi.co/api/v2/pokemon-species/4/',
      },
      evolves_to: [
        {
          evolution_details: [],
          species: {
            name: 'charmeleon',
            url: 'https://pokeapi.co/api/v2/pokemon-species/5/',
          },
          evolves_to: [
            {
              evolution_details: [],
              species: {
                name: 'charizard',
                url: 'https://pokeapi.co/api/v2/pokemon-species/6/',
              },
              evolves_to: [],
            },
          ],
        },
      ],
    });

    expect(result.linear).toBe(true);
    expect(result.total).toBe(3);
    expect(result.stages.map((stage) => stage[0].name)).toEqual([
      'charmander',
      'charmeleon',
      'charizard',
    ]);
  });

  it('parses a branched evolution chain', () => {
    const result = parseEvolutionStages({
      species: {
        name: 'eevee',
        url: 'https://pokeapi.co/api/v2/pokemon-species/133/',
      },
      evolves_to: [
        {
          evolution_details: [],
          species: {
            name: 'vaporeon',
            url: 'https://pokeapi.co/api/v2/pokemon-species/134/',
          },
          evolves_to: [],
        },
        {
          evolution_details: [],
          species: {
            name: 'jolteon',
            url: 'https://pokeapi.co/api/v2/pokemon-species/135/',
          },
          evolves_to: [],
        },
      ],
    });

    expect(result.linear).toBe(false);
    expect(result.total).toBe(3);
    expect(result.stages[1].map((item) => item.name)).toEqual([
      'vaporeon',
      'jolteon',
    ]);
  });

  it('parses species varieties', () => {
    const varieties = parseVarieties({
      name: 'pikachu',
      varieties: [
        {
          is_default: true,
          pokemon: {
            name: 'pikachu',
            url: 'https://pokeapi.co/api/v2/pokemon/25/',
          },
        },
        {
          is_default: false,
          pokemon: {
            name: 'pikachu-gmax',
            url: 'https://pokeapi.co/api/v2/pokemon/10194/',
          },
        },
      ],
    });

    expect(varieties).toEqual([
      { id: '25', name: 'pikachu', label: 'pikachu' },
      { id: '10194', name: 'pikachu-gmax', label: 'gmax' },
    ]);
  });

  it('parses localized ability info', () => {
    expect(
      parseAbilityInfo({
        name: 'static',
        names: [{ language: { name: 'en' }, name: 'Static' }],
        flavor_text_entries: [
          { language: { name: 'en' }, flavor_text: 'Paralyzes  \non contact.' },
        ],
      }),
    ).toEqual({
      name: 'Static',
      description: 'Paralyzes on contact.',
    });
  });
});

describe('pokemon api', () => {
  it('requests a paginated list', async () => {
    apiClient.get.mockResolvedValue({
      data: { results: [{ name: 'bulbasaur' }], next: 'page-2' },
    });

    const data = await getPokemonList(24, 0);

    expect(apiClient.get).toHaveBeenCalledWith('/pokemon', {
      params: { limit: 24, offset: 0 },
    });
    expect(data.results[0].name).toBe('bulbasaur');
  });

  it('requests a Pokémon by name', async () => {
    apiClient.get.mockResolvedValue({ data: { id: 25, name: 'pikachu' } });

    await expect(getPokemonByNameOrId('pikachu')).resolves.toEqual({
      id: 25,
      name: 'pikachu',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/pokemon/pikachu');
  });
});
