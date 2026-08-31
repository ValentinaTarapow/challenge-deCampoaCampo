import { isDefaultPokemon } from '../services/pokemon';

export function matchesSearch(item, term) {
  if (term.startsWith('#')) {
    const digits = term.slice(1);
    if (!digits || !/^\d+$/.test(digits)) return false;
    return String(Number(item.id)) === String(Number(digits));
  }

  return item.name.toLowerCase().includes(term);
}

export function filterPokemonCatalog(
  catalog,
  { term = '', typeNames = null, regionNames = null } = {},
) {
  const query = term.trim().toLowerCase();
  return catalog.filter((item) => {
    if (typeNames && !typeNames.has(item.name)) return false;
    if (regionNames && !regionNames.has(item.name)) return false;
    if (!isDefaultPokemon(item) && !regionNames?.has(item.name)) return false;
    if (query && !matchesSearch(item, query)) return false;
    return true;
  });
}
