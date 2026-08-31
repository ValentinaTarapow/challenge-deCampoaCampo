import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  countActiveFilters,
  createEmptyFilters,
  FilterSheet,
  normalizeFilters,
} from './FilterSheet';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderSheet(props = {}) {
  const onApply = props.onApply ?? jest.fn();
  const onClose = props.onClose ?? jest.fn();

  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <FilterSheet
        visible
        value={{}}
        onApply={onApply}
        onClose={onClose}
        {...props}
      />
    </SafeAreaProvider>,
  );
}

describe('filter helpers', () => {
  it('creates empty filters', () => {
    expect(createEmptyFilters()).toEqual({ regions: [], types: [] });
  });

  it('normalizes singular keys and removes duplicates', () => {
    expect(
      normalizeFilters({
        region: 'kanto',
        type: ['fire', 'fire', 'water'],
      }),
    ).toEqual({
      regions: ['kanto'],
      types: ['fire', 'water'],
    });
  });

  it('counts active region and type filters', () => {
    expect(countActiveFilters({ regions: ['kanto', 'johto'], types: ['fire'] })).toBe(
      3,
    );
    expect(countActiveFilters({})).toBe(0);
  });
});

describe('FilterSheet', () => {
  it('renders region and type chips with Clear and Apply', () => {
    renderSheet();

    expect(screen.getByText('Filters')).toBeOnTheScreen();
    expect(screen.getByText('Region')).toBeOnTheScreen();
    expect(screen.getByText('Type')).toBeOnTheScreen();
    expect(screen.getByText('Kanto (Gen I)')).toBeOnTheScreen();
    expect(screen.getByText('Galar (Gen VIII)')).toBeOnTheScreen();
    expect(screen.getByText('Hisui (Gen VIII)')).toBeOnTheScreen();
    expect(screen.getByText('Paldea (Gen IX)')).toBeOnTheScreen();
    expect(screen.getByText('fire')).toBeOnTheScreen();
    expect(screen.getByText('fairy')).toBeOnTheScreen();
    expect(screen.getByLabelText('Clear filters')).toBeOnTheScreen();
    expect(screen.getByLabelText('Apply filters')).toBeOnTheScreen();
    expect(screen.getByText('Apply')).toBeOnTheScreen();
  });

  it('applies selected region and type chips', () => {
    const onApply = jest.fn();
    renderSheet({ onApply });

    fireEvent.press(screen.getByText('Kanto (Gen I)'));
    fireEvent.press(screen.getByText('fire'));

    expect(screen.getByText('Apply (2)')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('Apply filters'));

    expect(onApply).toHaveBeenCalledWith({
      regions: ['kanto'],
      types: ['fire'],
    });
  });

  it('clears the draft before apply', () => {
    const onApply = jest.fn();
    renderSheet({
      onApply,
      value: { regions: ['kanto'], types: ['fire'] },
    });

    expect(screen.getByText('Apply (2)')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('Clear filters'));
    expect(screen.getByText('Apply')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Apply filters'));
    expect(onApply).toHaveBeenCalledWith({ regions: [], types: [] });
  });

  it('closes from the header button', () => {
    const onClose = jest.fn();
    renderSheet({ onClose });

    fireEvent.press(screen.getByLabelText('Close filters'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
