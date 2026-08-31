import { fireEvent, render, screen } from '@testing-library/react-native';
import { PokemonCard } from './PokemonCard';

const pokemon = {
  id: 1,
  name: 'bulbasaur',
  image: 'https://img/1.png',
  types: ['grass', 'poison'],
};

describe('PokemonCard', () => {
  it('renders the compound pieces', () => {
    render(
      <PokemonCard pokemon={pokemon}>
        <PokemonCard.Image />
        <PokemonCard.Content>
          <PokemonCard.Id />
          <PokemonCard.Name />
          <PokemonCard.Types />
        </PokemonCard.Content>
      </PokemonCard>,
    );

    expect(screen.getByText('#001')).toBeOnTheScreen();
    expect(screen.getByText('bulbasaur')).toBeOnTheScreen();
    expect(screen.getByText('grass')).toBeOnTheScreen();
    expect(screen.getByText('poison')).toBeOnTheScreen();
  });

  it('calls onPress when the card is tapped', () => {
    const onPress = jest.fn();
    render(
      <PokemonCard pokemon={pokemon} onPress={onPress}>
        <PokemonCard.Name />
      </PokemonCard>,
    );

    fireEvent.press(screen.getByText('bulbasaur'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('toggles favorites from the heart button', () => {
    const onToggleFavorite = jest.fn();
    render(
      <PokemonCard
        pokemon={pokemon}
        isFavorite
        onToggleFavorite={onToggleFavorite}
      >
        <PokemonCard.Name />
      </PokemonCard>,
    );

    fireEvent.press(screen.getByLabelText('Remove from favorites'));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('throws if a section is used outside the card', () => {
    expect(() => render(<PokemonCard.Name />)).toThrow(
      'PokemonCard.Name must be rendered inside <PokemonCard>.',
    );
  });
});
