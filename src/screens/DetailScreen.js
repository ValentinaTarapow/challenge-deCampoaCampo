import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getPokemonByNameOrId,
  getPokemonImageUrl,
} from '../services/pokemon';
import { LoadingState, ErrorState } from '../components/PokemonCard';
import RemoteImage from '../components/PokemonCard/RemoteImage';
import { colors } from '../theme/colors';

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
        {stats.map((stat) => (
          <View key={stat.stat.name} style={styles.statRow}>
            <Text style={styles.statName}>{stat.stat.name}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min(stat.base_stat, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.statValue}>{stat.base_stat}</Text>
          </View>
        ))}
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
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statName: {
    width: 90,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  statValue: {
    width: 32,
    textAlign: 'right',
    fontWeight: '700',
    color: colors.text,
  },
});
