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
import { POKEMON_TYPES, REGIONS } from '../services/pokemon';
import { colors, onColor } from '../theme/colors';

export const EMPTY_FILTERS = {
  regions: [],
  types: [],
};

export function createEmptyFilters() {
  return { regions: [], types: [] };
}

function asList(value) {
  const list = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  return [...new Set(list)];
}

export function normalizeFilters(filters) {
  return {
    regions: asList(filters?.regions ?? filters?.region),
    types: asList(filters?.types ?? filters?.type),
  };
}

export function countActiveFilters(filters) {
  const next = normalizeFilters(filters);
  return next.regions.length + next.types.length;
}

function Chip({ label, selected, color, onPress }) {
  const backgroundColor = selected ? color || colors.primary : colors.background;
  const borderColor = selected ? backgroundColor : colors.border;
  const textColor = selected ? onColor(backgroundColor) : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor, borderColor }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
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
  const [draft, setDraft] = useState(() => normalizeFilters(value));

  useEffect(() => {
    if (visible) setDraft(normalizeFilters(value));
  }, [visible, value]);

  const toggleMany = (key, id) => {
    setDraft((prev) => {
      const list = prev[key] ?? [];
      const next = list.includes(id)
        ? list.filter((item) => item !== id)
        : [...list, id];
      return { ...prev, [key]: next };
    });
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
                  label={region.filterLabel}
                  selected={draft.regions.includes(region.id)}
                  color={colors.generations[region.generation]}
                  onPress={() => toggleMany('regions', region.id)}
                />
              ))}
            </Section>

            <Section title="Type">
              {POKEMON_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  selected={draft.types.includes(type)}
                  color={colors.types[type]}
                  onPress={() => toggleMany('types', type)}
                />
              ))}
            </Section>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => setDraft(createEmptyFilters())}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear filters"
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <Pressable
              onPress={() => onApply(normalizeFilters(draft))}
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
