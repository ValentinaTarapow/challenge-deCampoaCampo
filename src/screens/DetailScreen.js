import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getPokemonByNameOrId,
  getPokemonImageUrl,
} from '../services/pokemon';
import { LoadingState, ErrorState } from '../components/states';
import { RemoteImage } from '../components/PokemonCard';
import { colors } from '../theme/colors';

const STAT_MAX = 255;
const STAT_SEGMENTS = 15;

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

function colorForStat(value) {
  if (value < 30) return colors.statTiers.veryLow;
  if (value < 60) return colors.statTiers.low;
  if (value < 90) return colors.statTiers.medium;
  if (value < 120) return colors.statTiers.good;
  if (value < 150) return colors.statTiers.high;
  return colors.statTiers.veryHigh;
}

function StatRow({ name, value }) {
  const filled = Math.round((value / STAT_MAX) * STAT_SEGMENTS);
  const color = colorForStat(value);
  const label = STAT_LABELS[name] || name;

  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <View style={styles.dotRow}>
        {Array.from({ length: STAT_SEGMENTS }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < filled ? { backgroundColor: color } : styles.dotEmpty,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function DetailScreen({ route }) {
  const { nameOrId } = route.params;
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPokemonByNameOrId(nameOrId);
      setPokemon(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [nameOrId]);

  if (loading) {
    return <LoadingState message="Cargando detalle..." />;
  }

  if (error || !pokemon) {
    return <ErrorState message={error || 'No encontrado'} onRetry={load} />;
  }

  const types = pokemon.types.map((entry) => entry.type.name);
  const stats = pokemon.stats;
  const image = getPokemonImageUrl(pokemon.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <RemoteImage source={image} size={180} />
        <Text style={styles.id}>#{String(pokemon.id).padStart(3, '0')}</Text>
        <Text style={styles.name}>{pokemon.name}</Text>
        <View style={styles.typesRow}>
          {types.map((type) => (
            <View
              key={type}
              style={[
                styles.typeBadge,
                { backgroundColor: colors.types[type] || colors.textMuted },
              ]}
            >
              <Text style={styles.typeText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Info</Text>
        <Text style={styles.meta}>
          Altura: {pokemon.height / 10} m · Peso: {pokemon.weight / 10} kg
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsList}>
          {stats.map((stat) => (
            <StatRow
              key={stat.stat.name}
              name={stat.stat.name}
              value={stat.base_stat}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  id: {
    marginTop: 8,
    color: colors.textMuted,
    fontWeight: '700',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
  },
  typesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeText: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 15,
  },
  statsList: {
    gap: 10,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statLabel: {
    width: 64,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  statValue: {
    width: 28,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  dotRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  dotEmpty: {
    backgroundColor: colors.border,
  },
});
