import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventCard } from '../../components/EventCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { MY_EVENTS, getEventById } from '../../data';
import type { EventItem } from '../../data';
import { colors, radii, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'MyEvents'>;

type Filter = 'going' | 'interested';

export function MyEventsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>('going');

  const eventIds = filter === 'going' ? MY_EVENTS.going : MY_EVENTS.interested;
  const events = eventIds.map((id) => getEventById(id)).filter((event): event is EventItem => Boolean(event));

  return (
    <ScreenContainer>
      <Text style={styles.title}>My Events</Text>
      <Text style={styles.subtitle}>Events you're going to or interested in</Text>

      <View style={styles.toggleRow}>
        <ToggleButton
          label={`Going (${MY_EVENTS.going.length})`}
          active={filter === 'going'}
          onPress={() => setFilter('going')}
        />
        <ToggleButton
          label={`Interested (${MY_EVENTS.interested.length})`}
          active={filter === 'interested'}
          onPress={() => setFilter('interested')}
        />
      </View>

      {events.length ? (
        <View style={styles.list}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>
          {filter === 'going' ? "You're not going to any events yet." : 'Nothing marked as interested yet.'}
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
  list: { gap: spacing.md },
  empty: { ...typography.body, color: colors.textMuted },
});
