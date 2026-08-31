import { colors } from '../theme/colors';

const ALL_TYPES = Object.keys(colors.types);

export function computeTypeMatchups(typePayloads) {
  const multipliers = Object.fromEntries(ALL_TYPES.map((type) => [type, 1]));

  typePayloads.forEach((payload) => {
    const { double_damage_from, half_damage_from, no_damage_from } =
      payload.damage_relations;
    double_damage_from.forEach(({ name }) => {
      if (name in multipliers) multipliers[name] *= 2;
    });
    half_damage_from.forEach(({ name }) => {
      if (name in multipliers) multipliers[name] *= 0.5;
    });
    no_damage_from.forEach(({ name }) => {
      if (name in multipliers) multipliers[name] *= 0;
    });
  });

  const weaknesses = [];
  const resistances = [];

  Object.entries(multipliers).forEach(([type, multiplier]) => {
    if (multiplier > 1) weaknesses.push(type);
    if (multiplier < 1) resistances.push(type);
  });

  weaknesses.sort();
  resistances.sort();

  return { weaknesses, resistances };
}
