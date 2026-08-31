import { computeTypeMatchups } from './matchups';

function payload({ double = [], half = [], none = [] }) {
  return {
    damage_relations: {
      double_damage_from: double.map((name) => ({ name })),
      half_damage_from: half.map((name) => ({ name })),
      no_damage_from: none.map((name) => ({ name })),
    },
  };
}

describe('computeTypeMatchups', () => {
  it('marks a single-type weakness and resistance', () => {
    const result = computeTypeMatchups([
      payload({ double: ['ground'], half: ['steel'], none: ['electric'] }),
    ]);

    expect(result.weaknesses).toEqual(['ground']);
    expect(result.resistances).toEqual(['electric', 'steel']);
  });

  it('combines dual types (fire / flying)', () => {
    const result = computeTypeMatchups([
      payload({
        double: ['water', 'ground', 'rock'],
        half: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
      }),
      payload({
        double: ['electric', 'ice', 'rock'],
        half: ['grass', 'fighting', 'bug'],
        none: ['ground'],
      }),
    ]);

    expect(result.weaknesses).toEqual(['electric', 'rock', 'water']);
    expect(result.resistances).toContain('ground');
    expect(result.resistances).toContain('grass');
    expect(result.resistances).toContain('bug');
    expect(result.weaknesses).not.toContain('ice');
    expect(result.weaknesses).not.toContain('ground');
  });

  it('sorts results alphabetically', () => {
    const result = computeTypeMatchups([
      payload({ double: ['water', 'electric'], half: ['steel', 'fire'] }),
    ]);
    expect(result.weaknesses).toEqual(['electric', 'water']);
    expect(result.resistances).toEqual(['fire', 'steel']);
  });
});
