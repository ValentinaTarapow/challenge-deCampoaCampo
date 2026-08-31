import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  GENERATIONS,
  POKEMON_TYPES,
  REGIONS,
  isCompatibleRegionGeneration,
} from '../services/pokemon';
import { colors, onColor } from '../theme/colors';

export const EMPTY_FILTERS = {
  region: null,
  generation: null,
  type: null,
};

export function countActiveFilters(filters) {
  return [filters?.region, filters?.generation, filters?.type].filter(Boolean)
    .length;
}

function sanitizeFilters(filters) {
  const next = { ...EMPTY_FILTERS, ...filters };
  if (isCompatibleRegionGeneration(next.region, next.generation)) return next;
  return { ...next, region: null };
}

function Chip({ label, selected, color, disabled, onPress }) {
  const backgroundColor = selected ? color || colors.primary : colors.background;
  const borderColor = selected ? backgroundColor : colors.border;
  const textColor = selected ? onColor(backgroundColor) : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        { backgroundColor, borderColor },
        disabled && styles.chipDisabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

export function FilterSheet({ visible, value, onApply, onClose }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value ?? EMPTY_FILTERS);

  useEffect(() => {
    if (visible) setDraft(sanitizeFilters(value ?? EMPTY_FILTERS));
  }, [visible, value]);

  const toggle = (key, id) => {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key] === id ? null : id,
    }));
  };

  const activeCount = countActiveFilters(draft);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel="Close filters"
              style={styles.close}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            <Section title="Region">
              {REGIONS.map((region) => (
                <Chip
                  key={region.id}
                  label={region.label}
                  selected={draft.region === region.id}
                  disabled={
                    !isCompatibleRegionGeneration(region.id, draft.generation)
                  }
                  onPress={() => toggle('region', region.id)}
                />
              ))}
            </Section>

            <Section title="Generation">
              {GENERATIONS.map((generation) => (
                <Chip
                  key={generation.id}
                  label={generation.label}
                  selected={draft.generation === generation.id}
                  color={colors.generations[generation.id]}
                  disabled={
                    !isCompatibleRegionGeneration(draft.region, generation.id)
                  }
                  onPress={() => toggle('generation', generation.id)}
                />
              ))}
            </Section>

            <Section title="Type">
              {POKEMON_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  selected={draft.type === type}
                  color={colors.types[type]}
                  onPress={() => toggle('type', type)}
                />
              ))}
            </Section>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => setDraft(EMPTY_FILTERS)}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear filters"
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <Pressable
              onPress={() => onApply(sanitizeFilters(draft))}
              style={styles.applyBtn}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
            >
              <Text style={styles.applyText}>
                {activeCount ? `Apply (${activeCount})` : 'Apply'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  body: {
    gap: 16,
    paddingBottom: 8,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  applyBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  applyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
