import {
  buildDetail,
  collectImageUrls,
  hasFullPokemon,
  pickPokemon,
  toListItem,
} from './pokemonDetail';

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
