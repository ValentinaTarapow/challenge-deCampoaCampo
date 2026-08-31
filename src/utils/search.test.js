import { matchesSearch } from './search';

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
