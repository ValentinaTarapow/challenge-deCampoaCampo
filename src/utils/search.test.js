import { filterPokemonCatalog, matchesSearch } from './search';

const pikachu = { id: '25', name: 'pikachu' };
const nidoran = { id: 29, name: 'nidoran-f' };

describe('matchesSearch', () => {
  it('matches a partial name', () => {
    expect(matchesSearch(pikachu, 'pika')).toBe(true);
    expect(matchesSearch(pikachu, 'chu')).toBe(true);
    expect(matchesSearch(pikachu, 'char')).toBe(false);
  });

  it('is case-insensitive for names', () => {
    expect(matchesSearch({ id: 1, name: 'Bulbasaur' }, 'bulb')).toBe(true);
  });

  it('matches by pokedex id with #', () => {
    expect(matchesSearch(pikachu, '#25')).toBe(true);
    expect(matchesSearch(pikachu, '#025')).toBe(true);
    expect(matchesSearch(nidoran, '#29')).toBe(true);
    expect(matchesSearch(pikachu, '#1')).toBe(false);
  });

  it('rejects invalid id queries', () => {
    expect(matchesSearch(pikachu, '#')).toBe(false);
    expect(matchesSearch(pikachu, '#abc')).toBe(false);
  });
});

const catalog = [
  { id: '6', name: 'charizard' },
  { id: '10034', name: 'charizard-mega-x' },
  { id: '25', name: 'pikachu' },
  { id: '10194', name: 'pikachu-gmax' },
  { id: '10094', name: 'pikachu-alola-cap' },
  { id: '26', name: 'raichu' },
  { id: '10100', name: 'raichu-alola' },
  { id: '19', name: 'rattata' },
  { id: '10091', name: 'rattata-alola' },
];

describe('filterPokemonCatalog', () => {
  it('hides mega, gmax and cap forms from a name search', () => {
    expect(filterPokemonCatalog(catalog, { term: 'charizard' }).map((item) => item.name)).toEqual([
      'charizard',
    ]);
    expect(filterPokemonCatalog(catalog, { term: 'pikachu' }).map((item) => item.name)).toEqual([
      'pikachu',
    ]);
  });

  it('does not show regional forms until a region filter includes them', () => {
    expect(filterPokemonCatalog(catalog, { term: 'raichu' }).map((item) => item.name)).toEqual([
      'raichu',
    ]);
    expect(
      filterPokemonCatalog(catalog, {
        term: 'raichu',
        regionNames: new Set(['raichu-alola']),
      }).map((item) => item.name),
    ).toEqual(['raichu-alola']);
  });

  it('keeps default species when a type set is applied without a region', () => {
    expect(
      filterPokemonCatalog(catalog, {
        typeNames: new Set(['charizard', 'pikachu-gmax', 'raichu-alola']),
      }).map((item) => item.name),
    ).toEqual(['charizard']);
  });
});
