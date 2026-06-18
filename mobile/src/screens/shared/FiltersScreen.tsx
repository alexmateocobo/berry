import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { Chip } from '../../components/Chip';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionHeader } from '../../components/SectionHeader';
import { MOCK_EVENTS } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Filters'>;

type PriceFilter = 'any' | 'free' | 'paid';
type WhenFilter = 'today' | 'week' | 'weekend' | 'anytime';

const CATEGORIES = Array.from(new Set(MOCK_EVENTS.flatMap((event) => event.categories))).sort();

const PRICE_OPTIONS: { key: PriceFilter; label: string }[] = [
  { key: 'any', label: 'Any price' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
];

const WHEN_OPTIONS: { key: WhenFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'anytime', label: 'Anytime' },
];

export function FiltersScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<string[]>([]);
  const [price, setPrice] = useState<PriceFilter>('any');
  const [when, setWhen] = useState<WhenFilter>('anytime');

  const toggleCategory = (category: string) => {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  };

  const reset = () => {
    setCategories([]);
    setPrice('any');
    setWhen('anytime');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Filters</Text>
      <Text style={styles.subtitle}>Narrow down what shows up on Home and Discover</Text>

      <SectionHeader title="Category" />
      <View style={styles.chipRow}>
        {CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={category}
            selected={categories.includes(category)}
            onPress={() => toggleCategory(category)}
          />
        ))}
      </View>

      <SectionHeader title="Price" />
      <View style={styles.chipRow}>
        {PRICE_OPTIONS.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            selected={price === option.key}
            onPress={() => setPrice(option.key)}
          />
        ))}
      </View>

      <SectionHeader title="When" />
      <View style={styles.chipRow}>
        {WHEN_OPTIONS.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            selected={when === option.key}
            onPress={() => setWhen(option.key)}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AppButton label="Reset" variant="outline" onPress={reset} />
        </View>
        <View style={styles.actionButton}>
          <AppButton label="Apply filters" variant="accent" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1 },
});
