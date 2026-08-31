import { createContext, useCallback, useContext, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import RemoteImage from './RemoteImage';
import { TypeBadge } from '../TypeBadge';

const PokemonCardContext = createContext(null);

function usePokemonCard(sectionName) {
  const context = useContext(PokemonCardContext);
  if (!context) {
    throw new Error(`${sectionName} must be rendered inside <PokemonCard>.`);
  }
  return context;
}

function PokemonCard({ pokemon, onPress, children, style }) {
  const value = useMemo(() => ({ pokemon }), [pokemon]);
  const pressableStyle = useCallback(
    ({ pressed }) => [styles.card, pressed && styles.cardPressed, style],
    [style],
  );

  return (
    <PokemonCardContext.Provider value={value}>
      <Pressable onPress={onPress} style={pressableStyle}>
        {children}
      </Pressable>
    </PokemonCardContext.Provider>
  );
}

function ImageSection({ style, size = 80 }) {
  const { pokemon } = usePokemonCard('PokemonCard.Image');
  return (
    <RemoteImage
      source={pokemon.image}
      size={size}
      style={style}
    />
  );
}

function Name({ style, numberOfLines = 1 }) {
  const { pokemon } = usePokemonCard('PokemonCard.Name');
  return (
    <Text style={[styles.name, style]} numberOfLines={numberOfLines}>
      {pokemon.name}
    </Text>
  );
}

function Id({ style }) {
  const { pokemon } = usePokemonCard('PokemonCard.Id');
  const id = String(pokemon.id).padStart(3, '0');
  return <Text style={[styles.id, style]}>#{id}</Text>;
}

function Types({ style }) {
  const { pokemon } = usePokemonCard('PokemonCard.Types');
  if (!pokemon.types?.length) return null;

  return (
    <View style={[styles.typesRow, style]}>
      {pokemon.types.map((type) => (
        <TypeBadge key={type} type={type} />
      ))}
    </View>
  );
}

function Content({ children, style }) {
  usePokemonCard('PokemonCard.Content');
  return <View style={[styles.content, style]}>{children}</View>;
}

PokemonCard.Image = ImageSection;
PokemonCard.Name = Name;
PokemonCard.Id = Id;
PokemonCard.Types = Types;
PokemonCard.Content = Content;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.85,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  id: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
});

export { PokemonCard };
