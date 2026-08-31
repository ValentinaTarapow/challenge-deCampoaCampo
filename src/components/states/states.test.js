import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState, ErrorState, LoadingState } from './index';

describe('UI states', () => {
  it('shows a loading message', () => {
    render(<LoadingState message="Loading more Pokémon..." />);
    expect(screen.getByText('Loading more Pokémon...')).toBeOnTheScreen();
    expect(screen.getByLabelText('Loading more Pokémon...')).toBeOnTheScreen();
  });

  it('shows a specific error and retries', () => {
    const onRetry = jest.fn();
    render(
      <ErrorState
        kind="offline"
        title="You're offline"
        message="Check your connection and try again."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("You're offline")).toBeOnTheScreen();
    expect(
      screen.getByText('Check your connection and try again.'),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows an empty collection message', () => {
    render(
      <EmptyState
        icon="heart-outline"
        title="No favorites yet"
        message="Tap the heart on a Pokémon to save it here."
      />,
    );

    expect(screen.getByText('No favorites yet')).toBeOnTheScreen();
    expect(
      screen.getByText('Tap the heart on a Pokémon to save it here.'),
    ).toBeOnTheScreen();
  });
});
