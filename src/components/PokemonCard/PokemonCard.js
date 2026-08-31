import { createContext, useContext, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

function PokemonCard({
  pokemon,
  onPress,
  children,
  style,
  isFavorite = false,
  onToggleFavorite,
}) {
  const value = useMemo(
    () => ({ pokemon, isFavorite, onToggleFavorite }),
    [pokemon, isFavorite, onToggleFavorite],
  );

  return (
    <PokemonCardContext.Provider value={value}>
      <View style={[styles.card, style]}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.cardPress, pressed && styles.cardPressed]}
        >
          {children}
        </Pressable>
        {onToggleFavorite ? (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={8}
            style={styles.favoriteBtn}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={16}
              color={isFavorite ? colors.primary : colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPress: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  cardPressed: {
    opacity: 0.85,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
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
