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
    expect(result.resistances).toEqual(['steel']);
    expect(result.immunities).toEqual(['electric']);
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
    expect(result.resistances).toEqual([
      'bug',
      'fairy',
      'fighting',
      'fire',
      'grass',
      'steel',
    ]);
    expect(result.immunities).toEqual(['ground']);
  });

  it('sorts results alphabetically', () => {
    const result = computeTypeMatchups([
      payload({ double: ['water', 'electric'], half: ['steel', 'fire'] }),
    ]);
    expect(result.weaknesses).toEqual(['electric', 'water']);
    expect(result.resistances).toEqual(['fire', 'steel']);
    expect(result.immunities).toEqual([]);
  });

  it('sorts immunities separately from resistances (ghost)', () => {
    const result = computeTypeMatchups([
      payload({ half: ['poison', 'bug'], none: ['fighting', 'normal'] }),
    ]);
    expect(result.resistances).toEqual(['bug', 'poison']);
    expect(result.immunities).toEqual(['fighting', 'normal']);
  });
});
