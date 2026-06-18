import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventCard } from '../../components/EventCard';
import { ListRow } from '../../components/ListRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { FOLLOWS, FOLLOW_REQUESTS, GROUPS, MOCK_EVENTS } from '../../data';
import { colors, radii, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Search'>;

type Tab = 'events' | 'people' | 'groups';

const ALL_USERS = [...FOLLOWS, ...FOLLOW_REQUESTS];

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('events');

  const normalized = query.trim().toLowerCase();

  const events = useMemo(() => {
    if (!normalized) return MOCK_EVENTS;
    return MOCK_EVENTS.filter((event) =>
      [event.title, event.venue.name ?? '', ...event.tags, ...event.categories]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [normalized]);

  const people = useMemo(() => {
    if (!normalized) return ALL_USERS;
    return ALL_USERS.filter((user) => `${user.name} ${user.handle}`.toLowerCase().includes(normalized));
  }, [normalized]);

  const groups = useMemo(() => {
    if (!normalized) return GROUPS;
    return GROUPS.filter((group) => group.name.toLowerCase().includes(normalized));
  }, [normalized]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Search</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search events, people, groups"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabRow}>
        <TabButton label={`Events (${events.length})`} active={tab === 'events'} onPress={() => setTab('events')} />
        <TabButton label={`People (${people.length})`} active={tab === 'people'} onPress={() => setTab('people')} />
        <TabButton label={`Groups (${groups.length})`} active={tab === 'groups'} onPress={() => setTab('groups')} />
      </View>

      {tab === 'events' ? (
        events.length ? (
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
          <Text style={styles.empty}>No events match "{query}".</Text>
        )
      ) : null}

      {tab === 'people' ? (
        people.length ? (
          <View style={styles.list}>
            {people.map((user) => (
              <ListRow
                key={user.id}
                avatarLabel={user.name}
                title={user.name}
                subtitle={user.handle}
                onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
                trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>No people match "{query}".</Text>
        )
      ) : null}

      {tab === 'groups' ? (
        groups.length ? (
          <View style={styles.list}>
            {groups.map((group) => (
              <ListRow
                key={group.id}
                avatarLabel={group.name}
                title={group.name}
                subtitle={`${group.memberIds.length} members · ${group.eventIds.length} events`}
                onPress={() => navigation.navigate('GroupPage', { groupId: group.id })}
                trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>No groups match "{query}".</Text>
        )
      ) : null}
    </ScreenContainer>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.pill, padding: 4 },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.background },
  tabText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  tabTextActive: { color: colors.text },
  list: { gap: spacing.md },
  empty: { ...typography.body, color: colors.textMuted },
});
