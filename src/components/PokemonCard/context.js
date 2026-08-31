import { createContext, useContext } from 'react';

export const PokemonCardContext = createContext(null);

export function usePokemonCard(sectionName) {
  const context = useContext(PokemonCardContext);
  if (!context) {
    throw new Error(`${sectionName} must be rendered inside <PokemonCard>.`);
  }
  return context;
}
