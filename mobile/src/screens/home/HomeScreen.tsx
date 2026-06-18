import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventCard } from '../../components/EventCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionHeader } from '../../components/SectionHeader';
import { GROUPS, MOCK_EVENTS } from '../../data';
import { colors, radii, spacing, typography } from '../../theme';
import { formatDayLabel, toIsoDate } from '../../utils/format';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;

type Audience = 'forYou' | 'friends';

const DAYS = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return date;
});

const FRIENDS_EVENT_IDS = new Set(GROUPS.flatMap((group) => group.eventIds));

export function HomeScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(DAYS[0]);
  const [audience, setAudience] = useState<Audience>('forYou');

  const eventsPool = useMemo(
    () => (audience === 'forYou' ? MOCK_EVENTS : MOCK_EVENTS.filter((event) => FRIENDS_EVENT_IDS.has(event.id))),
    [audience],
  );

  const selectedIso = toIsoDate(selectedDate);
  const eventsForDay = eventsPool.filter((event) => event.start_date === selectedIso);

  return (
    <ScreenContainer>
      <View>
        <Text style={styles.title}>Munich</Text>
        <Text style={styles.subtitle}>What's happening around you</Text>
      </View>

      <View style={styles.toggleRow}>
        <ToggleButton label="For You" active={audience === 'forYou'} onPress={() => setAudience('forYou')} />
        <ToggleButton label="Friends" active={audience === 'friends'} onPress={() => setAudience('friends')} />
      </View>

      <View style={styles.calendarRow}>
        {DAYS.map((date) => {
          const iso = toIsoDate(date);
          const { weekday, day } = formatDayLabel(date);
          const hasEvents = eventsPool.some((event) => event.start_date === iso);
          const isSelected = iso === selectedIso;
          return (
            <Pressable
              key={iso}
              onPress={() => setSelectedDate(date)}
              style={[styles.dayChip, isSelected && styles.dayChipSelected]}
            >
              <Text style={[styles.dayWeekday, isSelected && styles.dayTextSelected]}>{weekday}</Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>{day}</Text>
              {hasEvents ? <View style={[styles.dot, isSelected && styles.dotSelected]} /> : null}
            </Pressable>
          );
        })}
      </View>

      <SectionHeader
        title="Today's events"
        actionLabel="Filters"
        onPressAction={() => navigation.navigate('Filters')}
      />

      {eventsForDay.length ? (
        <View style={styles.list}>
          {eventsForDay.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>
          {audience === 'friends'
            ? 'None of your friends have plans on this day yet.'
            : 'Nothing scheduled for this day yet.'}
        </Text>
      )}
    </ScreenContainer>
  );
}

function ToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleActive]}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  toggleRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.pill, padding: 4 },
  toggle: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.background },
  toggleText: { ...typography.label, color: colors.textMuted },
  toggleTextActive: { color: colors.text },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.md,
    minWidth: 40,
  },
  dayChipSelected: { backgroundColor: colors.primary },
  dayWeekday: { ...typography.caption, color: colors.textMuted },
  dayNumber: { ...typography.label, color: colors.text },
  dayTextSelected: { color: colors.onPrimary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  dotSelected: { backgroundColor: colors.onPrimary },
  list: { gap: spacing.md },
  empty: { ...typography.body, color: colors.textMuted },
});
