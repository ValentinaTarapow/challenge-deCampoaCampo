import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getPokemonByNameOrId,
  getPokemonImageUrl,
  getPokemonSpriteUrl,
} from '../services/pokemon';
import { getPokemonExtras } from '../services/pokemonDetail';
import { ErrorState } from '../components/states';
import {
  AbilityBlockSkeleton,
  DetailScreenSkeleton,
  EvolutionRowSkeleton,
  TypeChipSkeleton,
} from '../components/Skeleton';
import { describeError } from '../services/errors';
import { RemoteImage } from '../components/PokemonCard';
import { TypeBadge } from '../components/TypeBadge';
import { GenerationBadge } from '../components/GenerationBadge';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { HeaderDropShadow } from '../components/HeaderDropShadow';
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

function typeName(item) {
  if (typeof item === 'string') return item;
  if (typeof item?.type === 'string') return item.type;
  if (typeof item?.type?.name === 'string') return item.type.name;
  if (typeof item?.name === 'string') return item.name;
  return null;
}

function TypeGroup({ types }) {
  const names = (types ?? []).map(typeName).filter(Boolean);

  if (!names.length) {
    return <Text style={styles.meta}>None</Text>;
  }

  return (
    <View style={styles.wrapRow}>
      {names.map((name) => (
        <View key={name} style={styles.wrapItem}>
          <TypeBadge type={name} />
        </View>
      ))}
    </View>
  );
}

function IconTip({
  open,
  tip,
  onPress,
  label,
  children,
  placement = 'above',
  compact = false,
}) {
  const below = placement === 'below';

  return (
    <View style={[styles.helpWrap, compact && styles.helpWrapCompact]}>
      {open ? (
        <View
          style={[
            styles.tooltipSlot,
            below ? styles.tooltipSlotBelow : styles.tooltipSlotAbove,
          ]}
          pointerEvents="none"
        >
          <View style={styles.tooltipBubble}>
            <Text style={styles.tooltipText}>{tip}</Text>
            <View
              style={[
                styles.tooltipArrow,
                below ? styles.tooltipArrowUp : styles.tooltipArrowDown,
              ]}
            />
          </View>
        </View>
      ) : null}
      <Pressable onPress={onPress} hitSlop={8} accessibilityLabel={label}>
        <View
          style={[
            styles.helpBtn,
            compact && styles.helpBtnCompact,
            open && styles.helpBtnOpen,
          ]}
        >
          {children}
        </View>
      </Pressable>
    </View>
  );
}

function ExtraFallback({ loaded, skeleton, children }) {
  if (loaded) return children;
  return skeleton;
}

function MatchupSection({
  title,
  tip,
  types,
  loaded,
  tipOpen,
  onToggleTip,
}) {
  return (
    <View style={[styles.section, tipOpen && styles.sectionRaised]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <IconTip
          open={tipOpen}
          tip={tip}
          onPress={onToggleTip}
          label={`What ${title} means`}
          compact
        >
          <Text style={[styles.helpBtnText, tipOpen && styles.helpBtnTextOpen]}>
            ?
          </Text>
        </IconTip>
      </View>
      <ExtraFallback
        loaded={loaded}
        skeleton={
          <View style={styles.wrapRow}>
            <View style={styles.wrapItem}>
              <TypeChipSkeleton />
            </View>
            <View style={styles.wrapItem}>
              <TypeChipSkeleton />
            </View>
            <View style={styles.wrapItem}>
              <TypeChipSkeleton />
            </View>
          </View>
        }
      >
        <TypeGroup types={types} />
      </ExtraFallback>
    </View>
  );
}

function EvolutionNode({ pokemon, currentName, onPress, shiny }) {
  const isCurrent = pokemon.name === currentName;
  const content = (
    <>
      <RemoteImage source={getPokemonSpriteUrl(pokemon.id, { shiny })} size={64} />
      <Text style={styles.evoName} numberOfLines={1}>
        {pokemon.name}
      </Text>
      {pokemon.gender ? (
        <Text
          style={[
            styles.evoGender,
            pokemon.gender === 'female' ? styles.evoGenderFemale : styles.evoGenderMale,
          ]}
        >
          {pokemon.gender === 'female' ? '♀ Female' : '♂ Male'}
        </Text>
      ) : null}
    </>
  );

  if (isCurrent) {
    return <View style={[styles.evoNode, styles.evoNodeCurrent]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => onPress(pokemon)}
      style={({ pressed }) => [styles.evoNode, pressed && styles.evoNodePressed]}
    >
      {content}
    </Pressable>
  );
}

function FormCard({ pokemon, currentName, onPress, shiny }) {
  const isCurrent = pokemon.name === currentName;
  const content = (
    <>
      <RemoteImage source={getPokemonSpriteUrl(pokemon.id, { shiny })} size={52} />
      <Text style={styles.formName} numberOfLines={2}>
        {pokemon.label}
      </Text>
    </>
  );

  if (isCurrent) {
    return <View style={[styles.formCard, styles.formCardCurrent]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => onPress(pokemon)}
      style={({ pressed }) => [styles.formCard, pressed && styles.evoNodePressed]}
    >
      {content}
    </Pressable>
  );
}

function FormsModal({ visible, varieties, currentName, onClose, onPress, shiny }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.formsHeader}>
            <Text style={styles.sectionTitle}>All forms</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel="Close forms"
              style={styles.modalClose}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formsGrid}
          >
            {varieties.map((item) => (
              <FormCard
                key={item.id}
                pokemon={item}
                currentName={currentName}
                onPress={onPress}
                shiny={shiny}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FormsSection({ varieties, currentName, onPress, onSeeAll, shiny }) {
  if (!varieties || varieties.length <= 1) return null;

  const ordered = [
    ...varieties.filter((item) => item.name === currentName),
    ...varieties.filter((item) => item.name !== currentName),
  ];

  return (
    <View style={styles.section}>
      <View style={styles.formsHeader}>
        <Text style={styles.sectionTitle}>Forms</Text>
        <Pressable
          onPress={onSeeAll}
          hitSlop={8}
          accessibilityLabel="See all forms"
          style={styles.formsSeeAll}
        >
          <Text style={styles.formsCount}>{varieties.length}</Text>
          <Text style={styles.formsSeeAllText}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.formsRow}
        style={styles.formsScroller}
      >
        {ordered.map((item) => (
          <FormCard
            key={item.id}
            pokemon={item}
            currentName={currentName}
            onPress={onPress}
            shiny={shiny}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const EVO_BRANCH_COLS = 3;

function EvolutionStageNodes({ stage, currentName, onPress, shiny }) {
  return (
    <View style={stage.length > 1 ? styles.evoBranch : undefined}>
      {stage.map((item) => (
        <EvolutionNode
          key={item.id}
          pokemon={item}
          currentName={currentName}
          onPress={onPress}
          shiny={shiny}
        />
      ))}
    </View>
  );
}

function EvolutionSection({ stages, total, currentName, onPress, shiny }) {
  if (!stages) {
    return <EvolutionRowSkeleton />;
  }

  if (total <= 1) {
    return <Text style={styles.meta}>This Pokémon does not evolve</Text>;
  }

  const branched = stages.some((stage) => stage.length > 1);

  if (branched) {
    return (
      <View style={styles.evoTreeBranched}>
        {stages.map((stage, index) => (
          <View key={stage.map((item) => item.id).join('-')} style={styles.evoTreeItemBranched}>
            {index > 0 ? <Text style={styles.evoArrowDown}>↓</Text> : null}
            <EvolutionStageNodes
              stage={stage}
              currentName={currentName}
              onPress={onPress}
              shiny={shiny}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.evoTree}>
      {stages.map((stage, index) => (
        <View key={stage.map((item) => item.id).join('-')} style={styles.evoTreeItem}>
          {index > 0 ? <Text style={styles.evoArrow}>→</Text> : null}
          <EvolutionStageNodes
            stage={stage}
            currentName={currentName}
            onPress={onPress}
            shiny={shiny}
          />
        </View>
      ))}
    </View>
  );
}

export default function DetailScreen({ route, navigation }) {
  const { nameOrId, id: paramId } = route.params;
  const { isFavorite, toggleFavorite, getFavorite, persistFavoriteDetail } =
    useFavorites();
  const [pokemon, setPokemon] = useState(null);
  const [matchups, setMatchups] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [varieties, setVarieties] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [abilities, setAbilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extrasError, setExtrasError] = useState(null);
  const [extrasRetry, setExtrasRetry] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [showWeaknessTip, setShowWeaknessTip] = useState(false);
  const [showResistanceTip, setShowResistanceTip] = useState(false);
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [shiny, setShiny] = useState(false);

  const applySnapshot = useCallback((detail) => {
    setPokemon(detail.pokemon);
    setMatchups(detail.matchups);
    setGeneration(detail.generation);
    setVarieties(detail.varieties);
    setEvolution(detail.evolution);
    setAbilities(detail.abilities);
  }, []);

  const load = useCallback(async () => {
    const cached = getFavorite(paramId) || getFavorite(nameOrId);
    const detail = cached?.detail;

    setError(null);
    setExtrasError(null);
    setShowWeaknessTip(false);
    setShowResistanceTip(false);
    setShowFormsModal(false);

    if (detail?.pokemon) {
      applySnapshot(detail);
      setFromCache(true);
      setLoading(false);
    } else {
      setPokemon(null);
      setMatchups(null);
      setEvolution(null);
      setVarieties(null);
      setGeneration(null);
      setAbilities(null);
      setFromCache(false);
      setLoading(true);
    }

    try {
      const data = await getPokemonByNameOrId(nameOrId);
      setPokemon(data);
      setFromCache(false);
    } catch (err) {
      if (!detail?.pokemon) {
        setPokemon(null);
        setError(describeError(err, 'detail', { query: nameOrId }));
      }
    } finally {
      setLoading(false);
    }
  }, [applySnapshot, getFavorite, nameOrId, paramId]);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    const id = pokemon?.id ?? paramId;
    const name = pokemon?.name ?? String(nameOrId);
    const favorited = id != null && isFavorite(id);
    navigation.setOptions({
      title: '',
      headerTitleAlign: 'center',
      headerTitle: () => (
        <View style={styles.headerBadge}>
          {id != null ? (
            <Text style={styles.headerId}>
              #{String(id).padStart(3, '0')}
            </Text>
          ) : null}
          <Text style={styles.headerName} numberOfLines={1}>
            {name}
          </Text>
        </View>
      ),
      headerRight: () =>
        id != null ? (
          <Pressable
            onPress={() =>
              toggleFavorite(
                pokemon ?? {
                  id,
                  name,
                  image: getPokemonSpriteUrl(id),
                },
              )
            }
            hitSlop={8}
            style={styles.headerFavBtn}
            accessibilityRole="button"
            accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <MaterialCommunityIcons
              name={favorited ? 'heart' : 'heart-outline'}
              size={22}
              color={colors.primary}
            />
          </Pressable>
        ) : null,
    });
  }, [navigation, pokemon, nameOrId, paramId, isFavorite, toggleFavorite]);

  useEffect(() => {
    if (!pokemon) return undefined;
    let cancelled = false;

    async function loadExtras() {
      try {
        setExtrasError(null);
        const extras = await getPokemonExtras(pokemon);
        if (cancelled) return;
        setMatchups(extras.matchups);
        setGeneration(extras.generation);
        setVarieties(extras.varieties);
        setAbilities(extras.abilities);
        setEvolution(extras.evolution);
      } catch (err) {
        if (!cancelled) {
          setExtrasError(describeError(err, 'extras'));
        }
      }
    }

    loadExtras();
    return () => {
      cancelled = true;
    };
  }, [pokemon, extrasRetry]);

  useEffect(() => {
    if (fromCache || !pokemon) return;
    persistFavoriteDetail({
      pokemon,
      matchups,
      generation,
      varieties,
      evolution,
      abilities,
    });
  }, [
    fromCache,
    pokemon,
    matchups,
    generation,
    varieties,
    evolution,
    abilities,
    persistFavoriteDetail,
  ]);

  const openPokemon = useCallback(
    (item) => {
      navigation.push('Detail', { nameOrId: item.name, id: item.id });
    },
    [navigation],
  );

  const retryExtras = () => setExtrasRetry((n) => n + 1);
  const extrasFailed =
    Boolean(extrasError) && !matchups && abilities == null && evolution == null;

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailScreenSkeleton />
        <HeaderDropShadow />
      </View>
    );
  }

  if (error || !pokemon) {
    const display =
      error ||
      describeError({ response: { status: 404 } }, 'detail', { query: nameOrId });
    return (
      <View style={styles.container}>
        <ErrorState
          kind={display.kind}
          title={display.title}
          message={display.message}
          onRetry={load}
        />
        <HeaderDropShadow />
      </View>
    );
  }

  const types = (pokemon.types ?? []).map(typeName).filter(Boolean);
  const stats = pokemon.stats ?? [];
  const image = getPokemonImageUrl(pokemon.id, { shiny });
  const heightM = (pokemon.height / 10).toFixed(1);
  const weightKg = (pokemon.weight / 10).toFixed(1);
  const closeTips = () => {
    setShowWeaknessTip(false);
    setShowResistanceTip(false);
  };
  const anyTipOpen = showWeaknessTip || showResistanceTip;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onScrollBeginDrag={closeTips}
        keyboardShouldPersistTaps="handled"
      >
      {fromCache ? (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={14}
            color={colors.textMuted}
          />
          <Text style={styles.offlineText}>Saved favorite · available offline</Text>
        </View>
      ) : null}
      <View style={styles.hero}>
        {generation ? (
          <View style={styles.generationBadgeWrap}>
            <GenerationBadge generation={generation} />
          </View>
        ) : null}
        <Pressable
          onPress={() => setShiny((on) => !on)}
          style={[styles.shinyBtn, shiny && styles.shinyBtnOn]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={shiny ? 'Show default sprite' : 'Show shiny sprite'}
        >
          <MaterialCommunityIcons
            name={shiny ? 'star-four-points' : 'star-four-points-outline'}
            size={18}
            color={shiny ? colors.pokedex.yellow : colors.textMuted}
          />
        </Pressable>
        <RemoteImage source={image} size={168} />
        <Text style={styles.nameLine}>
          <Text style={styles.id}>#{String(pokemon.id).padStart(3, '0')} </Text>
          <Text style={styles.name}>{pokemon.name}</Text>
        </Text>
        <View style={styles.typesRow}>
          {types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </View>
      </View>

      {extrasFailed ? (
        <View style={styles.section}>
          <ErrorState
            compact
            kind={extrasError.kind}
            title={extrasError.title}
            message={extrasError.message}
            onRetry={retryExtras}
          />
        </View>
      ) : (
        <>
          <MatchupSection
            title="Weak to"
            tip="These types deal extra damage. An attack of one of these types hits this Pokémon harder."
            types={matchups?.weaknesses}
            loaded={Boolean(matchups)}
            tipOpen={showWeaknessTip}
            onToggleTip={() => {
              setShowResistanceTip(false);
              setShowWeaknessTip((open) => !open);
            }}
          />

          <MatchupSection
            title="Resistant to"
            tip="These types deal less damage. An attack of one of these types hits this Pokémon weaker."
            types={matchups?.resistances}
            loaded={Boolean(matchups)}
            tipOpen={showResistanceTip}
            onToggleTip={() => {
              setShowWeaknessTip(false);
              setShowResistanceTip((open) => !open);
            }}
          />
        </>
      )}

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

      {extrasFailed ? null : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abilities</Text>
          <ExtraFallback
            loaded={abilities != null}
            skeleton={<AbilityBlockSkeleton />}
          >
            {abilities?.length ? (
              abilities.map((ability) => (
                <View key={ability.id} style={styles.abilityItem}>
                  <Text style={styles.abilityName}>{ability.name}</Text>
                  <Text style={styles.abilityText}>
                    {ability.description || 'No description'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.meta}>None</Text>
            )}
          </ExtraFallback>
        </View>
      )}

      {extrasFailed ? null : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evolutions</Text>
          <EvolutionSection
            stages={evolution?.stages}
            total={evolution?.total}
            currentName={pokemon.species?.name ?? pokemon.name}
            onPress={openPokemon}
            shiny={shiny}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dimensions</Text>
        <View style={styles.dimensionRow}>
          <Text style={styles.dimensionLabel}>Height</Text>
          <Text style={styles.dimensionValue}>~ {heightM} m</Text>
        </View>
        <View style={styles.dimensionRow}>
          <Text style={styles.dimensionLabel}>Weight</Text>
          <Text style={styles.dimensionValue}>~ {weightKg} kg</Text>
        </View>
      </View>

      {varieties && varieties.length > 1 ? (
        <FormsSection
          varieties={varieties}
          currentName={pokemon.name}
          onPress={openPokemon}
          onSeeAll={() => {
            closeTips();
            setShowFormsModal(true);
          }}
          shiny={shiny}
        />
      ) : null}
    </ScrollView>
      {anyTipOpen ? (
        <Pressable
          collapsable={false}
          style={styles.dismissLayer}
          onPress={closeTips}
          accessibilityLabel="Dismiss tooltip"
        />
      ) : null}
      <FormsModal
        visible={showFormsModal}
        varieties={varieties ?? []}
        currentName={pokemon.name}
        onClose={() => setShowFormsModal(false)}
        onPress={(item) => {
          setShowFormsModal(false);
          openPokemon(item);
        }}
        shiny={shiny}
      />
      <HeaderDropShadow />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    paddingTop: 38,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'visible',
  },
  generationBadgeWrap: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    maxWidth: '70%',
  },
  shinyBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shinyBtnOn: {
    borderColor: colors.pokedex.yellow,
    backgroundColor: '#FFF6D6',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  headerId: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  headerName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  headerFavBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  nameLine: {
    marginTop: 6,
    textAlign: 'center',
  },
  id: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
  },
  typesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
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
    width: 28,
    height: 28,
    zIndex: 3,
    overflow: 'visible',
  },
  helpWrapCompact: {
    width: 22,
    height: 22,
  },
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
  tooltipSlot: {
    position: 'absolute',
    width: 220,
    zIndex: 10,
    elevation: 8,
  },
  tooltipSlotAbove: {
    right: -8,
    bottom: 28,
    alignItems: 'flex-end',
  },
  tooltipSlotBelow: {
    left: -8,
    top: 36,
    alignItems: 'flex-start',
  },
  tooltipBubble: {
    backgroundColor: colors.text,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tooltipArrow: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: colors.text,
    transform: [{ rotate: '45deg' }],
  },
  tooltipArrowDown: {
    right: 12,
    bottom: -5,
  },
  tooltipArrowUp: {
    left: 12,
    top: -5,
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
    margin: -4,
  },
  wrapItem: {
    margin: 4,
  },
  abilityItem: {
    gap: 4,
    paddingTop: 4,
  },
  abilityName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  abilityText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
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
  evoTree: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evoTreeBranched: {
    alignItems: 'center',
    gap: 4,
  },
  evoTreeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evoTreeItemBranched: {
    alignItems: 'center',
  },
  evoArrow: {
    marginHorizontal: 6,
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  evoArrowDown: {
    marginVertical: 2,
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  evoBranch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 84 * EVO_BRANCH_COLS + 8 * (EVO_BRANCH_COLS - 1),
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
  evoGender: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
  },
  evoGenderMale: {
    color: '#3B82F6',
  },
  evoGenderFemale: {
    color: '#EC4899',
  },
  formsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  formsSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formsSeeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    maxHeight: '80%',
    gap: 12,
    zIndex: 1,
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  formsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  formsScroller: {
    marginHorizontal: -16,
  },
  formsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  formCard: {
    width: 76,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.imageBackground,
  },
  formCardCurrent: {
    borderColor: colors.primary,
  },
  formName: {
    marginTop: 4,
    minHeight: 28,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  dimensionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  dimensionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
