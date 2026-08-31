import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { getPokemonImageUrl } from '../../services/pokemon';
import RemoteImage from './RemoteImage';
import { TypeBadge } from '../TypeBadge';
import { usePokemonCard } from './context';

export function Frame({ children, onPress, style }) {
  const { isFavorite, onToggleFavorite } = usePokemonCard('PokemonCard.Frame');

  return (
    <View style={[styles.card, style]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
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
  );
}

export function ImageSection({ style, size = 80, artwork = false }) {
  const { pokemon, shiny } = usePokemonCard('PokemonCard.Image');
  const source = artwork
    ? getPokemonImageUrl(pokemon.id, { shiny })
    : pokemon.image;

  return <RemoteImage source={source} size={size} style={style} />;
}

export function Name({ style, numberOfLines = 1 }) {
  const { pokemon } = usePokemonCard('PokemonCard.Name');
  return (
    <Text style={[styles.name, style]} numberOfLines={numberOfLines}>
      {pokemon.name}
    </Text>
  );
}

export function Id({ style }) {
  const { pokemon } = usePokemonCard('PokemonCard.Id');
  const id = String(pokemon.id).padStart(3, '0');
  return <Text style={[styles.id, style]}>#{id}</Text>;
}

function typeName(item) {
  if (typeof item === 'string') return item;
  if (typeof item?.type === 'string') return item.type;
  if (typeof item?.type?.name === 'string') return item.type.name;
  if (typeof item?.name === 'string') return item.name;
  return null;
}

export function Types({ style }) {
  const { pokemon } = usePokemonCard('PokemonCard.Types');
  const names = (pokemon.types ?? []).map(typeName).filter(Boolean);
  if (!names.length) return null;

  return (
    <View style={[styles.typesRow, style]}>
      {names.map((type) => (
        <TypeBadge key={type} type={type} />
      ))}
    </View>
  );
}

export function Content({ children, style }) {
  usePokemonCard('PokemonCard.Content');
  return <View style={[styles.content, style]}>{children}</View>;
}

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
