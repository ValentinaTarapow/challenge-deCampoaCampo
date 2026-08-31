import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getEvolutionChainByUrl,
  getPokemonByNameOrId,
  getPokemonImageUrl,
  getPokemonSpecies,
  getPokemonSpriteUrl,
  getType,
  parseEvolutionStages,
} from '../services/pokemon';
import { computeTypeMatchups } from '../services/matchups';
import { LoadingState, ErrorState } from '../components/states';
import { RemoteImage } from '../components/PokemonCard';
import { TypeBadge } from '../components/TypeBadge';
import { GenerationBadge } from '../components/GenerationBadge';
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

function TypeGroup({ types }) {
  if (!types?.length) {
    return <Text style={styles.meta}>Ninguno</Text>;
  }

  return (
    <View style={styles.wrapRow}>
      {types.map((type) => (
        <TypeBadge key={type} type={type} />
      ))}
    </View>
  );
}

function MatchupSection({ title, tip, types, loaded, tipOpen, onToggleTip }) {
  return (
    <View style={[styles.section, tipOpen && styles.sectionRaised]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.helpWrap}>
          {tipOpen ? (
            <View style={styles.tooltip} pointerEvents="none">
              <Text style={styles.tooltipText}>{tip}</Text>
              <View style={styles.tooltipArrow} />
            </View>
          ) : null}
          <Pressable
            onPress={onToggleTip}
            hitSlop={8}
            accessibilityLabel={`Qué significa ${title}`}
          >
            <View style={[styles.helpBtn, tipOpen && styles.helpBtnOpen]}>
              <Text style={[styles.helpBtnText, tipOpen && styles.helpBtnTextOpen]}>
                ?
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
      {loaded ? (
        <TypeGroup types={types} />
      ) : (
        <ActivityIndicator color={colors.primary} />
      )}
    </View>
  );
}

function EvolutionNode({ pokemon, currentName, onPress }) {
  const isCurrent = pokemon.name === currentName;
  const content = (
    <>
      <RemoteImage source={getPokemonSpriteUrl(pokemon.id)} size={64} />
      <Text style={styles.evoName} numberOfLines={1}>
        {pokemon.name}
      </Text>
    </>
  );

  if (isCurrent) {
    return <View style={[styles.evoNode, styles.evoNodeCurrent]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => onPress(pokemon.name)}
      style={({ pressed }) => [styles.evoNode, pressed && styles.evoNodePressed]}
    >
      {content}
    </Pressable>
  );
}

function EvolutionSection({ stages, linear, total, currentName, onPress }) {
  if (!stages) {
    return <ActivityIndicator color={colors.primary} />;
  }

  if (total <= 1) {
    return <Text style={styles.meta}>Este Pokémon no evoluciona</Text>;
  }

  if (linear) {
    return (
      <View style={styles.evoLinear}>
        {stages.map((stage, index) => (
          <View key={stage[0].id} style={styles.evoLinearItem}>
            {index > 0 ? <Text style={styles.evoArrow}>→</Text> : null}
            <EvolutionNode
              pokemon={stage[0]}
              currentName={currentName}
              onPress={onPress}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.evoTree}>
      {stages.map((stage, index) => (
        <View key={stage.map((item) => item.id).join('-')}>
          {index > 0 ? <Text style={styles.evoDown}>↓</Text> : null}
          <View style={styles.evoBranch}>
            {stage.map((item) => (
              <EvolutionNode
                key={item.id}
                pokemon={item}
                currentName={currentName}
                onPress={onPress}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function DetailScreen({ route, navigation }) {
  const { nameOrId } = route.params;
  const [pokemon, setPokemon] = useState(null);
  const [matchups, setMatchups] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWeaknessTip, setShowWeaknessTip] = useState(false);
  const [showResistanceTip, setShowResistanceTip] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMatchups(null);
      setEvolution(null);
      setGeneration(null);
      setShowWeaknessTip(false);
      setShowResistanceTip(false);
      const data = await getPokemonByNameOrId(nameOrId);
      setPokemon(data);
    } catch (err) {
      setPokemon(null);
      setError(err.message || 'No se pudo cargar el detalle');
    } finally {
      setLoading(false);
    }
  }, [nameOrId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!pokemon) return undefined;
    let cancelled = false;

    async function loadExtras() {
      try {
        const typeNames = pokemon.types.map((entry) => entry.type.name);
        const [typePayloads, species] = await Promise.all([
          Promise.all(typeNames.map(getType)),
          getPokemonSpecies(pokemon.id),
        ]);
        if (cancelled) return;
        setMatchups(computeTypeMatchups(typePayloads));
        setGeneration(species.generation?.name ?? null);
        const chain = await getEvolutionChainByUrl(species.evolution_chain.url);
        if (cancelled) return;
        setEvolution(parseEvolutionStages(chain.chain));
      } catch {
        if (!cancelled) {
          setMatchups((prev) => prev ?? { weaknesses: [], resistances: [] });
          setEvolution((prev) => prev ?? { stages: [], linear: true, total: 0 });
        }
      }
    }

    loadExtras();
    return () => {
      cancelled = true;
    };
  }, [pokemon]);

  const openPokemon = useCallback(
    (name) => {
      navigation.push('Detail', { nameOrId: name });
    },
    [navigation],
  );

  if (loading) {
    return <LoadingState message="Cargando detalle..." />;
  }

  if (error || !pokemon) {
    return <ErrorState message={error || 'No encontrado'} onRetry={load} />;
  }

  const types = pokemon.types.map((entry) => entry.type.name);
  const stats = pokemon.stats;
  const image = getPokemonImageUrl(pokemon.id);
  const abilities = pokemon.abilities ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {generation ? (
          <View style={styles.generationBadgeWrap}>
            <GenerationBadge generation={generation} />
          </View>
        ) : null}
        <RemoteImage source={image} size={180} />
        <Text style={styles.id}>#{String(pokemon.id).padStart(3, '0')}</Text>
        <Text style={styles.name}>{pokemon.name}</Text>
        <View style={styles.typesRow}>
          {types.map((type) => (
            <TypeBadge key={type} type={type} />
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
        <Text style={styles.sectionTitle}>Habilidades</Text>
        {abilities.map((entry) => (
          <View key={entry.ability.name} style={styles.abilityRow}>
            <Text style={styles.abilityName}>
              {entry.ability.name.replace(/-/g, ' ')}
            </Text>
            {entry.is_hidden ? (
              <Text style={styles.abilityHidden}>Oculta</Text>
            ) : null}
          </View>
        ))}
      </View>

      <MatchupSection
        title="Debilidad a"
        tip="Estos tipos le hacen más daño. Un ataque de alguno de ellos golpea más fuerte a este Pokémon."
        types={matchups?.weaknesses}
        loaded={Boolean(matchups)}
        tipOpen={showWeaknessTip}
        onToggleTip={() => setShowWeaknessTip((open) => !open)}
      />

      <MatchupSection
        title="Resistencia a"
        tip="Estos tipos le hacen menos daño. Un ataque de alguno de ellos golpea más débil a este Pokémon."
        types={matchups?.resistances}
        loaded={Boolean(matchups)}
        tipOpen={showResistanceTip}
        onToggleTip={() => setShowResistanceTip((open) => !open)}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evoluciones</Text>
        <EvolutionSection
          stages={evolution?.stages}
          linear={evolution?.linear}
          total={evolution?.total}
          currentName={pokemon.name}
          onPress={openPokemon}
        />
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
  generationBadgeWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
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
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    overflow: 'visible',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionRaised: {
    zIndex: 4,
    elevation: 8,
    overflow: 'visible',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    overflow: 'visible',
  },
  helpWrap: {
    position: 'relative',
    width: 22,
    height: 22,
    zIndex: 3,
    overflow: 'visible',
  },
  helpBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnOpen: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  helpBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  helpBtnTextOpen: {
    color: '#fff',
  },
  tooltip: {
    position: 'absolute',
    right: -8,
    bottom: 30,
    width: 228,
    backgroundColor: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tooltipArrow: {
    position: 'absolute',
    right: 12,
    bottom: -5,
    width: 10,
    height: 10,
    backgroundColor: colors.text,
    transform: [{ rotate: '45deg' }],
  },
  tooltipText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 15,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  abilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  abilityName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  abilityHidden: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
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
  evoLinear: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evoLinearItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evoArrow: {
    marginHorizontal: 4,
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  evoDown: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 16,
    marginVertical: 6,
  },
  evoTree: {
    gap: 4,
  },
  evoBranch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  evoNode: {
    width: 84,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  evoNodeCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  evoNodePressed: {
    opacity: 0.75,
  },
  evoName: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
});
