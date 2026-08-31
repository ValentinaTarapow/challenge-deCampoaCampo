export function matchesSearch(item, term) {
  if (term.startsWith('#')) {
    const digits = term.slice(1);
    if (!digits || !/^\d+$/.test(digits)) return false;
    return String(Number(item.id)) === String(Number(digits));
  }

  return item.name.toLowerCase().includes(term);
}
