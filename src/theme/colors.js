export const colors = {
  background: '#EAF4F9',
  imageBackground: '#F6FBFD',
  surface: '#FFFFFF',
  safeBottom: '#EAF4F9',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  primary: '#EF5350',
  border: '#E5E7EB',
  skeleton: '#D5E0E8',
  pokedex: {
    red: '#DC0A2D',
    redDeep: '#C00828',
    redShadow: '#8B061C',
    lens: '#3BAAF5',
    lensDeep: '#1A7ED1',
    silver: '#F3F6F8',
    chrome: '#C5CDD3',
    yellow: '#F7D02C',
  },
  generations: {
    'generation-i': '#C03028',
    'generation-ii': '#C9A227',
    'generation-iii': '#4A90D9',
    'generation-iv': '#5BA8C9',
    'generation-v': '#4B5563',
    'generation-vi': '#E3350D',
    'generation-vii': '#F5A623',
    'generation-viii': '#6C5CE7',
    'generation-ix': '#E63946',
    hisui: '#C17A3A',
  },
  types: {
    normal: '#A0A29F',
    fighting: '#D3425F',
    flying: '#A1BBEC',
    poison: '#B763CF',
    ground: '#DA7C4D',
    rock: '#C9BB8A',
    bug: '#92BC2C',
    ghost: '#5F6DBC',
    steel: '#5695A3',
    fire: '#FBA54C',
    water: '#539DDF',
    grass: '#5FBD58',
    electric: '#F2D94E',
    psychic: '#FA8581',
    ice: '#75D0C1',
    dragon: '#0C69C8',
    dark: '#6E7587',
    fairy: '#EE90E6',
  },
  statTiers: {
    veryLow: '#F34444',
    low: '#FF7F0F',
    medium: '#FFDD57',
    good: '#A0E515',
    high: '#23CD5E',
    veryHigh: '#00C2B8',
  },
};

export function onColor(hex) {
  const raw = hex.replace('#', '');
  const normalized =
    raw.length === 3 ? raw.split('').map((ch) => ch + ch).join('') : raw;
  const n = parseInt(normalized, 16);
  const toLinear = (value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const L =
    0.2126 * toLinear((n >> 16) & 255) +
    0.7152 * toLinear((n >> 8) & 255) +
    0.0722 * toLinear(n & 255);
  const contrastWhite = 1.05 / (L + 0.05);
  const contrastBlack = (L + 0.05) / 0.05;
  return contrastBlack > contrastWhite ? colors.text : '#FFFFFF';
}
