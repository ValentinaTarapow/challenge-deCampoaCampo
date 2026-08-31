import { memo } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { PokemonCard } from './PokemonCard';

export const PokemonGridItem = memo(function PokemonGridItem({
  item,
  cardWidth,
  onPress,
}) {
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <PokemonCard
      pokemon={item}
      style={{ width: cardWidth }}
      onPress={() => onPress(item)}
      isFavorite={isFavorite(item.id)}
      onToggleFavorite={() => toggleFavorite(item)}
    >
      <PokemonCard.Image size={cardWidth - 24} />
      <PokemonCard.Content>
        <PokemonCard.Id />
        <PokemonCard.Name />
      </PokemonCard.Content>
    </PokemonCard>
  );
});
