import { fireEvent, render, screen } from '@testing-library/react-native';
import { PokemonCard } from './PokemonCard';

const pokemon = {
  id: 1,
  name: 'bulbasaur',
  image: 'https://img/1.png',
  types: ['grass', 'poison'],
  height: 7,
  weight: 69,
  stats: [{ stat: { name: 'hp' }, base_stat: 45 }],
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

  it('calls onPress when the frame is tapped', () => {
    const onPress = jest.fn();
    render(
      <PokemonCard pokemon={pokemon}>
        <PokemonCard.Frame onPress={onPress}>
          <PokemonCard.Name />
        </PokemonCard.Frame>
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
        <PokemonCard.Frame>
          <PokemonCard.Name />
        </PokemonCard.Frame>
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

  it('composes detail sections from context', () => {
    render(
      <PokemonCard pokemon={pokemon}>
        <PokemonCard.Identity />
        <PokemonCard.Stats />
        <PokemonCard.Dimensions />
      </PokemonCard>,
    );

    expect(screen.getByText('Stats')).toBeOnTheScreen();
    expect(screen.getByText('HP')).toBeOnTheScreen();
    expect(screen.getByText('Dimensions')).toBeOnTheScreen();
    expect(screen.getByText('~ 0.7 m')).toBeOnTheScreen();
    expect(screen.getByText('~ 6.9 kg')).toBeOnTheScreen();
  });

  it('renders immunities apart from resistances', () => {
    render(
      <PokemonCard
        pokemon={pokemon}
        matchups={{
          weaknesses: ['electric', 'rock', 'water'],
          resistances: ['bug', 'fire'],
          immunities: ['ground'],
        }}
      >
        <PokemonCard.Matchups />
      </PokemonCard>,
    );

    expect(screen.getByText('Weak to')).toBeOnTheScreen();
    expect(screen.getByText('Resistant to')).toBeOnTheScreen();
    expect(screen.getByText('Immune to')).toBeOnTheScreen();
    expect(screen.getByText('ground')).toBeOnTheScreen();
    expect(screen.queryByText('None')).toBeNull();
  });

  it('hides empty matchup and ability sections', () => {
    render(
      <PokemonCard
        pokemon={pokemon}
        matchups={{
          weaknesses: ['electric'],
          resistances: [],
          immunities: [],
        }}
        abilities={[]}
      >
        <PokemonCard.Matchups />
        <PokemonCard.Abilities />
      </PokemonCard>,
    );

    expect(screen.getByText('Weak to')).toBeOnTheScreen();
    expect(screen.getByText('electric')).toBeOnTheScreen();
    expect(screen.queryByText('Resistant to')).toBeNull();
    expect(screen.queryByText('Immune to')).toBeNull();
    expect(screen.queryByText('Abilities')).toBeNull();
    expect(screen.queryByText('None')).toBeNull();
  });

  it('keeps matchups visible when extras fail later', () => {
    render(
      <PokemonCard
        pokemon={pokemon}
        extrasFailed
        extrasError={{
          kind: 'unknown',
          title: 'Something went wrong',
          message: 'Could not load extra details.',
        }}
        matchups={{
          weaknesses: ['fire'],
          resistances: [],
          immunities: [],
        }}
        abilities={[{ id: 'overgrow', name: 'Overgrow', description: 'Boosts Grass.' }]}
      >
        <PokemonCard.Matchups />
        <PokemonCard.Abilities />
        <PokemonCard.Evolutions />
      </PokemonCard>,
    );

    expect(screen.getByText('Weak to')).toBeOnTheScreen();
    expect(screen.getByText('Overgrow')).toBeOnTheScreen();
    expect(screen.getByText('Could not load extra details.')).toBeOnTheScreen();
  });

  it('shows the offline banner only when the ficha came from cache', () => {
    const { rerender } = render(
      <PokemonCard pokemon={pokemon}>
        <PokemonCard.OfflineBanner />
      </PokemonCard>,
    );

    expect(screen.queryByText('Saved favorite · available offline')).toBeNull();

    rerender(
      <PokemonCard pokemon={pokemon} fromCache>
        <PokemonCard.OfflineBanner />
      </PokemonCard>,
    );

    expect(screen.getByText('Saved favorite · available offline')).toBeOnTheScreen();
  });
});
