import {
  countActiveFilters,
  createEmptyFilters,
  normalizeFilters,
} from './FilterSheet';

describe('filter helpers', () => {
  it('creates empty filters', () => {
    expect(createEmptyFilters()).toEqual({ regions: [], types: [] });
  });

  it('normalizes singular keys and removes duplicates', () => {
    expect(
      normalizeFilters({
        region: 'kanto',
        type: ['fire', 'fire', 'water'],
      }),
    ).toEqual({
      regions: ['kanto'],
      types: ['fire', 'water'],
    });
  });

  it('counts active region and type filters', () => {
    expect(countActiveFilters({ regions: ['kanto', 'johto'], types: ['fire'] })).toBe(
      3,
    );
    expect(countActiveFilters({})).toBe(0);
  });
});
